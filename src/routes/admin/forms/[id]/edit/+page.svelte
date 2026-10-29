<script lang="ts">
	import FormBuilder from '$lib/admin/forms/FormBuilder.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.definition.title} | STEM4Palestine Admin</title>
</svelte:head>

<!-- Keyed, so moving to another form's builder starts fresh. -->
{#key data.formId}
	<FormBuilder
		formId={data.formId}
		initial={data.definition}
		answeredFieldIds={data.answeredFieldIds}
		submissions={data.submissions}
		result={form}
	/>
{/key}
