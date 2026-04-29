#!/usr/bin/env node

/** @format */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import path from "node:path";
import process from "node:process";

const appRoot = path.resolve(import.meta.dirname, "..");
const runId = `smoke_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
const baseUrl = normalizeBaseUrl(
	process.env.ERATO_SMOKE_BASE_URL ?? "http://localhost:8787",
);
const apiKey = generateApiKey();
// Mirrors apps/erato/src/auth/helpers.ts because this Node script provisions local KV directly.
const apiKeyStorageKey = `ak:${await hashApiKey(apiKey)}`;
const created = {
	collectionId: null,
	commentEngagementId: null,
	featureSlug: `${runId}_feature`,
	featurePresetName: `${runId}_preset`,
	mentionEngagementId: null,
	permissionActionSlug: `${runId}:action`,
	permissionId: null,
	resourceId: null,
	teamId: null,
	userId: `${runId}_user`,
	workspaceId: null,
};

function normalizeBaseUrl(value) {
	const url = new URL(value);
	url.pathname = url.pathname.replace(/\/$/, "");
	if (!url.pathname.endsWith("/v0")) {
		url.pathname = `${url.pathname}/v0`.replace(/\/+/g, "/");
	}
	return url.toString().replace(/\/$/, "");
}

function generateApiKey() {
	return `vesta_${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

async function hashApiKey(raw) {
	return crypto.createHash("sha256").update(raw).digest("hex");
}

function runWrangler(args) {
	return new Promise((resolve, reject) => {
		const child = spawn(
			"node",
			["./scripts/wrangler-versioned.mjs", ...args],
			{
				cwd: appRoot,
				stdio: ["ignore", "pipe", "pipe"],
			},
		);
		let stdout = "";
		let stderr = "";
		child.stdout.on("data", (chunk) => {
			stdout += chunk;
		});
		child.stderr.on("data", (chunk) => {
			stderr += chunk;
		});
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve({ stdout, stderr });
				return;
			}
			reject(
				new Error(
					`wrangler exited ${code}\n${stdout}\n${stderr}`.trim(),
				),
			);
		});
	});
}

async function provisionApiKey() {
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
	const meta = {
		subjectType: "user",
		subjectId: created.userId,
		scopes: ["admin"],
		createdAt: new Date().toISOString(),
		expiresAt,
	};
	await runWrangler([
		"kv",
		"key",
		"put",
		apiKeyStorageKey,
		JSON.stringify(meta),
		"--binding",
		"KV",
		"--env",
		"dev",
		"--local",
	]);
}

async function revokeApiKey() {
	await runWrangler([
		"kv",
		"key",
		"delete",
		apiKeyStorageKey,
		"--binding",
		"KV",
		"--env",
		"dev",
		"--local",
	]).catch((error) => {
		console.error("Smoke API-key cleanup failed.");
		console.error(error.message);
	});
}

