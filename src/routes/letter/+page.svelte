<script lang="ts">
	import {
		SIGN_FORM_URL,
		organizations,
		notableSignatories
	} from '$lib/data/peyrin-letter';

	let { data } = $props();

	const ITEMS_PER_PAGE = 25;
	let currentPage = $state(1);

	// Sort signatories: those with comments first, then the rest
	const sortedSignatories = $derived(
		[...data.signatories].sort((a, b) => {
			if (a.comment && !b.comment) return -1;
			if (!a.comment && b.comment) return 1;
			return 0;
		})
	);

	const totalPages = $derived(Math.ceil(sortedSignatories.length / ITEMS_PER_PAGE));
	const paginatedSignatories = $derived(
		sortedSignatories.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
	);

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
		}
	}
</script>

<svelte:head>
	<title>Open Letter for Peyrin's Reinstatement | STEM for Palestine</title>
	<meta
		name="description"
		content="Sign the open letter calling for Peyrin's reinstatement. Join faculty, students, and organizations in supporting academic freedom."
	/>
</svelte:head>

<div class="letter-page">
	<!-- Hero Section -->
	<section class="hero">
		<div class="container">
			<h1>An Open Letter for Peyrin's Reinstatement</h1>
			<p class="summary">
				Join faculty, students, and organizations in calling for the reinstatement of Peyrin. Add
				your voice to support academic freedom and stand against unjust dismissal.
			</p>
			<div class="cta-buttons">
				<a href={SIGN_FORM_URL} target="_blank" rel="noopener noreferrer" class="cta-button primary">
					<i class="fas fa-pen"></i> Sign the Letter
				</a>
			</div>
		</div>
	</section>

	<!-- Organizations Section -->
	{#if organizations.length > 0}
		<section class="organizations">
			<div class="container">
				<h2>Endorsing Organizations</h2>
				<div class="org-grid">
					{#each organizations as org (org.name)}
						<div class="org-card">
							{#if org.logo}
								<img src={org.logo} alt={org.name} class="org-logo" />
							{/if}
							<span class="org-name">{org.name}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Notable Signatories Section -->
	{#if notableSignatories.length > 0}
		<section class="notable">
			<div class="container">
				<h2>Notable Signatories</h2>
				<div class="notable-grid">
					{#each notableSignatories as signatory (signatory.name)}
						<div class="notable-card">
							<span class="notable-name">{signatory.name}</span>
							<span class="notable-title">{signatory.title}</span>
							<span class="notable-affiliation">{signatory.affiliation}</span>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- All Signatories Section -->
	<section class="all-signatories">
		<div class="container">
			<div class="section-header">
				<h2>All Signatories ({data.totalCount} total)</h2>
				{#if data.lastUpdated}
					<p class="last-updated">
						<i class="fas fa-clock"></i> Last updated: {new Date(data.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
					</p>
				{/if}
			</div>

			{#if data.signatories.length > 0}
				<div class="signatories-grid">
					{#each paginatedSignatories as signatory, i (signatory.displayName ?? `anon-${i}`)}
						<div class="signatory-card">
							<span class="signatory-name">{signatory.displayName ?? 'Anonymous'}</span>
							<span class="signatory-roles">{signatory.roles || '—'}</span>
							{#if signatory.comment}
								<blockquote class="signatory-comment">"{signatory.comment}"</blockquote>
							{/if}
						</div>
					{/each}
				</div>

				{#if totalPages > 1}
					<div class="pagination">
						<button class="page-btn" onclick={prevPage} disabled={currentPage === 1}>
							<i class="fas fa-chevron-left"></i> Prev
						</button>

						<div class="page-numbers">
							{#each Array(totalPages) as _, i (i)}
								{@const page = i + 1}
								{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
									<button
										class="page-num"
										class:active={page === currentPage}
										onclick={() => goToPage(page)}
									>
										{page}
									</button>
								{:else if page === currentPage - 2 || page === currentPage + 2}
									<span class="ellipsis">...</span>
								{/if}
							{/each}
						</div>

						<button class="page-btn" onclick={nextPage} disabled={currentPage === totalPages}>
							Next <i class="fas fa-chevron-right"></i>
						</button>
					</div>
				{/if}
			{:else}
				<p class="no-signatories">Be the first to sign the letter!</p>
			{/if}
		</div>
	</section>

	<!-- Final CTA -->
	<section class="final-cta">
		<div class="container">
			<h2>Add Your Voice</h2>
			<p>Stand with Peyrin and support academic freedom.</p>
			<a href={SIGN_FORM_URL} target="_blank" rel="noopener noreferrer" class="cta-button primary">
				<i class="fas fa-pen"></i> Sign the Letter
			</a>
		</div>
	</section>
</div>

<style>
	.letter-page {
		width: 100%;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Hero Section */
	.hero {
		background: linear-gradient(135deg, #ce1126 0%, #a30d1f 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.hero h1 {
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
	}

	.summary {
		font-size: 1.2rem;
		max-width: 700px;
		margin: 0 auto 2rem;
		line-height: 1.6;
		opacity: 0.95;
	}

	.cta-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		transition: all 0.2s;
	}

	.cta-button.primary {
		background: var(--color-primary, #009639);
		color: white;
	}

	.cta-button.primary:hover {
		background: var(--color-primary-dark, #007a2e);
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 150, 57, 0.3);
	}

	.cta-button.secondary {
		background: transparent;
		color: white;
		border: 2px solid rgba(255, 255, 255, 0.6);
	}

	.cta-button.secondary:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: white;
		transform: translateY(-2px);
	}

	/* Organizations Section */
	.organizations {
		padding: 4rem 0;
		background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
	}

	.organizations h2 {
		text-align: center;
		font-size: 2rem;
		color: #c2410c;
		margin-bottom: 2rem;
	}

	.org-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1.5rem;
	}

	.org-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid #fed7aa;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		transition: all 0.3s;
	}

	.org-card:hover {
		border-color: #f97316;
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(249, 115, 22, 0.15);
	}

	.org-logo {
		max-width: 80px;
		max-height: 80px;
		object-fit: contain;
	}

	.org-name {
		font-weight: 600;
		color: #9a3412;
	}

	/* Notable Signatories Section */
	.notable {
		padding: 4rem 0;
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	}

	.notable h2 {
		text-align: center;
		font-size: 2rem;
		color: var(--color-primary, #009639);
		margin-bottom: 2rem;
	}

	.notable-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	.notable-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid #bbf7d0;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		transition: all 0.3s;
	}

	.notable-card:hover {
		border-color: var(--color-primary, #009639);
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(0, 150, 57, 0.15);
	}

	.notable-name {
		font-weight: 700;
		font-size: 1.1rem;
		color: #166534;
	}

	.notable-title {
		font-size: 0.95rem;
		color: #4a5568;
	}

	.notable-affiliation {
		font-size: 0.9rem;
		color: #718096;
		font-style: italic;
	}

	/* All Signatories Section */
	.all-signatories {
		padding: 4rem 0;
		background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
	}

	.section-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.all-signatories h2 {
		text-align: center;
		font-size: 2rem;
		color: #1e40af;
		margin-bottom: 0.5rem;
	}

	.signatories-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 1.5rem;
	}

	.signatory-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid #bfdbfe;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.3s;
	}

	.signatory-card:hover {
		border-color: #3b82f6;
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(59, 130, 246, 0.15);
	}

	.signatory-name {
		font-weight: 700;
		font-size: 1.1rem;
		color: #1e40af;
	}

	.signatory-roles {
		font-size: 0.95rem;
		color: #64748b;
	}

	.signatory-comment {
		margin: 0.75rem 0 0;
		padding: 1rem;
		background: #f8fafc;
		border-left: 4px solid #3b82f6;
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: #475569;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.no-signatories {
		text-align: center;
		color: #64748b;
		font-style: italic;
		padding: 2rem;
	}

	.last-updated {
		text-align: center;
		color: #64748b;
		font-size: 0.9rem;
		margin: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}

	/* Pagination */
	.pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		margin-top: 2rem;
		flex-wrap: wrap;
	}

	.page-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: white;
		border: 2px solid #bfdbfe;
		border-radius: 6px;
		color: #1e40af;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.page-btn:hover:not(:disabled) {
		background: #1e40af;
		color: white;
		border-color: #1e40af;
	}

	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.page-numbers {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}

	.page-num {
		width: 36px;
		height: 36px;
		border: 2px solid #bfdbfe;
		background: white;
		border-radius: 6px;
		color: #1e40af;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.page-num:hover {
		background: #eff6ff;
		border-color: #1e40af;
	}

	.page-num.active {
		background: #1e40af;
		color: white;
		border-color: #1e40af;
	}

	.ellipsis {
		color: #64748b;
		padding: 0 0.25rem;
	}

	/* Final CTA Section */
	.final-cta {
		padding: 4rem 0;
		background: linear-gradient(135deg, #ce1126 0%, #a30d1f 100%);
		color: white;
		text-align: center;
	}

	.final-cta h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.final-cta p {
		font-size: 1.1rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.hero h1 {
			font-size: 1.75rem;
		}

		.summary {
			font-size: 1rem;
		}

		.cta-buttons {
			flex-direction: column;
			align-items: center;
		}

		.cta-button {
			width: 100%;
			max-width: 300px;
			justify-content: center;
		}

		.org-grid,
		.notable-grid,
		.signatories-grid {
			grid-template-columns: 1fr;
		}

		.pagination {
			flex-direction: column;
			gap: 0.75rem;
		}

		.page-numbers {
			order: -1;
		}
	}
</style>
