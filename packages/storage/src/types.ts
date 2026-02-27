/** @format */

export interface StorageObject {
	body: ReadableStream;
	contentType: string;
	size: number;
}

export interface ListedObject {
	key: string;
	size: number;
	uploaded: Date;
}

export interface ListResult {
	objects: ListedObject[];
	truncated: boolean;
	cursor?: string;
}

export interface StorageProvider {
	put(
		key: string,
		body: ReadableStream | ArrayBuffer | string,
		contentType: string,
	): Promise<void>;
	get(key: string): Promise<StorageObject | null>;
	getSignedUrl(key: string, expiresIn: number): Promise<string>;
	delete(key: string): Promise<void>;
	list(options?: {
		prefix?: string;
		limit?: number;
		cursor?: string;
	}): Promise<ListResult>;
}
