import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireAdmin } from '$lib/server/permissions';
import { sendNextBatch } from '$lib/server/email/send';
import type { Config } from '@sveltejs/adapter-vercel';
import type { RequestHandler } from './$types';

export const config: Config = { maxDuration: 60 };

// The campaign page calls this over and over while it's sending; each call sends one batch.
export const POST: RequestHandler = async ({ params, locals, url }) => {
	requireAdmin(locals);
	if (!z.uuid().safeParse(params.id).success) error(404, 'Campaign not found');
	try {
		return json(await sendNextBatch(params.id, url.origin));
	} catch (e) {
		error(503, (e as Error).message);
	}
};
