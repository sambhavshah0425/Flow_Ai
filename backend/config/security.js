/**
 * Centralized security configuration.
 *
 * In production, JWT_SECRET and ENCRYPTION_KEY MUST be set via environment
 * variables. The app will refuse to boot without them, rather than silently
 * falling back to a publicly-known default that anyone reading this repo
 * could use to forge tokens or decrypt stored secrets.
 *
 * In development, a fallback is allowed for convenience, but a loud warning
 * is printed so it's never mistaken for a "safe default."
 */

const isProduction = process.env.NODE_ENV === 'production';

// Fallbacks are ONLY for local development convenience.
const DEV_JWT_SECRET = 'flowforge_super_secret_jwt_key_2026';
const DEV_ENCRYPTION_KEY_HEX = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function requireEnvOrFallback(envKey, devFallback) {
  const value = process.env[envKey];

  if (value && value.trim().length > 0) {
    return value;
  }

  if (isProduction) {
    throw new Error(
      `[Security] Missing required environment variable "${envKey}". ` +
      `Refusing to start in production with an insecure default. ` +
      `Set ${envKey} in your environment (e.g. .env) before starting the server.`
    );
  }

  console.warn(
    `[Security] WARNING: ${envKey} is not set. Using an insecure development-only default. ` +
    `This is NOT safe for production. Set ${envKey} in your .env file.`
  );
  return devFallback;
}

export const JWT_SECRET = requireEnvOrFallback('JWT_SECRET', DEV_JWT_SECRET);
export const ENCRYPTION_KEY_HEX = requireEnvOrFallback('ENCRYPTION_KEY', DEV_ENCRYPTION_KEY_HEX);