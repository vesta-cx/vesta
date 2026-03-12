import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export const getDb = (platform: App.Platform) => drizzle(platform.env.DB, { schema });

export type Database = ReturnType<typeof getDb>;
