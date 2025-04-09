/**
 * Service de régénération des profils d'élévation des cols
 * Utilise OpenRouteService pour obtenir des données d'élévation précises
 */
import { ElevationService } from '../elevation/ElevationService';
import { RateLimiter } from '../rate-limiting/RateLimiter';
import { WorkerPool } from '../utils/WorkerPool';
import { ColRepository } from './ColRepository';
import { CacheService } from '../cache/CacheService';
import { 
  Col, 
  ElevationPoint, 
  ElevationProfile, 
  ElevationSegment,
  RegenerationOptions,
  RegenerationResults
} from './types';

export class ColRegenerationService {
  private repository: ColRepository;
  private elevationService: ElevationService;
  private rateLimiter: RateLimiter;
  private cache: CacheService;
  
  constructor() {
    this.repository = new ColRepository();
    this.elevationService = new ElevationService();
    this.rateLimiter = new RateLimiter({
      maxRequests: 40,
      windowMs: 60000, // 1 minute
      retryAfter: 2000 // 2 secondes
    });
    this.cache = new CacheService();
  }

  /**
   * Régénère les profils d'élévation pour tous les cols
   * @param options Options de régénération
   */
  async regenerateAll(options: RegenerationOptions = {}): Promise<RegenerationResults> {
    console.log('Démarrage de la régénération des profils d\'élévation...');
    const startTime = Date.now();
    
    // Initialiser les métriques
    const metrics: RegenerationResults = {
      colsProcessed: 0,
      errors: 0,
      apiCalls: 0,
      cacheHits: 0,
      totalTime: 0,
      averageTimePerCol: 0,
      skipped: 0,
      errorDetails: []
    };

    // Créer une sauvegarde si demandé
    if (options.backup) {
      console.log('Création d\'une sauvegarde...');
      await this.backupCols();
    }

    // Récupérer tous les cols
    console.log('Récupération de la liste des cols...');
    const cols = await this.repository.getAll();
    console.log(`${cols.length} cols trouvés.`);

    // Trier par popularité (simulation - dans une version réelle, utiliser des métriques de popularité)
    cols.sort((a, b) => {
      // Priorité aux cols les plus connus (Alpe d'Huez, Tourmalet, etc.)
      const famousNames = ['Alpe d\'Huez', 'Tourmalet', 'Galibier', 'Ventoux'];
      const aFamous = famousNames.some(name => a.name.includes(name)) ? 1 : 0;
      const bFamous = famousNames.some(name => b.name.includes(name)) ? 1 : 0;
      
      if (aFamous !== bFamous) return bFamous - aFamous;
      
      // Sinon, trier par difficulté et longueur
      return b.avgGradient - a.avgGradient;
    });

    // Créer un pool de workers avec la concurrence spécifiée
    const pool = new WorkerPool(options.concurrency || 3);
    
    // Traiter les cols en parallèle
    for (const col of cols) {
      // Ajouter le col au pool
      pool.add(async () => {
        const colStartTime = Date.now();
        console.log(`Traitement du col "${col.name}"...`);
        
        try {
          // Vérifier le cache si forceRefresh n'est pas activé
          const cacheKey = `col:elevation:${col._id}`;
          
          if (!options.forceRefresh) {
            const cachedProfile = await this.cache.get(cacheKey);
            if (cachedProfile) {
              console.log(`Utilisation du cache pour "${col.name}"`);
              metrics.cacheHits++;
              metrics.colsProcessed++;
              return;
            }
          }
          
          // Vérifier les limites d'API
          await this.rateLimiter.checkLimit();
          metrics.apiCalls++;
          
          // Obtenir le profil d'élévation
          console.log(`Génération du profil d'élévation pour "${col.name}"...`);
          const profile = await this.elevationService.getElevationProfile(col.coordinates);
          
          // Enrichir le profil avec des segments
          console.log(`Détection des segments pour "${col.name}"...`);
          const segments = this.detectSegments(profile.points);
          
          // Calculer la longueur totale et le gradient moyen
          const totalLength = this.calculateTotalLength(profile.points);
          const avgGradient = profile.totalAscent > 0 ? (profile.totalAscent / (totalLength * 1000)) * 100 : 0;
          
          // Créer le profil complet
          const completeProfile: ElevationProfile = {
            ...profile,
            segments,
            length: totalLength,
            avgGradient,
            generatedAt: new Date()
          };
          
          // Valider les données si demandé
          if (options.validateData) {
            const isValid = await this.validateProfile(col._id, completeProfile);
            if (!isValid) {
              throw new Error('Validation du profil échouée');
            }
          }
          
          // Mettre à jour le col
          console.log(`Mise à jour du profil pour "${col.name}"...`);
          await this.repository.updateProfile(col._id, completeProfile);
          
          // Mettre en cache
          await this.cache.set(cacheKey, completeProfile, {
            ttl: 60 * 60 * 24 * 7 // 1 semaine
          });
          
          // Mettre à jour les métriques
          metrics.colsProcessed++;
          const processingTime = Date.now() - colStartTime;
          metrics.totalTime += processingTime;
          
          console.log(`Col "${col.name}" traité en ${processingTime}ms avec ${profile.points.length} points et ${segments.length} segments`);
          
        } catch (error) {
          // Gérer les erreurs
          metrics.errors++;
          metrics.errorDetails.push({
            colId: col._id,
            colName: col.name,
            error: error.message || 'Erreur inconnue'
          });
          
          console.error(`Erreur lors du traitement du col "${col.name}":`, error);
        }
      });
    }
    
    // Attendre que toutes les tâches soient terminées
    console.log('Attente de la fin du traitement de tous les cols...');
    await pool.complete();
    
    // Finaliser les métriques
    const totalDuration = Date.now() - startTime;
    metrics.totalTime = totalDuration;
    metrics.averageTimePerCol = metrics.colsProcessed > 0 
      ? totalDuration / metrics.colsProcessed 
      : 0;
    
    // Afficher un résumé
    console.log('\n=== RÉSUMÉ DE LA RÉGÉNÉRATION ===');
    console.log(`Cols traités: ${metrics.colsProcessed}/${cols.length}`);
    console.log(`Erreurs: ${metrics.errors}`);
    console.log(`Cache hits: ${metrics.cacheHits}`);
    console.log(`Appels API: ${metrics.apiCalls}`);
    console.log(`Temps total: ${totalDuration / 1000}s`);
    console.log(`Temps moyen par col: ${metrics.averageTimePerCol / 1000}s`);
    
    // Fermer les connexions
    await this.repository.close();
    
    return metrics;
  }

