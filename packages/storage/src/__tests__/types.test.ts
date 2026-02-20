import { describe, it, expect } from 'vitest';
import type { StorageProvider, StorageObject, ListedObject, ListResult } from '../index.ts';

describe('Storage types', () => {
	it('ListResult has expected shape', () => {
		const result: ListResult = {
			objects: [],
			truncated: false
		};
		expect(result.objects).toEqual([]);
		expect(result.truncated).toBe(false);
	});

	it('ListedObject has expected shape', () => {
		const obj: ListedObject = {
			key: 'test/key',
			size: 42,
			uploaded: new Date()
		};
		expect(obj.key).toBe('test/key');
		expect(obj.size).toBe(42);
	});

	it('StorageObject has expected shape', () => {
		const obj: StorageObject = {
			body: new ReadableStream(),
			contentType: 'audio/flac',
			size: 100
		};
		expect(obj.contentType).toBe('audio/flac');
		expect(obj.size).toBe(100);
	});

	// StorageProvider is an interface; we just ensure we can reference it
	it('StorageProvider interface exists', () => {
		const _provider: StorageProvider = {} as StorageProvider;
		expect(_provider).toBeDefined();
	});
});
