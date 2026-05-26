import adapter from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    }
  }
};
