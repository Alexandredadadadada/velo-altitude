/**
 * Script de build hybride spécifique à l'architecture Velo-Altitude
 * Gère la structure particulière avec client/src et src
 */
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

// Configuration de base
const buildDir = path.resolve(__dirname, '../build');
const publicDir = path.resolve(__dirname, '../public');

console.log('🚀 Démarrage du build hybride optimisé pour la structure Velo-Altitude...');

// Configuration webpack adaptée à la structure hybride
const config = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: buildDir,
    filename: 'static/js/[name].js',
    publicPath: '/',
    clean: true,
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      maxSize: 244000,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            cacheDirectory: true,
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name][ext]'
        }
      },
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name][ext]'
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
      },
    }),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].css',
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
    // Définir les variables d'environnement pour le build
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
        REACT_APP_API_URL: JSON.stringify('http://localhost:3000/api'),
        REACT_APP_BASE_URL: JSON.stringify('http://localhost:3000'),
        REACT_APP_BRAND_NAME: JSON.stringify('Velo-Altitude'),
        REACT_APP_VERSION: JSON.stringify('1.0.0'),
        REACT_APP_ENABLE_ANALYTICS: JSON.stringify('false'),
      }
    }),
  ],
  // Configuration des résolutions de chemins adaptée à la structure hybride
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // Résolution des imports entre client/src et src
      '@': path.resolve(__dirname, '../src'),
      '@client': path.resolve(__dirname, '../client/src'),
      '@server': path.resolve(__dirname, '../server'),
      // Résolution spécifique pour les services
      '@services': path.resolve(__dirname, '../src/services'),
      '@api': path.resolve(__dirname, '../src/api'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      // Services client
      '@client-services': path.resolve(__dirname, '../client/src/services'),
      // Services principaux pour les composants 3D
      '@three-components': path.resolve(__dirname, '../src/components/three'),
      '@weather-services': path.resolve(__dirname, '../src/services/weather'),
      '@col-services': path.resolve(__dirname, '../src/services/cols'),
    },
  },
  performance: {
    hints: false,
  },
};

// Exécuter webpack avec la configuration adaptée
webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Erreur fatale lors du build:', err);
    process.exit(1);
  }
  
  if (stats.hasErrors()) {
    console.error('❌ Erreurs webpack lors du build:');
    const info = stats.toJson();
    
    // Analyse des erreurs pour diagnostiquer les problèmes de chemins
    const errors = info.errors || [];
    errors.forEach((error, index) => {
      console.error(`\n--------- Erreur ${index + 1} ---------`);
      console.error('Module:', error.moduleName || 'Inconnu');
      console.error('Fichier:', error.file || 'Inconnu');
      
      // Essayons d'extraire des informations sur les problèmes de chemin
      let message = error.message || '';
      if (message.includes("Can't resolve")) {
        const matches = message.match(/Can't resolve '([^']+)'/);
        if (matches && matches[1]) {
          console.error(`Problème de résolution du module: ${matches[1]}`);
          // Suggérer des corrections possibles basées sur la structure connue
          if (matches[1].includes('services')) {
            console.error('Suggestion: Vérifier si le service existe dans client/src/services ou src/services');
          } else if (matches[1].includes('components')) {
            console.error('Suggestion: Vérifier si le composant existe dans src/components');
          }
        }
      }
      
      // Tronquer le message s'il est trop long
      if (message.length > 500) {
        message = message.substring(0, 500) + '... [message tronqué]';
      }
      console.error('Message:', message);
    });
    
    process.exit(1);
  }
  
  console.log(stats.toString({
    colors: true,
    chunks: false,
    modules: false,
  }));
  
  console.log('✅ Build hybride terminé avec succès');
  
  // Créer les fichiers de configuration Netlify
  createNetlifyConfig();
});

function createNetlifyConfig() {
  console.log('🔄 Création des fichiers de configuration Netlify...');
  
  // Fichier _redirects pour SPA routing
  const redirectsContent = `
# Redirections Netlify pour Velo-Altitude
# API calls sont acheminés vers des fonctions serverless
/api/*    /.netlify/functions/api/:splat    200
# Toutes les autres routes sont gérées par React Router
/*    /index.html   200
`;
  
  try {
    fs.writeFileSync(path.join(buildDir, '_redirects'), redirectsContent.trim());
    console.log('✅ Fichier _redirects créé');
  } catch (error) {
    console.error(`❌ Erreur lors de la création du fichier _redirects: ${error.message}`);
  }
}
