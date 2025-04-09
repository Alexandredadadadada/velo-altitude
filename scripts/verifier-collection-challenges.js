/**
 * Script pour vérifier spécifiquement la collection "challenges"
 * et comprendre le problème d'inconsistance entre underscore et tiret
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifierChallenges() {
  // URI MongoDB Atlas
  const atlasUri = "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";
  
  console.log('=== VÉRIFICATION DE LA COLLECTION CHALLENGES ===');
  
  let client;
  try {
    console.log('Connexion à MongoDB Atlas...');
    client = new MongoClient(atlasUri);
    await client.connect();
    console.log('✅ Connexion réussie à MongoDB Atlas');
    
    // Vérifier l'existence des deux bases de données
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
    
    if (veloAltitudeTiret) {
      const dbTiret = client.db('velo-altitude');
      const collectionsTiret = await dbTiret.listCollections().toArray();
      const hasChallengesTiret = collectionsTiret.some(c => c.name === 'challenges');
      
      console.log(`   Dans 'velo-altitude': ${hasChallengesTiret ? '✅ Collection "challenges" existe' : '❌ Collection "challenges" n\'existe pas'}`);
      
      if (hasChallengesTiret) {
        const count = await dbTiret.collection('challenges').countDocuments();
        console.log(`   → Nombre de documents: ${count}`);
        
        // Afficher un exemple
        if (count > 0) {
          const sample = await dbTiret.collection('challenges').find().limit(1).toArray();
          console.log(`   → Exemple: ${JSON.stringify(sample[0], null, 2).substring(0, 150)}...`);
        }
      }
    }
    
    if (veloAltitudeUnderscore) {
      const dbUnderscore = client.db('velo_altitude');
      const collectionsUnderscore = await dbUnderscore.listCollections().toArray();
      const hasChallengesUnderscore = collectionsUnderscore.some(c => c.name === 'challenges');
      
      console.log(`   Dans 'velo_altitude': ${hasChallengesUnderscore ? '✅ Collection "challenges" existe' : '❌ Collection "challenges" n\'existe pas'}`);
      
      if (hasChallengesUnderscore) {
        const count = await dbUnderscore.collection('challenges').countDocuments();
        console.log(`   → Nombre de documents: ${count}`);
        
        // Afficher un exemple
        if (count > 0) {
          const sample = await dbUnderscore.collection('challenges').find().limit(1).toArray();
          console.log(`   → Exemple: ${JSON.stringify(sample[0], null, 2).substring(0, 150)}...`);
        }
      }
    }
    
    console.log('\n🛠️ SOLUTION RECOMMANDÉE:');
    
    if (veloAltitudeTiret && veloAltitudeUnderscore) {
      console.log('1. Les deux bases de données existent, ce qui explique la confusion.');
      console.log('2. Exécutez le script "standardize-database.js" pour migrer toutes les données vers velo-altitude (avec tiret).');
      console.log('3. Puis exécutez "fix-database-name.js" pour supprimer définitivement la base velo_altitude (avec underscore).');
    } else if (veloAltitudeTiret) {
      console.log('1. Seule la base "velo-altitude" (avec tiret) existe, mais l\'interface MongoDB Atlas l\'affiche incorrectement.');
      console.log('2. Essayez de vider le cache de votre navigateur et de vous reconnecter à MongoDB Atlas.');
      console.log('3. Si le problème persiste, ce pourrait être un bug d\'affichage de MongoDB Atlas.');
    } else if (veloAltitudeUnderscore) {
      console.log('1. Seule la base "velo_altitude" (avec underscore) existe.');
      console.log('2. Exécutez le script "standardize-database.js" pour créer la base avec tiret et y migrer les données.');
    } else {
      console.log('1. Aucune des deux bases n\'existe. Vérifiez que vous êtes connecté au bon cluster MongoDB.');
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
verifierChallenges().catch(console.error);
