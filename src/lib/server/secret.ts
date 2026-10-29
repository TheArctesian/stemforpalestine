import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** HMAC-SHA256 with the app secret, as hex. Used to hash IPs and to sign tokens. */
export function hmac(value: string): string {
	if (!env.APP_SECRET) throw new Error('APP_SECRET is not set');
	return createHmac('sha256', env.APP_SECRET).update(value).digest('hex');
}

/** Stable, non-reversible stand-in for an IP address, so raw IPs are never stored. */
export function hashIp(ip: string): string {
	return hmac(`ip:${ip}`).slice(0, 32);
}
