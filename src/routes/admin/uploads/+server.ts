import { error, json } from '@sveltejs/kit';
import { mkdir, writeFile } from 'node:fs/promises';
import { put } from '@vercel/blob';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { requireAdmin } from '$lib/server/permissions';
import type { RequestHandler } from './$types';

/*
 * Images for emails and events (and PDF posters), stored in Vercel Blob. In development without
 * a Blob token they go to static/uploads-dev/ instead (gitignored).
 */

const TYPES: Record<string, string> = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/webp': 'webp',
	'image/gif': 'gif',
	'application/pdf': 'pdf'
};
const MAX_BYTES = 5 * 1024 * 1024;

export const POST: RequestHandler = async ({ request, locals, url }) => {
	requireAdmin(locals);
	const file = (await request.formData()).get('file');
	if (!(file instanceof File)) error(400, 'No file was sent.');
	const extension = TYPES[file.type];
	if (!extension) error(415, 'Upload a JPEG, PNG, WebP or GIF image, or a PDF.');
	if (file.size > MAX_BYTES) error(413, 'Files can be up to 5 MB.');

	const base =
		file.name
			.replace(/\.[^.]+$/, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 40) || 'file';
	const month = new Date().toISOString().slice(0, 7);
	const name = `${base}-${crypto.randomUUID().slice(0, 8)}.${extension}`;

	if (env.BLOB_READ_WRITE_TOKEN) {
		const blob = await put(`uploads/${month}/${name}`, file, {
			access: 'public',
			contentType: file.type,
			token: env.BLOB_READ_WRITE_TOKEN
		});
		return json({ url: blob.url });
	}
	if (dev) {
		await mkdir('static/uploads-dev', { recursive: true });
		await writeFile(`static/uploads-dev/${name}`, Buffer.from(await file.arrayBuffer()));
		return json({ url: `${url.origin}/uploads-dev/${name}` });
	}
	error(503, 'Uploads are not set up: add BLOB_READ_WRITE_TOKEN.');
};
