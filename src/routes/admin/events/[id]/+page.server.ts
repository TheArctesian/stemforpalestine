import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { events } from '$lib/server/db/schema';
import { isUniqueViolation } from '$lib/server/db/errors';
import { eventInputSchema, toEventColumns, type EventInput } from '$lib/server/event-input';
import { requireAdmin } from '$lib/server/permissions';
import { isoToZoned } from '$lib/data/events';
import type { Actions, PageServerLoad } from './$types';

async function findEvent(id: string) {
	if (!z.uuid().safeParse(id).success) error(404, 'Event not found');
	const [event] = await db.select().from(events).where(eq(events.id, id));
	if (!event) error(404, 'Event not found');
	return event;
}

export const load: PageServerLoad = async ({ params }) => {
	const e = await findEvent(params.id);
	const start = isoToZoned(e.startAt);
	const input: EventInput = {
		title: e.title,
		subtitle: e.subtitle ?? '',
		slug: e.slug,
		summary: e.summary,
		description: e.description,
		date: start.date,
		startTime: start.time,
		endTime: isoToZoned(e.endAt).time,
		venueName: e.venueName,
		venueAddress: e.venueAddress,
		venueUrl: e.venueUrl ?? '',
		rsvpUrl: e.rsvpUrl,
		rsvpLabel: e.rsvpLabel,
		rsvpBannerText: e.rsvpBannerText ?? '',
		posterUrl: e.posterUrl,
		posterWidth: e.posterWidth,
		posterHeight: e.posterHeight,
		posterAlt: e.posterAlt,
		posterPdfUrl: e.posterPdfUrl ?? '',
		agenda: e.agenda,
		speakers: e.speakers,
		speakerCards: e.speakerCards,
		partners: e.partners.map((p) => ({ name: p.name, url: p.url ?? '' })),
		notes: e.notes,
		status: e.status
	};
	return { id: e.id, input, publishedSlug: e.status === 'published' ? e.slug : null };
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const me = requireAdmin(locals);
		const event = await findEvent(params.id);
		let raw: unknown;
		try {
			raw = JSON.parse(String((await request.formData()).get('event') ?? ''));
		} catch {
			return fail(400, { issues: ['The form data was garbled. Reload and try again.'] });
		}
		const parsed = eventInputSchema.safeParse(raw);
		if (!parsed.success) return fail(400, { issues: parsed.error.issues.map((i) => i.message) });
		try {
			await db
				.update(events)
				.set({ ...toEventColumns(parsed.data), updatedBy: me.id })
				.where(eq(events.id, event.id));
		} catch (e) {
			if (isUniqueViolation(e))
				return fail(400, { issues: ['Another event already uses this address.'] });
			throw e;
		}
		return { saved: true };
	},

	delete: async ({ params, locals }) => {
		requireAdmin(locals);
		const event = await findEvent(params.id);
		await db.delete(events).where(eq(events.id, event.id));
		redirect(303, `/admin/events?deleted=${encodeURIComponent(event.title)}`);
	}
};
