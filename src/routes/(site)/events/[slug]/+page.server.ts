import { findEventForPage } from '$lib/server/events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, setHeaders }) => {
	const event = await findEventForPage(params.slug, locals.user?.role === 'admin');
	if (event.status === 'published') {
		setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' });
	}
	return { event, preview: event.status === 'draft' };
};
