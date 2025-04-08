# Calculateurs d'Entraînement

## Vue d'Ensemble
- **Objectif** : Documentation des calculateurs utilisés dans le module d'entraînement
- **Contexte** : Outils d'analyse et planification d'entraînement pour cyclistes
- **Portée** : FTP, zones d'entraînement et métriques de performance

## Contenu Principal
- **Calculateur FTP Avancé**
  - Algorithmes de calcul (standard et IA)
  - Variables d'entrée et validation
  - Intervalles de confiance
  - Historique et suivi de progression
  
- **Calculateur de Zones**
  - 7 zones basées sur le FTP
  - Adaptation selon l'objectif d'entraînement
  - Personnalisation des plages
  - Visualisation intuitive

- **Métriques de Performance**
  - TSS (Training Stress Score)
  - Intensité relative
  - Charge d'entraînement
  - Fatigue et récupération
  
- **Prédictions de Performance**
  - Estimation de performance sur parcours
  - Modélisation de progression
  - Prévisions adaptées aux cols

## Points Techniques
```typescript
// Interface du calculateur FTP
interface FTPCalculation {
  value: number;           // Valeur FTP en watts
  confidence: number;      // Niveau de confiance (0-1)
  method: string;          // Méthode de calcul utilisée
  zones: TrainingZones;    // Zones calculées
  predictions: MLPredictions; // Prédictions basées sur IA
}

// Implémentation du calculateur FTP avancé
class EnhancedFTPCalculator {
  constructor(
    private userProfile: UserProfile,
    private activityHistory: ActivityData[],
    private mlService: MachineLearningService
  ) {}

  // Calcule le FTP avec différentes méthodes et combine les résultats
  async calculateFTP(): Promise<FTPCalculation> {
    // Récupérer l'historique pertinent
    const recentActivities = this.filterRelevantActivities(this.activityHistory);
    
    // Calculer avec différentes méthodes
    const [standardResult, rampResult, mlResult] = await Promise.all([
      this.calculateStandard(recentActivities),
      this.calculateRampTest(recentActivities),
      this.calculateWithML(recentActivities)
    ]);
    
    // Combiner les résultats avec pondération
    const combinedFTP = this.combineResults(standardResult, rampResult, mlResult);
    
    // Calculer les zones d'entraînement
    const zones = this.calculateTrainingZones(combinedFTP);
    
    // Générer des prédictions
    const predictions = await this.mlService.predictPerformance(
      combinedFTP,
      this.userProfile,
      recentActivities
    );
    
    return {
      value: combinedFTP,
      confidence: this.calculateConfidence(standardResult, rampResult, mlResult),
      method: 'enhanced_combined',
      zones,
      predictions
    };
  }
  
  // Autres méthodes de la classe...
}
```

## Formules et Algorithmes
- **Calcul FTP Standard**
  - FTP = 95% de la puissance moyenne sur 20 minutes
  - FTP = 75% de la puissance maximale sur 5 minutes
  
- **Calcul des Zones**
  - Zone 1 (Récupération): < 55% FTP
  - Zone 2 (Endurance): 55-75% FTP
  - Zone 3 (Tempo): 76-87% FTP
  - Zone 4 (Seuil): 88-94% FTP
  - Zone 5 (VO2 Max): 95-105% FTP
  - Zone 6 (Capacité anaérobie): 106-120% FTP
  - Zone 7 (Neuromuscular): > 120% FTP

- **Calcul TSS**
  - TSS = (durée_secondes × NP × IF) ÷ (FTP × 3600) × 100
  - où NP = Puissance Normalisée, IF = Facteur d'Intensité

## Métriques et KPIs
- **Objectifs**
  - Précision FTP > 95% (vs test laboratoire)
  - Temps de calcul < 2s
  - Justesse prédictions > 90%
  - Satisfaction utilisateurs > 4.5/5
  
- **Mesures actuelles**
  - Précision FTP: 93%
  - Temps de calcul: 1.8s
  - Justesse prédictions: 87%
  - Satisfaction: 4.3/5

## Dépendances
- TensorFlow.js pour le modèle ML
- D3.js pour visualisations
- JSON-LD pour données structurées
- API interne de séries temporelles

## Maintenance
- **Responsable** : Lead Data Scientist
- **Fréquence** : Recalibrage mensuel du modèle ML
- **Procédures** :
  1. Validation des prédictions vs résultats réels
  2. Optimisation des paramètres
  3. Ré-entraînement du modèle avec nouvelles données
  4. Tests A/B des algorithmes améliorés

## Références
- [Friel, J. "The Cyclist's Training Bible"](https://www.velopress.com/books/the-cyclists-training-bible/)
- [Allen, H. & Coggan, A. "Training and Racing with a Power Meter"](https://www.velopress.com/books/training-racing-with-a-power-meter/)
- [Documentation TensorFlow.js](https://www.tensorflow.org/js/)
