#!/bin/bash

# Script d'installation des dépendances pour Linux/Mac
# Pour le projet Grand Est Cyclisme

echo "=== Installation des dépendances pour Grand Est Cyclisme ==="
echo ""

# Fonction pour vérifier si une commande existe
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Vérifier que Node.js est installé
if ! command_exists node; then
  echo "❌ Node.js n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Vérifier que npm est installé
if ! command_exists npm; then
  echo "❌ npm n'est pas installé. Veuillez l'installer avant de continuer."
  exit 1
fi

# Afficher les versions
echo "📦 Node.js version: $(node -v)"
echo "📦 npm version: $(npm -v)"
echo ""

# Installer les dépendances du serveur
echo "🔧 Installation des dépendances du serveur..."
cd server || { echo "❌ Le dossier server n'existe pas."; exit 1; }
npm install
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'installation des dépendances du serveur."
  exit 1
fi
cd ..
echo "✅ Dépendances du serveur installées avec succès."
echo ""

# Installer les dépendances du client
echo "🔧 Installation des dépendances du client..."
cd client || { echo "❌ Le dossier client n'existe pas."; exit 1; }
npm install
if [ $? -ne 0 ]; then
  echo "❌ Erreur lors de l'installation des dépendances du client."
  exit 1
fi
cd ..
echo "✅ Dépendances du client installées avec succès."
echo ""

# Vérifier les dépendances
echo "🔍 Vérification des dépendances..."
node scripts/check-dependencies.js
echo ""

echo "🎉 Installation terminée avec succès !"
echo "Pour démarrer l'application en mode développement :"
echo "  - Serveur : cd server && npm run dev"
echo "  - Client  : cd client && npm start"
echo ""

# Rendre le script exécutable
chmod +x "$0"
