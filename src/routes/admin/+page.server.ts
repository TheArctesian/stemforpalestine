import { count, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [{ activeUsers }] = await db
		.select({ activeUsers: count() })
		.from(users)
		.where(eq(users.status, 'active'));
	return { stats: { activeUsers } };
};
