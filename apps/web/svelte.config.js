import adapter from '@sveltejs/adapter-auto';

export default {
  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    }
  }
};
