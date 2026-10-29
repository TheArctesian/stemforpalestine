import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { invalidateUserSessions } from '$lib/server/auth';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { requireAdmin } from '$lib/server/permissions';
import { fieldErrors, passwordSchema } from '$lib/server/users';
import type { Actions } from './$types';

const changePasswordSchema = z
	.object({
		current: z.string().min(1, 'Enter your current password.'),
		password: passwordSchema,
		confirm: z.string(),
		signOutOthers: z.literal('on').optional()
	})
	.refine((v) => v.password === v.confirm, {
		path: ['confirm'],
		message: "The passwords don't match."
	});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const me = requireAdmin(locals);
		const parsed = changePasswordSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });

		const [user] = await db.select().from(users).where(eq(users.id, me.id));
		if (!(await verifyPassword(user.passwordHash, parsed.data.current))) {
			return fail(400, { errors: { current: "That isn't your current password." } });
		}

		await db
			.update(users)
			.set({ passwordHash: await hashPassword(parsed.data.password) })
			.where(eq(users.id, me.id));
		if (parsed.data.signOutOthers) await invalidateUserSessions(me.id, locals.session?.id);
		return { success: true };
	}
};
