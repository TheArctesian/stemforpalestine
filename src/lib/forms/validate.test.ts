import { describe, expect, it } from 'vitest';
import { formDefinitionSchema, type FormDefinition } from './definition';
import { OTHER_VALUE, otherInputName } from './fields';
import { FORM_TEMPLATES } from './templates';
import {
	normalizeAnswers,
	pickEnding,
	readFormData,
	submissionEmail,
	validateSubmission,
	visibleFieldIds,
	type RawAnswers
} from './validate';

const interest = FORM_TEMPLATES.find((t) => t.id === 'interest')!.build();
const byKey = (form: FormDefinition, key: string) => form.fields.find((f) => f.key === key)!;

/** Raw answers for the interest form, keyed by field key for readability. */
function interestAnswers(overrides: Record<string, string | string[]> = {}): RawAnswers {
	const values: Record<string, string | string[]> = {
		name: 'Leila Haddad',
		email: 'leila@example.org',
		phone: '(510) 555-0134',
		affiliation: 'Student',
		department: 'EECS',
		mailing_list: 'Yes',
		membership_interest: 'Yes',
		onboarding: 'Yes',
		why_interested: 'I want to organize.',
		help_areas: ['Events', 'Tech Projects'],
		...overrides
	};
	return Object.fromEntries(
		Object.entries(values).map(([key, value]) => [byKey(interest, key).id, value])
	);
}

describe('the interest form template', () => {
	it('is a valid form definition', () => {
		const result = formDefinitionSchema.safeParse(interest);
		expect(result.success ? [] : result.error.issues).toEqual([]);
	});

	it('accepts a complete answer', () => {
		const { errors, answers } = validateSubmission(interest, interestAnswers());
		expect(errors).toEqual({});
		expect(answers[byKey(interest, 'help_areas').id]).toEqual(['Events', 'Tech Projects']);
		expect(submissionEmail(interest, answers)).toBe('leila@example.org');
	});

	it('needs a first and last name, with Fillout’s message', () => {
		const { errors } = validateSubmission(interest, interestAnswers({ name: 'Leila' }));
		expect(errors[byKey(interest, 'name').id]).toBe('Please include both first and last name.');
	});

	it('turns away Berkeley emails, whatever the case', () => {
		for (const email of ['someone@berkeley.edu', 'Someone@EECS.Berkeley.EDU']) {
			const { errors } = validateSubmission(interest, interestAnswers({ email }));
			expect(errors[byKey(interest, 'email').id]).toBe('Please enter a non-Berkeley email.');
		}
	});

	it('drops the onboarding questions when you say no to onboarding', () => {
		const raw = interestAnswers({
			onboarding: 'No',
			phone: '',
			why_interested: '',
			help_areas: []
		});
		const { errors } = validateSubmission(interest, raw);
		expect(errors).toEqual({});

		const visible = visibleFieldIds(interest, normalizeAnswers(interest, raw));
		for (const key of ['phone', 'why_interested', 'help_areas', 'met_member', 'other_interests']) {
			expect(visible.has(byKey(interest, key).id)).toBe(false);
		}
	});

	it('requires the onboarding questions when you say yes', () => {
		const { errors } = validateSubmission(
			interest,
			interestAnswers({ phone: '', why_interested: '', help_areas: [] })
		);
		expect(Object.keys(errors).sort()).toEqual(
			['phone', 'why_interested', 'help_areas'].map((k) => byKey(interest, k).id).sort()
		);
	});

	it('shows the "met a member" and "elaborate" questions only for onboarding', () => {
		const before = visibleFieldIds(interest, {});
		expect(before.has(byKey(interest, 'met_member').id)).toBe(false);
		expect(before.has(byKey(interest, 'phone').id)).toBe(true);

		const yes = visibleFieldIds(interest, normalizeAnswers(interest, interestAnswers()));
		expect(yes.has(byKey(interest, 'met_member').id)).toBe(true);
		expect(yes.has(byKey(interest, 'other_interests').id)).toBe(true);
	});

	it('doesn’t store answers to questions that were hidden', () => {
		const { answers } = validateSubmission(interest, interestAnswers({ onboarding: 'No' }));
		expect(answers[byKey(interest, 'phone').id]).toBeUndefined();
		expect(answers[byKey(interest, 'why_interested').id]).toBeUndefined();
	});

	it('takes "Other" with the typed text for how you heard about us', () => {
		const field = byKey(interest, 'referral_source');
		const raw = {
			...interestAnswers(),
			[field.id]: OTHER_VALUE,
			[otherInputName(field.id)]: 'SoCo event'
		};
		const { answers, errors } = validateSubmission(interest, raw);
		expect(errors).toEqual({});
		expect(answers[field.id]).toBe('SoCo event');

		const empty = validateSubmission(interest, { ...raw, [otherInputName(field.id)]: ' ' });
		expect(empty.errors[field.id]).toBe('Please fill in “Other”.');
	});

	it('rejects choices that aren’t options', () => {
		const { errors } = validateSubmission(interest, interestAnswers({ affiliation: 'Hacker' }));
		expect(errors[byKey(interest, 'affiliation').id]).toBe('Choose one of the options.');
	});
});

