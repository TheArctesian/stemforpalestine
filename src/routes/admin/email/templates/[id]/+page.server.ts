import { error, fail, redirect } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
	emailCampaigns,
	emailTemplateForms,
	emailTemplates,
	forms,
	formSubmissions
} from '$lib/server/db/schema';
import { renderEmail } from '$lib/server/email/render';
import { sendTest } from '$lib/server/email/send';
import { requireAdmin } from '$lib/server/permissions';
import { sanitizeRichText } from '$lib/server/sanitize';
import { recipientVars } from '$lib/email/placeholders';
import type { Actions, PageServerLoad } from './$types';

async function findTemplate(id: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Template not found');
	const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
	if (!template) error(404, 'Template not found');
	return template;
}

export const load: PageServerLoad = async ({ params }) => {
	const template = await findTemplate(params.id);
	const [linked, allForms] = await Promise.all([
		db
			.select({ formId: emailTemplateForms.formId })
			.from(emailTemplateForms)
			.where(eq(emailTemplateForms.templateId, template.id)),
		db
			.select({ id: forms.id, title: forms.title, fields: forms.fields })
			.from(forms)
			.orderBy(forms.title)
	]);
	const formIds = linked.map((l) => l.formId);
	// Recent submitters, to preview the email as one of them.
	const samples = formIds.length
		? await db
				.select({
					id: formSubmissions.id,
					email: formSubmissions.email,
					formId: formSubmissions.formId
				})
				.from(formSubmissions)
				.where(inArray(formSubmissions.formId, formIds))
				.orderBy(desc(formSubmissions.submittedAt))
				.limit(25)
		: [];
	return { template, formIds, forms: allForms, samples };
};

/** Placeholder values for a preview: a real submission's, or each key's question as a stand-in. */
async function previewVars(submissionId: string | null, formIds: string[]) {
	if (submissionId && z.uuid().safeParse(submissionId).success) {
		const [row] = await db
			.select({ submission: formSubmissions, form: { title: forms.title, fields: forms.fields } })
			.from(formSubmissions)
			.innerJoin(forms, eq(forms.id, formSubmissions.formId))
			.where(
				and(
					eq(formSubmissions.id, submissionId),
					inArray(
						formSubmissions.formId,
						formIds.length ? formIds : ['00000000-0000-0000-0000-000000000000']
					)
				)
			);
		if (row) return recipientVars(row.form, row.submission);
	}
	const linked = formIds.length
		? await db
				.select({ title: forms.title, fields: forms.fields })
				.from(forms)
				.where(inArray(forms.id, formIds))
		: [];
	const vars: Record<string, string> = {
		first_name: 'Leila',
		email: 'leila@example.org',
		form_title: linked[0]?.title ?? 'Interest form',
		submitted_date: 'October 8, 2026'
	};
	for (const form of linked)
		for (const field of form.fields) vars[field.key] ??= `[${field.label || field.key}]`;
	return vars;
}

const saveSchema = z.object({
	name: z.string().trim().min(1, 'Give the template a name.').max(200),
	subject: z.string().trim().min(1, 'Write a subject line.').max(300),
	html: z.string().max(200_000),
	formIds: z.array(z.uuid())
});

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const me = requireAdmin(locals);
		const template = await findTemplate(params.id);
		const data = await request.formData();
		const parsed = saveSchema.safeParse({
			name: data.get('name'),
			subject: data.get('subject'),
			html: data.get('html') ?? '',
			formIds: data.getAll('formIds')
		});
		if (!parsed.success) return fail(400, { message: parsed.error.issues[0].message });
		const { formIds, ...values } = parsed.data;
		await db.transaction(async (tx) => {
			await tx
				.update(emailTemplates)
				.set({ ...values, html: sanitizeRichText(values.html), updatedBy: me.id })
				.where(eq(emailTemplates.id, template.id));
			await tx.delete(emailTemplateForms).where(eq(emailTemplateForms.templateId, template.id));
			if (formIds.length) {
				await tx
					.insert(emailTemplateForms)
					.values(formIds.map((formId) => ({ templateId: template.id, formId })));
			}
		});
		return { saved: true };
	},

	preview: async ({ request }) => {
		const data = await request.formData();
		const vars = await previewVars(
			String(data.get('submissionId') ?? '') || null,
			data.getAll('formIds').map(String)
		);
		const email = renderEmail(
			{
				subject: String(data.get('subject') ?? ''),
				html: sanitizeRichText(String(data.get('html') ?? ''))
			},
			vars,
			{ unsubscribeUrl: '#unsubscribe' }
		);
		return { preview: { subject: email.subject, html: email.html } };
	},

	test: async ({ request, locals, url }) => {
		requireAdmin(locals);
		const data = await request.formData();
		const to = z.email().safeParse(
			String(data.get('to') ?? '')
				.trim()
				.toLowerCase()
		);
		if (!to.success) return fail(400, { testError: 'Enter an email address to send the test to.' });
		const vars = await previewVars(
			String(data.get('submissionId') ?? '') || null,
			data.getAll('formIds').map(String)
		);
		try {
			const result = await sendTest(
				{
					subject: String(data.get('subject') ?? ''),
					html: sanitizeRichText(String(data.get('html') ?? ''))
				},
				vars,
				to.data,
				url.origin
			);
			if (!result.ok) return fail(502, { testError: result.error });
		} catch (e) {
			return fail(503, { testError: (e as Error).message });
		}
		return { testSent: to.data };
	},

	duplicate: async ({ params, locals }) => {
		const me = requireAdmin(locals);
		const template = await findTemplate(params.id);
		const links = await db
			.select()
			.from(emailTemplateForms)
			.where(eq(emailTemplateForms.templateId, template.id));
		const [copy] = await db
			.insert(emailTemplates)
			.values({
				name: `${template.name} (copy)`,
				subject: template.subject,
				html: template.html,
				createdBy: me.id,
				updatedBy: me.id
			})
			.returning({ id: emailTemplates.id });
		if (links.length)
			await db
				.insert(emailTemplateForms)
				.values(links.map((l) => ({ templateId: copy.id, formId: l.formId })));
		redirect(303, `/admin/email/templates/${copy.id}`);
	},

	delete: async ({ params, locals }) => {
		requireAdmin(locals);
		const template = await findTemplate(params.id);
		const [sending] = await db
			.select({ id: emailCampaigns.id })
			.from(emailCampaigns)
			.where(and(eq(emailCampaigns.templateId, template.id), eq(emailCampaigns.status, 'sending')));
		if (sending) return fail(400, { message: 'A campaign using this template is still sending.' });
		// Campaigns keep their own copy of the email, so past ones are unaffected.
		await db.delete(emailTemplates).where(eq(emailTemplates.id, template.id));
		redirect(303, `/admin/email/templates?deleted=${encodeURIComponent(template.name)}`);
	}
};
