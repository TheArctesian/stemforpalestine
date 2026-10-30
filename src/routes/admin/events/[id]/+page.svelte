<script lang="ts">
	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import { uploadFile } from '$lib/admin/upload';
	import { slugifyUrl } from '$lib/forms/fields';

	let { data, form: result } = $props();

	let e = $state(structuredClone(data.input));
	let saved = $state(JSON.stringify(data.input));
	const json = $derived(JSON.stringify(e));
	const dirty = $derived(json !== saved);
	let saving = $state(false);
	let issues = $state<string[]>([]);
	let savedAt = $state<Date | null>(null);
	let uploading = $state<string | null>(null);
	let uploadError = $state('');

	// Paragraphs and simple lists are edited as text: a blank line between paragraphs, one item per line.
	let description = $state(data.input.description.join('\n\n'));
	let speakers = $state(data.input.speakers.join('\n'));
	let notes = $state(data.input.notes.join('\n'));
	$effect(() => {
		e.description = description
			.split(/\n\s*\n/)
			.map((p) => p.trim())
			.filter(Boolean);
		e.speakers = speakers
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
		e.notes = notes
			.split('\n')
			.map((s) => s.trim())
			.filter(Boolean);
	});

	const slugIsUntouched = data.input.slug.startsWith('new-event');
	function setTitle(value: string) {
		e.title = value;
		if (slugIsUntouched && e.status === 'draft')
			e.slug = slugifyUrl([value, e.subtitle].filter(Boolean).join(' ')) || e.slug;
	}

	async function upload(file: File | undefined, what: string): Promise<string | null> {
		if (!file) return null;
		uploading = what;
		uploadError = '';
		try {
			return await uploadFile(file, file.name);
		} catch (err) {
			uploadError = (err as Error).message;
			return null;
		} finally {
			uploading = null;
		}
	}

	/** The poster's pixel size, read before upload so the page can reserve its space. */
	function imageSize(file: File): Promise<{ width: number; height: number }> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
			img.onerror = () => resolve({ width: 0, height: 0 });
			img.src = URL.createObjectURL(file);
		});
	}

	async function pickPoster(file: File | undefined) {
		if (!file) return;
		const size = await imageSize(file);
		const url = await upload(file, 'poster');
		if (url) {
			e.posterUrl = url;
			e.posterWidth = size.width || null;
			e.posterHeight = size.height || null;
		}
	}

	function move<T>(list: T[], i: number, by: -1 | 1) {
		const [item] = list.splice(i, 1);
		list.splice(i + by, 0, item);
	}

	const save: SubmitFunction = () => {
		saving = true;
		issues = [];
		return async ({ result: r }) => {
			saving = false;
			if (r.type === 'success') {
				saved = json;
				savedAt = new Date();
			} else if (r.type === 'failure') issues = (r.data?.issues as string[]) ?? ['Saving failed.'];
			else if (r.type === 'error') issues = [r.error?.message ?? 'Saving failed.'];
		};
	};

	beforeNavigate(({ cancel, type }) => {
		if (!dirty || saving) return;
		if (type === 'leave' || !confirm('You have unsaved changes. Leave without saving?')) cancel();
	});

	const time = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });
</script>

<svelte:head>
	<title>{e.title} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/events" class="back-link"><i class="fas fa-arrow-left"></i> Events</a>
