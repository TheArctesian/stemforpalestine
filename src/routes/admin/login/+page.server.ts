import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { createSession, generateSessionToken, setSessionCookie } from '$lib/server/auth';
import { safeAdminRedirect } from '$lib/server/redirect';
import { dummyVerify, verifyPassword } from '$lib/server/password';
import { hit, peek, reset, type Limit } from '$lib/server/rate-limit';
import { hashIp } from '$lib/server/secret';
import type { Actions, PageServerLoad } from './$types';

// The admin password is shared, so guessing it has to be slow. Per username, and a looser cap
// per IP, since a campus network can put many people behind one address.
const PER_USER: Limit = { max: 10, windowMs: 15 * 60 * 1000 };
const PER_IP: Limit = { max: 30, windowMs: 15 * 60 * 1000 };

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user?.role === 'admin')
		redirect(303, safeAdminRedirect(url.searchParams.get('redirectTo')));
};

const credentials = z.object({
	username: z.string().trim().toLowerCase().min(1),
	password: z.string().min(1)
});

export const actions: Actions = {
	default: async ({ request, cookies, url, getClientAddress }) => {
		const parsed = credentials.safeParse(Object.fromEntries(await request.formData()));
		if (!parsed.success) {
			return fail(400, { username: '', message: 'Enter your username and password.' });
		}
		const { username, password } = parsed.data;

		const userKey = `login:user:${username}`;
		const ipKey = `login:ip:${hashIp(getClientAddress())}`;
		const [byUser, byIp] = await Promise.all([peek(userKey, PER_USER), peek(ipKey, PER_IP)]);
		if (byUser.limited || byIp.limited) {
			const minutes = Math.ceil(Math.max(byUser.retryAfterMs, byIp.retryAfterMs) / 60_000);
			return fail(429, {
				username,
				message: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`
			});
		}

		const [user] = await db.select().from(users).where(eq(users.username, username));
		const valid = user
			? await verifyPassword(user.passwordHash, password)
			: await dummyVerify(password);
		if (!user || !valid || user.status !== 'active') {
			await Promise.all([hit(userKey, PER_USER), hit(ipKey, PER_IP)]);
			return fail(400, { username, message: 'Incorrect username or password.' });
		}

		await reset(userKey);
		const token = generateSessionToken();
		const session = await createSession(token, user.id, request.headers.get('user-agent'));
		setSessionCookie(cookies, token, session.expiresAt);
		await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

		redirect(303, safeAdminRedirect(url.searchParams.get('redirectTo')));
	}
};
