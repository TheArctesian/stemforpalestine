<script lang="ts">
	import { SIGN_FORM_URL, comments } from '$lib/data/peyrin-letter';
</script>

<svelte:head>
	<title>Community Comments | Open Letter for Peyrin's Reinstatement</title>
	<meta
		name="description"
		content="Read what supporters are saying about Peyrin's reinstatement. Join the community in standing for academic freedom."
	/>
</svelte:head>

<div class="comments-page">
	<!-- Header -->
	<section class="header">
		<div class="container">
			<a href="/letter" class="back-link">
				<i class="fas fa-arrow-left"></i> Back to Letter
			</a>
			<h1>Community Comments</h1>
			<p class="subtitle">
				Read what supporters are saying about the open letter for Peyrin's reinstatement.
			</p>
		</div>
	</section>

	<!-- Comments Grid -->
	<section class="comments-section">
		<div class="container">
			{#if comments.length > 0}
				<div class="comments-grid">
					{#each comments as comment (comment.author + comment.text.slice(0, 20))}
						<div class="comment-card">
							<blockquote class="comment-text">"{comment.text}"</blockquote>
							<div class="comment-author">
								<span class="author-name">{comment.author}</span>
								{#if comment.affiliation}
									<span class="author-affiliation">{comment.affiliation}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="no-comments">
					<i class="fas fa-comments"></i>
					<p>No comments yet. Be the first to share your thoughts!</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- CTA Section -->
	<section class="cta-section">
		<div class="container">
			<h2>Share Your Support</h2>
			<p>Add your voice to the open letter and leave a comment.</p>
			<div class="cta-buttons">
				<a href={SIGN_FORM_URL} target="_blank" rel="noopener noreferrer" class="cta-button primary">
					<i class="fas fa-pen"></i> Sign the Letter
				</a>
				<a href="/letter" class="cta-button secondary">
					<i class="fas fa-file-alt"></i> View All Signatories
				</a>
			</div>
		</div>
	</section>
</div>

<style>
	.comments-page {
		width: 100%;
		min-height: 100vh;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	/* Header */
	.header {
		background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
		color: white;
		padding: 3rem 0;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: white;
	}

	.header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		margin-bottom: 1rem;
	}

	.subtitle {
		font-size: 1.15rem;
		opacity: 0.9;
		max-width: 600px;
	}

	/* Comments Section */
	.comments-section {
		padding: 4rem 0;
		background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
	}

	.comments-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}

	.comment-card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		border: 2px solid #e2e8f0;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		transition: all 0.3s;
	}

	.comment-card:hover {
		border-color: #cbd5e1;
		transform: translateY(-4px);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
	}

	.comment-text {
		font-size: 1.1rem;
		line-height: 1.7;
		color: #334155;
		font-style: italic;
		margin: 0;
		position: relative;
		padding-left: 1.5rem;
	}

	.comment-text::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4px;
		background: linear-gradient(180deg, var(--color-primary, #009639), #22c55e);
		border-radius: 2px;
	}

	.comment-author {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding-top: 1rem;
		border-top: 1px solid #f1f5f9;
	}

	.author-name {
		font-weight: 700;
		color: #1e293b;
		font-size: 1rem;
	}

	.author-affiliation {
		font-size: 0.9rem;
		color: #64748b;
	}

	.no-comments {
		text-align: center;
		padding: 4rem 2rem;
		color: #64748b;
	}

	.no-comments i {
		font-size: 3rem;
		margin-bottom: 1rem;
		opacity: 0.4;
	}

	.no-comments p {
		font-size: 1.1rem;
	}

	/* CTA Section */
	.cta-section {
		padding: 4rem 0;
		background: linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%);
		color: white;
		text-align: center;
	}

	.cta-section h2 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.cta-section p {
		font-size: 1.1rem;
		margin-bottom: 2rem;
		opacity: 0.9;
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

	/* Responsive */
	@media (max-width: 768px) {
		.header h1 {
			font-size: 1.75rem;
		}

		.comments-grid {
			grid-template-columns: 1fr;
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
	}
</style>
