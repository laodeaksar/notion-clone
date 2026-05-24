import jsYaml from 'js-yaml';
// Bundled as a Text module by wrangler (see [[rules]] in wrangler.toml).
// TypeScript declaration: src/types/yaml.d.ts
import openapiYaml from '../../openapi.yaml';

export const openapiSpec: object =
  (jsYaml.load(openapiYaml as string) as object) ?? {};
