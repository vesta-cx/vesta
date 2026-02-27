/** @format */

import { defineConfig, type Plugin } from "vite";

const hlsMimeTypes = (): Plugin => ({
	name: "hls-mime-types",
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			const url = req.url ?? "";
			if (url.endsWith(".m3u8")) {
				res.setHeader(
					"Content-Type",
					"application/vnd.apple.mpegurl",
				);
			} else if (url.endsWith(".m4s")) {
				res.setHeader(
					"Content-Type",
					"video/iso.segment",
				);
			} else if (url.endsWith(".ts")) {
				res.setHeader("Content-Type", "video/MP2T");
			} else if (url.endsWith(".flac")) {
				res.setHeader("Content-Type", "audio/flac");
			}
			next();
		});
	},
});

export default defineConfig({
	plugins: [hlsMimeTypes()],
	server: {
		host: true,
	},
});
