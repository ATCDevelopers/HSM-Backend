import { defineConfig } from "drizzle-kit"
import dotenv from 'dotenv'


dotenv.config();

const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

if (!DB_HOST || !DB_PORT || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  throw new Error('Missing required database environment variables');
}

const port = Number(DB_PORT);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be a valid TCP port number');
}

export default defineConfig ({
    schema : "./src/drizzle/schema.ts",
    out : "./src/drizzle/migrations",
    dialect: "postgresql",
    dbCredentials : {
       host: DB_HOST,
       port: DB_PORT ? parseInt(DB_PORT) : 5432,
       user: DB_USER ,
       password: DB_PASSWORD,
       database: DB_NAME,
    },

    verbose : true,
    strict : true ,
})