/**
 * Script d'importation des cols alpins dans MongoDB
 * Exécuter avec: node import-cols.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Données des cols à importer
const colsData = [
  {
    name: "Col du Galibier",
    region: "Savoie",
    country: "France",
    elevation: 2642,
    length: 17.7,
    avgGradient: 7.1,
    maxGradient: 12.1,
    difficulty: "hard",
    description: "Le col du Galibier est l'un des plus hauts cols routiers des Alpes françaises, célèbre pour son rôle dans le Tour de France.",
    coordinates: [6.4077, 45.0604],
    image: "https://images.unsplash.com/photo-1527943628938-d1ade17ccb25",
    climbs: [
      {
        side: "nord",
        startLocation: "Valloire",
        length: 18.1,
        elevationGain: 1245,
        avgGradient: 6.9
      },
      {
        side: "sud",
        startLocation: "Col du Lautaret",
        length: 8.5,
        elevationGain: 585,
        avgGradient: 6.9
      }
    ],
    tags: ["tour-de-france", "mythique", "haute-montagne"]
  },
  {
    name: "Alpe d'Huez",
    region: "Isère",
    country: "France",
    elevation: 1850,
    length: 13.8,
    avgGradient: 8.1,
    maxGradient: 13.0,
    difficulty: "hard",
    description: "Célèbre pour ses 21 virages numérotés, l'Alpe d'Huez est l'une des montées les plus emblématiques du Tour de France.",
    coordinates: [6.0694, 45.0909],
    image: "https://images.unsplash.com/photo-1506260408121-e353d10b87c7",
    climbs: [
      {
        side: "est",
        startLocation: "Bourg d'Oisans",
        length: 13.8,
        elevationGain: 1120,
        avgGradient: 8.1
      }
    ],
    tags: ["tour-de-france", "21-virages", "station"]
  },
  {
    name: "Col du Tourmalet",
    region: "Hautes-Pyrénées",
    country: "France",
    elevation: 2115,
    length: 19.0,
    avgGradient: 7.4,
    maxGradient: 10.2,
    difficulty: "hard",
    description: "Le géant des Pyrénées, le col du Tourmalet est le col routier le plus élevé des Pyrénées françaises.",
    coordinates: [0.1414, 42.9069],
    image: "https://images.unsplash.com/photo-1499753593439-850c7cfc3442",
    climbs: [
      {
        side: "est",
        startLocation: "Sainte-Marie-de-Campan",
        length: 17.2,
        elevationGain: 1268,
        avgGradient: 7.4
      },
      {
        side: "ouest",
        startLocation: "Luz-Saint-Sauveur",
        length: 19.0,
        elevationGain: 1404,
        avgGradient: 7.4
      }
    ],
    tags: ["tour-de-france", "pyrénées", "mythique"]
  },
  {
    name: "Col d'Izoard",
    region: "Hautes-Alpes",
    country: "France",
    elevation: 2360,
    length: 14.1,
    avgGradient: 7.3,
    maxGradient: 10.0,
    difficulty: "hard",
    description: "Célèbre pour ses paysages lunaires de la Casse Déserte, l'Izoard est l'un des cols les plus pittoresques des Alpes.",
    coordinates: [6.7347, 44.8203],
    image: "https://images.unsplash.com/photo-1537916169365-a4f4dd09ee7a",
    climbs: [
      {
        side: "sud",
        startLocation: "Guillestre",
        length: 20.0,
        elevationGain: 1150,
        avgGradient: 5.7
      },
      {
        side: "nord",
        startLocation: "Briançon",
        length: 19.0,
        elevationGain: 1105,
        avgGradient: 5.8
      }
    ],
    tags: ["tour-de-france", "casse-déserte", "briançonnais"]
  },
  {
    name: "Col de la Madeleine",
    region: "Savoie",
    country: "France",
    elevation: 2000,
    length: 19.5,
    avgGradient: 7.9,
    maxGradient: 10.3,
    difficulty: "hard",
    description: "Un col alpin exigeant qui relie les vallées de la Maurienne et de la Tarentaise.",
    coordinates: [6.3064, 45.4328],
    image: "https://images.unsplash.com/photo-1544191696-102b28465a0b",
    climbs: [
      {
        side: "nord",
        startLocation: "La Chambre",
        length: 19.5,
        elevationGain: 1550,
        avgGradient: 7.9
      },
      {
        side: "sud",
        startLocation: "Notre-Dame-de-Briançon",
        length: 20.0,
        elevationGain: 1520,
        avgGradient: 7.6
      }
    ],
    tags: ["tour-de-france", "alpes", "maurienne"]
  }
];

// Ajouter 45 cols supplémentaires pour atteindre 50
const additionalCols = [
  { name: "Mont Ventoux", region: "Vaucluse", country: "France", elevation: 1909, length: 21.5, avgGradient: 7.5, maxGradient: 12.0, difficulty: "hard", coordinates: [5.2783, 44.1741] },
  { name: "Col de Peyresourde", region: "Hautes-Pyrénées", country: "France", elevation: 1569, length: 15.3, avgGradient: 6.1, maxGradient: 9.8, difficulty: "medium", coordinates: [0.4459, 42.7969] },
  { name: "Col d'Aubisque", region: "Pyrénées-Atlantiques", country: "France", elevation: 1709, length: 16.6, avgGradient: 7.2, maxGradient: 10.0, difficulty: "hard", coordinates: [-0.3378, 42.9772] },
  { name: "Col du Glandon", region: "Savoie", country: "France", elevation: 1924, length: 21.3, avgGradient: 6.9, maxGradient: 11.0, difficulty: "hard", coordinates: [6.1697, 45.2264] },
  { name: "Col de la Croix de Fer", region: "Savoie", country: "France", elevation: 2067, length: 22.7, avgGradient: 6.8, maxGradient: 11.0, difficulty: "hard", coordinates: [6.1882, 45.2325] },
  { name: "Col de Vars", region: "Hautes-Alpes", country: "France", elevation: 2109, length: 19.0, avgGradient: 5.7, maxGradient: 9.0, difficulty: "medium", coordinates: [6.6847, 44.5402] },
  { name: "Col d'Aspin", region: "Hautes-Pyrénées", country: "France", elevation: 1490, length: 12.0, avgGradient: 6.5, maxGradient: 9.5, difficulty: "medium", coordinates: [0.3258, 42.9367] },
  { name: "Col du Grand Colombier", region: "Ain", country: "France", elevation: 1501, length: 18.3, avgGradient: 7.0, maxGradient: 14.0, difficulty: "hard", coordinates: [5.6172, 45.9031] },
  { name: "Col de Joux Plane", region: "Haute-Savoie", country: "France", elevation: 1691, length: 11.6, avgGradient: 8.5, maxGradient: 12.5, difficulty: "hard", coordinates: [6.7289, 46.1042] },
  { name: "Col de la Loze", region: "Savoie", country: "France", elevation: 2304, length: 21.5, avgGradient: 7.8, maxGradient: 24.0, difficulty: "extreme", coordinates: [6.5833, 45.4167] },
  { name: "Col du Mont Cenis", region: "Savoie", country: "France", elevation: 2083, length: 23.0, avgGradient: 6.1, maxGradient: 10.0, difficulty: "medium", coordinates: [6.8986, 45.2566] },
  { name: "Col d'Ornon", region: "Isère", country: "France", elevation: 1371, length: 14.5, avgGradient: 5.1, maxGradient: 8.0, difficulty: "medium", coordinates: [6.0133, 44.9969] },
  { name: "Col du Lautaret", region: "Hautes-Alpes", country: "France", elevation: 2058, length: 34.0, avgGradient: 3.8, maxGradient: 7.0, difficulty: "medium", coordinates: [6.4058, 45.0342] },
  { name: "Col de la Cayolle", region: "Alpes-Maritimes", country: "France", elevation: 2326, length: 29.0, avgGradient: 4.1, maxGradient: 9.0, difficulty: "medium", coordinates: [6.7447, 44.2542] },
  { name: "Col de la Bonette", region: "Alpes-Maritimes", country: "France", elevation: 2802, length: 24.0, avgGradient: 6.6, maxGradient: 10.0, difficulty: "hard", coordinates: [6.8075, 44.3219] },
  // Ajout de cols italiens
  { name: "Passo dello Stelvio", region: "Lombardie", country: "Italy", elevation: 2758, length: 21.5, avgGradient: 7.1, maxGradient: 14.0, difficulty: "extreme", coordinates: [10.5472, 46.5461] },
  { name: "Passo di Gavia", region: "Lombardie", country: "Italy", elevation: 2621, length: 17.3, avgGradient: 7.9, maxGradient: 16.0, difficulty: "hard", coordinates: [10.4942, 46.3472] },
  { name: "Passo del Mortirolo", region: "Lombardie", country: "Italy", elevation: 1852, length: 12.4, avgGradient: 10.5, maxGradient: 18.0, difficulty: "extreme", coordinates: [10.1747, 46.1978] },
  { name: "Passo Giau", region: "Vénétie", country: "Italy", elevation: 2236, length: 9.8, avgGradient: 9.3, maxGradient: 15.0, difficulty: "hard", coordinates: [12.0569, 46.4669] },
  { name: "Passo Fedaia", region: "Vénétie", country: "Italy", elevation: 2057, length: 14.0, avgGradient: 7.5, maxGradient: 15.0, difficulty: "hard", coordinates: [11.8683, 46.4594] },
  // Ajout de cols suisses
  { name: "Col du Grand-Saint-Bernard", region: "Valais", country: "Switzerland", elevation: 2469, length: 33.0, avgGradient: 5.7, maxGradient: 10.0, difficulty: "medium", coordinates: [7.0703, 45.8692] },
  { name: "Col du Nufenen", region: "Valais", country: "Switzerland", elevation: 2478, length: 13.5, avgGradient: 8.5, maxGradient: 13.0, difficulty: "hard", coordinates: [8.3883, 46.4775] },
  { name: "Col de la Furka", region: "Uri", country: "Switzerland", elevation: 2429, length: 16.5, avgGradient: 7.8, maxGradient: 12.0, difficulty: "hard", coordinates: [8.4156, 46.5717] },
  { name: "Col du Gothard", region: "Tessin", country: "Switzerland", elevation: 2106, length: 13.0, avgGradient: 7.1, maxGradient: 12.0, difficulty: "hard", coordinates: [8.5656, 46.5503] },
  { name: "Col du Susten", region: "Berne", country: "Switzerland", elevation: 2224, length: 17.0, avgGradient: 7.6, maxGradient: 10.0, difficulty: "hard", coordinates: [8.4461, 46.7294] },
  // Ajout de cols espagnols
  { name: "Alto de l'Angliru", region: "Asturies", country: "Spain", elevation: 1573, length: 12.5, avgGradient: 10.1, maxGradient: 23.5, difficulty: "extreme", coordinates: [-5.7794, 43.2442] },
  { name: "Lagos de Covadonga", region: "Asturies", country: "Spain", elevation: 1134, length: 12.6, avgGradient: 7.3, maxGradient: 14.0, difficulty: "hard", coordinates: [-4.9931, 43.2728] },
  { name: "Puerto de Pajares", region: "Asturies", country: "Spain", elevation: 1379, length: 14.2, avgGradient: 6.5, maxGradient: 10.0, difficulty: "medium", coordinates: [-5.7592, 43.0031] },
  { name: "Puerto de la Ragua", region: "Andalousie", country: "Spain", elevation: 2041, length: 16.3, avgGradient: 5.4, maxGradient: 8.0, difficulty: "medium", coordinates: [-3.0361, 37.1122] },
  { name: "Coll de la Gallina", region: "Andorre", country: "Andorra", elevation: 1910, length: 9.7, avgGradient: 8.3, maxGradient: 15.0, difficulty: "hard", coordinates: [1.4889, 42.4881] },
  // Ajout de cols autrichiens
  { name: "Großglockner", region: "Carinthie", country: "Austria", elevation: 2505, length: 17.2, avgGradient: 9.0, maxGradient: 14.0, difficulty: "hard", coordinates: [12.7589, 47.0856] },
  { name: "Silvretta Hochalpenstraße", region: "Tyrol", country: "Austria", elevation: 2036, length: 22.3, avgGradient: 5.6, maxGradient: 13.0, difficulty: "medium", coordinates: [10.0919, 46.9397] },
  { name: "Kitzbüheler Horn", region: "Tyrol", country: "Austria", elevation: 1996, length: 9.6, avgGradient: 12.5, maxGradient: 22.0, difficulty: "extreme", coordinates: [12.3906, 47.4500] },
  { name: "Rettenbachferner", region: "Tyrol", country: "Austria", elevation: 2675, length: 13.5, avgGradient: 10.8, maxGradient: 16.0, difficulty: "extreme", coordinates: [10.9158, 46.8583] },
  { name: "Timmelsjoch", region: "Tyrol", country: "Austria", elevation: 2509, length: 28.7, avgGradient: 6.0, maxGradient: 14.0, difficulty: "hard", coordinates: [11.0961, 46.9092] },
  // Ajout de cols divers en Europe
  { name: "Col du Mont Ventoux (Bédoin)", region: "Vaucluse", country: "France", elevation: 1909, length: 21.5, avgGradient: 7.5, maxGradient: 12.0, difficulty: "hard", coordinates: [5.2783, 44.1741] },
  { name: "Col du Mont Ventoux (Malaucène)", region: "Vaucluse", country: "France", elevation: 1909, length: 21.2, avgGradient: 7.2, maxGradient: 12.0, difficulty: "hard", coordinates: [5.2783, 44.1741] },
  { name: "Col du Mont Ventoux (Sault)", region: "Vaucluse", country: "France", elevation: 1909, length: 26.0, avgGradient: 4.6, maxGradient: 11.0, difficulty: "medium", coordinates: [5.2783, 44.1741] },
  { name: "Sa Calobra", region: "Majorque", country: "Spain", elevation: 682, length: 9.9, avgGradient: 7.0, maxGradient: 12.0, difficulty: "medium", coordinates: [2.8047, 39.8508] },
  { name: "Alpe d'Huez (via Col de Sarenne)", region: "Isère", country: "France", elevation: 1850, length: 15.3, avgGradient: 7.2, maxGradient: 12.0, difficulty: "hard", coordinates: [6.0694, 45.0909] },
  { name: "Monte Zoncolan", region: "Frioul-Vénétie Julienne", country: "Italy", elevation: 1730, length: 10.1, avgGradient: 11.9, maxGradient: 22.0, difficulty: "extreme", coordinates: [12.9275, 46.5014] },
  { name: "Pico Veleta", region: "Andalousie", country: "Spain", elevation: 3398, length: 43.0, avgGradient: 6.5, maxGradient: 15.0, difficulty: "hard", coordinates: [-3.3672, 37.0544] },
  { name: "Puy Mary", region: "Cantal", country: "France", elevation: 1589, length: 12.0, avgGradient: 7.0, maxGradient: 12.0, difficulty: "hard", coordinates: [2.6828, 45.1119] },
  { name: "Col de la Ramaz", region: "Haute-Savoie", country: "France", elevation: 1619, length: 13.9, avgGradient: 7.0, maxGradient: 10.2, difficulty: "hard", coordinates: [6.5656, 46.1508] },
  { name: "Col de l'Iseran", region: "Savoie", country: "France", elevation: 2770, length: 48.0, avgGradient: 4.0, maxGradient: 12.0, difficulty: "medium", coordinates: [7.0322, 45.4203] }
];

// Ajouter les cols supplémentaires
colsData.push(...additionalCols);

// Fonction pour enrichir les données des cols additionnels avec des informations complètes
function enrichColData(colsArray) {
  return colsArray.map(col => {
    // Si c'est déjà un col complet (avec description etc.), retourner tel quel
    if (col.description) return col;
    
    // Sinon, ajouter les champs manquants
    return {
      ...col,
      description: `Le col ${col.name} est situé dans la région ${col.region}, à une altitude de ${col.elevation}m.`,
      image: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000000)}`,
      climbs: [
        {
          side: "principal",
          startLocation: "Ville en bas",
          length: col.length,
          elevationGain: Math.floor(col.length * col.avgGradient * 10), // Approximation
          avgGradient: col.avgGradient
        }
      ],
      tags: [col.country.toLowerCase(), col.difficulty, col.region.toLowerCase().replace(/ /g, '-')]
    };
  });
}

// Enrichir les données
const enrichedColsData = enrichColData(colsData);

// Fonction principale pour importer les données
async function importCols() {
  console.log(`[Import] Démarrage de l'importation de ${enrichedColsData.length} cols...`);
  
  // URI de connexion MongoDB spécifiée directement
  const uri = "mongodb+srv://dash-admin:U16G7XR2tC9x4TUA@cluster0grandest.wnfqy.mongodb.net/";
  const dbName = "velo_altitude"; // Utilisation du nom exact de la base de données
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('[Import] Connexion à MongoDB réussie');
    
    const db = client.db(dbName);
    const colsCollection = db.collection('cols');
    
    // Vérifier si la collection existe déjà et contient des données
    const colCount = await colsCollection.countDocuments();
    console.log(`[Import] La collection 'cols' existe et contient ${colCount} documents`);
    
    // Supprimer automatiquement les données existantes sans demander de confirmation
    if (colCount > 0) {
      await colsCollection.deleteMany({});
      console.log('[Import] Données existantes supprimées');
    }
    
    // Ajouter les timestamps
    const colsWithTimestamps = enrichedColsData.map(col => ({
      ...col,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Importer les cols
    const result = await colsCollection.insertMany(colsWithTimestamps);
    
    console.log(`[Import] ${result.insertedCount} cols importés avec succès`);
    
    // Créer les index
    console.log('[Import] Création des index...');
    await colsCollection.createIndex({ coordinates: '2d' }, { name: 'coords_2d' });
    await colsCollection.createIndex({ name: 1 }, { name: 'name_asc' });
    await colsCollection.createIndex({ elevation: -1 }, { name: 'elevation_desc' });
    await colsCollection.createIndex({ difficulty: 1 }, { name: 'difficulty_asc' });
    await colsCollection.createIndex({ region: 1, country: 1 }, { name: 'region_country' });
    await colsCollection.createIndex({ tags: 1 }, { name: 'tags' });
    
    console.log('[Import] Index créés avec succès');
    
    // Vérification après import
    const verifyCount = await colsCollection.countDocuments();
    console.log(`[Import] Vérification : ${verifyCount} cols sont maintenant dans la base de données`);
    
    // Afficher un exemple pour confirmer
    const sampleCol = await colsCollection.findOne({});
    console.log('[Import] Exemple de col importé :', 
      sampleCol ? `${sampleCol.name} (${sampleCol.elevation}m)` : 'Aucun');
    
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
importCols().catch(error => {
  console.error('[Import] Erreur fatale:', error);
});
