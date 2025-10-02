<div class="homepage">
	<section class="hero">
		<div class="container">
			<div class="hero-content">
				<h1 class="hero-title">EECS4Palestine is now STEM4Palestine!</h1>
				<p class="hero-subtitle">
					We are Berkeley students who believe our labor and innovations should be used for social good, and not for genocide & apartheid.
				</p>
				<div class="hero-actions">
					<a href="/get-involved" class="cta-button primary">Join Us</a>
					<a href="/events" class="cta-button secondary">Attend Events</a>
				</div>
			</div>
		</div>
	</section>

	<section class="mission">
		<div class="container">
			<div class="mission-content">
				<h2>Our Mission</h2>
				<p class="mission-text">
					STEM for Palestine stands for the absolute and total liberation of all people from all oppression. 
					Palestine is our compass and guiding cause. We stand in solidarity with the people of Palestine, 
					East Turkestan, Sudan, the Congo, and all people fighting for liberation.
				</p>
				<p class="mission-text">
					STEM4Palestine is open to all students from all departments! We do not believe that there is a 
					one-size-fits-all solution to being ethical in the tech industry. We believe that liberation 
					cannot be an individual project. Towards this vision, STEM for Palestine brings together a 
					collective voice to develop an alternative future for STEM, social, and economic justice.
				</p>
			</div>
		</div>
	</section>

	<section class="actions">
		<div class="container">
			<h2>Take Action</h2>
			<div class="action-grid">
				<div class="action-card">
					<h3>Get Involved</h3>
					<p>Become a STEM for Palestine member or join our mailing list to stay connected with our organizing efforts.</p>
					<a href="/get-involved" class="action-link">Join the Movement →</a>
				</div>
				<div class="action-card">
					<h3>Weekly Events</h3>
					<p>Attend our organizing events, teach-ins, and workshops on ethical tech and liberation organizing.</p>
					<a href="/events" class="action-link">View Events →</a>
				</div>
				<div class="action-card">
					<h3>Mutual Aid</h3>
					<p>Support our fundraising campaigns for Deir al-Balah and other liberation struggles.</p>
					<a href="/mutual-aid" class="action-link">Donate →</a>
				</div>
			</div>
		</div>
	</section>

	<section class="solidarity">
		<div class="container">
			<h2>International Solidarity</h2>
			<div class="solidarity-content">
				<p>
					We stand in unwavering solidarity with all oppressed peoples fighting for liberation:
				</p>
				<div class="solidarity-flags">
					<div class="solidarity-item">
						<span class="flag"><i class="fas fa-flag"></i></span>
						<span>Palestine</span>
					</div>
					<div class="solidarity-item">
						<span class="flag"><i class="fas fa-flag"></i></span>
						<span>East Turkestan</span>
					</div>
					<div class="solidarity-item">
						<span class="flag"><i class="fas fa-flag"></i></span>
						<span>Sudan</span>
					</div>
					<div class="solidarity-item">
						<span class="flag"><i class="fas fa-flag"></i></span>
						<span>Congo</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="resources">
		<div class="container">
			<h2>Key Resources</h2>
			<div class="resource-grid">
				<div class="resource-card">
					<h3>Tech for Palestine Incubator</h3>
					<p>Volunteer your skills and start projects for Palestinian liberation.</p>
					<a href="/resources" class="resource-link">Learn More →</a>
				</div>
				<div class="resource-card">
					<h3>Principled Careers</h3>
					<p>Find ethical employment opportunities in tech that align with your values.</p>
					<a href="/resources" class="resource-link">Explore Careers →</a>
				</div>
				<div class="resource-card">
					<h3>Defense Labor Boycott</h3>
					<p>Join the pledge to boycott defense contractors and military tech companies.</p>
					<a href="/resources" class="resource-link">Sign Pledge →</a>
				</div>
			</div>
		</div>
	</section>

	<section class="quote">
		<div class="container">
			<blockquote>
				"Tech for Palestine is a coalition of thousands of founders, engineers, product marketers, investors"
			</blockquote>
			<p class="quote-question">"Does my code kill Palestinians?"</p>
		</div>
	</section>
</div>

