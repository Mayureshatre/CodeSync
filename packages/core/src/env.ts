import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')), // some urls might not pass strict URL validation if they have custom protocols
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const webSpecificSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
});

export function validateEnv() {
  if (process.env.NODE_ENV === 'production' && !process.env.SKIP_ENV_VALIDATION) {
    // Validate core infrastructure
    const parsedCore = envSchema.safeParse(process.env);
    if (!parsedCore.success) {
      console.error("❌ Invalid environment variables for core infrastructure:", parsedCore.error.format());
      process.exit(1);
    }

    // Heuristic: If NEXT_RUNTIME is set, or if we're in the web app, validate web-specific vars.
    // The worker does not need NEXTAUTH_* variables to start.
    if (process.env.NEXT_RUNTIME || process.env.NEXTAUTH_URL) {
      const parsedWeb = webSpecificSchema.safeParse(process.env);
      if (!parsedWeb.success) {
        console.error("❌ Invalid environment variables for web application:", parsedWeb.error.format());
        process.exit(1);
      }
    }
  }
}
