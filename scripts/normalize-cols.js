/**
 * Script de normalisation des cols pour assurer la cohérence des données
 * Utilise l'architecture de services optimisée de Velo-Altitude
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const ColDataEnrichment = require('./services/ColDataEnrichment');

// Simulation simplifiée du Cache Service mentionné dans l'architecture
class CacheService {
  constructor() {
    this.cache = new Map();
  }

  set(key, value, ttl = 3600) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl * 1000
    });
    return value;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}

// Simulation simplifiée du Monitoring Service 
class MonitoringService {
  logPerformance(operation, duration) {
    console.log(`⏱️ Performance: ${operation} - ${duration}ms`);
  }

  logError(operation, error) {
    console.error(`❌ Error in ${operation}:`, error);
  }
}

async function normalizeColsData() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  
  // Initialiser les services
  const cacheService = new CacheService();
  const monitoringService = new MonitoringService();
  
  try {
    console.log('=== NORMALISATION DES DONNÉES DE COLS ===');
    console.log('📡 Connexion à MongoDB...');
    const startConnectTime = Date.now();
    await client.connect();
    monitoringService.logPerformance('MongoDB Connection', Date.now() - startConnectTime);
    console.log('✅ Connexion établie');
    
    const db = client.db('velo-altitude');
    const colsCollection = db.collection('cols');
    
    // 1. Identifier les cols qui ont besoin d'être normalisés
    console.log('\n🔍 RECHERCHE DES COLS À NORMALISER...');
    const colsToNormalize = await colsCollection.find({
      $or: [
        { "visualization3D.elevationProfile": { $exists: false } },
        { "visualization3D.weather": { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📊 ${colsToNormalize.length} cols nécessitent une normalisation`);
    
    if (colsToNormalize.length === 0) {
      console.log('✅ Tous les cols sont déjà normalisés!');
      return;
    }
    
    // 2. Créer une sauvegarde avant normalisation
    const timestamp = Date.now();
    const backupCollectionName = `cols_backup_normalize_${timestamp}`;
    await db.createCollection(backupCollectionName);
    await db.collection(backupCollectionName).insertMany(colsToNormalize);
    console.log(`💾 Sauvegarde créée: ${backupCollectionName}`);
    
    // 3. Normaliser chaque col
    console.log('\n🔄 DÉBUT DE LA NORMALISATION...');
    
    for (const col of colsToNormalize) {
      const startTime = Date.now();
      console.log(`📝 Traitement du col: ${col.name}`);
      
      try {
        // Normaliser la structure générale
        const normalized = { ...col };
        
        // Assurer que visualization3D existe
        if (!normalized.visualization3D) {
          normalized.visualization3D = {};
        }
        
        // Ajouter/mettre à jour le profil d'élévation si nécessaire
        if (!normalized.visualization3D.elevationProfile) {
          console.log(`📊 Génération du profil d'élévation pour ${col.name}...`);
          normalized.visualization3D.elevationProfile = 
            normalized.elevation_profile || 
            ColDataEnrichment.generateElevationProfile(col);
            
          // Mettre en cache le profil d'élévation généré
          cacheService.set(`elevation_profile_${col._id}`, normalized.visualization3D.elevationProfile, 24 * 3600);
        }
        
        // Ajouter/mettre à jour les données de terrain si nécessaires
        if (!normalized.visualization3D.terrain) {
          console.log(`🏔️ Génération des données de terrain pour ${col.name}...`);
          normalized.visualization3D.terrain = ColDataEnrichment.generateTerrainData(col);
        }
        
        // Ajouter/mettre à jour les données météo si nécessaires
        if (!normalized.visualization3D.weather) {
          console.log(`🌦️ Génération des données météo pour ${col.name}...`);
          normalized.visualization3D.weather = ColDataEnrichment.generateWeatherData(col);
        }
        
        // Ajouter/mettre à jour les paramètres de rendu si nécessaires
        if (!normalized.visualization3D.renderSettings) {
          console.log(`⚙️ Génération des paramètres de rendu pour ${col.name}...`);
          normalized.visualization3D.renderSettings = ColDataEnrichment.generateRenderSettings(col);
        }
        
        // Mettre à jour les métadonnées
        if (!normalized.metadata) {
          normalized.metadata = {};
        }
        
        normalized.metadata.lastUpdated = new Date();
        normalized.metadata.dataVersion = "2.0";
        normalized.metadata.dataSource = normalized.metadata.dataSource || ["synthetic_generation"];
        normalized.metadata.verificationStatus = normalized.metadata.verificationStatus || "verified";
        
        // Mettre à jour les dates
        normalized.updatedAt = new Date();
        
        // Mettre à jour le document dans la base de données
        await colsCollection.updateOne(
          { _id: col._id },
          { $set: normalized }
        );
        
        const duration = Date.now() - startTime;
        monitoringService.logPerformance(`Normalize col ${col.name}`, duration);
        console.log(`✅ Col normalisé: ${col.name} (${duration}ms)`);
        
      } catch (error) {
        monitoringService.logError(`Normalizing col ${col.name}`, error);
        console.error(`❌ Erreur lors de la normalisation du col ${col.name}:`, error);
      }
    }
    
    // 4. Vérifier les résultats
    console.log('\n🔍 VÉRIFICATION DES RÉSULTATS...');
    
    const incompleteAfter = await colsCollection.countDocuments({
      $or: [
        { "visualization3D.elevationProfile": { $exists: false } },
        { "visualization3D.weather": { $exists: false } }
      ]
    });
    
    if (incompleteAfter === 0) {
      console.log('✅ Tous les cols ont été normalisés avec succès!');
    } else {
      console.log(`⚠️ ${incompleteAfter} cols restent à normaliser`);
    }
    
    console.log('\n=== NORMALISATION TERMINÉE ===');
    
  } catch (error) {
    monitoringService.logError('Global normalization process', error);
    console.error('❌ Erreur globale:', error);
  } finally {
    await client.close();
    console.log('📡 Connexion MongoDB fermée');
  }
}

// Lancer la normalisation
normalizeColsData().catch(console.error);
