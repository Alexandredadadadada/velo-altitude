const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.js',
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
              url: {
                filter: (url) => {
                  if (url.startsWith('/images/')) {
                    return false;
                  }
                  return true;
                },
              },
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
      template: './public/index.html',
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
          from: 'public', 
          to: '', 
          globOptions: { 
            ignore: ['**/index.html'] 
          } 
        },
        { 
          from: 'client/public', 
          to: '', 
          globOptions: { 
            ignore: ['**/index.html'] 
          } 
        },
        { from: 'src/assets', to: 'assets' },
        // Copier notre version corrigée de weather-map.js
        {
          from: 'public/js/weather-map-fixed.js',
          to: 'js/weather-map.js',
        },
        // Conserver le script de fallback d'images qui est crucial
        {
          from: 'client/public/js/image-fallback.js',
          to: 'js/image-fallback.js',
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'pages': path.resolve(__dirname, 'src/pages'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'assets': path.resolve(__dirname, 'src/assets'),
      'services': path.resolve(__dirname, 'src/services'),
      'images': path.resolve(__dirname, 'public/images'),
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
