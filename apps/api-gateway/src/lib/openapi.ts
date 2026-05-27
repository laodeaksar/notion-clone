import jsYaml from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

function loadSpec(): object {
  try {
    // Node.js (tsx): read yaml file from disk via fs
    const __filename = fileURLToPath(import.meta.url);
    const __dir = dirname(__filename);
    const content = readFileSync(join(__dir, '../../openapi.yaml'), 'utf-8');
    return (jsYaml.load(content) as object) ?? {};
  } catch {
    // CF Workers (wrangler bundle): yaml is bundled as text module — return empty and
    // let wrangler's bundled version of this file handle it at deploy time.
    return {};
  }
}

export const openapiSpec: object = loadSpec();
