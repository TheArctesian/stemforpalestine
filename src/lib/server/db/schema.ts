import {
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
	uuid
} from 'drizzle-orm/pg-core';
import type { Answers, Rule } from '$lib/forms/conditions';
import type { Ending, Field } from '$lib/forms/definition';

const timestamps = {
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
};

/** `admin` can manage everything. `member` accounts exist for the upcoming member platform. */
export const userRole = pgEnum('user_role', ['admin', 'member']);
export const userStatus = pgEnum('user_status', ['active', 'disabled']);

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	/** Always stored lowercase, so logins are case-insensitive. */
	username: text('username').notNull().unique(),
	displayName: text('display_name').notNull(),
	email: text('email').unique(),
	passwordHash: text('password_hash').notNull(),
	role: userRole('role').notNull().default('member'),
	status: userStatus('status').notNull().default('active'),
	lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
	...timestamps
});

export const sessions = pgTable(
	'sessions',
	{
		/** SHA-256 of the cookie token, so a database leak doesn't hand out live sessions. */
		id: text('id').primaryKey(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [index('sessions_user_id_idx').on(t.userId)]
);

/** Fixed-window counters for rate limiting, keyed like `login:ip:<hash>`. */
export const rateLimits = pgTable('rate_limits', {
	key: text('key').primaryKey(),
	count: integer('count').notNull().default(0),
	windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow()
});

export const formStatus = pgEnum('form_status', ['draft', 'open', 'closed']);

/** A form built in the admin. Its questions live in `fields`; see $lib/forms/definition.ts. */
export const forms = pgTable('forms', {
	id: uuid('id').primaryKey().defaultRandom(),
	/** Public address: /forms/<slug>. */
	slug: text('slug').notNull().unique(),
	title: text('title').notNull(),
	status: formStatus('status').notNull().default('draft'),
	submitLabel: text('submit_label').notNull().default('Submit'),
	closedMessage: text('closed_message').notNull().default(''),
	/** Which email question is the submitter's address (for the mailing list). */
	emailFieldId: text('email_field_id'),
	fields: jsonb('fields').$type<Field[]>().notNull().default([]),
	endings: jsonb('endings').$type<Ending[]>().notNull().default([]),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
	updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
	...timestamps
});

export const submissionSource = pgEnum('submission_source', ['web', 'import']);

export type SubmissionMetadata = {
	userAgent?: string;
	referrer?: string;
	ipHash?: string;
	/** Row number in the CSV, for imported submissions. */
	importRow?: number;
};

export const formSubmissions = pgTable(
	'form_submissions',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		formId: uuid('form_id')
			.notNull()
			.references(() => forms.id, { onDelete: 'cascade' }),
		/** Answers keyed by field id (not key), so renaming a key keeps old answers attached. */
		data: jsonb('data').$type<Answers>().notNull(),
		/** The submitter's address, lowercased, copied out of `data` for the mailing list. */
		email: text('email'),
		source: submissionSource('source').notNull().default('web'),
		metadata: jsonb('metadata').$type<SubmissionMetadata>().notNull().default({}),
		submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		index('form_submissions_form_id_submitted_at_idx').on(t.formId, t.submittedAt),
		index('form_submissions_email_idx').on(t.email)
	]
);

export const emailTemplates = pgTable('email_templates', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	/** Can use {{placeholders}} too. */
	subject: text('subject').notNull(),
	html: text('html').notNull().default(''),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
	updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
	...timestamps
});

/** Which forms' answers a template's {{placeholders}} come from, and who it can be sent to. */
export const emailTemplateForms = pgTable(
	'email_template_forms',
	{
		templateId: uuid('template_id')
			.notNull()
			.references(() => emailTemplates.id, { onDelete: 'cascade' }),
		formId: uuid('form_id')
			.notNull()
			.references(() => forms.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.templateId, t.formId] })]
);

/** Who a campaign goes to: submissions of these forms whose answers match the rules (by field key). */
export type Audience = {
	formIds: string[];
	match: 'all' | 'any';
	rules: Rule[];
	/** Addresses taken off by hand in the preview. */
	excludedEmails: string[];
};

export const campaignStatus = pgEnum('campaign_status', ['draft', 'sending', 'sent', 'cancelled']);

export const emailCampaigns = pgTable('email_campaigns', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name').notNull(),
	templateId: uuid('template_id').references(() => emailTemplates.id, { onDelete: 'set null' }),
	/** Copied from the template when the campaign is made, so later edits don't change it. */
	subject: text('subject').notNull(),
	html: text('html').notNull(),
	audience: jsonb('audience').$type<Audience>().notNull(),
	status: campaignStatus('status').notNull().default('draft'),
	recipientCount: integer('recipient_count').notNull().default(0),
	sentCount: integer('sent_count').notNull().default(0),
	failedCount: integer('failed_count').notNull().default(0),
	createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
	startedAt: timestamp('started_at', { withTimezone: true }),
	completedAt: timestamp('completed_at', { withTimezone: true }),
	...timestamps
});

export const messageStatus = pgEnum('email_message_status', [
	'queued',
	'sending',
	'sent',
	'failed',
	'bounced',
	'complained'
]);

/** One recipient of a campaign. The unique index means nobody gets the same campaign twice. */
export const emailMessages = pgTable(
	'email_messages',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		campaignId: uuid('campaign_id')
			.notNull()
			.references(() => emailCampaigns.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		submissionId: uuid('submission_id').references(() => formSubmissions.id, {
			onDelete: 'set null'
		}),
		formId: uuid('form_id').references(() => forms.id, { onDelete: 'set null' }),
		/** Placeholder values, fixed when the campaign starts. */
		vars: jsonb('vars').$type<Record<string, string>>().notNull(),
		status: messageStatus('status').notNull().default('queued'),
		providerId: text('provider_id'),
		error: text('error'),
		attempts: integer('attempts').notNull().default(0),
		/** When a send request claimed it; a claim older than a few minutes is abandoned. */
		lockedAt: timestamp('locked_at', { withTimezone: true }),
		sentAt: timestamp('sent_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [
		uniqueIndex('email_messages_campaign_email_idx').on(t.campaignId, t.email),
		index('email_messages_campaign_status_idx').on(t.campaignId, t.status),
		index('email_messages_provider_id_idx').on(t.providerId)
	]
);

export const suppressionReason = pgEnum('suppression_reason', [
	'unsubscribed',
	'bounced',
	'complained',
	'manual'
]);

/** Addresses no campaign will ever send to again. */
export const emailSuppressions = pgTable('email_suppressions', {
	email: text('email').primaryKey(),
	reason: suppressionReason('reason').notNull(),
	campaignId: uuid('campaign_id').references(() => emailCampaigns.id, { onDelete: 'set null' }),
	note: text('note'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type EmailMessage = typeof emailMessages.$inferSelect;
