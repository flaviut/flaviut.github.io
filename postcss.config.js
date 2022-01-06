module.exports = (ctx) => ({
  map: false,
  plugins: {
    'postcss-import': { root: ctx.file.dirname },
    'postcss-url': { url: 'inline' },
    'autoprefixer': true,
    'cssnano': true,
  },
})
