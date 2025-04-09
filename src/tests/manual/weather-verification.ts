/**
 * Fichier de vérification manuelle des fonctionnalités météorologiques
 * Permet de tester l'intégration avec React 18.2.0 et les effets GPU
 */

import { setVisualizationQuality, enableGPUComputation, disableGPUComputation } from '../../config/visualization/visualizationConfig';
import { WeatherPreset } from '../../config/visualization/weatherPresets';
import { WeatherVisualizationService } from '../../services/visualization/weather/WeatherVisualizationService';
import { VisualizationSettings } from '../../config/visualization/types';

/**
 * Interface pour les cas de test météo
 */
export interface WeatherTestCase {
  name: string;
  setup: () => void;
  steps: string[];
  expectedResult: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Configuration de base pour les tests
 */
export function setupBaseVisualization(): void {
  // Configuration de base pour tous les tests
  const baseSettings: VisualizationSettings = {
    quality: 'medium',
    useGPU: true,
    useGPUComputation: true,
    particleMultiplier: 1.0,
    shadowsEnabled: true,
    postProcessingEnabled: true,
    terrainDetail: 1.0,
    textureResolution: 1024,
    adaptiveQuality: true
  };

  // Appliquer les paramètres de base
  setVisualizationQuality(baseSettings);
}

/**
 * Tests des effets météorologiques
 */
export const weatherTests: WeatherTestCase[] = [
  {
    name: "Rendu GPU des effets de pluie",
    setup: () => {
      // Configuration haute qualité
      setVisualizationQuality('high');
      enableGPUComputation();
      
      // Charger le preset de pluie
      const weatherService = new WeatherVisualizationService();
      weatherService.applyPreset(WeatherPreset.RAIN_HEAVY);
    },
    steps: [
      "1. Charger la visualisation du col du Galibier",
      "2. Activer les effets de pluie via le contrôle météo",
      "3. Vérifier visuellement le nombre et la fluidité des particules de pluie",
      "4. Contrôler les FPS via le moniteur de performance"
    ],
    expectedResult: "Rendu fluide des effets de pluie avec >30 FPS, particules réalistes et impact visuel sur le terrain",
    priority: 'high'
  },
  {
    name: "Fallback CPU pour effets météo",
    setup: () => {
      // Configuration économique
      setVisualizationQuality('low');
      disableGPUComputation();
      
      // Charger le preset de neige légère (moins intensif)
      const weatherService = new WeatherVisualizationService();
      weatherService.applyPreset(WeatherPreset.SNOW_LIGHT);
    },
    steps: [
      "1. Charger la visualisation du col de l'Iseran",
      "2. Activer les effets de neige légère",
      "3. Vérifier le mode de calcul CPU dans le panneau de performance",
      "4. Observer la stabilité des FPS pendant 1 minute"
    ],
    expectedResult: "Rendu stable en mode CPU avec >25 FPS, moins de particules mais effet visuel cohérent",
    priority: 'high'
  },
  {
    name: "Transitions entre conditions météo",
    setup: () => {
      // Configuration moyenne
      setVisualizationQuality('medium');
      enableGPUComputation();
      
      // Commencer avec un temps clair
      const weatherService = new WeatherVisualizationService();
      weatherService.applyPreset(WeatherPreset.CLEAR);
    },
    steps: [
      "1. Charger la visualisation du col du Tourmalet",
      "2. Passer progressivement par les conditions: clair → nuageux → pluie légère → orage",
      "3. Observer les transitions entre chaque état",
      "4. Vérifier que les performances restent stables"
    ],
    expectedResult: "Transitions fluides entre les conditions météo sans chute de FPS, effets visuels progressifs",
    priority: 'medium'
  },
  {
    name: "Compatibilité avec les services météo existants",
    setup: () => {
      // Configuration standard
      setVisualizationQuality('medium');
      
      // Utiliser le service météo unifié
      const weatherService = new WeatherVisualizationService();
      weatherService.initialize();
    },
    steps: [
      "1. Charger la page de détail du col du Ventoux",
      "2. Vérifier l'intégration des données météo réelles",
      "3. Contrôler que la visualisation 3D correspond aux conditions actuelles",
      "4. Tester le bouton 'Voir en 3D avec conditions actuelles'"
    ],
    expectedResult: "Correspondance entre données météo API et visualisation 3D, intégration fonctionnelle",
    priority: 'medium'
  },
  {
    name: "Persistance des réglages GPU",
    setup: () => {
      // Réinitialiser les préférences
      localStorage.removeItem('visualization-settings');
      
      // Configuration personnalisée
      const customSettings: VisualizationSettings = {
        quality: 'high',
        useGPU: true,
        useGPUComputation: true,
        particleMultiplier: 1.5,
        shadowsEnabled: true,
        postProcessingEnabled: true,
        terrainDetail: 1.2,
        textureResolution: 2048,
        adaptiveQuality: false
      };
      
      setVisualizationQuality(customSettings);
    },
    steps: [
      "1. Définir des préférences GPU personnalisées",
      "2. Raffraîchir la page",
      "3. Vérifier que les préférences sont conservées",
      "4. Tester plusieurs chargements de cols différents"
    ],
    expectedResult: "Les préférences GPU sont correctement sauvegardées et appliquées entre les sessions",
    priority: 'low'
  }
];

/**
 * Exécute le test spécifié
 */
export function runTest(testName: string): void {
  const test = weatherTests.find(t => t.name === testName);
  if (!test) {
    console.error(`Test "${testName}" non trouvé`);
    return;
  }
  
  console.log(`Exécution du test: ${test.name}`);
  console.log('Configuration...');
  test.setup();
  
  console.log('Étapes:');
  test.steps.forEach((step, index) => {
    console.log(`${index + 1}. ${step}`);
  });
  
  console.log(`\nRésultat attendu: ${test.expectedResult}`);
}

/**
 * Affiche la liste des tests disponibles
 */
export function listAllTests(): void {
  console.log('Tests météorologiques disponibles:');
  
  console.log('\nPriorité HAUTE:');
  weatherTests
    .filter(t => t.priority === 'high')
    .forEach(test => console.log(`- ${test.name}`));
  
  console.log('\nPriorité MOYENNE:');
  weatherTests
    .filter(t => t.priority === 'medium')
    .forEach(test => console.log(`- ${test.name}`));
  
  console.log('\nPriorité BASSE:');
  weatherTests
    .filter(t => t.priority === 'low')
    .forEach(test => console.log(`- ${test.name}`));
}
