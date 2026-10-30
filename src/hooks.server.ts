import { error, redirect, type Handle } from '@sveltejs/kit';
import * as auth from '$lib/server/auth';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login']);

/** Accepts form POSTs from anywhere; safe because each request carries a signed link. */
const CROSS_SITE_FORM_PATHS = new Set(['/api/email/unsubscribe']);
const FORM_CONTENT_TYPES = [
	'application/x-www-form-urlencoded',
	'multipart/form-data',
	'text/plain'
];

/**
 * SvelteKit's own CSRF check (switched off in svelte.config.js): form submissions that change
 * things must come from this site.
 */
function isCrossSiteForm(request: Request, url: URL): boolean {
	if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return false;
	const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
	if (!FORM_CONTENT_TYPES.includes(type)) return false;
	return request.headers.get('origin') !== url.origin && !CROSS_SITE_FORM_PATHS.has(url.pathname);
}

function isAdminPath(pathname: string): boolean {
	return pathname === '/admin' || pathname.startsWith('/admin/');
}

export const handle: Handle = async ({ event, resolve }) => {
	if (isCrossSiteForm(event.request, event.url)) {
		return new Response(`Cross-site ${event.request.method} form submissions are forbidden`, {
			status: 403
		});
	}

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
