import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { emailCampaigns, emailMessages, emailTemplates } from '$lib/server/db/schema';
import { resolveAudience } from '$lib/server/email/audience';
import { renderEmail } from '$lib/server/email/render';
import { campaignProgress, retryFailed, sendTest, startCampaign } from '$lib/server/email/send';
import { requireAdmin } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

async function findCampaign(id: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Campaign not found');
	const [campaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, id));
	if (!campaign) error(404, 'Campaign not found');
	return campaign;
}

/** Placeholder values to preview with: the first recipient's. */
async function sampleVars(campaign: Awaited<ReturnType<typeof findCampaign>>) {
	if (campaign.status === 'draft') {
		const { recipients } = await resolveAudience(campaign.audience);
		return {
			vars: recipients[0]?.vars ?? {},
			count: recipients.length,
			email: recipients[0]?.email
		};
	}
	const [message] = await db
		.select()
		.from(emailMessages)
		.where(eq(emailMessages.campaignId, campaign.id))
		.limit(1);
	return { vars: message?.vars ?? {}, count: campaign.recipientCount, email: message?.email };
}

export const load: PageServerLoad = async ({ params }) => {
	const campaign = await findCampaign(params.id);
	const [template] = campaign.templateId
		? await db
				.select({ id: emailTemplates.id, name: emailTemplates.name })
				.from(emailTemplates)
				.where(eq(emailTemplates.id, campaign.templateId))
		: [];
	const sample = await sampleVars(campaign);
	const preview = renderEmail(campaign, sample.vars, { unsubscribeUrl: '#unsubscribe' });
	const messages =
		campaign.status === 'draft'
			? []
			: await db
					.select({
						id: emailMessages.id,
						email: emailMessages.email,
						status: emailMessages.status,
						error: emailMessages.error,
						sentAt: emailMessages.sentAt
					})
					.from(emailMessages)
					.where(eq(emailMessages.campaignId, campaign.id))
					.orderBy(emailMessages.email);
	return {
		campaign,
		template: template ?? null,
		preview: { subject: preview.subject, html: preview.html, sampleEmail: sample.email },
		audienceSize: sample.count,
		progress: campaign.status === 'draft' ? null : await campaignProgress(campaign.id),
		messages: messages.map((m) => ({ ...m, sentAt: m.sentAt?.toISOString() ?? '' }))
	};
};

export const actions: Actions = {
	start: async ({ params, locals }) => {
		requireAdmin(locals);
		const campaign = await findCampaign(params.id);
		if (campaign.status !== 'draft')
			return fail(400, { message: 'This campaign has already been sent.' });
		try {
			await startCampaign(campaign.id);
		} catch (e) {
			return fail(400, { message: (e as Error).message });
		}
		return { started: true };
	},

	retry: async ({ params, locals }) => {
		requireAdmin(locals);
		await retryFailed((await findCampaign(params.id)).id);
		return { retried: true };
	},

	cancel: async ({ params, locals }) => {
		requireAdmin(locals);
		const campaign = await findCampaign(params.id);
		if (campaign.status !== 'sending')
			return fail(400, { message: 'Only a campaign that is sending can be stopped.' });
		await db
			.update(emailCampaigns)
			.set({ status: 'cancelled', completedAt: new Date() })
			.where(eq(emailCampaigns.id, campaign.id));
		return { cancelled: true };
	},

	resume: async ({ params, locals }) => {
		requireAdmin(locals);
		const campaign = await findCampaign(params.id);
		if (campaign.status !== 'cancelled')
			return fail(400, { message: 'Only a stopped campaign can be resumed.' });
		await db
			.update(emailCampaigns)
			.set({ status: 'sending', completedAt: null })
			.where(eq(emailCampaigns.id, campaign.id));
		return { resumed: true };
	},

	test: async ({ request, params, locals, url }) => {
		requireAdmin(locals);
		const campaign = await findCampaign(params.id);
		const to = z.email().safeParse(
			String((await request.formData()).get('to') ?? '')
				.trim()
				.toLowerCase()
		);
		if (!to.success) return fail(400, { testError: 'Enter an email address.' });
		try {
			const result = await sendTest(
				campaign,
				(await sampleVars(campaign)).vars,
				to.data,
				url.origin
			);
			if (!result.ok) return fail(502, { testError: result.error });
		} catch (e) {
			return fail(503, { testError: (e as Error).message });
		}
		return { testSent: to.data };
	},

	delete: async ({ params, locals }) => {
		requireAdmin(locals);
		const campaign = await findCampaign(params.id);
		if (campaign.status === 'sending')
			return fail(400, { message: 'Stop the campaign before deleting it.' });
		await db
			.delete(emailCampaigns)
			.where(
				and(
					eq(emailCampaigns.id, campaign.id),
					inArray(emailCampaigns.status, ['draft', 'sent', 'cancelled'])
				)
			);
		redirect(303, `/admin/email/campaigns?deleted=${encodeURIComponent(campaign.name)}`);
	}
};
