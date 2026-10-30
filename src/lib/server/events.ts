import { error } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { events, type EventRow } from '$lib/server/db/schema';
import type { StemEvent } from '$lib/data/events';

/** A database row as the shape the event pages use. */
export function toStemEvent(row: EventRow): StemEvent & { status: EventRow['status'] } {
	return {
		slug: row.slug,
		title: row.title,
		subtitle: row.subtitle ?? undefined,
		summary: row.summary,
		description: row.description,
		start: row.startAt.toISOString(),
		end: row.endAt.toISOString(),
		venue: { name: row.venueName, address: row.venueAddress, url: row.venueUrl ?? undefined },
		rsvpUrl: row.rsvpUrl,
		rsvpLabel: row.rsvpLabel,
		rsvpBannerText: row.rsvpBannerText ?? undefined,
		poster: row.posterUrl,
		posterWidth: row.posterWidth ?? undefined,
		posterHeight: row.posterHeight ?? undefined,
		posterAlt: row.posterAlt,
		posterPdf: row.posterPdfUrl ?? undefined,
		agenda: row.agenda,
		speakers: row.speakers,
		speakerCards: row.speakerCards,
		partners: row.partners,
		notes: row.notes,
		status: row.status
	};
}

export async function publishedEvents(): Promise<StemEvent[]> {
	const rows = await db
		.select()
		.from(events)
		.where(eq(events.status, 'published'))
		.orderBy(asc(events.startAt));
	return rows.map(toStemEvent);
}

/** Drafts are visible only to admins (as a preview). */
export async function findEventForPage(slug: string, isAdmin: boolean) {
	const [row] = await db.select().from(events).where(eq(events.slug, slug));
	if (!row || (row.status === 'draft' && !isAdmin)) error(404, 'Event not found');
	return toStemEvent(row);
}
