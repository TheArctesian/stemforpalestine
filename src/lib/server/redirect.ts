/**
 * Where to go after signing in: the page that sent you to the login form, as long as it's inside
 * the admin. Anything else (another site, `//evil.example`, `/admin.evil.example`) goes to /admin.
 */
export function safeAdminRedirect(target: string | null | undefined): string {
	if (!target) return '/admin';
	const url = new URL(target, 'http://placeholder');
	const local =
		url.origin === 'http://placeholder' && !target.startsWith('//') && !target.includes('\\');
	const inAdmin = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
	return local && inAdmin ? url.pathname + url.search : '/admin';
}
