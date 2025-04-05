const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const WorkboxPlugin = require('workbox-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: isProduction ? 'static/js/[name].[contenthash:8].js' : 'static/js/bundle.js',
      chunkFilename: isProduction ? 'static/js/[name].[contenthash:8].chunk.js' : 'static/js/[name].chunk.js',
      publicPath: '/',
      clean: true,
    },
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: [
            /node_modules/,
            // Exclure weather-map.js et weather-map-fixed.js de la transpilation Babel
            /public\/js\/weather-map\.js$/,
            /public\/js\/weather-map-fixed\.js$/
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', '@babel/preset-react'],
              // Ajouter les plugins pour améliorer les performances
              plugins: [
                '@babel/plugin-transform-runtime',
                '@babel/plugin-syntax-dynamic-import',
              ],
              // Cache Babel pour accélérer les builds
              cacheDirectory: true,
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                url: {
                  filter: (url) => {
                    // Résoudre les problèmes de chemins d'images dans les CSS
                    if (url.startsWith('/images/')) {
                      return false; // Utiliser l'URL telle quelle
                    }
                    // Ignorer les chemins des images de Leaflet
                    if (url.includes('layers.png') || url.includes('layers-2x.png') || url.includes('marker-icon.png')) {
                      return false; // Ne pas essayer de résoudre ces URLs
                    }
                    return true;
                  },
                },
                // Activer les modules CSS pour les fichiers .module.css
                modules: {
                  auto: (resourcePath) => resourcePath.endsWith('.module.css'),
                  localIdentName: isProduction ? '[hash:base64]' : '[path][name]__[local]',
                },
                importLoaders: 1,
              },
            },
            // Ajouter PostCSS pour la gestion des préfixes et l'optimisation
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: path.resolve(__dirname, 'postcss.config.js'),
                },
              },
            },
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif)$/i,
          type: 'asset',
          parser: {
            dataUrlCondition: {
              maxSize: 10 * 1024, // 10kb
            },
          },
          generator: {
            filename: 'static/media/[name].[hash:8][ext]',
          },
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack', 'url-loader'],
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'static/fonts/[name].[hash:8][ext]',
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'public/index.html'),
        inject: true,
        minify: isProduction ? {
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
        } : undefined,
      }),
      isProduction && new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
      isProduction && new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
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
          },
          // Copier les fichiers CSS optimisés
          {
            from: 'src/styles/base.css',
            to: 'static/css/base.css',
          },
          {
            from: 'src/styles/mobile.css',
            to: 'static/css/mobile.css',
          },
          {
            from: 'src/styles/tablet.css',
            to: 'static/css/tablet.css',
          },
          {
            from: 'src/styles/desktop.css',
            to: 'static/css/desktop.css',
          },
          {
            from: 'src/styles/critical.css',
            to: 'static/css/critical.css',
          },
        ],
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      }),
      // Temporairement désactivé pour résoudre les conflits de build
      /* isProduction && new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        exclude: [/\.map$/, /asset-manifest\.json$/],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
      }), */
    ].filter(Boolean),
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'components': path.resolve(__dirname, 'src/components'),
        'pages': path.resolve(__dirname, 'src/pages'),
        'utils': path.resolve(__dirname, 'src/utils'),
        'assets': path.resolve(__dirname, 'src/assets'),
        'services': path.resolve(__dirname, 'src/services'),
        'hooks': path.resolve(__dirname, 'src/hooks'),
        'context': path.resolve(__dirname, 'src/context'),
        'styles': path.resolve(__dirname, 'src/styles'),
        // Ajouter un alias pour les images pour faciliter les références dans les CSS
        'images': path.resolve(__dirname, 'public/images'),
        // Résoudre les chemins des images de Leaflet
        'images/layers.png': path.resolve(__dirname, 'node_modules/leaflet/dist/images/layers.png'),
        'images/layers-2x.png': path.resolve(__dirname, 'node_modules/leaflet/dist/images/layers-2x.png'),
        'images/marker-icon.png': path.resolve(__dirname, 'node_modules/leaflet/dist/images/marker-icon.png'),
        // Alias supplémentaires pour les images par catégorie
        'weather-images': path.resolve(__dirname, 'public/images/weather'),
        'social-images': path.resolve(__dirname, 'public/images/social'),
        'profiles-images': path.resolve(__dirname, 'public/images/profiles'),
        'summits-images': path.resolve(__dirname, 'public/images/summits'),
      },
    },
    performance: {
      hints: isProduction ? 'warning' : false,
      maxAssetSize: 512000, // 500KiB
      maxEntrypointSize: 512000, // 500KiB
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              // Nous voulons que terser analyse notre version corrigée du weather-map.js
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: isProduction,
              drop_debugger: isProduction,
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
          parallel: true,
          // Exclure weather-map.js si problèmes persistent
          exclude: [/weather-map-fixed\.js$/, /weather-map\.js$/],
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        minSize: 0,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Obtenir le nom du package
              const packageNameMatch = module.context && module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              );
              
              // Vérifier si nous avons un match valide
              if (!packageNameMatch || !packageNameMatch[1]) {
                return 'vendor.misc'; // Valeur par défaut
              }
              
              const packageName = packageNameMatch[1];
              
              // Regrouper les packages par catégorie
              if (/react|redux/.test(packageName)) return 'vendor.react';
              if (/three|gsap/.test(packageName)) return 'vendor.animation';
              if (/i18n/.test(packageName)) return 'vendor.i18n';
              if (/chart|recharts|d3/.test(packageName)) return 'vendor.visualization';
              if (/leaflet|mapbox/.test(packageName)) return 'vendor.maps';
              
              return 'vendor.misc';
            },
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: -10
          },
        },
      },
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
      },
    },
    // Ajouter la configuration pour le serveur de développement
    devServer: {
      contentBase: path.join(__dirname, 'public'),
      historyApiFallback: true,
      compress: true,
      hot: true,
      port: 3000,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
      },
    },
  };
};
