<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ConfirmButton from '$lib/admin/ConfirmButton.svelte';
	import RichTextEditor from '$lib/admin/RichTextEditor.svelte';
	import { uploadFile } from '$lib/admin/upload';
	import { BUILT_INS, usedPlaceholders } from '$lib/email/placeholders';
	import { DISPLAY_TYPES } from '$lib/forms/fields';

	let { data, form: result } = $props();

	let name = $state(data.template.name);
	let subject = $state(data.template.subject);
	let html = $state(data.template.html);
	let formIds = $state<string[]>(data.formIds);
	let busy = $state(false);
	let subjectInput: HTMLInputElement;

	const linkedForms = $derived(data.forms.filter((f) => formIds.includes(f.id)));
	const builtInKeys = new Set<string>(BUILT_INS.map((b) => b.key));

	/** Every key in the linked forms, then the built-ins, for the "Insert field" menus. */
	const placeholders = $derived.by(() => {
		const keys = new Map<string, string>();
		for (const form of linkedForms) {
			for (const field of form.fields) {
				if (!DISPLAY_TYPES.has(field.type) && !keys.has(field.key))
					keys.set(field.key, field.label || field.key);
			}
		}
		// A form question with a built-in's key (often "email") fills it, so it's listed once.
		const builtIns = BUILT_INS.filter((b) => !keys.has(b.key)).map((b) => ({
			key: b.key,
			label: b.label
		}));
		return [...[...keys].map(([key, label]) => ({ key, label })), ...builtIns];
	});

	/** Placeholders some linked form can't fill, and that have no fallback. */
	const warnings = $derived.by(() => {
		const out: string[] = [];
		for (const { key, fallback } of usedPlaceholders(`${subject} ${html}`)) {
			if (builtInKeys.has(key) || fallback) continue;
			const missing = linkedForms
				.filter((f) => !f.fields.some((field) => field.key === key))
				.map((f) => f.title);
			if (!linkedForms.length || missing.length) {
				out.push(
					linkedForms.length
						? `{{${key}}} isn't a question in ${missing.join(', ')}; those recipients will see nothing there. Add a fallback like {{${key}|…}}.`
						: `{{${key}}} needs a linked form to come from.`
				);
			}
		}
		return out;
	});

	function insertInSubject(key: string) {
		const at = subjectInput.selectionStart ?? subject.length;
		subject = `${subject.slice(0, at)}{{${key}}}${subject.slice(at)}`;
	}

	const submit: SubmitFunction = () => {
		busy = true;
		return async ({ update }) => {
			await update({ reset: false, invalidateAll: false });
			busy = false;
		};
	};
</script>

<svelte:head>
	<title>{name} | STEM4Palestine Admin</title>
</svelte:head>

<a href="/admin/email/templates" class="back-link"
	><i class="fas fa-arrow-left"></i> Email templates</a
>
<header class="page-header">
	<div>
		<h1>{name || 'Untitled email'}</h1>
		<p>Edits here don't change campaigns already made from this template.</p>
	</div>
	<div class="actions">
		<form method="POST" action="?/duplicate" use:enhance>
			<button type="submit" class="btn"><i class="fas fa-clone"></i> Duplicate</button>
		</form>
		<a href="/admin/email/campaigns/new?template={data.template.id}" class="btn btn-primary"
			><i class="fas fa-paper-plane"></i> Send…</a
		>
	</div>
</header>

