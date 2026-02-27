/** @format */

import { describe, expect, it } from "vitest";
import { resolveTargetOutput } from "../transcode.js";

describe("target output naming defaults", () => {
	it("uses codec-based defaults when omitted", () => {
		const resolved = resolveTargetOutput({ codec: "opus", bitrate: 128 });
		expect(resolved.targetPrefix).toBe("opus/");
		expect(resolved.filenamePrefix).toBe("");
		expect(resolved.suffix).toBe("_opus_128");
	});

	it("uses caller-provided prefix and suffix", () => {
		const resolved = resolveTargetOutput({
			codec: "aac",
			bitrate: 192,
			outputPrefix: "mobile/streaming/stream_",
			outputSuffix: "_mobile",
		});
		expect(resolved.targetPrefix).toBe("mobile/streaming/");
		expect(resolved.filenamePrefix).toBe("stream_");
		expect(resolved.suffix).toBe("_mobile");
	});
});
