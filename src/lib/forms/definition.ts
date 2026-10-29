import { z } from 'zod';
import { OPERATORS, UNARY_OPERATORS } from './conditions';
import { CHOICE_TYPES, DISPLAY_TYPES, FIELD_TYPES } from './fields';

/*
 * The shape of a form, as the builder saves it and the server checks it. Import types from here
 * with `import type`, so the public form page doesn't bundle zod.
 */

/** Keys the email templates fill in themselves, so a field can't use them. */
export const RESERVED_KEYS = new Set(['unsubscribe_url', 'form_title', 'submitted_date']);

const ruleSchema = z.object({
	field: z.string().min(1, 'Choose a question.'),
	op: z.enum(OPERATORS),
	value: z.string().max(500).optional()
});

export const conditionSchema = z.object({
	match: z.enum(['all', 'any']),
	rules: z.array(ruleSchema).max(20)
});

const visibilitySchema = conditionSchema.extend({ action: z.enum(['show', 'hide']) });

const optionSchema = z.object({
	id: z.string().min(1).max(40),
	label: z.string().trim().min(1, 'Options need a label.').max(300)
});

const optionalText = (max: number) => z.string().trim().max(max).optional();
const optionalCount = z.number().int().min(0).max(100_000).optional();

const validationSchema = z.object({
	regex: z.string().max(500).optional(),
	message: optionalText(300),
	minLength: optionalCount,
	maxLength: optionalCount,
	min: z.number().optional(),
	max: z.number().optional()
});

export const fieldSchema = z
	.object({
		id: z.string().min(1).max(40),
		key: z
			.string()
			.regex(
				/^[a-z][a-z0-9_]{0,39}$/,
				'Use lowercase letters, numbers and underscores, starting with a letter.'
			),
		type: z.enum(FIELD_TYPES),
		label: z.string().trim().max(500),
		/** HTML, for text blocks. */
		content: z.string().max(50_000).optional(),
		caption: optionalText(1000),
		placeholder: optionalText(200),
		required: z.boolean().optional(),
		width: z.enum(['full', 'half']).optional(),
		options: z.array(optionSchema).max(200).optional(),
		allowOther: z.boolean().optional(),
		rows: z.number().int().min(2).max(20).optional(),
		defaultValue: optionalText(500),
		urlParam: z
			.string()
			.regex(/^[A-Za-z0-9_-]{1,40}$/, 'Letters, numbers, dashes and underscores only.')
			.optional(),
		validation: validationSchema.optional(),
		visibility: visibilitySchema.nullable().optional(),
		/** Removed from the form, but kept because submissions have answers for it. */
		archived: z.boolean().optional()
	})
	.superRefine((field, ctx) => {
		const issue = (path: string, message: string) =>
			ctx.addIssue({ code: 'custom', path: [path], message });
		if (field.type !== 'rich_text' && !field.label) issue('label', 'Give this a label.');
		if (RESERVED_KEYS.has(field.key))
			issue('key', `"${field.key}" is reserved for email templates.`);
		if (CHOICE_TYPES.has(field.type)) {
			if (!field.options?.length) issue('options', 'Add at least one option.');
			const labels = (field.options ?? []).map((o) => o.label.toLowerCase());
			if (new Set(labels).size !== labels.length)
				issue('options', 'Two options have the same label.');
		}
		if (field.type === 'hidden' && !field.urlParam)
			issue('urlParam', 'Which link parameter fills this in?');
		const v = field.validation;
		if (v?.regex) {
			try {
				new RegExp(v.regex);
			} catch {
				issue('validation', "That pattern isn't a valid regular expression.");
			}
		}
		if (v?.minLength !== undefined && v.maxLength !== undefined && v.minLength > v.maxLength) {
			issue('validation', 'The minimum length is more than the maximum.');
		}
		if (v?.min !== undefined && v.max !== undefined && v.min > v.max) {
			issue('validation', 'The minimum is more than the maximum.');
		}
	});

export const endingSchema = z.object({
	id: z.string().min(1).max(40),
	condition: conditionSchema.nullable().optional(),
	html: z.string().max(50_000)
});

export const formDefinitionSchema = z
	.object({
		title: z.string().trim().min(1, 'Give the form a title.').max(200),
		slug: z
			.string()
			.trim()
			.regex(
				/^[a-z0-9]+(?:-[a-z0-9]+)*$/,
				'Lowercase letters, numbers and dashes, like "interest".'
			)
			.max(60),
		status: z.enum(['draft', 'open', 'closed']),
		submitLabel: z.string().trim().min(1, 'The submit button needs a label.').max(60),
		closedMessage: z.string().trim().max(2000),
		emailFieldId: z.string().nullable(),
		fields: z.array(fieldSchema).max(200),
		endings: z.array(endingSchema).min(1, 'A form needs at least one ending.').max(20)
	})
	.superRefine((form, ctx) => {
		const issue = (path: (string | number)[], message: string) =>
			ctx.addIssue({ code: 'custom', path, message });

		const ids = new Set<string>();
		const keys = new Set<string>();
		const inputs = new Map<string, (typeof form.fields)[number]>();
		form.fields.forEach((field, i) => {
			if (ids.has(field.id)) issue(['fields', i, 'id'], 'Duplicate field id.');
			ids.add(field.id);
			if (keys.has(field.key))
				issue(['fields', i, 'key'], `Another field already uses the key "${field.key}".`);
			keys.add(field.key);
			if (!DISPLAY_TYPES.has(field.type)) inputs.set(field.id, field);
		});

		const checkRules = (
			rules: { field: string; op: string; value?: string }[],
			path: (string | number)[],
			selfId?: string
		) =>
			rules.forEach((rule, r) => {
				const target = inputs.get(rule.field);
				if (!target || target.archived)
					issue([...path, r], 'A rule refers to a question that no longer exists.');
				else if (rule.field === selfId) issue([...path, r], "A question can't depend on itself.");
				else if (!UNARY_OPERATORS.has(rule.op as never) && !rule.value?.trim())
					issue([...path, r], 'A rule is missing its value.');
			});

		form.fields.forEach((field, i) => {
			if (field.visibility)
				checkRules(field.visibility.rules, ['fields', i, 'visibility'], field.id);
		});
		form.endings.forEach((ending, i) => {
			if (ending.condition) checkRules(ending.condition.rules, ['endings', i, 'condition']);
		});

		if (form.emailFieldId) {
			const field = inputs.get(form.emailFieldId);
			if (!field || field.type !== 'email' || field.archived) {
				issue(['emailFieldId'], 'The email field must be one of the email questions.');
			}
		}
	});

export type FieldOption = z.output<typeof optionSchema>;
export type Field = z.output<typeof fieldSchema>;
export type Ending = z.output<typeof endingSchema>;
export type FormDefinition = z.output<typeof formDefinitionSchema>;
