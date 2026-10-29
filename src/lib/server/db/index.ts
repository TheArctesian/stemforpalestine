import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { attachDatabasePool } from '@vercel/functions';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// node-postgres rather than Neon's HTTP driver: it also talks to a local Postgres in development,
// and it supports real transactions. Use Neon's pooled ("-pooler") connection string in production.
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });

// Lets Vercel close idle connections before it suspends the function. A no-op elsewhere.
attachDatabasePool(pool);

export const db = drizzle(pool, { schema });
