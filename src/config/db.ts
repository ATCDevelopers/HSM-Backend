import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from '../drizzle/schema.js';


dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;


if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {

  throw new Error(
    'Missing required database environment variables (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)'
  );
}

const client = postgres({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  ssl: false,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { client as pgClient };