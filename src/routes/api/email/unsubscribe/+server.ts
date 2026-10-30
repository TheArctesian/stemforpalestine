import { error, text } from '@sveltejs/kit';
import { readUnsubscribeLink, suppress } from '$lib/server/email/unsubscribe';
import type { RequestHandler } from './$types';

/*
 * One-click unsubscribe (RFC 8058): mail apps POST "List-Unsubscribe=One-Click" here from their
 * own servers, with no Origin header, which is why hooks.server.ts exempts this path from the
 * cross-site form check. The signed link is what makes it safe.
 */
export const POST: RequestHandler = async ({ url }) => {
	const email = readUnsubscribeLink(url);
	if (!email) error(400, 'Invalid unsubscribe link.');
	await suppress(email, 'unsubscribed');
	return text('Unsubscribed.');
};
