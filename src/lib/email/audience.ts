import { evaluateRule, type Answers } from '$lib/forms/conditions';
import type { Field } from '$lib/forms/definition';
import { CHOICE_TYPES, DISPLAY_TYPES, type FieldType } from '$lib/forms/fields';
import { recipientVars } from './placeholders';

/*
 * Who a campaign goes to. Rules are written by field key, so one rule ("city contains San
 * Francisco") can apply across several forms. A form without that key never matches the rule.
 */

export type AudienceRules = {
	formIds: string[];
	match: 'all' | 'any';
	rules: { field: string; op: Parameters<typeof evaluateRule>[0]['op']; value?: string }[];
	excludedEmails: string[];
};

export type AudienceForm = { id: string; title: string; fields: Field[] };
export type AudienceSubmission = {
	id: string;
	formId: string;
	data: Answers;
	email: string | null;
	submittedAt: Date;
};

export type Recipient = {
	email: string;
	submissionId: string;
	formId: string;
	formTitle: string;
	submittedAt: Date;
	vars: Record<string, string>;
};

export type AudienceResult = {
	recipients: Recipient[];
	perForm: { formId: string; title: string; submissions: number; matched: number }[];
	excluded: { noEmail: number; duplicates: number; suppressed: number; manual: number };
};

function matches(
	form: AudienceForm,
	submission: AudienceSubmission,
	audience: AudienceRules
): boolean {
	if (!audience.rules.length) return true;
	const byKey = new Map(
		form.fields.filter((f) => !DISPLAY_TYPES.has(f.type)).map((f) => [f.key, f.id] as const)
	);
	const check = (rule: AudienceRules['rules'][number]) => {
		const id = byKey.get(rule.field);
		return id !== undefined && evaluateRule(rule, submission.data[id]);
	};
	return audience.match === 'any' ? audience.rules.some(check) : audience.rules.every(check);
}

/**
 * Picks recipients from submissions, newest first.
 *
 * Only someone's latest submission to each form counts, so a later "No" to the mailing list
 * question overrides an earlier "Yes". Across forms, matching any one of them is enough; the
 * newest matching submission supplies the placeholder values.
 */
export function selectRecipients(
	forms: AudienceForm[],
	submissions: AudienceSubmission[],
	audience: AudienceRules,
	suppressed: ReadonlySet<string>
): AudienceResult {
	const formsById = new Map(
		forms.filter((f) => audience.formIds.includes(f.id)).map((f) => [f.id, f])
	);
	const manual = new Set(audience.excludedEmails.map((e) => e.toLowerCase()));
	const perForm = new Map(
		[...formsById.values()].map((f) => [
			f.id,
			{ formId: f.id, title: f.title, submissions: 0, matched: 0 }
		])
	);
	const excluded = { noEmail: 0, duplicates: 0, suppressed: 0, manual: 0 };
	const latest = new Set<string>();
	const chosen = new Set<string>();
	const recipients: Recipient[] = [];

	for (const submission of [...submissions].sort((a, b) => +b.submittedAt - +a.submittedAt)) {
		const form = formsById.get(submission.formId);
		if (!form) continue;
		const counts = perForm.get(form.id)!;
		const email = submission.email?.trim().toLowerCase();

		// An older answer to a form this person has filled in again doesn't count.
		if (email) {
			const key = `${form.id}:${email}`;
			if (latest.has(key)) continue;
			latest.add(key);
		}
		counts.submissions++;
		if (!matches(form, submission, audience)) continue;
		counts.matched++;

		if (!email) excluded.noEmail++;
		else if (chosen.has(email)) excluded.duplicates++;
		else {
			chosen.add(email);
			if (suppressed.has(email)) excluded.suppressed++;
			else if (manual.has(email)) excluded.manual++;
			else {
				recipients.push({
					email,
					submissionId: submission.id,
					formId: form.id,
					formTitle: form.title,
					submittedAt: submission.submittedAt,
					vars: recipientVars(form, submission)
				});
			}
		}
	}
	return { recipients, perForm: [...perForm.values()], excluded };
}

/**
 * The questions an audience can filter on, by key, across the given forms. A key shared by
 * several forms is one target; its choices are all the forms' options together.
 */
export function audienceTargets(
	forms: AudienceForm[]
): { value: string; label: string; type: FieldType; options?: string[]; forms: string[] }[] {
	const byKey = new Map<
		string,
		{ value: string; label: string; type: FieldType; options?: Set<string>; forms: string[] }
	>();
	for (const form of forms) {
		for (const field of form.fields) {
			if (DISPLAY_TYPES.has(field.type) || field.type === 'hidden') continue;
			let target = byKey.get(field.key);
			if (!target) {
				target = { value: field.key, label: field.label || field.key, type: field.type, forms: [] };
				byKey.set(field.key, target);
			}
			target.forms.push(form.title);
			if (CHOICE_TYPES.has(field.type)) {
				target.options ??= new Set();
				for (const option of field.options ?? []) target.options.add(option.label);
			}
		}
	}
	return [...byKey.values()].map((t) => ({
		...t,
		label:
			forms.length > 1 && t.forms.length < forms.length
				? `${t.label} (only in ${t.forms.join(', ')})`
				: t.label,
		options: t.options ? [...t.options] : undefined
	}));
}
