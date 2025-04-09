/**
 * Script pour vérifier les collections et documents dans MongoDB
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo_altitude?retryWrites=true&w=majority";

async function checkMongoDB() {
  let client = null;
  
  try {
    console.log('🔍 Vérification de la base de données MongoDB...');
    
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
      console.log(` - ${db.name} (${db.sizeOnDisk} bytes)`);
    });
    
    // Se connecter à la base velo_altitude
    const db = client.db('velo_altitude');
    
    // Lister les collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Collections dans velo_altitude:');
    collections.forEach(collection => {
      console.log(` - ${collection.name}`);
    });
    
    // Compter les documents dans la collection cols
    const colsCollection = db.collection('cols');
    const count = await colsCollection.countDocuments();
    console.log(`\n🚵 Nombre de cols dans la collection: ${count}`);
    
    if (count > 0) {
      // Afficher un exemple de document
      const sample = await colsCollection.findOne({});
      console.log('\n📝 Exemple de document col:');
      console.log(JSON.stringify(sample, null, 2));
      
      // Lister tous les noms de cols
      const colNames = await colsCollection.find({}, { projection: { name: 1 } }).toArray();
      console.log('\n📋 Liste des noms de cols (jusqu\'à 10):');
      colNames.slice(0, 10).forEach((col, index) => {
        console.log(` ${index+1}. ${col.name}`);
      });
      
      if (colNames.length > 10) {
        console.log(`   ... et ${colNames.length - 10} autres cols`);
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

// Exécuter la fonction
checkMongoDB()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
