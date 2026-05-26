import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterNode from '@sveltejs/adapter-node';
import adapterVercel from '@sveltejs/adapter-vercel';

function getAdapter() {
  if (process.env.VERCEL) return adapterVercel();
  if (process.env.CF_PAGES) return adapterCloudflare();
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
