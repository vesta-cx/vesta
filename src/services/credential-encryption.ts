/** @format */

import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	createHash,
} from "node:crypto";

const ENC_VERSION = 1;
const ALGO = "aes-256-gcm";

interface KekStore {
	activeId: string;
	keys: Map<string, Buffer>;
}

interface EncryptedPayload {
	v: number;
	alg: string;
	iv: string;
	tag: string;
	ciphertext: string;
	aadHash: string;
}

interface WrappedDek {
	v: number;
	alg: string;
	iv: string;
	tag: string;
	ciphertext: string;
}

export interface EncryptedCredentialBlob {
	encryptedBlob: string;
	dekWrapped: string;
	kekId: string;
	encryptionVersion: number;
}

const parseKeks = (): KekStore => {
	const configured = process.env["EUTERPE_KEK_KEYS"]?.trim();
	const activeId = process.env["EUTERPE_KEK_ACTIVE_ID"]?.trim() || "local-dev";
	const keys = new Map<string, Buffer>();

	if (configured) {
		for (const rawPair of configured.split(",")) {
			const pair = rawPair.trim();
			if (!pair) continue;
			const [id, base64Value] = pair.split(":");
			if (!id || !base64Value) continue;
			const key = Buffer.from(base64Value, "base64");
			if (key.length === 32) keys.set(id, key);
		}
	}

	if (!keys.has(activeId)) {
		const fallback = process.env["EUTERPE_KEK"]?.trim();
		const key =
			fallback ? Buffer.from(fallback, "base64") : createHash("sha256").update("euterpe-local-dev-kek").digest();
		keys.set(activeId, key.length === 32 ? key : createHash("sha256").update(key).digest());
	}

	return { activeId, keys };
};

const toB64 = (buf: Buffer): string => buf.toString("base64");
const fromB64 = (value: string): Buffer => Buffer.from(value, "base64");

const hashAad = (aad: string): string =>
	createHash("sha256").update(aad, "utf8").digest("hex");

const aesEncrypt = (plaintext: Buffer, key: Buffer, aad: string): EncryptedPayload => {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, key, iv);
	cipher.setAAD(Buffer.from(aad, "utf8"));
	const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
	const tag = cipher.getAuthTag();
	return {
		v: ENC_VERSION,
		alg: ALGO,
		iv: toB64(iv),
		tag: toB64(tag),
		ciphertext: toB64(ciphertext),
		aadHash: hashAad(aad),
	};
};

const aesDecrypt = (
	payload: EncryptedPayload,
	key: Buffer,
	aad: string,
): Buffer => {
	if (payload.aadHash !== hashAad(aad)) {
		throw new Error("AAD mismatch while decrypting credentials");
	}
	const decipher = createDecipheriv(ALGO, key, fromB64(payload.iv));
	decipher.setAAD(Buffer.from(aad, "utf8"));
	decipher.setAuthTag(fromB64(payload.tag));
	return Buffer.concat([
		decipher.update(fromB64(payload.ciphertext)),
		decipher.final(),
	]);
};

const wrapDek = (dek: Buffer, kek: Buffer): WrappedDek => {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGO, kek, iv);
	cipher.setAAD(Buffer.from("dek-wrap-v1", "utf8"));
	const ciphertext = Buffer.concat([cipher.update(dek), cipher.final()]);
	return {
		v: ENC_VERSION,
		alg: ALGO,
		iv: toB64(iv),
		tag: toB64(cipher.getAuthTag()),
		ciphertext: toB64(ciphertext),
	};
};

const unwrapDek = (wrapped: WrappedDek, kek: Buffer): Buffer => {
	const decipher = createDecipheriv(ALGO, kek, fromB64(wrapped.iv));
	decipher.setAAD(Buffer.from("dek-wrap-v1", "utf8"));
	decipher.setAuthTag(fromB64(wrapped.tag));
	return Buffer.concat([
		decipher.update(fromB64(wrapped.ciphertext)),
		decipher.final(),
	]);
};

export const encryptCredentials = (
	plaintextJson: string,
	aad: string,
): EncryptedCredentialBlob => {
	const keks = parseKeks();
	const kek = keks.keys.get(keks.activeId);
	if (!kek) throw new Error("No active KEK configured");
	const dek = randomBytes(32);
	const encryptedBlob = aesEncrypt(Buffer.from(plaintextJson, "utf8"), dek, aad);
	const dekWrapped = wrapDek(dek, kek);
	return {
		encryptedBlob: JSON.stringify(encryptedBlob),
		dekWrapped: JSON.stringify(dekWrapped),
		kekId: keks.activeId,
		encryptionVersion: ENC_VERSION,
	};
};

export const decryptCredentials = (
	blob: EncryptedCredentialBlob,
	aad: string,
): string => {
	const keks = parseKeks();
	const kek = keks.keys.get(blob.kekId);
	if (!kek) throw new Error(`Unknown KEK id: ${blob.kekId}`);
	const wrapped = JSON.parse(blob.dekWrapped) as WrappedDek;
	const encrypted = JSON.parse(blob.encryptedBlob) as EncryptedPayload;
	const dek = unwrapDek(wrapped, kek);
	const plaintext = aesDecrypt(encrypted, dek, aad);
	return plaintext.toString("utf8");
};
