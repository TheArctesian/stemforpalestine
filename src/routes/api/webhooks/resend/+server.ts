import { error, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { emailMessages } from '$lib/server/db/schema';
import { resendClient } from '$lib/server/email/provider';
import { suppress } from '$lib/server/email/unsubscribe';
import type { RequestHandler } from './$types';

/*
 * Resend reports bounces and spam complaints here. Hard bounces and complaints go on the
 * suppression list, so we stop mailing addresses that hurt deliverability.
 */
export const POST: RequestHandler = async ({ request }) => {
	if (!env.RESEND_WEBHOOK_SECRET) error(503, 'Webhook secret not set.');
	const payload = await request.text();
	let event;
	try {
		event = resendClient().webhooks.verify({
			payload,
			// Resend signs webhooks with Svix; these are its three headers.
			headers: {
				id: request.headers.get('svix-id') ?? '',
				timestamp: request.headers.get('svix-timestamp') ?? '',
				signature: request.headers.get('svix-signature') ?? ''
			},
			webhookSecret: env.RESEND_WEBHOOK_SECRET
		});
	} catch {
		error(400, 'Invalid signature.');
	}

	if (event.type === 'email.bounced' || event.type === 'email.complained') {
		const permanent = event.type === 'email.complained' || event.data.bounce?.type !== 'Transient';
		const [message] = await db
			.update(emailMessages)
			.set({ status: event.type === 'email.bounced' ? 'bounced' : 'complained' })
			.where(eq(emailMessages.providerId, event.data.email_id))
			.returning({ campaignId: emailMessages.campaignId });
		if (permanent) {
			for (const to of event.data.to) {
				await suppress(to, event.type === 'email.bounced' ? 'bounced' : 'complained', {
					campaignId: message?.campaignId
				});
			}
		}
	}
	return json({ ok: true });
};
