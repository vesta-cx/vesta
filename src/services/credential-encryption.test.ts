/** @format */

import { beforeEach, describe, expect, it } from "vitest";
import {
	decryptCredentials,
	encryptCredentials,
} from "./credential-encryption.js";

describe("credential encryption", () => {
	beforeEach(() => {
		process.env["EUTERPE_KEK_ACTIVE_ID"] = "test";
		process.env["EUTERPE_KEK_KEYS"] =
			"test:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
	});

	it("round trips encrypted credentials with matching aad", () => {
		const aad = "job-1:requester:1";
		const plaintext = JSON.stringify({
			accessKeyId: "AKIA",
			secretAccessKey: "SECRET",
		});
		const encrypted = encryptCredentials(plaintext, aad);
		const decrypted = decryptCredentials(
			{
				encryptedBlob: encrypted.encryptedBlob,
				dekWrapped: encrypted.dekWrapped,
				kekId: encrypted.kekId,
				encryptionVersion: encrypted.encryptionVersion,
			},
			aad,
		);
		expect(decrypted).toBe(plaintext);
	});

	it("rejects decrypt with mismatched aad", () => {
		const encrypted = encryptCredentials(
			JSON.stringify({ a: 1 }),
			"job-2:req:1",
		);
		expect(() => {
			decryptCredentials(
				{
					encryptedBlob: encrypted.encryptedBlob,
					dekWrapped: encrypted.dekWrapped,
					kekId: encrypted.kekId,
					encryptionVersion: encrypted.encryptionVersion,
				},
				"job-2:req:2",
			);
		}).toThrow();
	});
});
