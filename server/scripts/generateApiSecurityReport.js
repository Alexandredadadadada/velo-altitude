/**
 * Script de génération de rapport de sécurité des clés API
 * Dashboard-Velo.com
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { logger } = require('../utils/logger');

// Configuration
const keysDirectory = process.env.KEYS_DIRECTORY || path.join(__dirname, '../../.keys');
const encryptionKey = process.env.API_KEYS_ENCRYPTION_KEY;
const reportPath = path.join(__dirname, '../../reports/api-security');

// Créer le répertoire des rapports s'il n'existe pas
if (!fs.existsSync(reportPath)) {
  fs.mkdirSync(reportPath, { recursive: true });
}

/**
 * Déchiffre les données de clés API
 * @param {string} encryptedData Données chiffrées
 * @returns {Object} Données déchiffrées
 */
function decryptKeys(encryptedData) {
  try {
    const encryptedObj = JSON.parse(encryptedData);
    const iv = Buffer.from(encryptedObj.iv, 'base64');
    const encryptedText = encryptedObj.data;
    const authTag = Buffer.from(encryptedObj.authTag, 'base64');
    
    const key = Buffer.from(encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error(`Erreur de déchiffrement: ${error.message}`);
  }
}

/**
 * Analyse la sécurité d'une clé API
 * @param {string} key Clé API à analyser
 * @returns {Object} Résultat de l'analyse
 */
function analyzeKeyStrength(key) {
  if (!key) {
    return {
      strength: 'inconnue',
      score: 0,
      issues: ['Clé vide ou non définie']
    };
  }
  
  const issues = [];
  let score = 0;
  
  // Longueur de la clé
  if (key.length < 16) {
    issues.push('Clé trop courte (moins de 16 caractères)');
  } else if (key.length < 32) {
    issues.push('Clé de longueur moyenne (moins de 32 caractères)');
    score += 1;
  } else {
    score += 2;
  }
  
  // Complexité de la clé
  const hasUppercase = /[A-Z]/.test(key);
  const hasLowercase = /[a-z]/.test(key);
  const hasNumbers = /[0-9]/.test(key);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(key);
  
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumbers) score += 1;
  if (hasSpecialChars) score += 1;
  
  if (!hasUppercase && !hasLowercase) {
    issues.push('Clé sans lettres');
  } else if (!hasUppercase) {
    issues.push('Clé sans majuscules');
  } else if (!hasLowercase) {
    issues.push('Clé sans minuscules');
  }
  
  if (!hasNumbers) {
    issues.push('Clé sans chiffres');
  }
  
  if (!hasSpecialChars) {
    issues.push('Clé sans caractères spéciaux');
  }
  
  // Entropie de la clé
  const entropy = calculateEntropy(key);
  if (entropy < 3) {
    issues.push('Faible entropie (clé potentiellement prévisible)');
  } else if (entropy >= 4) {
    score += 1;
  }
  
  // Déterminer la force globale
  let strength;
  if (score < 3) {
    strength = 'faible';
  } else if (score < 5) {
    strength = 'moyenne';
  } else if (score < 7) {
    strength = 'bonne';
  } else {
    strength = 'excellente';
  }
  
  return {
    strength,
    score,
    issues: issues.length > 0 ? issues : ['Aucun problème détecté'],
    entropy
  };
}

/**
 * Calcule l'entropie d'une chaîne
 * @param {string} str Chaîne à analyser
 * @returns {number} Entropie
 */
function calculateEntropy(str) {
  const len = str.length;
  const frequencies = {};
  
  // Compter la fréquence de chaque caractère
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  
  // Calculer l'entropie
  let entropy = 0;
  for (const char in frequencies) {
    const p = frequencies[char] / len;
    entropy -= p * Math.log2(p);
  }
  
  return entropy;
}

/**
 * Génère un rapport de sécurité pour un service
 * @param {string} serviceName Nom du service
 * @returns {Promise<Object>} Rapport de sécurité
 */
