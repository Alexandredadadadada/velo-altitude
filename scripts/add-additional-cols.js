/**
 * Script pour ajouter les cols additionnels à la base de données velo-altitude
 * Utilise la même architecture modulaire que le script précédent
 */

require('dotenv').config();
const ColDataService = require('./services/ColDataService');
const additionalCols = require('./data/additional-cols');

/**
 * Fonction principale pour ajouter les cols additionnels
 */
async function addAdditionalCols() {
  try {
    console.log('=== AJOUT DES COLS ADDITIONNELS ===');
    console.log(`📋 ${additionalCols.length} cols additionnels à traiter\n`);
    
    // Initialiser le service de données avec optimisations de cache et monitoring
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
    const colService = new ColDataService(mongoUri);
    
    // On lance le traitement (pas besoin de sauvegarde car déjà fait dans l'opération précédente)
    await colService.addNewCols(additionalCols);
    
    // Vérifier l'état final de la base de données
    await verifyDatabase();
    
    console.log('\n=== OPÉRATION TERMINÉE ===');
    console.log('✅ Tous les cols additionnels ont été traités');
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

/**
 * Fonction pour vérifier l'état final de la base de données
 * @returns {Promise<boolean>}
 */
async function verifyDatabase() {
  const { MongoClient } = require('mongodb');
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
  
  try {
    console.log('\n=== VÉRIFICATION DE LA BASE DE DONNÉES ===');
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('velo-altitude');
    const colsCollection = db.collection('cols');
    
    // Compter le nombre total de cols
    const totalCols = await colsCollection.countDocuments();
    console.log(`📊 Total des cols dans la base: ${totalCols}`);
    
    // Vérifier les cols avec profil d'élévation
    const colsWithElevation = await colsCollection.countDocuments({
      $or: [
        { "elevation_profile": { $exists: true, $ne: null } },
        { "visualization3D.elevationProfile": { $exists: true, $ne: null } }
      ]
    });
    console.log(`📈 Cols avec profil d'élévation: ${colsWithElevation}`);
    
    // Vérifier les cols avec données 3D
    const colsWith3D = await colsCollection.countDocuments({
      "visualization3D": { $exists: true, $ne: null }
    });
    console.log(`🏔️ Cols avec données de visualisation 3D: ${colsWith3D}`);
    
    // Stats sur les régions
    const regions = await colsCollection.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('🗺️ Top 5 des régions:');
    regions.slice(0, 5).forEach(r => {
      console.log(`   - ${r._id || 'non définie'}: ${r.count} cols`);
    });
    
    // Stats sur les difficultés
    const difficulties = await colsCollection.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('🔍 Répartition par difficulté:');
    difficulties.forEach(d => {
      console.log(`   - ${d._id || 'non définie'}: ${d.count} cols`);
    });
    
    // Stats sur l'altitude
    const highestCols = await colsCollection.find({})
      .sort({ elevation: -1 })
      .limit(3)
      .project({ name: 1, elevation: 1, region: 1, _id: 0 })
      .toArray();
    
    console.log('🏔️ Top 3 des cols les plus élevés:');
    highestCols.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.region}): ${col.elevation}m`);
    });
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error);
    return false;
  }
}

// Lancer le script
console.log('🚀 Démarrage du script d\'ajout des cols additionnels...');
addAdditionalCols().catch(console.error);
