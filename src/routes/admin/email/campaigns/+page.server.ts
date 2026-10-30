import { desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { emailCampaigns } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	campaigns: await db
		.select({
			id: emailCampaigns.id,
			name: emailCampaigns.name,
			subject: emailCampaigns.subject,
			status: emailCampaigns.status,
			recipientCount: emailCampaigns.recipientCount,
			sentCount: emailCampaigns.sentCount,
			failedCount: emailCampaigns.failedCount,
			createdAt: emailCampaigns.createdAt,
			startedAt: emailCampaigns.startedAt
		})
		.from(emailCampaigns)
		.orderBy(desc(emailCampaigns.createdAt))
});
