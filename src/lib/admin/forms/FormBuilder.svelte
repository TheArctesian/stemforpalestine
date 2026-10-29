<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConditionEditor, { type RuleTarget } from '$lib/admin/ConditionEditor.svelte';
	import RichTextEditor from '$lib/admin/RichTextEditor.svelte';
	import FieldSettings from './FieldSettings.svelte';
	import FormRenderer from '$lib/forms/FormRenderer.svelte';
	import type { Field, FormDefinition } from '$lib/forms/definition';
	import {
		CHOICE_TYPES,
		DISPLAY_TYPES,
		FIELD_TYPE_INFO,
		FIELD_TYPES,
		newId,
		slugifyKey,
		type FieldType
	} from '$lib/forms/fields';
	import { pickEnding, validateSubmission, type RawAnswers } from '$lib/forms/validate';

	let {
		formId,
		initial,
		answeredFieldIds,
		submissions,
		result
	}: {
		formId: string;
		initial: FormDefinition;
		answeredFieldIds: string[];
		submissions: number;
		result: { issues?: string[]; deleteError?: string } | null | undefined;
	} = $props();

	/** Every ending but the last gets a (possibly empty) condition, so the editor has one to bind to. */
	function normalize(definition: FormDefinition): FormDefinition {
		const copy = structuredClone(definition);
		copy.endings.forEach((ending, i) => {
			ending.condition =
				i === copy.endings.length - 1 ? null : (ending.condition ?? { match: 'all', rules: [] });
		});
		return copy;
	}

	let def = $state(normalize(initial));
	let savedJson = $state(JSON.stringify(normalize(initial)));
	const json = $derived(JSON.stringify(def));
	const dirty = $derived(json !== savedJson);

	let tab = $state<'fields' | 'endings' | 'settings' | 'preview'>('fields');
	let selectedId = $state<string | null>(initial.fields.find((f) => !f.archived)?.id ?? null);
	let issues = $state<string[]>([]);
	let saving = $state(false);
	let savedAt = $state<Date | null>(null);

	const answered = $derived(new Set(answeredFieldIds));
	/** Fields added since the page loaded: their key follows the label until edited. */
	const newFieldIds = new Set<string>();

	const active = $derived(def.fields.filter((f) => !f.archived));
	const archived = $derived(def.fields.filter((f) => f.archived));
	const selectedIndex = $derived(def.fields.findIndex((f) => f.id === selectedId));
	const emailFields = $derived(active.filter((f) => f.type === 'email'));

	function targetsFor(excludeId?: string): RuleTarget[] {
		return active
			.filter((f) => !DISPLAY_TYPES.has(f.type) && f.id !== excludeId)
			.map((f) => ({
				value: f.id,
				label: f.label || f.key,
				type: f.type,
				options: CHOICE_TYPES.has(f.type) ? f.options?.map((o) => o.label) : undefined
			}));
	}

	const keyTaken = (key: string, ownId: string) =>
		def.fields.some((f) => f.id !== ownId && f.key === key);

	function uniqueKey(base: string, ownId?: string): string {
		let key = base || 'question';
		for (let n = 2; def.fields.some((f) => f.id !== ownId && f.key === key); n++)
			key = `${base}_${n}`;
		return key;
	}

	function addField(type: FieldType) {
		const labels: Partial<Record<FieldType, string>> = {
			heading: 'Section heading',
			hidden: 'Source'
		};
		const label = labels[type] ?? (type === 'rich_text' ? '' : 'Untitled question');
		const field: Field = {
			id: newId(),
			key: uniqueKey(type === 'rich_text' ? 'text_block' : slugifyKey(label)),
			type,
			label
		};
		if (CHOICE_TYPES.has(type)) {
			field.options = [
				{ id: newId(), label: 'Option 1' },
				{ id: newId(), label: 'Option 2' }
			];
		}
		if (type === 'rich_text') field.content = '<p>Write something here.</p>';
		if (type === 'long_text') field.rows = 4;
		if (type === 'hidden') field.urlParam = 'ref';
		newFieldIds.add(field.id);

		// Straight after the selected question, or at the end.
		const at = selectedIndex >= 0 ? selectedIndex + 1 : def.fields.length;
		def.fields.splice(at, 0, field);
		selectedId = field.id;
	}

	function changeLabel(field: Field, label: string) {
		field.label = label;
		if (newFieldIds.has(field.id) && field.type !== 'rich_text')
			field.key = uniqueKey(slugifyKey(label), field.id);
	}

	/** Rules that compared against an option's old label follow it to its new one. */
	function renameOption(fieldId: string, from: string, to: string) {
		const rules = [
			...def.fields.flatMap((f) => f.visibility?.rules ?? []),
			...def.endings.flatMap((e) => e.condition?.rules ?? [])
		];
		for (const rule of rules) if (rule.field === fieldId && rule.value === from) rule.value = to;
	}

	function dropRulesFor(fieldId: string) {
		for (const f of def.fields)
			if (f.visibility) f.visibility.rules = f.visibility.rules.filter((r) => r.field !== fieldId);
		for (const e of def.endings)
			if (e.condition) e.condition.rules = e.condition.rules.filter((r) => r.field !== fieldId);
	}

	function removeField(field: Field) {
		dropRulesFor(field.id);
		if (def.emailFieldId === field.id)
			def.emailFieldId = emailFields.find((f) => f.id !== field.id)?.id ?? null;
		const index = def.fields.indexOf(field);
		if (answered.has(field.id)) {
			field.archived = true;
			field.visibility = null;
		} else {
			def.fields.splice(index, 1);
		}
		selectedId = active[Math.min(index, active.length - 1)]?.id ?? null;
	}

	function move(fieldId: string, toId: string) {
		if (fieldId === toId) return;
		const from = def.fields.findIndex((f) => f.id === fieldId);
		const [field] = def.fields.splice(from, 1);
		def.fields.splice(
			def.fields.findIndex((f) => f.id === toId) +
				(from <= def.fields.findIndex((f) => f.id === toId) ? 1 : 0),
			0,
			field
		);
	}

	function nudge(field: Field, by: -1 | 1) {
		const list = active;
		const neighbour = list[list.indexOf(field) + by];
		if (!neighbour) return;
		const [a, b] = [def.fields.indexOf(field), def.fields.indexOf(neighbour)];
		[def.fields[a], def.fields[b]] = [def.fields[b], def.fields[a]];
	}

	let dragId = $state<string | null>(null);
	let dragOverId = $state<string | null>(null);

	function addEnding() {
		def.endings.splice(def.endings.length - 1, 0, {
			id: newId(),
			condition: { match: 'all', rules: [] },
			html: '<h2>Thanks!</h2><p>We got your response.</p>'
		});
	}

	const save: SubmitFunction = () => {
		saving = true;
		issues = [];
		return async ({ result }) => {
			saving = false;
			if (result.type === 'success' && result.data?.definition) {
				def = normalize(result.data.definition as FormDefinition);
				savedJson = JSON.stringify(def);
				savedAt = new Date();
			} else if (result.type === 'failure') {
				issues = (result.data?.issues as string[]) ?? ['Saving failed.'];
			} else if (result.type === 'error') {
				issues = [result.error?.message ?? 'Saving failed.'];
			}
		};
	};

	beforeNavigate(({ cancel, type }) => {
		if (!dirty || saving) return;
		// "leave" (closing the tab) shows the browser's own prompt when cancelled.
		if (type === 'leave' || !confirm('You have unsaved changes. Leave without saving?')) cancel();
	});

	// Preview
	let previewRaw = $state<RawAnswers>({});
	let previewErrors = $state<Record<string, string>>({});
	let previewEnding = $state<string | null>(null);
	function previewSubmit(event: SubmitEvent) {
		event.preventDefault();
		const { errors, answers } = validateSubmission(def, previewRaw);
		previewErrors = errors;
		if (!Object.keys(errors).length) previewEnding = pickEnding(def.endings, answers)?.html ?? '';
	}

	const groups = ['Content', 'Text', 'Choice', 'Other'] as const;
	const statusBadge = { draft: 'badge-amber', open: 'badge-green', closed: '' } as const;
	const timeFormat = new Intl.DateTimeFormat('en-US', { timeStyle: 'short' });
