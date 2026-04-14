<script lang="ts">
	const VOTE_URL = 'https://asuc.org/elections';
</script>

<svelte:head>
	<title>Divestment Vote FAQ | STEM for Palestine</title>
	<meta
		name="description"
		content="FAQ on the ASUC divestment ballot measure: disclosure, divestment, and why your vote April 13–15 matters."
	/>
</svelte:head>

<div class="divestment-page">
	<section class="hero">
		<div class="container">
			<h1>Vote for Divestment</h1>
			<p class="lead">
				Students have the chance to vote on divestment this year. Every vote matters.
			</p>
			<a href={VOTE_URL} target="_blank" rel="noopener noreferrer" class="cta-button">
				<i class="fas fa-check-to-slot"></i> Vote at asuc.org/elections — April 13–15
			</a>
		</div>
	</section>

	<section class="faq-section">
		<div class="container">
			<h2 class="faq-heading">Frequently asked questions</h2>

			<div class="faq-list">
				<details class="faq-item">
					<summary>Context: divestment at UC</summary>
					<div class="faq-body">
						<p>Divestment is not new.</p>
						<p>
							UC has divested from apartheid South Africa (1986), genocide in Sudan (2006), and the
							fossil fuel industry (2020).
						</p>
						<p>
							UC Berkeley currently claims that divestment from military weapons would be too
							controversial with the campus community.
						</p>
						<p>
							They have 23 holdings related to weapons manufacturing, but the exact companies are
							not made public.
						</p>
						<p class="vote-cta">
							<a href={VOTE_URL} target="_blank" rel="noopener noreferrer">Vote — asuc.org/elections</a>
							<span class="dates">April 13–15</span>
						</p>
					</div>
				</details>

				<details class="faq-item">
					<summary>What does this ballot measure propose?</summary>
					<div class="faq-body">
						<ol>
							<li>
								<strong>Disclosure:</strong> making public all investments into surveillance and
								military weapons technology
							</li>
							<li>
								<strong>Divestment:</strong> pursuing avenues like shareholder rights to affect
								change to harmful behavior, then selling all holdings if company does not change
							</li>
						</ol>
						<p>
							The result of the vote will be presented to Chancellor Lyons, who sits on the board of
							the endowment management company.
						</p>
						<p class="vote-cta">
							<a href={VOTE_URL} target="_blank" rel="noopener noreferrer">Vote — asuc.org/elections</a>
							<span class="dates">April 13–15</span>
						</p>
					</div>
				</details>

				<details class="faq-item">
					<summary>Why a divestment ballot measure?</summary>
					<div class="faq-body">
						<p>There is a precedent for holding a student body vote for divestment.</p>
						<p>
							After Berkeley students passed a referendum supporting fossil fuel divestment, the
							Foundation began materially divesting our endowment.
						</p>
						<p>
							Today, the Foundation's guidelines for investing require them to consider
							sustainability concerns like climate change, water, energy, and environmental toxins.
						</p>
						<p class="vote-cta">
							<a href={VOTE_URL} target="_blank" rel="noopener noreferrer">Vote — asuc.org/elections</a>
							<span class="dates">April 13–15</span>
						</p>
					</div>
				</details>

				<details class="faq-item">
					<summary>Will divestment decrease funding for teaching and research?</summary>
					<div class="faq-body">
						<p>
							The endowment only supplies 2% of the campus operating budget! Historically,
							divestment has not caused diminished returns at universities.
						</p>
						<p>
							Index funds that exclude weapons and fossil fuels often perform just as well, and they
							align with UC Berkeley's intention to be a leader in AI ethics and clean energy.
						</p>
						<p class="vote-cta">
							<a href={VOTE_URL} target="_blank" rel="noopener noreferrer">Vote — asuc.org/elections</a>
							<span class="dates">April 13–15</span>
						</p>
					</div>
				</details>

				<details class="faq-item">
					<summary>Why is divestment relevant now?</summary>
					<div class="faq-body">
						<p>
							The industry of war, apartheid, and genocide continues to kill, injure, and displace
							people in our local communities and around the world.
						</p>
						<p>
							On April 8th, Israel bombed Lebanon 100 times in ten minutes, killing over 300 people.
						</p>
						<p>
							On April 7th, by the time Trump threatened to "destroy a civilization," the US and
							Israel had already bombed universities, religious buildings, bridges, and railways in
							Iran.
						</p>
						<p>
							Since 2025, ICE has been detaining and terrorizing our communities with newly-purchased
							technology like face recognition apps, warrantless location surveillance, drones that
							detect people miles away, and spyware that hacks phones remotely.
						</p>
						<p>
							Universities like UC Berkeley have the power to legitimize and shape the future of the
							industries they claim to be leading.
						</p>
						<p>Divesting from fossil fuels but not mass surveillance and military technology is not neutral.</p>
						<p>One day, everyone will have always been against this.</p>
						<p class="vote-cta">
							<a href={VOTE_URL} target="_blank" rel="noopener noreferrer">Vote — asuc.org/elections</a>
							<span class="dates">April 13–15</span>
						</p>
					</div>
				</details>
			</div>
		</div>
	</section>
