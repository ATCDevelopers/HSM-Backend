import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../drizzle/schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/hms';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