async function generateServiceReport(serviceName) {
  try {
    const keysPath = path.join(keysDirectory, `${serviceName}.json`);
    
    // Vérifier si le fichier de clés existe
    if (!fs.existsSync(keysPath)) {
      return {
        service: serviceName,
        status: 'missing',
        message: 'Fichier de clés non trouvé'
      };
    }
    
    // Lire et déchiffrer les clés
    const encryptedData = fs.readFileSync(keysPath, 'utf8');
    const keys = decryptKeys(encryptedData);
    
    // Analyser chaque clé
    const keyAnalysis = [];
    for (let i = 0; i < keys.keys.length; i++) {
      const key = keys.keys[i];
      const isActive = i === keys.active;
      
      const analysis = analyzeKeyStrength(key);
      keyAnalysis.push({
        keyIndex: i,
        isActive,
        ...analysis
      });
    }
    
    // Calculer les statistiques globales
    const activeKeyAnalysis = keyAnalysis.find(k => k.isActive);
    const weakKeys = keyAnalysis.filter(k => k.strength === 'faible');
    const averageScore = keyAnalysis.reduce((sum, k) => sum + k.score, 0) / keyAnalysis.length;
    
    return {
      service: serviceName,
      lastRotation: keys.lastRotation,
      rotationInterval: keys.rotationInterval,
      keyCount: keys.keyCount,
      activeKeyStrength: activeKeyAnalysis.strength,
      weakKeysCount: weakKeys.length,
      averageKeyScore: averageScore.toFixed(2),
      keys: keyAnalysis,
      recommendations: generateRecommendations(keyAnalysis, keys)
    };
  } catch (error) {
    console.error(`Erreur lors de la génération du rapport pour ${serviceName}:`, error);
    return {
      service: serviceName,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Génère des recommandations basées sur l'analyse des clés
 * @param {Array} keyAnalysis Analyse des clés
 * @param {Object} keys Configuration des clés
 * @returns {Array} Recommandations
 */
function generateRecommendations(keyAnalysis, keys) {
  const recommendations = [];
  
  // Vérifier la force de la clé active
  const activeKey = keyAnalysis.find(k => k.isActive);
  if (activeKey.strength === 'faible' || activeKey.strength === 'moyenne') {
    recommendations.push('Effectuer une rotation immédiate pour remplacer la clé active qui est de force insuffisante');
  }
  
  // Vérifier le nombre de clés faibles
  const weakKeys = keyAnalysis.filter(k => k.strength === 'faible');
  if (weakKeys.length > 0) {
    recommendations.push(`Remplacer ${weakKeys.length} clé(s) de force faible`);
  }
  
  // Vérifier l'intervalle de rotation
  const lastRotation = new Date(keys.lastRotation);
  const daysSinceRotation = Math.floor((new Date() - lastRotation) / (1000 * 60 * 60 * 24));
  
  if (daysSinceRotation > 30) {
    recommendations.push(`Effectuer une rotation car la dernière rotation date de ${daysSinceRotation} jours`);
  }
  
  // Vérifier le nombre de clés
  if (keys.keyCount < 2) {
    recommendations.push('Augmenter le nombre de clés actives à au moins 2 pour assurer la continuité du service');
  }
  
  return recommendations.length > 0 ? recommendations : ['Aucune action requise'];
}

/**
 * Génère un rapport HTML
 * @param {Array} reports Rapports de sécurité
 * @returns {string} Rapport HTML
 */
function generateHtmlReport(reports) {
  const date = new Date().toLocaleString('fr-FR');
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport de sécurité des clés API - Dashboard-Velo</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2c3e50; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .summary-box { background-color: #f9f9f9; padding: 15px; border-radius: 5px; width: 30%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .good { color: #27ae60; }
    .warning { color: #f39c12; }
    .danger { color: #e74c3c; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:hover { background-color: #f5f5f5; }
    .recommendations { background-color: #f0f7fb; border-left: 5px solid #3498db; padding: 15px; margin-bottom: 20px; }
    .key-details { margin-top: 10px; background-color: #f9f9f9; padding: 10px; border-radius: 5px; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport de sécurité des clés API</h1>
    <p>Dashboard-Velo.com - Généré le ${date}</p>
  </div>
  
  <div class="summary">
    <div class="summary-box">
      <h3>Services analysés</h3>
      <p><strong>${reports.length}</strong> services</p>
    </div>
    <div class="summary-box">
      <h3>Clés faibles</h3>
      <p class="${getWeakKeysClass(reports)}"><strong>${countWeakKeys(reports)}</strong> clés faibles détectées</p>
    </div>
    <div class="summary-box">
      <h3>Recommandations</h3>
      <p><strong>${countRecommendations(reports)}</strong> actions recommandées</p>
    </div>
  </div>
  
  <h2>Résumé par service</h2>
  <table>
    <tr>
      <th>Service</th>
      <th>Dernière rotation</th>
      <th>Clés actives</th>
      <th>Force de la clé active</th>
      <th>Score moyen</th>
      <th>Statut</th>
    </tr>
    ${generateTableRows(reports)}
  </table>
  
  <h2>Détails par service</h2>
  ${generateServiceDetails(reports)}
  
  <div class="footer">
    <p>Ce rapport est généré automatiquement par le système de gestion des clés API de Dashboard-Velo.</p>
    <p>Pour plus d'informations, consultez la documentation sur la sécurité des clés API.</p>
  </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Génère les lignes du tableau de résumé
 * @param {Array} reports Rapports de sécurité
 * @returns {string} HTML des lignes du tableau
 */
function generateTableRows(reports) {
  return reports.map(report => {
    if (report.status === 'error' || report.status === 'missing') {
      return `
        <tr>
          <td>${report.service}</td>
          <td colspan="4">${report.message}</td>
          <td class="danger">Erreur</td>
        </tr>
      `;
    }
    
    const lastRotation = new Date(report.lastRotation).toLocaleDateString('fr-FR');
    const keyStrengthClass = getStrengthClass(report.activeKeyStrength);
    
    return `
      <tr>
        <td>${report.service}</td>
        <td>${lastRotation}</td>
        <td>${report.keyCount}</td>
        <td class="${keyStrengthClass}">${report.activeKeyStrength}</td>
        <td>${report.averageKeyScore}</td>
        <td class="${report.recommendations[0] === 'Aucune action requise' ? 'good' : 'warning'}">
          ${report.recommendations[0] === 'Aucune action requise' ? 'OK' : 'Action requise'}
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Génère les détails pour chaque service
 * @param {Array} reports Rapports de sécurité
 * @returns {string} HTML des détails
 */
function generateServiceDetails(reports) {
  return reports.map(report => {
    if (report.status === 'error' || report.status === 'missing') {
      return `
        <div>
          <h3>${report.service}</h3>
          <p class="danger">${report.message}</p>
        </div>
      `;
    }
    
    const lastRotation = new Date(report.lastRotation).toLocaleDateString('fr-FR');
    
    return `
      <div>
        <h3>${report.service}</h3>
        <p><strong>Dernière rotation:</strong> ${lastRotation}</p>
        <p><strong>Intervalle de rotation:</strong> ${report.rotationInterval}</p>
        <p><strong>Nombre de clés:</strong> ${report.keyCount}</p>
        
        <div class="recommendations">
          <h4>Recommandations:</h4>
          <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
        
        <h4>Détails des clés:</h4>
        ${report.keys.map(key => `
          <div class="key-details">
            <p><strong>Clé ${key.keyIndex}${key.isActive ? ' (active)' : ''}:</strong></p>
            <p>Force: <span class="${getStrengthClass(key.strength)}">${key.strength}</span></p>
            <p>Score: ${key.score}/8</p>
            <p>Entropie: ${key.entropy.toFixed(2)}</p>
            <p>Problèmes:</p>
            <ul>
              ${key.issues.map(issue => `<li>${issue}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
      <hr>
    `;
  }).join('');
}

/**
 * Obtient la classe CSS pour la force d'une clé
 * @param {string} strength Force de la clé
 * @returns {string} Classe CSS
 */
function getStrengthClass(strength) {
  switch (strength) {
    case 'excellente': return 'good';
    case 'bonne': return 'good';
    case 'moyenne': return 'warning';
    case 'faible': return 'danger';
    default: return '';
  }
}

/**
 * Obtient la classe CSS pour le nombre de clés faibles
 * @param {Array} reports Rapports de sécurité
 * @returns {string} Classe CSS
 */
function getWeakKeysClass(reports) {
  const count = countWeakKeys(reports);
  if (count === 0) return 'good';
  if (count < 3) return 'warning';
  return 'danger';
}

/**
 * Compte le nombre de clés faibles
 * @param {Array} reports Rapports de sécurité
 * @returns {number} Nombre de clés faibles
 */
function countWeakKeys(reports) {
  return reports.reduce((count, report) => {
    if (report.keys) {
      return count + report.keys.filter(k => k.strength === 'faible').length;
    }
    return count;
  }, 0);
}

/**
 * Compte le nombre total de recommandations
 * @param {Array} reports Rapports de sécurité
 * @returns {number} Nombre de recommandations
 */
function countRecommendations(reports) {
  return reports.reduce((count, report) => {
    if (report.recommendations) {
      return count + (report.recommendations[0] === 'Aucune action requise' ? 0 : report.recommendations.length);
    }
    return count;
  }, 0);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== Génération du rapport de sécurité des clés API ===');
  
  // Vérifier la configuration
  if (!encryptionKey) {
    console.error('Erreur: API_KEYS_ENCRYPTION_KEY n\'est pas définie dans le fichier .env');
    process.exit(1);
  }
  
  if (!fs.existsSync(keysDirectory)) {
    console.error(`Erreur: Le répertoire de stockage des clés n'existe pas: ${keysDirectory}`);
    process.exit(1);
  }
  
  // Lister les services disponibles
  const services = fs.readdirSync(keysDirectory)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));
  
  if (services.length === 0) {
    console.error('Aucun service trouvé dans le répertoire des clés');
    process.exit(1);
  }
  
  console.log(`Services trouvés: ${services.join(', ')}`);
  
  // Générer les rapports pour chaque service
  const reports = [];
  for (const service of services) {
    console.log(`Analyse du service ${service}...`);
    const report = await generateServiceReport(service);
    reports.push(report);
  }
  
  // Générer le rapport HTML
  const htmlReport = generateHtmlReport(reports);
  const reportFilePath = path.join(reportPath, `api-security-report-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(reportFilePath, htmlReport);
  
  console.log(`\nRapport généré avec succès: ${reportFilePath}`);
  
  // Générer un rapport JSON
  const jsonReport = JSON.stringify(reports, null, 2);
  const jsonReportPath = path.join(reportPath, `api-security-report-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(jsonReportPath, jsonReport);
  
  console.log(`Rapport JSON généré: ${jsonReportPath}`);
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
});
