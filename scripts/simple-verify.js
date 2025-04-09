/**
 * Script de vérification simplifié de la base de données velo-altitude
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function simpleVerify() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  
  try {
    console.log('=== VÉRIFICATION SIMPLIFIÉE DE LA BASE DE DONNÉES ===');
    console.log('📡 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connexion établie');
    
    // 1. Liste des bases de données
    const dbs = await client.db().admin().listDatabases();
    console.log('\n📦 BASES DE DONNÉES:');
    dbs.databases.forEach(db => {
      console.log(`   - ${db.name} (${Math.round(db.sizeOnDisk / 1024)} KB)`);
    });
    
    // 2. Accès à la base velo-altitude
    const db = client.db('velo-altitude');
    
    // 3. Liste des collections
    const collections = await db.listCollections().toArray();
    console.log('\n📚 COLLECTIONS:');
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} documents`);
    }
    
    // 4. Vérification simple des cols
    const colsCollection = db.collection('cols');
    const total = await colsCollection.countDocuments();
    console.log(`\n👉 Collection cols: ${total} documents`);
    
    // 5. Examen d'un échantillon
    const sample = await colsCollection.find().limit(1).toArray();
    if (sample.length > 0) {
      const col = sample[0];
      console.log('\n📋 STRUCTURE D\'UN COL (champs principaux):');
      console.log(`   - Nom: ${col.name}`);
      console.log(`   - Région: ${col.region}`);
      console.log(`   - Altitude: ${col.elevation} m`);
      console.log(`   - Difficulté: ${col.difficulty}`);
      console.log(`   - Coordonnées: [${col.coordinates.join(', ')}]`);
      
      // Vérifier la présence de données 3D
      const has3D = col.visualization3D !== undefined;
      console.log(`   - Données 3D: ${has3D ? '✅ Présentes' : '❌ Absentes'}`);
      
      if (has3D) {
        const profile = col.visualization3D.elevationProfile;
        const terrain = col.visualization3D.terrain;
        const weather = col.visualization3D.weather;
        
        console.log('     ↳ Profil d\'élévation: ' + (profile ? `✅ ${profile.points?.length || 0} points` : '❌ Absent'));
        console.log('     ↳ Données de terrain: ' + (terrain ? '✅ Présentes' : '❌ Absentes'));
        console.log('     ↳ Données météo: ' + (weather ? '✅ Présentes' : '❌ Absentes'));
      }
    }
    
    // 6. Statistiques globales
    console.log('\n📊 STATISTIQUES GLOBALES:');
    
    // Vérifier les cols avec profil d'élévation
    const colsWithElevation = await colsCollection.countDocuments({
      "visualization3D.elevationProfile": { $exists: true }
    });
    console.log(`   - Cols avec profil d'élévation: ${colsWithElevation}/${total}`);
    
    // Vérifier les cols avec données de terrain
    const colsWithTerrain = await colsCollection.countDocuments({
      "visualization3D.terrain": { $exists: true }
    });
    console.log(`   - Cols avec données de terrain: ${colsWithTerrain}/${total}`);
    
    // Vérifier les cols avec données météo
    const colsWithWeather = await colsCollection.countDocuments({
      "visualization3D.weather": { $exists: true }
    });
    console.log(`   - Cols avec données météo: ${colsWithWeather}/${total}`);
    
    // Répartition par difficulté
    const difficulty = await colsCollection.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('   - Répartition par difficulté:');
    difficulty.forEach(d => {
      console.log(`     • ${d._id || 'non définie'}: ${d.count} cols`);
    });
    
    console.log('\n✅ VÉRIFICATION TERMINÉE');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await client.close();
    console.log('📡 Connexion MongoDB fermée');
  }
}

// Lancer la vérification
simpleVerify().catch(console.error);
