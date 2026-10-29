import { error } from '@sveltejs/kit';
import { count, eq, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms, formSubmissions, type Form } from '$lib/server/db/schema';
import { hmac } from '$lib/server/secret';

export async function findFormBySlug(slug: string): Promise<Form> {
	const [form] = await db.select().from(forms).where(eq(forms.slug, slug));
	if (!form) error(404, 'Form not found');
	return form;
}

/** Ids of fields that at least one submission has answered, which the builder archives rather than deletes. */
export async function answeredFieldIds(formId: string): Promise<string[]> {
	const rows = await db.execute<{ key: string }>(
		sql`select distinct jsonb_object_keys(${formSubmissions.data}) as key from ${formSubmissions} where ${formSubmissions.formId} = ${formId}`
	);
	return rows.rows.map((row) => row.key);
}

export async function submissionCount(formId: string): Promise<number> {
	const [row] = await db
		.select({ n: count() })
		.from(formSubmissions)
		.where(eq(formSubmissions.formId, formId));
	return row.n;
}

/*
 * A signed timestamp, rendered into each public form. Bots that post straight away (or without
 * loading the page) give themselves away; people take longer than a few seconds.
 */
const MIN_FILL_MS = 3000;

export function formToken(formId: string, now = Date.now()): string {
	return `${now}.${hmac(`form:${formId}:${now}`).slice(0, 32)}`;
}

export function checkFormToken(
	formId: string,
	token: string,
	now = Date.now()
): 'ok' | 'too-fast' | 'invalid' {
	const [time, signature] = token.split('.');
	const issued = Number(time);
	if (!Number.isFinite(issued) || signature !== hmac(`form:${formId}:${issued}`).slice(0, 32))
		return 'invalid';
	return now - issued < MIN_FILL_MS ? 'too-fast' : 'ok';
}
