/**
 * Configuration webpack optimisée pour le déploiement Netlify
 * Implémente les optimisations de performance pour Velo-Altitude
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { ModuleFederationPlugin } = webpack.container;
const WorkboxPlugin = require('workbox-webpack-plugin');
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: (pathData) => {
      return pathData.chunk.name === 'main' 
        ? 'static/js/[name].[contenthash:8].js'
        : 'static/js/chunks/[name].[contenthash:8].chunk.js';
    },
    chunkFilename: 'static/js/chunks/[name].[chunkhash:8].chunk.js',
    assetModuleFilename: 'static/assets/[hash][ext][query]',
    publicPath: '/',
    clean: true,
  },
  // Configuration du cache filesystem
  cache: {
    type: 'filesystem',
    version: '1.0',
    cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
    store: 'pack',
    buildDependencies: {
      config: [__filename],
    }
  },
  // Optimisations avancées
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: { ecma: 2020 },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: true,
            pure_funcs: ['console.log', 'console.info'],
            passes: 3,
          },
          mangle: { safari10: true },
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
        parallel: true,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 40000,
      maxSize: 244000,
      cacheGroups: {
        // three: {
        //   test: /[\\/]node_modules[\\/]three[\\/]/,
        //   name: 'three',
        //   priority: 20,
        //   enforce: true,
        //   reuseExistingChunk: true,
        // },
        mui: {
          test: /[\\/]node_modules[\\/](@mui|@material-ui)[\\/]/,
          name: 'material-ui',
          priority: 15,
          enforce: true,
          reuseExistingChunk: true,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          priority: 10,
          enforce: true,
          reuseExistingChunk: true,
        },
        charts: {
          test: /[\\/]node_modules[\\/](chart\.js|recharts|d3)[\\/]/,
          name: 'charts',
          priority: 8,
          enforce: true,
        },
        // Optimisation spécifique pour la visualisation 3D
        visualization: {
          test: /[\\/]src[\\/](components|visualization)[\\/].*Col.*[\\/]/,
          name: 'visualization',
          chunks: 'all',
          priority: 25,
          enforce: true
        },
        // Optimisation des effets météo
        weather: {
          test: /[\\/]src[\\/](components|weather)[\\/].*Weather.*[\\/]/,
          name: 'weather-effects',
          chunks: 'all',
          priority: 22,
          enforce: true
        },
        commons: {
          name: 'commons',
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    usedExports: true,
    sideEffects: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { modules: false }],
              '@babel/preset-react',
              '@babel/preset-typescript'
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
            ].filter(Boolean),
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
      },
      {
        test: /\.js$/,
        include: /node_modules/,
        sideEffects: false,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[hash:base64]',
              },
            },
          },
        ],
      },
      {
        test: /\.(glsl|vert|frag)$/,
        use: ['raw-loader', 'glslify-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'static/media/[name].[hash:8][ext]'
        }
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name].[hash:8][ext]'
        }
      },
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
    // Préchargement des ressources critiques
    new PreloadWebpackPlugin({
      rel: 'preload',
      include: 'initial',
      fileBlacklist: [/\.map$/, /hot-update\.js$/]
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
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
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    // Module Federation (facultatif)
    new ModuleFederationPlugin({
      name: 'velo_altitude',
      filename: 'remoteEntry.js',
      exposes: {
        './ColViewer': './src/components/ColViewer',
        './WeatherWidget': './src/components/WeatherWidget',
      },
      shared: {
        three: {
          singleton: true,
          requiredVersion: '0.161.0',
          strictVersion: false,
          import: 'three',
          shareScope: 'default',
          eager: false
        },
        '@react-three/fiber': {
          singleton: true,
          requiredVersion: '^8.18.0',
          import: '@react-three/fiber',
          shareScope: 'default'
        },
        '@react-three/drei': {
          singleton: true,
          requiredVersion: '^9.122.0',
          import: '@react-three/drei',
          shareScope: 'default'
        },
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' }
      },
    }),
    // Service Worker pour mise en cache
    new WorkboxPlugin.GenerateSW({
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      runtimeCaching: [{
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60 // 30 jours
          }
        }
      }, {
        // Mise en cache des données météo
        urlPattern: /\/api\/weather\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'weather-data',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 // 1 heure
          }
        }
      }, {
        // Mise en cache des données de cols
        urlPattern: /\/api\/cols\//,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'cols-data',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 24 * 60 * 60 // 1 jour
          }
        }
      }]
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@contexts': path.resolve(__dirname, 'src/contexts'),
      '@assets': path.resolve(__dirname, 'public/assets'),
      'three/examples/jsm/': path.resolve(__dirname, 'node_modules/three/examples/jsm/'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    fallback: {
      crypto: false,
      stream: false,
      path: false,
      fs: false,
    },
    conditionNames: ['import', 'require', 'node', 'default'],
    exportsFields: ['exports', 'module']
  },
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
