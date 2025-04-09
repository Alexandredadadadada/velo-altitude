/**
 * Script simplifié pour trouver les bases de données volumineuses
 * et identifier clairement les problèmes de nommage (tirets vs underscores)
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

// Fonction pour formater la taille
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

async function trouverGrandesDB() {
  console.log('=== RECHERCHE DES BASES DE DONNÉES VOLUMINEUSES ===');
  
  // Essayer d'abord la connexion au serveur MongoDB Atlas
  let client;
  let connected = false;
  
  const uris = [
    // URI avec velo-altitude (tirets)
    "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority",
    // URI avec velo_altitude (underscores)
    "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo_altitude?retryWrites=true&w=majority",
    // URI générique Atlas
    "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority",
    // URI locale possible
    "mongodb://localhost:27017"
  ];
  
  for (const uri of uris) {
    try {
      console.log(`\nTentative de connexion à: ${uri.split('@')[1]}`);
      client = new MongoClient(uri);
      await client.connect();
      console.log('✓ Connexion réussie !');
      connected = true;
      break;
    } catch (err) {
      console.log(`✗ Échec: ${err.message}`);
      if (client) {
        await client.close();
      }
    }
  }
  
  if (!connected) {
    console.error("❌ Impossible de se connecter à MongoDB. Vérifiez les informations de connexion.");
    return;
  }
  
  try {
    // Récupérer la liste des bases de données
    const adminDb = client.db('admin');
    const dbsList = await adminDb.admin().listDatabases();
    
    console.log('\n=== LISTE DE TOUTES LES BASES DE DONNÉES ===');
    console.log('Nom'.padEnd(30) + 'Taille'.padEnd(15) + 'Notes');
    console.log('─'.repeat(60));
    
    // Trier par taille (plus grande en premier)
    dbsList.databases.sort((a, b) => b.sizeOnDisk - a.sizeOnDisk);
    
    let foundBigDB = false;
    
    for (const db of dbsList.databases) {
      let notes = '';
      
      // Ajouter des notes pour les bases liées à velo
      if (db.name.includes('velo')) {
        if (db.name === 'velo-altitude') {
          notes = 'Base avec tirets (format recommandé)';
        } else if (db.name === 'velo_altitude') {
          notes = 'Base avec underscores (ancien format)';
        } else {
          notes = 'Autre base liée à velo';
        }
      }
      
      // Marquer les grandes bases
      if (db.sizeOnDisk > 500 * 1024 * 1024) {
        notes += notes ? ' - GRANDE BASE!' : 'GRANDE BASE!';
        foundBigDB = true;
      }
      
      console.log(db.name.padEnd(30) + formatSize(db.sizeOnDisk).padEnd(15) + notes);
    }
    
    if (!foundBigDB) {
      console.log('\n✓ Aucune base de données de plus de 500 MB trouvée.');
    }
    
    // Vérifier spécifiquement les bases velo-altitude et velo_altitude
    const hasVeloAltitude = dbsList.databases.some(db => db.name === 'velo-altitude');
    const hasVeloAltitudeUnderscore = dbsList.databases.some(db => db.name === 'velo_altitude');
    
    console.log('\n=== DÉTAILS DES BASES VELO ===');
    
    // Examiner les bases velo en détail
    for (const dbInfo of dbsList.databases) {
      if (dbInfo.name.includes('velo')) {
        console.log(`\nBase: ${dbInfo.name} (${formatSize(dbInfo.sizeOnDisk)})`);
        
        const database = client.db(dbInfo.name);
        try {
          const collections = await database.listCollections().toArray();
          
          if (collections.length === 0) {
            console.log('  → Aucune collection');
            continue;
          }
          
          console.log('  Collections:');
          for (const coll of collections) {
            try {
              const count = await database.collection(coll.name).countDocuments();
              console.log(`  - ${coll.name}: ${count} documents`);
              
              // Si c'est la collection "cols", regarder un échantillon
              if (coll.name === 'cols' && count > 0) {
                const sample = await database.collection(coll.name).find().limit(1).toArray();
                if (sample.length > 0) {
                  console.log(`    Premier col: "${sample[0].name}" (altitude: ${sample[0].elevation}m)`);
                }
              }
            } catch (err) {
              console.log(`  - ${coll.name}: Erreur - ${err.message}`);
            }
          }
        } catch (err) {
          console.log(`  Erreur: ${err.message}`);
        }
      }
    }
    
    // Recommandations finales
    console.log('\n=== RECOMMANDATIONS ===');
    if (hasVeloAltitude && hasVeloAltitudeUnderscore) {
      console.log('⚠️ Les deux bases "velo-altitude" et "velo_altitude" existent.');
      console.log('   → Cela peut causer des confusions. Utilisez fix-database-name.js pour résoudre ce problème.');
    } else if (hasVeloAltitude) {
      console.log('✓ Configuration correcte: La base "velo-altitude" (avec tirets) existe.');
      console.log('   → Utilisez ce format dans tous vos fichiers de connexion.');
    } else if (hasVeloAltitudeUnderscore) {
      console.log('⚠️ Attention: Seule la base "velo_altitude" (avec underscores) existe.');
      console.log('   → Vous devriez standardiser vers le format avec tirets.');
    }
    
  } catch (err) {
    console.error("❌ Erreur lors de l'inspection des bases de données:", err);
  } finally {
    await client.close();
    console.log('\nConnexion fermée');
  }
}

// Exécuter la fonction
trouverGrandesDB().catch(console.error);
