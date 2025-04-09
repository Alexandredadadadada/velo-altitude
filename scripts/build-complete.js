/**
 * Script de build complet pour Velo-Altitude
 * Gère la structure hybride avec client/src et src
 * Support TypeScript et les configurations spécifiques au projet
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

console.log('🚀 Démarrage du build complet Velo-Altitude...');

// Configuration webpack complète
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
      // Configuration pour TypeScript
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
              moduleResolution: 'node',
              target: 'es5',
              jsx: 'react',
              allowSyntheticDefaultImports: true,
              esModuleInterop: true,
              resolveJsonModule: true,
              skipLibCheck: true,
              allowJs: true
            }
          }
        }
      },
      // Configuration pour JavaScript
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
            plugins: [
              '@babel/plugin-transform-class-properties',
              '@babel/plugin-transform-runtime'
            ],
            cacheDirectory: true,
          },
        },
      },
      // Configuration pour CSS
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ],
      },
      // Configuration pour SCSS/SASS
      {
        test: /\.(scss|sass)$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ],
      },
      // Configuration pour les images
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/media/[name][ext]'
        }
      },
      // Configuration pour SVG
      {
        test: /\.svg$/,
        use: ['@svgr/webpack', 'url-loader'],
      },
      // Configuration pour les fonts
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'static/fonts/[name][ext]'
        }
      },
      // Configuration pour les shaders (visualisation 3D)
      {
        test: /\.(glsl|vs|fs|vert|frag)$/,
        use: ['raw-loader', 'glslify-loader'],
      },
      // Configuration pour JSON
      {
        test: /\.json$/,
        type: 'javascript/auto',
        use: ['json-loader']
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
    // Support pour les modules circulaires (potentiellement utilisés dans l'architecture RealApiOrchestrator)
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
  // Configuration des résolutions de chemins adaptée à la structure hybride
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.css', '.scss'],
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
      '@config': path.resolve(__dirname, '../src/config'),
      // Services client
      '@client-services': path.resolve(__dirname, '../client/src/services'),
      '@client-auth': path.resolve(__dirname, '../client/src/auth'),
      // Services principaux pour les composants 3D
      '@three-components': path.resolve(__dirname, '../src/components/three'),
      '@weather-services': path.resolve(__dirname, '../src/services/weather'),
      '@col-services': path.resolve(__dirname, '../src/services/cols'),
      // Alias pour les services refactorisés
      '@nutrition-service': path.resolve(__dirname, '../src/services/nutrition'),
      '@optimized-data-service': path.resolve(__dirname, '../src/services/optimizedData'),
      '@real-api-orchestrator': path.resolve(__dirname, '../src/api/orchestration'),
    },
    // Assistance pour les modules imbriqués
    modules: ['node_modules', path.resolve(__dirname, '../node_modules')],
    // Gestion des champs pour les packages mixtes CJS/ESM 
    mainFields: ['browser', 'module', 'main'],
  },
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
};

// Exécuter webpack avec la configuration complète
webpack(config, (err, stats) => {
  if (err) {
    console.error('❌ Erreur fatale lors du build:', err);
    process.exit(1);
  }
  
  if (stats.hasErrors()) {
    console.error('❌ Erreurs webpack lors du build:');
    const info = stats.toJson();
    
    // Analyse des erreurs pour diagnostiquer les problèmes
    const errors = info.errors || [];
    errors.forEach((error, index) => {
      if (index < 10) { // Limiter le nombre d'erreurs affichées
        console.error(`\n--------- Erreur ${index + 1}/${errors.length} ---------`);
        console.error('Module:', error.moduleName || 'Inconnu');
        console.error('Fichier:', error.file || 'Inconnu');
        
        // Analyser le message d'erreur
        let message = error.message || '';
        
        // Détecter le type d'erreur
        if (message.includes("Can't resolve")) {
          // Problème de résolution de module
          const matches = message.match(/Can't resolve '([^']+)'/);
          if (matches && matches[1]) {
            const modulePath = matches[1];
            console.error(`Problème de résolution du module: ${modulePath}`);
            
            // Suggestions selon le type de module
            if (modulePath.includes('services')) {
              console.error('Suggestion: Le service pourrait se trouver dans client/src/services ou src/services');
            } else if (modulePath.includes('auth')) {
              console.error('Suggestion: Vérifier les imports auth dans client/src/auth');
            } else if (modulePath.includes('api')) {
              console.error('Suggestion: Vérifier les imports api dans src/api/orchestration');
            }
          }
        } else if (message.includes("Module parse failed")) {
          // Problème de parsing
          console.error('Suggestion: Vérifier la syntaxe du fichier ou ajouter un loader approprié');
        } else if (message.includes("export")) {
          // Problème d'export/import
          console.error('Suggestion: Vérifier la compatibilité des imports/exports (ESM vs CommonJS)');
        }
        
        // Tronquer le message s'il est trop long
        if (message.length > 300) {
          message = message.substring(0, 300) + '... [message tronqué]';
        }
        console.error('Message:', message);
      }
    });
    
    if (errors.length > 10) {
      console.error(`\n... et ${errors.length - 10} autres erreurs`);
    }
    
    process.exit(1);
  }
  
  console.log(stats.toString({
    colors: true,
    chunks: false,
    modules: false,
  }));
  
  console.log('✅ Build complet terminé avec succès');
  
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
  
  // Création du fichier robots.txt
  const robotsPath = path.join(buildDir, 'robots.txt');
  const robotsContent = `
User-agent: *
Allow: /
`;
  
  try {
    fs.writeFileSync(robotsPath, robotsContent.trim());
    console.log('✅ Fichier robots.txt créé');
  } catch (error) {
    console.error(`❌ Erreur lors de la création du fichier robots.txt: ${error.message}`);
  }
}
