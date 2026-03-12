/** @format */

import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("cleanrc schema", () => {
	it("is valid JSON with expected top-level keys", () => {
		const schemaPath = path.join(
			__dirname,
			"..",
			"schema",
			"cleanrc.schema.json",
		);
		const schema = JSON.parse(
			readFileSync(schemaPath, "utf-8"),
		) as Record<string, unknown>;
		const properties = schema.properties as
			| Record<string, unknown>
			| undefined;

		expect(schema.type).toBe("object");
		expect(properties).toBeDefined();
		expect(properties?.include).toBeDefined();
		expect(properties?.exclude).toBeDefined();
		expect(properties?.commands).toBeDefined();
	});
});
