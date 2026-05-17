import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

execSync(
  'pnpm openapi-typescript http://localhost:8000/openapi.json -o app/shared/types/schema.ts',
  { stdio: 'inherit', cwd: root }
);
