import { describe, expect, it } from 'vitest';
import { formDefinitionSchema, type FormDefinition } from './definition';
import { slugifyKey, slugifyUrl } from './fields';
import { FORM_TEMPLATES } from './templates';

const blank = () => FORM_TEMPLATES.find((t) => t.id === 'blank')!.build();

function issues(form: FormDefinition): string[] {
	const result = formDefinitionSchema.safeParse(form);
	return result.success ? [] : result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
}

describe('formDefinitionSchema', () => {
	it('accepts every template', () => {
		for (const template of FORM_TEMPLATES) expect(issues(template.build())).toEqual([]);
	});

	it('rejects duplicate keys and reserved keys', () => {
		const form = blank();
		form.fields[1].key = 'name';
		expect(issues(form)).toContain('fields.1.key: Another field already uses the key "name".');
		form.fields[1].key = 'unsubscribe_url';
		expect(issues(form)).toContain(
			'fields.1.key: "unsubscribe_url" is reserved for email templates.'
		);
	});

	it('rejects rules that point at missing fields', () => {
		const form = blank();
		form.fields[0].visibility = {
			action: 'show',
			match: 'all',
			rules: [{ field: 'gone', op: 'equals', value: 'x' }]
		};
		expect(issues(form)).toContain(
			'fields.0.visibility.0: A rule refers to a question that no longer exists.'
		);
	});

	it('rejects choice fields without options and invalid patterns', () => {
		const form = blank();
		form.fields.push({ id: 'c', key: 'pick', type: 'radio', label: 'Pick', options: [] });
		form.fields[0].validation = { regex: '(' };
		expect(issues(form)).toEqual(
			expect.arrayContaining([
				'fields.2.options: Add at least one option.',
				"fields.0.validation: That pattern isn't a valid regular expression."
			])
		);
	});

	it('needs the email field to be an email question', () => {
		const form = blank();
		form.emailFieldId = form.fields[0].id;
		expect(issues(form)).toContain(
			'emailFieldId: The email field must be one of the email questions.'
		);
	});
});

describe('slugs', () => {
	it('makes placeholder keys from labels', () => {
		expect(slugifyKey("What's your affiliation with UC Berkeley?")).toBe(
			'whats_your_affiliation_with_uc_berkeley'
		);
		expect(slugifyKey('1-on-1 meeting')).toBe('field_1_on_1_meeting');
		expect(slugifyKey('Café ☕')).toBe('cafe');
	});

	it('makes URL slugs from titles', () => {
		expect(slugifyUrl('Principled in Tech: Networking Night!')).toBe(
			'principled-in-tech-networking-night'
		);
	});
});
