import { describe, expect, it } from 'vitest';
import { isUniqueViolation } from './errors';

describe('isUniqueViolation', () => {
	const pgError = { code: '23505', constraint: 'users_username_unique' };

	it('recognises the error directly or wrapped as a cause', () => {
		expect(isUniqueViolation(pgError)).toBe(true);
		expect(isUniqueViolation(new Error('query failed', { cause: pgError }))).toBe(true);
	});

	it('can match a specific constraint', () => {
		expect(isUniqueViolation(pgError, 'users_username_unique')).toBe(true);
		expect(isUniqueViolation(pgError, 'users_email_unique')).toBe(false);
	});

	it('ignores other errors', () => {
		expect(isUniqueViolation(new Error('nope'))).toBe(false);
		expect(isUniqueViolation({ code: '23503' })).toBe(false);
		expect(isUniqueViolation(null)).toBe(false);
	});
});
