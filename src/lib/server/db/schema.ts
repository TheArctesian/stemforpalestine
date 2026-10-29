import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
