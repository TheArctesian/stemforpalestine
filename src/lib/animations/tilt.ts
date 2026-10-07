import { gsap } from 'gsap';

/*
 * Gently rocks an element back and forth in 3D, like a poster swaying on a pin.
 *
 * Usage: <img use:tilt /> or <img use:tilt={{ degrees: 4 }} />. Give the parent a CSS
 * `perspective` (e.g. 1200px) so the rotation reads as depth instead of a flat squash.
 *
 * Turning Y and X together, in step, swings it around a diagonal axis rather than straight up
 * and down, which looks more natural. Hovering eases it to a stop so it's easy to read, and
 * with prefers-reduced-motion it doesn't move at all.
 */
export function tilt(node: HTMLElement, { degrees = 6, duration = 3.5 } = {}) {
	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	gsap.set(node, { rotationY: -degrees, rotationX: degrees * 0.4, rotationZ: -0.75 });
	const swing = gsap.to(node, {
		rotationY: degrees,
		rotationX: -degrees * 0.4,
		rotationZ: 0.75,
		duration,
		ease: 'sine.inOut',
		repeat: -1,
		yoyo: true
	});

	// Ramp the speed down/up rather than pausing, so it never jumps.
	const settle = () => gsap.to(swing, { timeScale: 0, duration: 0.6, ease: 'power2.out' });
	const resume = () => gsap.to(swing, { timeScale: 1, duration: 0.8, ease: 'power2.in' });
	node.addEventListener('pointerenter', settle);
	node.addEventListener('pointerleave', resume);

	return {
		destroy() {
			node.removeEventListener('pointerenter', settle);
			node.removeEventListener('pointerleave', resume);
			gsap.killTweensOf(swing);
			swing.kill();
		}
	};
}
