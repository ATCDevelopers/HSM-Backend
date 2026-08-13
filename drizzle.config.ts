import { defineConfig } from "drizzle-kit";
import "dotenv/config"; 

export default defineConfig({
  schema: "./src/drizzle/schema.ts",
  out: "./src/models/migrations",
  dialect: "postgresql",
  dbCredentials: {
  
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "codaka2002@",
    database: process.env.DB_NAME || "HMS",
    ssl: false,
  },
  verbose: true,
  strict: true,
});
