<script lang="ts">
	import type { Field } from './definition';
	import { OTHER_VALUE, otherInputName } from './fields';
	import type { RawAnswers } from './validate';

	let {
		field,
		raw = $bindable(),
		error,
		idPrefix = 'q'
	}: { field: Field; raw: RawAnswers; error?: string; idPrefix?: string } = $props();

	const inputId = $derived(`${idPrefix}-${field.id}`);
	const describedBy = $derived(
		[field.caption && `${inputId}-caption`, error && `${inputId}-error`]
			.filter(Boolean)
			.join(' ') || undefined
	);

	const text = $derived(typeof raw[field.id] === 'string' ? (raw[field.id] as string) : '');
	const list = $derived(Array.isArray(raw[field.id]) ? (raw[field.id] as string[]) : []);
	const otherName = $derived(otherInputName(field.id));
	const otherText = $derived((raw[otherName] as string | undefined) ?? '');
	const otherPicked = $derived(text === OTHER_VALUE || list.includes(OTHER_VALUE));

	const autocomplete = $derived<'name' | 'email' | 'tel' | undefined>(
		field.key === 'name'
			? 'name'
			: field.type === 'email'
				? 'email'
				: field.type === 'phone'
					? 'tel'
					: undefined
	);

	const inputType = $derived(
		(
			{ email: 'email', phone: 'tel', number: 'text', url: 'url', date: 'date' } as Record<
				string,
				string
			>
		)[field.type] ?? 'text'
	);

	function set(value: string) {
		raw[field.id] = value;
	}

	function toggle(label: string, checked: boolean) {
		raw[field.id] = checked ? [...list, label] : list.filter((v) => v !== label);
	}
</script>

