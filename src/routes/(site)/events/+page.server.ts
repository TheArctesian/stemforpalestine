import { publishedEvents } from '$lib/server/events';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ setHeaders }) => {
	// Shared by everyone, so the CDN can serve it; edits show up within a minute.
	setHeaders({ 'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=600' });
	return { events: await publishedEvents() };
};