describe('field validation', () => {
	const form: FormDefinition = {
		...interest,
		fields: [
			{ id: 'p', key: 'phone', type: 'phone', label: 'Phone' },
			{ id: 'n', key: 'n', type: 'number', label: 'N', validation: { min: 1, max: 10 } },
			{ id: 'u', key: 'u', type: 'url', label: 'U' },
			{ id: 'd', key: 'd', type: 'date', label: 'D' },
			{
				id: 't',
				key: 't',
				type: 'short_text',
				label: 'T',
				validation: { minLength: 3, maxLength: 5 }
			},
			{ id: 'c', key: 'c', type: 'checkbox', label: 'Agree', required: true },
			{ id: 'h', key: 'h', type: 'hidden', label: 'Ref', urlParam: 'ref' }
		]
	};

	it('checks each type', () => {
		const { errors } = validateSubmission(form, {
			p: '12',
			n: '11',
			u: 'javascript:alert(1)',
			d: '2026-13-45',
			t: 'ab'
		});
		expect(errors).toEqual({
			p: 'Enter a valid phone number.',
			n: 'Enter 10 or less.',
			u: 'Enter a full link, starting with https://',
			d: 'Enter a valid date.',
			t: 'Use at least 3 characters.',
			c: 'Please check this box.'
		});
	});

	it('accepts good values and keeps hidden ones', () => {
		const { errors, answers } = validateSubmission(form, {
			p: '+1 510 555 0134',
			n: '7',
			u: 'https://stem4pal.org',
			d: '2026-10-08',
			t: 'abcd',
			c: 'on',
			h: 'poster'
		});
		expect(errors).toEqual({});
		expect(answers).toMatchObject({ c: true, h: 'poster', n: '7' });
	});
});

describe('readFormData', () => {
	it('reads checkbox lists and "Other" text', () => {
		const form = { fields: [byKey(interest, 'help_areas'), byKey(interest, 'referral_source')] };
		const data = new FormData();
		data.append(form.fields[0].id, 'Events');
		data.append(form.fields[0].id, 'Tech Projects');
		data.append(form.fields[1].id, OTHER_VALUE);
		data.append(otherInputName(form.fields[1].id), 'A friend');
		expect(readFormData(form, data)).toEqual({
			[form.fields[0].id]: ['Events', 'Tech Projects'],
			[form.fields[1].id]: OTHER_VALUE,
			[otherInputName(form.fields[1].id)]: 'A friend'
		});
	});
});

describe('pickEnding', () => {
	it('uses the first matching ending, falling back to the last', () => {
		const endings = [
			{
				id: 'a',
				condition: {
					match: 'all' as const,
					rules: [{ field: 'x', op: 'equals' as const, value: 'Yes' }]
				},
				html: 'A'
			},
			{ id: 'b', condition: null, html: 'B' }
		];
		expect(pickEnding(endings, { x: 'Yes' })?.id).toBe('a');
		expect(pickEnding(endings, { x: 'No' })?.id).toBe('b');
	});
});
