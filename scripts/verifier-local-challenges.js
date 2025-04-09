/**
 * Script pour vérifier la collection "challenges" en utilisant la connexion locale
 * qui a fonctionné précédemment
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifierChallengesLocal() {
  // URI qui a fonctionné dans les tests précédents
  const uri = "mongodb://localhost:27017";
  
  console.log('=== VÉRIFICATION DE LA COLLECTION CHALLENGES (CONNEXION LOCALE) ===');
  
  let client;
  try {
    console.log('Connexion à MongoDB local...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connexion réussie à MongoDB');
    
    // Vérifier l'existence des bases de données
    const admin = client.db('admin');
    const dbs = await admin.admin().listDatabases();
    
    console.log('\n📊 BASES DE DONNÉES DISPONIBLES:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name}`);
    });
    
    // Vérifier si les deux variantes existent
    const veloAltitudeTiret = dbs.databases.find(db => db.name === 'velo-altitude');
    const veloAltitudeUnderscore = dbs.databases.find(db => db.name === 'velo_altitude');
    
    console.log('\n🔍 RÉSULTAT DE LA RECHERCHE:');
    console.log(`   Base 'velo-altitude' (tiret): ${veloAltitudeTiret ? '✅ Existe' : '❌ N\'existe pas'}`);
    console.log(`   Base 'velo_altitude' (underscore): ${veloAltitudeUnderscore ? '✅ Existe' : '❌ N\'existe pas'}`);
    
    // Vérifier la collection "challenges" dans les deux bases si elles existent
    console.log('\n🔍 VÉRIFICATION DE LA COLLECTION "challenges":');
    
    // Fonction pour vérifier et afficher les collections dans une base
    async function checkCollections(dbName) {
      try {
        const database = client.db(dbName);
        const collections = await database.listCollections().toArray();
        
        console.log(`\n   Collections dans '${dbName}':`);
        for (const coll of collections) {
          const count = await database.collection(coll.name).countDocuments();
          console.log(`   - ${coll.name}: ${count} documents`);
        }
        
        const hasChallenges = collections.some(c => c.name === 'challenges');
        
        if (hasChallenges) {
          const challenges = database.collection('challenges');
          const count = await challenges.countDocuments();
          console.log(`\n   ✅ Collection "challenges" dans '${dbName}': ${count} documents`);
          
          if (count > 0) {
            const sample = await challenges.find().limit(1).toArray();
            console.log(`   → Premier document: ${JSON.stringify(sample[0], null, 2).substring(0, 150)}...`);
          }
        } else {
          console.log(`\n   ❌ Pas de collection "challenges" dans '${dbName}'`);
        }
      } catch (err) {
        console.error(`   ❌ Erreur lors de l'accès à ${dbName}: ${err.message}`);
      }
    }
    
    // Vérifier les collections dans toutes les bases contenant "velo"
    for (const db of dbs.databases) {
      if (db.name.includes('velo')) {
        await checkCollections(db.name);
      }
    }
    
    console.log('\n💡 EXPLICATION DU PROBLÈME:');
    
    if (veloAltitudeTiret && !veloAltitudeUnderscore) {
      console.log('1. Dans MongoDB, seule la base "velo-altitude" (avec tiret) existe.');
      console.log('2. L\'interface MongoDB Atlas affiche probablement les tirets comme des underscores.');
      console.log('3. C\'est une particularité d\'affichage de MongoDB Atlas, pas un problème réel dans vos données.');
    } else if (!veloAltitudeTiret && veloAltitudeUnderscore) {
      console.log('1. Dans MongoDB, seule la base "velo_altitude" (avec underscore) existe.');
      console.log('2. Il faudrait standardiser vers le format avec tiret comme prévu.');
    } else if (veloAltitudeTiret && veloAltitudeUnderscore) {
      console.log('1. Les deux bases existent, ce qui peut causer de la confusion.');
      console.log('2. Il faudrait consolider vers une seule base "velo-altitude" (avec tiret).');
    } else {
      console.log('1. Aucune base avec "velo" dans le nom n\'a été trouvée.');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('\nConnexion MongoDB fermée');
    }
  }
}

// Exécuter la vérification
verifierChallengesLocal().catch(console.error);
