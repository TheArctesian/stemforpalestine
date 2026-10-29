import { error, fail } from '@sveltejs/kit';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { forms, formSubmissions } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

async function findForm(id: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Form not found');
	const [form] = await db
		.select({ id: forms.id, title: forms.title, slug: forms.slug, fields: forms.fields })
		.from(forms)
		.where(eq(forms.id, id));
	if (!form) error(404, 'Form not found');
	return form;
}

export const load: PageServerLoad = async ({ params }) => {
	const form = await findForm(params.id);
	const submissions = await db
		.select({
			id: formSubmissions.id,
			data: formSubmissions.data,
			email: formSubmissions.email,
			source: formSubmissions.source,
			metadata: formSubmissions.metadata,
			submittedAt: formSubmissions.submittedAt
		})
		.from(formSubmissions)
		.where(eq(formSubmissions.formId, form.id))
		.orderBy(desc(formSubmissions.submittedAt));
	// The IP hash is for rate limiting, not for reading.
	return {
		form,
		submissions: submissions.map(({ metadata: { ipHash: _ipHash, ...metadata }, ...s }) => ({
			...s,
			metadata
		}))
	};
};

export const actions: Actions = {
	delete: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const form = await findForm(params.id);
		const ids = z
			.array(z.uuid())
			.min(1)
			.max(5000)
			.safeParse((await request.formData()).getAll('id'));
		if (!ids.success) return fail(400, { message: 'Pick at least one submission to delete.' });
		const deleted = await db
			.delete(formSubmissions)
			.where(and(eq(formSubmissions.formId, form.id), inArray(formSubmissions.id, ids.data)))
			.returning({ id: formSubmissions.id });
		return { deleted: deleted.length };
	}
};
