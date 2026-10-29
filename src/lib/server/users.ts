// No database imports here: scripts/create-user.ts uses these schemas too.
import { z } from 'zod';
import { MIN_PASSWORD_LENGTH } from '$lib/server/password';

export const usernameSchema = z
	.string()
	.trim()
	.toLowerCase()
	.regex(/^[a-z0-9._-]{3,32}$/, '3–32 characters: letters, numbers, dots, dashes or underscores.');

export const passwordSchema = z
	.string()
	.min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters.`)
	.max(200, 'That password is too long.');

export const profileSchema = z.object({
	username: usernameSchema,
	displayName: z.string().trim().min(1, 'Enter a name.').max(80),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.transform((value) => value || null)
		.pipe(z.email('Enter a valid email address.').nullable()),
	role: z.enum(['admin', 'member']),
	status: z.enum(['active', 'disabled'])
});

/** First error message per field, the shape the user forms display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
	const errors: Record<string, string> = {};
	for (const issue of error.issues) {
		const key = String(issue.path[0] ?? 'form');
		errors[key] ??= issue.message;
	}
	return errors;
}
