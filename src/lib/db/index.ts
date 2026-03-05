import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb() {
    if (dbInstance) return dbInstance;

    dbInstance = drizzle({
        connection: {
            url: process.env.TURSO_DATABASE_URL!,
            authToken: process.env.TURSO_AUTH_TOKEN,
        },
        schema,
    });

    return dbInstance;
}
