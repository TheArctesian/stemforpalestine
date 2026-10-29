import { error, fail } from '@sveltejs/kit';
import { and, eq, isNotNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { forms, formSubmissions } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/permissions';
import { importAnswers } from '$lib/forms/import';
import { submissionEmail } from '$lib/forms/validate';
import type { Actions, PageServerLoad } from './$types';

async function findForm(id: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Form not found');
	const [form] = await db.select().from(forms).where(eq(forms.id, id));
	if (!form) error(404, 'Form not found');
	return form;
}

export const load: PageServerLoad = async ({ params }) => {
	const { id, title, fields } = await findForm(params.id);
	return { form: { id, title, fields } };
};

const payloadSchema = z.object({
	skipExisting: z.boolean(),
	rows: z
		.array(
			z.object({
				line: z.number().int(),
				submittedAt: z.string().max(100).optional(),
				cells: z.record(z.string(), z.string().max(20_000))
			})
		)
		.min(1)
		.max(500)
});

export const actions: Actions = {
	// One chunk of rows per request; the page sends them in turn.
	default: async ({ request, params, locals }) => {
		requireAdmin(locals);
		const form = await findForm(params.id);
		let payload: z.infer<typeof payloadSchema>;
		try {
			payload = payloadSchema.parse(JSON.parse(String((await request.formData()).get('payload'))));
		} catch {
			return fail(400, { message: 'The import data was garbled. Reload the page and try again.' });
		}

		const existing = new Set<string>();
		if (payload.skipExisting) {
			const rows = await db
				.select({ email: formSubmissions.email })
				.from(formSubmissions)
				.where(and(eq(formSubmissions.formId, form.id), isNotNull(formSubmissions.email)));
			for (const row of rows) existing.add(row.email!);
		}

		let skipped = 0;
		const values: (typeof formSubmissions.$inferInsert)[] = [];
		for (const row of payload.rows) {
			const data = importAnswers(form.fields, row.cells);
			if (!Object.keys(data).length) {
				skipped++;
				continue;
			}
			const email = submissionEmail(form, data);
			if (email && existing.has(email)) {
				skipped++;
				continue;
			}
			if (email) existing.add(email);
			const when = row.submittedAt ? new Date(row.submittedAt) : null;
			values.push({
				formId: form.id,
				data,
				email,
				source: 'import',
				metadata: { importRow: row.line },
				submittedAt: when && !Number.isNaN(when.getTime()) ? when : new Date()
			});
		}
		if (values.length) await db.insert(formSubmissions).values(values);
		return { imported: values.length, skipped };
	}
};
