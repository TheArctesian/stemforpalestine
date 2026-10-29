import type { Cookies } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { db } from '$lib/server/db';
import { sessions, users, type Session, type User } from '$lib/server/db/schema';

/*
 * Database sessions, following the Lucia guide (lucia-auth.com): the cookie holds a random token,
 * the database holds only its SHA-256, and sessions slide forward while they're being used.
 */

const DAY_MS = 1000 * 60 * 60 * 24;
const SESSION_LIFETIME_MS = 30 * DAY_MS;
const RENEW_WHEN_LEFT_MS = 15 * DAY_MS;

export const SESSION_COOKIE = 's4p_session';

/** The parts of a user that are safe to hand to pages. */
export type SessionUser = Pick<User, 'id' | 'username' | 'displayName' | 'role'>;

export function generateSessionToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(20));
	return encodeBase32LowerCaseNoPadding(bytes);
}

function sessionIdFromToken(token: string): string {
	return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
}

export async function createSession(
	token: string,
	userId: string,
	userAgent: string | null
): Promise<Session> {
	const session: Session = {
		id: sessionIdFromToken(token),
		userId,
		expiresAt: new Date(Date.now() + SESSION_LIFETIME_MS),
		userAgent,
		createdAt: new Date()
	};
	await db.insert(sessions).values(session);
	return session;
}

export async function validateSessionToken(
	token: string
): Promise<{ session: Session; user: SessionUser } | { session: null; user: null }> {
	const sessionId = sessionIdFromToken(token);
	const [row] = await db
		.select({
			session: sessions,
			user: {
				id: users.id,
				username: users.username,
				displayName: users.displayName,
				role: users.role,
				status: users.status
			}
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, sessionId));

	if (!row) return { session: null, user: null };
	const { session, user } = row;

	if (Date.now() >= session.expiresAt.getTime() || user.status !== 'active') {
		await db.delete(sessions).where(eq(sessions.id, session.id));
		return { session: null, user: null };
	}

	if (session.expiresAt.getTime() - Date.now() < RENEW_WHEN_LEFT_MS) {
		session.expiresAt = new Date(Date.now() + SESSION_LIFETIME_MS);
		await db
			.update(sessions)
			.set({ expiresAt: session.expiresAt })
			.where(eq(sessions.id, session.id));
	}

	const { status: _status, ...sessionUser } = user;
	return { session, user: sessionUser };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, sessionId));
}

/** Signs a user out everywhere, optionally keeping the session making the request. */
export async function invalidateUserSessions(
	userId: string,
	keepSessionId?: string
): Promise<void> {
	await db
		.delete(sessions)
		.where(
			keepSessionId
				? and(eq(sessions.userId, userId), ne(sessions.id, keepSessionId))
				: eq(sessions.userId, userId)
		);
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date): void {
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt
	});
}

export function deleteSessionCookie(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
