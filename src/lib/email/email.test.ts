import { describe, expect, it } from 'vitest';
import type { Field } from '$lib/forms/definition';
import { selectRecipients, type AudienceForm, type AudienceSubmission } from './audience';
import { escapeHtml, fillPlaceholders, recipientVars, usedPlaceholders } from './placeholders';

describe('placeholders', () => {
	it('finds each placeholder once, with fallbacks', () => {
		expect(usedPlaceholders('Hi {{first_name|friend}}, {{ city }} and {{first_name}}')).toEqual([
			{ key: 'first_name', fallback: 'friend' },
			{ key: 'city', fallback: undefined }
		]);
	});

	it('fills values, falls back, and leaves nothing for unknown keys', () => {
		const text = 'Hi {{first_name|friend}} from {{city|the Bay}}{{nope}}!';
		expect(fillPlaceholders(text, { first_name: 'Leila', city: '' })).toBe(
			'Hi Leila from the Bay!'
		);
	});

	it('escapes values for HTML', () => {
		expect(fillPlaceholders('<p>{{name}}</p>', { name: '<b>x</b> & co' }, escapeHtml)).toBe(
			'<p>&lt;b&gt;x&lt;/b&gt; &amp; co</p>'
		);
	});
});

const fields = (keys: string[]): Field[] =>
	keys.map((key) => ({
		id: `${key}-id`,
		key,
		type: key === 'email' ? 'email' : 'short_text',
		label: key
	}));

describe('recipientVars', () => {
	it('maps answers to keys and derives first_name', () => {
		const vars = recipientVars(
			{ title: 'Interest form', fields: fields(['name', 'email', 'help']) },
			{
				data: { 'name-id': 'Leila Haddad', 'help-id': ['Events', 'Zines'] },
				email: 'leila@example.org',
				submittedAt: new Date('2026-10-08T19:00:00-07:00')
			}
		);
		expect(vars).toMatchObject({
			name: 'Leila Haddad',
			first_name: 'Leila',
			email: 'leila@example.org',
			help: 'Events, Zines',
			form_title: 'Interest form',
			submitted_date: 'October 8, 2026'
		});
	});
});

describe('selectRecipients', () => {
	const interest: AudienceForm = {
		id: 'A',
		title: 'Interest',
		fields: fields(['name', 'email', 'city', 'mailing_list'])
	};
	const rsvp: AudienceForm = { id: 'B', title: 'RSVP', fields: fields(['name', 'email', 'city']) };
	const other: AudienceForm = { id: 'C', title: 'Other', fields: fields(['name', 'email']) };

	let n = 0;
	const sub = (
		form: AudienceForm,
		email: string | null,
		answers: Record<string, string>,
		day: number
	): AudienceSubmission => ({
		id: `s${++n}`,
		formId: form.id,
		email,
		submittedAt: new Date(2026, 9, day),
		data: Object.fromEntries(Object.entries(answers).map(([k, v]) => [`${k}-id`, v]))
	});

	const submissions = [
		sub(
			interest,
			'leila@example.org',
			{ name: 'Leila', city: 'San Francisco', mailing_list: 'Yes' },
			1
		),
		sub(rsvp, 'leila@example.org', { name: 'Leila H', city: 'San Francisco' }, 5),
		sub(interest, 'omar@example.org', { name: 'Omar', city: 'Oakland', mailing_list: 'Yes' }, 2),
		sub(rsvp, 'noor@example.org', { name: 'Noor', city: 'san francisco' }, 3),
		sub(other, 'sam@example.org', { name: 'Sam' }, 4),
		sub(interest, null, { name: 'Anon', city: 'San Francisco', mailing_list: 'Yes' }, 6),
		sub(
			interest,
			'gone@example.org',
			{ name: 'Gone', city: 'San Francisco', mailing_list: 'Yes' },
			7
		)
	];

	it('applies a rule by key across forms, dedupes, and drops suppressed addresses', () => {
		const result = selectRecipients(
			[interest, rsvp, other],
			submissions,
			{
				formIds: ['A', 'B', 'C'],
				match: 'all',
				rules: [{ field: 'city', op: 'contains', value: 'san francisco' }],
				excludedEmails: []
			},
			new Set(['gone@example.org'])
		);
		expect(result.recipients.map((r) => r.email)).toEqual([
			'leila@example.org',
			'noor@example.org'
		]);
		// Leila's newest matching submission (the RSVP) supplies her name.
		expect(result.recipients[0].vars.name).toBe('Leila H');
		expect(result.excluded).toEqual({ noEmail: 1, duplicates: 1, suppressed: 1, manual: 0 });
		// The "Other" form has no city question, so nobody there matches.
		expect(result.perForm.find((f) => f.formId === 'C')).toMatchObject({
			submissions: 1,
			matched: 0
		});
	});

	it('only counts each person’s latest answer to a form', () => {
		const changedMind = [
			sub(interest, 'omar@example.org', { name: 'Omar', mailing_list: 'Yes' }, 1),
			sub(interest, 'omar@example.org', { name: 'Omar', mailing_list: 'No' }, 9)
		];
		const result = selectRecipients(
			[interest],
			changedMind,
			{
				formIds: ['A'],
				match: 'all',
				rules: [{ field: 'mailing_list', op: 'equals', value: 'Yes' }],
				excludedEmails: []
			},
			new Set()
		);
		expect(result.recipients).toEqual([]);
	});

	it('supports "any" rules and manual exclusions, and ignores unselected forms', () => {
		const result = selectRecipients(
			[interest, rsvp, other],
			submissions,
			{
				formIds: ['A'],
				match: 'any',
				rules: [
					{ field: 'city', op: 'equals', value: 'Oakland' },
					{ field: 'mailing_list', op: 'equals', value: 'Yes' }
				],
				excludedEmails: ['Omar@Example.org']
			},
			new Set()
		);
		expect(result.recipients.map((r) => r.email)).toEqual([
			'gone@example.org',
			'leila@example.org'
		]);
		expect(result.excluded.manual).toBe(1);
		expect(result.perForm.map((f) => f.formId)).toEqual(['A']);
	});
});
