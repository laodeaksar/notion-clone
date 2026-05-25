import adapter from '@sveltejs/adapter-vercel';

export default {
  kit: {
    adapter: adapter(),
    files: {
      routes: 'src/routes',
      lib: 'src/lib'
    }
  }
};