{#if result?.saved}<p class="flash flash-success" role="status">Saved.</p>{/if}
{#if result?.message}<p class="flash flash-error" role="alert">{result.message}</p>{/if}

<form method="POST" action="?/save" use:enhance={submit} class="editor">
	<div class="card">
		<div class="field">
			<label for="t-name">Template name <span class="muted">(only admins see this)</span></label>
			<input id="t-name" name="name" type="text" required bind:value={name} />
		</div>

		<fieldset class="field forms">
			<legend class="label">Linked forms</legend>
			<p class="hint">
				Placeholders come from these forms' answers, and campaigns can go to their submitters.
			</p>
			<div class="form-checks">
				{#each data.forms as f (f.id)}
					<label class="check"
						><input type="checkbox" name="formIds" value={f.id} bind:group={formIds} />
						{f.title}</label
					>
				{:else}
					<p class="muted">No forms yet.</p>
				{/each}
			</div>
		</fieldset>

		<div class="field">
			<label for="t-subject">Subject</label>
			<div class="subject-row">
				<input
					id="t-subject"
					name="subject"
					type="text"
					required
					bind:value={subject}
					bind:this={subjectInput}
				/>
				<select
					aria-label="Insert a field into the subject"
					onchange={(e) => {
						if (e.currentTarget.value) insertInSubject(e.currentTarget.value);
						e.currentTarget.value = '';
					}}
				>
					<option value="">Insert field…</option>
					{#each placeholders.filter((p) => p.key !== 'unsubscribe_url') as p (p.key)}<option
							value={p.key}>{p.label}</option
						>{/each}
				</select>
			</div>
		</div>

		<div class="field">
			<span class="label">Message</span>
			<RichTextEditor
				bind:value={html}
				name="html"
				label="Message"
				toolbar="full"
				height={420}
				{placeholders}
				uploadImage={uploadFile}
			/>
			<p class="hint">
				Every email ends with an unsubscribe link and the reason they're getting it.
			</p>
		</div>

		{#if warnings.length}
			<div class="flash flash-info">
				<ul>
					{#each warnings as w (w)}<li>{w}</li>{/each}
				</ul>
			</div>
		{/if}

		<div class="actions">
			<button type="submit" class="btn btn-primary" disabled={busy}
				><i class="fas fa-floppy-disk"></i> Save</button
			>
		</div>
	</div>

	<div class="card">
		<h2>Preview and test</h2>
		<div class="form-grid">
			<div class="field">
				<label for="t-sample">Fill placeholders from</label>
				<select id="t-sample" name="submissionId">
					<option value="">Example values</option>
					{#each data.samples as s (s.id)}<option value={s.id}
							>{s.email ?? '(no email)'} · {data.forms.find((f) => f.id === s.formId)
								?.title}</option
						>{/each}
				</select>
			</div>
			<div class="field">
				<label for="t-to">Send a test to</label>
				<input id="t-to" name="to" type="email" placeholder="you@example.org" />
			</div>
		</div>
		<div class="actions">
			<button type="submit" formaction="?/preview" class="btn" disabled={busy}
				><i class="fas fa-eye"></i> Preview</button
			>
			<button type="submit" formaction="?/test" class="btn" disabled={busy}
				><i class="fas fa-paper-plane"></i> Send test</button
			>
			{#if result?.testSent}<span class="muted"
					><i class="fas fa-check"></i> Sent to {result.testSent}</span
				>{/if}
			{#if result?.testError}<span class="field-error">{result.testError}</span>{/if}
		</div>
		{#if result?.preview}
			<p class="preview-subject">
				<span class="muted">Subject:</span> <strong>{result.preview.subject}</strong>
			</p>
			<iframe title="Email preview" srcdoc={result.preview.html} sandbox=""></iframe>
		{/if}
	</div>
</form>

<form method="POST" action="?/delete" class="card card-danger" use:enhance>
	<h2>Delete template</h2>
	<p class="hint">Campaigns already sent keep their copy of the email.</p>
	<ConfirmButton label="Delete template" question="Delete this template?" confirmLabel="Delete" />
</form>

<style>
	.editor > :global(.card + .card) {
		margin-top: 1.25rem;
	}

	.forms {
		border: none;
		padding: 0;
	}

	.form-checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.5rem;
	}

	.form-checks .check {
		margin-bottom: 0.25rem;
	}

	.subject-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 12rem;
		gap: 0.5rem;
	}

	.flash ul {
		margin-left: 1.25rem;
	}

	.preview-subject {
		margin: 1.25rem 0 0.5rem;
	}

	iframe {
		width: 100%;
		height: 620px;
		border: 1px solid var(--color-border-light);
		border-radius: 8px;
		background: #f4f9f0;
	}
</style>
