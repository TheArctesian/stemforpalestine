import { createHash } from 'node:crypto';
import { and, count, eq, inArray, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailCampaigns, emailMessages, type EmailCampaign } from '$lib/server/db/schema';
import { resolveAudience } from './audience';
import { getEmailProvider, MAX_BATCH, type OutgoingEmail } from './provider';
import { renderEmail } from './render';
import { unsubscribeHeaders, unsubscribeLinks } from './unsubscribe';

/*
 * Sending a campaign without a job queue: starting it writes one queued message per recipient,
 * then the admin page asks for batches of up to 100 until none are left. Each batch is claimed
 * atomically, so two open tabs can't send the same message, and a claim nobody finished (a
 * closed tab, a timed-out function) is picked up again after a few minutes.
 */

const STALE_CLAIM = sql`interval '10 minutes'`;

export function toOutgoing(
	campaign: Pick<EmailCampaign, 'subject' | 'html'>,
	to: string,
	vars: Record<string, string>,
	origin: string
): OutgoingEmail {
	const links = unsubscribeLinks(origin, to);
	const rendered = renderEmail(campaign, vars, { unsubscribeUrl: links.page });
	return { to, ...rendered, headers: unsubscribeHeaders(links.oneClick) };
}

/** Freezes the audience into queued messages and marks the campaign as sending. */
export async function startCampaign(campaignId: string): Promise<{ recipients: number }> {
	return db.transaction(async (tx) => {
		const [campaign] = await tx
			.select()
			.from(emailCampaigns)
			.where(eq(emailCampaigns.id, campaignId))
			.for('update');
		if (!campaign) throw new Error('Campaign not found');
		if (campaign.status !== 'draft') throw new Error('This campaign has already been sent.');

		const { recipients } = await resolveAudience(campaign.audience);
		for (let i = 0; i < recipients.length; i += 500) {
			await tx
				.insert(emailMessages)
				.values(
					recipients.slice(i, i + 500).map((r) => ({
						campaignId,
						email: r.email,
						submissionId: r.submissionId,
						formId: r.formId,
						vars: r.vars
					}))
				)
				.onConflictDoNothing();
		}
		await tx
			.update(emailCampaigns)
			.set({
				status: recipients.length ? 'sending' : 'sent',
				recipientCount: recipients.length,
				startedAt: new Date(),
				completedAt: recipients.length ? null : new Date()
			})
			.where(eq(emailCampaigns.id, campaignId));
		return { recipients: recipients.length };
	});
}

export type Progress = {
	status: EmailCampaign['status'];
	total: number;
	remaining: number;
	sent: number;
	failed: number;
	/** Set when the provider asked us to slow down; the page waits before asking again. */
	retryAfterMs?: number;
	error?: string;
};

export async function campaignProgress(campaignId: string): Promise<Progress> {
	const rows = await db
		.select({ status: emailMessages.status, n: count() })
		.from(emailMessages)
		.where(eq(emailMessages.campaignId, campaignId))
		.groupBy(emailMessages.status);
	const by = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
	const remaining = (by.queued ?? 0) + (by.sending ?? 0);
	const sent = (by.sent ?? 0) + (by.bounced ?? 0) + (by.complained ?? 0);
	const failed = by.failed ?? 0;

	const [campaign] = await db
		.select({ status: emailCampaigns.status })
		.from(emailCampaigns)
		.where(eq(emailCampaigns.id, campaignId));
	let status = campaign?.status ?? 'draft';
	if (status === 'sending' && remaining === 0) {
		status = 'sent';
		await db
			.update(emailCampaigns)
			.set({ status, completedAt: new Date() })
			.where(and(eq(emailCampaigns.id, campaignId), eq(emailCampaigns.status, 'sending')));
	}
	await db
		.update(emailCampaigns)
		.set({ sentCount: sent, failedCount: failed })
		.where(eq(emailCampaigns.id, campaignId));
	return { status, total: remaining + sent + failed, remaining, sent, failed };
}

/** Sends the next batch of a campaign that's sending. */
export async function sendNextBatch(campaignId: string, origin: string): Promise<Progress> {
	const [campaign] = await db
		.select()
		.from(emailCampaigns)
		.where(eq(emailCampaigns.id, campaignId));
	if (!campaign || campaign.status !== 'sending') return campaignProgress(campaignId);

	const claimed = await db.execute<{ id: string; email: string; vars: Record<string, string> }>(sql`
		update ${emailMessages}
		set status = 'sending', locked_at = now(), attempts = attempts + 1
		where id in (
			select id from ${emailMessages}
			where campaign_id = ${campaignId}
				and (status = 'queued' or (status = 'sending' and locked_at < now() - ${STALE_CLAIM}))
			order by created_at, id
			limit ${MAX_BATCH}
			for update skip locked
		)
		returning id, email, vars`);
	const messages = claimed.rows;
	if (!messages.length) return campaignProgress(campaignId);

	const ids = messages.map((m) => m.id);
	const provider = getEmailProvider();
	const key = `campaign-${campaignId}-${createHash('sha256').update(ids.join(',')).digest('hex').slice(0, 32)}`;
	const result = await provider.sendBatch(
		messages.map((m) => toOutgoing(campaign, m.email, m.vars, origin)),
		key
	);

	if (result.ok) {
		await db.transaction(async (tx) => {
			for (const [i, message] of messages.entries()) {
				await tx
					.update(emailMessages)
					.set({
						status: 'sent',
						providerId: result.ids[i] ?? null,
						sentAt: new Date(),
						error: null
					})
					.where(eq(emailMessages.id, message.id));
			}
		});
		return campaignProgress(campaignId);
	}

	if (result.retryable) {
		await db
			.update(emailMessages)
			.set({ status: 'queued', lockedAt: null, error: result.error })
			.where(inArray(emailMessages.id, ids));
		return { ...(await campaignProgress(campaignId)), retryAfterMs: 5000, error: result.error };
	}
	await db
		.update(emailMessages)
		.set({ status: 'failed', lockedAt: null, error: result.error })
		.where(inArray(emailMessages.id, ids));
	return { ...(await campaignProgress(campaignId)), error: result.error };
}

/** Puts failed messages back in the queue. */
export async function retryFailed(campaignId: string): Promise<void> {
	await db.transaction(async (tx) => {
		const requeued = await tx
			.update(emailMessages)
			.set({ status: 'queued', error: null, lockedAt: null })
			.where(and(eq(emailMessages.campaignId, campaignId), eq(emailMessages.status, 'failed')))
			.returning({ id: emailMessages.id });
		if (requeued.length) {
			await tx
				.update(emailCampaigns)
				.set({ status: 'sending', completedAt: null })
				.where(eq(emailCampaigns.id, campaignId));
		}
	});
}

/** One copy to an address of your choosing, marked as a test. */
export async function sendTest(
	template: Pick<EmailCampaign, 'subject' | 'html'>,
	vars: Record<string, string>,
	to: string,
	origin: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const email = toOutgoing(template, to, vars, origin);
	const result = await getEmailProvider().sendBatch(
		[{ ...email, subject: `[Test] ${email.subject}` }],
		`test-${crypto.randomUUID()}`
	);
	return result.ok ? { ok: true } : { ok: false, error: result.error };
}
