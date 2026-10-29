import { error } from '@sveltejs/kit';
import type { SessionUser } from '$lib/server/auth';

/**
 * hooks.server.ts already keeps non-admins out of /admin. Actions call this too, so the check sits
 * next to the code it protects and the signed-in user comes back typed.
 */
export function requireAdmin(locals: App.Locals): SessionUser {
	if (!locals.user) error(401, 'Please sign in.');
	if (locals.user.role !== 'admin') error(403, 'Your account does not have admin access.');
	return locals.user;
}
