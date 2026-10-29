import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { forms, type Form } from '$lib/server/db/schema';
import { isUniqueViolation } from '$lib/server/db/errors';
import { answeredFieldIds, submissionCount } from '$lib/server/forms';
import { requireAdmin } from '$lib/server/permissions';
import { sanitizeRichText } from '$lib/server/sanitize';
import { formDefinitionSchema, type FormDefinition } from '$lib/forms/definition';
import type { Actions, PageServerLoad } from './$types';

async function findForm(id: string): Promise<Form> {
	if (!z.uuid().safeParse(id).success) error(404, 'Form not found');
	const [form] = await db.select().from(forms).where(eq(forms.id, id));
	if (!form) error(404, 'Form not found');
	return form;
}

function definitionOf(form: Form): FormDefinition {
	const { title, slug, status, submitLabel, closedMessage, emailFieldId, fields, endings } = form;
	return { title, slug, status, submitLabel, closedMessage, emailFieldId, fields, endings };
}

export const load: PageServerLoad = async ({ params }) => {
	const form = await findForm(params.id);
	const [answered, submissions] = await Promise.all([
		answeredFieldIds(form.id),
		submissionCount(form.id)
	]);
	return {
		formId: form.id,
		definition: definitionOf(form),
		answeredFieldIds: answered,
		submissions
	};
};

/** "Question “Phone number”: …" rather than "fields.2.label: …". */
function describeIssue(definition: FormDefinition, issue: z.core.$ZodIssue): string {
	const [section, index, prop] = issue.path;
	if (section === 'fields' && typeof index === 'number') {
		const field = definition.fields[index];
		const name = field?.label || field?.key || `#${index + 1}`;
		return `Question “${name}”${prop === 'key' ? ' (key)' : ''}: ${issue.message}`;
	}
	if (section === 'endings' && typeof index === 'number')
		return `Ending ${index + 1}: ${issue.message}`;
	return issue.message;
}

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const me = requireAdmin(locals);
		const form = await findForm(params.id);

		let input: unknown;
		try {
			input = JSON.parse(String((await request.formData()).get('definition') ?? ''));
		} catch {
			return fail(400, { issues: ['The form data was garbled. Reload and try again.'] });
		}
		const parsed = formDefinitionSchema.safeParse(input);
		if (!parsed.success) {
			const definition = input as FormDefinition;
			return fail(400, {
				issues: parsed.error.issues.map((issue) => describeIssue(definition, issue))
			});
		}
		const definition = parsed.data;

		// A question with answers can only be archived, so its column stays in the results. Put
		// back any that went missing (e.g. from a stale browser tab).
		const kept = new Set(definition.fields.map((field) => field.id));
		for (const id of await answeredFieldIds(form.id)) {
			const old = form.fields.find((field) => field.id === id);
			if (old && !kept.has(id))
				definition.fields.push({ ...old, archived: true, visibility: null });
		}

		for (const field of definition.fields) {
			if (field.content !== undefined) field.content = sanitizeRichText(field.content);
		}
		for (const ending of definition.endings) ending.html = sanitizeRichText(ending.html);

		try {
			await db
				.update(forms)
				.set({ ...definition, updatedBy: me.id })
				.where(eq(forms.id, form.id));
		} catch (e) {
			if (isUniqueViolation(e))
				return fail(400, { issues: ['Another form already uses this address.'] });
			throw e;
		}
		return { saved: true, definition };
	},

	delete: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const form = await findForm(params.id);
		const typed = String((await request.formData()).get('confirm') ?? '').trim();
		if (typed !== form.title.trim()) {
			return fail(400, { deleteError: 'Type the form’s title exactly to delete it.' });
		}
		await db.delete(forms).where(eq(forms.id, form.id));
		redirect(303, `/admin/forms?deleted=${encodeURIComponent(form.title)}`);
	}
};
