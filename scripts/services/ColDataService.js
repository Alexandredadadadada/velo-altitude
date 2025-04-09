/**
 * Service de gestion des données de cols
 * Intègre les composants avancés de l'architecture Velo-Altitude
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

/**
 * Simule un service de cache basé sur les fonctionnalités mentionnées dans l'architecture
 * Dans une implémentation complète, il faudrait utiliser le vrai Cache Service
 */
class SimpleCacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = 3600 * 1000; // 1 heure par défaut
  }

  set(key, value, customTtl) {
    const expiry = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiry });
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

  invalidate(key) {
    this.cache.delete(key);
  }
}

/**
 * Class de service pour la gestion des données de cols
 */
class ColDataService {
  /**
   * Constructeur
   * @param {string} mongoUri - URI de connexion MongoDB
   */
  constructor(mongoUri) {
    this.mongoUri = mongoUri || process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
    this.dbName = "velo-altitude";
    this.client = new MongoClient(this.mongoUri);
    this.cacheService = new SimpleCacheService();
  }

  /**
   * Établit la connexion à MongoDB
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connecté à MongoDB');
    } catch (error) {
      console.error('❌ Erreur de connexion à MongoDB:', error);
      throw error;
    }
  }

  /**
   * Ferme la connexion à MongoDB
   * @returns {Promise<void>}
   */
  async close() {
    try {
      await this.client.close();
      console.log('✅ Connexion MongoDB fermée');
    } catch (error) {
      console.error('❌ Erreur lors de la fermeture de la connexion:', error);
    }
  }

  /**
   * Ajoute de nouveaux cols à la base de données
   * @param {Array<ColBase>} cols - Liste des cols à ajouter
   * @returns {Promise<void>}
   */
  async addNewCols(cols) {
    if (!cols || !Array.isArray(cols) || cols.length === 0) {
      console.warn('⚠️ Aucun col à ajouter');
      return;
    }

    try {
      // Connexion à MongoDB
      await this.connect();
      const db = this.client.db(this.dbName);
      const colsCollection = db.collection('cols');

      console.log(`🚀 Début de l'ajout de ${cols.length} cols...`);
      let addedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const col of cols) {
        try {
          // Vérifier si le col existe déjà
          const existing = await colsCollection.findOne({ name: col.name });
          if (existing) {
            console.log(`⏭️ Col déjà présent: ${col.name}`);
            skippedCount++;
            continue;
          }

          // Enrichir le col avec les données 3D
          const startTime = Date.now();
          console.log(`🔄 Traitement du col: ${col.name}`);
          
          const enrichedCol = await this.enrichCol(col);
          
          // Mesurer le temps de traitement (pour le monitoring)
          const processingTime = Date.now() - startTime;
          console.log(`⏱️ Temps de traitement: ${processingTime}ms`);

          // Ajouter le col à la base de données
          await colsCollection.insertOne(enrichedCol);
          console.log(`✅ Col ajouté avec succès: ${col.name}`);
          addedCount++;

          // Pré-remplir le cache avec les données générées
          const cacheKey = `col_${col.name}`;
          this.cacheService.set(cacheKey, enrichedCol, 24 * 3600 * 1000); // TTL de 24h

          // Pause pour éviter la surcharge
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`❌ Erreur lors de l'ajout du col ${col.name}:`, error);
          errorCount++;
        }
      }

      // Afficher le résumé
      const totalCols = await colsCollection.countDocuments();
      console.log('\n=== RÉSUMÉ DE L\'OPÉRATION ===');
      console.log(`📊 Total des cols dans la base: ${totalCols}`);
      console.log(`✅ ${addedCount} cols ajoutés avec succès`);
      console.log(`⏭️ ${skippedCount} cols ignorés (déjà présents)`);
      console.log(`❌ ${errorCount} cols en erreur`);
    } catch (error) {
      console.error('❌ Erreur globale:', error);
      throw error;
    } finally {
      // Fermer la connexion
      await this.close();
    }
  }

  /**
   * Enrichit un col avec des données avancées
   * @param {ColBase} col - Col de base à enrichir
   * @returns {Promise<Col>} - Col enrichi
   */
  async enrichCol(col) {
    try {
      console.log(`📊 Génération du profil d'élévation pour ${col.name}...`);
      const elevationProfile = this.generateElevationProfile(col);

      console.log(`🏔️ Génération des données de terrain pour ${col.name}...`);
      const terrain = this.generateTerrainData(col);

      console.log(`🌦️ Génération des données météo pour ${col.name}...`);
      const weather = this.generateWeatherData(col);

      console.log(`⚙️ Calcul des paramètres de rendu pour ${col.name}...`);
      const renderSettings = this.generateRenderSettings(col);

      // Créer le col enrichi
      return {
        ...col,
        // Le champ elevation_profile est conservé pour compatibilité avec les scripts existants
        elevation_profile: elevationProfile,
        visualization3D: {
          elevationProfile,
          terrain,
          weather,
          renderSettings
        },
        metadata: {
          lastUpdated: new Date(),
          dataVersion: "2.0",
          dataSource: ["synthetic_generation"],
          verificationStatus: "pending"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error(`❌ Erreur lors de l'enrichissement du col ${col.name}:`, error);
      throw error;
    }
  }

  // Les méthodes suivantes sont implémentées dans ColDataEnrichment.js
  generateElevationProfile(col) {
    // Importer depuis ColDataEnrichment.js
    const { generateElevationProfile } = require('./ColDataEnrichment');
    return generateElevationProfile(col);
  }

  generateTerrainData(col) {
    // Importer depuis ColDataEnrichment.js
    const { generateTerrainData } = require('./ColDataEnrichment');
    return generateTerrainData(col);
  }

  generateWeatherData(col) {
    // Importer depuis ColDataEnrichment.js
    const { generateWeatherData } = require('./ColDataEnrichment');
    return generateWeatherData(col);
  }

  generateRenderSettings(col) {
    // Importer depuis ColDataEnrichment.js
    const { generateRenderSettings } = require('./ColDataEnrichment');
    return generateRenderSettings(col);
  }
}

module.exports = ColDataService;
