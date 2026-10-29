import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { forms } from '$lib/server/db/schema';
import { isUniqueViolation } from '$lib/server/db/errors';
import { requireAdmin } from '$lib/server/permissions';
import { formDefinitionSchema } from '$lib/forms/definition';
import { FORM_TEMPLATES } from '$lib/forms/templates';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	templates: FORM_TEMPLATES.map(({ id, name, description, build }) => {
		const { title, slug } = build();
		return { id, name, description, title, slug };
	})
});

const newFormSchema = z.object({
	template: z.enum(FORM_TEMPLATES.map((t) => t.id) as [string, ...string[]]),
	title: z.string().trim().min(1, 'Give the form a title.').max(200),
	slug: formDefinitionSchema.shape.slug
});

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const me = requireAdmin(locals);
		const values = Object.fromEntries(await request.formData()) as Record<string, string>;
		const parsed = newFormSchema.safeParse(values);
		if (!parsed.success) {
			const errors: Record<string, string> = {};
			for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
			return fail(400, { values, errors });
		}

		const template = FORM_TEMPLATES.find((t) => t.id === parsed.data.template)!;
		const definition = { ...template.build(), title: parsed.data.title, slug: parsed.data.slug };
		let id: string;
		try {
			[{ id }] = await db
				.insert(forms)
				.values({ ...definition, createdBy: me.id, updatedBy: me.id })
				.returning({ id: forms.id });
		} catch (error) {
			if (isUniqueViolation(error)) {
				return fail(400, { values, errors: { slug: 'Another form already uses this address.' } });
			}
			throw error;
		}
		redirect(303, `/admin/forms/${id}/edit`);
	}
};