async function request(method, path, body, options = {}) {
	const response = await fetch(`${baseUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			...(body === undefined ?
				{}
			:	{ "Content-Type": "application/json" }),
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});

	const text = await response.text();
	const allowedStatuses = options.statuses ?? [200, 201];
	if (!allowedStatuses.includes(response.status)) {
		throw new Error(
			`${method} ${path} returned ${response.status}: ${text || response.statusText}`,
		);
	}

	try {
		return text ? JSON.parse(text) : null;
	} catch (error) {
		throw new Error(
			`${method} ${path} returned non-JSON ${response.status}: ${text || response.statusText}`,
			{ cause: error },
		);
	}
}

async function optionalDelete(path) {
	await request("DELETE", path, undefined, {
		statuses: [204, 404],
	}).catch((error) => {
		console.error(`Cleanup request failed for ${path}`);
		console.error(error.message);
	});
}

const item = (payload, label) => {
	if (!payload?.data || typeof payload.data !== "object") {
		throw new Error(`Expected item response for ${label}`);
	}
	return payload.data;
};

const assertListHas = async (path, predicate, label) => {
	const payload = await request("GET", path);
	if (!Array.isArray(payload?.data) || !payload.data.some(predicate)) {
		throw new Error(`Expected ${label} in ${path}`);
	}
};

async function assertHealth() {
	const response = await fetch(`${baseUrl}/health`);
	if (!response.ok) {
		throw new Error(
			`Erato is not healthy at ${baseUrl}/health (${response.status}). Start it first, for example: pnpm --filter erato dev`,
		);
	}
}

async function exerciseApi() {
	await request("GET", "/introspect/routes");

	await request("POST", "/users", {
		workosUserId: created.userId,
		email: `${runId}@example.test`,
		displayName: "Smoke Test User",
		avatarUrl: `https://example.test/${runId}/user.png`,
		bio: "Seeded by Erato HTTP smoke test",
		organizationId: `${runId}_org`,
	});
	await assertListHas(
		`/users?email=${encodeURIComponent(`${runId}@example.test`)}`,
		(row) => row.workosUserId === created.userId,
		"created user",
	);

	created.workspaceId = item(
		await request("POST", "/workspaces", {
			name: "Smoke Workspace",
			slug: `${runId}-workspace`,
			description: "Seeded workspace",
			ownerType: "user",
			ownerId: created.userId,
			avatarUrl: `https://example.test/${runId}/workspace.png`,
			bannerUrl: `https://example.test/${runId}/workspace-banner.png`,
			status: "LISTED",
		}),
		"workspace",
	).id;
	await request("POST", `/links/workspace/${created.workspaceId}`, {
		name: "homepage",
		url: `https://example.test/${runId}/workspace`,
		icon: "globe",
		position: 0,
	});
	await assertListHas(
		`/workspaces?slug=${encodeURIComponent(`${runId}-workspace`)}`,
		(row) => row.id === created.workspaceId,
		"created workspace",
	);

	created.resourceId = item(
		await request("POST", "/resources", {
			ownerType: "user",
			ownerId: created.userId,
			type: "post",
			title: "Smoke resource",
			excerpt: "Smoke excerpt",
			status: "LISTED",
		}),
		"resource",
	).id;
	await request("PUT", `/resources/${created.resourceId}/post`, {
		body: "Smoke post body",
		bodyHtml: "<p>Smoke post body</p>",
		featuredImage: `https://example.test/${runId}/featured.png`,
	});
	await request("POST", `/resources/${created.resourceId}/authors`, {
		authorType: "user",
		authorId: created.userId,
		role: "author",
	});
	await request("POST", `/links/resource/${created.resourceId}`, {
		name: "canonical",
		url: `https://example.test/${runId}/resource`,
		icon: "link",
		position: 0,
	});
	await assertListHas(
		`/resources?title=${encodeURIComponent("Smoke resource")}`,
		(row) => row.id === created.resourceId,
		"created resource",
	);

	created.collectionId = item(
		await request("POST", "/collections", {
			ownerType: "user",
			ownerId: created.userId,
			name: "Smoke Collection",
			description: "Seeded collection",
			type: "manual",
			status: "LISTED",
		}),
		"collection",
	).id;
	await request("POST", `/collections/${created.collectionId}/items`, {
		itemType: "resource",
		itemId: created.resourceId,
		position: 0,
	});
	await request("PUT", `/collections/${created.collectionId}/filters`, [
		{
			itemType: "resource",
			itemId: created.resourceId,
			engagementAction: "like",
			isVisible: true,
		},
	]);
	await assertListHas(
		`/collections?owner_id=${encodeURIComponent(created.userId)}`,
		(row) => row.id === created.collectionId,
		"created collection",
	);

	created.teamId = item(
		await request("POST", "/teams", {
			name: "Smoke Team",
			ownerId: created.userId,
			organizationId: `${runId}_org`,
		}),
		"team",
	).id;
	await request("POST", `/teams/${created.teamId}/members`, {
		userId: created.userId,
	});
	await assertListHas(
		`/teams?owner_id=${encodeURIComponent(created.userId)}`,
		(row) => row.id === created.teamId,
		"created team",
	);

	created.commentEngagementId = item(
		await request("POST", "/engagements", {
			subjectType: "user",
			subjectId: created.userId,
			action: "comment",
			objectType: "resource",
			objectId: created.resourceId,
			comment: { text: "Smoke comment" },
		}),
		"comment engagement",
	).id;
	created.mentionEngagementId = item(
		await request("POST", "/engagements", {
			subjectType: "workspace",
			subjectId: created.workspaceId,
			action: "mention",
			objectType: "resource",
			objectId: created.resourceId,
			mention: {
				mentionedType: "user",
				mentionedId: created.userId,
			},
		}),
		"mention engagement",
	).id;
	await assertListHas(
		`/engagements?subject_id=${encodeURIComponent(created.userId)}`,
		(row) => row.id === created.commentEngagementId,
		"created engagement",
	);

	await request("POST", "/permission-actions", {
		slug: created.permissionActionSlug,
		name: "Smoke Permission",
		description: "Seeded permission action",
		category: "resource",
	});
	created.permissionId = item(
		await request("POST", "/permissions", {
			subjectType: "user",
			subjectId: created.userId,
			objectType: "resource",
			objectId: created.resourceId,
			action: created.permissionActionSlug,
			value: "allow",
		}),
		"permission",
	).id;
	await assertListHas(
		`/permissions?subject_id=${encodeURIComponent(created.userId)}`,
		(row) => row.id === created.permissionId,
		"created permission",
	);

	await request("POST", "/features", {
		slug: created.featureSlug,
		name: "Smoke Feature",
		description: "Seeded feature",
		category: "admin",
		milestone: 0,
		basePriceCents: 100,
		costOfOperation: 10,
	});
	await request("POST", "/feature-presets", {
		name: created.featurePresetName,
		features: [created.featureSlug],
		description: "Seeded feature preset",
		displayOrder: 1,
	});
	await request("POST", `/users/${created.userId}/features`, {
		featureSlug: created.featureSlug,
		limitValue: 3,
	});
	await assertListHas(
		`/features?name=${encodeURIComponent("Smoke Feature")}`,
		(row) => row.slug === created.featureSlug,
		"created feature",
	);
}