{#if field.type === 'heading'}
	<div class="block">
		<h2 class="heading">{field.label}</h2>
		{#if field.caption}<p class="caption">{field.caption}</p>{/if}
	</div>
{:else if field.type === 'rich_text'}
	<!-- Sanitised when the form is saved (sanitizeRichText). -->
	<div class="block rich">{@html field.content ?? ''}</div>
{:else if field.type === 'hidden'}
	<input type="hidden" name={field.id} value={text} />
{:else}
	<div class="question" class:invalid={!!error}>
		{#if field.type === 'radio' || field.type === 'checkboxes'}
			<fieldset aria-describedby={describedBy}>
				<legend class="label">
					{field.label}{#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
				</legend>
				{#if field.caption}<p class="caption" id="{inputId}-caption">{field.caption}</p>{/if}
				<div class="choices">
					{#each field.options ?? [] as option (option.id)}
						<label class="choice">
							{#if field.type === 'radio'}
								<input
									type="radio"
									name={field.id}
									value={option.label}
									checked={text === option.label}
									required={field.required}
									onchange={() => set(option.label)}
								/>
							{:else}
								<input
									type="checkbox"
									name={field.id}
									value={option.label}
									checked={list.includes(option.label)}
									onchange={(e) => toggle(option.label, e.currentTarget.checked)}
								/>
							{/if}
							<span>{option.label}</span>
						</label>
					{/each}
					{#if field.allowOther}
						<label class="choice">
							{#if field.type === 'radio'}
								<input
									type="radio"
									name={field.id}
									value={OTHER_VALUE}
									checked={text === OTHER_VALUE}
									onchange={() => set(OTHER_VALUE)}
								/>
							{:else}
								<input
									type="checkbox"
									name={field.id}
									value={OTHER_VALUE}
									checked={list.includes(OTHER_VALUE)}
									onchange={(e) => toggle(OTHER_VALUE, e.currentTarget.checked)}
								/>
							{/if}
							<span>Other</span>
						</label>
					{/if}
				</div>
			</fieldset>
		{:else if field.type === 'checkbox'}
			<label class="choice single">
				<input
					type="checkbox"
					id={inputId}
					name={field.id}
					checked={text !== ''}
					required={field.required}
					aria-describedby={describedBy}
					aria-invalid={!!error}
					onchange={(e) => set(e.currentTarget.checked ? 'on' : '')}
				/>
				<span>
					{field.label}{#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
				</span>
			</label>
			{#if field.caption}<p class="caption" id="{inputId}-caption">{field.caption}</p>{/if}
		{:else}
			<label class="label" for={inputId}>
				{field.label}{#if field.required}<span class="required" aria-hidden="true">*</span>{/if}
			</label>
			{#if field.caption}<p class="caption" id="{inputId}-caption">{field.caption}</p>{/if}

			{#if field.type === 'long_text'}
				<textarea
					id={inputId}
					name={field.id}
					rows={field.rows ?? 4}
					placeholder={field.placeholder}
					required={field.required}
					aria-describedby={describedBy}
					aria-invalid={!!error}
					value={text}
					oninput={(e) => set(e.currentTarget.value)}
				></textarea>
			{:else if field.type === 'dropdown'}
				<select
					id={inputId}
					name={field.id}
					required={field.required}
					aria-describedby={describedBy}
					aria-invalid={!!error}
					value={text}
					onchange={(e) => set(e.currentTarget.value)}
				>
					<option value="" disabled={field.required}>{field.placeholder || 'Choose…'}</option>
					{#each field.options ?? [] as option (option.id)}
						<option value={option.label}>{option.label}</option>
					{/each}
					{#if field.allowOther}<option value={OTHER_VALUE}>Other…</option>{/if}
				</select>
			{:else}
				<input
					id={inputId}
					name={field.id}
					type={inputType}
					inputmode={field.type === 'number' ? 'decimal' : undefined}
					{autocomplete}
					placeholder={field.placeholder}
					required={field.required}
					aria-describedby={describedBy}
					aria-invalid={!!error}
					value={text}
					oninput={(e) => set(e.currentTarget.value)}
				/>
			{/if}
		{/if}

		{#if field.allowOther && otherPicked}
			<input
				class="other-input"
				name={otherName}
				type="text"
				aria-label="{field.label}: other"
				placeholder="Please specify"
				value={otherText}
				oninput={(e) => (raw[otherName] = e.currentTarget.value)}
			/>
		{/if}

		{#if error}<p class="error" id="{inputId}-error">{error}</p>{/if}
	</div>
{/if}

<style>
	.block,
	.question {
		margin-bottom: 1.5rem;
	}

	.heading {
		font-size: 1.35rem;
		margin-bottom: 0.25rem;
	}

	.rich :global(p) {
		color: var(--color-text-secondary);
	}

	.rich :global(a) {
		color: var(--color-primary-dark);
		text-decoration: underline;
	}

	fieldset {
		border: none;
		padding: 0;
		margin: 0;
		min-width: 0;
	}

	.label {
		display: block;
		font-weight: 600;
		color: var(--color-text-primary);
		margin-bottom: 0.4rem;
		padding: 0;
	}

	.required {
		color: #dc2626;
		margin-left: 0.2rem;
	}

	.caption {
		font-size: 0.9rem;
		color: var(--color-text-light);
		margin: -0.2rem 0 0.6rem;
	}

	input:not([type='radio'], [type='checkbox']),
	select,
	textarea {
		width: 100%;
		padding: 0.7rem 0.85rem;
		border: 1px solid var(--color-border-medium);
		border-radius: 8px;
		background: #ffffff;
		color: var(--color-text-primary);
		font: inherit;
	}

	textarea {
		resize: vertical;
	}

	:is(input, select, textarea):focus-visible {
		outline: 2px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
		border-color: var(--color-primary);
	}

	.choices {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.choice {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.65rem 0.85rem;
		border: 1px solid var(--color-border-medium);
		border-radius: 8px;
		background: #ffffff;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}

	.choice:hover {
		border-color: var(--color-primary);
	}

	.choice:has(input:checked) {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 7%, #ffffff);
	}

	.choice input {
		accent-color: var(--color-primary);
		width: 1.1rem;
		height: 1.1rem;
		flex-shrink: 0;
	}

	.choice.single {
		font-weight: 600;
	}

	.other-input {
		margin-top: 0.5rem;
	}

	.invalid :is(input:not([type='radio'], [type='checkbox']), select, textarea),
	.invalid .choice {
		border-color: #dc2626;
	}

	.error {
		color: #b91c1c;
		font-size: 0.9rem;
		font-weight: 500;
		margin: 0.4rem 0 0;
	}
</style>
