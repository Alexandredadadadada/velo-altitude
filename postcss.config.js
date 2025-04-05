module.exports = {
  plugins: [
    require('autoprefixer'),
    process.env.NODE_ENV === 'production' && require('@fullhuman/postcss-purgecss')({
      content: [
        './src/**/*.js',
        './src/**/*.jsx',
        './public/index.html'
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [/^col-/, /^row-/, /^fade-/, /^slide-/],
        deep: [/tooltip/, /modal/, /dropdown/],
        greedy: [/Chart/, /recharts/]
      }
    })
  ].filter(Boolean)
};
