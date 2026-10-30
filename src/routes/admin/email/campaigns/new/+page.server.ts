import { fail, redirect } from '@sveltejs/kit';
import { desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	emailCampaigns,
	emailTemplateForms,
	emailTemplates,
	forms,
	type Audience
} from '$lib/server/db/schema';
import { resolveAudience } from '$lib/server/email/audience';
import { requireAdmin } from '$lib/server/permissions';
import { OPERATORS } from '$lib/forms/conditions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [templates, links, allForms] = await Promise.all([
		db
			.select({ id: emailTemplates.id, name: emailTemplates.name, subject: emailTemplates.subject })
			.from(emailTemplates)
			.orderBy(desc(emailTemplates.updatedAt)),
		db.select().from(emailTemplateForms),
		db.select({ id: forms.id, title: forms.title, fields: forms.fields }).from(forms)
	]);
	return {
		templates: templates.map((t) => ({
			...t,
			formIds: links.filter((l) => l.templateId === t.id).map((l) => l.formId)
		})),
		forms: allForms
	};
};

const audienceSchema = z.object({
	formIds: z.array(z.uuid()).min(1, 'Choose at least one form.'),
	match: z.enum(['all', 'any']),
	rules: z
		.array(
			z.object({
				field: z.string().min(1),
				op: z.enum(OPERATORS),
				value: z.string().max(500).optional()
			})
		)
		.max(20),
	excludedEmails: z.array(z.string().max(320)).max(10_000)
});

/** The audience from the form, limited to forms the template is linked to. */
async function readAudience(
	data: FormData
): Promise<{ templateId: string; audience: Audience } | { error: string }> {
	const templateId = z.uuid().safeParse(data.get('templateId'));
	if (!templateId.success) return { error: 'Choose a template.' };
	let input: unknown;
	try {
		input = JSON.parse(String(data.get('audience') ?? ''));
	} catch {
		return { error: 'Something went wrong. Reload and try again.' };
	}
	const parsed = audienceSchema.safeParse(input);
	if (!parsed.success) return { error: parsed.error.issues[0].message };
	const linked = new Set(
		(
			await db
				.select({ formId: emailTemplateForms.formId })
				.from(emailTemplateForms)
				.where(eq(emailTemplateForms.templateId, templateId.data))
		).map((l) => l.formId)
	);
	const formIds = parsed.data.formIds.filter((id) => linked.has(id));
	if (!formIds.length) return { error: 'This template isn’t linked to any of those forms.' };
	return { templateId: templateId.data, audience: { ...parsed.data, formIds } };
}

export const actions: Actions = {
	preview: async ({ request, locals }) => {
		requireAdmin(locals);
		const read = await readAudience(await request.formData());
		if ('error' in read) return fail(400, { message: read.error });
		const result = await resolveAudience(read.audience);
		return {
			preview: {
				total: result.recipients.length,
				perForm: result.perForm,
				excluded: result.excluded,
				recipients: result.recipients
					.slice(0, 2000)
					.map((r) => ({ email: r.email, name: r.vars.name ?? '', form: r.formTitle }))
			}
		};
	},

	create: async ({ request, locals }) => {
		const me = requireAdmin(locals);
		const data = await request.formData();
		const read = await readAudience(data);
		if ('error' in read) return fail(400, { message: read.error });
		const name = String(data.get('name') ?? '')
			.trim()
			.slice(0, 200);
		if (!name) return fail(400, { message: 'Give the campaign a name.' });
		const [template] = await db
			.select()
			.from(emailTemplates)
			.where(inArray(emailTemplates.id, [read.templateId]));
		const [campaign] = await db
			.insert(emailCampaigns)
			.values({
				name,
				templateId: template.id,
				subject: template.subject,
				html: template.html,
				audience: read.audience,
				createdBy: me.id
			})
			.returning({ id: emailCampaigns.id });
		redirect(303, `/admin/email/campaigns/${campaign.id}`);
	}
};
