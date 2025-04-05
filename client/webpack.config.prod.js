/**
 * Configuration Webpack optimisée pour la production
 * Dashboard-Velo.com
 */

const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const webpack = require('webpack');

// Chemin vers les sources
const SRC_DIR = path.resolve(__dirname, 'src');
// Chemin vers la sortie
const OUTPUT_DIR = path.resolve(__dirname, 'dist');

module.exports = {
  mode: 'production',
  
  // Points d'entrée de l'application
  entry: {
    main: path.resolve(SRC_DIR, 'index.js'),
    dashboard: path.resolve(SRC_DIR, 'pages/Dashboard/index.js'),
    training: path.resolve(SRC_DIR, 'pages/Training/index.js'),
    nutrition: path.resolve(SRC_DIR, 'pages/Nutrition/index.js'),
    cols: path.resolve(SRC_DIR, 'pages/Cols/index.js'),
    profile: path.resolve(SRC_DIR, 'pages/Profile/index.js'),
  },
  
  // Configuration de sortie
  output: {
    path: OUTPUT_DIR,
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
    publicPath: '/',
    clean: true,
    // Point d'importation pour le chargement des assets
    assetModuleFilename: 'static/media/[name].[hash][ext]',
  },
  
  // Configuration des optimisations
  optimization: {
    minimize: true,
    minimizer: [
      // Minification JavaScript
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8,
          },
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
        extractComments: false,
      }),
      // Minification CSS
      new CssMinimizerPlugin(),
    ],
    // Split des chunks pour optimiser le chargement
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 20000,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // Récupérer le nom du package
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // Formater le nom (éviter les caractères spéciaux)
            return `vendor.${packageName.replace('@', '')}`;
          },
        },
        // Regroupement des styles
        styles: {
          name: 'styles',
          test: /\.css$/,
          chunks: 'all',
          enforce: true,
        },
        // Chunk pour les modèles 3D
        models: {
          test: /\.(gltf|glb|obj|fbx)$/,
          name: 'models',
          chunks: 'async',
          priority: 10,
        },
        // Chunk pour les traductions
        translations: {
          test: /[\\/]locales[\\/]/,
          name: 'translations',
          chunks: 'async',
          priority: 10,
        },
      },
    },
    // Extraction du runtime pour améliorer le cache
    runtimeChunk: 'single',
  },
  
  // Résolution des modules
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': SRC_DIR,
      '@components': path.resolve(SRC_DIR, 'components'),
      '@pages': path.resolve(SRC_DIR, 'pages'),
      '@utils': path.resolve(SRC_DIR, 'utils'),
      '@services': path.resolve(SRC_DIR, 'services'),
      '@contexts': path.resolve(SRC_DIR, 'contexts'),
      '@hooks': path.resolve(SRC_DIR, 'hooks'),
      '@assets': path.resolve(SRC_DIR, 'assets'),
    },
    // Forcer le chargement des versions ES module si disponibles
    mainFields: ['browser', 'module', 'main'],
  },
  
  // Règles pour les modules
  module: {
    rules: [
      // Règles pour JavaScript/React
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                useBuiltIns: 'usage',
                corejs: 3,
                modules: false,
                targets: {
                  browsers: [
                    'last 2 Chrome versions',
                    'last 2 Firefox versions',
                    'last 2 Safari versions',
                    'last 2 Edge versions',
                    'not IE 11',
                    'iOS >= 12',
                    'Android >= 7'
                  ]
                }
              }],
              '@babel/preset-react'
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-optional-chaining',
              '@babel/plugin-proposal-nullish-coalescing-operator'
            ],
            // Cacher les résultats pour les builds suivants
            cacheDirectory: true,
            cacheCompression: false,
            compact: true,
          },
        },
      },
      // Règles pour CSS
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              sourceMap: false,
              importLoaders: 1,
              modules: {
                auto: true,
                localIdentName: '[hash:base64:8]',
              },
            },
          },
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  'postcss-flexbugs-fixes',
                  [
                    'postcss-preset-env',
                    {
                      autoprefixer: {
                        flexbox: 'no-2009',
                      },
                      stage: 3,
                    },
                  ],
                  'postcss-normalize',
                ],
              },
              sourceMap: false,
            },
          },
        ],
        // Sideeffects permet de préserver le CSS lors du tree shaking
        sideEffects: true,
      },
      // Règles pour les images
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb - en dessous, conversion en base64
          },
        },
        generator: {
          filename: 'static/media/images/[name].[hash:8][ext]',
        },
        use: [
          {
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: {
                progressive: true,
                quality: 80
              },
              optipng: {
                enabled: true,
                optimizationLevel: 5
              },
              pngquant: {
                quality: [0.65, 0.90],
                speed: 4
              },
              gifsicle: {
                interlaced: false,
              },
              webp: {
                quality: 80
              }
            }
          }
        ]
      },
      // Règles pour les polices
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/fonts/[name].[hash:8][ext]',
        },
      },
      // Règles pour les fichiers vidéo
      {
        test: /\.(mp4|webm|ogg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/videos/[name].[hash:8][ext]',
        },
      },
      // Règles pour les modèles 3D
      {
        test: /\.(gltf|glb|obj|fbx)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/models/[name].[hash:8][ext]',
        },
      },
    ],
  },
  
  // Plugins
  plugins: [
    // Nettoyage du dossier de sortie
    new CleanWebpackPlugin(),
    
    // Extraction du CSS
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[contenthash:8].css',
      chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
    }),
    
    // Génération du HTML avec les assets
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      inject: true,
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
    
    // Inline des scripts critiques
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
    
    // Manifeste des assets
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
    }),
    
    // Compression gzip
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    
    // Compression Brotli (plus efficace que gzip)
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      compressionOptions: { level: 11 },
      threshold: 10240,
      minRatio: 0.8,
    }),
    
    // Copie des fichiers statiques
    new CopyPlugin({
      patterns: [
        { 
          from: 'public',
          to: OUTPUT_DIR,
          globOptions: {
            ignore: ['**/index.html'], // Déjà traité par HtmlWebpackPlugin
          },
        },
      ],
    }),
    
    // Variables d'environnement
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.PUBLIC_URL': JSON.stringify(''),
    }),
    
    // Analyseur de bundle (désactivé par défaut, activé avec --analyze)
    process.env.ANALYZE && new BundleAnalyzerPlugin(),
  ].filter(Boolean),
  
  // Performance hints
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
};
