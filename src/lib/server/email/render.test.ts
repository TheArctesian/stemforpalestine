import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/dynamic/private', () => ({ env: { APP_SECRET: 'test-secret' } }));
vi.mock('$lib/server/db', () => ({ db: {} }));

const { renderEmail } = await import('./render');
const { readUnsubscribeLink, unsubscribeLinks } = await import('./unsubscribe');

describe('renderEmail', () => {
	const template = {
		subject: 'Hi {{first_name|there}}!',
		html: '<p>Hello {{name}}, see you in {{city|the Bay}}.</p><p><a href="{{unsubscribe_url}}">Stop</a></p>'
	};

	it('fills placeholders, escaping answers, and inlines styles', () => {
		const email = renderEmail(template, { first_name: 'Leila', name: '<script>x</script>', form_title: 'Interest' }, {
			unsubscribeUrl: 'https://stem4pal.org/unsubscribe?e=abc&t=def'
		});
		expect(email.subject).toBe('Hi Leila!');
		expect(email.html).toContain('Hello &lt;script&gt;x&lt;/script&gt;, see you in the Bay.');
		expect(email.html).not.toContain('<script>');
		expect(email.html).toContain('href="https://stem4pal.org/unsubscribe?e=abc&amp;t=def"');
		expect(email.html).toMatch(/<td class="content" style="[^"]*font-size: 16px/);
		expect(email.html).toContain('You\'re getting this because you filled in “Interest”');
	});

	it('makes a readable plain-text version', () => {
		const email = renderEmail(template, { name: 'Omar' }, { unsubscribeUrl: 'https://stem4pal.org/u' });
		expect(email.subject).toBe('Hi there!');
		expect(email.text).toContain('Hello Omar, see you in the Bay.');
		expect(email.text).toContain('Stop [https://stem4pal.org/u]');
	});
});

describe('unsubscribe links', () => {
	it('round-trip, and reject tampering', () => {
		const { page, oneClick } = unsubscribeLinks('https://stem4pal.org', 'leila@example.org');
		expect(new URL(oneClick).pathname).toBe('/api/email/unsubscribe');
		expect(readUnsubscribeLink(new URL(page))).toBe('leila@example.org');

		const forged = new URL(page);
		forged.searchParams.set('e', Buffer.from('someone@example.org').toString('base64url'));
		expect(readUnsubscribeLink(forged)).toBeNull();
		expect(readUnsubscribeLink(new URL('https://stem4pal.org/unsubscribe'))).toBeNull();
	});
});
