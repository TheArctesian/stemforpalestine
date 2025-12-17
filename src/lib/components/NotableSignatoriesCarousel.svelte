<script lang="ts">
	interface NotableSignatory {
		displayName: string;
		roles: string;
		description: string;
		comment?: string | null;
	}

	let { signatories = [] }: { signatories: NotableSignatory[] } = $props();

	let currentSlide = $state(0);
	let isPaused = $state(false);
	let autoplayInterval: ReturnType<typeof setInterval> | null = null;
	let cardsPerSlide = $state(3); // Default to 3 cards per slide

	const AUTOPLAY_DELAY = 5000; // 5 seconds

	// Calculate total number of slides
	const totalSlides = $derived(Math.ceil(signatories.length / cardsPerSlide));

	function nextSlide() {
		currentSlide = (currentSlide + 1) % totalSlides;
	}

	function prevSlide() {
		currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
	}

	function goToSlide(index: number) {
		currentSlide = index;
	}

	function startAutoplay() {
		if (autoplayInterval) return;
		autoplayInterval = setInterval(() => {
			if (!isPaused) {
				nextSlide();
			}
		}, AUTOPLAY_DELAY);
	}

	function stopAutoplay() {
		if (autoplayInterval) {
			clearInterval(autoplayInterval);
			autoplayInterval = null;
		}
	}

	function handleMouseEnter() {
		isPaused = true;
	}

	function handleMouseLeave() {
		isPaused = false;
	}

	function updateCardsPerSlide() {
		if (typeof window === 'undefined') return;

		const oldCardsPerSlide = cardsPerSlide;

		if (window.innerWidth <= 768) {
			cardsPerSlide = 1;
		} else if (window.innerWidth <= 1024) {
			cardsPerSlide = 2;
		} else {
			cardsPerSlide = 3;
		}

		// Reset to first slide if cards per slide changed to avoid showing empty slides
		if (oldCardsPerSlide !== cardsPerSlide && currentSlide >= Math.ceil(signatories.length / cardsPerSlide)) {
			currentSlide = 0;
		}
	}

	$effect(() => {
		updateCardsPerSlide();
		if (typeof window !== 'undefined') {
			window.addEventListener('resize', updateCardsPerSlide);
			return () => window.removeEventListener('resize', updateCardsPerSlide);
		}
	});

	$effect(() => {
		startAutoplay();
		return () => stopAutoplay();
	});

	// Get visible signatories for current slide
	const visibleSignatories = $derived.by(() => {
		const startIndex = currentSlide * cardsPerSlide;
		return signatories.slice(startIndex, startIndex + cardsPerSlide);
	});
</script>

