<script lang="ts">
	import { tick } from 'svelte';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import FormRenderer from '$lib/forms/FormRenderer.svelte';
	import { validateSubmission, type RawAnswers } from '$lib/forms/validate';

	let { data, form: result } = $props();
	const form = $derived(data.form);

	// Server-rendered values first (after a submit without JavaScript), then what's typed.
	let raw = $state<RawAnswers>({ ...data.prefill, ...(result?.raw ?? {}) });
	let clientErrors = $state<Record<string, string> | null>(null);
	let submitting = $state(false);
	let container: HTMLElement;

	// Once a submit has failed, errors update as people fix their answers.
	const liveErrors = $derived(clientErrors ? validateSubmission(form, raw).errors : null);
	const errors = $derived(liveErrors ?? result?.errors ?? {});
	const ending = $derived(result?.ending);
	const closed = $derived(form.status === 'closed');

	async function focusFirstError() {
		await tick();
		container?.querySelector<HTMLElement>('.invalid :is(input, select, textarea)')?.focus();
	}

	const submit: SubmitFunction = ({ cancel }) => {
		const { errors } = validateSubmission(form, raw);
		if (Object.keys(errors).length) {
			clientErrors = errors;
			cancel();
			focusFirstError();
			return;
		}
		submitting = true;
		return async ({ update, result }) => {
			await update({ reset: false, invalidateAll: false });
			submitting = false;
			if (result.type === 'success')
				container?.scrollIntoView({ behavior: 'smooth', block: 'start' });
			else focusFirstError();
		};
	};
</script>

<svelte:head>
	<title>{form.title} | STEM for Palestine</title>
	<meta name="description" content="{form.title} from STEM4Palestine." />
	{#if data.preview}<meta name="robots" content="noindex" />{/if}
</svelte:head>

<div class="form-page">
	<div class="form-card" bind:this={container}>
		{#if data.preview}
			<p class="banner">
				<i class="fas fa-eye"></i> Preview: this form is a draft. Only admins can see it, and it can't
				be submitted.
			</p>
		{/if}

		{#if ending !== undefined}
			<div class="ending" role="status">{@html ending}</div>
		{:else}
			<h1>{form.title}</h1>

			{#if closed}
				<p class="closed">{form.closedMessage || 'This form is no longer accepting responses.'}</p>
			{:else}
				<form method="POST" novalidate use:enhance={submit}>
					<input type="hidden" name="_t" value={data.token} />
					<!-- Honeypot: invisible to people, tempting to bots. -->
					<div class="hp" aria-hidden="true">
						<label
							>Website <input type="text" name="website" tabindex="-1" autocomplete="off" /></label
						>
					</div>

					<FormRenderer fields={form.fields} bind:raw {errors} />

					{#if result?.message}<p class="form-error" role="alert">{result.message}</p>{/if}
					{#if Object.keys(errors).length}
						<p class="form-error" role="alert">Please fix the highlighted questions.</p>
					{/if}

					<button type="submit" disabled={submitting || data.preview}>
						{#if submitting}Sending…{:else}{form.submitLabel}{/if}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</div>

<style>
	.form-page {
		background: #f4f9f0;
		padding: 2.5rem 1rem 4rem;
		margin-bottom: -4rem;
	}

	.form-card {
		max-width: 720px;
		margin: 0 auto;
		background: #fbfdfc;
		border: 1px solid var(--color-border-light);
		border-radius: 14px;
		padding: clamp(1.5rem, 4vw, 2.75rem);
		box-shadow: 0 8px 30px rgba(15, 23, 42, 0.06);
		scroll-margin-top: 6rem;
	}

	h1 {
		font-size: clamp(1.6rem, 4vw, 2.1rem);
		margin-bottom: 1.75rem;
	}

	.banner {
		background: #fffbeb;
		border: 1px solid #fde68a;
		color: #92400e;
		border-radius: 8px;
		padding: 0.65rem 0.9rem;
		font-weight: 500;
	}

	.hp {
		position: absolute;
		left: -10000px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}

	.closed {
		font-size: 1.1rem;
		color: var(--color-text-secondary);
	}

	.form-error {
		color: #b91c1c;
		font-weight: 600;
	}

	button {
		display: inline-flex;
		align-items: center;
		padding: 0.85rem 2rem;
		border: none;
		border-radius: 8px;
		background: var(--color-primary);
		color: #ffffff;
		font: inherit;
		font-weight: 700;
		font-size: 1.05rem;
		cursor: pointer;
		box-shadow: 0 4px 14px rgba(0, 150, 57, 0.3);
		transition:
			filter 0.2s,
			transform 0.2s;
	}

	button:hover:not(:disabled) {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.ending :global(h1),
	.ending :global(h2) {
		font-size: clamp(1.5rem, 4vw, 2rem);
	}

	.ending :global(a) {
		color: var(--color-primary-dark);
		font-weight: 600;
		text-decoration: underline;
	}
</style>
