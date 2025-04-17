const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const isAnalyze = env && env.analyze;

  return {
    entry: './src/index.js',
    
    // 1. Configuration de sortie optimisée
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: (pathData) => {
        return pathData.chunk.name === 'main' 
          ? 'static/js/[name].[contenthash:8].js'
          : 'static/js/chunks/[name].[contenthash:8].chunk.js';
      },
      chunkFilename: 'static/js/chunks/[name].[chunkhash:8].chunk.js',
      assetModuleFilename: 'static/assets/[hash][ext][query]',
      clean: true,
      publicPath: '/',
    },

    // 2. Configuration du cache filesystem
    cache: {
      type: 'filesystem',
      version: '1.0',
      cacheDirectory: path.resolve(__dirname, '.webpack-cache'),
      store: 'pack',
      buildDependencies: {
        config: [__filename],
        tsconfig: [path.resolve(__dirname, 'tsconfig.json')],
        packageJson: [path.resolve(__dirname, 'package.json')]
      },
      compression: 'brotli',
    },

    // 3. Optimisations avancées
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 2020 },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
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
          three: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'three',
            priority: 20,
            enforce: true,
            reuseExistingChunk: true,
          },
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
          glsl: {
            test: /\.(glsl|vert|frag)$/,
            name: 'shaders',
            priority: 7,
            enforce: true,
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

    // 4. Configuration des modules
    module: {
      rules: [
        // JavaScript/TypeScript
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
        // GLSL Shaders
        {
          test: /\.(glsl|vert|frag)$/,
          use: ['raw-loader', 'glslify-loader'],
        },
        // CSS
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  localIdentName: isProduction
                    ? '[hash:base64]'
                    : '[path][name]__[local]',
                },
              },
            },
          ],
        },
        // Images
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 8 * 1024, // 8kb
            },
          },
        },
        // SVG
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
        },
        // Fonts
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
        },
      ],
    },

    // 5. Résolution améliorée
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

    // 6. Plugins optimisés
    plugins: [
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

      // Définition des variables d'environnement
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),

      // Extraction CSS
      isProduction && new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),

      // Compression
      isProduction && new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),

      // Copy Plugin
      isProduction && new CopyPlugin({
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

      // Module Federation (optionnel)
      isProduction && new ModuleFederationPlugin({
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

      // Analyse des bundles
      isAnalyze && new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-analysis.html',
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json',
        defaultSizes: 'gzip',
      }),

      // Profiling en développement
      !isProduction && new webpack.debug.ProfilingPlugin({
        outputPath: path.resolve(__dirname, 'profiling/profile.json'),
      }),
    ].filter(Boolean),

    // 7. Configuration de performance
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 244000,
      maxAssetSize: 244000,
    },

    // 8. Configuration de développement
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    
    devServer: {
      hot: true,
      historyApiFallback: true,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
  };
};
