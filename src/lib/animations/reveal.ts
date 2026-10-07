import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './reveal.css';

/*
 * Scroll-reveal entrance animations (GSAP + ScrollTrigger), same feel as the QueryQode site.
 *
 * Usage: <div data-reveal="up" use:reveal={0.1}>…</div>
 *   data-reveal: "up" (default), "left", "right" or "zoom". It's also what reveal.css uses to
 *                hide the element before hydration, so it must be in the markup, not just the action.
 *   reveal={n}:  optional delay in seconds, for staggering elements that enter together.
 *
 * Elements already on screen at load (the hero) animate in straight away; everything else waits
 * until it scrolls into view. With prefers-reduced-motion the element is simply shown.
 */

const OFFSETS: Record<string, gsap.TweenVars> = {
	up: { y: 40 },
	left: { x: -40 },
	right: { x: 40 },
	zoom: { y: 24, scale: 0.96 }
};

let registered = false;

export function reveal(node: HTMLElement, delay = 0) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		node.classList.add('reveal-armed');
		return;
	}

	if (!registered) {
		gsap.registerPlugin(ScrollTrigger);
		registered = true;
	}

	// Sideways slides only where columns sit side by side - on stacked phone layouts an element
	// parked 40px off-screen widens the page until it animates in, so it fades up there instead.
	const sideways = window.matchMedia('(min-width: 992px)').matches;
	const direction = node.dataset.reveal || 'up';
	const offset = !sideways && (direction === 'left' || direction === 'right') ? OFFSETS.up : OFFSETS[direction] ?? OFFSETS.up;

	gsap.set(node, { ...offset, opacity: 0 });
	// From here GSAP owns the element's opacity, so the CSS pre-hydration hide can stand down.
	node.classList.add('reveal-armed');

	const tween = gsap.to(node, {
		opacity: 1,
		x: 0,
		y: 0,
		scale: 1,
		duration: 0.8,
		delay,
		ease: 'power2.out',
		clearProps: 'transform',
		scrollTrigger: { trigger: node, start: 'top 88%', once: true }
	});

	return {
		destroy() {
			tween.scrollTrigger?.kill();
			tween.kill();
		}
	};
}
