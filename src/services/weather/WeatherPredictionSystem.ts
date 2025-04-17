/**
 * Système de prédiction météorologique
 * Anticipe les changements météo probables pour optimiser le préchargement et les transitions
 */

import { WeatherConditions } from '../../api/orchestration/weather/WeatherApiIntegration';
import { GeoLocation } from '../../config/visualizationConfig';

// Interface pour les transitions météo
interface WeatherTransition {
  from: string;
  to: string;
  colId: string;
  duration: number;
  timestamp: number;
}

// Interface pour l'état météo actuel
interface WeatherState {
  type: string;
  conditions: WeatherConditions;
  timestamp: number;
  location: GeoLocation;
  colId: string;
}

/**
 * Classe principale pour la prédiction météorologique
 */
export class WeatherPredictionSystem {
  // Historique des transitions météo par col
  private transitionHistory: Map<string, Array<WeatherTransition>> = new Map();
  
  // États météo actuels par col
  private currentStates: Map<string, WeatherState> = new Map();
  
  // Modèles de succession météo typiques
  private weatherPatterns: Array<{
    sequence: string[];
    probability: number;
    seasonalWeight: { [season: string]: number };
  }> = [
    {
      sequence: ['clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain'],
      probability: 0.25,
      seasonalWeight: { spring: 1.5, summer: 1.2, autumn: 1.0, winter: 0.7 }
    },
    {
      sequence: ['cloudy', 'light_snow', 'snow'],
      probability: 0.2,
      seasonalWeight: { spring: 0.5, summer: 0.0, autumn: 0.5, winter: 2.0 }
    },
    {
      sequence: ['clear', 'windy', 'partly_cloudy'],
      probability: 0.15,
      seasonalWeight: { spring: 1.2, summer: 0.7, autumn: 1.3, winter: 0.9 }
    },
    {
      sequence: ['fog', 'light_rain', 'clear'],
      probability: 0.1,
      seasonalWeight: { spring: 1.3, summer: 0.5, autumn: 1.7, winter: 1.0 }
    }
  ];
  
  // Callbacks pour les prédictions
  private predictionCallbacks: Array<(predictions: string[], colId: string) => void> = [];
  
  constructor() {
    // Intervalle pour nettoyer l'historique ancien
    setInterval(() => this.cleanupHistory(), 24 * 60 * 60 * 1000); // 24h
  }
  
  /**
   * Enregistre une transition météo
   * @param from État météo précédent
   * @param to État météo actuel
   * @param colId Identifiant du col
   * @param duration Durée de la transition en ms
   */
  public recordTransition(from: string, to: string, colId: string, duration: number): void {
    const colKey = this.getColKey(colId);
    
    if (!this.transitionHistory.has(colKey)) {
      this.transitionHistory.set(colKey, []);
    }
    
    const transitions = this.transitionHistory.get(colKey)!;
    
    // Ajouter la nouvelle transition
    transitions.push({
      from,
      to,
      colId,
      duration,
      timestamp: Date.now()
    });
    
    // Limiter la taille de l'historique
    if (transitions.length > 100) {
      transitions.shift(); // Supprimer la plus ancienne
    }
    
    // Générer de nouvelles prédictions après chaque transition
    const predictions = this.predictNextWeather(colId);
    this.notifyPredictionListeners(predictions, colId);
  }
  
  /**
   * Mettre à jour l'état météo actuel pour un col
   * @param colId ID du col
   * @param conditions Conditions météo
   * @param type Type météo
   * @param location Localisation géographique
   */
  public updateCurrentState(
    colId: string,
    conditions: WeatherConditions,
    type: string,
    location: GeoLocation
  ): void {
    const previousState = this.currentStates.get(this.getColKey(colId));
    
    // Enregistrer le nouvel état
    this.currentStates.set(this.getColKey(colId), {
      type,
      conditions,
      timestamp: Date.now(),
      location,
      colId
    });
    
    // Si un état précédent existe, enregistrer la transition
    if (previousState && previousState.type !== type) {
      const duration = Date.now() - previousState.timestamp;
      this.recordTransition(previousState.type, type, colId, duration);
    }
  }
  
