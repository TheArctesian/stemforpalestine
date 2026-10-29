import { error, fail, redirect } from '@sveltejs/kit';
import { and, count, eq, ne } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { isUniqueViolation } from '$lib/server/db/errors';
import { invalidateUserSessions } from '$lib/server/auth';
import { hashPassword } from '$lib/server/password';
import { requireAdmin } from '$lib/server/permissions';
import { fieldErrors, passwordSchema, profileSchema } from '$lib/server/users';
import type { Actions, PageServerLoad } from './$types';

async function findUser(id: string) {
	// Not a UUID means it can't exist; skip the query (Postgres would reject it anyway).
	if (!z.uuid().safeParse(id).success) error(404, 'User not found');
	const [user] = await db.select().from(users).where(eq(users.id, id));
	if (!user) error(404, 'User not found');
	return user;
}

/**
 * Whether some *other* active admin would remain if this user stopped being one. Keeps the admin
 * from being locked out by deleting, disabling or demoting the last admin account.
 */
async function anotherActiveAdminExists(userId: string): Promise<boolean> {
	const [row] = await db
		.select({ n: count() })
		.from(users)
		.where(and(eq(users.role, 'admin'), eq(users.status, 'active'), ne(users.id, userId)));
	return row.n > 0;
}

export const load: PageServerLoad = async ({ params }) => {
	const { passwordHash: _passwordHash, ...user } = await findUser(params.id);
	return { account: user };
};

const newPasswordSchema = z
	.object({ password: passwordSchema, confirm: z.string() })
	.refine((v) => v.password === v.confirm, {
		path: ['confirm'],
		message: "The passwords don't match."
	});

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const me = requireAdmin(locals);
		const user = await findUser(params.id);
		const values = Object.fromEntries(await request.formData()) as Record<string, string>;
		const parsed = profileSchema.safeParse(values);
		if (!parsed.success) return fail(400, { action: 'update', errors: fieldErrors(parsed.error) });
		const profile = parsed.data;

		const losesAdmin =
			user.role === 'admin' &&
			user.status === 'active' &&
			(profile.role !== 'admin' || profile.status !== 'active');
		if (losesAdmin && user.id === me.id) {
			return fail(400, {
				action: 'update',
				errors: { form: "You can't remove your own admin access." }
			});
		}
		if (losesAdmin && !(await anotherActiveAdminExists(user.id))) {
			return fail(400, {
				action: 'update',
				errors: { form: 'This is the only active admin account.' }
			});
		}

		try {
			await db.update(users).set(profile).where(eq(users.id, user.id));
		} catch (e) {
			if (isUniqueViolation(e)) {
				return fail(400, {
					action: 'update',
					errors: { form: 'That username or email is already used by another account.' }
				});
			}
			throw e;
		}
		if (profile.status === 'disabled') await invalidateUserSessions(user.id);
		return { action: 'update', success: 'Saved.' };
	},

	password: async ({ request, params, locals }) => {
		const me = requireAdmin(locals);
		const user = await findUser(params.id);
		const parsed = newPasswordSchema.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success)
			return fail(400, { action: 'password', errors: fieldErrors(parsed.error) });

		await db
			.update(users)
			.set({ passwordHash: await hashPassword(parsed.data.password) })
			.where(eq(users.id, user.id));
		// Anyone still signed in with the old password is signed out (except you, if it's you).
		await invalidateUserSessions(user.id, user.id === me.id ? locals.session?.id : undefined);
		return { action: 'password', success: 'Password changed. Other sessions were signed out.' };
	},

	signOut: async ({ params, locals }) => {
		const me = requireAdmin(locals);
		const user = await findUser(params.id);
		await invalidateUserSessions(user.id, user.id === me.id ? locals.session?.id : undefined);
		return { action: 'signOut', success: 'Signed out of every other session.' };
	},

	delete: async ({ params, locals }) => {
		const me = requireAdmin(locals);
		const user = await findUser(params.id);
		if (user.id === me.id) {
			return fail(400, {
				action: 'delete',
				errors: { form: "You can't delete your own account." }
			});
		}
		if (
			user.role === 'admin' &&
			user.status === 'active' &&
			!(await anotherActiveAdminExists(user.id))
		) {
			return fail(400, {
				action: 'delete',
				errors: { form: 'This is the only active admin account.' }
			});
		}
		await db.delete(users).where(eq(users.id, user.id));
		redirect(303, `/admin/users?deleted=${encodeURIComponent(user.username)}`);
	}
};
