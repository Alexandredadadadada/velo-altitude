/**
 * browser-compatibility.ts
 * Script de vérification de la compatibilité navigateur
 */

import * as fs from 'fs';
import * as path from 'path';

interface BrowserCompatInfo {
  browser: string;
  version: string;
  status: 'Compatible' | 'Partiellement compatible' | 'Non compatible';
  notes: string;
}

/**
 * Vérifie les styles CSS pour la compatibilité navigateur
 */
function checkCSSCompatibility(): boolean {
  console.log('Vérification de la compatibilité CSS...');
  
  const browserCompatCssPath = path.resolve(__dirname, '../src/components/common/BrowserCompatibility.css');
  
  if (!fs.existsSync(browserCompatCssPath)) {
    console.error('❌ Fichier BrowserCompatibility.css non trouvé!');
    return false;
  }
  
  const cssContent = fs.readFileSync(browserCompatCssPath, 'utf8');
  
  // Vérifier la présence des polyfills essentiels
  const checks = {
    'Styles standard (Firefox)': cssContent.includes('scrollbar-width'),
    'Styles standard (Couleurs)': cssContent.includes('scrollbar-color'),
    'Fallback WebKit (Chrome/Safari)': cssContent.includes('::-webkit-scrollbar'),
    'Fallback pour les barres de défilement': cssContent.includes('::-webkit-scrollbar-thumb'),
    'Support des classes utilitaires': cssContent.includes('.custom-scrollbar'),
    'Support du mode sombre': cssContent.includes('.dark-scrollbar'),
  };
  
  let allPassed = true;
  
  console.log('Résultats de la validation CSS:');
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Vérifie les navigateurs supportés selon browserslist
 */
function checkBrowsersList(): string[] {
  console.log('\nVérification de la configuration browserslist...');
  
  try {
    // Vérifier package.json ou .browserslistrc
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (packageJson.browserslist) {
        console.log('✅ Configuration browserslist trouvée dans package.json');
        return packageJson.browserslist;
      }
    }
    
    // Chercher un fichier .browserslistrc
    const browserslistPath = path.resolve(__dirname, '../.browserslistrc');
    if (fs.existsSync(browserslistPath)) {
      console.log('✅ Fichier .browserslistrc trouvé');
      const content = fs.readFileSync(browserslistPath, 'utf8');
      return content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    }
    
    console.warn('⚠️ Aucune configuration browserslist trouvée');
    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la lecture de la configuration browserslist:', error);
    return [];
  }
}

/**
 * Analyse la compatibilité navigateur du projet
 */
export async function checkBrowserCompatibility(): Promise<boolean> {
  console.log('🌐 Vérification de la compatibilité navigateur...\n');
  
  // 1. Vérifier les styles CSS
  const cssCompatible = checkCSSCompatibility();
  
  // 2. Vérifier browserslist
  const browsersList = checkBrowsersList();
  if (browsersList.length > 0) {
    console.log('\nNavigateurs supportés selon browserslist:');
    browsersList.forEach(browser => console.log(`  • ${browser}`));
  }
  
  // 3. Générer la matrice de compatibilité
  console.log('\nMatrice de compatibilité des fonctionnalités:');
  
  const compatMatrix: BrowserCompatInfo[] = [
    { 
      browser: 'Chrome',
      version: '121+',
      status: 'Compatible',
      notes: 'Support complet des fonctionnalités'
    },
    { 
      browser: 'Chrome',
      version: '<121',
      status: 'Partiellement compatible',
      notes: 'Pas de support natif pour scrollbar-width/color, fallbacks utilisés'
    },
    { 
      browser: 'Firefox',
      version: '80+',
      status: 'Compatible',
      notes: 'Support complet des fonctionnalités'
    },
    { 
      browser: 'Safari',
      version: 'Tous',
      status: 'Partiellement compatible',
      notes: 'Pas de support natif pour scrollbar-width/color, fallbacks utilisés'
    },
    { 
      browser: 'Edge',
      version: '120+',
      status: 'Compatible',
      notes: 'Support complet des fonctionnalités'
    },
    { 
      browser: 'Edge',
      version: '<120',
      status: 'Partiellement compatible',
      notes: 'Pas de support natif pour scrollbar-width/color, fallbacks utilisés'
    },
    { 
      browser: 'iOS Safari',
      version: 'Tous',
      status: 'Partiellement compatible',
      notes: 'Limitations WebGL pour les effets météo intensifs'
    },
    { 
      browser: 'Android Chrome',
      version: '110+',
      status: 'Compatible',
      notes: 'Support complet sauf pour les effets météo les plus intensifs'
    }
  ];
  
  console.table(compatMatrix);
  
  // 4. Conclusions et recommandations
  console.log('\nConclusions:');
  if (cssCompatible) {
    console.log('✅ Styles CSS correctement adaptés pour la compatibilité multi-navigateurs');
  } else {
    console.warn('⚠️ Problèmes potentiels avec les styles CSS pour certains navigateurs');
  }
  
  console.log('\nRecommandations:');
  console.log('• Tester manuellement sur Chrome, Firefox, Safari et Edge avant déploiement');
  console.log('• Vérifier la détection adaptative de capacités GPU sur les appareils mobiles');
  console.log('• S\'assurer que le fallback CPU fonctionne correctement sur les anciens navigateurs');
  
  return cssCompatible;
}

// Exécuter si appelé directement
if (require.main === module) {
  checkBrowserCompatibility()
    .then(result => {
      if (result) {
        console.log('\n✅ Vérification de compatibilité navigateur terminée avec succès');
      } else {
        console.warn('\n⚠️ Vérification terminée avec des avertissements');
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur lors de la vérification de compatibilité:', error);
      process.exit(1);
    });
}
