/**
 * Script pour standardiser les bases de données MongoDB
 * - Conservation de velo-altitude (avec les cols enrichis)
 * - Suppression de velo_altitude (ancienne base de données)
 * - Mise à jour des références dans les fichiers de configuration
 */

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const readline = require('readline');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";

// Configuration
const CONFIG = {
  databaseToKeep: "velo-altitude",
  databaseToRemove: "velo_altitude",
  scriptPaths: [
    path.join(__dirname, 'regenerate-profiles-direct.js'),
    path.join(__dirname, 'cleanup-database.js'),
    path.join(__dirname, 'list-databases.js'),
    path.join(__dirname, 'optimized-cols.js'),
    path.join(__dirname, 'remove-problem-cols.js'),
    path.join(__dirname, 'enrich-cols-data.js')
  ],
  configPaths: [
    path.join(__dirname, '..', '.env')
  ]
};

// Fonction pour demander une confirmation à l'utilisateur
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
    });
  });
}

/**
 * Standardise les bases de données MongoDB
 * - Conserve velo-altitude
 * - Supprime velo_altitude
 */
async function standardizeDatabases() {
  let client = null;
  
  try {
    console.log('=== STANDARDISATION DES BASES DE DONNÉES ===');
    console.log(`🚀 Base de données à conserver: ${CONFIG.databaseToKeep}`);
    console.log(`🗑️ Base de données à supprimer: ${CONFIG.databaseToRemove}`);
    
    // Connexion à MongoDB
    console.log('\n📡 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    // Vérifier l'existence des bases de données
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    const dbNames = dbs.databases.map(db => db.name);
    
    if (!dbNames.includes(CONFIG.databaseToKeep)) {
      console.error(`❌ La base de données à conserver (${CONFIG.databaseToKeep}) n'existe pas !`);
      return;
    }
    
    if (!dbNames.includes(CONFIG.databaseToRemove)) {
      console.log(`ℹ️ La base de données à supprimer (${CONFIG.databaseToRemove}) n'existe pas déjà.`);
    } else {
      // Vérifier si la base à supprimer contient des données uniques
      const dbToRemove = client.db(CONFIG.databaseToRemove);
      const collectionsToRemove = await dbToRemove.listCollections().toArray();
      
      if (collectionsToRemove.length > 0) {
        console.log(`\n⚠️ La base de données ${CONFIG.databaseToRemove} contient ${collectionsToRemove.length} collection(s):`);
        for (const collection of collectionsToRemove) {
          console.log(`   - ${collection.name}`);
          
          const collectionToRemove = dbToRemove.collection(collection.name);
          const count = await collectionToRemove.countDocuments();
          console.log(`     (${count} documents)`);
        }
        
        // Demander confirmation
        const confirmation = await askForConfirmation(`\n⚠️ Confirmer la suppression de la base de données ${CONFIG.databaseToRemove} ? (y/n): `);
        
        if (!confirmation) {
          console.log('❌ Opération annulée.');
          return;
        }
        
        // Supprimer la base de données
        console.log(`\n🗑️ Suppression de la base de données ${CONFIG.databaseToRemove}...`);
        await dbToRemove.dropDatabase();
        console.log(`✅ Base de données ${CONFIG.databaseToRemove} supprimée avec succès.`);
      } else {
        console.log(`\nℹ️ La base de données ${CONFIG.databaseToRemove} est vide, suppression...`);
        await dbToRemove.dropDatabase();
        console.log(`✅ Base de données vide ${CONFIG.databaseToRemove} supprimée.`);
      }
    }
    
    // Répertorier les bases de données restantes
    const updatedDbs = await adminDb.admin().listDatabases();
    console.log('\n=== BASES DE DONNÉES ACTUELLES ===');
    for (const db of updatedDbs.databases) {
      console.log(`📦 ${db.name} (${db.sizeOnDisk} bytes)`);
    }
    
    // Vérifier le contenu de la base de données conservée
    const dbToKeep = client.db(CONFIG.databaseToKeep);
    const collectionsToKeep = await dbToKeep.listCollections().toArray();
    
    console.log(`\n=== CONTENU DE LA BASE DE DONNÉES ${CONFIG.databaseToKeep} ===`);
    for (const collection of collectionsToKeep) {
      const collectionToKeep = dbToKeep.collection(collection.name);
      const count = await collectionToKeep.countDocuments();
      console.log(`📚 ${collection.name}: ${count} documents`);
      
      if (collection.name === 'cols') {
        const colsWithProfile = await collectionToKeep.countDocuments({
          'elevation_profile': { $exists: true, $ne: null }
        });
        console.log(`   📈 ${colsWithProfile} cols avec profil d'élévation`);
        
        const colsWith3D = await collectionToKeep.countDocuments({
          'visualization3D': { $exists: true, $ne: null }
        });
        console.log(`   🏔️ ${colsWith3D} cols avec données de visualisation 3D`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (client) {
      console.log('\nFermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

/**
 * Met à jour les références à la base de données dans les fichiers de configuration
 */
async function updateDatabaseReferences() {
  console.log('\n=== MISE À JOUR DES RÉFÉRENCES DE BASE DE DONNÉES ===');
  
  const patterns = [
    { search: new RegExp(`mongodb\\+srv://[^/]+/${CONFIG.databaseToRemove}`, 'g'), replace: `mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/${CONFIG.databaseToKeep}` },
    { search: new RegExp(`dbName\\s*=\\s*['"']${CONFIG.databaseToRemove}['"']`, 'g'), replace: `dbName = "${CONFIG.databaseToKeep}"` },
    { search: new RegExp(`dbName:\\s*['"']${CONFIG.databaseToRemove}['"']`, 'g'), replace: `dbName: "${CONFIG.databaseToKeep}"` },
    { search: new RegExp(`"${CONFIG.databaseToRemove}"`, 'g'), replace: `"${CONFIG.databaseToKeep}"` }
  ];
  
  // Mettre à jour les scripts
  console.log('📝 Mise à jour des scripts...');
  
  for (const filePath of CONFIG.scriptPaths) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      for (const pattern of patterns) {
        if (pattern.search.test(content)) {
          content = content.replace(pattern.search, pattern.replace);
          modified = true;
        }
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fichier mis à jour: ${path.basename(filePath)}`);
      } else {
        console.log(`ℹ️ Aucune modification nécessaire: ${path.basename(filePath)}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`ℹ️ Fichier non trouvé: ${path.basename(filePath)}`);
      } else {
        console.error(`❌ Erreur lors de la mise à jour de ${path.basename(filePath)}:`, error.message);
      }
    }
  }
  
  // Mettre à jour les fichiers de configuration
  console.log('\n📝 Mise à jour des fichiers de configuration...');
  
  for (const filePath of CONFIG.configPaths) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      // Pour les fichiers .env, chercher MONGODB_URI
      if (path.extname(filePath) === '.env') {
        const envPattern = new RegExp(`MONGODB_URI\\s*=\\s*mongodb\\+srv://[^/]+/${CONFIG.databaseToRemove}`, 'g');
        if (envPattern.test(content)) {
          content = content.replace(envPattern, `MONGODB_URI=mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/${CONFIG.databaseToKeep}`);
          modified = true;
        }
      } else {
        // Pour les autres fichiers, utiliser les patterns standard
        for (const pattern of patterns) {
          if (pattern.search.test(content)) {
            content = content.replace(pattern.search, pattern.replace);
            modified = true;
          }
        }
      }
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fichier de configuration mis à jour: ${path.basename(filePath)}`);
      } else {
        console.log(`ℹ️ Aucune modification nécessaire: ${path.basename(filePath)}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`ℹ️ Fichier de configuration non trouvé: ${path.basename(filePath)}`);
      } else {
        console.error(`❌ Erreur lors de la mise à jour de ${path.basename(filePath)}:`, error.message);
      }
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    // Étape 1: Standardiser les bases de données
    await standardizeDatabases();
    
    // Étape 2: Mettre à jour les références dans les fichiers
    await updateDatabaseReferences();
    
    console.log('\n=== STANDARDISATION TERMINÉE ===');
    console.log('✅ Toutes les opérations ont été effectuées avec succès.');
    console.log(`✅ La base de données standardisée est désormais: ${CONFIG.databaseToKeep}`);
    console.log('✅ Tous les scripts ont été mis à jour pour utiliser cette base de données.');
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la standardisation:', error);
  }
}

// Exécuter la fonction principale
main()
  .then(() => console.log('\nScript terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
