import jsYaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

function loadSpec(): object {
  try {
    const dir = dirname(fileURLToPath(import.meta.url));
    const yaml = readFileSync(join(dir, '../../openapi.yaml'), 'utf-8');
    return jsYaml.load(yaml) as object;
  } catch {
    return {};
  }
}

export const openapiSpec: object = loadSpec();
