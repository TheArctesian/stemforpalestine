import { describe, expect, it } from 'vitest';
import { sanitizeRichText } from './sanitize';

describe('sanitizeRichText', () => {
	it('keeps ordinary formatting and alignment', () => {
		const html = '<h2 style="text-align: center;">Hi</h2><p><strong>Bold</strong> <em>it</em></p>';
		expect(sanitizeRichText(html)).toBe(
			'<h2 style="text-align:center">Hi</h2><p><strong>Bold</strong> <em>it</em></p>'
		);
	});

	it('removes scripts, handlers and javascript: links', () => {
		expect(
			sanitizeRichText(
				'<p onclick="x()">Hi<script>alert(1)</script><a href="javascript:alert(1)">x</a></p>'
			)
		).toBe('<p>Hi<a target="_blank" rel="noopener noreferrer">x</a></p>');
	});

	it('opens links in a new tab safely', () => {
		expect(sanitizeRichText('<a href="https://stem4pal.org">site</a>')).toBe(
			'<a href="https://stem4pal.org" target="_blank" rel="noopener noreferrer">site</a>'
		);
	});

	it('drops styles it does not know', () => {
		expect(sanitizeRichText('<p style="position: fixed; text-align: right">x</p>')).toBe(
			'<p style="text-align:right">x</p>'
		);
	});
});