</script>

<a href="/admin/forms" class="back-link"><i class="fas fa-arrow-left"></i> Forms</a>
<header class="page-header builder-header">
	<div>
		<h1>
			{def.title || 'Untitled form'}
			<span class="badge {statusBadge[def.status]}">{def.status}</span>
		</h1>
		<p>
			<a href="/forms/{def.slug}" target="_blank" rel="noopener noreferrer">/forms/{def.slug}</a>
			·
			<a href="/admin/forms/{formId}/submissions"
				>{submissions} submission{submissions === 1 ? '' : 's'}</a
			>
		</p>
	</div>
	<form method="POST" action="?/save" use:enhance={save} class="actions">
		<input type="hidden" name="definition" value={json} />
		{#if dirty}
			<span class="muted">Unsaved changes</span>
		{:else if savedAt}
			<span class="muted"><i class="fas fa-check"></i> Saved at {timeFormat.format(savedAt)}</span>
		{/if}
		<button type="submit" class="btn btn-primary" disabled={saving || !dirty}>
			<i class="fas fa-floppy-disk"></i>
			{saving ? 'Saving…' : 'Save'}
		</button>
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

<div class="tabs" role="tablist">
	{#each [['fields', 'Questions', 'fa-list'], ['endings', 'Endings', 'fa-flag-checkered'], ['settings', 'Settings', 'fa-gear'], ['preview', 'Preview', 'fa-eye']] as [id, label, icon] (id)}
		<button
			type="button"
			role="tab"
			aria-selected={tab === id}
			class:active={tab === id}
			onclick={() => (tab = id as typeof tab)}
		>
			<i class="fas {icon}"></i>
			{label}
		</button>
	{/each}
</div>

{#if tab === 'fields'}
	<div class="builder">
		<aside class="card field-list">
			<ol>
				{#each active as field, i (field.id)}
					{@const info = FIELD_TYPE_INFO[field.type]}
					<li
						draggable="true"
						class:selected={field.id === selectedId}
						class:drag-over={dragOverId === field.id && dragId !== field.id}
						ondragstart={(e) => {
							dragId = field.id;
							e.dataTransfer?.setData('text/plain', field.id);
						}}
						ondragover={(e) => {
							e.preventDefault();
							dragOverId = field.id;
						}}
						ondragleave={() => (dragOverId = dragOverId === field.id ? null : dragOverId)}
						ondrop={(e) => {
							e.preventDefault();
							if (dragId) move(dragId, field.id);
							dragId = dragOverId = null;
						}}
						ondragend={() => (dragId = dragOverId = null)}
					>
						<span class="grip" aria-hidden="true"><i class="fas fa-grip-vertical"></i></span>
						<button type="button" class="field-button" onclick={() => (selectedId = field.id)}>
							<i class="fas {info.icon} type-icon" title={info.label}></i>
							<span class="field-text">
								<span class="field-label">
									{field.type === 'rich_text'
										? 'Text block'
										: field.label || 'Untitled'}{#if field.required}<span class="required">*</span
										>{/if}
								</span>
								{#if !DISPLAY_TYPES.has(field.type)}<code class="field-key">{field.key}</code>{/if}
							</span>
							{#if field.visibility?.rules.length}<i
									class="fas fa-code-branch logic"
									title="Shown or hidden by rules"
								></i>{/if}
						</button>
						<span class="reorder">
							<button
								type="button"
								aria-label="Move up"
								disabled={i === 0}
								onclick={() => nudge(field, -1)}><i class="fas fa-chevron-up"></i></button
							>
							<button
								type="button"
								aria-label="Move down"
								disabled={i === active.length - 1}
								onclick={() => nudge(field, 1)}><i class="fas fa-chevron-down"></i></button
							>
						</span>
					</li>
				{:else}
					<li class="muted none">No questions yet.</li>
				{/each}
			</ol>

			<div class="palette">
				{#each groups as group (group)}
					<p class="palette-group">{group}</p>
					<div class="palette-buttons">
						{#each FIELD_TYPES.filter((t) => FIELD_TYPE_INFO[t].group === group) as type (type)}
							<button type="button" class="btn btn-small" onclick={() => addField(type)}>
								<i class="fas {FIELD_TYPE_INFO[type].icon}"></i>
								{FIELD_TYPE_INFO[type].label}
							</button>
						{/each}
					</div>
				{/each}
			</div>

			{#if archived.length}
				<details class="archived">
					<summary>Archived ({archived.length})</summary>
					<ul>
						{#each archived as field (field.id)}
							<li>
								<span>{field.label || field.key}</span>
								<button type="button" class="btn btn-small" onclick={() => (field.archived = false)}
									>Restore</button
								>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</aside>

		<section class="card">
			{#if selectedIndex >= 0 && !def.fields[selectedIndex].archived}
				{#key selectedId}
					<FieldSettings
						bind:field={def.fields[selectedIndex]}
						targets={targetsFor(selectedId!)}
						answered={answered.has(selectedId!)}
						keyTaken={(key) => keyTaken(key, selectedId!)}
						onLabelChange={(label) => changeLabel(def.fields[selectedIndex], label)}
						onRenameOption={(from, to) => renameOption(selectedId!, from, to)}
						onRemove={() => removeField(def.fields[selectedIndex])}
					/>
				{/key}
			{:else}
				<div class="empty-state">
					<i class="fas fa-hand-pointer"></i>
					<p>Pick a question to edit it, or add one.</p>
				</div>
			{/if}
		</section>
	</div>
{:else if tab === 'endings'}
	<p class="hint intro">
		What people see after they submit. The first ending whose rules match is shown; the last one is
		the default.
	</p>
	{#each def.endings as ending, i (ending.id)}
		{@const isDefault = i === def.endings.length - 1}
		<div class="card">
			<div class="ending-header">
				<h2>{isDefault ? 'Default ending' : `Ending ${i + 1}`}</h2>
				{#if !isDefault}
					<button
						type="button"
						class="btn btn-small btn-danger"
						onclick={() => def.endings.splice(i, 1)}><i class="fas fa-trash"></i> Remove</button
					>
				{/if}
			</div>
			{#if !isDefault && ending.condition}
				<div class="ending-condition">
					<ConditionEditor
						bind:condition={ending.condition}
						targets={targetsFor()}
						intro="Show this ending"
						emptyText="No rules yet, so this ending always wins."
					/>
				</div>
			{/if}
			<RichTextEditor bind:value={ending.html} label="Ending {i + 1}" />
		</div>
	{/each}
	<button type="button" class="btn add-ending" onclick={addEnding}
		><i class="fas fa-plus"></i> Add a conditional ending</button
	>
{:else if tab === 'settings'}
	<div class="card">
		<h2>Settings</h2>
		<div class="form-grid">
			<div class="field">
				<label for="s-title">Title</label>
				<input id="s-title" type="text" bind:value={def.title} />
			</div>
			<div class="field">
				<label for="s-slug">Address</label>
				<input id="s-slug" type="text" bind:value={def.slug} spellcheck="false" />
				<p class="hint">
					stem4pal.org/forms/<strong>{def.slug}</strong>. Changing it breaks links that are already
					out there.
				</p>
			</div>
			<div class="field">
				<label for="s-submit">Submit button</label>
				<input id="s-submit" type="text" bind:value={def.submitLabel} />
			</div>
			<div class="field">
				<label for="s-email">Submitter's email</label>
				<select id="s-email" bind:value={def.emailFieldId}>
					<option value={null}>None</option>
					{#each emailFields as f (f.id)}<option value={f.id}>{f.label}</option>{/each}
				</select>
				<p class="hint">The address the email system sends to.</p>
			</div>
		</div>

		<fieldset class="status">
			<legend class="label">Status</legend>
			{#each [['draft', 'Draft', 'Only admins can see it; it can’t be submitted.'], ['open', 'Open', 'Anyone with the link can submit it.'], ['closed', 'Closed', 'Shows the message below instead of the questions.']] as [value, label, hint] (value)}
				<label class="check">
					<input type="radio" name="status" {value} bind:group={def.status} />
					<span><strong>{label}</strong> <span class="muted">{hint}</span></span>
				</label>
			{/each}
		</fieldset>

		<div class="field">
			<label for="s-closed">Message when closed</label>
			<textarea id="s-closed" rows="2" bind:value={def.closedMessage}></textarea>
		</div>
	</div>

	<form method="POST" action="?/delete" class="card card-danger" use:enhance>
		<h2>Delete form</h2>
		<p class="hint">
			Deletes the form and all {submissions} of its submissions, for good. To confirm, type its title:
			<strong>{initial.title}</strong>
		</p>
		{#if result?.deleteError}<p class="flash flash-error">{result.deleteError}</p>{/if}
		<div class="actions">
			<input
				type="text"
				name="confirm"
				aria-label="Type the form title to confirm"
				class="confirm-input"
				autocomplete="off"
			/>
			<button type="submit" class="btn btn-danger"><i class="fas fa-trash"></i> Delete form</button>
		</div>
	</form>
{:else}
	<div class="preview">
		<p class="hint">Try the form here. Nothing is saved.</p>
		<div class="preview-card">
			{#if previewEnding !== null}
				<div class="ending">{@html previewEnding}</div>
				<button
					type="button"
					class="btn"
					onclick={() => {
						previewEnding = null;
						previewRaw = {};
						previewErrors = {};
					}}
				>
					<i class="fas fa-rotate-left"></i> Start over
				</button>
			{:else}
				<h1>{def.title}</h1>
				<form novalidate onsubmit={previewSubmit}>
					<FormRenderer
						fields={def.fields}
						bind:raw={previewRaw}
						errors={previewErrors}
						idPrefix="preview"
					/>
					<button type="submit" class="btn btn-primary">{def.submitLabel}</button>
				</form>
			{/if}
		</div>
	</div>
{/if}

<style>
	.builder-header h1 .badge {
		vertical-align: middle;
		margin-left: 0.4rem;
	}

	.builder-header a {
		color: var(--color-primary-dark);
	}

	.flash ul {
		margin: 0.4rem 0 0 1.25rem;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		border-bottom: 1px solid var(--color-border-light);
		margin-bottom: 1.25rem;
		overflow-x: auto;
	}

	.tabs button {
		background: none;
		border: none;
		border-bottom: 3px solid transparent;
		padding: 0.65rem 1rem;
		font: inherit;
		font-weight: 600;
		color: var(--color-text-light);
		cursor: pointer;
		white-space: nowrap;
	}

	.tabs button.active {
		color: var(--color-primary-dark);
		border-bottom-color: var(--color-primary);
	}

	.builder {
		display: grid;
		grid-template-columns: minmax(260px, 360px) minmax(0, 1fr);
		gap: 1.25rem;
		align-items: start;
	}

	.builder > :global(.card + .card) {
		margin-top: 0;
	}

	.field-list {
		padding: 0.75rem;
		position: sticky;
		top: 1rem;
		max-height: calc(100vh - 2rem);
		overflow-y: auto;
	}

	.field-list ol {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-bottom: 1rem;
	}

	.field-list li {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		border: 1px solid var(--color-border-light);
		border-radius: 8px;
		background: #ffffff;
	}

	.field-list li.selected {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 6%, #ffffff);
	}

	.field-list li.drag-over {
		box-shadow: 0 -3px 0 var(--color-primary);
	}

	.field-list li.none {
		padding: 0.75rem;
		border-style: dashed;
	}

	.grip {
		padding-left: 0.5rem;
		color: var(--color-border-medium);
		cursor: grab;
	}

	.field-button {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.55rem 0.25rem;
		background: none;
		border: none;
		font: inherit;
		text-align: left;
		cursor: pointer;
		color: var(--color-text-primary);
	}

	.type-icon {
		color: var(--color-primary);
		width: 1rem;
		text-align: center;
	}

	.field-text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.field-label {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.field-key {
		font-size: 0.75rem;
		color: var(--color-text-light);
	}

	.required {
		color: #dc2626;
		margin-left: 0.15rem;
	}

	.logic {
		color: var(--color-header-light);
		margin-left: auto;
	}

	.reorder {
		display: flex;
		flex-direction: column;
		padding-right: 0.25rem;
	}

	.reorder button {
		background: none;
		border: none;
		padding: 0 0.3rem;
		color: var(--color-text-light);
		cursor: pointer;
		font-size: 0.7rem;
	}

	.reorder button:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.palette-group {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-light);
		margin: 0.75rem 0 0.35rem;
	}

	.palette-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.archived {
		margin-top: 1rem;
		border-top: 1px solid var(--color-border-light);
		padding-top: 0.75rem;
	}

	.archived summary {
		font-weight: 600;
		cursor: pointer;
	}

	.archived ul {
		list-style: none;
		margin-top: 0.5rem;
	}

	.archived li {
		justify-content: space-between;
		padding: 0.4rem 0.6rem;
		margin-bottom: 0.3rem;
	}

	.intro {
		margin-bottom: 1rem;
	}

	.ending-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.ending-condition {
		margin-bottom: 1rem;
		padding: 0.85rem;
		background: var(--color-bg-secondary);
		border-radius: 8px;
	}

	.add-ending {
		margin-top: 1rem;
	}

	.status {
		border: none;
		padding: 0;
		margin-bottom: 1rem;
	}

	.status .label {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.status .check {
		margin-bottom: 0.5rem;
	}

	.confirm-input {
		max-width: 320px;
	}

	.preview-card {
		max-width: 720px;
		background: #fbfdfc;
		border: 1px solid var(--color-border-light);
		border-radius: 14px;
		padding: 2rem;
		margin-top: 0.75rem;
	}

	.preview-card h1 {
		font-size: 1.8rem;
		margin-bottom: 1.5rem;
	}

	@media (max-width: 900px) {
		.builder {
			grid-template-columns: minmax(0, 1fr);
		}

		.field-list {
			position: static;
			max-height: none;
		}
	}
</style>
