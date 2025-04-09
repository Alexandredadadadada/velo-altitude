/**
 * Script de régénération des profils d'élévation des cols
 * Extrait les cols depuis les challenges et régénère leurs profils d'élévation
 */

import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import { ColRegenerationService } from '../services/col/ColRegenerationService';
import { Col, RegenerationOptions, RegenerationResults } from '../services/col/types';
import { ColRepository } from '../services/col/ColRepository';

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

// Types
interface Challenge {
  _id: ObjectId;
  name: string;
  description: string;
  cols: Array<Col>;
  totalElevation: number;
  difficulty: string;
  region: string;
  colDetails: Array<Col>;
}

/**
 * Fonction principale de régénération
 */
async function runRegeneration() {
  console.log('🚀 Démarrage de la régénération des cols...');
  
  const startTime = Date.now();
  let client: MongoClient | null = null;
  let colRepository: ColRepository | null = null;
  
  try {
    // Connexion à MongoDB
    console.log('📡 Connexion à MongoDB...');
    client = new MongoClient(MONGODB_CONFIG.uri);
    await client.connect();
    console.log('✅ Connecté à MongoDB');
    
    const db = client.db(MONGODB_CONFIG.dbName);
    const challengesCollection = db.collection<Challenge>(MONGODB_CONFIG.collections.challenges);
    const colsCollection = db.collection<Col>(MONGODB_CONFIG.collections.cols);
    
    // Récupérer tous les challenges pour extraire les cols
    console.log('📚 Extraction des cols depuis les challenges...');
    const challenges = await challengesCollection.find({}).toArray();
    console.log(`📊 ${challenges.length} challenges trouvés`);
    
    if (challenges.length === 0) {
      console.warn('⚠️ Aucun challenge trouvé. Vérifiez la connexion et les permissions.');
      return;
    }
    
    // Créer un ensemble unique de cols à partir de tous les challenges
    const uniqueColsMap = new Map();
    
    challenges.forEach(challenge => {
      challenge.colDetails?.forEach(col => {
        // Utiliser le nom du col comme clé unique
        if (col && col.name) {
          uniqueColsMap.set(col.name, col);
        }
      });
    });
    
    const colsToProcess = Array.from(uniqueColsMap.values());
    console.log(`📊 Nombre total de cols uniques à traiter : ${colsToProcess.length}`);
    
    if (colsToProcess.length === 0) {
      console.warn('⚠️ Aucun col trouvé dans les challenges. Vérifiez le format des données.');
      return;
    }
    
    // S'assurer que les cols sont bien dans la collection cols
    console.log('📝 Vérification et insertion des cols dans la collection cols...');
    for (const col of colsToProcess) {
      // Vérifier si le col existe déjà
      const existingCol = await colsCollection.findOne({ name: col.name });
      
      if (!existingCol) {
        // Ajouter les coordonnées et autres propriétés nécessaires
        const newCol: Col = {
          ...col,
          coordinates: col.coordinates || [col.latitude || 0, col.longitude || 0],
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await colsCollection.insertOne(newCol);
        console.log(`✅ Col ajouté à la collection : ${col.name}`);
      }
    }
    
    // Initialiser le service de régénération
    console.log('🔧 Initialisation du service de régénération...');
    colRepository = new ColRepository();
    const regenerationService = new ColRegenerationService();
    
    // Options de régénération
    const options: RegenerationOptions = {
      concurrency: 3,
      validateData: true,
      forceRefresh: true,
      backup: true
    };
    
    // Lancer la régénération
    console.log('🔄 Démarrage du processus de régénération...');
    const results: RegenerationResults = await regenerationService.regenerateAll(options);
    
    // Afficher les résultats
    console.log('\n📊 Résultats de la régénération :');
    console.log(`✅ Cols traités : ${results.colsProcessed}`);
    console.log(`⚠️ Erreurs : ${results.errors}`);
    console.log(`🌐 Appels API : ${results.apiCalls}`);
    console.log(`💾 Cache hits : ${results.cacheHits}`);
    console.log(`⏩ Cols ignorés : ${results.skipped}`);
    console.log(`⏱️ Temps total : ${results.totalTime/1000}s`);
    console.log(`📈 Temps moyen par col : ${results.averageTimePerCol/1000}s`);
    
    // Récupérer tous les cols mis à jour
    console.log('\n🔄 Récupération des cols mis à jour...');
    const updatedCols = await colsCollection.find({
      elevation_profile: { $exists: true }
    }).toArray();
    
    // Mettre à jour les challenges avec les nouvelles données d'élévation
    console.log('\n🔄 Mise à jour des challenges...');
    
    let updatedChallenges = 0;
    for (const challenge of challenges) {
      if (!challenge.colDetails || challenge.colDetails.length === 0) {
        continue;
      }
      
      const updatedColDetails = challenge.colDetails.map(col => {
        // Trouver le col mis à jour correspondant
        const updatedCol = updatedCols.find(updated => updated.name === col.name);
        
        if (updatedCol && updatedCol.elevation_profile) {
          // Mettre à jour les détails du col avec le profil d'élévation
          return {
            ...col,
            elevation_profile: updatedCol.elevation_profile,
            elevation: updatedCol.elevation_profile.maxElevation,
            length: updatedCol.elevation_profile.length,
            avgGradient: updatedCol.elevation_profile.avgGradient
          };
        }
        
        return col;
      });
      
      // Calculer le total d'élévation mis à jour
      const totalElevation = updatedColDetails.reduce((sum, col) => {
        return sum + (col.elevation_profile?.totalAscent || 0);
      }, 0);
      
      // Mettre à jour le challenge
      await challengesCollection.updateOne(
        { _id: challenge._id },
        { 
          $set: { 
            colDetails: updatedColDetails,
            totalElevation,
            updatedAt: new Date()
          }
        }
      );
      
      updatedChallenges++;
    }
    
    console.log(`✅ Mise à jour terminée : ${updatedChallenges}/${challenges.length} challenges mis à jour`);
    
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ Processus terminé en ${totalTime/1000}s`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la régénération :', error);
    process.exit(1);
  } finally {
    // Fermer proprement la connexion
    if (client) {
      console.log('Fermeture de la connexion MongoDB...');
      await client.close();
      console.log('Connexion fermée');
    }
  }
}

// Exécuter le script
runRegeneration().catch(error => {
  console.error('❌ Erreur non gérée :', error);
  process.exit(1);
});
