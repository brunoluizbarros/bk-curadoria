import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_TRUST_HOST: z.string().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_PUBLIC_BASE: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
});

export const env = envSchema.parse(process.env);
