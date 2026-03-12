import { R2StorageProvider } from '@vesta-cx/storage/r2-workers';
import type { StorageProvider } from '@vesta-cx/storage';

export type { ListedObject, ListResult, StorageObject, StorageProvider } from '@vesta-cx/storage';

export const getStorage = (platform: App.Platform): StorageProvider =>
	new R2StorageProvider(platform.env.AUDIO_BUCKET);
