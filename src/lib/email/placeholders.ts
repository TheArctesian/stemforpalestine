import { answerText, type Answers } from '$lib/forms/conditions';
import type { Field } from '$lib/forms/definition';
import { DISPLAY_TYPES } from '$lib/forms/fields';

/*
 * {{placeholders}} in email templates: {{key}} is a form question's key ({{name}}, {{city}}), and
 * {{key|fallback}} uses the fallback when the recipient didn't answer it ({{first_name|friend}}).
 */

export const PLACEHOLDER = /\{\{\s*([a-z][a-z0-9_]*)\s*(?:\|([^{}]*))?\}\}/g;

/** Filled in for every recipient, whatever the form. */
export const BUILT_INS = [
	{ key: 'first_name', label: 'First name (first word of “name”)' },
	{ key: 'email', label: 'Email address' },
	{ key: 'form_title', label: 'Title of the form they filled in' },
	{ key: 'submitted_date', label: 'When they filled it in' },
	{ key: 'unsubscribe_url', label: 'Unsubscribe link' }
] as const;

export type Placeholder = { key: string; fallback?: string };

export function usedPlaceholders(text: string): Placeholder[] {
	const found = new Map<string, Placeholder>();
	for (const [, key, fallback] of text.matchAll(PLACEHOLDER)) {
		if (!found.has(key)) found.set(key, { key, fallback: fallback?.trim() || undefined });
	}
	return [...found.values()];
}

/** Replaces each placeholder with its value (escaped by `escape`), its fallback, or nothing. */
export function fillPlaceholders(
	text: string,
	vars: Record<string, string>,
	escape: (value: string) => string = (v) => v
): string {
	return text.replace(PLACEHOLDER, (_, key: string, fallback?: string) => {
		const value = vars[key]?.trim();
		return escape(value || fallback?.trim() || '');
	});
}

export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
	dateStyle: 'long',
	timeZone: 'America/Los_Angeles'
});

/** Placeholder values for one submission: every question by key, plus the built-ins. */
export function recipientVars(
	form: { title: string; fields: Field[] },
	submission: { data: Answers; email: string | null; submittedAt: Date | string }
): Record<string, string> {
	const vars: Record<string, string> = {};
	for (const field of form.fields) {
		if (DISPLAY_TYPES.has(field.type)) continue;
		vars[field.key] = answerText(submission.data[field.id]);
	}
	vars.first_name ||= (vars.name ?? '').trim().split(/\s+/)[0] ?? '';
	vars.email ||= submission.email ?? '';
	vars.form_title = form.title;
	vars.submitted_date = dateFormat.format(new Date(submission.submittedAt));
	return vars;
}
