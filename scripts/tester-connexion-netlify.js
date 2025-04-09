/**
 * Script pour tester la connexion à MongoDB avec les mêmes paramètres que Netlify
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function testerConnexion() {
  // Récupérer les variables d'environnement (comme Netlify le ferait)
  const dbName = process.env.MONGODB_DB_NAME || 'velo-altitude';
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";
  
  console.log('=== TEST DE CONNEXION (CONFIGURATION NETLIFY) ===');
  console.log(`📦 Base de données cible: ${dbName}`);
  console.log(`🔑 URI: ${uri.substr(0, 20)}...`);
  
  let client;
  try {
    console.log('\n📡 Tentative de connexion...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connexion réussie au cluster MongoDB!');
    
    // Vérifier si la base de données existe
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    const dbExists = dbs.databases.some(db => db.name === dbName);
    
    if (dbExists) {
      console.log(`✅ La base de données "${dbName}" existe!`);
      
      // Se connecter à la base spécifiée
      const db = client.db(dbName);
      
      // Lister les collections
      const collections = await db.listCollections().toArray();
      console.log(`\n📚 Collections dans "${dbName}":`);
      
      if (collections.length === 0) {
        console.log('   Aucune collection trouvée');
      } else {
        for (const coll of collections) {
          try {
            const count = await db.collection(coll.name).countDocuments();
            console.log(`   - ${coll.name}: ${count} documents`);
          } catch (err) {
            console.log(`   - ${coll.name}: Erreur - ${err.message}`);
          }
        }
      }
      
      // Vérifier spécifiquement la collection 'cols'
      if (collections.some(c => c.name === 'cols')) {
        const colsCollection = db.collection('cols');
        const colsCount = await colsCollection.countDocuments();
        
        console.log(`\n🔍 Détails de la collection "cols":`);
        console.log(`   - Nombre total: ${colsCount} cols`);
        
        if (colsCount > 0) {
          // Récupérer et afficher un exemple
          const sample = await colsCollection.find().limit(1).toArray();
          console.log('   - Exemple de col:');
          console.log(`     • Nom: ${sample[0].name}`);
          console.log(`     • Altitude: ${sample[0].elevation} m`);
          console.log(`     • Difficulté: ${sample[0].difficulty}`);
          
          // Vérifier si les données 3D sont présentes
          const has3D = sample[0].visualization3D !== undefined;
          console.log(`     • Données 3D: ${has3D ? '✅ Présentes' : '❌ Absentes'}`);
        }
      }
      
    } else {
      console.log(`❌ La base de données "${dbName}" n'existe pas!`);
      console.log('\nBases de données disponibles:');
      dbs.databases.forEach(db => {
        console.log(`   - ${db.name}`);
      });
    }
    
    console.log('\n🏁 CONCLUSION:');
    if (dbExists) {
      console.log('✅ La configuration Netlify est CORRECTE! Votre application se connectera avec succès.');
    } else {
      console.log('❌ La configuration Netlify est INCORRECTE - la base de données spécifiée n\'existe pas.');
      const altDb = dbs.databases.find(db => db.name.includes('velo'));
      if (altDb) {
        console.log(`💡 Suggestion: Utilisez plutôt "${altDb.name}" comme nom de base de données.`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion:', error);
    console.log('\n🏁 CONCLUSION:');
    console.log('❌ La configuration Netlify est INCORRECTE - impossible de se connecter avec les paramètres fournis.');
  } finally {
    if (client) {
      await client.close();
      console.log('\n📡 Connexion MongoDB fermée');
    }
  }
}

// Lancer le test
testerConnexion().catch(console.error);
