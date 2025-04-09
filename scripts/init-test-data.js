/**
 * Script d'initialisation de données de test pour Velo-Altitude
 * Crée des challenges et des cols pour tester la régénération des profils d'élévation
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// Configuration MongoDB
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo_altitude?retryWrites=true&w=majority",
  dbName: "velo_altitude",
  collections: {
    challenges: "challenges",
    cols: "cols",
    routes: "routes",
    users: "users"
  }
};

// Données de test pour les cols
const TEST_COLS = [
  {
    name: "Col du Galibier",
    region: "Alpes",
    country: "France",
    elevation: 2642,
    length: 34.8,
    avgGradient: 5.5,
    maxGradient: 10.1,
    difficulty: "hard",
    description: "L'un des cols les plus célèbres du Tour de France",
    coordinates: [45.0612, 6.4085],
    image: "https://example.com/galibier.jpg",
    climbs: [
      {
        side: "nord",
        startCoordinates: [45.1972, 6.4330],
        endCoordinates: [45.0612, 6.4085],
        length: 18.1,
        avgGradient: 6.9,
        maxGradient: 10.1
      },
      {
        side: "sud",
        startCoordinates: [44.9277, 6.3805],
        endCoordinates: [45.0612, 6.4085],
        length: 16.7,
        avgGradient: 6.8,
        maxGradient: 9.2
      }
    ],
    tags: ["tour-de-france", "mythique", "alpes"]
  },
  {
    name: "Alpe d'Huez",
    region: "Alpes",
    country: "France",
    elevation: 1860,
    length: 13.8,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: "hard",
    description: "Célèbre pour ses 21 virages numérotés à l'envers",
    coordinates: [45.0922, 6.0703],
    image: "https://example.com/alpedhuez.jpg",
    climbs: [
      {
        side: "est",
        startCoordinates: [45.0519, 6.0489],
        endCoordinates: [45.0922, 6.0703],
        length: 13.8,
        avgGradient: 8.1,
        maxGradient: 13.0
      }
    ],
    tags: ["tour-de-france", "mythique", "21-virages"]
  },
  {
    name: "Col du Tourmalet",
    region: "Pyrénées",
    country: "France",
    elevation: 2115,
    length: 19.0,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: "hard",
    description: "Le géant des Pyrénées",
    coordinates: [42.9104, 0.1458],
    image: "https://example.com/tourmalet.jpg",
    climbs: [
      {
        side: "est",
        startCoordinates: [42.9727, 0.2324],
        endCoordinates: [42.9104, 0.1458],
        length: 17.2,
        avgGradient: 7.7,
        maxGradient: 10.2
      },
      {
        side: "ouest",
        startCoordinates: [42.8728, 0.0536],
        endCoordinates: [42.9104, 0.1458],
        length: 19.0,
        avgGradient: 7.4,
        maxGradient: 9.5
      }
    ],
    tags: ["tour-de-france", "mythique", "pyrenees"]
  },
  {
    name: "Mont Ventoux",
    region: "Provence",
    country: "France",
    elevation: 1909,
    length: 21.5,
    avgGradient: 7.5,
    maxGradient: 12.0,
    difficulty: "extreme",
    description: "Le géant de Provence",
    coordinates: [44.1741, 5.2789],
    image: "https://example.com/ventoux.jpg",
    climbs: [
      {
        side: "bedoin",
        startCoordinates: [44.1237, 5.1640],
        endCoordinates: [44.1741, 5.2789],
        length: 21.5,
        avgGradient: 7.5,
        maxGradient: 12.0
      },
      {
        side: "malaucene",
        startCoordinates: [44.1754, 5.1321],
        endCoordinates: [44.1741, 5.2789],
        length: 21.2,
        avgGradient: 7.2,
        maxGradient: 12.0
      }
    ],
    tags: ["tour-de-france", "mythique", "provence"]
  },
  {
    name: "Passo dello Stelvio",
    region: "Alpes",
    country: "Italie",
    elevation: 2758,
    length: 24.3,
    avgGradient: 7.4,
    maxGradient: 14.0,
    difficulty: "extreme",
    description: "Le plus haut col routier d'Italie",
    coordinates: [46.5286, 10.4543],
    image: "https://example.com/stelvio.jpg",
    climbs: [
      {
        side: "bormio",
        startCoordinates: [46.4656, 10.3755],
        endCoordinates: [46.5286, 10.4543],
        length: 21.5,
        avgGradient: 7.1,
        maxGradient: 14.0
      },
      {
        side: "prato",
        startCoordinates: [46.6072, 10.4246],
        endCoordinates: [46.5286, 10.4543],
        length: 24.3,
        avgGradient: 7.4,
        maxGradient: 12.0
      }
    ],
    tags: ["giro-italia", "mythique", "alpes-italiennes"]
  }
];

// Données de test pour les challenges
const TEST_CHALLENGES = [
  {
    name: "Challenge des Alpes",
    description: "Conquérez les plus grands cols des Alpes",
    totalElevation: 0, // Sera calculé automatiquement
    difficulty: "hard",
    region: "Alpes",
    cols: ["Col du Galibier", "Alpe d'Huez", "Passo dello Stelvio"],
    colDetails: [] // Sera rempli automatiquement
  },
  {
    name: "Tour de France Highlights",
    description: "Les cols emblématiques du Tour de France",
    totalElevation: 0, // Sera calculé automatiquement
    difficulty: "extreme",
    region: "France",
    cols: ["Col du Galibier", "Alpe d'Huez", "Col du Tourmalet", "Mont Ventoux"],
    colDetails: [] // Sera rempli automatiquement
  },
  {
    name: "Défi Français",
    description: "Les plus beaux cols français",
    totalElevation: 0, // Sera calculé automatiquement
    difficulty: "hard",
    region: "France",
    cols: ["Col du Galibier", "Alpe d'Huez", "Col du Tourmalet", "Mont Ventoux"],
    colDetails: [] // Sera rempli automatiquement
  }
];

/**
 * Fonction principale d'initialisation des données
 */
