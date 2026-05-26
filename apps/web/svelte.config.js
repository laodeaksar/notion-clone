import adapterCloudflare from '@sveltejs/adapter-cloudflare';
import adapterNode from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: process.env.CF_PAGES ? adapterCloudflare() : adapterNode(),
    files: {
      routes: 'src/routes',
      lib:    'src/lib'
    }
  }
};
