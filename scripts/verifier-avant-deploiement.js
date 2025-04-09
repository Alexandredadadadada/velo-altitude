/**
 * Script de vérification complète avant déploiement
 * Vérifie tous les composants critiques de l'application Velo-Altitude
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Tests à effectuer avant déploiement
async function verifierAvantDeploiement() {
  console.log('=== VÉRIFICATION PRÉ-DÉPLOIEMENT ===');
  console.log('🕒 Date: ' + new Date().toISOString());
  
  let allTestsPassed = true;
  const results = {
    database: { success: false, details: [] },
    files: { success: false, details: [] },
    environment: { success: false, details: [] }
  };

  try {
    // 1. Vérification de la base de données
    console.log('\n📊 VÉRIFICATION DE LA BASE DE DONNÉES');
    const dbResult = await verifierBaseDeDonnees();
    results.database = dbResult;
    if (!dbResult.success) allTestsPassed = false;

    // 2. Vérification des fichiers essentiels
    console.log('\n📁 VÉRIFICATION DES FICHIERS ESSENTIELS');
    const filesResult = await verifierFichiersEssentiels();
    results.files = filesResult;
    if (!filesResult.success) allTestsPassed = false;

    // 3. Vérification des variables d'environnement
    console.log('\n🔐 VÉRIFICATION DES VARIABLES D\'ENVIRONNEMENT');
    const envResult = await verifierEnvironnement();
    results.environment = envResult;
    if (!envResult.success) allTestsPassed = false;

    // Rapport final
    console.log('\n===== RAPPORT FINAL =====');
    console.log(`Base de données: ${results.database.success ? '✅ OK' : '❌ PROBLÈMES DÉTECTÉS'}`);
    console.log(`Fichiers: ${results.files.success ? '✅ OK' : '❌ PROBLÈMES DÉTECTÉS'}`);
    console.log(`Environnement: ${results.environment.success ? '✅ OK' : '❌ PROBLÈMES DÉTECTÉS'}`);
    
    console.log('\n🏁 RÉSULTAT FINAL:');
    if (allTestsPassed) {
      console.log('✅ TOUS LES TESTS SONT PASSÉS! Le site est prêt à être déployé.');
    } else {
      console.log('❌ CERTAINS TESTS ONT ÉCHOUÉ. Veuillez corriger les problèmes avant le déploiement.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    allTestsPassed = false;
  }

  return { success: allTestsPassed, results };
}

// Test de la base de données
async function verifierBaseDeDonnees() {
  const dbName = process.env.MONGODB_DB_NAME || 'velo-altitude';
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const result = { success: false, details: [] };

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log(`✅ Connexion réussie à MongoDB`);
    result.details.push('Connexion MongoDB: OK');

    // Vérifier l'existence de la base de données
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    const dbExists = dbs.databases.some(db => db.name === dbName);
    
    if (dbExists) {
      console.log(`✅ Base de données "${dbName}" trouvée`);
      result.details.push(`Base "${dbName}": OK`);
      
      // Vérifier les collections essentielles
      const db = client.db(dbName);
      const collections = await db.listCollections().toArray();
      const colsExists = collections.some(c => c.name === 'cols');
      
      if (colsExists) {
        const colsCollection = db.collection('cols');
        const colsCount = await colsCollection.countDocuments();
        console.log(`✅ Collection "cols" trouvée avec ${colsCount} documents`);
        result.details.push(`Collection "cols": ${colsCount} documents`);
        
        // Vérifier la structure des données
        if (colsCount > 0) {
          const sample = await colsCollection.find().limit(1).toArray();
          const col = sample[0];
          
          // Vérifier les champs essentiels
          const hasRequiredFields = col.name && col.elevation && col.coordinates;
          const has3DData = col.visualization3D !== undefined;
          
          if (hasRequiredFields) {
            console.log('✅ Structure des cols: Les champs requis sont présents');
            result.details.push('Structure des cols: OK');
          } else {
            console.log('❌ Structure des cols: Certains champs requis sont manquants');
            result.details.push('Structure des cols: ERREUR - Champs manquants');
            return { success: false, details: result.details };
          }
          
          if (has3DData) {
            console.log('✅ Données 3D: Présentes');
            result.details.push('Données 3D: OK');
          } else {
            console.log('⚠️ Données 3D: Absentes dans certains cols');
            result.details.push('Données 3D: Avertissement - Absentes dans certains cols');
            // On ne fait pas échouer le test pour ça, mais on prévient
          }
        }
      } else {
        console.log('❌ Collection "cols" non trouvée');
        result.details.push('Collection "cols": ERREUR - Non trouvée');
        return { success: false, details: result.details };
      }
    } else {
      console.log(`❌ Base de données "${dbName}" non trouvée`);
      result.details.push(`Base "${dbName}": ERREUR - Non trouvée`);
      return { success: false, details: result.details };
    }
    
    result.success = true;
    return result;
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error.message);
    result.details.push(`Erreur de connexion: ${error.message}`);
    return { success: false, details: result.details };
  } finally {
    if (client) await client.close();
  }
}

// Vérification des fichiers essentiels
async function verifierFichiersEssentiels() {
  const result = { success: false, details: [] };
  const fichiersEssentiels = [
    { path: 'package.json', description: 'Fichier de configuration du projet' },
    { path: '.env', description: 'Variables d\'environnement' },
    { path: 'netlify.toml', description: 'Configuration Netlify' },
    { path: 'src/index.js', description: 'Point d\'entrée de l\'application' },
    { path: 'src/services/database/database-manager.js', description: 'Gestionnaire de base de données' },
    { path: 'public/index.html', description: 'Page HTML principale' }
  ];
  
  let allFilesExist = true;
  
  for (const file of fichiersEssentiels) {
    try {
      await fs.access(path.resolve(__dirname, '..', file.path));
      console.log(`✅ ${file.description} (${file.path}): Présent`);
      result.details.push(`${file.path}: OK`);
    } catch (error) {
      console.log(`❌ ${file.description} (${file.path}): MANQUANT`);
      result.details.push(`${file.path}: ERREUR - Fichier manquant`);
      allFilesExist = false;
    }
  }
  
  result.success = allFilesExist;
  return result;
}

// Vérification des variables d'environnement
async function verifierEnvironnement() {
  const result = { success: false, details: [] };
  const variablesRequises = [
    'MONGODB_URI',
    'MONGODB_DB_NAME',
    'NODE_ENV'
  ];
  
  const variablesOptionnelles = [
    'MAPBOX_TOKEN',
    'OPENWEATHER_API_KEY',
    'REACT_APP_API_URL'
  ];
  
  let allRequiredExist = true;
  
  console.log('Variables d\'environnement requises:');
  for (const variable of variablesRequises) {
    if (process.env[variable]) {
      const value = variable.includes('URI') || variable.includes('KEY') || variable.includes('SECRET') 
        ? '********' 
        : process.env[variable];
      console.log(`✅ ${variable}: Présente (${value})`);
      result.details.push(`${variable}: OK`);
    } else {
      console.log(`❌ ${variable}: MANQUANTE`);
      result.details.push(`${variable}: ERREUR - Variable manquante`);
      allRequiredExist = false;
    }
  }
  
  console.log('\nVariables d\'environnement optionnelles:');
  for (const variable of variablesOptionnelles) {
    if (process.env[variable]) {
      console.log(`✅ ${variable}: Présente`);
      result.details.push(`${variable}: OK`);
    } else {
      console.log(`⚠️ ${variable}: Non définie (optionnelle)`);
      result.details.push(`${variable}: Avertissement - Non définie`);
    }
  }
  
  result.success = allRequiredExist;
  return result;
}

// Exécuter les vérifications
verifierAvantDeploiement().catch(console.error);
