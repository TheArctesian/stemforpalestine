import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { isUniqueViolation } from '$lib/server/db/errors';
import { hashPassword } from '$lib/server/password';
import { requireAdmin } from '$lib/server/permissions';
import { fieldErrors, passwordSchema, profileSchema } from '$lib/server/users';
import type { Actions } from './$types';

const newUserSchema = profileSchema.omit({ status: true }).extend({ password: passwordSchema });

export const actions: Actions = {
	default: async ({ request, locals }) => {
		requireAdmin(locals);
		const values = Object.fromEntries(await request.formData()) as Record<string, string>;
		const parsed = newUserSchema.safeParse(values);
		if (!parsed.success) {
			return fail(400, { values: { ...values, password: '' }, errors: fieldErrors(parsed.error) });
		}

		const { password, ...profile } = parsed.data;
		try {
			await db.insert(users).values({ ...profile, passwordHash: await hashPassword(password) });
		} catch (error) {
			if (isUniqueViolation(error)) {
				return fail(400, {
					values: { ...values, password: '' },
					errors: { form: 'That username or email is already used by another account.' }
				});
			}
			throw error;
		}
		redirect(303, `/admin/users?created=${encodeURIComponent(profile.username)}`);
	}
};
