<script lang="ts">
	import { reveal } from '$lib/animations/reveal';
	import {
		formatEventDate,
		formatEventTime,
		googleCalendarUrl,
		isPast,
		mapUrl
	} from '$lib/data/events';

	let { data } = $props();
	const event = $derived(data.event);
	const fullTitle = $derived([event.title, event.subtitle].filter(Boolean).join(' '));
	const past = $derived(isPast(event));

	let shareLabel = $state('Share this event');

	async function share() {
		const url = window.location.href;
		if (navigator.share) {
			try {
				await navigator.share({ title: fullTitle, text: event.summary, url });
			} catch {
				// Closing the share sheet rejects too - nothing to do.
			}
			return;
		}
		try {
			await navigator.clipboard.writeText(url);
			shareLabel = 'Link copied!';
		} catch {
			shareLabel = 'Copy the URL from your address bar';
		}
		setTimeout(() => (shareLabel = 'Share this event'), 2500);
	}
</script>

<svelte:head>
	<title>{fullTitle} | STEM for Palestine</title>
	<meta name="description" content={event.summary} />
</svelte:head>

<div class="event-page">
	<section class="hero">
		<div class="container">
			<a href="/events" class="back-link" data-reveal="up" use:reveal>
				<i class="fas fa-arrow-left"></i> All events
			</a>
			<p class="eyebrow" data-reveal="up" use:reveal={0.05}>
				<strong>STEM4Palestine</strong> presents
			</p>
			<h1 data-reveal="up" use:reveal={0.15}>
				<span class="title-accent">{event.title}</span>
				{#if event.subtitle}<span class="title-sub">{event.subtitle}</span>{/if}
			</h1>
			<ul class="hero-meta" data-reveal="up" use:reveal={0.3}>
				<li><i class="fas fa-calendar-day"></i> {formatEventDate(event)}</li>
				<li><i class="fas fa-clock"></i> {formatEventTime(event)}</li>
				<li><i class="fas fa-location-dot"></i> {event.venue.address.split(',')[0]}</li>
			</ul>
			<div class="hero-actions" data-reveal="up" use:reveal={0.45}>
				{#if past}
					<span class="past-badge">This event has ended</span>
				{:else}
					<a href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" class="cta-button">
						<i class="fas fa-ticket"></i> RSVP on Luma
					</a>
					<a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" class="ghost-button">
						<i class="fas fa-calendar-plus"></i> Add to calendar
					</a>
				{/if}
			</div>
		</div>
	</section>

	<section class="details">
		<div class="container details-grid">
			<div class="detail-card" data-reveal="up" use:reveal>
				<i class="fas fa-calendar-day detail-icon"></i>
				<h3>When</h3>
				<p>{formatEventDate(event)}<br />{formatEventTime(event)}</p>
			</div>
			<div class="detail-card" data-reveal="up" use:reveal={0.1}>
				<i class="fas fa-location-dot detail-icon"></i>
				<h3>Where</h3>
				<p>{event.venue.name}<br />{event.venue.address}</p>
				<a href={mapUrl(event)} target="_blank" rel="noopener noreferrer" class="detail-link">Open in Maps →</a>
			</div>
			<div class="detail-card" data-reveal="up" use:reveal={0.2}>
				<i class="fas fa-utensils detail-icon"></i>
				<h3>Good to know</h3>
				<p>
					{#each event.notes as note, i}{note}{#if i < event.notes.length - 1}<br />{/if}{/each}
				</p>
				{#if !past}
					<a href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" class="detail-link">RSVP →</a>
				{/if}
			</div>
		</div>
	</section>

	<section class="about">
		<div class="container about-grid">
			<figure class="poster" data-reveal="left" use:reveal>
				<img src={event.poster} alt={event.posterAlt} width="1536" height="2048" loading="lazy" />
				<figcaption>
					{#if event.posterPdf}
						<a href={event.posterPdf} target="_blank" rel="noopener noreferrer" download>
							<i class="fas fa-file-pdf"></i> Download the poster (PDF)
						</a>
					{/if}
					<button type="button" class="share-button" onclick={share}>
						<i class="fas fa-share-nodes"></i> {shareLabel}
					</button>
				</figcaption>
			</figure>

			<div class="about-text">
				<h2 data-reveal="right" use:reveal>About the event</h2>
				{#each event.description as paragraph, i}
					<p data-reveal="right" use:reveal={0.05 * (i + 1)}>{paragraph}</p>
				{/each}

				<h3 data-reveal="right" use:reveal>Speakers will include</h3>
				<ul class="speakers">
					{#each event.speakers as speaker, i}
						<li data-reveal="right" use:reveal={0.08 * i}>{speaker}</li>
					{/each}
				</ul>

				{#if event.partners.length}
					<h3 data-reveal="right" use:reveal>With</h3>
					<ul class="partners" data-reveal="right" use:reveal={0.1}>
						{#each event.partners as partner}
							<li>
								{#if partner.url}
									<a href={partner.url} target="_blank" rel="noopener noreferrer">{partner.name}</a>
								{:else}
									<span>{partner.name}</span>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	</section>

	{#if !past}
		<section class="rsvp-banner">
			<div class="container">
				<a href={event.rsvpUrl} target="_blank" rel="noopener noreferrer" class="banner-link" data-reveal="zoom" use:reveal>
					<span>Dinner is provided if you RSVP. Save your spot</span>
					<i class="fas fa-arrow-right"></i>
				</a>
			</div>
		</section>
	{/if}
</div>

<style>
	.event-page {
		--event-night: #0b1029;
		--event-night-light: #1b2350;
		--event-red: #dc2626;
		--event-ice: #e0f2fe;
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Hero: the poster's night-sky navy with its faint hexagon network behind the title. */
	.hero {
		position: relative;
		overflow: hidden;
		color: #ffffff;
		padding: 2.5rem 0 3.5rem;
		text-align: center;
		background:
			radial-gradient(ellipse at 50% 120%, rgba(0, 150, 57, 0.28) 0%, transparent 60%),
			linear-gradient(160deg, var(--event-night) 0%, var(--event-night-light) 55%, var(--event-night) 100%);
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		opacity: 0.18;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='97' viewBox='0 0 56 97'%3E%3Cpath d='M28 0 56 16v32L28 64 0 48V16zM28 64v33M0 48l-28 16M56 48l28 16' fill='none' stroke='%237dd3fc' stroke-width='1'/%3E%3Ccircle cx='28' cy='0' r='2' fill='%237dd3fc'/%3E%3Ccircle cx='28' cy='64' r='2' fill='%237dd3fc'/%3E%3Ccircle cx='0' cy='16' r='2' fill='%237dd3fc'/%3E%3Ccircle cx='56' cy='48' r='2' fill='%237dd3fc'/%3E%3C/svg%3E");
		mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
		pointer-events: none;
	}

	.hero .container {
		position: relative;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.95rem;
		opacity: 0.8;
		margin-bottom: 1.75rem;
		transition: opacity 0.2s;
	}

	.back-link:hover {
		opacity: 1;
	}

	.eyebrow {
		font-size: 1.15rem;
		letter-spacing: 0.02em;
		margin-bottom: 0.5rem;
		opacity: 0.95;
	}

	.hero h1 {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 1.75rem;
		font-weight: 800;
		line-height: 1.05;
	}

	.title-accent {
		color: var(--event-red);
		font-size: clamp(2.5rem, 7vw, 4.5rem);
		text-shadow: 0 2px 18px rgba(220, 38, 38, 0.35);
	}

	.title-sub {
		color: var(--event-ice);
		font-size: clamp(2rem, 5.5vw, 3.5rem);
	}

	.hero-meta {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.75rem 1.75rem;
		font-size: 1.1rem;
		margin-bottom: 2rem;
	}

	.hero-meta i {
		color: #7dd3fc;
		margin-right: 0.35rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}

	.cta-button,
	.ghost-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		padding: 0.85rem 1.5rem;
		border-radius: 8px;
		transition: filter 0.2s, transform 0.2s, background-color 0.2s;
	}

	.cta-button {
		background: var(--color-primary);
		box-shadow: 0 4px 14px rgba(0, 150, 57, 0.4);
	}

	.cta-button:hover {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.ghost-button {
		background-color: rgba(255, 255, 255, 0.1);
		border: 2px solid rgba(255, 255, 255, 0.25);
	}

	.ghost-button:hover {
		background-color: rgba(255, 255, 255, 0.18);
		transform: translateY(-1px);
	}

	.past-badge {
		display: inline-block;
		padding: 0.6rem 1.25rem;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
		font-weight: 600;
	}

	/* Details cards overlap the bottom of the hero slightly. */
	.details {
		background: var(--color-bg-secondary, #f7fafc);
		padding-bottom: 1rem;
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.25rem;
		transform: translateY(-1.75rem);
	}

	.detail-card {
		background: #ffffff;
		border: 2px solid var(--color-border-light, #e2e8f0);
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
		transition: border-color 0.3s, box-shadow 0.3s;
	}

	.detail-card:hover {
		border-color: var(--color-primary);
		box-shadow: 0 10px 28px rgba(0, 150, 57, 0.15);
	}

	.detail-icon {
		font-size: 1.4rem;
		color: var(--color-primary);
		margin-bottom: 0.75rem;
	}

	.detail-card h3 {
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
		color: var(--color-text-primary, #2d3748);
	}

	.detail-card p {
		color: var(--color-text-secondary, #4a5568);
		margin-bottom: 0.75rem;
	}

	.detail-link {
		color: var(--color-primary);
		font-weight: 600;
	}

	.detail-link:hover {
		color: var(--color-primary-dark);
	}

	.about {
		background: var(--color-bg-secondary, #f7fafc);
		padding: 1.5rem 0 4rem;
	}

	.about-grid {
		display: grid;
		grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
		gap: 3rem;
		align-items: start;
	}

	.poster {
		position: sticky;
		top: 6rem;
	}

	.poster img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 12px;
		box-shadow: 0 18px 40px rgba(11, 16, 41, 0.35);
	}

	.poster figcaption {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5rem 1.5rem;
		margin-top: 1rem;
		font-weight: 600;
		color: var(--color-primary);
	}

	.poster figcaption a:hover,
	.share-button:hover {
		color: var(--color-primary-dark);
	}

	.share-button {
		background: none;
		border: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}

	.about-text h2 {
		font-size: 1.85rem;
		color: var(--color-text-primary, #2d3748);
	}

	.about-text h3 {
		font-size: 1.2rem;
		margin: 2rem 0 0.85rem;
		color: var(--color-text-primary, #2d3748);
	}

	.about-text p {
		font-size: 1.08rem;
		line-height: 1.7;
		color: var(--color-text-secondary, #4a5568);
	}

	.speakers {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
	}

	.speakers li {
		background: #ffffff;
		border-left: 4px solid var(--color-primary);
		border-radius: 0 8px 8px 0;
		padding: 0.75rem 1rem;
		color: var(--color-text-primary, #2d3748);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.partners {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	.partners li > * {
		display: inline-block;
		padding: 0.45rem 0.95rem;
		border-radius: 999px;
		border: 2px solid var(--color-border-medium, #cbd5e0);
		background: #ffffff;
		font-weight: 500;
		font-size: 0.95rem;
		transition: border-color 0.2s, color 0.2s;
	}

	.partners a:hover {
		border-color: var(--color-primary);
		color: var(--color-primary-dark);
	}

	.rsvp-banner {
		background: var(--color-primary);
		padding: 1.1rem 0;
	}

	.banner-link {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: #ffffff;
		font-weight: 700;
		font-size: 1.25rem;
		text-align: center;
		transition: transform 0.2s;
	}

	.banner-link:hover {
		transform: translateX(4px);
	}

	@media (max-width: 768px) {
		.about-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.poster {
			position: static;
			max-width: 420px;
			margin: 0 auto;
		}

		.hero-meta {
			font-size: 1rem;
		}

		.banner-link {
			font-size: 1rem;
		}
	}
</style>