  /**
   * Prédit les prochains états météo probables
   * @param colId ID du col
   * @param count Nombre de prédictions à retourner
   * @returns Liste des états météo prédits
   */
  public predictNextWeather(colId: string, count: number = 3): string[] {
    const colKey = this.getColKey(colId);
    const currentState = this.currentStates.get(colKey);
    
    if (!currentState) {
      return this.getDefaultPredictions();
    }
    
    // Combiner plusieurs approches de prédiction
    const predictions = new Map<string, number>();
    
    // 1. Prédiction basée sur l'historique des transitions
    this.addHistoricalPredictions(predictions, colKey, currentState.type);
    
    // 2. Prédiction basée sur les modèles météo connus
    this.addPatternPredictions(predictions, currentState.type);
    
    // 3. Prédiction basée sur la saison actuelle
    this.addSeasonalPredictions(predictions, currentState);
    
    // Trier par probabilité décroissante et prendre les N premiers
    return Array.from(predictions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([state]) => state);
  }
  
  /**
   * S'abonne aux prédictions météo
   * @param callback Fonction appelée lors d'une nouvelle prédiction
   * @returns Fonction pour se désabonner
   */
  public onPrediction(
    callback: (predictions: string[], colId: string) => void
  ): () => void {
    this.predictionCallbacks.push(callback);
    
    // Retourner une fonction pour se désabonner
    return () => {
      this.predictionCallbacks = this.predictionCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Obtient le type météo le plus probable pour une localisation et date donnée
   * @param location Localisation géographique
   * @param date Date cible (optionnel, par défaut date actuelle)
   * @returns Type météo le plus probable
   */
  public getMostLikelyWeather(location: GeoLocation, date: Date = new Date()): string {
    // Récupérer les cols proches de cette localisation
    const nearbyColIds = this.findNearbyCols(location);
    
    if (nearbyColIds.length === 0) {
      return this.getDefaultWeatherForSeason(this.getCurrentSeason(date));
    }
    
    // Agréger les prédictions pour tous les cols proches
    const predictions = new Map<string, number>();
    
    nearbyColIds.forEach(colId => {
      const colPredictions = this.predictNextWeather(colId);
      
      colPredictions.forEach((prediction, index) => {
        // Les premières prédictions ont plus de poids
        const weight = 1 / (index + 1);
        predictions.set(
          prediction, 
          (predictions.get(prediction) || 0) + weight
        );
      });
    });
    
    // Retourner le type le plus probable
    let maxProb = 0;
    let mostLikely = 'clear';
    
    predictions.forEach((prob, type) => {
      if (prob > maxProb) {
        maxProb = prob;
        mostLikely = type;
      }
    });
    
    return mostLikely;
  }
  
  /**
   * Trouve les cols proches d'une localisation
   * @param location Localisation géographique
   * @param maxDistance Distance maximale en km
   * @returns Liste des IDs de cols
   */
  private findNearbyCols(location: GeoLocation, maxDistance: number = 50): string[] {
    const result: string[] = [];
    
    this.currentStates.forEach((state, key) => {
      const distance = this.calculateDistance(
        location.latitude, location.longitude,
        state.location.latitude, state.location.longitude
      );
      
      if (distance <= maxDistance) {
        result.push(state.colId);
      }
    });
    
    return result;
  }
  
  /**
   * Calcule la distance entre deux points géographiques
   * @returns Distance en kilomètres
   */
  private calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * Ajoute les prédictions basées sur l'historique spécifique au col
   */
  private addHistoricalPredictions(
    predictions: Map<string, number>,
    colKey: string,
    currentType: string
  ): void {
    const transitions = this.transitionHistory.get(colKey) || [];
    
    // Filtrer les transitions partant de l'état actuel
    const relevantTransitions = transitions.filter(t => t.from === currentType);
    
    if (relevantTransitions.length === 0) return;
    
    // Compter les fréquences de transition
    const counts = new Map<string, number>();
    let total = 0;
    
    relevantTransitions.forEach(t => {
      counts.set(t.to, (counts.get(t.to) || 0) + 1);
      total++;
    });
    
    // Convertir en probabilités
    counts.forEach((count, to) => {
      const probability = count / total * 0.6; // Coefficient d'importance
      predictions.set(to, (predictions.get(to) || 0) + probability);
    });
  }
  
  /**
   * Ajoute les prédictions basées sur les modèles météo connus
   */
  private addPatternPredictions(
    predictions: Map<string, number>,
    currentType: string
  ): void {
    const season = this.getCurrentSeason();
    
    this.weatherPatterns.forEach(pattern => {
      const currentIndex = pattern.sequence.indexOf(currentType);
      
      if (currentIndex >= 0 && currentIndex < pattern.sequence.length - 1) {
        const nextType = pattern.sequence[currentIndex + 1];
        const seasonWeight = pattern.seasonalWeight[season] || 1.0;
        const probability = pattern.probability * seasonWeight * 0.3; // Coefficient d'importance
        
        predictions.set(nextType, (predictions.get(nextType) || 0) + probability);
      }
    });
  }
  
  /**
   * Ajoute les prédictions basées sur la saison
   */
  private addSeasonalPredictions(
    predictions: Map<string, number>,
    currentState: WeatherState
  ): void {
    const season = this.getCurrentSeason();
    const time = new Date().getHours();
    const altitude = currentState.location.altitude;
    
    // Prédictions spécifiques à la saison et à l'altitude
    if (season === 'winter' && altitude > 1500) {
      predictions.set('snow', (predictions.get('snow') || 0) + 0.2);
      predictions.set('light_snow', (predictions.get('light_snow') || 0) + 0.15);
    } else if (season === 'summer' && time > 14 && time < 18) {
      predictions.set('thunderstorm', (predictions.get('thunderstorm') || 0) + 0.2);
    } else if (season === 'autumn' && time < 10) {
      predictions.set('fog', (predictions.get('fog') || 0) + 0.2);
    } else if (season === 'spring') {
      predictions.set('light_rain', (predictions.get('light_rain') || 0) + 0.15);
    }
  }
  
  /**
   * Obtient la clé de stockage pour un col
   */
  private getColKey(colId: string): string {
    return `col_${colId}`;
  }
  
  /**
   * Obtient la saison actuelle
   */
  private getCurrentSeason(date: Date = new Date()): 'spring' | 'summer' | 'autumn' | 'winter' {
    const month = date.getMonth();
    
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }
  
  /**
   * Obtient le type météo par défaut pour une saison
   */
  private getDefaultWeatherForSeason(season: string): string {
    switch (season) {
      case 'spring': return 'light_rain';
      case 'summer': return 'clear';
      case 'autumn': return 'partly_cloudy';
      case 'winter': return 'snow';
      default: return 'clear';
    }
  }
  
  /**
   * Obtient les prédictions par défaut
   */
  private getDefaultPredictions(): string[] {
    const season = this.getCurrentSeason();
    
    switch (season) {
      case 'spring':
        return ['light_rain', 'partly_cloudy', 'clear'];
      case 'summer':
        return ['clear', 'partly_cloudy', 'thunderstorm'];
      case 'autumn':
        return ['partly_cloudy', 'fog', 'light_rain'];
      case 'winter':
        return ['snow', 'light_snow', 'cloudy'];
      default:
        return ['clear', 'partly_cloudy', 'light_rain'];
    }
  }
  
  /**
   * Notifie les abonnés d'une nouvelle prédiction
   */
  private notifyPredictionListeners(predictions: string[], colId: string): void {
    this.predictionCallbacks.forEach(callback => {
      try {
        callback(predictions, colId);
      } catch (error) {
        console.error('Erreur lors de la notification d\'une prédiction:', error);
      }
    });
  }
  
  /**
   * Nettoie l'historique ancien
   */
  private cleanupHistory(): void {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    
    this.transitionHistory.forEach((transitions, colKey) => {
      // Filtrer les transitions trop anciennes
      const filtered = transitions.filter(t => now - t.timestamp < maxAge);
      
      if (filtered.length === 0) {
        this.transitionHistory.delete(colKey);
      } else {
        this.transitionHistory.set(colKey, filtered);
      }
    });
  }
}
