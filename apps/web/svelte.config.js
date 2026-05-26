import adapter from '@sveltejs/adapter-auto';

// adapter-auto detects the build environment:
//   - Cloudflare Pages (CF_PAGES=1)  → @sveltejs/adapter-cloudflare
//   - Node.js / Replit autoscale      → @sveltejs/adapter-node
// This single config works for both targets without modification.
export default {
  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    }
  }
};
