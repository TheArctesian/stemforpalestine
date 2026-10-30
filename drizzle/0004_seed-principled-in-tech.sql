-- The first event, until now hard-coded in src/lib/data/events.ts, moved into the database as it
-- was so its page doesn't change. Skipped if an event with this slug already exists.
INSERT INTO "events" (
	"slug", "title", "subtitle", "summary", "description", "start_at", "end_at",
	"venue_name", "venue_address", "venue_url", "rsvp_url", "rsvp_label", "rsvp_banner_text",
	"poster_url", "poster_width", "poster_height", "poster_alt", "poster_pdf_url",
	"agenda", "speakers", "speaker_cards", "partners", "notes", "status"
) VALUES (
	'principled-in-tech-10-08',
	'Principled in Tech',
	'Networking Night',
	$$A panel and networking night where Bay Area tech workers with organizing experience connect with Berkeley students and community members.$$,
	ARRAY[
		$$Principled in Tech Night brings together tech workers in the Bay Area who have labor and political organizing experience with Berkeley students and community members, especially those planning on entering the tech or STEM industries.$$,
		$$Gain insight into how you can remain principled while employed, and how to leverage your power in the industry to make change.$$,
		$$This is the first in a monthly recurring series. Dinner will be provided, and there will be plenty of time to network with our speakers.$$
	],
	'2026-10-08T19:00:00-07:00',
	'2026-10-08T21:00:00-07:00',
	'Solidarity Collective (SoCo)',
	'2170 Dwight Way, Berkeley, CA',
	'https://www.soco.place/',
	'https://luma.com/koe7fxe6',
	'RSVP on Luma',
	'Dinner is provided if you RSVP. Save your spot',
	'/events/principled-in-tech-10-08.jpg',
	1536,
	2048,
	$$Poster: STEM4Palestine presents Principled in Tech Networking Night, October 8th, 7–9 PM at Solidarity Collective, 2170 Dwight Way. RSVP at luma.com/koe7fxe6. Dinner is provided if you RSVP.$$,
	'/events/principled-in-tech-10-08.pdf',
	$$[
		{"time": "7:00–7:15", "title": "Mingle, name tags and food"},
		{"time": "7:15–8:15", "title": "Facilitated panel"},
		{"time": "8:20–8:40", "title": "Small group discussion with provided questions"},
		{"time": "8:40–9:00", "title": "Mingle and dinner"}
	]$$::jsonb,
	ARRAY[
		$$Former Google and Amazon employees$$,
		$$Organizers with Tech Workers' Coalition and No Tech for Apartheid$$,
		$$A brief appearance from a current City Council candidate with Big Tech experience$$,
		$$And more!$$
	],
	'[]'::jsonb,
	$$[
		{"name": "Tech Workers' Coalition", "url": "https://techworkerscoalition.org"},
		{"name": "No Tech for Apartheid", "url": "https://www.notechforapartheid.com"},
		{"name": "Solidarity Collective", "url": "https://www.soco.place/"}
	]$$::jsonb,
	ARRAY[$$Dinner is provided if you RSVP$$, $$Open to students and community members$$],
	'published'
) ON CONFLICT ("slug") DO NOTHING;
