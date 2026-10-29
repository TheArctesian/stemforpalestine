import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { formSubmissions } from '$lib/server/db/schema';
import { checkFormToken, findFormBySlug, formToken } from '$lib/server/forms';
import { hit } from '$lib/server/rate-limit';
import { hashIp } from '$lib/server/secret';
import {
	pickEnding,
	readFormData,
	submissionEmail,
	validateSubmission,
	type RawAnswers
} from '$lib/forms/validate';
import type { Actions, PageServerLoad } from './$types';

const SUBMIT_LIMIT = { max: 10, windowMs: 60 * 60 * 1000 };

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const form = await findFormBySlug(params.slug);
	const isAdmin = locals.user?.role === 'admin';
	if (form.status === 'draft' && !isAdmin) error(404, 'Form not found');

	// Hidden fields take their value from the link (?ref=poster); others can have a default.
	const prefill: RawAnswers = {};
	for (const field of form.fields) {
		if (field.archived) continue;
		const fromLink = field.urlParam ? url.searchParams.get(field.urlParam) : null;
		if (fromLink) prefill[field.id] = fromLink.slice(0, 500);
		else if (field.defaultValue) prefill[field.id] = field.defaultValue;
	}

	return {
		form: {
			id: form.id,
			title: form.title,
			status: form.status,
			submitLabel: form.submitLabel,
			closedMessage: form.closedMessage,
			fields: form.fields.filter((field) => !field.archived)
		},
		prefill,
		token: formToken(form.id),
		preview: form.status === 'draft'
	};
};

export const actions: Actions = {
	default: async ({ request, params, getClientAddress }) => {
		const form = await findFormBySlug(params.slug);
		if (form.status !== 'open') {
			return fail(403, {
				message:
					form.status === 'draft'
						? "Draft forms can't be submitted."
						: form.closedMessage || 'This form is closed.'
			});
		}

		const data = await request.formData();
		const ending = () => pickEnding(form.endings, {})?.html ?? '';

		// Bots fill in the invisible "website" field, or post within seconds of loading the page.
		// Act as if it worked, so they don't learn to work around it.
		if (String(data.get('website') ?? '')) return { ending: ending() };
		const token = checkFormToken(form.id, String(data.get('_t') ?? ''));
		if (token === 'invalid') {
			return fail(400, { message: 'Something went wrong. Please reload the page and try again.' });
		}
		if (token === 'too-fast') return { ending: ending() };

		const ipHash = hashIp(getClientAddress());
		const limit = await hit(`submit:${form.id}:${ipHash}`, SUBMIT_LIMIT);
		if (limit.limited) {
			return fail(429, {
				message: 'Too many submissions from your connection. Please try again later.'
			});
		}

		const raw = readFormData(form, data);
		const { answers, errors } = validateSubmission(form, raw);
		if (Object.keys(errors).length) return fail(400, { errors, raw });

		await db.insert(formSubmissions).values({
			formId: form.id,
			data: answers,
			email: submissionEmail(form, answers),
			metadata: {
				ipHash,
				userAgent: request.headers.get('user-agent')?.slice(0, 300) ?? undefined,
				referrer: request.headers.get('referer')?.slice(0, 500) ?? undefined
			}
		});

		return { ending: pickEnding(form.endings, answers)?.html ?? '' };
	}
};
