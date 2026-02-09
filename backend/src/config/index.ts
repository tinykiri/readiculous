import { config } from "dotenv";
import { z } from "zod";

config({ path: `.env` });

if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-project-id')) {
  console.error('ERROR: Missing or invalid SUPABASE_URL in .env file');
  process.exit(1);
}

if (!process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY.includes('your_supabase')) {
  console.error('ERROR: Missing or invalid SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("4040"),
  ORIGIN: z.string().url().optional(),
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  ORIGIN: process.env.ORIGIN,
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
});

export const { NODE_ENV, PORT, ORIGIN, DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = env;