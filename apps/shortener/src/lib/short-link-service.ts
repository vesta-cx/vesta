/** @format */

import { z } from "zod";

export const DEFAULT_RESERVED_SLUGS = new Set([
	"health",
	"favicon.ico",
	"robots.txt",
	"sitemap.xml",
]);

const slugPattern = /^[a-z0-9](?:[a-z0-9-]{0,62})$/;

export const shortLinkRecordSchema = z.object({
	destinationUrl: z.string().url(),
	targetType: z.enum(["url", "resource", "release", "workspace"]),
	targetId: z.string().min(1).nullable().optional(),
	workspaceSlug: z.string().min(1).nullable().optional(),
	updatedAt: z.string().datetime(),
});

export type ShortLinkRecord = z.infer<typeof shortLinkRecordSchema>;

export type ResolveShortLinkResult =
	| {
			type: "redirect";
			slug: string;
			location: string;
			record: ShortLinkRecord;
	  }
	| {
			type: "not_found";
			slug: string;
			reason:
				| "invalid_slug"
				| "reserved_slug"
				| "missing"
				| "invalid_record"
				| "invalid_destination";
			details?: string;
	  };

type ResolveShortLinkArgs = {
	slug: string;
	kv: KVNamespace;
	requestUrl: string | URL;
	canonicalOrigin: string;
	reservedSlugs?: Set<string>;
};

const normalizeRawSlug = (slug: string) => slug.trim().toLowerCase();

export const normalizeSlug = (slug: string): string | null => {
	const normalized = normalizeRawSlug(slug);
	return slugPattern.test(normalized) ? normalized : null;
};

export const parseShortLinkRecord = (
	rawValue: string,
):
	| { success: true; data: ShortLinkRecord }
	| { success: false; error: string } => {
	try {
		const parsed = JSON.parse(rawValue) as unknown;
		const result = shortLinkRecordSchema.safeParse(parsed);
		if (!result.success) {
			return {
				success: false,
				error: result.error.issues
					.map((issue) => issue.message)
					.join("; "),
			};
		}

		return { success: true, data: result.data };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Invalid JSON value",
		};
	}
};

export const buildRedirectLocation = (
	record: ShortLinkRecord,
	requestUrl: string | URL,
	canonicalOrigin: string,
): { success: true; location: string } | { success: false; error: string } => {
	let canonical: URL;
	try {
		canonical = new URL(canonicalOrigin);
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Canonical origin URL is invalid",
		};
	}
	const request = new URL(requestUrl);

	let destination: URL;
	try {
		destination = new URL(record.destinationUrl);
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error ?
					error.message
				:	"Destination URL is invalid",
		};
	}

	if (destination.origin !== canonical.origin) {
		return {
			success: false,
			error: "Destination must stay on the canonical Vesta origin",
		};
	}

	for (const [key, value] of request.searchParams.entries()) {
		destination.searchParams.append(key, value);
	}

	return { success: true, location: destination.toString() };
};

export const resolveShortLink = async ({
	slug,
	kv,
	requestUrl,
	canonicalOrigin,
	reservedSlugs = DEFAULT_RESERVED_SLUGS,
}: ResolveShortLinkArgs): Promise<ResolveShortLinkResult> => {
	const rawSlug = normalizeRawSlug(slug);
	if (reservedSlugs.has(rawSlug)) {
		return {
			type: "not_found",
			slug: rawSlug,
			reason: "reserved_slug",
		};
	}

	const normalizedSlug = normalizeSlug(slug);
	if (!normalizedSlug) {
		return {
			type: "not_found",
			slug: rawSlug,
			reason: "invalid_slug",
		};
	}

	const rawValue = await kv.get(normalizedSlug);
	if (!rawValue) {
		return {
			type: "not_found",
			slug: normalizedSlug,
			reason: "missing",
		};
	}

	const record = parseShortLinkRecord(rawValue);
	if (!record.success) {
		return {
			type: "not_found",
			slug: normalizedSlug,
			reason: "invalid_record",
			details: record.error,
		};
	}

	const location = buildRedirectLocation(
		record.data,
		requestUrl,
		canonicalOrigin,
	);
	if (!location.success) {
		return {
			type: "not_found",
			slug: normalizedSlug,
			reason: "invalid_destination",
			details: location.error,
		};
	}

	return {
		type: "redirect",
		slug: normalizedSlug,
		location: location.location,
		record: record.data,
	};
};
