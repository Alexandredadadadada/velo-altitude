const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// Ajout du plugin BundleAnalyzerPlugin pour l'analyse des bundles
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

/**
 * Configuration webpack optimisée pour Velo-Altitude
 * 
 * Cette configuration a été spécifiquement ajustée pour résoudre plusieurs problèmes :
 * 1. Gestion correcte des images Leaflet (via css-loader avec url:false et copie directe)
 * 2. Exclusion des fichiers problématiques de la transpilation (weather-map, etc.)
 * 3. Configuration optimisée pour la production
 */
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
              // Désactiver la résolution d'URL pour éviter les erreurs avec les images Leaflet
              // Solution nécessaire car Leaflet utilise des chemins relatifs pour ses images
              // qui ne sont pas correctement résolus durant le build webpack
              url: false 
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
          from: 'src/assets', 
          to: 'assets',
          noErrorOnMissing: true
        },
        // Copier les images Leaflet directement pour assurer leur disponibilité
        // Cette étape est nécessaire car nous avons désactivé la résolution d'URL dans css-loader
        {
          from: 'node_modules/leaflet/dist/images',
          to: 'images',
          noErrorOnMissing: true
        },
        // Copie personnalisée du fichier weather-map-fixed.js
        // Ce fichier est une version modifiée de weather-map.js qui évite les problèmes de minification
        // lors du build de production. Il utilise un IIFE pour éviter les conflits de scope.
        {
          from: 'public/js/weather-map-fixed.js',
          to: 'js/weather-map.js',
          noErrorOnMissing: true
        },
        {
          from: 'public/js/image-fallback.js',
          to: 'js/image-fallback.js',
          noErrorOnMissing: true
        }
      ]
    }),
    // Analyse des bundles (commenter cette ligne pour les builds de production)
    process.env.ANALYZE === 'true' && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: '../webpack-bundle-report.html',
      openAnalyzer: false,
    })
  ].filter(Boolean), // Filtre les plugins undefined (quand ANALYZE n'est pas 'true')
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
      // Ajouter un alias pour les images Leaflet pour faciliter leur importation
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
