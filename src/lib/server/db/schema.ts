import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { Answers } from '$lib/forms/conditions';
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

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Form = typeof forms.$inferSelect;
export type FormSubmission = typeof formSubmissions.$inferSelect;