<style>
	.homepage {
		width: 100%;
	}

	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1rem;
	}

	.hero {
		background: linear-gradient(135deg, #059669 0%, #047857 100%);
		color: white;
		padding: 4rem 0;
		text-align: center;
	}

	.hero-title {
		font-size: 3rem;
		font-weight: 800;
		margin-bottom: 1.5rem;
		color: #ffffff;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		margin-bottom: 2rem;
		max-width: 800px;
		margin-left: auto;
		margin-right: auto;
		line-height: 1.6;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}

	.cta-button {
		padding: 1rem 2rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 1.1rem;
		text-decoration: none;
		transition: all 0.2s;
		display: inline-block;
	}

	.cta-button.primary {
		background-color: var(--color-primary);
		color: white;
	}

	.cta-button.primary:hover {
		background-color: var(--color-primary-dark);
		transform: translateY(-2px);
	}

	.cta-button.secondary {
		background-color: transparent;
		color: white;
		border: 2px solid var(--color-primary);
	}

	.cta-button.secondary:hover {
		background-color: var(--color-primary);
		transform: translateY(-2px);
	}

	.mission {
		padding: 4rem 0;
		background-color: #f7fafc;
	}

	.mission-content {
		text-align: center;
		max-width: 900px;
		margin: 0 auto;
	}

	.mission h2 {
		font-size: 2.5rem;
		color: #2d3748;
		margin-bottom: 2rem;
	}

	.mission-text {
		font-size: 1.2rem;
		line-height: 1.8;
		color: #4a5568;
		margin-bottom: 1.5rem;
	}

	.actions {
		padding: 4rem 0;
	}

	.actions h2 {
		text-align: center;
		font-size: 2.5rem;
		color: #2d3748;
		margin-bottom: 3rem;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.action-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
		text-align: center;
		transition: all 0.2s;
	}

	.action-card:hover {
		border-color: var(--color-primary);
		transform: translateY(-4px);
		box-shadow: 0 8px 25px rgba(0,0,0,0.1);
	}

	.action-card h3 {
		color: var(--color-primary);
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}

	.action-link {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
		transition: color 0.2s;
	}

	.action-link:hover {
		color: var(--color-primary-dark);
	}

	.solidarity {
		padding: 4rem 0;
		background-color: #1a202c;
		color: white;
		text-align: center;
	}

	.solidarity h2 {
		font-size: 2.5rem;
		color: var(--color-primary-light);
		margin-bottom: 2rem;
	}

	.solidarity-content p {
		font-size: 1.2rem;
		margin-bottom: 2rem;
	}

	.solidarity-flags {
		display: flex;
		justify-content: center;
		gap: 3rem;
		flex-wrap: wrap;
	}

	.solidarity-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.flag {
		font-size: 3rem;
		color: var(--color-primary-light);
	}

	.solidarity-item span:last-child {
		font-weight: 600;
		font-size: 1.1rem;
	}

	.resources {
		padding: 4rem 0;
		background-color: #f7fafc;
	}

	.resources h2 {
		text-align: center;
		font-size: 2.5rem;
		color: #2d3748;
		margin-bottom: 3rem;
	}

	.resource-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
	}

	.resource-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		border-left: 4px solid var(--color-primary);
		transition: all 0.2s;
	}

	.resource-card:hover {
		transform: translateX(4px);
		box-shadow: 0 4px 15px rgba(0,0,0,0.1);
	}

	.resource-card h3 {
		color: #2d3748;
		font-size: 1.3rem;
		margin-bottom: 1rem;
	}

	.resource-link {
		color: var(--color-primary);
		font-weight: 600;
		text-decoration: none;
	}

	.resource-link:hover {
		color: var(--color-primary-dark);
	}

	.quote {
		padding: 4rem 0;
		background-color: #2d3748;
		color: white;
		text-align: center;
	}

	blockquote {
		font-size: 1.5rem;
		font-style: italic;
		margin-bottom: 1rem;
		color: var(--color-primary-light);
	}

	.quote-question {
		font-size: 1.2rem;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.hero-title {
			font-size: 2rem;
		}

		.hero-subtitle {
			font-size: 1.1rem;
		}

		.solidarity-flags {
			gap: 2rem;
		}

		.action-grid, .resource-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
