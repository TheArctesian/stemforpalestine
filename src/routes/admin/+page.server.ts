import { count, eq, gte } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, formSubmissions, users } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const load: PageServerLoad = async () => {
	const [[{ activeUsers }], [{ openForms }], [{ submissionsThisWeek }]] = await Promise.all([
		db.select({ activeUsers: count() }).from(users).where(eq(users.status, 'active')),
		db.select({ openForms: count() }).from(forms).where(eq(forms.status, 'open')),
		db
			.select({ submissionsThisWeek: count() })
			.from(formSubmissions)
			.where(gte(formSubmissions.submittedAt, new Date(Date.now() - WEEK_MS)))
	]);
	return { stats: { activeUsers, openForms, submissionsThisWeek } };
};
