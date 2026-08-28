import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import * as schema from '../drizzle/schema.js';

const envPath = fs.existsSync(path.resolve(process.cwd(), 'src/.env'))
  ? path.resolve(process.cwd(), 'src/.env')
  : path.resolve(process.cwd(), '../.env');

dotenv.config({ path: envPath });

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT) || 5432;
const user = process.env.DB_USER || 'postgres';
const password = process.env.DB_PASSWORD || 'codaka2002@';
const database = process.env.DB_NAME || 'HMS';

const client = postgres({
  host,
  port,
  user,
  password,
  database,
  ssl: false,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export { client as pgClient };




