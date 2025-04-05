/**
 * Script d'importation des données pour MongoDB Atlas
 * 
 * Ce script permet d'importer toutes les données nécessaires au fonctionnement
 * du site Dashboard-Velo.com dans MongoDB Atlas.
 * 
 * Utilisation:
 * 1. Créer un cluster MongoDB Atlas
 * 2. Configurer les variables d'environnement (voir .env.example)
 * 3. Exécuter ce script: node mongodb-import.js
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Collections à importer
const COLLECTIONS = [
  { name: 'cols', file: '../data/cols.json' },
  { name: 'routes', file: '../data/routes.json' },
  { name: 'events', file: '../data/events.json' },
  { name: 'news', file: '../data/news.json' },
  { name: 'nutrition_recipes', file: '../data/recipes.json' },
  { name: 'training_programs', file: '../data/training_programs.json' },
  { name: 'predefined_challenges', file: '../data/predefined_challenges.json' },
  { name: 'users', file: '../data/seed_users.json' },
];

// Configuration des indexes
const INDEXES = [
  { collection: 'cols', field: 'region', type: 1 },
  { collection: 'cols', field: 'difficulty', type: 1 },
  { collection: 'cols', field: 'altitude', type: 1 },
  { collection: 'cols', field: 'popularity', type: -1 },
  { collection: 'routes', field: 'region', type: 1 },
  { collection: 'routes', field: 'difficulty', type: 1 },
  { collection: 'routes', field: 'featured', type: 1 },
  { collection: 'routes', field: 'distance', type: 1 },
  { collection: 'events', field: 'date', type: 1 },
  { collection: 'news', field: 'publishedAt', type: -1 },
  { collection: 'nutrition_recipes', field: 'category', type: 1 },
  { collection: 'nutrition_recipes', field: 'mealType', type: 1 },
  { collection: 'nutrition_recipes', field: 'prepTime', type: 1 },
  { collection: 'nutrition_recipes', field: 'dietaryTags', type: 1 },
  { collection: 'training_programs', field: 'level', type: 1 },
  { collection: 'training_programs', field: 'durationWeeks', type: 1 },
  { collection: 'training_programs', field: 'primaryGoal', type: 1 },
  { collection: 'users', field: 'email', type: 1, unique: true },
  { collection: 'users', field: 'auth0Id', type: 1, unique: true },
  { collection: 'user_challenges', field: 'userId', type: 1 },
  { collection: 'user_stats', field: 'userId', type: 1, unique: true },
  { collection: 'weather_cache', field: 'colId', type: 1, unique: true },
  { collection: 'weather_cache', field: 'expiresAt', type: 1 },
];

/**
 * Connexion à MongoDB Atlas
 */
const connectToMongoDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI non définie dans les variables d\'environnement');
  }
  
  const client = new MongoClient(uri, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  });
  
  try {
    await client.connect();
    console.log('Connecté à MongoDB Atlas');
    return client.db(process.env.MONGODB_DB_NAME || 'dashboard-velo');
  } catch (error) {
    console.error('Erreur de connexion MongoDB:', error);
    throw error;
  }
};

/**
 * Lire un fichier JSON
 * @param {string} filePath - Chemin vers le fichier JSON
 */
const readJsonFile = (filePath) => {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    throw error;
  }
};

/**
 * Importer une collection dans MongoDB
 * @param {Object} db - Instance de la base de données MongoDB
 * @param {string} collectionName - Nom de la collection
 * @param {Array} data - Données à importer
 */
const importCollection = async (db, collectionName, data) => {
  try {
    // Vérifier si la collection existe déjà et contient des données
    const collection = db.collection(collectionName);
    const count = await collection.countDocuments();
    
    if (count > 0) {
      console.log(`Collection ${collectionName} contient déjà ${count} documents. Suppression...`);
      await collection.deleteMany({});
    }
    
    if (data.length === 0) {
      console.log(`Aucune donnée à importer pour ${collectionName}`);
      return;
    }
    
    // Insérer les données
    const result = await collection.insertMany(data);
    console.log(`${result.insertedCount} documents importés dans ${collectionName}`);
  } catch (error) {
    console.error(`Erreur lors de l'importation de ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Créer les indexes nécessaires
 * @param {Object} db - Instance de la base de données MongoDB
 */
const createIndexes = async (db) => {
  try {
    for (const index of INDEXES) {
      const collection = db.collection(index.collection);
      const indexDef = {};
      indexDef[index.field] = index.type;
      
      const options = {};
      if (index.unique) {
        options.unique = true;
      }
      
      await collection.createIndex(indexDef, options);
      console.log(`Index créé sur ${index.collection}.${index.field}`);
    }
  } catch (error) {
    console.error('Erreur lors de la création des indexes:', error);
    throw error;
  }
};

/**
 * Fonction principale
 */
const main = async () => {
  let client;
  
  try {
    // Connexion à MongoDB
    const db = await connectToMongoDB();
    
    // Importer les collections
    for (const collection of COLLECTIONS) {
      console.log(`Importation de ${collection.name}...`);
      const data = readJsonFile(collection.file);
      await importCollection(db, collection.name, data);
    }
    
    // Créer les collections vides si elles n'existent pas
    const additionalCollections = [
      'user_challenges',
      'user_stats',
      'user_completed_cols',
      'weather_cache'
    ];
    
    for (const collectionName of additionalCollections) {
      if (!(await db.listCollections({ name: collectionName }).hasNext())) {
        await db.createCollection(collectionName);
        console.log(`Collection ${collectionName} créée`);
      }
    }
    
    // Créer les indexes
    await createIndexes(db);
    
    console.log('Importation terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
  } finally {
    // Fermer la connexion MongoDB
    if (client) {
      await client.close();
    }
  }
};

// Exécuter le script
main();
