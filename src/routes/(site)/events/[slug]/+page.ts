import { error } from '@sveltejs/kit';
import { getEvent } from '$lib/data/events';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const event = getEvent(params.slug);
	if (!event) error(404, 'Event not found');
	return { event };
};
