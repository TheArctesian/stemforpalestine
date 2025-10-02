<div class="about-page">
	<section class="hero">
		<div class="container">
			<h1>About STEM4Palestine</h1>
			<p class="hero-subtitle">
				Building collective power for liberation through ethical technology and social justice organizing.
			</p>
		</div>
	</section>

	<section class="content">
		<div class="container">
			<div class="content-grid">
				<div class="main-content">
					<h2>Our Story</h2>
					<p>
						STEM4Palestine emerged from the recognition that technology workers have immense power to shape the world, 
						and that this power must be wielded for liberation, not oppression. We are Berkeley students who refuse 
						to allow our skills, labor, and innovations to be used for genocide, apartheid, and the perpetuation of injustice.
					</p>
					
					<h2>Our Values</h2>
					<div class="values-grid">
						<div class="value-card">
							<h3>Liberation</h3>
							<p>We stand for the absolute and total liberation of all people from all oppression.</p>
						</div>
						<div class="value-card">
							<h3>Solidarity</h3>
							<p>Palestine is our compass and guiding cause, but our solidarity extends to all oppressed peoples.</p>
						</div>
						<div class="value-card">
							<h3>Collective Action</h3>
							<p>We believe liberation cannot be an individual project - it requires organized collective power.</p>
						</div>
						<div class="value-card">
							<h3>Ethical Technology</h3>
							<p>Technology must serve human flourishing and justice, not profit and domination.</p>
						</div>
					</div>

					<h2>Our Approach</h2>
					<p>
						STEM4Palestine is open to all students from all departments! We do not believe that there is a 
						one-size-fits-all solution to being ethical in the tech industry. Instead, we bring together 
						diverse perspectives and experiences to develop collective strategies for transformation.
					</p>
					<p>
						We organize through education, direct action, mutual aid, and building alternative structures. 
						Our work includes teach-ins on tech ethics, supporting liberation movements through technology, 
						and creating pathways for ethical careers in STEM fields.
					</p>

					<h2>Global Solidarity</h2>
					<p>
						While Palestine is our guiding cause, we stand in solidarity with liberation movements worldwide:
					</p>
					<ul class="solidarity-list">
						<li><i class="fas fa-flag"></i> Palestinian resistance against settler colonialism and apartheid</li>
						<li><i class="fas fa-flag"></i> Uyghur resistance in East Turkestan against cultural genocide</li>
						<li><i class="fas fa-flag"></i> Sudanese people fighting for democracy and justice</li>
						<li><i class="fas fa-flag"></i> Congolese communities resisting exploitation and violence</li>
						<li><i class="fas fa-fist-raised"></i> All indigenous, Black, brown, and working-class communities fighting for liberation</li>
					</ul>
				</div>
				
				<aside class="sidebar">
					<div class="sidebar-card">
						<h3>Join Us</h3>
						<p>Ready to use your STEM skills for liberation? Get involved with STEM4Palestine today.</p>
						<a href="/get-involved" class="cta-button">Get Involved</a>
					</div>
					
					<div class="sidebar-card">
						<h3>Contact</h3>
						<p>Email: info@stem4pal.org</p>
						<div class="social-links">
							<a href="https://www.instagram.com/reel/DOuObdDjga6/?igsh=NTc4MTIwNjQ2YQ==" target="_blank">Instagram</a>
							<a href="https://m.youtube.com/watch?v=wf63XKv77Mo" target="_blank">YouTube</a>
						</div>
					</div>
				</aside>
			</div>
		</div>
	</section>
</div>

<style>
	.about-page {
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

	.hero h1 {
		font-size: 3rem;
		font-weight: 800;
		margin-bottom: 1rem;
	}

	.hero-subtitle {
		font-size: 1.25rem;
		max-width: 600px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.content {
		padding: 4rem 0;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 3rem;
	}

	.main-content h2 {
		color: #2d3748;
		font-size: 2rem;
		margin-bottom: 1.5rem;
		margin-top: 2rem;
	}

	.main-content h2:first-child {
		margin-top: 0;
	}

	.main-content p {
		line-height: 1.8;
		margin-bottom: 1.5rem;
		color: #4a5568;
	}

	.values-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1.5rem;
		margin: 2rem 0;
	}

	.value-card {
		background: #f7fafc;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #059669;
	}

	.value-card h3 {
		color: #059669;
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
	}

	.value-card p {
		color: #4a5568;
		margin: 0;
		font-size: 0.95rem;
	}

	.solidarity-list {
		list-style: none;
		padding: 0;
	}

	.solidarity-list li {
		padding: 0.5rem 0;
		color: #4a5568;
		line-height: 1.6;
	}

	.sidebar {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.sidebar-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		border: 2px solid #e2e8f0;
		text-align: center;
	}

	.sidebar-card h3 {
		color: #2d3748;
		margin-bottom: 1rem;
	}

	.sidebar-card p {
		color: #4a5568;
		margin-bottom: 1.5rem;
	}

	.cta-button {
		background-color: #059669;
		color: white;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		text-decoration: none;
		font-weight: 600;
		transition: background-color 0.2s;
		display: inline-block;
	}

	.cta-button:hover {
		background-color: #047857;
	}

	.social-links {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}

	.social-links a {
		color: #059669;
		text-decoration: none;
		font-weight: 500;
		padding: 0.5rem;
		border: 1px solid #059669;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.social-links a:hover {
		background-color: #059669;
		color: white;
	}

	@media (max-width: 768px) {
		.hero h1 {
			font-size: 2rem;
		}

		.content-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}

		.values-grid {
			grid-template-columns: 1fr;
		}
	}
</style>