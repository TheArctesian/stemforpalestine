import { hash, verify } from '@node-rs/argon2';

// OWASP's minimum recommended argon2id settings.
const OPTIONS = { memoryCost: 19456, timeCost: 2, outputLen: 32, parallelism: 1 };

export const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(password: string): Promise<string> {
	return hash(password, OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	return verify(passwordHash, password, OPTIONS);
}

/** A real hash of a throwaway password, so unknown usernames take as long to reject as real ones. */
let dummyHash: Promise<string> | undefined;
export function dummyVerify(password: string): Promise<boolean> {
	dummyHash ??= hashPassword('not-a-real-password');
	return dummyHash.then((h) => verifyPassword(h, password));
}
