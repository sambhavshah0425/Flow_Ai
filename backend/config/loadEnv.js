/**
 * Loads environment variables from .env before anything else runs.
 *
 * This file must be the FIRST import in server.js. ES module imports are
 * hoisted and execute before any code in the importing file's body, so
 * calling dotenv.config() inside server.js itself (after other imports)
 * is too late — modules like config/security.js would already have read
 * process.env by the time dotenv.config() ran. Importing this file first
 * guarantees env vars are loaded before any other module's top-level code
 * executes.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve .env relative to THIS file (backend/config/loadEnv.js -> backend/.env),
// not process.cwd(). Otherwise the key silently fails to load when the server is
// started from the repo root (e.g. `npm run dev:backend`), silently falling back to dev-only secrets.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });