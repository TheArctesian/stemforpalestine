import type { Operator } from './conditions';

/*
 * Field types and small helpers shared by the public form renderer, the admin builder and the
 * server. No zod here, so the public form's bundle stays small; the zod schema is in schema.ts.
 */

export const FIELD_TYPES = [
	'heading',
	'rich_text',
	'short_text',
	'long_text',
	'email',
	'phone',
	'number',
	'url',
	'date',
	'dropdown',
	'radio',
	'checkboxes',
	'checkbox',
	'hidden'
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_INFO: Record<
	FieldType,
	{ label: string; icon: string; group: 'Content' | 'Text' | 'Choice' | 'Other' }
> = {
	heading: { label: 'Heading', icon: 'fa-heading', group: 'Content' },
	rich_text: { label: 'Text block', icon: 'fa-paragraph', group: 'Content' },
	short_text: { label: 'Short answer', icon: 'fa-font', group: 'Text' },
	long_text: { label: 'Long answer', icon: 'fa-align-left', group: 'Text' },
	email: { label: 'Email', icon: 'fa-at', group: 'Text' },
	phone: { label: 'Phone', icon: 'fa-phone', group: 'Text' },
	number: { label: 'Number', icon: 'fa-hashtag', group: 'Text' },
	url: { label: 'Link (URL)', icon: 'fa-link', group: 'Text' },
	date: { label: 'Date', icon: 'fa-calendar-day', group: 'Text' },
	dropdown: { label: 'Dropdown', icon: 'fa-square-caret-down', group: 'Choice' },
	radio: { label: 'Multiple choice', icon: 'fa-circle-dot', group: 'Choice' },
	checkboxes: { label: 'Checkboxes', icon: 'fa-square-check', group: 'Choice' },
	checkbox: { label: 'Single checkbox', icon: 'fa-check', group: 'Choice' },
	hidden: { label: 'Hidden (from link)', icon: 'fa-eye-slash', group: 'Other' }
};

/** Headings and text blocks: shown on the form, but nobody answers them. */
export const DISPLAY_TYPES: ReadonlySet<FieldType> = new Set(['heading', 'rich_text']);

/** Types with a list of options. */
export const CHOICE_TYPES: ReadonlySet<FieldType> = new Set(['dropdown', 'radio', 'checkboxes']);

/** Value of the "Other" choice in submitted form data; the typed text arrives as `<id>__other`. */
export const OTHER_VALUE = '__other__';
export const otherInputName = (fieldId: string) => `${fieldId}__other`;

/** Longest answer accepted when a field doesn't set its own maximum. */
export const DEFAULT_MAX_LENGTH: Partial<Record<FieldType, number>> = {
	short_text: 500,
	long_text: 10_000,
	email: 254,
	phone: 40,
	url: 2_000,
	number: 40,
	date: 10,
	hidden: 500
};

export function isInputType(type: FieldType): boolean {
	return !DISPLAY_TYPES.has(type);
}

/** Short random id for fields, options and endings, e.g. "k3f9x2qa". */
export function newId(length = 8): string {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}

/** "What's your affiliation with UC Berkeley?" → "whats_your_affiliation_with_uc_berkeley" */
export function slugifyKey(text: string, maxLength = 40): string {
	const key = text
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '')
		.slice(0, maxLength)
		.replace(/_+$/, '');
	return /^[a-z]/.test(key) ? key : `field_${key}`.replace(/_+$/, '');
}

/** "Principled in Tech!" → "principled-in-tech" */
export function slugifyUrl(text: string): string {
	return text
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60)
		.replace(/-+$/, '');
}

/** The comparisons that make sense for a type of question, most useful first. */
export function operatorsFor(type: FieldType | undefined): Operator[] {
	switch (type) {
		case 'dropdown':
		case 'radio':
			return ['equals', 'not_equals', 'is_not_empty', 'is_empty'];
		case 'checkboxes':
			return ['includes', 'excludes', 'is_not_empty', 'is_empty'];
		case 'checkbox':
			return ['is_not_empty', 'is_empty'];
		case 'number':
		case 'date':
			return ['equals', 'not_equals', 'gt', 'lt', 'is_not_empty', 'is_empty'];
		default:
			return ['equals', 'not_equals', 'contains', 'not_contains', 'is_not_empty', 'is_empty'];
	}
}
