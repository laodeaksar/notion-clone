import adapter from '@sveltejs/adapter-auto';
import preprocess from 'svelte-preprocess';

export default {
  preprocess: preprocess({ postcss: true }),
  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    }
  }
};
