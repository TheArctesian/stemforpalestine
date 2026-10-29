import { describe, expect, it } from 'vitest';
import { fieldErrors, passwordSchema, profileSchema, usernameSchema } from './users';

describe('usernameSchema', () => {
	it('lowercases and trims', () => {
		expect(usernameSchema.parse('  Admin ')).toBe('admin');
	});

	it('rejects short names and odd characters', () => {
		expect(usernameSchema.safeParse('ab').success).toBe(false);
		expect(usernameSchema.safeParse('has space').success).toBe(false);
		expect(usernameSchema.safeParse('émile').success).toBe(false);
	});
});

describe('passwordSchema', () => {
	it('needs at least 10 characters', () => {
		expect(passwordSchema.safeParse('123456789').success).toBe(false);
		expect(passwordSchema.safeParse('1234567890').success).toBe(true);
	});
});

describe('profileSchema', () => {
	const base = {
		username: 'organizer',
		displayName: 'Organizer',
		role: 'member',
		status: 'active'
	};

	it('turns a blank email into null', () => {
		expect(profileSchema.parse({ ...base, email: '  ' }).email).toBeNull();
	});

	it('normalises a real email', () => {
		expect(profileSchema.parse({ ...base, email: ' Person@Example.org ' }).email).toBe(
			'person@example.org'
		);
	});

	it('reports the first error for each field', () => {
		const result = profileSchema.safeParse({ ...base, email: 'nope', displayName: '' });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(fieldErrors(result.error)).toEqual({
				email: 'Enter a valid email address.',
				displayName: 'Enter a name.'
			});
		}
	});
});
