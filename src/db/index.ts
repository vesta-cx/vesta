/** @format */

import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import {
	idempotencyKeys,
	inboxJobs,
	jobOutboxEvents,
	requesterSigningSecrets,
} from "./schema.js";

const raw = process.env["DATABASE_URL"] ?? "file:./data/euterpe.sqlite";
let url: string;
if (raw.startsWith("file:")) {
	const pathPart = raw.slice(5).replace(/^\/+/, "/") || ".";
	const dbPath =
		path.isAbsolute(pathPart) ? pathPart : (
			path.resolve(process.cwd(), pathPart)
		);
	url = `file:${dbPath}`;
	const dir = path.dirname(dbPath);
	try {
		fs.mkdirSync(dir, { recursive: true });
	} catch {
		// ignore
	}
} else {
	url = raw;
}

const client = createClient({ url });
export const db = drizzle(client, {
	schema: {
		inboxJobs,
		jobOutboxEvents,
		idempotencyKeys,
		requesterSigningSecrets,
	},
});

export {
	idempotencyKeys,
	inboxJobs,
	jobOutboxEvents,
	requesterSigningSecrets,
} from "./schema.js";
