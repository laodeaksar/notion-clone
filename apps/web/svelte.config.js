import adapterNode from '@sveltejs/adapter-node';

export default {
  kit: {
    adapter: adapterNode(),
    files: {
      routes: 'src/routes',
      lib:    'src/lib'
    }
  }
};
