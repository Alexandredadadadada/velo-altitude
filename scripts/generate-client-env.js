/**
 * Script pour générer le fichier .env.local pour le client React
 * Ce script extrait les variables d'environnement nécessaires du fichier .env.production
 * et les convertit au format REACT_APP_ pour le client
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement du fichier .env.production
const envPath = path.resolve(__dirname, '../.env.production');
const envLocalPath = path.resolve(__dirname, '../client/.env.local');

console.log(`Génération du fichier .env.local pour le client React à partir de ${envPath}...`);

// Vérifier que le fichier .env.production existe
if (!fs.existsSync(envPath)) {
  console.error(`Le fichier ${envPath} n'existe pas.`);
  process.exit(1);
}

// Charger les variables d'environnement
dotenv.config({ path: envPath });

// Définir les mappings entre les variables d'environnement serveur et client
const envMappings = [
  { server: 'MAPBOX_PUBLIC_TOKEN', client: 'REACT_APP_MAPBOX_TOKEN' },
  { server: 'API_BASE_URL', client: 'REACT_APP_API_URL' },
  { server: 'NODE_ENV', client: 'REACT_APP_ENVIRONMENT' }
];

// Générer le contenu du fichier .env.local
let envLocalContent = `# Fichier de configuration des variables d'environnement pour le client React
# Généré automatiquement le ${new Date().toISOString()}
# NE PAS MODIFIER MANUELLEMENT - Utiliser le script generate-client-env.js

`;

// Ajouter les variables mappées
envMappings.forEach(mapping => {
  const value = process.env[mapping.server];
  if (value) {
    envLocalContent += `${mapping.client}=${value}\n`;
  } else {
    console.warn(`⚠️ La variable ${mapping.server} n'est pas définie dans .env.production`);
  }
});

// Ajouter des variables supplémentaires spécifiques au client
envLocalContent += `
# Configuration supplémentaire
REACT_APP_USE_MOCK_DATA=false
REACT_APP_VERSION=${new Date().toISOString().split('T')[0].replace(/-/g, '.')}
`;

// Écrire le fichier .env.local
try {
  fs.writeFileSync(envLocalPath, envLocalContent);
  console.log(`✅ Fichier ${envLocalPath} généré avec succès.`);
} catch (error) {
  console.error(`❌ Erreur lors de l'écriture du fichier ${envLocalPath}: ${error.message}`);
  process.exit(1);
}

console.log('Variables d\'environnement client configurées:');
envMappings.forEach(mapping => {
  const value = process.env[mapping.server];
  if (value) {
    // Masquer partiellement les clés API pour la sécurité
    const maskedValue = mapping.server.includes('TOKEN') || mapping.server.includes('KEY') || mapping.server.includes('SECRET')
      ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
      : value;
    console.log(`- ${mapping.client}: ${maskedValue}`);
  }
});
