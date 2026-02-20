import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { transcodeRoutes } from './routes/transcode.js';

const app = new Hono();

app.route('/transcode', transcodeRoutes);
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = Number(process.env['PORT']) || 3000;
serve({ fetch: app.fetch, port }, (info) => {
	console.log(`Euterpe listening on http://localhost:${info.port}`);
});
