const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './client/src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'static/js/[name].[contenthash:8].js',
    publicPath: '/',
    clean: true
  },
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: [
          /node_modules/,
          /public\/js\/weather-map\.js$/,
          /public\/js\/weather-map-fixed\.js$/
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime', '@babel/plugin-syntax-dynamic-import']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false // Désactiver la résolution d'URL pour éviter les erreurs avec les images Leaflet
            },
          }
        ]
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024, // 10kb
          },
        },
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      }
    ]
  },
  plugins: [
    // Une seule instance de HtmlWebpackPlugin
    new HtmlWebpackPlugin({
      template: './client/public/index.html',
      filename: 'index.html',
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
      }
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'client/public', 
          to: '', 
          globOptions: { 
            ignore: ['**/index.html'] 
          } 
        },
        { 
          from: 'client/src/assets', 
          to: 'assets',
          noErrorOnMissing: true
        },
        // Copier les images Leaflet directement
        {
          from: 'node_modules/leaflet/dist/images',
          to: 'images',
          noErrorOnMissing: true
        },
        // Si ces fichiers spécifiques existent, les copier
        {
          from: 'client/public/js/weather-map-fixed.js',
          to: 'js/weather-map.js',
          noErrorOnMissing: true
        },
        {
          from: 'client/public/js/image-fallback.js',
          to: 'js/image-fallback.js',
          noErrorOnMissing: true
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      'components': path.resolve(__dirname, 'client/src/components'),
      'pages': path.resolve(__dirname, 'client/src/pages'),
      'utils': path.resolve(__dirname, 'client/src/utils'),
      'assets': path.resolve(__dirname, 'client/src/assets'),
      'services': path.resolve(__dirname, 'client/src/services'),
      'images': path.resolve(__dirname, 'client/public/images'),
      // Ajouter un alias pour les images Leaflet
      'leaflet/dist/images': path.resolve(__dirname, 'node_modules/leaflet/dist/images')
    }
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      name: false
    },
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`,
    }
  }
};
