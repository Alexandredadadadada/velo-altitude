/**
 * Script de mise à jour des URLs d'images pour les cols
 * 
 * Ce script corrige les problèmes d'images 404 en remplaçant les URLs non fonctionnelles
 * par des liens valides d'Unsplash pour garantir l'affichage correct dans l'interface.
 * 
 * Exécution : node scripts/update-col-images.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

// Configuration de la connexion
const MONGODB_URI = "mongodb+srv://dash-admin:U16G7XR2tC9x4TUA@cluster0grandest.wnfqy.mongodb.net/";
const DB_NAME = "velo_altitude";

// Mapping des noms de cols vers des URLs d'images valides
const validImageUrls = {
  // Cols français
  "Col du Galibier": "https://images.unsplash.com/photo-1472791108553-c9405341e398",
  "Alpe d'Huez": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
  "Col du Tourmalet": "https://images.unsplash.com/photo-1500520198921-6d4704f98092",
  "Col d'Izoard": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
  "Col de la Madeleine": "https://images.unsplash.com/photo-1486901796908-dad827fbbb32",
  "Mont Ventoux": "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99",
  "Col de Peyresourde": "https://images.unsplash.com/photo-1485736231968-0a31c1a1e280",
  "Col d'Aubisque": "https://images.unsplash.com/photo-1468234847176-28606331216a",
  
  // Cols italiens
  "Passo dello Stelvio": "https://images.unsplash.com/photo-1476610182048-b716b8518aae",
  "Passo Giau": "https://images.unsplash.com/photo-1456428199391-a3b1cb5e93ab",
  "Passo Pordoi": "https://images.unsplash.com/photo-1433838552652-f9a46b332c40",
  
  // Cols espagnols
  "Alto de l'Angliru": "https://images.unsplash.com/photo-1474524955719-b9f87c50ce47",
  "Lagos de Covadonga": "https://images.unsplash.com/photo-1605363530004-f93e44718f77",
  
  // Image par défaut pour les autres cols
  "default": "https://images.unsplash.com/photo-1519681393784-d120267933ba"
};

// Fonction pour mettre à jour les images des cols
async function updateColImages() {
  console.log('[Update] Démarrage de la mise à jour des images des cols...');
  
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('[Update] Connexion à MongoDB réussie');
    
    const db = client.db(DB_NAME);
    const colsCollection = db.collection('cols');
    
    // Vérifier si la collection existe
    const colCount = await colsCollection.countDocuments();
    console.log(`[Update] La collection 'cols' contient ${colCount} documents`);
    
    if (colCount === 0) {
      console.log('[Update] Aucun col à mettre à jour');
      return;
    }
    
    // Récupérer tous les cols pour vérification
    const cols = await colsCollection.find({}).toArray();
    console.log(`[Update] ${cols.length} cols récupérés pour mise à jour`);
    
    // Compteurs pour le rapport final
    let updatedCount = 0;
    let unchangedCount = 0;
    let missingImageCount = 0;
    
    // Mettre à jour chaque col
    for (const col of cols) {
      let newImageUrl;
      
      // Vérifier si le col a un mapping d'image spécifique
      if (validImageUrls[col.name]) {
        newImageUrl = validImageUrls[col.name];
      } else {
        // Utiliser l'image par défaut
        newImageUrl = validImageUrls.default;
      }
      
      // Vérifier si le col a déjà une image et si elle doit être mise à jour
      if (!col.image) {
        // Ajouter une image pour les cols qui n'en ont pas
        missingImageCount++;
        await colsCollection.updateOne(
          { _id: col._id },
          { $set: { image: newImageUrl } }
        );
        updatedCount++;
        console.log(`[Update] Image ajoutée pour : ${col.name}`);
      } else if (col.image !== newImageUrl) {
        // Mettre à jour l'image si elle diffère
        await colsCollection.updateOne(
          { _id: col._id },
          { $set: { image: newImageUrl } }
        );
        updatedCount++;
        console.log(`[Update] Image mise à jour pour : ${col.name}`);
      } else {
        // Aucune mise à jour nécessaire
        unchangedCount++;
      }
    }
    
    console.log('\n[Update] Rapport de mise à jour :');
    console.log(`- Cols mis à jour : ${updatedCount}`);
    console.log(`- Cols inchangés : ${unchangedCount}`);
    console.log(`- Cols sans image initiale : ${missingImageCount}`);
    
    // Vérification après mise à jour
    const sampleCol = await colsCollection.findOne({});
    console.log('\n[Update] Exemple de col après mise à jour :');
    console.log(`- Nom : ${sampleCol.name}`);
    console.log(`- Image : ${sampleCol.image}`);
    
  } catch (error) {
    console.error('[Update] Erreur lors de la mise à jour des images :', error);
  } finally {
    await client.close();
    console.log('\n[Update] Mise à jour terminée, connexion fermée');
  }
}

// Exécuter la mise à jour
updateColImages().catch(error => {
  console.error('[Update] Erreur fatale :', error);
});
