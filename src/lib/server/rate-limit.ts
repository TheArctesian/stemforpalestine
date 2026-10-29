import { eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { rateLimits } from '$lib/server/db/schema';

export type Limit = { max: number; windowMs: number };

export type LimitState = { count: number; limited: boolean; retryAfterMs: number };

function toState(row: { count: number; windowStart: Date } | undefined, limit: Limit): LimitState {
	if (!row) return { count: 0, limited: false, retryAfterMs: 0 };
	const resetsAt = row.windowStart.getTime() + limit.windowMs;
	if (resetsAt <= Date.now()) return { count: 0, limited: false, retryAfterMs: 0 };
	return { count: row.count, limited: row.count >= limit.max, retryAfterMs: resetsAt - Date.now() };
}

/** Current state without counting anything. */
export async function peek(key: string, limit: Limit): Promise<LimitState> {
	const [row] = await db.select().from(rateLimits).where(eq(rateLimits.key, key));
	return toState(row, limit);
}

/** Counts one hit, starting a fresh window if the old one has expired. Atomic. */
export async function hit(key: string, limit: Limit): Promise<LimitState> {
	const expired = sql`${rateLimits.windowStart} < now() - make_interval(secs => ${limit.windowMs / 1000})`;
	const [row] = await db
		.insert(rateLimits)
		.values({ key, count: 1 })
		.onConflictDoUpdate({
			target: rateLimits.key,
			set: {
				count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
				windowStart: sql`case when ${expired} then now() else ${rateLimits.windowStart} end`
			}
		})
		.returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });
	// `limited` here means this hit went over the limit.
	const state = toState(row, limit);
	return { ...state, limited: state.count > limit.max };
}

export async function reset(key: string): Promise<void> {
	await db.delete(rateLimits).where(eq(rateLimits.key, key));
}
