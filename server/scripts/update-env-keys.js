const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Déterminer le chemin du fichier .env dans la racine du projet
const envPath = path.resolve(process.cwd(), '.env');

// Charger le fichier .env existant s'il existe
dotenv.config();

console.log('🔐 Mise à jour sécurisée des clés API dans le fichier .env');

// Vérifier si le fichier .env existe
if (!fs.existsSync(envPath)) {
  console.log('Création d\'un nouveau fichier .env...');
  fs.writeFileSync(envPath, '# API Keys for European Cycling Dashboard\n\n');
}

// Lire le contenu actuel du fichier .env
let envContent = fs.readFileSync(envPath, 'utf8');

// Fonction pour mettre à jour une clé API dans le fichier .env sans l'afficher dans la console
function updateApiKey(envVar, value, description) {
  // Vérifie si la clé existe déjà dans le fichier
  const regex = new RegExp(`^${envVar}=.*`, 'm');
  
  if (regex.test(envContent)) {
    // La clé existe, la mettre à jour
    envContent = envContent.replace(regex, `${envVar}=${value}`);
    console.log(`✓ ${description || envVar} mis à jour`);
  } else {
    // La clé n'existe pas, l'ajouter
    envContent += `\n# ${description || envVar}\n${envVar}=${value}\n`;
    console.log(`✓ ${description || envVar} ajouté`);
  }
}

// Mettre à jour les clés API fournies sans les afficher directement dans le code
// Note: Ces valeurs devraient normalement être fournies de manière sécurisée,
// comme par des variables d'environnement du système CI/CD ou une solution de gestion des secrets

// Variables API Strava
if (!process.env.STRAVA_ACCESS_TOKEN) {
  // Note: Le token est censé être fourni de façon sécurisée
  updateApiKey('STRAVA_ACCESS_TOKEN', process.argv[2] || '[STRAVA_ACCESS_TOKEN_PLACEHOLDER]', 'Strava Access Token');
}

if (!process.env.STRAVA_REFRESH_TOKEN) {
  updateApiKey('STRAVA_REFRESH_TOKEN', process.argv[3] || '[STRAVA_REFRESH_TOKEN_PLACEHOLDER]', 'Strava Refresh Token');
}

if (!process.env.STRAVA_CLIENT_ID) {
  updateApiKey('STRAVA_CLIENT_ID', process.argv[4] || '[STRAVA_CLIENT_ID_PLACEHOLDER]', 'Strava Client ID');
}

if (!process.env.STRAVA_CLIENT_SECRET) {
  updateApiKey('STRAVA_CLIENT_SECRET', process.argv[5] || '[STRAVA_CLIENT_SECRET_PLACEHOLDER]', 'Strava Client Secret');
}

// Variables API OpenAI
if (!process.env.OPENAI_API_KEY) {
  updateApiKey('OPENAI_API_KEY', process.argv[6] || '[OPENAI_API_KEY_PLACEHOLDER]', 'OpenAI API Key');
}

// Variables API Claude
if (!process.env.CLAUDE_API_KEY) {
  updateApiKey('CLAUDE_API_KEY', process.argv[7] || '[CLAUDE_API_KEY_PLACEHOLDER]', 'Claude API Key');
}

// Écrire le contenu mis à jour dans le fichier .env
fs.writeFileSync(envPath, envContent);
console.log('✅ Fichier .env mis à jour avec succès');
console.log('⚠️ IMPORTANT: Si des placeholders ont été ajoutés, assurez-vous de les remplacer par les vraies valeurs');
console.log('🔒 Pour une utilisation en production, utilisez un gestionnaire de secrets approprié');

// Instructions pour l'utilisation du script
console.log('\n📌 Comment utiliser ce script:');
console.log('node update-env-keys.js [STRAVA_ACCESS_TOKEN] [STRAVA_REFRESH_TOKEN] [STRAVA_CLIENT_ID] [STRAVA_CLIENT_SECRET] [OPENAI_API_KEY] [CLAUDE_API_KEY]');
console.log('\nOu configurez ces valeurs comme variables d\'environnement avant de lancer le script.');
