/**
 * Script pour vérifier le contenu des bases de données MongoDB
 * et afficher des détails sur les profils d'élévation
 */

const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/?retryWrites=true&w=majority";

async function checkDatabases() {
  let client = null;
  
  try {
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    // Lister toutes les bases de données
    const adminDb = client.db('admin');
    const dbs = await adminDb.admin().listDatabases();
    
    console.log('\n=== BASES DE DONNÉES ===');
    for (const db of dbs.databases) {
      console.log(`📦 ${db.name} (${db.sizeOnDisk} bytes)`);
    }
    
    // Vérifier spécifiquement les bases velo-altitude et velo_altitude
    const databases = ['velo-altitude', 'velo_altitude'];
    
    for (const dbName of databases) {
      console.log(`\n=== BASE DE DONNÉES: ${dbName} ===`);
      
      try {
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length === 0) {
          console.log(`❌ Aucune collection trouvée dans ${dbName}`);
          continue;
        }
        
        console.log(`📚 Collections dans ${dbName}:`);
        for (const collection of collections) {
          console.log(`   - ${collection.name}`);
        }
        
        // Vérifier la collection cols si elle existe
        if (collections.some(c => c.name === 'cols')) {
          const colsCollection = db.collection('cols');
          const count = await colsCollection.countDocuments();
          console.log(`\n📊 ${count} cols trouvés dans ${dbName}.cols`);
          
          // Compter les cols avec profil d'élévation
          const colsWithProfile = await colsCollection.countDocuments({
            'elevation_profile': { $exists: true, $ne: null }
          });
          console.log(`📈 ${colsWithProfile} cols avec profil d'élévation`);
          
          // Compter les cols avec visualization3D
          const colsWith3D = await colsCollection.countDocuments({
            'visualization3D': { $exists: true, $ne: null }
          });
          console.log(`🏔️ ${colsWith3D} cols avec données de visualisation 3D`);
          
          // Afficher un exemple de col avec ses données enrichies
          if (colsWithProfile > 0) {
            const sampleCol = await colsCollection.findOne({
              'elevation_profile': { $exists: true, $ne: null }
            });
            
            console.log('\n=== EXEMPLE DE COL ENRICHI ===');
            console.log(`Nom: ${sampleCol.name}`);
            console.log(`Région: ${sampleCol.region}`);
            console.log(`Altitude: ${sampleCol.elevation}m`);
            
            if (sampleCol.elevation_profile) {
              const profile = sampleCol.elevation_profile;
              console.log('\n📈 PROFIL D\'ÉLÉVATION:');
              console.log(`- Points: ${profile.points ? profile.points.length : 0}`);
              console.log(`- Segments: ${profile.segments ? profile.segments.length : 0}`);
              
              if (profile.stats) {
                console.log(`- Dénivelé positif: ${profile.stats.elevationGain}m`);
                console.log(`- Dénivelé négatif: ${profile.stats.elevationLoss}m`);
                console.log(`- Altitude min: ${profile.stats.minElevation}m`);
                console.log(`- Altitude max: ${profile.stats.maxElevation}m`);
                console.log(`- Distance totale: ${profile.stats.totalDistance}km`);
                console.log(`- Pente moyenne: ${profile.stats.avgGradient}%`);
              }
            }
            
            if (sampleCol.visualization3D) {
              const viz3D = sampleCol.visualization3D;
              console.log('\n🏔️ VISUALISATION 3D:');
              
              if (viz3D.terrain) {
                console.log('- Terrain: Présent');
                console.log(`  - Features: ${viz3D.terrain.features ? viz3D.terrain.features.length : 0}`);
              }
              
              if (viz3D.environment) {
                console.log('- Environnement: Présent');
                if (viz3D.environment.vegetation) {
                  console.log(`  - Zones de végétation: ${viz3D.environment.vegetation.zones.length}`);
                }
                if (viz3D.environment.climate) {
                  console.log(`  - Type de climat: ${viz3D.environment.climate.type}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${dbName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    if (client) {
      console.log('\nFermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée.');
    }
  }
}

// Exécuter la fonction
checkDatabases()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