  /**
   * Régénère le profil d'élévation pour un col spécifique
   * @param colId ID du col
   * @param retryCount Nombre de tentatives
   */
  async regenerateCol(colId: string, retryCount = 0): Promise<ElevationProfile> {
    try {
      // Récupérer le col
      const col = await this.repository.getById(colId);
      if (!col) {
        throw new Error(`Col ${colId} non trouvé`);
      }
      
      // Vérifier les limites d'API
      await this.rateLimiter.checkLimit();
      
      // Obtenir le profil d'élévation
      const profile = await this.elevationService.getElevationProfile(col.coordinates);
      
      // Enrichir le profil avec des segments
      const segments = this.detectSegments(profile.points);
      
      // Calculer la longueur totale et le gradient moyen
      const totalLength = this.calculateTotalLength(profile.points);
      const avgGradient = profile.totalAscent > 0 ? (profile.totalAscent / (totalLength * 1000)) * 100 : 0;
      
      // Créer le profil complet
      const completeProfile: ElevationProfile = {
        ...profile,
        segments,
        length: totalLength,
        avgGradient,
        generatedAt: new Date()
      };
      
      // Mettre à jour le col
      await this.repository.updateProfile(colId, completeProfile);
      
      // Mettre en cache
      const cacheKey = `col:elevation:${colId}`;
      await this.cache.set(cacheKey, completeProfile, {
        ttl: 60 * 60 * 24 * 7 // 1 semaine
      });
      
      return completeProfile;
      
    } catch (error) {
      // Gérer les erreurs avec retry
      if (error.code === 'RATE_LIMITED' && retryCount < 3) {
        console.log(`Rate limit atteint pour ${colId}, nouvelle tentative dans ${(retryCount + 1) * 5}s...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 5000));
        return this.regenerateCol(colId, retryCount + 1);
      }
      
      if (error.code === 'API_ERROR' && retryCount < 2) {
        console.log(`Erreur API pour ${colId}, nouvelle tentative dans 3s...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return this.regenerateCol(colId, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Détecte les segments d'un profil d'élévation
   * @param points Points du profil d'élévation
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
   * Valide un profil d'élévation
   * @param colId ID du col
   * @param profile Profil d'élévation
   */
  private async validateProfile(colId: string, profile: ElevationProfile): Promise<boolean> {
    const col = await this.repository.getById(colId);
    if (!col) return false;
    
    // Vérifications
    const validations = [
      // Au moins 10 points par km
      {
        check: profile.points.length >= col.length * 10,
        message: 'Pas assez de points d\'élévation'
      },
      // Au moins un segment
      {
        check: profile.segments && profile.segments.length > 0,
        message: 'Aucun segment détecté'
      },
      // Élévation maximale cohérente
      {
        check: Math.abs(profile.maxElevation - col.elevation) <= 50,
        message: 'Élévation maximale incohérente'
      }
    ];
    
    // Vérifier les validations
    const failures = validations
      .filter(v => !v.check)
      .map(v => v.message);
    
    if (failures.length > 0) {
      console.error(`Validation échouée pour "${col.name}": ${failures.join(', ')}`);
      return false;
    }
    
    return true;
  }

  /**
   * Crée une sauvegarde des cols
   */
  private async backupCols(): Promise<void> {
    try {
      const cols = await this.repository.getAll();
      const backupCollection = `cols_backup_${Date.now()}`;
      
      await this.repository.createBackup(backupCollection, cols);
      
      console.log(`Sauvegarde créée: ${backupCollection} (${cols.length} cols)`);
    } catch (error) {
      console.error('Échec de la sauvegarde:', error);
      throw new Error('Échec de la sauvegarde des cols');
    }
  }

  /**
   * Calcule le gradient entre deux points
   * @param start Point de départ
   * @param end Point d'arrivée
   */
  private calculateGradient(start: ElevationPoint, end: ElevationPoint): number {
    const distance = this.calculateDistance(start, end);
    if (distance === 0) return 0;
    
    const elevationDiff = end.elevation - start.elevation;
    return (elevationDiff / (distance * 1000)) * 100; // Convertir en pourcentage
  }

  /**
   * Calcule la distance entre deux points en km
   * @param p1 Premier point
   * @param p2 Deuxième point
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
   * Calcule la distance cumulée jusqu'à un point
   * @param points Liste des points
   * @param startIdx Index de départ
   * @param endIdx Index de fin
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
   * @param deg Degrés
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  /**
   * Classifie un gradient selon sa difficulté
   * @param gradient Gradient en pourcentage
   */
  private classifyGradient(gradient: number): ElevationSegment['classification'] {
    if (gradient <= 3) return 'easy';
    if (gradient <= 6) return 'moderate';
    if (gradient <= 9) return 'challenging';
    if (gradient <= 12) return 'difficult';
    return 'extreme';
  }

  /**
   * Calcule la longueur totale d'un profil d'élévation
   * @param points Points du profil
   */
  private calculateTotalLength(points: ElevationPoint[]): number {
    let totalLength = 0;
    
    for (let i = 1; i < points.length; i++) {
      totalLength += this.calculateDistance(points[i-1], points[i]);
    }
    
    return totalLength;
  }
}
