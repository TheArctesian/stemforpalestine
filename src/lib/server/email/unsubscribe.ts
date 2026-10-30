import { timingSafeEqual } from 'node:crypto';
import { db } from '$lib/server/db';
import { emailSuppressions } from '$lib/server/db/schema';
import { hmac } from '$lib/server/secret';

/*
 * Unsubscribe links carry the address and a signature, so they work without signing in but
 * can't be forged to unsubscribe someone else.
 */

const sign = (email: string) => hmac(`unsubscribe:${email}`).slice(0, 32);

export function unsubscribeLinks(
	origin: string,
	email: string
): { page: string; oneClick: string } {
	const query = `e=${Buffer.from(email).toString('base64url')}&t=${sign(email)}`;
	return {
		page: `${origin}/unsubscribe?${query}`,
		oneClick: `${origin}/api/email/unsubscribe?${query}`
	};
}

/** The address a link is for, if its signature is right. */
export function readUnsubscribeLink(url: URL): string | null {
	const encoded = url.searchParams.get('e') ?? '';
	const token = url.searchParams.get('t') ?? '';
	let email: string;
	try {
		email = Buffer.from(encoded, 'base64url').toString('utf8').trim().toLowerCase();
	} catch {
		return null;
	}
	if (!email.includes('@')) return null;
	const expected = Buffer.from(sign(email));
	const given = Buffer.from(token);
	return given.length === expected.length && timingSafeEqual(given, expected) ? email : null;
}

export async function suppress(
	email: string,
	reason: 'unsubscribed' | 'bounced' | 'complained' | 'manual',
	extra: { campaignId?: string | null; note?: string } = {}
): Promise<void> {
	await db
		.insert(emailSuppressions)
		.values({
			email: email.toLowerCase(),
			reason,
			campaignId: extra.campaignId ?? null,
			note: extra.note
		})
		.onConflictDoNothing();
}

/** Headers that let mail apps show their own one-click unsubscribe button (RFC 8058). */
export function unsubscribeHeaders(oneClickUrl: string): Record<string, string> {
	return {
		'List-Unsubscribe': `<${oneClickUrl}>`,
		'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
	};
}
