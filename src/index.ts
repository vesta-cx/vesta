import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseAllowedOrigins } from '@vesta-cx/utils/cors';
import { transcodeRoutes } from './routes/transcode.js';

const app = new Hono();

const allowedOrigins = parseAllowedOrigins(process.env['CORS_ORIGINS']);
if (allowedOrigins.length > 0) {
	app.use(
		'*',
		cors({
			origin: allowedOrigins,
			allowMethods: ['GET', 'HEAD', 'POST', 'OPTIONS'],
			allowHeaders: ['Content-Type', 'Authorization'],
			maxAge: 86400
		})
	);
}

app.route('/transcode', transcodeRoutes);
app.get('/health', (c) => c.json({ status: 'ok' }));

const port = Number(process.env['PORT']) || 3000;
serve({ fetch: app.fetch, port }, (info) => {
	console.log(`Euterpe listening on http://localhost:${info.port}`);
});
