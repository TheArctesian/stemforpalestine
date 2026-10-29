import type { Field, FieldOption, FormDefinition } from './definition';
import { newId } from './fields';

/*
 * Starting points for "New form". Each call makes fresh ids, so a template can be used twice.
 */

export type FormTemplate = {
	id: string;
	name: string;
	description: string;
	build: () => FormDefinition;
};

const options = (...labels: string[]): FieldOption[] =>
	labels.map((label) => ({ id: newId(), label }));

const link = (href: string, text: string) =>
	`<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

function blank(): FormDefinition {
	const email = newId();
	return {
		title: 'Untitled form',
		slug: `form-${newId(4)}`,
		status: 'draft',
		submitLabel: 'Submit',
		closedMessage: 'This form is no longer accepting responses.',
		emailFieldId: email,
		fields: [
			{ id: newId(), key: 'name', type: 'short_text', label: 'Name', required: true },
			{ id: email, key: 'email', type: 'email', label: 'Email', required: true }
		],
		endings: [
			{ id: newId(), condition: null, html: '<h2>Thanks!</h2><p>We got your response.</p>' }
		]
	};
}

/**
 * The STEM4Pal interest form, as it was on Fillout (stem4pal.fillout.com/interest): same questions,
 * wording, options, required fields, validation and show/hide rules.
 */
function interest(): FormDefinition {
	const id = {
		name: newId(),
		email: newId(),
		phone: newId(),
		onboarding: newId()
	};
	const whenOnboarding = (action: 'show' | 'hide', value: 'Yes' | 'No') => ({
		action,
		match: 'all' as const,
		rules: [{ field: id.onboarding, op: 'equals' as const, value }]
	});

	const fields: Field[] = [
		{
			id: id.name,
			key: 'name',
			type: 'short_text',
			label: 'Name (First + Last)',
			required: true,
			validation: { regex: '.+\\s.+', message: 'Please include both first and last name.' }
		},
		{
			id: id.email,
			key: 'email',
			type: 'email',
			label: 'Email (please list non-Berkeley email)',
			required: true,
			validation: {
				regex: '^(?:(?!berkeley\\.edu).)*$',
				message: 'Please enter a non-Berkeley email.'
			}
		},
		{
			id: id.phone,
			key: 'phone',
			type: 'phone',
			label: 'Phone number',
			required: true,
			visibility: whenOnboarding('hide', 'No')
		},
		{
			id: newId(),
			key: 'affiliation',
			type: 'dropdown',
			label: "What's your affiliation with UC Berkeley?",
			required: true,
			options: options('Student', 'Faculty', 'Staff', 'Alum', 'Community Member', 'Other')
		},
		{
			id: newId(),
			key: 'department',
			type: 'short_text',
			label: 'What department/major are you in? (ex. EECS, Biology, Media Studies, etc.)',
			required: true
		},
		{
			id: newId(),
			key: 'referral_source',
			type: 'radio',
			label: 'How did you hear about us?',
			options: options('Instagram', 'Tabling / on campus', 'Word of mouth'),
			allowOther: true
		},
		{
			id: newId(),
			key: 'mailing_list',
			type: 'radio',
			label: 'Would you like to be added to our mailing list?',
			required: true,
			options: options('Yes', 'No')
		},
		{
			id: newId(),
			key: 'membership_interest',
			type: 'radio',
			label: 'Are you interested in becoming a member?',
			caption:
				'Members help run and make decisions for the organization internally. Select "no" if you just want to be added to our mailing list.',
			required: true,
			options: options('Yes', 'No')
		},
		{
			id: newId(),
			key: 'weekly_commitment',
			type: 'radio',
			label: 'How much time do you want to commit to STEM 4 Palestine per week?',
			options: options(
				'0-1 hours, just want to attend events',
				'1-4 hours, want to be involved in organizing (outreach, event planning, campaign work etc.)',
				'4-8 hours, want to get super involved in the org!'
			)
		},
		{
			id: id.onboarding,
			key: 'onboarding',
			type: 'radio',
			label: 'Do you want to schedule a 1-on-1 onboarding meeting?',
			caption:
				'Get to know a member + the organization with a 1-on-1 meeting. We will reach out to you!',
			required: true,
			options: options('Yes', 'No')
		},
		{
			id: newId(),
			key: 'met_member',
			type: 'short_text',
			label: "Is there a S4P member who you've already met? If yes, we'll have them onboard you!",
			visibility: whenOnboarding('show', 'Yes')
		},
		{
			id: newId(),
			key: 'why_interested',
			type: 'long_text',
			label: 'Why are you interested in STEM4Palestine?',
			required: true,
			rows: 4,
			visibility: whenOnboarding('hide', 'No')
		},
		{
			id: newId(),
			key: 'help_areas',
			type: 'checkboxes',
			label: 'What are you interested in helping with? (Check all that apply)',
			required: true,
			options: options(
				'Political Education',
				'Communications',
				'Membership & Recruitment',
				'Events',
				'Deflock Campaign',
				'Divestment Research',
				'Tech Projects',
				'Other'
			),
			visibility: whenOnboarding('hide', 'No')
		},
		{
			id: newId(),
			key: 'other_interests',
			type: 'long_text',
			label:
				"If there's something you're interested in working on that wasn't listed, please elaborate here!",
			rows: 4,
			visibility: whenOnboarding('show', 'Yes')
		},
		{
			id: newId(),
			key: 'instagram_note',
			type: 'rich_text',
			label: '',
			content: `<p>Check out our Instagram ${link('https://www.instagram.com/berkeleystem4palestine/', '@berkeleystem4palestine')} for events and announcements, and ${link('https://stem4pal.org', 'stem4pal.org')} for more information.</p>`
		}
	];

	return {
		title: 'STEM4Palestine Interest Form',
		slug: 'interest',
		status: 'draft',
		submitLabel: 'Submit',
		closedMessage: 'This form is closed right now. Email info@stem4pal.org to get involved.',
		emailFieldId: id.email,
		fields,
		endings: [
			{
				id: newId(),
				condition: null,
				html: [
					'<h2 style="text-align: center;">Thank you for your interest in STEM4Palestine</h2>',
					'<p style="text-align: center;">We hope to see you in-person at an event or tabling soon!</p>',
					'<h4 style="text-align: center;">Check out our Instagram, Youtube, and website:</h4>',
					`<p style="text-align: center;">${link('https://www.instagram.com/berkeleystem4palestine/', 'Instagram')} · ${link('https://www.youtube.com/watch?v=E62y6lnJIJQ', 'YouTube')} · ${link('https://stem4pal.org', 'stem4pal.org')}</p>`
				].join('')
			}
		]
	};
}

export const FORM_TEMPLATES: FormTemplate[] = [
	{
		id: 'blank',
		name: 'Blank form',
		description: 'Name and email questions to start from.',
		build: blank
	},
	{
		id: 'interest',
		name: 'Interest form',
		description: 'The STEM4Pal interest form from Fillout, with all its questions and logic.',
		build: interest
	}
];