<div class="carousel-container">
	<div class="carousel-header">
		<h2>Notable Signatories</h2>
		<p class="subtitle">Prominent voices standing with Peyrin</p>
	</div>

	<div
		class="carousel"
		onmouseenter={handleMouseEnter}
		onmouseleave={handleMouseLeave}
		role="region"
		aria-label="Notable signatories carousel"
	>
		<button class="nav-btn prev" onclick={prevSlide} aria-label="Previous signatory">
			<i class="fas fa-chevron-left"></i>
		</button>

		{#key currentSlide}
			<div class="carousel-track">
				{#each visibleSignatories as signatory, i (signatory.displayName + i)}
					<div class="carousel-card">
						<div class="card-content">
							<h3 class="signatory-name">{signatory.displayName}</h3>
							<p class="signatory-role">{signatory.roles}</p>
							<p class="signatory-description">{signatory.description}</p>
							{#if signatory.comment}
								<blockquote class="signatory-quote">"{signatory.comment}"</blockquote>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/key}

		<button class="nav-btn next" onclick={nextSlide} aria-label="Next signatory">
			<i class="fas fa-chevron-right"></i>
		</button>
	</div>

	<div class="carousel-dots">
		{#each Array(totalSlides) as _, index (index)}
			<button
				class="dot"
				class:active={index === currentSlide}
				onclick={() => goToSlide(index)}
				aria-label="Go to slide {index + 1}"
			></button>
		{/each}
	</div>
</div>

<style>
	.carousel-container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem 3rem;
	}

	.carousel-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.carousel-header h2 {
		font-size: 2rem;
		color: var(--color-primary, #009639);
		margin-bottom: 0.5rem;
	}

	.subtitle {
		font-size: 1.1rem;
		color: #64748b;
		margin: 0;
	}

	.carousel {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem 0;
		overflow: visible;
	}

	.nav-btn {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: white;
		border: 2px solid #bbf7d0;
		color: var(--color-primary, #009639);
		font-size: 1.2rem;
		cursor: pointer;
		transition: all 0.3s;
		z-index: 2;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.nav-btn:hover {
		background: var(--color-primary, #009639);
		color: white;
		border-color: var(--color-primary, #009639);
		transform: scale(1.1);
	}

	.carousel-track {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		overflow: visible;
		flex: 1;
		animation: slideIn 0.5s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes cardFadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.carousel-card {
		background: white;
		border-radius: 12px;
		border: 2px solid #bbf7d0;
		padding: 1.5rem;
		transition: all 0.3s ease;
		min-height: 280px;
		display: flex;
		flex-direction: column;
		animation: cardFadeIn 0.5s ease-out backwards;
	}

	.carousel-card:nth-child(1) {
		animation-delay: 0.1s;
	}

	.carousel-card:nth-child(2) {
		animation-delay: 0.2s;
	}

	.carousel-card:nth-child(3) {
		animation-delay: 0.3s;
	}

	.carousel-card:hover {
		border-color: var(--color-primary, #009639);
		transform: translateY(-4px);
		box-shadow: 0 10px 25px rgba(0, 150, 57, 0.15);
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex: 1;
	}

	.signatory-name {
		font-weight: 700;
		font-size: 1.2rem;
		color: #166534;
		margin: 0;
	}

	.signatory-role {
		font-size: 0.9rem;
		color: #4a5568;
		margin: 0;
		font-style: italic;
	}

	.signatory-description {
		font-size: 0.95rem;
		color: #475569;
		line-height: 1.5;
		margin: 0.5rem 0 0;
		flex: 1;
	}

	.signatory-quote {
		margin: 0.75rem 0 0;
		padding: 0.75rem;
		background: #f0fdf4;
		border-left: 4px solid var(--color-primary, #009639);
		border-radius: 0 8px 8px 0;
		font-style: italic;
		color: #475569;
		font-size: 0.85rem;
		line-height: 1.4;
		max-height: 100px;
		overflow-y: auto;
	}

	.carousel-dots {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #d1d5db;
		border: none;
		cursor: pointer;
		transition: all 0.3s;
		padding: 0;
	}

	.dot:hover {
		background: #9ca3af;
		transform: scale(1.2);
	}

	.dot.active {
		background: var(--color-primary, #009639);
		width: 32px;
		border-radius: 6px;
	}

	/* Tablet view - 2 cards */
	@media (max-width: 1024px) {
		.carousel-track {
			grid-template-columns: repeat(2, 1fr);
		}

		.carousel-card {
			min-height: 320px;
		}
	}

	/* Mobile view - 1 card */
	@media (max-width: 768px) {
		.carousel-header h2 {
			font-size: 1.5rem;
		}

		.subtitle {
			font-size: 1rem;
		}

		.carousel-track {
			grid-template-columns: 1fr;
		}

		.nav-btn {
			width: 40px;
			height: 40px;
			font-size: 1rem;
		}

		.carousel-card {
			min-height: 340px;
		}
	}

	/* Very small mobile */
	@media (max-width: 480px) {
		.carousel {
			gap: 0.5rem;
		}

		.nav-btn {
			width: 36px;
			height: 36px;
		}

		.carousel-card {
			padding: 1rem;
		}

		.signatory-name {
			font-size: 1.1rem;
		}
	}
</style>
