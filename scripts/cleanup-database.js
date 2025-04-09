/**
 * Script pour nettoyer les bases de données obsolètes
 * Ce script supprime la base de données velo_altitude qui n'est plus utilisée
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const readline = require('readline');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";

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

async function cleanupDatabase() {
  let client = null;
  
  try {
    console.log('🧹 Nettoyage des bases de données obsolètes...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    // Lister les bases de données
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\n📊 Bases de données disponibles:');
    dbs.databases.forEach(db => {
      console.log(` - ${db.name} (${formatBytes(db.sizeOnDisk)})`);
    });
    
    // Vérifier si la base de données velo_altitude existe
    const dbToDelete = 'velo_altitude';
    const dbExists = dbs.databases.some(db => db.name === dbToDelete);
    
    if (!dbExists) {
      console.log(`\n⚠️ La base de données ${dbToDelete} n'existe pas. Rien à supprimer.`);
      return;
    }
    
    // Se connecter à la base à supprimer pour voir son contenu
    console.log(`\n🔍 Contenu de la base de données ${dbToDelete} à supprimer:`);
    const dbToBeDeleted = client.db(dbToDelete);
    const collections = await dbToBeDeleted.listCollections().toArray();
    
    // Afficher le contenu de chaque collection
    for (const collection of collections) {
      const count = await dbToBeDeleted.collection(collection.name).countDocuments();
      console.log(` - Collection ${collection.name}: ${count} documents`);
    }
    
    // Demander confirmation
    const confirmation = await askForConfirmation(`\n⚠️ ATTENTION: Êtes-vous sûr de vouloir supprimer définitivement la base de données ${dbToDelete} ? Cette action est irréversible. (y/n): `);
    
    if (!confirmation) {
      console.log('❌ Opération annulée. Aucune base de données n\'a été supprimée.');
      return;
    }
    
    // Supprimer la base de données
    console.log(`\n🗑️ Suppression de la base de données ${dbToDelete} en cours...`);
    await dbToBeDeleted.dropDatabase();
    console.log(`✅ Base de données ${dbToDelete} supprimée avec succès!`);
    
    // Vérifier que la suppression a bien eu lieu
    const updatedDbs = await adminDb.admin().listDatabases();
    const stillExists = updatedDbs.databases.some(db => db.name === dbToDelete);
    
    if (stillExists) {
      console.log(`⚠️ La base de données ${dbToDelete} existe toujours. La suppression a peut-être échoué.`);
    } else {
      console.log(`🎉 Confirmation: La base de données ${dbToDelete} n'existe plus.`);
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

// Fonction pour formater les octets en une chaîne lisible
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Exécuter la fonction
cleanupDatabase()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
