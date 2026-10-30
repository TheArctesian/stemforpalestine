import { Resend } from 'resend';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';

/*
 * Where emails actually go: Resend in production, or the server console in development
 * (EMAIL_PROVIDER=console) so nothing reaches a real inbox while testing.
 */

export type OutgoingEmail = {
	to: string;
	subject: string;
	html: string;
	text: string;
	headers?: Record<string, string>;
};

export type SendResult =
	| { ok: true; ids: string[] }
	/** `retryable` failures (rate limits) can be sent again later; others are marked failed. */
	| { ok: false; error: string; retryable: boolean };

export interface EmailProvider {
	readonly name: string;
	/** Up to 100 emails. The idempotency key stops a retried batch going out twice. */
	sendBatch(emails: OutgoingEmail[], idempotencyKey: string): Promise<SendResult>;
}

/** The most emails sendBatch takes at once (Resend's batch limit). */
export const MAX_BATCH = 100;

const from = () => env.EMAIL_FROM || 'STEM4Palestine <hello@mail.stem4pal.org>';
const replyTo = () => env.EMAIL_REPLY_TO || 'info@stem4pal.org';

function resendProvider(apiKey: string): EmailProvider {
	const client = new Resend(apiKey);
	return {
		name: 'resend',
		async sendBatch(emails, idempotencyKey) {
			const { data, error } = await client.batch.send(
				emails.map((email) => ({ from: from(), replyTo: replyTo(), ...email })),
				{ idempotencyKey }
			);
			if (error) {
				const retryable = [
					'rate_limit_exceeded',
					'concurrent_idempotent_requests',
					'internal_server_error',
					'application_error'
				].includes(error.name);
				return { ok: false, error: `${error.name}: ${error.message}`, retryable };
			}
			return { ok: true, ids: data.data.map((d) => d.id) };
		}
	};
}

const consoleProvider: EmailProvider = {
	name: 'console',
	async sendBatch(emails) {
		for (const email of emails) {
			console.log(
				`[email:console] To ${email.to} · ${email.subject}\n${email.text.slice(0, 600)}\n`
			);
		}
		return { ok: true, ids: emails.map(() => `console-${crypto.randomUUID()}`) };
	}
};

export function getEmailProvider(): EmailProvider {
	const choice = env.EMAIL_PROVIDER || (env.RESEND_API_KEY ? 'resend' : dev ? 'console' : '');
	if (choice === 'console') return consoleProvider;
	if (choice === 'resend' && env.RESEND_API_KEY) return resendProvider(env.RESEND_API_KEY);
	throw new Error(
		'Email sending is not set up: add RESEND_API_KEY (or EMAIL_PROVIDER=console for testing).'
	);
}

/** The verifier for Resend's signed webhooks. */
export function resendClient(): Resend {
	return new Resend(env.RESEND_API_KEY || 're_unused');
}
