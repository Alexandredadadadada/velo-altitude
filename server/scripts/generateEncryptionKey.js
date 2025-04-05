/**
 * Script de génération de clé de chiffrement pour le système de gestion des clés API
 * Dashboard-Velo.com
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Génération d'une clé de 32 octets (256 bits) pour AES-256
const key = crypto.randomBytes(32).toString('hex');

console.log('=== Clé de chiffrement pour le système de gestion des clés API ===');
console.log('API_KEYS_ENCRYPTION_KEY=' + key);
console.log('');
console.log('Ajoutez cette clé à votre fichier .env pour sécuriser vos clés API.');
console.log('IMPORTANT: Ne partagez jamais cette clé et ne la stockez pas dans un dépôt Git.');

// Vérifier si le fichier .env existe
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  console.log('');
  console.log('Le fichier .env existe déjà. Voulez-vous y ajouter automatiquement cette clé ?');
  console.log('Si oui, exécutez la commande suivante :');
  console.log(`node -e "const fs = require('fs'); const path = require('path'); const envPath = path.join(__dirname, '../../.env'); let content = fs.readFileSync(envPath, 'utf8'); if (!content.includes('API_KEYS_ENCRYPTION_KEY')) { content += '\\nAPI_KEYS_ENCRYPTION_KEY=${key}\\n'; fs.writeFileSync(envPath, content); console.log('Clé ajoutée avec succès au fichier .env'); } else { console.log('Une clé existe déjà dans le fichier .env'); }"`);
} else {
  console.log('');
  console.log('Le fichier .env n\'existe pas. Voulez-vous le créer avec cette clé ?');
  console.log('Si oui, exécutez la commande suivante :');
  console.log(`node -e "const fs = require('fs'); const path = require('path'); const envPath = path.join(__dirname, '../../.env'); fs.writeFileSync(envPath, 'API_KEYS_ENCRYPTION_KEY=${key}\\n'); console.log('Fichier .env créé avec la clé de chiffrement');"`)
}

// Vérifier si le répertoire de stockage des clés existe
const keysDir = path.join(__dirname, '../../.keys');
if (!fs.existsSync(keysDir)) {
  console.log('');
  console.log('Le répertoire de stockage des clés n\'existe pas. Voulez-vous le créer ?');
  console.log('Si oui, exécutez la commande suivante :');
  console.log(`node -e "const fs = require('fs'); const path = require('path'); const keysDir = path.join(__dirname, '../../.keys'); fs.mkdirSync(keysDir, { recursive: true }); console.log('Répertoire de stockage des clés créé');"`)
  
  // Vérifier si le fichier .gitignore existe
  const gitignorePath = path.join(__dirname, '../../.gitignore');
  if (fs.existsSync(gitignorePath)) {
    console.log('');
    console.log('N\'oubliez pas d\'ajouter le répertoire .keys à votre fichier .gitignore :');
    console.log(`node -e "const fs = require('fs'); const path = require('path'); const gitignorePath = path.join(__dirname, '../../.gitignore'); let content = fs.readFileSync(gitignorePath, 'utf8'); if (!content.includes('.keys')) { content += '\\n# API Keys\\n.keys\\n'; fs.writeFileSync(gitignorePath, content); console.log('Répertoire .keys ajouté au fichier .gitignore'); } else { console.log('Le répertoire .keys est déjà dans le fichier .gitignore'); }"`);
  }
}
