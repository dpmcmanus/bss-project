import "dotenv/config"

import { defineConfig } from 'drizzle-kit';

const url = process.env.DATABASE_URL
if (!url)
  throw new Error(
    `Connection string to ${process.env.NODE_ENV ? 'Neon' : 'local'} Postgres not found.`
  );
export default defineConfig({
  out: './database/migrations',
  schema: './database/schema/*',
  dialect: 'postgresql',
  dbCredentials: { url: "postgresql://neondb_owner:npg_G8TgWo3AQSVI@ep-nameless-band-a5ss60pt.us-east-2.aws.neon.tech/neondb?sslmode=require" },
});