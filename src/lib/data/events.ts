import { TZDate } from '@date-fns/tz';

export type EventLink = {
	name: string;
	url?: string;
};

export type SpeakerCard = {
	name: string;
	role: string;
	bio: string;
	imageUrl: string;
};

export type StemEvent = {
	slug: string;
	title: string;
	/** Second line of the title, shown under it in the hero (e.g. "Networking Night"). */
	subtitle?: string;
	/** One or two sentences, used on the events list and as the page's meta description. */
	summary: string;
	description: string[];
	/** ISO 8601 with offset, so the time is unambiguous on the server and in every browser. */
	start: string;
	end: string;
	venue: {
		name: string;
		address: string;
		url?: string;
	};
	rsvpUrl: string;
	/** The RSVP button's label, e.g. "RSVP on Luma". */
	rsvpLabel: string;
	/** The green banner at the bottom of the page; none if empty. */
	rsvpBannerText?: string;
	poster: string;
	/** The poster's size in pixels, so the page doesn't jump while it loads. */
	posterWidth?: number;
	posterHeight?: number;
	posterAlt: string;
	/** Higher-resolution printable poster, served from /static. */
	posterPdf?: string;
	/** Run of show; times are display labels in the event's local time. */
	agenda?: { time: string; title: string }[];
	/** "Speakers will include": a simple list. */
	speakers: string[];
	/** "Meet the speakers": optional cards with a photo, name, role and short bio. */
	speakerCards?: SpeakerCard[];
	partners: EventLink[];
	notes: string[];
};

/** All times are shown in the Bay Area's time zone, wherever the visitor is. */
export const EVENT_TIME_ZONE = 'America/Los_Angeles';

/** A date and time typed in the admin ("2026-10-08", "19:00"), read as Bay Area time → ISO with offset. */
export function zonedToIso(date: string, time: string): string {
	const [y, m, d] = date.split('-').map(Number);
	const [hh, mm] = time.split(':').map(Number);
	return new TZDate(y, m - 1, d, hh, mm, EVENT_TIME_ZONE).toISOString();
}

/** The other way: an instant → its Bay Area date and time, for the admin's inputs. */
export function isoToZoned(iso: string | Date): { date: string; time: string } {
	const t = new TZDate(new Date(iso).getTime(), EVENT_TIME_ZONE);
	const pad = (n: number) => String(n).padStart(2, '0');
	return {
		date: `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`,
		time: `${pad(t.getHours())}:${pad(t.getMinutes())}`
	};
}

export function isPast(event: StemEvent, now = new Date()): boolean {
	return new Date(event.end) < now;
}

/** "Thursday, October 8" */
export function formatEventDate(event: StemEvent): string {
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		timeZone: EVENT_TIME_ZONE
	}).format(new Date(event.start));
}

/** "7–9 PM", or "11 AM–1 PM" when the event crosses noon. */
export function formatEventTime(event: StemEvent): string {
	const format = (iso: string) =>
		new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: 'numeric',
			timeZone: EVENT_TIME_ZONE
		})
			.format(new Date(iso))
			.replace(':00', '');
	const [start, end] = [format(event.start), format(event.end)];
	// Newer ICU versions separate "9" and "PM" with a narrow no-break space, not a plain one.
	const [startTime, startPeriod] = start.split(/\s/);
	const [, endPeriod] = end.split(/\s/);
	return startPeriod === endPeriod ? `${startTime}–${end}` : `${start}–${end}`;
}

/** Short date badge parts for event cards: { month: "Oct", day: "8" }. */
export function eventDateBadge(event: StemEvent): { month: string; day: string } {
	const date = new Date(event.start);
	const part = (options: Intl.DateTimeFormatOptions) =>
		new Intl.DateTimeFormat('en-US', { ...options, timeZone: EVENT_TIME_ZONE }).format(date);
	return { month: part({ month: 'short' }), day: part({ day: 'numeric' }) };
}

export function mapUrl(event: StemEvent): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue.address)}`;
}

export function googleCalendarUrl(event: StemEvent): string {
	const utc = (iso: string) => new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '');
	const params = new URLSearchParams({
		action: 'TEMPLATE',
		text: [event.title, event.subtitle].filter(Boolean).join(' '),
		dates: `${utc(event.start)}/${utc(event.end)}`,
		details: `${event.summary}\n\nRSVP: ${event.rsvpUrl}`,
		location: `${event.venue.name}, ${event.venue.address}`
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}
