/**
 * Script pour ajouter les cols restants à la base de données velo-altitude
 * Utilise une approche modulaire et s'intègre avec les services existants
 */

require('dotenv').config();
const ColDataService = require('./services/ColDataService');
const remainingCols = require('./data/remaining-cols');

// Fonction pour créer une sauvegarde avant la modification
async function createBackup() {
  const { MongoClient } = require('mongodb');
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
  
  try {
    console.log('\n=== CRÉATION DE LA SAUVEGARDE ===');
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('velo-altitude');
    const colsCollection = db.collection('cols');
    
    // Récupérer tous les cols actuels
    const existingCols = await colsCollection.find({}).toArray();
    console.log(`📦 ${existingCols.length} cols trouvés dans la base de données`);
    
    // Créer une collection de sauvegarde avec timestamp
    const timestamp = Date.now();
    const backupCollectionName = `cols_backup_${timestamp}`;
    
    if (existingCols.length > 0) {
      // Créer la collection de sauvegarde
      await db.createCollection(backupCollectionName);
      const backupCollection = db.collection(backupCollectionName);
      
      // Copier les données
      await backupCollection.insertMany(existingCols);
      console.log(`✅ Sauvegarde créée avec succès: ${backupCollectionName}`);
    } else {
      console.log('ℹ️ Aucune donnée à sauvegarder');
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la création de la sauvegarde:', error);
    return false;
  }
}

// Fonction pour vérifier l'état de la base de données
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
    
    // Vérifier les différentes difficultés
    const difficulties = await colsCollection.aggregate([
      { $group: { _id: "$difficulty", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('🔍 Répartition par difficulté:');
    difficulties.forEach(d => {
      console.log(`   - ${d._id || 'non défini'}: ${d.count} cols`);
    });
    
    // Vérifier les régions représentées
    const regions = await colsCollection.aggregate([
      { $group: { _id: "$region", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('🗺️ Répartition par région:');
    regions.forEach(r => {
      console.log(`   - ${r._id || 'non définie'}: ${r.count} cols`);
    });
    
    await client.close();
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la base de données:', error);
    return false;
  }
}

// Fonction principale
async function addRemainingCols() {
  try {
    console.log('=== AJOUT DES COLS RESTANTS ===');
    console.log(`📋 ${remainingCols.length} cols à traiter\n`);
    
    // Créer une sauvegarde
    const backupSuccess = await createBackup();
    if (!backupSuccess) {
      console.log('⚠️ La sauvegarde a échoué. Souhaitez-vous continuer ? (y/n)');
      // Dans un script réel, nous ajouterions ici une gestion de la réponse utilisateur
    }
    
    // Initialiser le service de données
    const mongoUri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
    const colService = new ColDataService(mongoUri);
    
    // Ajouter les cols
    await colService.addNewCols(remainingCols);
    
    // Vérifier la base de données
    await verifyDatabase();
    
    console.log('\n=== OPÉRATION TERMINÉE ===');
    console.log('✅ Tous les cols ont été traités');
    
  } catch (error) {
    console.error('❌ Erreur globale:', error);
  }
}

// Lancer le script
console.log('🚀 Démarrage du script d\'ajout des cols restants...');
addRemainingCols().catch(console.error);
