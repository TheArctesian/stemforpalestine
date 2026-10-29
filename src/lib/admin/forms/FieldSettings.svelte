<script lang="ts">
	import ConditionEditor, { type RuleTarget } from '$lib/admin/ConditionEditor.svelte';
	import RichTextEditor from '$lib/admin/RichTextEditor.svelte';
	import type { Field } from '$lib/forms/definition';
	import {
		CHOICE_TYPES,
		FIELD_TYPE_INFO,
		FIELD_TYPES,
		newId,
		type FieldType
	} from '$lib/forms/fields';

	let {
		field = $bindable(),
		targets,
		answered,
		keyTaken,
		onLabelChange,
		onRenameOption,
		onRemove
	}: {
		field: Field;
		/** Other questions this one's visibility can depend on. */
		targets: RuleTarget[];
		/** Whether submissions already have answers to this question. */
		answered: boolean;
		keyTaken: (key: string) => boolean;
		onLabelChange: (label: string) => void;
		onRenameOption: (from: string, to: string) => void;
		onRemove: () => void;
	} = $props();

	const info = $derived(FIELD_TYPE_INFO[field.type]);
	const isChoice = $derived(CHOICE_TYPES.has(field.type));
	const isText = $derived(
		['short_text', 'long_text', 'email', 'phone', 'url'].includes(field.type)
	);
	const canPattern = $derived(
		['short_text', 'long_text', 'email', 'phone', 'url'].includes(field.type)
	);
	const inputTypes = FIELD_TYPES.filter((t) => t !== 'heading' && t !== 'rich_text');

	const keyError = $derived(
		!/^[a-z][a-z0-9_]{0,39}$/.test(field.key)
			? 'Lowercase letters, numbers and underscores, starting with a letter.'
			: keyTaken(field.key)
				? 'Another question already uses this key.'
				: null
	);

	function changeType(type: FieldType) {
		field.type = type;
		if (CHOICE_TYPES.has(type) && !field.options?.length) {
			field.options = [
				{ id: newId(), label: 'Option 1' },
				{ id: newId(), label: 'Option 2' }
			];
		}
		if (type === 'hidden' && !field.urlParam) field.urlParam = 'ref';
	}

	/** Number inputs: blank means "no limit". */
	function setNumber(prop: 'minLength' | 'maxLength' | 'min' | 'max', value: string) {
		field.validation ??= {};
		const n = value.trim() === '' ? undefined : Number(value);
		field.validation[prop] = n !== undefined && Number.isFinite(n) ? n : undefined;
	}

	function setValidationText(prop: 'regex' | 'message', value: string) {
		field.validation ??= {};
		field.validation[prop] = value || undefined;
	}

	function moveOption(index: number, by: -1 | 1) {
		const options = field.options!;
		const [option] = options.splice(index, 1);
		options.splice(index + by, 0, option);
	}

	function addVisibility() {
		const target = targets[0];
		field.visibility = {
			action: 'show',
			match: 'all',
			rules: target ? [{ field: target.value, op: 'equals', value: target.options?.[0] ?? '' }] : []
		};
	}
</script>

