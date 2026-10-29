import type { AnswerValue, Answers } from './conditions';
import type { Field } from './definition';
import { CHOICE_TYPES } from './fields';
import { answerableFields } from './validate';

/*
 * Turning CSV cells (from a Fillout or Google Forms export) into answers. Shared by the import
 * page, which previews and warns, and the server, which stores the result.
 */

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '');

/** Headers that mean "when this was submitted" in Fillout, Google Forms and the like. */
const SUBMITTED_AT_HEADERS = new Set(
	[
		'Submitted at',
		'Submission time',
		'Timestamp',
		'Submitted',
		'Date submitted',
		'Created at',
		'Submission date'
	].map(normalize)
);

export const SUBMITTED_AT = '__submitted_at__';

/** Best guess at which question (or the submission time) each CSV column holds. */
export function guessMapping(headers: string[], fields: Field[]): Record<string, string> {
	const inputs = answerableFields({ fields });
	const mapping: Record<string, string> = {};
	const used = new Set<string>();
	for (const header of headers) {
		const h = normalize(header);
		if (!h) continue;
		if (SUBMITTED_AT_HEADERS.has(h) && !used.has(SUBMITTED_AT)) {
			mapping[header] = SUBMITTED_AT;
			used.add(SUBMITTED_AT);
			continue;
		}
		const field = inputs.find(
			(f) => !used.has(f.id) && (normalize(f.label) === h || normalize(f.key) === h)
		);
		if (field) {
			mapping[header] = field.id;
			used.add(field.id);
		}
	}
	return mapping;
}

/**
 * "Events, Tech Projects" → ["Events", "Tech Projects"]. Option labels can contain commas
 * themselves, so known labels are matched first; whatever's left over is kept as typed text.
 */
export function splitChoices(cell: string, options: string[]): string[] {
	const parts = cell.split(/\s*[,;\n]\s*/).filter(Boolean);
	const labels = new Map(options.map((label) => [label.toLowerCase(), label]));
	const picked: string[] = [];
	for (let i = 0; i < parts.length; ) {
		// The longest run of parts that spells out a known option.
		let match = 0;
		for (let j = parts.length; j > i; j--) {
			if (labels.has(parts.slice(i, j).join(', ').toLowerCase())) {
				match = j;
				break;
			}
		}
		if (match) {
			picked.push(labels.get(parts.slice(i, match).join(', ').toLowerCase())!);
			i = match;
		} else {
			picked.push(parts[i]);
			i++;
		}
	}
	return [...new Set(picked)];
}

const TRUTHY = new Set(['yes', 'y', 'true', '1', 'checked', 'x', 'on', 'agree', 'i agree']);

export function importCell(field: Field, cell: string): AnswerValue | undefined {
	const value = cell.trim();
	if (!value) return undefined;
	const options = (field.options ?? []).map((o) => o.label);
	switch (field.type) {
		case 'checkboxes':
			return splitChoices(value, options);
		case 'checkbox':
			return TRUTHY.has(value.toLowerCase()) || undefined;
		case 'dropdown':
		case 'radio':
			// Match an option regardless of case, else keep what was written.
			return options.find((o) => o.toLowerCase() === value.toLowerCase()) ?? value;
		case 'email':
			return value.toLowerCase();
		default:
			return value;
	}
}

/** Answers for one CSV row, given the row's cells by field id. */
export function importAnswers(fields: Field[], cells: Record<string, string>): Answers {
	const answers: Answers = {};
	for (const field of answerableFields({ fields })) {
		const value = cells[field.id] === undefined ? undefined : importCell(field, cells[field.id]);
		if (value !== undefined && !(Array.isArray(value) && !value.length)) answers[field.id] = value;
	}
	return answers;
}

/** Values that aren't one of a choice question's options (kept, but worth a warning). */
export function unlistedChoices(field: Field, value: AnswerValue | undefined): string[] {
	if (!CHOICE_TYPES.has(field.type) || value === undefined || typeof value === 'boolean') return [];
	const options = new Set((field.options ?? []).map((o) => o.label));
	return (Array.isArray(value) ? value : [value]).filter((v) => !options.has(v));
}
