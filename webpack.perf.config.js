// webpack.perf.config.js
const path = require('path');
const webpack = require('webpack');
const { merge } = require('webpack-merge');
const WorkboxPlugin = require('workbox-webpack-plugin');
const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');

// Fonction pour obtenir la configuration de base
const getBaseConfig = (env, argv) => {
  const baseConfig = require('./webpack.config.js');
  return typeof baseConfig === 'function' ? baseConfig(env, argv) : baseConfig;
};

module.exports = (env, argv) => {
  return merge(getBaseConfig(env, argv), {
    optimization: {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        cacheGroups: {
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
          }
        }
      }
    },
    performance: {
      hints: 'warning',
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    },
    plugins: [
      // Préchargement des ressources critiques
      new PreloadWebpackPlugin({
        rel: 'preload',
        include: 'initial',
        fileBlacklist: [/\.map$/, /hot-update\.js$/]
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
          // Mise en cache des données météo (probablement via API)
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
      })
    ]
  });
};
