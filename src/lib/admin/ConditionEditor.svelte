<script lang="ts" module>
	import type { FieldType } from '$lib/forms/fields';

	/** Something a rule can test: a field (by id in forms, by key in email audiences). */
	export type RuleTarget = { value: string; label: string; type?: FieldType; options?: string[] };
</script>

<script lang="ts">
	import {
		OPERATOR_LABELS,
		UNARY_OPERATORS,
		type Condition,
		type Operator,
		type Rule
	} from '$lib/forms/conditions';
	import { operatorsFor } from '$lib/forms/fields';

	/*
	 * Edits a list of rules ("Onboarding is Yes"), matched all or any. Used for showing and hiding
	 * questions, picking endings, and filtering email recipients.
	 */
	let {
		condition = $bindable(),
		targets,
		intro = 'when',
		emptyText = 'No rules.',
		addLabel = 'Add a rule'
	}: {
		condition: Condition;
		targets: RuleTarget[];
		/** Words before "all/any of these are true", e.g. "Show this question when". */
		intro?: string;
		emptyText?: string;
		addLabel?: string;
	} = $props();

	const targetFor = (rule: Rule) => targets.find((t) => t.value === rule.field);

	function addRule() {
		const target = targets[0];
		if (!target) return;
		const op = operatorsFor(target.type)[0];
		condition.rules.push({ field: target.value, op, value: target.options?.[0] ?? '' });
	}

	function changeTarget(rule: Rule, value: string) {
		rule.field = value;
		const target = targetFor(rule);
		const ops = operatorsFor(target?.type);
		if (!ops.includes(rule.op)) rule.op = ops[0];
		rule.value = target?.options?.[0] ?? '';
	}
</script>

<div class="conditions">
	{#if condition.rules.length}
		<p class="intro">
			{intro}
			{#if condition.rules.length > 1}
				<select bind:value={condition.match} aria-label="Match all or any rule" class="inline">
					<option value="all">all</option>
					<option value="any">any</option>
				</select>
				of these are true:
			{:else}
				this is true:
			{/if}
		</p>

		<ul class="rules">
			{#each condition.rules as rule, i (i)}
				{@const target = targetFor(rule)}
				<li>
					<select
						aria-label="Question"
						value={rule.field}
						onchange={(e) => changeTarget(rule, e.currentTarget.value)}
					>
						{#if !target}<option value={rule.field}>(missing question)</option>{/if}
						{#each targets as t (t.value)}
							<option value={t.value}>{t.label}</option>
						{/each}
					</select>
					<select aria-label="Comparison" bind:value={rule.op}>
						{#each operatorsFor(target?.type) as op (op)}
							<option value={op}>{OPERATOR_LABELS[op as Operator]}</option>
						{/each}
					</select>
					{#if !UNARY_OPERATORS.has(rule.op)}
						{#if target?.options?.length}
							<select aria-label="Value" bind:value={rule.value}>
								{#each target.options as option (option)}
									<option value={option}>{option}</option>
								{/each}
							</select>
						{:else}
							<input type="text" aria-label="Value" placeholder="Value" bind:value={rule.value} />
						{/if}
					{/if}
					<button
						type="button"
						class="btn btn-small"
						aria-label="Remove rule"
						onclick={() => condition.rules.splice(i, 1)}
					>
						<i class="fas fa-xmark"></i>
					</button>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="muted empty">{emptyText}</p>
	{/if}

	<button type="button" class="btn btn-small" onclick={addRule} disabled={!targets.length}>
		<i class="fas fa-plus"></i>
		{addLabel}
	</button>
</div>

<style>
	.intro {
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.inline {
		width: auto !important;
		display: inline-block;
		padding: 0.2rem 0.4rem !important;
		margin: 0 0.25rem;
	}

	.rules {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.rules li {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 1.2fr) minmax(0, 2fr) auto;
		gap: 0.4rem;
		align-items: center;
	}

	.empty {
		margin-bottom: 0.6rem;
	}

	@media (max-width: 640px) {
		.rules li {
			grid-template-columns: 1fr auto;
		}
	}
</style>
