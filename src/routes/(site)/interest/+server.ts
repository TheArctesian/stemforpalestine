import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { forms } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

/** Until the new interest form is open, the old Fillout one keeps taking sign-ups. */
const FILLOUT_URL = 'https://stem4pal.fillout.com/interest';

// stem4pal.org/interest: the short link the site (and posters) use for signing up.
export const GET: RequestHandler = async () => {
	const [form] = await db
		.select({ status: forms.status })
		.from(forms)
		.where(eq(forms.slug, 'interest'));
	redirect(307, form?.status === 'open' ? '/forms/interest' : FILLOUT_URL);
};
