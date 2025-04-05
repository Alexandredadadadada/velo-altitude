/**
 * Script pour générer automatiquement des placeholders pour les images manquantes
 * Exécuter avec: node generate-placeholders.js
 */

const fs = require('fs');
const path = require('path');

// Liste des répertoires à scanner pour les références d'images
const dirsToScan = ['client/src/components'];

// Répertoires pour les placeholders
const placeholderDirs = [
  'client/public/images/profiles',
  'client/public/images/social',
  'client/public/images/weather', 
  'client/public/images/summits',
  'client/public/images/nutrition',
  'client/public/images/training'
];

// Création des répertoires s'ils n'existent pas
placeholderDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Répertoire créé: ${dir}`);
  }
});

// Contenu SVG de base pour différents types de placeholders
const placeholders = {
  profile: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#e2e8f0"/>
    <circle cx="100" cy="80" r="40" fill="#94a3b8"/>
    <circle cx="100" cy="230" r="100" fill="#94a3b8"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#475569" text-anchor="middle">Profil</text>
  </svg>`,
  
  social: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#e0f2fe"/>
    <circle cx="70" cy="80" r="30" fill="#7dd3fc"/>
    <circle cx="140" cy="80" r="30" fill="#7dd3fc"/>
    <path d="M 50 130 Q 100 170 150 130" stroke="#7dd3fc" stroke-width="8" fill="transparent"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#0369a1" text-anchor="middle">Social</text>
  </svg>`,
  
  weather: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#f8fafc"/>
    <circle cx="80" cy="80" r="40" fill="#fde68a"/>
    <path d="M 120 100 Q 160 70 170 110 Q 190 110 190 130 Q 190 150 170 150 L 100 150 Q 80 150 80 130 Q 80 110 100 110 L 120 100" fill="#cbd5e1"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#475569" text-anchor="middle">Météo</text>
  </svg>`,
  
  summit: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#ecfdf5"/>
    <polygon points="40,160 100,40 160,160" fill="#34d399"/>
    <polygon points="70,160 130,80 190,160" fill="#10b981"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#065f46" text-anchor="middle">Sommet</text>
  </svg>`,
  
  nutrition: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#fef2f2"/>
    <circle cx="100" cy="100" r="60" fill="#fecaca"/>
    <path d="M 80 70 L 120 70 L 120 130 L 80 130 Z" fill="#f87171"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#b91c1c" text-anchor="middle">Nutrition</text>
  </svg>`,
  
  training: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#eff6ff"/>
    <rect x="50" y="70" width="100" height="20" rx="5" fill="#93c5fd"/>
    <rect x="50" y="100" width="80" height="20" rx="5" fill="#93c5fd"/>
    <rect x="50" y="130" width="120" height="20" rx="5" fill="#93c5fd"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#1e40af" text-anchor="middle">Entraînement</text>
  </svg>`,
  
  generic: `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="200" fill="#f0f0f0"/>
    <rect x="60" y="60" width="80" height="80" rx="10" fill="#d4d4d4"/>
    <line x1="60" y1="60" x2="140" y2="140" stroke="#a3a3a3" stroke-width="5"/>
    <line x1="140" y1="60" x2="60" y2="140" stroke="#a3a3a3" stroke-width="5"/>
    <text x="50%" y="90%" font-family="Arial" font-size="16" fill="#525252" text-anchor="middle">Image</text>
  </svg>`
};

// Créer les placeholders de base
fs.writeFileSync(path.join('client/public/images/profiles', 'avatar-placeholder.svg'), placeholders.profile);
fs.writeFileSync(path.join('client/public/images/social', 'unknown.svg'), placeholders.social);
fs.writeFileSync(path.join('client/public/images/weather', 'unknown.svg'), placeholders.weather);
fs.writeFileSync(path.join('client/public/images/summits', 'placeholder.svg'), placeholders.summit);
fs.writeFileSync(path.join('client/public/images/nutrition', 'placeholder.svg'), placeholders.nutrition);
fs.writeFileSync(path.join('client/public/images/training', 'placeholder.svg'), placeholders.training);
fs.writeFileSync(path.join('client/public/images', 'placeholder.svg'), placeholders.generic);

// Création des icônes spécifiques pour le module social si elles n'existent pas
const socialIcons = ['like-icon.svg', 'comment-icon.svg', 'share-icon.svg', 'bookmark-icon.svg'];
socialIcons.forEach(icon => {
  const iconPath = path.join('client/public/images/social', icon);
  if (!fs.existsSync(iconPath)) {
    const iconSvg = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" fill="none"/>
      <circle cx="12" cy="12" r="10" fill="#3498db"/>
      <text x="12" y="17" font-family="Arial" font-size="10" fill="white" text-anchor="middle">${icon.replace('-icon.svg', '').charAt(0).toUpperCase()}</text>
    </svg>`;
    fs.writeFileSync(iconPath, iconSvg);
    console.log(`Icône créée: ${iconPath}`);
  }
});

// Création des icônes météo de base
const weatherConditions = ['clear', 'clouds', 'rain', 'snow', 'fog', 'thunderstorm'];
weatherConditions.forEach(condition => {
  const iconPath = path.join('client/public/images/weather', `${condition}.svg`);
  if (!fs.existsSync(iconPath)) {
    fs.writeFileSync(iconPath, placeholders.weather);
    console.log(`Icône météo créée: ${iconPath}`);
  }
});

console.log('Tous les placeholders ont été générés avec succès!');
