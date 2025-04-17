/**
 * Configuration webpack simplifiée pour Velo-Altitude
 * Version épurée pour résoudre les problèmes de compatibilité
 * tout en conservant les optimisations essentielles
 */

const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isAnalyze = env && env.analyze;
  
  return {
    // Point d'entrée de l'application
    entry: './src/index.js',
    
    // Configuration de sortie basique
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction 
        ? 'static/js/[name].[contenthash:8].js' 
        : 'static/js/[name].js',
      chunkFilename: isProduction 
        ? 'static/js/[name].[contenthash:8].chunk.js' 
        : 'static/js/[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    
    // Mode de build
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    // Cache filesystem simplifié
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      buildDependencies: {
        config: [__filename]
      }
    },
    
    // Optimisations essentielles
    optimization: {
      usedExports: true,
      providedExports: true,
      sideEffects: true,
      innerGraph: true,
      mangleExports: isProduction ? 'deterministic' : false,
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
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
        new ImageMinimizerPlugin({
          minimizer: {
            implementation: ImageMinimizerPlugin.imageminMinify,
            options: {
              plugins: [
                ['mozjpeg', { quality: 80 }],
                ['pngquant', { quality: [0.65, 0.9], speed: 4 }],
              ],
            },
          },
          generator: [
            {
              preset: 'webp',
              implementation: ImageMinimizerPlugin.imageminGenerate,
              options: {
                plugins: ['imagemin-webp']
              }
            }
          ]
        })
      ],
      // Code splitting de base mais efficace
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: -10
          },
          // Isolation de Three.js (très volumineuse)
          three: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'three',
            chunks: 'all',
            priority: 20
          },
          // Isolation des composants de visualisation
          visualizer: {
            test: /[\\/]src[\\/].*visualization[\\/]/,
            name: 'visualization',
            chunks: 'all',
            priority: 15
          }
        },
      },
      runtimeChunk: 'single',
    },
    
    // Règles de modules simplifiées
    module: {
      rules: [
        // JavaScript/React
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  targets: {
                    browsers: ['last 2 versions']
                  },
                  modules: false
                }],
                '@babel/preset-react',
                '@babel/preset-typescript'
              ],
              plugins: [
                '@babel/plugin-transform-runtime'
              ]
            }
          }
        },
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader'
          ],
        },
        // Images
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024 // 8kb
            }
          }
        },
        // SVG
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
        // Polices
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/fonts/[name].[hash:8][ext]'
          }
        },
        // GLSL Shaders (si utilisés)
        {
          test: /\.(glsl|frag|vert)$/,
          use: ['raw-loader', 'glslify-loader'],
        },
      ],
    },
    
    // Plugins essentiels
    plugins: [
      // HTML template
      new HtmlWebpackPlugin({
        template: './public/index.html',
        minify: isProduction && {
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
      
      // Extraction CSS en production
      isProduction && new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
      
      // Variables d'environnement
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      
      // Polyfills pour Node.js
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
      
      // Copie des assets statiques
      isProduction && new CopyPlugin({
        patterns: [
          { 
            from: 'public', 
            to: '', 
            globOptions: { 
              ignore: ['**/index.html'] 
            } 
          },
          {
            from: 'public/images',
            to: 'static/images',
            noErrorOnMissing: true,
          },
        ],
      }),
      
      // Analyse de bundle (optionnelle)
      isAnalyze && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-analysis.html',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        openAnalyzer: false,
      }),
    ].filter(Boolean),
    
    // Résolution des modules
    resolve: {
      fallback: {
        "http": false,
        "https": false,
        "zlib": false,
        "path": false,
        "fs": false,
        "net": false,
        "stream": false,
        "crypto": false,
        "buffer": false,
        "util": false,
        "url": false,
        "assert": false,
        "events": false
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/components'),
        '@services': path.resolve(__dirname, 'src/services'),
        '@utils': path.resolve(__dirname, 'src/utils'),
      },
    },
    
    // Configuration des performances
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
    
    // Serveur de développement
    devServer: {
      hot: true,
      historyApiFallback: true,
      port: 3000,
      open: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
  };
};
