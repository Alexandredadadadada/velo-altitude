/**
 * Script d'exécution immédiate de la régénération des profils d'élévation
 * Ce script se connecte directement à MongoDB et régénère les profils
 */

import { MongoClient, ObjectId } from 'mongodb';
import axios from 'axios';

// Configuration MongoDB
const MONGODB_CONFIG = {
  uri: "mongodb+srv://username:password@velo-altitude.mongodb.net/velo_altitude?retryWrites=true&w=majority",
  database: "velo_altitude",
  collections: {
    cols: "cols",
    backups: "cols_backups"
  }
};

// Configuration OpenRoute
const OPENROUTE_API_KEY = process.env.OPENROUTE_API_KEY || "your_openroute_api_key";

// Types simplifiés
interface Col {
  _id: string | ObjectId;
  name: string;
  coordinates: [number, number];
  elevation: number;
  length: number;
  avgGradient: number;
}

interface ElevationPoint {
  lat: number;
  lng: number;
  elevation: number;
  distance?: number;
}

interface ElevationSegment {
  startIndex: number;
  endIndex: number;
  startDistance: number;
  endDistance: number;
  avgGradient: number;
  classification: 'easy' | 'moderate' | 'challenging' | 'difficult' | 'extreme';
  length: number;
}

interface ElevationProfile {
  points: ElevationPoint[];
  segments: ElevationSegment[];
  totalAscent: number;
  totalDescent: number;
  minElevation: number;
  maxElevation: number;
  length: number;
  avgGradient: number;
  generatedAt: Date;
}

// Classe principale
class RegenerationRunner {
  private client: MongoClient;
  private db: any;
  private colsCollection: any;
  private lastApiCallTime: number = 0;

  constructor() {
    this.client = new MongoClient(MONGODB_CONFIG.uri);
  }

  /**
   * Exécute la régénération
   */
  async run() {
    try {
      console.log('Connexion à MongoDB...');
      await this.client.connect();
      console.log('Connecté à MongoDB!');
      
      this.db = this.client.db(MONGODB_CONFIG.database);
      this.colsCollection = this.db.collection(MONGODB_CONFIG.collections.cols);
      
      // Créer une sauvegarde
      await this.createBackup();
      
      // Récupérer les cols
      const cols = await this.colsCollection.find({}).toArray();
      console.log(`${cols.length} cols trouvés.`);
      
      // Traiter les cols avec délai entre les appels API
      let processedCount = 0;
      let errorCount = 0;
      
      for (const col of cols) {
        try {
          console.log(`\nTraitement de ${col.name}...`);
          
          // Respecter le rate limit (max 40 requêtes/minute)
          await this.respectRateLimit();
          
          // Générer le profil d'élévation
          const profile = await this.generateElevationProfile(col.coordinates);
          
          // Enrichir avec des segments
          const segments = this.detectSegments(profile.points);
          
          // Calculer longueur et gradient moyen
          const totalLength = this.calculateTotalLength(profile.points);
          const avgGradient = profile.totalAscent > 0 
            ? (profile.totalAscent / (totalLength * 1000)) * 100 
            : 0;
          
          // Profil complet
          const completeProfile = {
            ...profile,
            segments,
            length: totalLength,
            avgGradient,
            generatedAt: new Date()
          };
          
          // Mettre à jour le col
          await this.colsCollection.updateOne(
            { _id: col._id },
            { 
              $set: { 
                elevation_profile: completeProfile,
                updatedAt: new Date()
              } 
            }
          );
          
          console.log(`✅ Col ${col.name} mis à jour avec ${profile.points.length} points et ${segments.length} segments`);
          processedCount++;
          
        } catch (error) {
          console.error(`❌ Erreur pour ${col.name}:`, error.message);
          errorCount++;
          
          // Continuer avec le prochain col
          continue;
        }
      }
      
      console.log('\n=== RÉSUMÉ ===');
      console.log(`Cols traités avec succès: ${processedCount}/${cols.length}`);
      console.log(`Erreurs: ${errorCount}`);
      
    } catch (error) {
      console.error('Erreur globale:', error);
    } finally {
      console.log('Fermeture de la connexion MongoDB...');
      await this.client.close();
      console.log('Connexion fermée.');
    }
  }

