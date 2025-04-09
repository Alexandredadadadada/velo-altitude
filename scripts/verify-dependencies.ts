/**
 * verify-dependencies.ts
 * Script de vérification des dépendances avant déploiement
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface DependencyCheck {
  name: string;
  expected: string;
  actual: string;
  status: 'OK' | 'WARNING' | 'ERROR';
  notes: string;
}

/**
 * Vérifie les versions des dépendances critiques
 */
async function checkCriticalDependencies(): Promise<DependencyCheck[]> {
  console.log('Vérification des dépendances critiques...');
  
  const results: DependencyCheck[] = [];
  
  try {
    // Charger le package.json du client
    const clientPackagePath = path.resolve(__dirname, '../client/package.json');
    const packageJson = JSON.parse(fs.readFileSync(clientPackagePath, 'utf8'));
    
    // Dépendances critiques avec leurs versions attendues
    const criticalDependencies = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      '@react-three/drei': '^9.88.0',
      '@react-three/fiber': '^8.15.11',
      '@mui/material': '^5.15.11',
      '@mui/icons-material': '^5.15.11',
      '@emotion/react': '^11.11.3',
      '@emotion/styled': '^11.11.0'
    };
    
    // Vérifier chaque dépendance
    for (const [name, expectedVersion] of Object.entries(criticalDependencies)) {
      const actualVersion = packageJson.dependencies[name] || 'Non trouvé';
      
      // Comparer les versions en ignorant les préfixes ^ et ~
      const expectedClean = expectedVersion.replace(/[\^~]/, '');
      const actualClean = actualVersion.replace(/[\^~]/, '');
      
      let status: 'OK' | 'WARNING' | 'ERROR' = 'OK';
      let notes = '';
      
      if (actualVersion === 'Non trouvé') {
        status = 'ERROR';
        notes = 'Dépendance manquante';
      } else if (!actualClean.includes(expectedClean)) {
        // Version différente, déterminer si c'est une version majeure différente
        const expectedMajor = expectedClean.split('.')[0];
        const actualMajor = actualClean.split('.')[0];
        
        if (expectedMajor !== actualMajor) {
          status = 'ERROR';
          notes = `Version majeure différente (${expectedMajor} vs ${actualMajor})`;
        } else {
          status = 'WARNING';
          notes = 'Version mineure différente, à vérifier';
        }
      } else {
        notes = 'Version compatible';
      }
      
      results.push({
        name,
        expected: expectedVersion,
        actual: actualVersion,
        status,
        notes
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des dépendances:', error);
    results.push({
      name: 'package.json',
      expected: 'Fichier valide',
      actual: 'Erreur',
      status: 'ERROR',
      notes: `Erreur lors de la lecture: ${error}`
    });
  }
  
  return results;
}

/**
 * Vérifie les conflits de peer dependencies
 */
async function checkPeerDependencies(): Promise<boolean> {
  console.log('\nVérification des conflits de peer dependencies...');
  
  try {
    // Exécuter npm ls pour voir les conflits de peer dependencies
    const { stdout, stderr } = await execAsync('npm ls --json', { cwd: path.resolve(__dirname, '../client') });
    
    // Analyser la sortie pour chercher les messages d'erreur concernant les peer dependencies
    const peerErrors = stderr.includes('peer dep missing') || 
                      stdout.includes('peerDependencies') ||
                      stdout.includes('UNMET PEER DEPENDENCY');
    
    if (peerErrors) {
      console.warn('⚠️ Conflits potentiels de peer dependencies détectés');
      console.log('Pour plus de détails, exécuter: npm ls');
      return false;
    } else {
      console.log('✅ Aucun conflit de peer dependency détecté');
      return true;
    }
  } catch (error) {
    // npm ls peut échouer en cas de conflit, ce qui est normal
    // Analyser l'erreur pour voir si c'est un problème de peer dependency
    if (error.stderr && (error.stderr.includes('peer dep missing') || error.stderr.includes('UNMET PEER DEPENDENCY'))) {
      console.warn('⚠️ Conflits de peer dependencies détectés:');
      
      // Extraire et afficher les lignes pertinentes
      const lines = error.stderr.split('\n').filter(line => 
        line.includes('peer dep missing') || 
        line.includes('UNMET PEER DEPENDENCY')
      );
      
      lines.forEach(line => console.log(`  ${line.trim()}`));
      return false;
    } else {
      console.error('❌ Erreur lors de la vérification des peer dependencies:', error);
      return false;
    }
  }
}

/**
 * Vérifie la compatibilité des versions Node et npm
 */
async function checkNodeEnvironment(): Promise<boolean> {
  console.log('\nVérification de l\'environnement Node.js...');
  
  try {
    // Vérifier la version de Node.js
    const { stdout: nodeVersion } = await execAsync('node --version');
    const cleanNodeVersion = nodeVersion.trim().replace('v', '');
    
    // Vérifier la version de npm
    const { stdout: npmVersion } = await execAsync('npm --version');
    const cleanNpmVersion = npmVersion.trim();
    
    console.log(`Node.js version: ${cleanNodeVersion}`);
    console.log(`npm version: ${cleanNpmVersion}`);
    
    // Versions minimales requises selon le PROJECT_STATUS.md
    const minNodeVersion = '16.14.0';
    const minNpmVersion = '8.0.0';
    
    // Comparer les versions
    const nodeCompatible = compareVersions(cleanNodeVersion, minNodeVersion) >= 0;
    const npmCompatible = compareVersions(cleanNpmVersion, minNpmVersion) >= 0;
    
    if (nodeCompatible && npmCompatible) {
      console.log('✅ Versions Node.js et npm compatibles');
      return true;
    } else {
      if (!nodeCompatible) {
        console.error(`❌ Version Node.js incompatible: ${cleanNodeVersion} (min: ${minNodeVersion})`);
      }
      if (!npmCompatible) {
        console.error(`❌ Version npm incompatible: ${cleanNpmVersion} (min: ${minNpmVersion})`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de l\'environnement Node.js:', error);
    return false;
  }
}

/**
 * Compare deux versions semantiques
 * Retourne 1 si v1 > v2, 0 si v1 = v2, -1 si v1 < v2
 */
function compareVersions(v1: string, v2: string): number {
  const v1Parts = v1.split('.').map(Number);
  const v2Parts = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
}

/**
 * Fonction principale de vérification des dépendances
 */
export async function verifyDependencies(): Promise<boolean> {
  console.log('📦 Vérification des dépendances...\n');
  
  // 1. Vérifier les dépendances critiques
  const dependencyChecks = await checkCriticalDependencies();
  
  console.table(dependencyChecks);
  
  const hasDependencyErrors = dependencyChecks.some(check => check.status === 'ERROR');
  const hasDependencyWarnings = dependencyChecks.some(check => check.status === 'WARNING');
  
  if (hasDependencyErrors) {
    console.error('❌ Erreurs détectées dans les dépendances critiques');
  } else if (hasDependencyWarnings) {
    console.warn('⚠️ Avertissements détectés dans les dépendances critiques');
  } else {
    console.log('✅ Toutes les dépendances critiques sont compatibles');
  }
  
  // 2. Vérifier les conflits de peer dependencies
  const peerDepsOk = await checkPeerDependencies();
  
  // 3. Vérifier l'environnement Node.js
  const nodeEnvOk = await checkNodeEnvironment();
  
  // Résultat global
  const allChecksOk = !hasDependencyErrors && peerDepsOk && nodeEnvOk;
  
  return allChecksOk;
}

// Exécuter si appelé directement
if (require.main === module) {
  verifyDependencies()
    .then(result => {
      if (result) {
        console.log('\n✅ Vérification des dépendances terminée avec succès');
      } else {
        console.warn('\n⚠️ Vérification des dépendances terminée avec des problèmes');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Erreur lors de la vérification des dépendances:', error);
      process.exit(1);
    });
}