async function cleanup() {
	await optionalDelete(
		`/users/${created.userId}/features/${created.featureSlug}`,
	);
	await optionalDelete(
		`/feature-presets/${encodeURIComponent(created.featurePresetName)}`,
	);
	await optionalDelete(
		`/features/${encodeURIComponent(created.featureSlug)}`,
	);
	if (created.permissionId) {
		await optionalDelete(`/permissions/${created.permissionId}`);
	}
	if (created.permissionActionSlug) {
		await optionalDelete(
			`/permission-actions/${encodeURIComponent(created.permissionActionSlug)}`,
		);
	}
	if (created.commentEngagementId) {
		await optionalDelete(
			`/engagements/${created.commentEngagementId}`,
		);
	}
	if (created.mentionEngagementId) {
		await optionalDelete(
			`/engagements/${created.mentionEngagementId}`,
		);
	}
	if (created.collectionId) {
		await request(
			"PUT",
			`/collections/${created.collectionId}/filters`,
			[],
			{
				statuses: [200, 404],
			},
		).catch((error) => {
			console.error("Collection-filter cleanup failed.");
			console.error(error.message);
		});
		if (created.resourceId) {
			await optionalDelete(
				`/collections/${created.collectionId}/items/resource/${created.resourceId}`,
			);
		}
		await optionalDelete(`/collections/${created.collectionId}`);
	}
	if (created.teamId) {
		await optionalDelete(`/teams/${created.teamId}`);
	}
	if (created.resourceId) {
		await optionalDelete(`/links/resource/${created.resourceId}/0`);
		await optionalDelete(`/resources/${created.resourceId}/post`);
		await optionalDelete(
			`/resources/${created.resourceId}/authors/user/${created.userId}`,
		);
		await optionalDelete(`/resources/${created.resourceId}`);
	}
	if (created.workspaceId) {
		await optionalDelete(
			`/links/workspace/${created.workspaceId}/0`,
		);
		await optionalDelete(`/workspaces/${created.workspaceId}`);
	}
	await optionalDelete(`/users/${created.userId}`);
}

async function main() {
	if (process.argv.includes("--help")) {
		console.log(
			`Usage: pnpm --filter erato test:db:smoke\n\nRuns an HTTP smoke test against an already-running Erato instance. Set ERATO_SMOKE_BASE_URL to override ${baseUrl}. The script provisions a short-lived admin API key in local Wrangler KV, calls Erato over fetch, and cleans up through Erato's HTTP API.`,
		);
		return;
	}

	console.log(
		`Running Erato HTTP smoke test against ${baseUrl} (runId: ${runId})`,
	);
	await assertHealth();
	await provisionApiKey();
	try {
		await exerciseApi();
	} finally {
		try {
			await cleanup();
		} finally {
			await revokeApiKey();
		}
	}
	console.log(
		"Erato HTTP smoke test passed and cleaned up via API calls.",
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