<div class="settings">
	<div class="settings-header">
		<h2><i class="fas {info.icon}"></i> {info.label}</h2>
		<button type="button" class="btn btn-small btn-danger" onclick={onRemove}>
			<i class="fas {answered ? 'fa-box-archive' : 'fa-trash'}"></i>
			{answered ? 'Archive' : 'Delete'}
		</button>
	</div>
	{#if answered}
		<p class="hint">
			People have answered this, so removing it archives it: it leaves the form, but its answers
			stay in the submissions table.
		</p>
	{/if}

	{#if field.type === 'rich_text'}
		<div class="field">
			<span class="label">Text</span>
			{#key field.id}
				<RichTextEditor bind:value={field.content} label="Text block" />
			{/key}
		</div>
	{:else}
		<div class="field">
			<label for="field-label">{field.type === 'heading' ? 'Heading' : 'Question'}</label>
			<textarea
				id="field-label"
				rows="2"
				value={field.label}
				oninput={(e) => onLabelChange(e.currentTarget.value)}
			></textarea>
		</div>
		<div class="field">
			<label for="field-caption">Description <span class="muted">(optional)</span></label>
			<textarea id="field-caption" rows="2" bind:value={field.caption}></textarea>
		</div>
	{/if}

	{#if field.type !== 'heading' && field.type !== 'rich_text'}
		<div class="form-grid">
			<div class="field">
				<label for="field-type">Answer type</label>
				<select
					id="field-type"
					value={field.type}
					onchange={(e) => changeType(e.currentTarget.value as FieldType)}
				>
					{#each inputTypes as type (type)}
						<option value={type}>{FIELD_TYPE_INFO[type].label}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="field-key">Key</label>
				<input
					id="field-key"
					type="text"
					bind:value={field.key}
					aria-invalid={!!keyError}
					spellcheck="false"
				/>
				{#if keyError}
					<p class="field-error">{keyError}</p>
				{:else}
					<p class="hint">
						Use <code>{`{{${field.key}}}`}</code> in emails. Changing it breaks templates that use the
						old key.
					</p>
				{/if}
			</div>
		</div>

		<div class="checks">
			{#if field.type !== 'hidden'}
				<label class="check"><input type="checkbox" bind:checked={field.required} /> Required</label
				>
				<label class="check">
					<input
						type="checkbox"
						checked={field.width === 'half'}
						onchange={(e) => (field.width = e.currentTarget.checked ? 'half' : 'full')}
					/>
					Half width
				</label>
			{/if}
			{#if field.type === 'dropdown' || field.type === 'radio' || field.type === 'checkboxes'}
				<label class="check"
					><input type="checkbox" bind:checked={field.allowOther} /> Add an “Other” choice with a text
					box</label
				>
			{/if}
		</div>

		{#if field.type === 'hidden'}
			<div class="field">
				<label for="field-param">Link parameter</label>
				<input id="field-param" type="text" bind:value={field.urlParam} spellcheck="false" />
				<p class="hint">
					Filled from the form's link, e.g. /forms/…?<strong>{field.urlParam || 'ref'}</strong
					>=poster. Not shown to people.
				</p>
			</div>
		{/if}

		{#if isText || field.type === 'number' || field.type === 'dropdown'}
			<div class="form-grid">
				<div class="field">
					<label for="field-placeholder">Placeholder <span class="muted">(optional)</span></label>
					<input id="field-placeholder" type="text" bind:value={field.placeholder} />
				</div>
				{#if field.type === 'long_text'}
					<div class="field">
						<label for="field-rows">Height (lines)</label>
						<input id="field-rows" type="number" min="2" max="20" bind:value={field.rows} />
					</div>
				{/if}
			</div>
		{/if}
	{/if}

	{#if isChoice}
		<fieldset class="options">
			<legend class="label">Options</legend>
			{#each field.options ?? [] as option, i (option.id)}
				<div class="option">
					<input
						type="text"
						aria-label="Option {i + 1}"
						value={option.label}
						oninput={(e) => {
							const to = e.currentTarget.value;
							onRenameOption(option.label, to);
							option.label = to;
						}}
					/>
					<button
						type="button"
						class="btn btn-small"
						aria-label="Move up"
						disabled={i === 0}
						onclick={() => moveOption(i, -1)}><i class="fas fa-arrow-up"></i></button
					>
					<button
						type="button"
						class="btn btn-small"
						aria-label="Move down"
						disabled={i === (field.options?.length ?? 0) - 1}
						onclick={() => moveOption(i, 1)}><i class="fas fa-arrow-down"></i></button
					>
					<button
						type="button"
						class="btn btn-small"
						aria-label="Remove option"
						onclick={() => field.options!.splice(i, 1)}><i class="fas fa-xmark"></i></button
					>
				</div>
			{/each}
			<button
				type="button"
				class="btn btn-small"
				onclick={() =>
					(field.options ??= []).push({
						id: newId(),
						label: `Option ${(field.options?.length ?? 0) + 1}`
					})}
			>
				<i class="fas fa-plus"></i> Add option
			</button>
		</fieldset>
	{/if}

	{#if isText || field.type === 'number'}
		<details
			class="section"
			open={!!(
				field.validation?.regex ||
				field.validation?.minLength ||
				field.validation?.maxLength ||
				field.validation?.min !== undefined ||
				field.validation?.max !== undefined
			)}
		>
			<summary>Validation</summary>
			<div class="form-grid">
				{#if field.type === 'number'}
					<div class="field">
						<label for="v-min">Minimum</label>
						<input
							id="v-min"
							type="number"
							value={field.validation?.min ?? ''}
							oninput={(e) => setNumber('min', e.currentTarget.value)}
						/>
					</div>
					<div class="field">
						<label for="v-max">Maximum</label>
						<input
							id="v-max"
							type="number"
							value={field.validation?.max ?? ''}
							oninput={(e) => setNumber('max', e.currentTarget.value)}
						/>
					</div>
				{:else}
					<div class="field">
						<label for="v-minlength">Minimum length</label>
						<input
							id="v-minlength"
							type="number"
							min="0"
							value={field.validation?.minLength ?? ''}
							oninput={(e) => setNumber('minLength', e.currentTarget.value)}
						/>
					</div>
					<div class="field">
						<label for="v-maxlength">Maximum length</label>
						<input
							id="v-maxlength"
							type="number"
							min="0"
							value={field.validation?.maxLength ?? ''}
							oninput={(e) => setNumber('maxLength', e.currentTarget.value)}
						/>
					</div>
				{/if}
			</div>
			{#if canPattern}
				<div class="field">
					<label for="v-regex">Pattern (regular expression)</label>
					<input
						id="v-regex"
						type="text"
						spellcheck="false"
						value={field.validation?.regex ?? ''}
						oninput={(e) => setValidationText('regex', e.currentTarget.value)}
					/>
					<p class="hint">
						For example <code>.+\s.+</code> needs two words. Emails are checked in lowercase.
					</p>
				</div>
				<div class="field">
					<label for="v-message">Message when it doesn't match</label>
					<input
						id="v-message"
						type="text"
						value={field.validation?.message ?? ''}
						oninput={(e) => setValidationText('message', e.currentTarget.value)}
					/>
				</div>
			{/if}
		</details>
	{/if}

	<details class="section" open={!!field.visibility?.rules.length}>
		<summary>Show or hide</summary>
		{#if field.visibility}
			<div class="field">
				<select class="action" bind:value={field.visibility.action} aria-label="Show or hide">
					<option value="show">Show</option>
					<option value="hide">Hide</option>
				</select>
			</div>
			<ConditionEditor
				bind:condition={field.visibility}
				{targets}
				intro="this question when"
				emptyText="No rules, so it's always shown."
			/>
		{:else}
			<p class="muted">Always shown.</p>
			<button
				type="button"
				class="btn btn-small"
				onclick={addVisibility}
				disabled={!targets.length}
			>
				<i class="fas fa-code-branch"></i> Show or hide based on an answer
			</button>
		{/if}
	</details>
</div>

<style>
	.settings-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.settings-header h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.settings-header h2 i {
		color: var(--color-primary);
		margin-right: 0.35rem;
	}

	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.5rem;
	}

	.options {
		border: none;
		padding: 0;
		margin-bottom: 1rem;
	}

	.options .label {
		font-weight: 600;
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.option {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto auto auto;
		gap: 0.35rem;
		margin-bottom: 0.4rem;
	}

	.section {
		border-top: 1px solid var(--color-border-light);
		padding: 0.85rem 0;
	}

	.section summary {
		font-weight: 700;
		cursor: pointer;
		margin-bottom: 0.75rem;
	}

	.action {
		width: auto !important;
	}

	code {
		background: var(--color-bg-secondary);
		padding: 0.05rem 0.3rem;
		border-radius: 4px;
		font-size: 0.85em;
	}
</style>