async function initTestData() {
  let client = null;
  
  try {
    console.log('🚀 Initialisation des données de test...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_CONFIG.uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(MONGODB_CONFIG.dbName);
    const colsCollection = db.collection(MONGODB_CONFIG.collections.cols);
    const challengesCollection = db.collection(MONGODB_CONFIG.collections.challenges);
    
    // Vérifier si des données existent déjà
    const existingColsCount = await colsCollection.countDocuments();
    const existingChallengesCount = await challengesCollection.countDocuments();
    
    console.log(`📊 Données existantes: ${existingColsCount} cols, ${existingChallengesCount} challenges`);
    
    if (existingColsCount > 0 || existingChallengesCount > 0) {
      const clearData = true; // Mettre à true pour effacer les données existantes
      
      if (clearData) {
        console.log('🗑️ Suppression des données existantes...');
        await colsCollection.deleteMany({});
        await challengesCollection.deleteMany({});
        console.log('✅ Données effacées avec succès');
      } else {
        console.log('⚠️ Des données existent déjà. Utilisez l\'option clearData pour les effacer si nécessaire.');
        return;
      }
    }
    
    // Insérer les cols
    console.log('📝 Ajout des cols de test...');
    
    // Enrichir les cols avec des timestamps
    const colsWithTimestamps = TEST_COLS.map(col => ({
      ...col,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    const colsResult = await colsCollection.insertMany(colsWithTimestamps);
    console.log(`✅ ${colsResult.insertedCount} cols ajoutés avec succès`);
    
    // Récupérer les cols insérés avec leurs IDs
    const insertedCols = await colsCollection.find({}).toArray();
    
    // Préparer les challenges avec les références aux cols
    console.log('📝 Préparation des challenges...');
    const preparedChallenges = TEST_CHALLENGES.map(challenge => {
      // Trouver les détails des cols pour ce challenge
      const colDetails = challenge.cols.map(colName => {
        const col = insertedCols.find(c => c.name === colName);
        if (!col) return null;
        
        return {
          _id: col._id,
          name: col.name,
          region: col.region,
          country: col.country,
          elevation: col.elevation,
          length: col.length,
          avgGradient: col.avgGradient,
          maxGradient: col.maxGradient,
          difficulty: col.difficulty,
          coordinates: col.coordinates
        };
      }).filter(col => col !== null);
      
      // Calculer l'élévation totale
      const totalElevation = colDetails.reduce((sum, col) => sum + col.elevation, 0);
      
      return {
        ...challenge,
        colDetails,
        totalElevation,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    // Insérer les challenges
    console.log('📝 Ajout des challenges de test...');
    const challengesResult = await challengesCollection.insertMany(preparedChallenges);
    console.log(`✅ ${challengesResult.insertedCount} challenges ajoutés avec succès`);
    
    console.log('\n📊 Résumé de l\'initialisation:');
    console.log(`✅ ${colsResult.insertedCount} cols ajoutés`);
    console.log(`✅ ${challengesResult.insertedCount} challenges ajoutés`);
    console.log('✅ Base de données initialisée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation des données:', error);
  } finally {
    if (client) {
      console.log('Fermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter le script
initTestData()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
