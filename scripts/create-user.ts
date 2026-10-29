/**
 * Creates a user from the command line, or resets an existing user's password. There's no public
 * sign-up, so this is how the first (shared) admin account gets made.
 *
 *   npm run user:create -- --username admin --name "STEM4Palestine" --role admin
 *   npm run user:create -- --username admin --reset          # new password for an existing user
 *
 * Uses DATABASE_URL from .env or the environment; point it at production to create the real admin.
 * Prompts for the password, or reads it from stdin when piped (`echo … | npm run user:create …`).
 */
import { parseArgs } from 'node:util';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { users } from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/password';
import { passwordSchema, usernameSchema } from '../src/lib/server/users';

const { values: args } = parseArgs({
	options: {
		username: { type: 'string' },
		name: { type: 'string' },
		email: { type: 'string' },
		role: { type: 'string', default: 'admin' },
		reset: { type: 'boolean', default: false }
	}
});

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

async function readPassword(): Promise<string> {
	const { stdin, stdout } = process;
	if (!stdin.isTTY) {
		let input = '';
		for await (const chunk of stdin) input += chunk;
		return input.split(/\r?\n/)[0];
	}

	// Raw mode, so the password isn't echoed to the terminal.
	stdout.write('Password: ');
	stdin.setRawMode(true);
	stdin.setEncoding('utf8');
	stdin.resume();
	return new Promise((resolve) => {
		let value = '';
		const onData = (chunk: string) => {
			for (const char of chunk) {
				if (char === '\r' || char === '\n') {
					stdin.off('data', onData);
					stdin.setRawMode(false);
					stdin.pause();
					stdout.write('\n');
					resolve(value);
					return;
				}
				if (char === '\u0003') fail('\nCancelled.');
				value = char === '\u007f' ? value.slice(0, -1) : value + char;
			}
		};
		stdin.on('data', onData);
	});
}

if (!process.env.DATABASE_URL) fail('DATABASE_URL is not set.');
const username = usernameSchema.safeParse(args.username ?? '');
if (!username.success) fail(`--username: ${username.error.issues[0].message}`);
if (args.role !== 'admin' && args.role !== 'member') fail('--role must be "admin" or "member".');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

try {
	const [existing] = await db.select().from(users).where(eq(users.username, username.data));
	if (existing && !args.reset)
		fail(`"${username.data}" already exists. Pass --reset to set a new password.`);
	if (!existing && args.reset) fail(`There's no user called "${username.data}".`);

	const password = passwordSchema.safeParse(await readPassword());
	if (!password.success) fail(password.error.issues[0].message);
	const passwordHash = await hashPassword(password.data);

	if (existing) {
		await db.update(users).set({ passwordHash, status: 'active' }).where(eq(users.id, existing.id));
		console.log(`Set a new password for "${existing.username}".`);
	} else {
		await db.insert(users).values({
			username: username.data,
			displayName: args.name?.trim() || username.data,
			email: args.email?.trim().toLowerCase() || null,
			role: args.role,
			passwordHash
		});
		console.log(`Created ${args.role} "${username.data}".`);
	}
} finally {
	await pool.end();
}
