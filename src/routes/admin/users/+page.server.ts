import { asc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: users.id,
			username: users.username,
			displayName: users.displayName,
			email: users.email,
			role: users.role,
			status: users.status,
			lastLoginAt: users.lastLoginAt
		})
		.from(users)
		.orderBy(asc(users.displayName));
	return { users: rows };
};
