import { evaluate, isEmpty, isVisible, type AnswerValue, type Answers } from './conditions';
import type { Ending, Field, FormDefinition } from './definition';
import {
	CHOICE_TYPES,
	DEFAULT_MAX_LENGTH,
	DISPLAY_TYPES,
	OTHER_VALUE,
	otherInputName
} from './fields';

/*
 * Turning what a browser submits into answers, and checking them. The public form runs this as
 * you type, for instant errors; the server runs it again on submit, and its result is what counts.
 */

/** Form inputs as the browser sends them: a string per input, or a list for checkboxes. */
export type RawAnswers = Record<string, string | string[] | undefined>;

type FormFields = Pick<FormDefinition, 'fields'>;

/** Questions people answer: no headings or text blocks, nothing archived. */
export function answerableFields(form: FormFields): Field[] {
	return form.fields.filter((field) => !DISPLAY_TYPES.has(field.type) && !field.archived);
}

export function readFormData(form: FormFields, data: FormData): RawAnswers {
	const raw: RawAnswers = {};
	for (const field of answerableFields(form)) {
		if (field.type === 'checkboxes') raw[field.id] = data.getAll(field.id).map(String);
		else if (typeof data.get(field.id) === 'string') raw[field.id] = data.get(field.id) as string;
		const other = data.get(otherInputName(field.id));
		if (field.allowOther && typeof other === 'string') raw[otherInputName(field.id)] = other;
	}
	return raw;
}

const asString = (value: RawAnswers[string]) =>
	typeof value === 'string' ? value : Array.isArray(value) ? (value[0] ?? '') : '';
const asList = (value: RawAnswers[string]) =>
	Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : [];

/** Raw inputs as answers: trimmed, "Other" swapped for the typed text, empty answers left out. */
export function normalizeAnswers(form: FormFields, raw: RawAnswers): Answers {
	const answers: Answers = {};
	for (const field of answerableFields(form)) {
		const value = raw[field.id];
		const other = asString(raw[otherInputName(field.id)]).trim();
		let answer: AnswerValue | undefined;
		switch (field.type) {
			case 'checkbox':
				answer = asString(value) !== '' || undefined;
				break;
			case 'checkboxes': {
				const list = asList(value).map((v) => (v === OTHER_VALUE ? other : v.trim()));
				answer = [...new Set(list.filter(Boolean))];
				break;
			}
			case 'dropdown':
			case 'radio': {
				const choice = asString(value).trim();
				answer = choice === OTHER_VALUE ? other : choice;
				break;
			}
			case 'email':
				answer = asString(value).trim().toLowerCase();
				break;
			case 'long_text':
				answer = asString(value).replace(/\r\n?/g, '\n').trim();
				break;
			default:
				answer = asString(value).trim();
		}
		if (answer !== undefined && !isEmpty(answer)) answers[field.id] = answer;
	}
	return answers;
}

/**
 * Ids of the fields currently shown. A hidden field's answer doesn't count towards other fields'
 * rules, so this repeats until it settles (A hides B, B was showing C, so C hides too).
 */
export function visibleFieldIds(form: FormFields, answers: Answers): Set<string> {
	const fields = form.fields.filter((field) => !field.archived);
	let visible = new Set(fields.map((field) => field.id));
	for (let pass = 0; pass < fields.length + 1; pass++) {
		const lookup = (id: string) => (visible.has(id) ? answers[id] : undefined);
		const next = new Set(fields.filter((f) => isVisible(f.visibility, lookup)).map((f) => f.id));
		if (next.size === visible.size && [...next].every((id) => visible.has(id))) return next;
		visible = next;
	}
	return visible;
}

// Deliberately loose: one @, something on both sides, a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredMessage(field: Field): string {
	if (field.type === 'checkbox') return 'Please check this box.';
	if (field.type === 'checkboxes') return 'Please choose at least one option.';
	if (CHOICE_TYPES.has(field.type)) return 'Please choose an option.';
	return 'This question is required.';
}

