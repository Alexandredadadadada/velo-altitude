/**
 * Script de build pour la production
 * Optimise les assets et prépare l'application pour le déploiement sur Hostinger
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const chalk = require('chalk');

// Chemins
const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');
const buildDir = path.join(rootDir, 'dist');
const publicDir = path.join(buildDir, 'public');

// Configuration
const NODE_ENV = 'production';
const config = require('../config/production');

console.log(chalk.blue('🚀 Démarrage du build de production pour Hostinger...'));

// Nettoyer le répertoire de build
console.log(chalk.yellow('🧹 Nettoyage du répertoire de build...'));
fs.emptyDirSync(buildDir);

// Installer les dépendances de production
console.log(chalk.yellow('📦 Installation des dépendances de production...'));
execSync('npm ci --production', { cwd: rootDir, stdio: 'inherit' });

// Configuration webpack pour le client
const webpackConfig = {
  mode: 'production',
  entry: path.join(clientDir, 'src', 'index.js'),
  output: {
    path: publicDir,
    filename: 'js/[name].[contenthash].js',
    publicPath: '/'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          output: {
            comments: false,
          },
        },
        extractComments: false,
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      name: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp)$/i,
        type: 'asset',
        generator: {
          filename: 'images/[name].[contenthash][ext]'
        },
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8kb
          }
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[contenthash][ext]'
        }
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css'
    }),
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240, // 10kb
      minRatio: 0.8
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.API_BASE_URL': JSON.stringify(config.server.apiBaseUrl)
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.json'],
    alias: {
      '@': path.join(clientDir, 'src')
    }
  }
};

// Compiler le client
console.log(chalk.yellow('🔨 Compilation du client...'));
webpack(webpackConfig, (err, stats) => {
  if (err || stats.hasErrors()) {
    console.error(chalk.red('❌ Erreur lors de la compilation du client:'));
    if (err) {
      console.error(err);
    }
    if (stats && stats.hasErrors()) {
      console.error(stats.toString('errors-only'));
    }
    process.exit(1);
  }

  console.log(chalk.green('✅ Client compilé avec succès!'));
  console.log(stats.toString({
    chunks: false,
    colors: true
  }));

  // Copier les fichiers du serveur
  console.log(chalk.yellow('📋 Copie des fichiers du serveur...'));
  fs.copySync(serverDir, path.join(buildDir, 'server'), {
    filter: (src) => {
      return !src.includes('node_modules') && !src.includes('.git');
    }
  });

  // Copier les fichiers de configuration
  console.log(chalk.yellow('📋 Copie des fichiers de configuration...'));
  fs.copySync(path.join(rootDir, 'config'), path.join(buildDir, 'config'));

  // Créer le fichier .env de production
  console.log(chalk.yellow('🔑 Création du fichier .env de production...'));
  fs.copySync(path.join(rootDir, '.env.example'), path.join(buildDir, '.env.example'));
  
  // Copier package.json et package-lock.json
  console.log(chalk.yellow('📋 Copie des fichiers package.json...'));
  const packageJson = require(path.join(rootDir, 'package.json'));
  
  // Simplifier package.json pour la production
  const prodPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    description: packageJson.description,
    main: packageJson.main,
    scripts: {
      start: 'NODE_ENV=production node server/index.js'
    },
    dependencies: packageJson.dependencies,
    engines: {
      node: '>=14.0.0'
    }
  };
  
  fs.writeFileSync(
    path.join(buildDir, 'package.json'),
    JSON.stringify(prodPackageJson, null, 2)
  );

  // Créer le fichier README pour le déploiement
  console.log(chalk.yellow('📝 Création du README de déploiement...'));
  const readmeContent = `# Grand Est Cyclisme - Production Build

Ce dossier contient la version de production optimisée pour le déploiement sur Hostinger.

## Instructions de déploiement

1. Transférer tous les fichiers de ce dossier vers le serveur Hostinger via FTP ou SSH
2. Configurer le fichier \`.env\` sur le serveur avec les valeurs de production appropriées
3. Installer les dépendances : \`npm ci --production\`
4. Démarrer l'application : \`npm start\`

## Structure des fichiers

- \`/server\` - Code du serveur Node.js
- \`/public\` - Assets statiques optimisés (JS, CSS, images)
- \`/config\` - Fichiers de configuration

## Configuration

Assurez-vous de configurer correctement les variables d'environnement dans le fichier \`.env\` en vous basant sur le fichier \`.env.example\`.

## Bases de données

L'application nécessite :
- MongoDB pour les données principales
- Redis pour le cache

## Contact

Pour toute question concernant le déploiement, contactez l'équipe technique à support@grand-est-cyclisme.com
`;

  fs.writeFileSync(path.join(buildDir, 'README.md'), readmeContent);

  // Créer le fichier .htaccess pour Hostinger
  console.log(chalk.yellow('🔧 Création du fichier .htaccess...'));
  const htaccessContent = `# Activer le moteur de réécriture
RewriteEngine On

# Rediriger vers HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Définir le répertoire de base
RewriteBase /

# Ne pas rediriger les fichiers ou répertoires existants
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Pour les requêtes API, rediriger vers le serveur Node.js
RewriteRule ^api/(.*)$ http://localhost:${config.server.port}/api/$1 [P,L]

# Pour toutes les autres requêtes, servir index.html
RewriteRule ^ index.html [L]

# Compression Gzip
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache-Control
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
  ExpiresByType application/pdf "access plus 1 month"
  ExpiresByType text/x-javascript "access plus 1 month"
  ExpiresDefault "access plus 2 days"
</IfModule>

# Protection des fichiers sensibles
<FilesMatch "^\.env|\.git|package-lock\.json|\.htaccess$">
  Order allow,deny
  Deny from all
</FilesMatch>

# Désactiver l'affichage du contenu des répertoires
Options -Indexes
`;

  fs.writeFileSync(path.join(publicDir, '.htaccess'), htaccessContent);

  // Créer un script de déploiement pour Hostinger
  console.log(chalk.yellow('📜 Création du script de déploiement...'));
  const deployScript = `#!/bin/bash

# Script de déploiement pour Hostinger
# Utilisez ce script pour déployer l'application sur votre serveur Hostinger

echo "🚀 Déploiement de Grand Est Cyclisme sur Hostinger..."

# Configuration
HOSTINGER_USER="votre_utilisateur_ftp"
HOSTINGER_HOST="votre_serveur_ftp.hostinger.com"
HOSTINGER_PATH="/public_html"
BUILD_DIR="./dist"

# Vérifier que le build existe
if [ ! -d "$BUILD_DIR" ]; then
  echo "❌ Le répertoire de build n'existe pas. Exécutez d'abord 'node scripts/build-production.js'."
  exit 1
fi

# Demander confirmation
read -p "Êtes-vous sûr de vouloir déployer sur Hostinger? (o/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Oo]$ ]]; then
  echo "Déploiement annulé."
  exit 0
fi

# Déployer via FTP
echo "📤 Transfert des fichiers vers Hostinger..."
lftp -c "
  set ssl:verify-certificate no;
  open -u $HOSTINGER_USER,$HOSTINGER_PASSWORD $HOSTINGER_HOST;
  mirror -R $BUILD_DIR $HOSTINGER_PATH;
"

echo "✅ Déploiement terminé!"
echo "🌐 Votre site est maintenant accessible à l'adresse: https://grand-est-cyclisme.com"
`;

  fs.writeFileSync(path.join(rootDir, 'scripts', 'deploy-hostinger.sh'), deployScript);
  execSync('chmod +x scripts/deploy-hostinger.sh', { cwd: rootDir });

  console.log(chalk.green('✅ Build de production terminé avec succès!'));
  console.log(chalk.blue(`📁 Les fichiers de production sont disponibles dans le répertoire: ${buildDir}`));
  console.log(chalk.blue('📝 Consultez le fichier README.md pour les instructions de déploiement.'));
  console.log(chalk.blue('🚀 Pour déployer sur Hostinger, configurez et exécutez: ./scripts/deploy-hostinger.sh'));
});
