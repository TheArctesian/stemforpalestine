/** True when a query failed on a unique constraint (Postgres error 23505). */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
	// Depending on the version, drizzle either rethrows pg's error or wraps it as `cause`.
	for (let e = error; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
		const { code, constraint: name } = e as { code?: string; constraint?: string };
		if (code === '23505') return !constraint || name === constraint;
	}
	return false;
}
