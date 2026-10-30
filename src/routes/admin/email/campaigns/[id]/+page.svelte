<script lang="ts">
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import DataTable, { type Column } from '$lib/admin/DataTable.svelte';

	let { data, form: result } = $props();
	const campaign = $derived(data.campaign);

	type Progress = NonNullable<typeof data.progress> & { retryAfterMs?: number; error?: string };
	let live = $state<Progress | null>(null);
	const progress = $derived(live ?? data.progress);
	let looping = $state(false);
	let loopError = $state('');
	let stopped = false;

	/** Sends batch after batch while this page is open. Closing it pauses; opening it resumes. */
	async function sendLoop() {
		if (looping) return;
		looping = true;
		loopError = '';
		while (!stopped) {
			const response = await fetch(`/admin/email/campaigns/${campaign.id}/send`, {
				method: 'POST'
			});
			if (!response.ok) {
				loopError = (await response.json().catch(() => ({})))?.message ?? 'Sending stopped.';
				break;
			}
			const p: Progress = await response.json();
			live = p;
			if (p.error && !p.retryAfterMs) loopError = p.error;
			if (p.status !== 'sending' || p.remaining === 0) break;
			await new Promise((r) => setTimeout(r, p.retryAfterMs ?? 600));
		}
		looping = false;
		await invalidateAll();
		live = null;
	}

	$effect(() => {
		if (campaign.status === 'sending' && !looping) sendLoop();
	});
	onDestroy(() => (stopped = true));

	const percent = $derived(
		progress && progress.total
			? Math.round(((progress.sent + progress.failed) / progress.total) * 100)
			: 0
	);
	const badge = {
		draft: 'badge-amber',
		sending: 'badge-blue',
		sent: 'badge-green',
		cancelled: ''
	} as const;

	const columns: Column[] = [
		{ title: 'Email', data: 'email' },
		{ title: 'Status', data: 'status' },
		{ title: 'Sent', data: 'sentAt' },
		{ title: 'Error', data: 'error', defaultContent: '' }
	];
	const rows = $derived(
		data.messages.map((m) => ({
			...m,
			sentAt: m.sentAt ? m.sentAt.slice(0, 16).replace('T', ' ') : ''
		}))
	);
</script>

<svelte:head>
	<title>{campaign.name} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/email/campaigns" class="back-link"><i class="fas fa-arrow-left"></i> Campaigns</a>
<header class="page-header">
	<div>
		<h1>{campaign.name} <span class="badge {badge[campaign.status]}">{campaign.status}</span></h1>
		<p>
			{#if data.template}From <a href="/admin/email/templates/{data.template.id}"
					>{data.template.name}</a
				> ·
			{/if}
			{campaign.status === 'draft'
				? `${data.audienceSize} recipients right now`
				: `${campaign.recipientCount} recipients`}
		</p>
	</div>
</header>

{#if result?.message}<p class="flash flash-error" role="alert">{result.message}</p>{/if}
{#if loopError}<p class="flash flash-error" role="alert">{loopError}</p>{/if}

{#if campaign.status === 'draft'}
	<div class="card send-card">
		<h2>Ready to send</h2>
		<p>
			This goes to <strong>{data.audienceSize}</strong>
			{data.audienceSize === 1 ? 'person' : 'people'}. The list is worked out again when you press
			send, so people who signed up since are included and anyone who unsubscribed is left out.
		</p>
		<form
			method="POST"
			action="?/start"
			use:enhance={() =>
				async ({ update }) =>
					update()}
			class="actions"
		>
			<ConfirmButton
				label="Send to {data.audienceSize} {data.audienceSize === 1 ? 'person' : 'people'}"
				icon="fa-paper-plane"
				question="Send this email now?"
				confirmLabel="Yes, send it"
				disabled={!data.audienceSize}
			/>
		</form>
	</div>
{:else if progress}
	<div class="card">
		<h2>Progress</h2>
		<progress max="100" value={percent}></progress>
		<p class="stats">
			<span><strong>{progress.sent}</strong> sent</span>
			<span><strong>{progress.remaining}</strong> to go</span>
			{#if progress.failed}<span class="field-error"><strong>{progress.failed}</strong> failed</span
				>{/if}
			{#if looping}<span class="muted"
					><i class="fas fa-spinner fa-spin"></i> Sending… keep this page open.</span
				>{/if}
		</p>
		<div class="actions">
			{#if campaign.status === 'sending'}
				<form method="POST" action="?/cancel" use:enhance>
					<button class="btn" type="submit"><i class="fas fa-pause"></i> Stop sending</button>
				</form>
				{#if !looping}<button class="btn btn-primary" type="button" onclick={sendLoop}
						><i class="fas fa-play"></i> Resume sending</button
					>{/if}
			{/if}
			{#if campaign.status === 'cancelled' && progress.remaining}
				<form method="POST" action="?/resume" use:enhance>
					<button class="btn btn-primary" type="submit"
						><i class="fas fa-play"></i> Resume ({progress.remaining} left)</button
					>
				</form>
			{/if}
			{#if progress.failed && !looping}
				<form method="POST" action="?/retry" use:enhance>
					<button class="btn" type="submit"><i class="fas fa-rotate"></i> Retry failed</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<div class="card">
	<h2>The email</h2>
	<p class="subject"><span class="muted">Subject:</span> <strong>{data.preview.subject}</strong></p>
	{#if data.preview.sampleEmail}<p class="hint">
			Shown as {data.preview.sampleEmail} will see it.
		</p>{/if}
	<iframe title="Email preview" srcdoc={data.preview.html} sandbox=""></iframe>
	<form
		method="POST"
		action="?/test"
		use:enhance={() =>
			async ({ update }) =>
				update({ reset: false })}
		class="test"
	>
		<input type="email" name="to" placeholder="you@example.org" aria-label="Send a test to" />
		<button type="submit" class="btn"><i class="fas fa-paper-plane"></i> Send test</button>
		{#if result?.testSent}<span class="muted"
				><i class="fas fa-check"></i> Sent to {result.testSent}</span
			>{/if}
		{#if result?.testError}<span class="field-error">{result.testError}</span>{/if}
	</form>
</div>

{#if data.messages.length}
	<div class="card">
		<h2>Recipients</h2>
		<DataTable {columns} {rows} exportName="campaign-recipients" searchBuilder={false} />
	</div>
{/if}

{#if campaign.status !== 'sending'}
	<form method="POST" action="?/delete" class="card card-danger" use:enhance>
		<h2>Delete campaign</h2>
		<p class="hint">
			Removes it and its recipient list from the admin. Emails already sent can't be unsent.
		</p>
		<ConfirmButton label="Delete campaign" question="Delete this campaign?" confirmLabel="Delete" />
	</form>
{/if}

<style>
	.send-card {
		border-color: var(--color-primary);
	}

	progress {
		width: 100%;
		height: 0.9rem;
		accent-color: var(--color-primary);
	}

	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.5rem;
		margin: 0.75rem 0;
	}

	.subject {
		margin-bottom: 0.25rem;
	}

	iframe {
		width: 100%;
		height: 560px;
		border: 1px solid var(--color-border-light);
		border-radius: 8px;
		margin: 0.5rem 0 1rem;
		background: #f4f9f0;
	}

	.test {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}

	.test input {
		max-width: 280px;
	}
</style>
