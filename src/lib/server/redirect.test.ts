import { describe, expect, it } from 'vitest';
import { safeAdminRedirect } from './redirect';

describe('safeAdminRedirect', () => {
	it('keeps admin paths and their query strings', () => {
		expect(safeAdminRedirect('/admin')).toBe('/admin');
		expect(safeAdminRedirect('/admin/users?created=x')).toBe('/admin/users?created=x');
	});

	it('falls back to /admin for anything else', () => {
		for (const target of [
			null,
			'',
			'/',
			'/events',
			'/administrator',
			'/admin.evil.example',
			'//evil.example/admin',
			'https://evil.example/admin',
			'/\\evil.example/admin',
			'javascript:alert(1)'
		]) {
			expect(safeAdminRedirect(target)).toBe('/admin');
		}
	});

	it('normalises dot segments instead of escaping the admin', () => {
		expect(safeAdminRedirect('/admin/../events')).toBe('/admin');
	});
});