</div>

<style>
	.divestment-page {
		--page-accent: var(--color-primary, #009639);
	}

	.hero {
		background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%);
		color: #ffffff;
		padding: 3rem 0 2.5rem;
		text-align: center;
	}

	.container {
		max-width: 720px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.hero h1 {
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		margin-bottom: 1rem;
	}

	.lead {
		font-size: 1.15rem;
		line-height: 1.65;
		margin-bottom: 1.5rem;
		opacity: 0.95;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--page-accent);
		color: #ffffff;
		font-weight: 600;
		padding: 0.85rem 1.35rem;
		border-radius: 8px;
		text-decoration: none;
		transition: filter 0.2s, transform 0.2s;
		box-shadow: 0 4px 14px rgba(0, 150, 57, 0.35);
	}

	.cta-button:hover {
		filter: brightness(1.08);
		transform: translateY(-1px);
	}

	.faq-section {
		padding: 2.5rem 0 4rem;
		background: var(--color-bg-secondary, #f7fafc);
	}

	.faq-heading {
		font-size: 1.5rem;
		margin-bottom: 1.25rem;
		color: var(--color-text-primary, #2d3748);
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.faq-item {
		background: #ffffff;
		border: 1px solid var(--color-border-light, #e2e8f0);
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
	}

	.faq-item summary {
		cursor: pointer;
		font-weight: 600;
		font-size: 1.05rem;
		padding: 1rem 1.25rem;
		list-style: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		color: var(--color-text-primary, #2d3748);
		user-select: none;
	}

	.faq-item summary::-webkit-details-marker {
		display: none;
	}

	.faq-item summary::after {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-right: 2px solid var(--page-accent);
		border-bottom: 2px solid var(--page-accent);
		transform: rotate(45deg);
		transition: transform 0.2s;
		flex-shrink: 0;
	}

	.faq-item[open] summary::after {
		transform: rotate(-135deg);
	}

	.faq-item summary:hover {
		background: rgba(0, 150, 57, 0.06);
	}

	.faq-body {
		padding: 0 1.25rem 1.25rem;
		border-top: 1px solid var(--color-border-light, #e2e8f0);
		color: var(--color-text-secondary, #4a5568);
		font-size: 0.98rem;
		line-height: 1.65;
	}

	.faq-body p {
		margin-bottom: 0.85rem;
	}

	.faq-body p:last-child {
		margin-bottom: 0;
	}

	.faq-body ol {
		margin: 0 0 1rem 1.25rem;
		padding: 0;
	}

	.faq-body li {
		margin-bottom: 0.65rem;
	}

	.vote-cta {
		margin-top: 1rem;
		padding-top: 0.85rem;
		border-top: 1px dashed var(--color-border-medium, #cbd5e0);
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem 1rem;
	}

	.vote-cta a {
		color: var(--page-accent);
		font-weight: 600;
		text-decoration: none;
	}

	.vote-cta a:hover {
		text-decoration: underline;
	}

	.dates {
		font-size: 0.9rem;
		color: var(--color-text-light, #718096);
	}
</style>
