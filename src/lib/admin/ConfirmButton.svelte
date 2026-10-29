<script lang="ts">
	/*
	 * A submit button that asks "Are you sure?" inline before it submits, instead of a browser
	 * confirm() dialog. Put it inside the <form> it should submit.
	 */
	let {
		label,
		confirmLabel = 'Yes, do it',
		question = 'Are you sure?',
		icon = 'fa-trash',
		formaction,
		disabled = false
	}: {
		label: string;
		confirmLabel?: string;
		question?: string;
		icon?: string;
		formaction?: string;
		disabled?: boolean;
	} = $props();

	let confirming = $state(false);
</script>

{#if confirming}
	<span class="confirm" role="group" aria-label={question}>
		<span class="question">{question}</span>
		<button type="submit" class="btn btn-small btn-danger" {formaction}>{confirmLabel}</button>
		<button type="button" class="btn btn-small" onclick={() => (confirming = false)}>Cancel</button>
	</span>
{:else}
	<button type="button" class="btn btn-danger" {disabled} onclick={() => (confirming = true)}>
		<i class="fas {icon}"></i>
		{label}
	</button>
{/if}

<style>
	.confirm {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.question {
		font-weight: 600;
		color: #991b1b;
	}
</style>
