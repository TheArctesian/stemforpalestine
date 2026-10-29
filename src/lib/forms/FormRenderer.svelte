<script lang="ts">
	import type { Field } from './definition';
	import FormField from './FormField.svelte';
	import { normalizeAnswers, visibleFieldIds, type RawAnswers } from './validate';

	/*
	 * The questions of a form, showing and hiding as rules dictate. Doesn't include the <form>
	 * element or the submit button: the public page and the builder's preview wrap it themselves.
	 */
	let {
		fields,
		raw = $bindable(),
		errors = {},
		idPrefix = 'q'
	}: {
		fields: Field[];
		raw: RawAnswers;
		errors?: Record<string, string>;
		idPrefix?: string;
	} = $props();

	const shown = $derived(fields.filter((field) => !field.archived));
	const visible = $derived(
		visibleFieldIds({ fields: shown }, normalizeAnswers({ fields: shown }, raw))
	);
</script>

<div class="questions">
	{#each shown as field (field.id)}
		{#if visible.has(field.id) || field.type === 'hidden'}
			<div class="cell" class:half={field.width === 'half'}>
				<FormField {field} bind:raw error={errors[field.id]} {idPrefix} />
			</div>
		{/if}
	{/each}
</div>

<style>
	.questions {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		column-gap: 1rem;
	}

	.cell {
		grid-column: span 2;
	}

	.cell.half {
		grid-column: span 1;
	}

	@media (max-width: 560px) {
		.cell.half {
			grid-column: span 2;
		}
	}
</style>
