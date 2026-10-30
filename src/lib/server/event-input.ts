import { z } from 'zod';
import { zonedToIso } from '$lib/data/events';

/*
 * What the event editor sends. Drafts can be half-finished; publishing needs everything the
 * public page shows.
 */

const text = (max: number) => z.string().trim().max(max);
const url = z
	.string()
	.trim()
	.max(2000)
	.refine(
		(v) => !v || /^(https?:\/\/|\/)/.test(v),
		'Use a full link (https://…) or a path starting with /.'
	);

export const eventInputSchema = z
	.object({
		title: text(200).min(1, 'Give the event a title.'),
		subtitle: text(200),
		slug: z
			.string()
			.trim()
			.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes.')
			.max(80),
		summary: text(500),
		description: z.array(text(5000)).max(30),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
		startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Pick a start time.'),
		endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Pick an end time.'),
		venueName: text(200),
		venueAddress: text(300),
		venueUrl: url,
		rsvpUrl: url,
		rsvpLabel: text(60).min(1, 'The RSVP button needs a label.'),
		rsvpBannerText: text(200),
		posterUrl: url,
		posterWidth: z.number().int().positive().max(20000).nullable(),
		posterHeight: z.number().int().positive().max(20000).nullable(),
		posterAlt: text(1000),
		posterPdfUrl: url,
		agenda: z.array(z.object({ time: text(40), title: text(300) })).max(40),
		speakers: z.array(text(300)).max(40),
		speakerCards: z
			.array(
				z.object({
					name: text(120).min(1, 'Every speaker card needs a name.'),
					role: text(160),
					bio: text(280),
					imageUrl: url
				})
			)
			.max(40),
		partners: z
			.array(z.object({ name: text(160).min(1, 'Every partner needs a name.'), url }))
			.max(40),
		notes: z.array(text(300)).max(20),
		status: z.enum(['draft', 'published'])
	})
	.superRefine((e, ctx) => {
		if (e.status !== 'published') return;
		const need: [keyof typeof e, string][] = [
			['summary', 'a summary'],
			['venueName', 'a venue'],
			['venueAddress', 'an address'],
			['rsvpUrl', 'an RSVP link'],
			['posterUrl', 'a poster'],
			['posterAlt', 'a description of the poster (alt text)']
		];
		for (const [key, what] of need) {
			if (!e[key])
				ctx.addIssue({ code: 'custom', path: [key], message: `To publish, add ${what}.` });
		}
	});

export type EventInput = z.infer<typeof eventInputSchema>;

/** Input → database columns. An end time before the start time means it runs past midnight. */
export function toEventColumns(input: EventInput) {
	const startAt = new Date(zonedToIso(input.date, input.startTime));
	let endAt = new Date(zonedToIso(input.date, input.endTime));
	if (endAt <= startAt) endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
	const clean = (list: string[]) => list.map((v) => v.trim()).filter(Boolean);
	return {
		title: input.title,
		subtitle: input.subtitle || null,
		slug: input.slug,
		summary: input.summary,
		description: clean(input.description),
		startAt,
		endAt,
		venueName: input.venueName,
		venueAddress: input.venueAddress,
		venueUrl: input.venueUrl || null,
		rsvpUrl: input.rsvpUrl,
		rsvpLabel: input.rsvpLabel,
		rsvpBannerText: input.rsvpBannerText || null,
		posterUrl: input.posterUrl,
		posterWidth: input.posterWidth,
		posterHeight: input.posterHeight,
		posterAlt: input.posterAlt,
		posterPdfUrl: input.posterPdfUrl || null,
		agenda: input.agenda.filter((a) => a.time || a.title),
		speakers: clean(input.speakers),
		speakerCards: input.speakerCards,
		partners: input.partners.map((p) => ({ name: p.name, url: p.url || undefined })),
		notes: clean(input.notes),
		status: input.status
	};
}
