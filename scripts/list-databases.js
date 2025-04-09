/**
 * Script pour lister et explorer les bases de données MongoDB
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";

async function listDatabases() {
  let client = null;
  
  try {
    console.log('🔍 Exploration des bases de données MongoDB...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    // Lister les bases de données
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\n📊 Bases de données disponibles:');
    console.log('=================================');
    
    // Trier les bases de données par taille
    const sortedDbs = dbs.databases.sort((a, b) => b.sizeOnDisk - a.sizeOnDisk);
    
    for (const db of sortedDbs) {
      console.log(`📁 ${db.name} (Taille: ${formatBytes(db.sizeOnDisk)})`);
      
      // Si la base de données commence par "velo", explorons-la
      if (db.name.startsWith('velo')) {
        const database = client.db(db.name);
        
        // Lister les collections
        const collections = await database.listCollections().toArray();
        console.log(`   Collections dans ${db.name}:`);
        
        for (const collection of collections) {
          const count = await database.collection(collection.name).countDocuments();
          console.log(`   - ${collection.name} (${count} documents)`);
          
          // Si c'est la collection "cols", affichons un résumé
          if (collection.name === 'cols') {
            const colsCount = await database.collection('cols').countDocuments();
            console.log(`     * ${colsCount} cols au total`);
            
            // Afficher les 5 premiers cols
            if (colsCount > 0) {
              const cols = await database.collection('cols').find({}, { projection: { name: 1 } }).limit(5).toArray();
              console.log(`     * Exemples: ${cols.map(c => c.name).join(', ')}${colsCount > 5 ? ', ...' : ''}`);
            }
          }
        }
        console.log(''); // Ligne vide pour séparer
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
listDatabases()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
