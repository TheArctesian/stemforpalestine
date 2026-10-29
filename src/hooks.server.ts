import { error, redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(auth.SESSION_COOKIE);
	if (token) {
		const { session, user } = await auth.validateSessionToken(token);
		if (session) auth.setSessionCookie(event.cookies, token, session.expiresAt);
		else auth.deleteSessionCookie(event.cookies);
		event.locals.user = user;
		event.locals.session = session;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	// The admin guard lives here rather than in a layout load, because form actions and +server.ts
	// endpoints don't run layout loads.
	const { pathname, search } = event.url;
	const adminPath = isAdminPath(pathname);
	if (adminPath && !PUBLIC_ADMIN_PATHS.has(pathname)) {
		if (!event.locals.user) {
			if (event.request.method === 'GET') {
				redirect(303, `/admin/login?redirectTo=${encodeURIComponent(pathname + search)}`);
			}
			error(401, 'Please sign in.');
		}
		// Member accounts can sign in, but there's nothing for them in the admin yet.
		if (event.locals.user.role !== 'admin') error(403, 'Your account does not have admin access.');
	}

	const response = await resolve(event);
	if (adminPath) response.headers.set('x-robots-tag', 'noindex, nofollow');
	return response;
};
