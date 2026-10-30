import { fail } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { emailSuppressions } from '$lib/server/db/schema';
import { suppress } from '$lib/server/email/unsubscribe';
import { requireAdmin } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	suppressions: (
		await db.select().from(emailSuppressions).orderBy(desc(emailSuppressions.createdAt))
	).map((s) => ({
		email: s.email,
		reason: s.reason,
		note: s.note ?? '',
		createdAt: s.createdAt.toISOString().slice(0, 10)
	}))
});

export const actions: Actions = {
	add: async ({ request, locals }) => {
		requireAdmin(locals);
		const data = await request.formData();
		const email = z.email().safeParse(
			String(data.get('email') ?? '')
				.trim()
				.toLowerCase()
		);
		if (!email.success) return fail(400, { message: 'Enter a valid email address.' });
		await suppress(email.data, 'manual', {
			note:
				String(data.get('note') ?? '')
					.trim()
					.slice(0, 300) || undefined
		});
		return { added: email.data };
	},
	remove: async ({ request, locals }) => {
		requireAdmin(locals);
		const email = String((await request.formData()).get('email') ?? '');
		await db.delete(emailSuppressions).where(eq(emailSuppressions.email, email));
		return { removed: email };
	}
};
