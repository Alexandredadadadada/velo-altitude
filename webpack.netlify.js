const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

// Configuration webpack optimisée pour Netlify avec prise en charge de la structure hybride
module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
          },
          mangle: {
            safari10: true,
          },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
    runtimeChunk: 'single',
  },
  module: {
    rules: [
      // JavaScript et React
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: [
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-runtime'
            ],
            cacheDirectory: true,
          },
        },
      },
      // TypeScript
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
          }
        }
      },
      // CSS
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ],
      },
      // Images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb
          },
        },
      },
      // SVG
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      // Fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
      // Shaders (pour les visualisations 3D)
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: ['raw-loader', 'glslify-loader'],
      },
      // JSON
      {
        test: /\.json$/,
        type: 'javascript/auto',
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'public', 
          to: '', 
          globOptions: { 
            ignore: ['**/index.html'] 
          } 
        },
      ],
    }),
    // Alias pour les modules manquants
    new webpack.NormalModuleReplacementPlugin(
      /^rxjs$/,
      path.resolve(__dirname, 'src/utils/polyfills.js')
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^@material-ui\/lab$/,
      function(resource) {
        if (resource.request === '@material-ui/lab') {
          resource.request = path.resolve(__dirname, 'src/utils/polyfills.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^react-markdown$/,
      function(resource) {
        if (resource.request === 'react-markdown') {
          resource.request = path.resolve(__dirname, 'src/utils/polyfills.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^rehype-highlight$/,
      function(resource) {
        if (resource.request === 'rehype-highlight') {
          resource.request = path.resolve(__dirname, 'src/utils/polyfills.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^remark-gfm$/,
      function(resource) {
        if (resource.request === 'remark-gfm') {
          resource.request = path.resolve(__dirname, 'src/utils/polyfills.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^react-redux$/,
      function(resource) {
        if (resource.request === 'react-redux') {
          resource.request = path.resolve(__dirname, 'src/utils/polyfills.js');
        }
      }
    ),
    new webpack.NormalModuleReplacementPlugin(
      /^highlight\.js\/styles\/github\.css$/,
      function(resource) {
        if (resource.request === 'highlight.js/styles/github.css') {
          resource.request = '';
        }
      }
    ),
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // Résolution des imports entre client/src et src
      '@': path.resolve(__dirname, 'src'),
      '@client': path.resolve(__dirname, 'client/src'),
      '@server': path.resolve(__dirname, 'server'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@config': path.resolve(__dirname, 'src/config'),
      // Alias pour les modules manquants
      'rxjs': path.resolve(__dirname, 'src/utils/polyfills.js'),
      'react-markdown': path.resolve(__dirname, 'src/utils/polyfills.js'),
      'rehype-highlight': path.resolve(__dirname, 'src/utils/polyfills.js'),
      'remark-gfm': path.resolve(__dirname, 'src/utils/polyfills.js'),
      'react-redux': path.resolve(__dirname, 'src/utils/polyfills.js'),
      'highlight.js/styles/github.css': path.resolve(__dirname, 'src/utils/polyfills.js'),
      '@material-ui/lab': path.resolve(__dirname, 'src/utils/polyfills.js'),
    },
  },
};