function fieldError(field: Field, value: AnswerValue | undefined, raw: RawAnswers): string | null {
	if (field.type === 'hidden') return null;

	const pickedOther = field.allowOther && asList(raw[field.id]).includes(OTHER_VALUE);
	if (pickedOther && !asString(raw[otherInputName(field.id)]).trim())
		return 'Please fill in “Other”.';
	if (value === undefined || isEmpty(value)) return field.required ? requiredMessage(field) : null;

	const options = new Set((field.options ?? []).map((option) => option.label));
	const listed = (v: string) => options.has(v) || field.allowOther;
	if (Array.isArray(value)) return value.every(listed) ? null : 'Choose from the options given.';
	if (typeof value === 'boolean') return null;
	if (CHOICE_TYPES.has(field.type)) return listed(value) ? null : 'Choose one of the options.';

	const v = field.validation ?? {};
	const max = v.maxLength ?? DEFAULT_MAX_LENGTH[field.type];
	if (max !== undefined && value.length > max) return `Keep this under ${max + 1} characters.`;
	if (v.minLength !== undefined && value.length < v.minLength)
		return `Use at least ${v.minLength} characters.`;

	switch (field.type) {
		case 'email':
			if (!EMAIL.test(value)) return 'Enter a valid email address.';
			break;
		case 'phone': {
			const digits = value.replace(/\D/g, '').length;
			if (!/^[+\d\s().\-/]+$/.test(value) || digits < 7 || digits > 15)
				return 'Enter a valid phone number.';
			break;
		}
		case 'number': {
			const n = Number(value);
			if (!Number.isFinite(n)) return 'Enter a number.';
			if (v.min !== undefined && n < v.min) return `Enter ${v.min} or more.`;
			if (v.max !== undefined && n > v.max) return `Enter ${v.max} or less.`;
			break;
		}
		case 'url': {
			let url: URL | null = null;
			try {
				url = new URL(value);
			} catch {
				// handled below
			}
			if (!url || !['http:', 'https:'].includes(url.protocol))
				return 'Enter a full link, starting with https://';
			break;
		}
		case 'date':
			if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)))
				return 'Enter a valid date.';
			break;
	}

	if (v.regex) {
		let pattern: RegExp | null = null;
		try {
			pattern = new RegExp(v.regex);
		} catch {
			// The builder rejects invalid patterns; if one slipped through, don't block submissions.
		}
		if (pattern && !pattern.test(value)) return v.message || "This doesn't look right.";
	}
	return null;
}

export type ValidationResult = {
	/** Answers to the questions that were shown, ready to store. */
	answers: Answers;
	/** Error message per field id. Empty when the submission is valid. */
	errors: Record<string, string>;
};

export function validateSubmission(form: FormFields, raw: RawAnswers): ValidationResult {
	const all = normalizeAnswers(form, raw);
	const visible = visibleFieldIds(form, all);
	const answers: Answers = {};
	const errors: Record<string, string> = {};
	for (const field of answerableFields(form)) {
		if (!visible.has(field.id)) continue;
		const error = fieldError(field, all[field.id], raw);
		if (error) errors[field.id] = error;
		else if (all[field.id] !== undefined) answers[field.id] = all[field.id];
	}
	return { answers, errors };
}

/** The first ending whose rules match; the last ending is the fallback. */
export function pickEnding(endings: Ending[], answers: Answers): Ending | undefined {
	return (
		endings.find((ending) => evaluate(ending.condition, (id) => answers[id])) ?? endings.at(-1)
	);
}

/** The submitter's email: the form's chosen email field, or else its first email question. */
export function submissionEmail(
	form: Pick<FormDefinition, 'fields' | 'emailFieldId'>,
	answers: Answers
): string | null {
	const field = form.emailFieldId
		? form.fields.find((f) => f.id === form.emailFieldId)
		: form.fields.find((f) => f.type === 'email' && !f.archived);
	const value = field ? answers[field.id] : undefined;
	return typeof value === 'string' && value ? value.toLowerCase() : null;
}
