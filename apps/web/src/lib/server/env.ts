/**
 * Reads an environment variable from platform.env (Cloudflare Pages runtime)
 * with a fallback to process.env (Node.js / Replit).
 */
export function getEnv(platform: App.Platform | undefined, key: string): string {
  return (platform?.env as Record<string, string> | undefined)?.[key]
    ?? process.env[key]
    ?? '';
}
