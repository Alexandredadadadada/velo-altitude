/**
 * Script d'importation des défis "Les 7 Majeurs" dans MongoDB
 * Exécuter avec: node import-challenges.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Défis "Les 7 Majeurs" à importer
const challengesData = [
  {
    name: "Les Géants des Alpes",
    description: "Les cols mythiques des Alpes françaises, un défi légendaire pour tout cycliste.",
    cols: ["Col du Galibier", "Col d'Izoard", "Col de la Croix de Fer", "Alpe d'Huez", "Col de la Madeleine", "Col du Glandon", "Col du Télégraphe"],
    totalElevation: 15200,
    difficulty: "extreme",
    region: "Alpes françaises",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
    estimatedTime: {
      beginner: "7-10 jours",
      intermediate: "5-7 jours",
      advanced: "3-5 jours"
    },
    bestSeason: ["juin", "juillet", "août", "septembre"],
    tags: ["mythique", "tour-de-france", "alpes"]
  },
  {
    name: "Les Sommets des Pyrénées",
    description: "Une traversée des plus beaux cols pyrénéens, entre France et Espagne.",
    cols: ["Col du Tourmalet", "Col d'Aubisque", "Col d'Aspin", "Col de Peyresourde", "Col de Portet", "Puerto de la Bonaigua", "Col du Soulor"],
    totalElevation: 12800,
    difficulty: "hard",
    region: "Pyrénées",
    image: "https://images.unsplash.com/photo-1543832923-44667a44c804",
    estimatedTime: {
      beginner: "6-9 jours",
      intermediate: "4-6 jours",
      advanced: "3-4 jours"
    },
    bestSeason: ["juin", "juillet", "août", "septembre"],
    tags: ["pyrénées", "franco-espagnol", "tour-de-france"]
  },
  {
    name: "Le Grand Tour des Dolomites",
    description: "Une aventure au cœur des montagnes italiennes les plus spectaculaires.",
    cols: ["Passo Giau", "Passo Fedaia", "Passo Pordoi", "Passo Gardena", "Passo Sella", "Passo Campolongo", "Passo Falzarego"],
    totalElevation: 13500,
    difficulty: "hard",
    region: "Dolomites",
    image: "https://images.unsplash.com/photo-1500100586562-f75301f6db9f",
    estimatedTime: {
      beginner: "7-9 jours",
      intermediate: "5-6 jours",
      advanced: "3-4 jours"
    },
    bestSeason: ["mai", "juin", "juillet", "août", "septembre"],
    tags: ["dolomites", "italie", "giro"]
  },
  {
    name: "La Route des Grands Cols Suisses",
    description: "Une collection des cols les plus impressionnants de Suisse, avec des panoramas à couper le souffle.",
    cols: ["Col du Grand-Saint-Bernard", "Col du Nufenen", "Col de la Furka", "Col du Gothard", "Col du Susten", "Col du Grimsel", "Col de l'Oberalp"],
    totalElevation: 14700,
    difficulty: "hard",
    region: "Alpes suisses",
    image: "https://images.unsplash.com/photo-1481018085669-2bc6e4f00eed",
    estimatedTime: {
      beginner: "8-10 jours",
      intermediate: "5-7 jours",
      advanced: "4-5 jours"
    },
    bestSeason: ["juin", "juillet", "août", "septembre"],
    tags: ["suisse", "alpes", "panorama"]
  },
  {
    name: "Le Défi du Mont Ventoux",
    description: "Conquérir le Géant de Provence par ses trois versants classiques en une seule journée.",
    cols: ["Mont Ventoux (Bédoin)", "Mont Ventoux (Malaucène)", "Mont Ventoux (Sault)"],
    totalElevation: 4400,
    difficulty: "hard",
    region: "Provence",
    image: "https://images.unsplash.com/photo-1526394931762-8a4116f6e3c6",
    estimatedTime: {
      beginner: "2-3 jours",
      intermediate: "1-2 jours",
      advanced: "1 jour"
    },
    bestSeason: ["mai", "juin", "septembre", "octobre"],
    tags: ["ventoux", "provence", "cyclisme"]
  }
];

// Fonction principale pour importer les défis
async function importChallenges() {
  console.log(`[Import] Démarrage de l'importation de ${challengesData.length} défis "Les 7 Majeurs"...`);
  
  // URI de connexion MongoDB spécifiée directement
  const uri = "mongodb+srv://dash-admin:U16G7XR2tC9x4TUA@cluster0grandest.wnfqy.mongodb.net/";
  const dbName = "velo_altitude"; // Utilisation du nom exact de la base de données
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('[Import] Connexion à MongoDB réussie');
    
    const db = client.db(dbName);
    const challengesCollection = db.collection('challenges');
    const colsCollection = db.collection('cols');
    
    // Vérifier si la collection existe déjà et contient des données
    const challengeCount = await challengesCollection.countDocuments();
    console.log(`[Import] La collection 'challenges' existe et contient ${challengeCount} documents`);
    
    // Supprimer automatiquement les défis existants sans demander de confirmation
    if (challengeCount > 0) {
      await challengesCollection.deleteMany({});
      console.log('[Import] Défis existants supprimés');
    }
    
    // Vérifier que les cols référencés existent
    const colNames = new Set();
    challengesData.forEach(challenge => {
      challenge.cols.forEach(col => colNames.add(col));
    });
    
    const missingCols = [];
    for (const colName of colNames) {
      const colExists = await colsCollection.findOne({ name: colName });
      if (!colExists) {
        missingCols.push(colName);
      }
    }
    
    if (missingCols.length > 0) {
      console.warn(`[Import] Attention: Les cols suivants n'existent pas dans la base: ${missingCols.join(', ')}`);
      console.warn('[Import] Continuation de l\'import quand même...');
    }
    
    // Ajouter les timestamps et ids des cols
    const challengesWithTimestampsPromises = challengesData.map(async challenge => {
      // Pour chaque défi, chercher les ids des cols correspondants
      const colsWithIds = [];
      
      for (const colName of challenge.cols) {
        const col = await colsCollection.findOne({ name: colName });
        if (col) {
          colsWithIds.push({
            id: col._id,
            name: col.name,
            elevation: col.elevation,
            difficulty: col.difficulty
          });
        } else {
          // Si le col n'existe pas, ajouter juste le nom
          colsWithIds.push({
            name: colName,
            elevation: 0,
            difficulty: "unknown"
          });
        }
      }
      
      return {
        ...challenge,
        colDetails: colsWithIds,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
        public: true,
        completedBy: [],
        likes: 0
      };
    });
    
    const challengesWithTimestamps = await Promise.all(challengesWithTimestampsPromises);
    
    // Importer les défis
    const result = await challengesCollection.insertMany(challengesWithTimestamps);
    
    console.log(`[Import] ${result.insertedCount} défis importés avec succès`);
    
    // Créer les index
    console.log('[Import] Création des index...');
    await challengesCollection.createIndex({ name: 1 }, { name: 'name_asc' });
    await challengesCollection.createIndex({ difficulty: 1 }, { name: 'difficulty_asc' });
    await challengesCollection.createIndex({ region: 1 }, { name: 'region' });
    await challengesCollection.createIndex({ tags: 1 }, { name: 'tags' });
    await challengesCollection.createIndex({ "colDetails.id": 1 }, { name: 'col_id' });
    await challengesCollection.createIndex({ totalElevation: -1 }, { name: 'elevation_desc' });
    
    console.log('[Import] Index créés avec succès');
    
    // Vérification après import
    const verifyCount = await challengesCollection.countDocuments();
    console.log(`[Import] Vérification : ${verifyCount} défis sont maintenant dans la base de données`);
    
    // Afficher un exemple pour confirmer
    const sampleChallenge = await challengesCollection.findOne({});
    console.log('[Import] Exemple de défi importé :', 
      sampleChallenge ? `${sampleChallenge.name} (${sampleChallenge.cols.length} cols)` : 'Aucun');
    
  } catch (error) {
    console.error('[Import] Erreur lors de l\'importation:', error);
    console.error('[Import] Message d\'erreur complet:', error.message);
    if (error.stack) console.error('[Import] Stack trace:', error.stack);
  } finally {
    await client.close();
    console.log('[Import] Connexion à MongoDB fermée');
  }
}

// Exécuter l'importation sans demander de confirmation
importChallenges().catch(error => {
  console.error('[Import] Erreur fatale:', error);
});