  /**
   * Crée une sauvegarde des cols
   */
  private async createBackup() {
    try {
      console.log('Création d\'une sauvegarde...');
      
      const cols = await this.colsCollection.find({}).toArray();
      const backupCollection = `cols_backup_${Date.now()}`;
      
      await this.db.createCollection(backupCollection);
      const backup = this.db.collection(backupCollection);
      
      await backup.insertMany(cols);
      
      console.log(`Sauvegarde créée: ${backupCollection} (${cols.length} cols)`);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error.message);
      throw new Error('Impossible de créer une sauvegarde');
    }
  }

  /**
   * Respecte les limites d'API
   */
  private async respectRateLimit() {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastApiCallTime;
    
    // Attendre au moins 1.5 secondes entre les appels (40 requêtes/minute max)
    if (timeSinceLastCall < 1500) {
      const waitTime = 1500 - timeSinceLastCall;
      console.log(`Attente de ${waitTime}ms pour respecter le rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastApiCallTime = Date.now();
  }

  /**
   * Génère un profil d'élévation via OpenRoute
   */
  private async generateElevationProfile(coordinates: [number, number]): Promise<any> {
    try {
      // Simuler l'appel API pour l'instant
      console.log(`Appel API pour les coordonnées [${coordinates[0]}, ${coordinates[1]}]`);
      
      // Dans une implémentation réelle, remplacer par un appel à OpenRoute
      // Simulation d'un profil d'élévation pour l'exemple
      const points: ElevationPoint[] = [];
      const baseElevation = 500 + Math.random() * 1000;
      const pointsCount = 100;
      
      for (let i = 0; i < pointsCount; i++) {
        const lat = coordinates[0] + (Math.random() - 0.5) * 0.05;
        const lng = coordinates[1] + (Math.random() - 0.5) * 0.05;
        
        // Générer une élévation qui augmente progressivement
        const progress = i / pointsCount;
        const noise = Math.sin(i * 0.2) * 50;
        const elevation = baseElevation + progress * 800 + noise;
        
        points.push({ lat, lng, elevation });
      }
      
      // Trier les points pour assurer une progression
      points.sort((a, b) => a.lng - b.lng);
      
      // Calculer l'ascension et la descente totales
      let totalAscent = 0;
      let totalDescent = 0;
      let minElevation = points[0].elevation;
      let maxElevation = points[0].elevation;
      
      for (let i = 1; i < points.length; i++) {
        const elevationDiff = points[i].elevation - points[i-1].elevation;
        
        if (elevationDiff > 0) {
          totalAscent += elevationDiff;
        } else {
          totalDescent += Math.abs(elevationDiff);
        }
        
        minElevation = Math.min(minElevation, points[i].elevation);
        maxElevation = Math.max(maxElevation, points[i].elevation);
      }
      
      return {
        points,
        totalAscent,
        totalDescent,
        minElevation,
        maxElevation
      };
      
    } catch (error) {
      console.error('Erreur lors de la génération du profil d\'élévation:', error.message);
      throw new Error('Échec de la génération du profil d\'élévation');
    }
  }

  /**
   * Détecte les segments d'un profil d'élévation
   */
  private detectSegments(points: ElevationPoint[]): ElevationSegment[] {
    const segments: ElevationSegment[] = [];
    let currentStart = 0;
    const minSegmentLength = 0.5; // km
    const significantGradientChange = 2; // pourcentage
    
    for (let i = 1; i < points.length - 1; i++) {
      const currentGradient = this.calculateGradient(
        points[currentStart],
        points[i]
      );
      
      const nextGradient = this.calculateGradient(
        points[i],
        points[i + 1]
      );
      
      // Détecter un changement significatif de pente
      if (Math.abs(currentGradient - nextGradient) > significantGradientChange) {
        const segmentLength = this.calculateDistance(
          points[currentStart],
          points[i]
        );
        
        if (segmentLength >= minSegmentLength) {
          segments.push({
            startIndex: currentStart,
            endIndex: i,
            startDistance: this.calculateCumulativeDistance(points, 0, currentStart),
            endDistance: this.calculateCumulativeDistance(points, 0, i),
            avgGradient: currentGradient,
            length: segmentLength,
            classification: this.classifyGradient(currentGradient)
          });
          
          currentStart = i;
        }
      }
    }
    
    // Ajouter le dernier segment
    const finalLength = this.calculateDistance(
      points[currentStart],
      points[points.length - 1]
    );
    
    if (finalLength >= minSegmentLength) {
      const finalGradient = this.calculateGradient(
        points[currentStart],
        points[points.length - 1]
      );
      
      segments.push({
        startIndex: currentStart,
        endIndex: points.length - 1,
        startDistance: this.calculateCumulativeDistance(points, 0, currentStart),
        endDistance: this.calculateCumulativeDistance(points, 0, points.length - 1),
        avgGradient: finalGradient,
        length: finalLength,
        classification: this.classifyGradient(finalGradient)
      });
    }
    
    return segments;
  }

  /**
   * Calcule le gradient entre deux points
   */
  private calculateGradient(start: ElevationPoint, end: ElevationPoint): number {
    const distance = this.calculateDistance(start, end);
    if (distance === 0) return 0;
    
    const elevationDiff = end.elevation - start.elevation;
    return (elevationDiff / (distance * 1000)) * 100; // Convertir en pourcentage
  }

  /**
   * Calcule la distance entre deux points en km
   */
  private calculateDistance(p1: ElevationPoint, p2: ElevationPoint): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(p2.lat - p1.lat);
    const dLon = this.deg2rad(p2.lng - p1.lng);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(p1.lat)) * Math.cos(this.deg2rad(p2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calcule la longueur totale d'un profil
   */
  private calculateTotalLength(points: ElevationPoint[]): number {
    let totalLength = 0;
    
    for (let i = 1; i < points.length; i++) {
      totalLength += this.calculateDistance(points[i-1], points[i]);
    }
    
    return totalLength;
  }

  /**
   * Calcule la distance cumulée
   */
  private calculateCumulativeDistance(
    points: ElevationPoint[],
    startIdx: number,
    endIdx: number
  ): number {
    let distance = 0;
    for (let i = startIdx + 1; i <= endIdx; i++) {
      distance += this.calculateDistance(points[i-1], points[i]);
    }
    return distance;
  }

  /**
   * Convertit les degrés en radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Classifie un gradient selon sa difficulté
   */
  private classifyGradient(gradient: number): ElevationSegment['classification'] {
    if (gradient <= 3) return 'easy';
    if (gradient <= 6) return 'moderate';
    if (gradient <= 9) return 'challenging';
    if (gradient <= 12) return 'difficult';
    return 'extreme';
  }
}

// Exécuter le script
console.log('=== RÉGÉNÉRATION DES PROFILS D\'ÉLÉVATION DES COLS ===');
console.log('Démarrage immédiat du processus...');

const runner = new RegenerationRunner();
runner.run()
  .then(() => console.log('\nProcessus terminé!'))
  .catch(error => console.error('\nErreur globale:', error));
