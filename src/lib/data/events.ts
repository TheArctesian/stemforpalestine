import principledInTech1008Poster from '$lib/assets/events/principled-in-tech-10-08.jpg';

export type EventLink = {
	name: string;
	url?: string;
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
	poster: string;
	posterAlt: string;
	/** Higher-resolution printable poster, served from /static. */
	posterPdf?: string;
	speakers: string[];
	partners: EventLink[];
	notes: string[];
};

/** All times are shown in the Bay Area's time zone, wherever the visitor is. */
export const EVENT_TIME_ZONE = 'America/Los_Angeles';

export const events: StemEvent[] = [
	{
		slug: 'principled-in-tech-10-08',
		title: 'Principled in Tech',
		subtitle: 'Networking Night',
		summary:
			'A panel and networking night where Bay Area tech workers with organizing experience connect with Berkeley students and community members.',
		description: [
			'Principled in Tech Night brings together tech workers in the Bay Area who have labor and political organizing experience with Berkeley students and community members, especially those planning on entering the tech or STEM industries.',
			'Gain insight into how you can remain principled while employed, and how to leverage your power in the industry to make change.',
			'This is the first in a monthly recurring series. Dinner will be provided, and there will be plenty of time to network with our speakers.'
		],
		start: '2026-10-08T19:00:00-07:00',
		end: '2026-10-08T21:00:00-07:00',
		venue: {
			name: 'Solidarity Collective (SoCo)',
			address: '2170 Dwight Way, Berkeley, CA',
			url: 'https://www.soco.place/'
		},
		rsvpUrl: 'https://luma.com/koe7fxe6',
		poster: principledInTech1008Poster,
		posterAlt:
			'Poster: STEM4Palestine presents Principled in Tech Networking Night, October 8th, 7–9 PM at Solidarity Collective, 2170 Dwight Way. RSVP at luma.com/koe7fxe6. Dinner is provided if you RSVP.',
		posterPdf: '/events/principled-in-tech-10-08.pdf',
		speakers: [
			'Former Google and Amazon employees',
			"Organizers with Tech Workers' Coalition and No Tech for Apartheid",
			'A brief appearance from a current City Council candidate with Big Tech experience',
			'And more!'
		],
		partners: [
			{ name: "Tech Workers' Coalition", url: 'https://techworkerscoalition.org' },
			{ name: 'No Tech for Apartheid', url: 'https://www.notechforapartheid.com' },
			{ name: 'Solidarity Collective', url: 'https://www.soco.place/' }
		],
		notes: ['Dinner is provided if you RSVP', 'Open to students and community members']
	}
];

export function getEvent(slug: string): StemEvent | undefined {
	return events.find((event) => event.slug === slug);
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
