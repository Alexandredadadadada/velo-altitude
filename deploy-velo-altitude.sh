#!/bin/bash
# Script de déploiement pour Velo-Altitude sur Netlify
# Ce script exécute toutes les étapes nécessaires pour un déploiement complet

echo "=== Déploiement Velo-Altitude - Processus complet ==="
echo ">> Étape 1: Vérification des pré-requis"

# Vérifier que Netlify CLI est installé
if ! command -v netlify &> /dev/null
then
    echo "Installation de Netlify CLI..."
    npm install netlify-cli -g
fi

echo ">> Étape 2: Préparation du build"

# Aller dans le dossier client
cd client

# Installer les dépendances
echo "Installation des dépendances..."
npm ci

# Construire le projet
echo "Construction du projet..."
CI=false DISABLE_ESLINT_PLUGIN=true npm run build

# Retour à la racine
cd ..

# Vérifier si un site existe déjà
echo ">> Étape 3: Configuration Netlify"

# Se connecter à Netlify (si nécessaire)
netlify status || netlify login

# Créer un nouveau site ou utiliser l'existant
SITE_ID=$(netlify sites:list --json | grep -o '"site_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$SITE_ID" ]; then
    echo "Création d'un nouveau site..."
    netlify sites:create --name velo-altitude
else
    echo "Utilisation du site existant: $SITE_ID"
fi

# Déployer avec nettoyage du cache
echo ">> Étape 4: Déploiement"
netlify deploy --prod --dir=client/build --clear

echo "=== Déploiement terminé ==="
echo "Vérifiez l'URL ci-dessus pour accéder à votre site."
