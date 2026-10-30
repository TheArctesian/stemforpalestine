import { fail } from '@sveltejs/kit';
import { readUnsubscribeLink, suppress } from '$lib/server/email/unsubscribe';
import type { Actions, PageServerLoad } from './$types';

// Opening the link only asks; the button does it. Mail scanners open every link in an email.
export const load: PageServerLoad = ({ url }) => ({ email: readUnsubscribeLink(url) });

export const actions: Actions = {
	default: async ({ url }) => {
		const email = readUnsubscribeLink(url);
		if (!email) return fail(400, { invalid: true });
		await suppress(email, 'unsubscribed');
		return { done: true };
	}
};
