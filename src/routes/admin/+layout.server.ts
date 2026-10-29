import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	// hooks.server.ts has already redirected anyone who isn't a signed-in admin.
	return { user: locals.user! };
};
