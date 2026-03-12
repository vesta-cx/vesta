import { writable } from 'svelte/store';

export type UploadProgressState =
	| { type: 'uploading'; pct: number }
	| { type: 'uploading'; current: number; total: number }
	| { type: 'transcoding'; jobId: string }
	| { type: 'transcoding'; current: number; total: number; jobIds: string[] }
	| { type: 'complete' }
	| null;

export const uploadProgress = writable<UploadProgressState>(null);
