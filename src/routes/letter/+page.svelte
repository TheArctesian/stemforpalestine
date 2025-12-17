<script lang="ts">
	import {
		SIGN_FORM_URL,
		organizations,
		notableSignatories
	} from '$lib/data/peyrin-letter';
	import NotableSignatoriesCarousel from '$lib/components/NotableSignatoriesCarousel.svelte';

	let { data } = $props();

	const ITEMS_PER_PAGE = 25;
	let currentPage = $state(1);
	let signatoriesSection: HTMLElement | null = null;

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

	function scrollToSignatories() {
		if (signatoriesSection) {
			signatoriesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function nextPage() {
		if (currentPage < totalPages) {
			currentPage++;
			setTimeout(scrollToSignatories, 100);
		}
	}

	function prevPage() {
		if (currentPage > 1) {
			currentPage--;
			setTimeout(scrollToSignatories, 100);
		}
	}

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			currentPage = page;
			setTimeout(scrollToSignatories, 100);
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
				<a href="https://medium.com/@stem4pal/letter-8d5fdda940b0" target="_blank" rel="noopener noreferrer" class="cta-button secondary">
					<i class="fas fa-file-alt"></i> Read the Open Letter
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

	<!-- Notable Signatories Carousel Section -->
	{#if data.notableSignatories && data.notableSignatories.length > 0}
		<section class="notable-carousel">
			<div class="container">
				<NotableSignatoriesCarousel signatories={data.notableSignatories} />
			</div>
		</section>
	{/if}

	<!-- All Signatories Section -->
	<section class="all-signatories" bind:this={signatoriesSection}>
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
				{#key currentPage}
					<div class="signatories-grid">
						{#each paginatedSignatories as signatory, i (`${signatory.displayName ?? 'anon'}-${(currentPage - 1) * ITEMS_PER_PAGE + i}`)}
							<div class="signatory-card" style="animation-delay: {i * 0.05}s;">
								<span class="signatory-name">{signatory.displayName ?? 'Anonymous'}</span>
								<span class="signatory-roles">{signatory.roles || '—'}</span>
								{#if signatory.comment}
									<blockquote class="signatory-comment">"{signatory.comment}"</blockquote>
								{/if}
							</div>
						{/each}
					</div>
				{/key}

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

	<!-- Organization Signatories Section -->
	{#if data.orgSignatories && data.orgSignatories.length > 0}
		<section class="org-signatories">
			<div class="container">
				<h2>Organization Endorsements ({data.orgSignatories.length})</h2>
				<div class="org-signatories-grid">
					{#each data.orgSignatories as org, i (`org-${i}-${org.organization_name ?? 'unnamed'}`)}
						<div class="org-signatory-card">
							<span class="org-signatory-name">{org.organization_name}</span>
							{#if org.description}
								<p class="org-description">{org.description}</p>
							{/if}
							{#if org.additional_testimony}
								<blockquote class="org-testimony">"{org.additional_testimony}"</blockquote>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

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
		background: white;
		color: #ce1126;
	}

	.cta-button.primary:hover {
		background: #f5f5f5;
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
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

	/* Notable Signatories Carousel Section */
	.notable-carousel {
		padding: 4rem 0;
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
		overflow: visible;
	}

	/* Organization Signatories Section */
	.org-signatories {
		padding: 4rem 0;
		background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
	}

	.org-signatories h2 {
		text-align: center;
		font-size: 2rem;
		color: #92400e;
		margin-bottom: 2rem;
	}

	.org-signatories-grid {
		column-count: 4;
		column-gap: 1.5rem;
	}

	.org-signatory-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid #fde68a;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		transition: all 0.3s;
		break-inside: avoid;
		margin-bottom: 1.5rem;
	}

	.org-signatory-card:hover {
		border-color: #f59e0b;
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(245, 158, 11, 0.15);
	}

	.org-signatory-name {
		font-weight: 700;
		font-size: 1.1rem;
		color: #92400e;
	}

	.org-description {
		font-size: 0.95rem;
		color: #4b5563;
		margin: 0;
		line-height: 1.5;
	}

	.org-testimony {
		margin: 0.5rem 0 0;
		padding: 1rem;
		background: #fffbeb;
		border-left: 4px solid #f59e0b;
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: #475569;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	/* All Signatories Section */
	.all-signatories {
		padding: 4rem 0;
		background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
	}

	.section-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.all-signatories h2 {
		text-align: center;
		font-size: 2rem;
		color: var(--color-primary, #009639);
		margin-bottom: 0.5rem;
	}

	.signatories-grid {
		column-count: 4;
		column-gap: 1.5rem;
		animation: slideInFromLeft 0.4s ease-out;
	}

	@keyframes slideInFromLeft {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@media (max-width: 1200px) {
		.signatories-grid,
		.org-signatories-grid {
			column-count: 3;
		}
	}

	@media (max-width: 1024px) {
		.signatories-grid,
		.org-signatories-grid {
			column-count: 2;
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.signatory-card {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 2px solid #bbf7d0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		transition: all 0.3s;
		break-inside: avoid;
		margin-bottom: 1.5rem;
		animation: fadeInUp 0.5s ease-out backwards;
	}

	.signatory-card:hover {
		border-color: var(--color-primary, #009639);
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(0, 150, 57, 0.15);
	}

	.signatory-name {
		font-weight: 700;
		font-size: 1.1rem;
		color: #166534;
	}

	.signatory-roles {
		font-size: 0.95rem;
		color: #64748b;
	}

	.signatory-comment {
		margin: 0.75rem 0 0;
		padding: 1rem;
		background: #f0fdf4;
		border-left: 4px solid var(--color-primary, #009639);
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: #475569;
		font-size: 0.85rem;
		line-height: 1.5;
	}

	.no-signatories {
		text-align: center;
		color: #64748b;
		font-style: italic;
		padding: 2rem;
	}

	.last-updated {
		text-align: center;
		color: var(--color-primary, #009639);
		font-size: 0.9rem;
		margin: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		font-weight: 500;
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
		border: 2px solid #bbf7d0;
		border-radius: 6px;
		color: var(--color-primary, #009639);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.page-btn:hover:not(:disabled) {
		background: var(--color-primary, #009639);
		color: white;
		border-color: var(--color-primary, #009639);
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
		border: 2px solid #bbf7d0;
		background: white;
		border-radius: 6px;
		color: var(--color-primary, #009639);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.page-num:hover {
		background: #f0fdf4;
		border-color: var(--color-primary, #009639);
	}

	.page-num.active {
		background: var(--color-primary, #009639);
		color: white;
		border-color: var(--color-primary, #009639);
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

		.org-grid {
			grid-template-columns: 1fr;
		}

		.org-signatories-grid,
		.signatories-grid {
			column-count: 1;
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
