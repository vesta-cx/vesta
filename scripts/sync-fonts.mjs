/** @format */

import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.dirname(__dirname);
const publicDir = path.join(appRoot, "public", "fonts");
const nodeModulesDir = path.join(appRoot, "node_modules");

mkdirSync(publicDir, { recursive: true });

const fonts = [
	{
		name: "Archivo",
		files: [
			"@fontsource/archivo/files/archivo-latin-400-normal.woff2",
			"@fontsource/archivo/files/archivo-latin-500-normal.woff2",
			"@fontsource/archivo/files/archivo-latin-600-normal.woff2",
		],
	},
	{
		name: "JetBrains Mono",
		files: [
			"@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2",
		],
	},
];

for (const font of fonts) {
	for (const file of font.files) {
		const src = path.join(nodeModulesDir, file);
		const dest = path.join(publicDir, path.basename(file));
		copyFileSync(src, dest);
		console.log(`✓ Copied ${path.basename(file)}`);
	}
}

console.log("Font files synced to public/fonts/");
