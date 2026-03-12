import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Proxies to euterpe GET /transcode/status?jobId=x. Job state lives in euterpe's DB. */
export const GET: RequestHandler = async ({ url, platform }) => {
	if (!platform) return json({ error: 'Platform not available' }, 500);
	const jobId = url.searchParams.get('jobId');
	if (!jobId) return json({ error: 'Missing jobId' }, 400);

	const euterpeUrl = platform.env.EUTERPE_URL;
	const apiKey = platform.env.PRIVATE_EUTERPE_API_KEY;
	if (!euterpeUrl || !apiKey) {
		return json({ error: 'Euterpe not configured' }, 503);
	}

	const base = euterpeUrl.replace(/\/$/, '');
	const res = await fetch(`${base}/transcode/status?jobId=${jobId}`, {
		headers: { Authorization: `Bearer ${apiKey}` }
	});

	if (!res.ok) {
		if (res.status === 404) return json({ error: 'Job not found' }, 404);
		return json({ error: 'Euterpe error' }, res.status);
	}

	const data = (await res.json()) as { status?: string; sourceFileId?: string; error?: string };
	return json(data);
};
