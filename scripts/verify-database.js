/**
 * Script de vérification approfondie de la base de données velo-altitude
 * Vérifie l'intégrité des données et la structure des documents
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifyDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  
  try {
    console.log('=== VÉRIFICATION APPROFONDIE DE LA BASE DE DONNÉES ===');
    console.log('📡 Connexion à MongoDB...');
    await client.connect();
    console.log('✅ Connexion établie');
    
    // 1. Vérification des bases disponibles
    const adminDb = client.db('admin');
    const dbList = await adminDb.admin().listDatabases();
    
    console.log('\n📦 BASES DE DONNÉES DISPONIBLES:');
    dbList.databases.forEach(db => {
      console.log(`   - ${db.name} (${formatBytes(db.sizeOnDisk)})`);
    });
    
    // 2. Vérification de la base velo-altitude
    const db = client.db('velo-altitude');
    const collections = await db.listCollections().toArray();
    
    console.log('\n📚 COLLECTIONS DANS velo-altitude:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`   - ${collection.name}: ${count} documents`);
    }
    
    // 3. Vérification détaillée de la collection cols
    const colsCollection = db.collection('cols');
    const totalCols = await colsCollection.countDocuments();
    
    console.log('\n🔍 VÉRIFICATION DES COLS:');
    console.log(`   📊 Nombre total de cols: ${totalCols}`);
    
    // 3.1 Vérification de l'intégrité structurelle
    const structureCheck = await verifyColsStructure(colsCollection);
    
    // 3.2 Échantillon de données
    console.log('\n📋 ÉCHANTILLON DE COLS:');
    const sampleCols = await colsCollection.find({})
      .limit(3)
      .project({ 
        name: 1, 
        region: 1, 
        country: 1,
        elevation: 1, 
        difficulty: 1,
        "visualization3D.elevationProfile.points": { $size: "$visualization3D.elevationProfile.points" },
        "visualization3D.elevationProfile.segments": { $size: "$visualization3D.elevationProfile.segments" },
        "metadata.lastUpdated": 1,
        _id: 0 
      })
      .toArray();
    
    sampleCols.forEach(col => {
      console.log(`   - ${col.name} (${col.region}, ${col.country})`);
      console.log(`     ↳ Altitude: ${col.elevation}m | Difficulté: ${col.difficulty}`);
      console.log(`     ↳ Points du profil: ${col["visualization3D.elevationProfile.points"] || "N/A"}`);
      console.log(`     ↳ Segments: ${col["visualization3D.elevationProfile.segments"] || "N/A"}`);
      console.log(`     ↳ Dernière mise à jour: ${col.metadata?.lastUpdated || "N/A"}`);
    });
    
    // 3.3 Recherche de valeurs manquantes ou incohérentes
    await checkForMissingValues(colsCollection);
    
    // 3.4 Vérification des backups
    await verifyBackups(db);
    
    console.log('\n=== VÉRIFICATION TERMINÉE ===');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await client.close();
    console.log('✅ Connexion MongoDB fermée');
  }
}

/**
 * Vérifie la structure des documents de cols
 * @param {Collection} colsCollection - Collection MongoDB des cols
 */
async function verifyColsStructure(colsCollection) {
  console.log('\n🔎 VÉRIFICATION DE LA STRUCTURE:');
  
  // Vérifier les champs obligatoires
  const requiredFields = [
    "name", "region", "country", "elevation", "length", 
    "avgGradient", "maxGradient", "difficulty", "coordinates",
    "description", "climbs", "visualization3D"
  ];
  
  let allFieldsPresent = true;
  
  for (const field of requiredFields) {
    const missingCount = await colsCollection.countDocuments({ [field]: { $exists: false } });
    if (missingCount > 0) {
      console.log(`   ❌ ${missingCount} cols manquent le champ "${field}"`);
      allFieldsPresent = false;
    }
  }
  
  if (allFieldsPresent) {
    console.log('   ✅ Tous les cols contiennent les champs obligatoires');
  }
  
  // Vérifier les profils d'élévation
  const elevationProfileCount = await colsCollection.countDocuments({
    $or: [
      { "elevation_profile": { $exists: true, $ne: null } },
      { "visualization3D.elevationProfile": { $exists: true, $ne: null } }
    ]
  });
  
  console.log(`   ${elevationProfileCount === await colsCollection.countDocuments() ? '✅' : '⚠️'} ${elevationProfileCount} cols avec profil d'élévation`);
  
  // Vérifier les données de terrain
  const terrainDataCount = await colsCollection.countDocuments({
    "visualization3D.terrain": { $exists: true, $ne: null }
  });
  
  console.log(`   ${terrainDataCount === await colsCollection.countDocuments() ? '✅' : '⚠️'} ${terrainDataCount} cols avec données de terrain`);
  
  // Vérifier les données météo
  const weatherDataCount = await colsCollection.countDocuments({
    "visualization3D.weather": { $exists: true, $ne: null }
  });
  
  console.log(`   ${weatherDataCount === await colsCollection.countDocuments() ? '✅' : '⚠️'} ${weatherDataCount} cols avec données météo`);
  
  return allFieldsPresent;
}

