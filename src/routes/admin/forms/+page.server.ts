import { fail, redirect } from '@sveltejs/kit';
import { count, desc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { forms, formSubmissions } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/permissions';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: forms.id,
			title: forms.title,
			slug: forms.slug,
			status: forms.status,
			updatedAt: forms.updatedAt,
			submissions: count(formSubmissions.id),
			lastSubmission: max(formSubmissions.submittedAt)
		})
		.from(forms)
		.leftJoin(formSubmissions, eq(formSubmissions.formId, forms.id))
		.groupBy(forms.id)
		.orderBy(desc(forms.updatedAt));
	return { forms: rows };
};

export const actions: Actions = {
	duplicate: async ({ request, locals }) => {
		const me = requireAdmin(locals);
		const id = z.uuid().safeParse((await request.formData()).get('id'));
		if (!id.success) return fail(400, { message: 'Unknown form.' });
		const [form] = await db.select().from(forms).where(eq(forms.id, id.data));
		if (!form) return fail(404, { message: 'Unknown form.' });

		// The copy keeps every question (same ids, so the copy's rules still line up) but starts as a draft.
		const taken = new Set((await db.select({ slug: forms.slug }).from(forms)).map((f) => f.slug));
		let slug = `${form.slug}-copy`;
		for (let n = 2; taken.has(slug); n++) slug = `${form.slug}-copy-${n}`;

		const [copy] = await db
			.insert(forms)
			.values({
				...form,
				id: undefined,
				slug,
				title: `${form.title} (copy)`,
				status: 'draft',
				fields: form.fields.filter((field) => !field.archived),
				createdBy: me.id,
				updatedBy: me.id,
				createdAt: undefined,
				updatedAt: undefined
			})
			.returning({ id: forms.id });
		redirect(303, `/admin/forms/${copy.id}/edit`);
	}
};
