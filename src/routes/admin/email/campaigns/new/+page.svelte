<script lang="ts">
	import { deserialize } from '$app/forms';
	import { page } from '$app/state';
	import ConditionEditor from '$lib/admin/ConditionEditor.svelte';
	import { audienceTargets } from '$lib/email/audience';
	import type { Condition } from '$lib/forms/conditions';

	let { data, form: result } = $props();

	let templateId = $state(
		page.url.searchParams.get('template') ?? data.templates.find((t) => t.formIds.length)?.id ?? ''
	);
	const template = $derived(data.templates.find((t) => t.id === templateId));
	let name = $state('');
	let formIds = $state<string[]>([]);
	let condition = $state<Condition>({ match: 'all', rules: [] });
	let excluded = $state<string[]>([]);

	// Choosing a template selects all its linked forms and suggests its name.
	let lastTemplate = '';
	$effect(() => {
		if (template && template.id !== lastTemplate) {
			lastTemplate = template.id;
			formIds = [...template.formIds];
			name ||= template.name;
		}
	});

	const linkedForms = $derived(data.forms.filter((f) => template?.formIds.includes(f.id)));
	const selectedForms = $derived(linkedForms.filter((f) => formIds.includes(f.id)));
	const targets = $derived(audienceTargets(selectedForms));
	const audience = $derived(
		JSON.stringify({
			formIds,
			match: condition.match,
			rules: condition.rules,
			excludedEmails: excluded
		})
	);

	/** Consent questions look like these; sending without filtering on one gets a warning. */
	const CONSENT = /mailing|consent|subscri|newsletter|opt_?in|contact_me/i;
	const filtersOnConsent = $derived(condition.rules.some((r) => CONSENT.test(r.field)));
	const consentKeys = $derived(targets.filter((t) => CONSENT.test(t.value)).map((t) => t.label));

	type Preview = {
		total: number;
		perForm: { formId: string; title: string; submissions: number; matched: number }[];
		excluded: { noEmail: number; duplicates: number; suppressed: number; manual: number };
		recipients: { email: string; name: string; form: string }[];
	};
	let preview = $state<Preview | null>(null);
	let previewError = $state('');
	let loading = $state(false);
	let search = $state('');

	async function refresh() {
		if (!templateId || !formIds.length) {
			preview = null;
			return;
		}
		loading = true;
		const body = new FormData();
		body.set('templateId', templateId);
		body.set('audience', audience);
		const response = await fetch('?/preview', {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const r = deserialize(await response.text());
		loading = false;
		if (r.type === 'success') {
			preview = r.data?.preview as Preview;
			previewError = '';
		} else
			previewError =
				r.type === 'failure' ? String(r.data?.message) : 'Couldn’t load the recipients.';
	}

	// Recount (after a pause) whenever the audience changes.
	let timer: ReturnType<typeof setTimeout>;
	$effect(() => {
		void audience;
		void templateId;
		clearTimeout(timer);
		timer = setTimeout(refresh, 400);
		return () => clearTimeout(timer);
	});

	const shown = $derived(
		(preview?.recipients ?? []).filter(
			(r) => !search || `${r.email} ${r.name}`.toLowerCase().includes(search.toLowerCase())
		)
	);

	function toggle(email: string, include: boolean) {
		excluded = include ? excluded.filter((e) => e !== email) : [...excluded, email];
	}
</script>

<svelte:head>
	<title>New campaign | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/email/campaigns" class="back-link"><i class="fas fa-arrow-left"></i> Campaigns</a>
<header class="page-header">
	<div>
		<h1>New campaign</h1>
		<p>Pick an email and who gets it. Nothing is sent until you press send on the next page.</p>
	</div>
</header>

{#if result?.message}<p class="flash flash-error" role="alert">{result.message}</p>{/if}

<form method="POST" action="?/create">
	<input type="hidden" name="templateId" value={templateId} />
	<input type="hidden" name="audience" value={audience} />

	<div class="card">
		<h2>1. Email</h2>
		<div class="form-grid">
			<div class="field">
				<label for="c-template">Template</label>
				<select id="c-template" bind:value={templateId}>
					<option value="" disabled>Choose…</option>
					{#each data.templates as t (t.id)}
						<option value={t.id} disabled={!t.formIds.length}
							>{t.name}{t.formIds.length ? '' : ' (no linked forms)'}</option
						>
					{/each}
				</select>
				{#if template}<p class="hint">
						Subject: {template.subject} ·
						<a href="/admin/email/templates/{template.id}">edit template</a>
					</p>{/if}
			</div>
			<div class="field">
				<label for="c-name">Campaign name <span class="muted">(only admins see this)</span></label>
				<input id="c-name" name="name" type="text" required bind:value={name} />
			</div>
		</div>
	</div>

	{#if template}
		<div class="card">
			<h2>2. Who gets it</h2>
			<fieldset class="field plain">
				<legend class="label">People who filled in</legend>
				<div class="checks">
					{#each linkedForms as f (f.id)}
						<label class="check"
							><input type="checkbox" value={f.id} bind:group={formIds} /> {f.title}</label
						>
					{/each}
				</div>
			</fieldset>

			<div class="field">
				<span class="label">Only if their answers match <span class="muted">(optional)</span></span>
				<ConditionEditor
					bind:condition
					{targets}
					intro="Send to people when"
					emptyText="No filters: everyone who filled in the forms above."
					addLabel="Add a filter"
				/>
			</div>

			{#if !filtersOnConsent && consentKeys.length}
				<p class="flash flash-info">
					<i class="fas fa-triangle-exclamation"></i> You're not filtering on consent. Consider
					adding a filter on “{consentKeys[0]}” so only people who asked for emails get this one.
				</p>
			{/if}
		</div>

		<div class="card">
			<h2>
				3. Check the list {#if loading}<i class="fas fa-spinner fa-spin muted"></i>{/if}
			</h2>
			{#if previewError}<p class="field-error">{previewError}</p>{/if}
			{#if preview}
				<p class="total">
					<strong>{preview.total}</strong>
					{preview.total === 1 ? 'person' : 'people'} will get this email.
				</p>
				<ul class="counts">
					{#each preview.perForm as f (f.formId)}<li>
							{f.title}: {f.matched} of {f.submissions} match
						</li>{/each}
					{#if preview.excluded.duplicates}<li>
							{preview.excluded.duplicates} duplicate{preview.excluded.duplicates === 1 ? '' : 's'} merged
							(one email per person)
						</li>{/if}
					{#if preview.excluded.suppressed}<li>
							{preview.excluded.suppressed} unsubscribed or bounced, left out
						</li>{/if}
					{#if preview.excluded.noEmail}<li>
							{preview.excluded.noEmail} without an email address
						</li>{/if}
					{#if preview.excluded.manual}<li>{preview.excluded.manual} taken off by hand</li>{/if}
				</ul>

				{#if preview.recipients.length || excluded.length}
					<input
						type="search"
						placeholder="Search recipients"
						bind:value={search}
						class="search"
						aria-label="Search recipients"
					/>
					<div class="table-wrap recipients">
						<table class="list">
							<thead><tr><th>Send</th><th>Email</th><th>Name</th><th>From</th></tr></thead>
							<tbody>
								{#each shown as r (r.email)}
									<tr>
										<td
											><input
												type="checkbox"
												checked
												aria-label="Send to {r.email}"
												onchange={(e) => toggle(r.email, e.currentTarget.checked)}
											/></td
										>
										<td>{r.email}</td>
										<td>{r.name}</td>
										<td class="muted">{r.form}</td>
									</tr>
								{/each}
								{#each excluded as email (email)}
									<tr class="excluded">
										<td
											><input
												type="checkbox"
												aria-label="Send to {email}"
												onchange={() => toggle(email, true)}
											/></td
										>
										<td colspan="3">{email} <span class="muted">(taken off)</span></td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			{/if}

			<button type="submit" class="btn btn-primary" disabled={!preview?.total}>
				<i class="fas fa-arrow-right"></i> Review and send
			</button>
		</div>
	{/if}
</form>

<style>
	form > :global(.card + .card) {
		margin-top: 1.25rem;
	}

	.plain {
		border: none;
		padding: 0;
	}

	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.5rem;
	}

	.total {
		font-size: 1.15rem;
		margin-bottom: 0.4rem;
	}

	.counts {
		margin: 0 0 1rem 1.25rem;
		color: var(--color-text-secondary);
	}

	.search {
		max-width: 320px;
		margin-bottom: 0.75rem;
	}

	.recipients {
		max-height: 420px;
		overflow-y: auto;
		margin-bottom: 1.25rem;
	}

	.excluded td {
		opacity: 0.6;
	}
</style>
