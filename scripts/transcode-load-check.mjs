#!/usr/bin/env node
/** @format */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const parseArg = (name, fallback) => {
	const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
	if (!direct) return fallback;
	return direct.slice(name.length + 1);
};

const ensure = (value, message) => {
	if (!value) {
		throw new Error(message);
	}
	return value;
};

const percentile = (values, p) => {
	if (values.length === 0) return 0;
	const sorted = [...values].sort((a, b) => a - b);
	const idx = Math.min(
		sorted.length - 1,
		Math.max(0, Math.ceil((p / 100) * sorted.length) - 1),
	);
	return sorted[idx];
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const url = ensure(parseArg("--url"), "Missing --url=https://...");
const apiKey = ensure(parseArg("--api-key"), "Missing --api-key=...");
const filePath = ensure(
	parseArg("--file"),
	"Missing --file=/path/to/audio.flac",
);
const configPath = ensure(
	parseArg("--config"),
	"Missing --config=/path/to/transcode-config.json",
);
const requestCount = Number.parseInt(parseArg("--requests", "5"), 10);
const concurrency = Number.parseInt(parseArg("--concurrency", "1"), 10);
const pollMs = Number.parseInt(parseArg("--poll-ms", "1000"), 10);
const timeoutMs = Number.parseInt(parseArg("--timeout-ms", "900000"), 10);

if (!Number.isFinite(requestCount) || requestCount <= 0) {
	throw new Error("--requests must be a positive integer");
}
if (!Number.isFinite(concurrency) || concurrency <= 0) {
	throw new Error("--concurrency must be a positive integer");
}

const fileData = await readFile(path.resolve(filePath));
const configRaw = await readFile(path.resolve(configPath), "utf8");
const config = JSON.parse(configRaw);

const runOne = async (index) => {
	const startedAt = Date.now();
	const form = new FormData();
	form.append("file", new Blob([fileData]), path.basename(filePath));
	form.append("config", JSON.stringify(config));

	const postStartedAt = Date.now();
	const postRes = await fetch(`${url.replace(/\/$/, "")}/transcode`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
		},
		body: form,
	});
	const postMs = Date.now() - postStartedAt;

	if (!postRes.ok) {
		const body = await postRes.text();
		throw new Error(
			`request ${index} POST failed: ${postRes.status} ${body}`,
		);
	}

	const { jobId } = await postRes.json();
	if (!jobId) {
		throw new Error(`request ${index} did not return jobId`);
	}

	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		await sleep(pollMs);
		const statusRes = await fetch(
			`${url.replace(/\/$/, "")}/transcode/status?jobId=${encodeURIComponent(jobId)}`,
			{
				headers: {
					Authorization: `Bearer ${apiKey}`,
				},
			},
		);
		if (!statusRes.ok) {
			const body = await statusRes.text();
			throw new Error(
				`request ${index} status failed: ${statusRes.status} ${body}`,
			);
		}
		const statusJson = await statusRes.json();
		if (statusJson.status === "complete") {
			return {
				postMs,
				jobMs: Date.now() - startedAt,
			};
		}
		if (statusJson.status === "failed") {
			throw new Error(
				`request ${index} job failed: ${statusJson.error ?? "unknown"}`,
			);
		}
	}

	throw new Error(`request ${index} timed out after ${timeoutMs}ms`);
};

const postTimes = [];
const jobTimes = [];
let completed = 0;
let failed = 0;
let cursor = 0;

const worker = async () => {
	while (cursor < requestCount) {
		const current = cursor;
		cursor += 1;
		try {
			const { postMs, jobMs } = await runOne(current + 1);
			postTimes.push(postMs);
			jobTimes.push(jobMs);
			completed += 1;
			console.log(
				`[ok] ${current + 1}/${requestCount} post=${postMs}ms job=${jobMs}ms`,
			);
		} catch (error) {
			failed += 1;
			console.error(
				`[fail] ${current + 1}/${requestCount} ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}
};

await Promise.all(
	Array.from({ length: Math.min(concurrency, requestCount) }, worker),
);

console.log("\n=== Summary ===");
console.log(`completed=${completed} failed=${failed}`);
if (postTimes.length > 0) {
	console.log(
		`post_ms p50=${percentile(postTimes, 50)} p95=${percentile(postTimes, 95)} p99=${percentile(postTimes, 99)} max=${Math.max(...postTimes)}`,
	);
}
if (jobTimes.length > 0) {
	console.log(
		`job_ms p50=${percentile(jobTimes, 50)} p95=${percentile(jobTimes, 95)} p99=${percentile(jobTimes, 99)} max=${Math.max(...jobTimes)}`,
	);
}

if (failed > 0) {
	process.exitCode = 1;
}
