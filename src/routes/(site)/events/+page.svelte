<script lang="ts">
	import { reveal } from '$lib/animations/reveal';
	import {
		events,
		eventDateBadge,
		formatEventDate,
		formatEventTime,
		isPast,
		type StemEvent
	} from '$lib/data/events';

	const byStart = (a: StemEvent, b: StemEvent) => a.start.localeCompare(b.start);
	const upcoming = events.filter((event) => !isPast(event)).sort(byStart);
	const past = events.filter((event) => isPast(event)).sort((a, b) => byStart(b, a));
</script>

<svelte:head>
	<title>Events | STEM for Palestine</title>
	<meta
		name="description"
		content="Upcoming STEM4Palestine events: panels, networking nights and teach-ins for Berkeley students and community members."
	/>
</svelte:head>

{#snippet eventCard(event: StemEvent, i: number)}
	{@const badge = eventDateBadge(event)}
	<a href="/events/{event.slug}" class="event-card" data-reveal="up" use:reveal={0.1 * i}>
		<div class="card-poster">
			<img src={event.poster} alt="" width="1536" height="2048" loading="lazy" />
			<span class="date-badge">
				<span class="badge-month">{badge.month}</span>
				<span class="badge-day">{badge.day}</span>
			</span>
		</div>
		<div class="card-body">
			<h3>{[event.title, event.subtitle].filter(Boolean).join(' ')}</h3>
			<p class="card-meta">
				<span><i class="fas fa-calendar-day"></i> {formatEventDate(event)}, {formatEventTime(event)}</span>
				<span><i class="fas fa-location-dot"></i> {event.venue.name}</span>
			</p>
			<p class="card-summary">{event.summary}</p>
			<span class="card-link">Event details →</span>
		</div>
	</a>
{/snippet}

<div class="events-page">
	<section class="hero">
		<div class="container">
			<h1 data-reveal="up" use:reveal>Events</h1>
			<p class="lead" data-reveal="up" use:reveal={0.15}>
				Panels, networking nights and gatherings where students, tech workers and community
				members organize for a STEM industry that serves liberation, not genocide and apartheid.
			</p>
		</div>
	</section>

	<section class="listing">
		<div class="container">
			<h2 data-reveal="up" use:reveal>Upcoming</h2>
			{#if upcoming.length}
				<div class="event-grid">
					{#each upcoming as event, i (event.slug)}
						{@render eventCard(event, i)}
					{/each}
				</div>
			{:else}
				<p class="empty" data-reveal="up" use:reveal>
					No upcoming events right now.
					<a href="https://stem4pal.fillout.com/interest" target="_blank" rel="noopener noreferrer">Join our mailing list</a>
					to hear about the next one.
				</p>
			{/if}

			{#if past.length}
				<h2 class="past-heading" data-reveal="up" use:reveal>Past events</h2>
				<div class="event-grid past">
					{#each past as event, i (event.slug)}
						{@render eventCard(event, i)}
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.hero {
		background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
		color: #ffffff;
		padding: 3rem 0 2.5rem;
		text-align: center;
	}

	.hero h1 {
		font-size: clamp(2rem, 5vw, 2.75rem);
	}

	.lead {
		max-width: 720px;
		margin: 0 auto;
		font-size: 1.15rem;
		line-height: 1.65;
		opacity: 0.95;
	}

	.listing {
		background: var(--color-bg-secondary, #f7fafc);
		padding: 3rem 0 4rem;
	}

	.listing h2 {
		font-size: 1.6rem;
		color: var(--color-text-primary, #2d3748);
		margin-bottom: 1.5rem;
	}

	.past-heading {
		margin-top: 3.5rem;
	}

	.event-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 480px), 1fr));
		gap: 1.5rem;
	}

	.event-card {
		display: grid;
		grid-template-columns: 200px 1fr;
		background: #ffffff;
		border: 2px solid var(--color-border-light, #e2e8f0);
		border-radius: 12px;
		overflow: hidden;
		transition:
			border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			translate 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* `translate`, not `transform`, so the hover lift doesn't fight GSAP's entrance transform. */
	.event-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 12px 30px rgba(0, 150, 57, 0.15);
		translate: 0 -4px;
	}

	.card-poster {
		position: relative;
		background: #0b1029;
	}

	.card-poster img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 4;
		object-fit: cover;
		object-position: top;
	}

	.date-badge {
		position: absolute;
		top: 0.6rem;
		left: 0.6rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 3.1rem;
		padding: 0.3rem 0.5rem;
		border-radius: 8px;
		background: #ffffff;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		line-height: 1.1;
	}

	.badge-month {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		color: #dc2626;
	}

	.badge-day {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--color-text-primary, #2d3748);
	}

	.card-body {
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.card-body h3 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
		color: var(--color-text-primary, #2d3748);
	}

	.card-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		font-size: 0.92rem;
		color: var(--color-text-light, #718096);
		margin-bottom: 0.75rem;
	}

	.card-meta i {
		width: 1.1em;
		color: var(--color-primary);
	}

	.card-summary {
		color: var(--color-text-secondary, #4a5568);
		font-size: 0.98rem;
	}

	.card-link {
		margin-top: auto;
		color: var(--color-primary);
		font-weight: 600;
	}

	/* Not opacity - GSAP's reveal animates that to 1 and would override it. */
	.past .event-card {
		filter: grayscale(0.5);
	}

	.empty a {
		color: var(--color-primary);
		font-weight: 600;
	}

	@media (max-width: 520px) {
		.event-card {
			grid-template-columns: 1fr;
		}

		.card-poster img {
			aspect-ratio: 16 / 9;
		}
	}
</style>
