import { describe, expect, it } from 'vitest';
import { guessMapping, importAnswers, splitChoices, SUBMITTED_AT, unlistedChoices } from './import';
import { FORM_TEMPLATES } from './templates';

const interest = FORM_TEMPLATES.find((t) => t.id === 'interest')!.build();
const byKey = (key: string) => interest.fields.find((f) => f.key === key)!;

describe('splitChoices', () => {
	const options = ['Events', '1-4 hours, want to be involved', 'Tech Projects'];

	it('splits on commas and semicolons', () => {
		expect(splitChoices('Events, Tech Projects', options)).toEqual(['Events', 'Tech Projects']);
		expect(splitChoices('Events;Tech Projects', options)).toEqual(['Events', 'Tech Projects']);
	});

	it('keeps options that contain commas together', () => {
		expect(splitChoices('1-4 hours, want to be involved, Events', options)).toEqual([
			'1-4 hours, want to be involved',
			'Events'
		]);
	});

	it('keeps unknown text and fixes the case of known options', () => {
		expect(splitChoices('events, Zines', options)).toEqual(['Events', 'Zines']);
	});
});

describe('guessMapping', () => {
	it('matches Fillout headers to questions by their label', () => {
		const mapping = guessMapping(
			[
				'Submission ID',
				'Submitted at',
				'Name (First + Last)',
				'Email (please list non-Berkeley email)',
				'What are you interested in helping with? (Check all that apply)'
			],
			interest.fields
		);
		expect(mapping).toEqual({
			'Submitted at': SUBMITTED_AT,
			'Name (First + Last)': byKey('name').id,
			'Email (please list non-Berkeley email)': byKey('email').id,
			'What are you interested in helping with? (Check all that apply)': byKey('help_areas').id
		});
	});

	it('also matches keys, and Google Forms timestamps', () => {
		expect(guessMapping(['Timestamp', 'mailing_list'], interest.fields)).toEqual({
			Timestamp: SUBMITTED_AT,
			mailing_list: byKey('mailing_list').id
		});
	});
});

describe('importAnswers', () => {
	it('converts cells by question type', () => {
		const answers = importAnswers(interest.fields, {
			[byKey('email').id]: ' Leila@Example.org ',
			[byKey('mailing_list').id]: 'yes',
			[byKey('help_areas').id]: 'Events, Tech Projects',
			[byKey('name').id]: '',
			[byKey('referral_source').id]: 'SoCo event'
		});
		expect(answers).toEqual({
			[byKey('email').id]: 'leila@example.org',
			[byKey('mailing_list').id]: 'Yes',
			[byKey('help_areas').id]: ['Events', 'Tech Projects'],
			[byKey('referral_source').id]: 'SoCo event'
		});
	});

	it('flags values that are not options', () => {
		expect(unlistedChoices(byKey('referral_source'), 'SoCo event')).toEqual(['SoCo event']);
		expect(unlistedChoices(byKey('help_areas'), ['Events'])).toEqual([]);
		expect(unlistedChoices(byKey('name'), 'Anything')).toEqual([]);
	});
});
