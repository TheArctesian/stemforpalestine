import { fail, redirect } from '@sveltejs/kit';
import { desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { requireAdmin } from '$lib/server/permissions';
import { zonedToIso, isoToZoned } from '$lib/data/events';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	events: (
		await db
			.select({
				id: events.id,
				slug: events.slug,
				title: events.title,
				subtitle: events.subtitle,
				startAt: events.startAt,
				venueName: events.venueName,
				status: events.status
			})
			.from(events)
			.orderBy(desc(events.startAt))
	).map((e) => ({ ...e, startAt: e.startAt.toISOString() }))
});

async function uniqueSlug(base: string): Promise<string> {
	const taken = new Set((await db.select({ slug: events.slug }).from(events)).map((e) => e.slug));
	let slug = base;
	for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
	return slug;
}

export const actions: Actions = {
	create: async ({ locals }) => {
		const me = requireAdmin(locals);
		// A week from now at 7 PM, Bay Area time: a placeholder to edit.
		const { date } = isoToZoned(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
		const [event] = await db
			.insert(events)
			.values({
				slug: await uniqueSlug('new-event'),
				title: 'Untitled event',
				summary: '',
				startAt: new Date(zonedToIso(date, '19:00')),
				endAt: new Date(zonedToIso(date, '21:00')),
				venueName: '',
				venueAddress: '',
				rsvpUrl: '',
				posterUrl: '',
				posterAlt: '',
				createdBy: me.id,
				updatedBy: me.id
			})
			.returning({ id: events.id });
		redirect(303, `/admin/events/${event.id}`);
	},

	// For a recurring series: everything copied, as a draft, a week later.
	duplicate: async ({ request, locals }) => {
		const me = requireAdmin(locals);
		const id = z.uuid().safeParse((await request.formData()).get('id'));
		if (!id.success) return fail(400, { message: 'Unknown event.' });
		const [original] = await db.select().from(events).where(eq(events.id, id.data));
		if (!original) return fail(404, { message: 'Unknown event.' });
		const week = 7 * 24 * 60 * 60 * 1000;
		const [copy] = await db
			.insert(events)
			.values({
				...original,
				id: undefined,
				slug: await uniqueSlug(`${original.slug}-copy`),
				status: 'draft',
				startAt: new Date(original.startAt.getTime() + week),
				endAt: new Date(original.endAt.getTime() + week),
				createdBy: me.id,
				updatedBy: me.id,
				createdAt: undefined,
				updatedAt: undefined
			})
			.returning({ id: events.id });
		redirect(303, `/admin/events/${copy.id}`);
	}
};
