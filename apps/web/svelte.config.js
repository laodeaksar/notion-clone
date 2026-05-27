import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';

function getAdapter() {
  if (process.env.CF_PAGES) return adapterCloudflare();
  if (process.env.VERCEL)   return adapterVercel();
  return adapterNode();
}

export default {
  kit: {
    adapter: getAdapter(),
    files: {
      routes: 'src/routes',
      lib:    'src/lib'
    }
  }
};
