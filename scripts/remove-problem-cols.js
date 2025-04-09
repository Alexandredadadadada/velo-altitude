/**
 * Script pour identifier et supprimer les cols problématiques
 * qui n'ont pas pu avoir leur profil d'élévation généré
 */

const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
const readline = require('readline');

// Charger les variables d'environnement
dotenv.config();

// URI de connexion
const uri = process.env.MONGODB_URI || "mongodb+srv://veloaltitude:veloaltitude2025@cluster0grandest.mongodb.net/velo-altitude?retryWrites=true&w=majority";
const dbName = "velo-altitude";

// Fonction pour demander une confirmation à l'utilisateur
function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui');
    });
  });
}

async function removeProblemCols() {
  let client = null;
  
  try {
    console.log('🧹 Identification et suppression des cols problématiques...');
    
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(dbName);
    const colsCollection = db.collection('cols');
    
    // Trouver tous les cols
    console.log('🔍 Recherche des cols...');
    const allCols = await colsCollection.find({}).toArray();
    console.log(`📊 ${allCols.length} cols trouvés au total`);
    
    // Identifier les cols sans profil d'élévation ou avec des profils invalides
    const problemCols = allCols.filter(col => 
      !col.elevation_profile || 
      !col.elevation_profile.points || 
      col.elevation_profile.points.length === 0
    );
    
    console.log(`⚠️ ${problemCols.length} cols problématiques identifiés:`);
    
    if (problemCols.length === 0) {
      console.log('✅ Aucun col problématique trouvé. Tous les cols semblent avoir des profils d\'élévation valides.');
      return;
    }
    
    // Afficher la liste des cols problématiques
    problemCols.forEach((col, index) => {
      console.log(`${index + 1}. ${col.name} (${col.region}, ${col.country}) - ID: ${col._id}`);
    });
    
    // Demander confirmation
    const confirmation = await askForConfirmation('\n⚠️ Voulez-vous supprimer ces cols problématiques ? (y/n): ');
    
    if (!confirmation) {
      console.log('❌ Opération annulée. Aucun col n\'a été supprimé.');
      return;
    }
    
    // Supprimer les cols problématiques
    console.log('🗑️ Suppression des cols problématiques...');
    
    const colIds = problemCols.map(col => col._id);
    const result = await colsCollection.deleteMany({ _id: { $in: colIds } });
    
    console.log(`✅ ${result.deletedCount} cols ont été supprimés avec succès.`);
    
    // Vérifier le nombre de cols restants
    const remainingCount = await colsCollection.countDocuments();
    console.log(`📊 Il reste maintenant ${remainingCount} cols dans la base de données.`);
    
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
removeProblemCols()
  .then(() => console.log('Script terminé'))
  .catch(error => console.error('Erreur non gérée:', error));