/**
 * Vérifie les valeurs manquantes ou incohérentes
 * @param {Collection} colsCollection - Collection MongoDB des cols
 */
async function checkForMissingValues(colsCollection) {
  console.log('\n🧪 VÉRIFICATION DES VALEURS:');
  
  // Vérifier les coordonnées valides
  const invalidCoordinates = await colsCollection.countDocuments({
    $or: [
      { "coordinates.0": { $exists: false } },
      { "coordinates.1": { $exists: false } },
      { "coordinates.0": { $not: { $type: "number" } } },
      { "coordinates.1": { $not: { $type: "number" } } }
    ]
  });
  
  console.log(`   ${invalidCoordinates === 0 ? '✅' : '❌'} Coordonnées valides: ${invalidCoordinates === 0 ? 'OK' : `${invalidCoordinates} cols avec coordonnées invalides`}`);
  
  // Vérifier les données de difficulté
  const invalidDifficulty = await colsCollection.countDocuments({
    difficulty: { $nin: ["easy", "medium", "hard", "extreme"] }
  });
  
  console.log(`   ${invalidDifficulty === 0 ? '✅' : '❌'} Niveaux de difficulté valides: ${invalidDifficulty === 0 ? 'OK' : `${invalidDifficulty} cols avec difficulté invalide`}`);
  
  // Vérifier les dates de création/mise à jour
  const missingDates = await colsCollection.countDocuments({
    $or: [
      { createdAt: { $exists: false } },
      { updatedAt: { $exists: false } }
    ]
  });
  
  console.log(`   ${missingDates === 0 ? '✅' : '⚠️'} Dates de création/modification: ${missingDates === 0 ? 'OK' : `${missingDates} cols sans dates complètes`}`);
  
  // Vérifier les métadonnées
  const missingMetadata = await colsCollection.countDocuments({
    "metadata": { $exists: false }
  });
  
  console.log(`   ${missingMetadata === 0 ? '✅' : '⚠️'} Métadonnées: ${missingMetadata === 0 ? 'OK' : `${missingMetadata} cols sans métadonnées`}`);
}

/**
 * Vérifie les sauvegardes existantes
 * @param {Db} db - Base de données MongoDB
 */
async function verifyBackups(db) {
  console.log('\n💾 VÉRIFICATION DES SAUVEGARDES:');
  
  // Trouver toutes les collections de sauvegarde
  const collections = await db.listCollections().toArray();
  const backupCollections = collections.filter(coll => coll.name.startsWith('cols_backup_'));
  
  if (backupCollections.length === 0) {
    console.log('   ⚠️ Aucune sauvegarde trouvée');
    return;
  }
  
  console.log(`   ✅ ${backupCollections.length} sauvegardes trouvées:`);
  
  for (const backup of backupCollections) {
    const count = await db.collection(backup.name).countDocuments();
    const timestamp = backup.name.replace('cols_backup_', '');
    const date = new Date(parseInt(timestamp));
    
    console.log(`   - ${backup.name}: ${count} cols (${date.toISOString()})`);
  }
}

/**
 * Formate les bytes en taille lisible
 * @param {number} bytes - Taille en bytes
 * @returns {string} - Taille formatée
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Lancer la vérification
verifyDatabase().catch(console.error);