<header class="page-header">
	<div>
		<h1>
			{[e.title, e.subtitle].filter(Boolean).join(' ') || 'Untitled event'}
			<span class="badge {e.status === 'published' ? 'badge-green' : 'badge-amber'}"
				>{e.status}</span
			>
		</h1>
		<p>
			<a href="/events/{data.input.slug}" target="_blank" rel="noopener noreferrer"
				>/events/{data.input.slug}</a
			>{data.input.status === 'draft' ? ' (preview, only admins can see it)' : ''}
		</p>
	</div>
	<form method="POST" action="?/save" use:enhance={save} class="actions">
		<input type="hidden" name="event" value={json} />
		{#if dirty}<span class="muted">Unsaved changes</span>{:else if savedAt}<span class="muted"
				><i class="fas fa-check"></i> Saved at {time.format(savedAt)}</span
			>{/if}
		<button type="submit" class="btn btn-primary" disabled={saving || !dirty}
			><i class="fas fa-floppy-disk"></i> {saving ? 'Saving…' : 'Save'}</button
		>
	</form>
</header>

{#if issues.length}
	<div class="flash flash-error" role="alert">
		<strong>Not saved:</strong>
		<ul>
			{#each issues as issue, i (i)}<li>{issue}</li>{/each}
		</ul>
	</div>
{/if}
{#if uploadError}<p class="flash flash-error" role="alert">{uploadError}</p>{/if}

<div class="card">
	<h2>Basics</h2>
	<div class="form-grid">
		<div class="field">
			<label for="title">Title</label><input
				id="title"
				type="text"
				value={e.title}
				oninput={(ev) => setTitle(ev.currentTarget.value)}
			/>
		</div>
		<div class="field">
			<label for="subtitle">Second line <span class="muted">(optional)</span></label><input
				id="subtitle"
				type="text"
				bind:value={e.subtitle}
				placeholder="e.g. Networking Night"
			/>
		</div>
		<div class="field">
			<label for="slug">Address</label>
			<input id="slug" type="text" bind:value={e.slug} spellcheck="false" />
			<p class="hint">
				stem4pal.org/events/<strong>{e.slug}</strong
				>{#if data.publishedSlug && e.slug !== data.publishedSlug}. <span class="field-error"
						>Changing this breaks links to the old address.</span
					>{/if}
			</p>
		</div>
		<fieldset class="field status">
			<legend class="label">Status</legend>
			<label class="check"
				><input type="radio" value="draft" bind:group={e.status} /> Draft (only admins can see it)</label
			>
			<label class="check"
				><input type="radio" value="published" bind:group={e.status} /> Published</label
			>
		</fieldset>
	</div>
	<div class="field">
		<label for="summary">Summary</label>
		<textarea id="summary" rows="2" bind:value={e.summary}></textarea>
		<p class="hint">One or two sentences, for the events list and search results.</p>
	</div>
	<div class="field">
		<label for="description">About the event</label>
		<textarea id="description" rows="8" bind:value={description}></textarea>
		<p class="hint">Leave a blank line between paragraphs.</p>
	</div>
</div>

<div class="card">
	<h2>When and where</h2>
	<div class="form-grid">
		<div class="field">
			<label for="date">Date</label><input id="date" type="date" bind:value={e.date} />
		</div>
		<div class="field">
			<label for="start">Starts</label><input id="start" type="time" bind:value={e.startTime} />
		</div>
		<div class="field">
			<label for="end">Ends</label><input id="end" type="time" bind:value={e.endTime} />
			<p class="hint">Bay Area time. An end before the start means after midnight.</p>
		</div>
	</div>
	<div class="form-grid">
		<div class="field">
			<label for="venue">Venue</label><input id="venue" type="text" bind:value={e.venueName} />
		</div>
		<div class="field">
			<label for="address">Address</label><input
				id="address"
				type="text"
				bind:value={e.venueAddress}
			/>
		</div>
		<div class="field">
			<label for="venue-url">Venue website <span class="muted">(optional)</span></label><input
				id="venue-url"
				type="url"
				bind:value={e.venueUrl}
			/>
		</div>
	</div>
</div>

<div class="card">
	<h2>RSVP</h2>
	<div class="form-grid">
		<div class="field">
			<label for="rsvp">RSVP link</label><input
				id="rsvp"
				type="url"
				bind:value={e.rsvpUrl}
				placeholder="https://luma.com/… or /forms/…"
			/>
		</div>
		<div class="field">
			<label for="rsvp-label">Button label</label><input
				id="rsvp-label"
				type="text"
				bind:value={e.rsvpLabel}
			/>
		</div>
		<div class="field">
			<label for="banner">Banner at the bottom <span class="muted">(optional)</span></label><input
				id="banner"
				type="text"
				bind:value={e.rsvpBannerText}
				placeholder="e.g. Dinner is provided if you RSVP"
			/>
		</div>
	</div>
	<div class="field">
		<label for="notes">Good to know <span class="muted">(one per line)</span></label>
		<textarea id="notes" rows="3" bind:value={notes}></textarea>
	</div>
</div>

<div class="card">
	<h2>Poster</h2>
	<div class="poster-row">
		{#if e.posterUrl}<img src={e.posterUrl} alt="" class="poster-thumb" />{/if}
		<div class="poster-fields">
			<div class="field">
				<label for="poster-file">{e.posterUrl ? 'Replace the poster' : 'Upload the poster'}</label>
				<input
					id="poster-file"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					onchange={(ev) => pickPoster(ev.currentTarget.files?.[0])}
				/>
				{#if uploading === 'poster'}<p class="hint">
						<i class="fas fa-spinner fa-spin"></i> Uploading…
					</p>{/if}
			</div>
			<div class="field">
				<label for="alt"
					>Describe the poster <span class="muted">(alt text, for screen readers)</span></label
				>
				<textarea id="alt" rows="3" bind:value={e.posterAlt}></textarea>
			</div>
			<div class="field">
				<label for="pdf">Printable PDF <span class="muted">(optional)</span></label>
				<input
					id="pdf"
					type="file"
					accept="application/pdf"
					onchange={async (ev) => {
						const url = await upload(ev.currentTarget.files?.[0], 'pdf');
						if (url) e.posterPdfUrl = url;
					}}
				/>
				{#if e.posterPdfUrl}<p class="hint">
						<a href={e.posterPdfUrl} target="_blank" rel="noopener noreferrer">Current PDF</a> ·
						<button type="button" class="link" onclick={() => (e.posterPdfUrl = '')}>remove</button>
					</p>{/if}
			</div>
		</div>
	</div>
</div>

<div class="card">
	<h2>Agenda <span class="muted">(optional)</span></h2>
	{#each e.agenda as item, i (i)}
		<div class="row agenda-row">
			<input type="text" aria-label="Time" placeholder="7:00–7:15" bind:value={item.time} />
			<input
				type="text"
				aria-label="What happens"
				placeholder="Mingle and food"
				bind:value={item.title}
			/>
			<button
				type="button"
				class="btn btn-small"
				aria-label="Move up"
				disabled={i === 0}
				onclick={() => move(e.agenda, i, -1)}><i class="fas fa-arrow-up"></i></button
			>
			<button
				type="button"
				class="btn btn-small"
				aria-label="Remove"
				onclick={() => e.agenda.splice(i, 1)}><i class="fas fa-xmark"></i></button
			>
		</div>
	{/each}
	<button type="button" class="btn btn-small" onclick={() => e.agenda.push({ time: '', title: '' })}
		><i class="fas fa-plus"></i> Add to the agenda</button
	>
</div>

<div class="card">
	<h2>Speakers</h2>
	<div class="field">
		<label for="speakers"
			>“Speakers will include” <span class="muted">(one per line, optional)</span></label
		>
		<textarea id="speakers" rows="4" bind:value={speakers}></textarea>
	</div>

	<span class="label">“Meet the speakers” cards <span class="muted">(optional)</span></span>
	<div class="speaker-grid">
		{#each e.speakerCards as card, i (i)}
			<div class="speaker-edit">
				<div class="photo">
					{#if card.imageUrl}<img src={card.imageUrl} alt="" />{:else}<span class="placeholder"
							><i class="fas fa-user"></i></span
						>{/if}
					<input
						type="file"
						accept="image/jpeg,image/png,image/webp"
						aria-label="Photo of {card.name || 'speaker'}"
						onchange={async (ev) => {
							const url = await upload(ev.currentTarget.files?.[0], `speaker-${i}`);
							if (url) card.imageUrl = url;
						}}
					/>
					{#if uploading === `speaker-${i}`}<p class="hint">Uploading…</p>{/if}
				</div>
				<input type="text" aria-label="Name" placeholder="Name" bind:value={card.name} />
				<input
					type="text"
					aria-label="Role"
					placeholder="Role, e.g. Organizer, Tech Workers' Coalition"
					bind:value={card.role}
				/>
				<textarea
					aria-label="Short bio"
					placeholder="A sentence or two"
					rows="3"
					maxlength="280"
					bind:value={card.bio}
				></textarea>
				<p class="hint">{card.bio.length}/280</p>
				<div class="actions">
					<button
						type="button"
						class="btn btn-small"
						aria-label="Move earlier"
						disabled={i === 0}
						onclick={() => move(e.speakerCards, i, -1)}><i class="fas fa-arrow-left"></i></button
					>
					<button
						type="button"
						class="btn btn-small"
						aria-label="Move later"
						disabled={i === e.speakerCards.length - 1}
						onclick={() => move(e.speakerCards, i, 1)}><i class="fas fa-arrow-right"></i></button
					>
					<button
						type="button"
						class="btn btn-small btn-danger"
						onclick={() => e.speakerCards.splice(i, 1)}><i class="fas fa-trash"></i> Remove</button
					>
				</div>
			</div>
		{/each}
	</div>
	<button
		type="button"
		class="btn btn-small"
		onclick={() => e.speakerCards.push({ name: '', role: '', bio: '', imageUrl: '' })}
		><i class="fas fa-plus"></i> Add a speaker card</button
	>
</div>

<div class="card">
	<h2>Partners <span class="muted">(optional)</span></h2>
	{#each e.partners as partner, i (i)}
		<div class="row partner-row">
			<input type="text" aria-label="Partner name" placeholder="Name" bind:value={partner.name} />
			<input
				type="url"
				aria-label="Partner website"
				placeholder="https://… (optional)"
				bind:value={partner.url}
			/>
			<button
				type="button"
				class="btn btn-small"
				aria-label="Remove"
				onclick={() => e.partners.splice(i, 1)}><i class="fas fa-xmark"></i></button
			>
		</div>
	{/each}
	<button type="button" class="btn btn-small" onclick={() => e.partners.push({ name: '', url: '' })}
		><i class="fas fa-plus"></i> Add a partner</button
	>
</div>

<form method="POST" action="?/delete" class="card card-danger" use:enhance>
	<h2>Delete event</h2>
	<p class="hint">Removes the event page for good. To hide it instead, set it back to draft.</p>
	<ConfirmButton label="Delete event" question="Delete this event?" confirmLabel="Delete" />
</form>

<style>
	.flash ul {
		margin-left: 1.25rem;
	}

	.status {
		border: none;
		padding: 0;
	}

	.row {
		display: grid;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.agenda-row {
		grid-template-columns: 10rem minmax(0, 1fr) auto auto;
	}

	.partner-row {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
	}

	.poster-row {
		display: flex;
		gap: 1.5rem;
		align-items: flex-start;
	}

	.poster-thumb {
		width: 180px;
		border-radius: 8px;
		box-shadow: 0 6px 18px rgba(15, 23, 42, 0.15);
	}

	.poster-fields {
		flex: 1;
		min-width: 0;
	}

	.label {
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.speaker-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.speaker-edit {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		padding: 1rem;
		border: 1px solid var(--color-border-light);
		border-radius: 10px;
	}

	.photo {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.photo img,
	.photo .placeholder {
		width: 5.5rem;
		height: 5.5rem;
		border-radius: 50%;
		object-fit: cover;
	}

	.photo .placeholder {
		display: grid;
		place-items: center;
		background: var(--color-bg-secondary);
		color: var(--color-border-medium);
		font-size: 2rem;
	}

	.photo input {
		font-size: 0.8rem;
		max-width: 100%;
	}

	.link {
		background: none;
		border: none;
		padding: 0;
		color: var(--color-primary-dark);
		text-decoration: underline;
		font: inherit;
		cursor: pointer;
	}

	@media (max-width: 700px) {
		.poster-row {
			flex-direction: column;
		}

		.agenda-row,
		.partner-row {
			grid-template-columns: minmax(0, 1fr) auto;
		}
	}
</style>
