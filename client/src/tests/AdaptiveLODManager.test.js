/**
 * Tests pour le gestionnaire de niveau de détail adaptatif (AdaptiveLODManager)
 */

import AdaptiveLODManager from '../utils/AdaptiveLODManager';
import * as THREE from 'three';

// Mock de THREE
jest.mock('three', () => {
  const originalThree = jest.requireActual('three');
  
  return {
    ...originalThree,
    Scene: jest.fn().mockImplementation(() => ({
      traverse: jest.fn(callback => {
        // Simuler quelques objets dans la scène
        const objects = [
          createMockMesh('bike', true),
          createMockMesh('terrain', true),
          createMockMesh('background', false)
        ];
        objects.forEach(callback);
      })
    })),
    Vector3: jest.fn().mockImplementation(() => ({
      distanceTo: jest.fn().mockReturnValue(10),
      set: jest.fn()
    }))
  };
});

// Mock du détecteur de capacités
jest.mock('../utils/deviceCapabilityDetector', () => ({
  getCapabilities: jest.fn().mockReturnValue({
    flags: {
      isMobile: false,
      isLowEndDevice: false,
      hasDedicatedGPU: true
    },
    performanceLevel: 5,
    gpuTier: {
      tier: 3
    }
  })
}));

// Fonction utilitaire pour créer un mesh mock avec LOD
function createMockMesh(name, hasLOD = true) {
  // Créer un mock pour un mesh
  const lodLevels = hasLOD ? [
    { distance: 0, geometry: { vertices: new Array(1000), dispose: jest.fn() } },
    { distance: 5, geometry: { vertices: new Array(500), dispose: jest.fn() } },
    { distance: 15, geometry: { vertices: new Array(200), dispose: jest.fn() } },
    { distance: 30, geometry: { vertices: new Array(100), dispose: jest.fn() } }
  ] : [];
  
  return {
    name,
    isMesh: true,
    userData: {
      hasLOD: hasLOD,
      lodLevels: lodLevels,
      originalGeometry: { vertices: new Array(1000), dispose: jest.fn() }
    },
    geometry: { vertices: new Array(1000), dispose: jest.fn() },
    visible: true,
    position: new THREE.Vector3(0, 0, 0)
  };
}

describe('AdaptiveLODManager', () => {
  let lodManager;
  let mockScene;
  let mockCamera;
  
  beforeEach(() => {
    // Initialiser une nouvelle scène mockée
    mockScene = new THREE.Scene();
    
    // Créer une caméra mockée
    mockCamera = {
      position: new THREE.Vector3(0, 0, 10)
    };
    
    // Créer une nouvelle instance du gestionnaire de LOD
    lodManager = new AdaptiveLODManager(mockScene, {
      dynamicLOD: true,
      maxLODDistance: 50,
      distanceThresholds: [5, 15, 30],
      performancePreset: 'balanced'
    });
    
    // Initialiser avec la caméra
    lodManager.setCamera(mockCamera);
  });
  
  afterEach(() => {
    // Nettoyage
    jest.clearAllMocks();
  });
  
  describe('initialization', () => {
    test('should initialize with default options if none provided', () => {
      const defaultManager = new AdaptiveLODManager(mockScene);
      
      // Vérifier que les options par défaut sont appliquées
      expect(defaultManager.options.dynamicLOD).toBe(true);
      expect(defaultManager.options.maxLODDistance).toBeGreaterThan(0);
      expect(defaultManager.options.distanceThresholds.length).toBeGreaterThan(0);
    });
    
    test('should merge custom options with defaults', () => {
      const customManager = new AdaptiveLODManager(mockScene, {
        dynamicLOD: false,
        maxLODDistance: 100,
        performancePreset: 'high-quality'
      });
      
      // Vérifier que les options personnalisées sont appliquées
      expect(customManager.options.dynamicLOD).toBe(false);
      expect(customManager.options.maxLODDistance).toBe(100);
      expect(customManager.options.performancePreset).toBe('high-quality');
      
      // Mais les autres options par défaut devraient être préservées
      expect(customManager.options.distanceThresholds.length).toBeGreaterThan(0);
    });
  });
  
  describe('performance presets', () => {
    test('should configure options based on performance preset', () => {
      // Test avec le preset "performance"
      const performanceManager = new AdaptiveLODManager(mockScene, {
        performancePreset: 'performance'
      });
      
      // Ce preset devrait privilégier les performances
      expect(performanceManager.options.maxLODDistance).toBeLessThan(lodManager.options.maxLODDistance);
      expect(performanceManager.options.distanceThresholds[0]).toBeLessThan(lodManager.options.distanceThresholds[0]);
      
      // Test avec le preset "quality"
      const qualityManager = new AdaptiveLODManager(mockScene, {
        performancePreset: 'quality'
      });
      
      // Ce preset devrait privilégier la qualité
      expect(qualityManager.options.maxLODDistance).toBeGreaterThan(lodManager.options.maxLODDistance);
      expect(qualityManager.options.distanceThresholds[0]).toBeGreaterThan(lodManager.options.distanceThresholds[0]);
    });
    
    test('should adjust settings based on device capabilities', () => {
      // Remplacer temporairement getCapabilities pour simuler un appareil de faible puissance
      const originalGetCapabilities = require('../utils/deviceCapabilityDetector').getCapabilities;
      
      try {
        // Simuler un appareil mobile de faible puissance
        require('../utils/deviceCapabilityDetector').getCapabilities.mockReturnValue({
          flags: {
            isMobile: true,
            isLowEndDevice: true,
            hasDedicatedGPU: false
          },
          performanceLevel: 2,
          gpuTier: {
            tier: 1
          }
        });
        
        // Créer un gestionnaire avec le même preset "balanced" que précédemment
        const mobileManager = new AdaptiveLODManager(mockScene, {
          performancePreset: 'balanced'
        });
        
        // Les seuils devraient être ajustés pour les appareils de faible puissance
        expect(mobileManager.options.maxLODDistance).toBeLessThan(lodManager.options.maxLODDistance);
        expect(mobileManager.options.distanceThresholds[0]).toBeLessThan(lodManager.options.distanceThresholds[0]);
      } finally {
        // Restaurer la fonction originale
        require('../utils/deviceCapabilityDetector').getCapabilities = originalGetCapabilities;
      }
    });
  });
  
  describe('update', () => {
    test('should update LOD levels for meshes based on camera distance', () => {
      // Espionner la traversée de la scène
      const traverseSpy = jest.spyOn(mockScene, 'traverse');
      
      // Appeler update
      lodManager.update();
      
      // Vérifier que la scène a été traversée
      expect(traverseSpy).toHaveBeenCalled();
      
      // La traversée devrait sélectionner le niveau de LOD approprié pour chaque mesh
      expect(traverseSpy.mock.calls[0][0]).toBeInstanceOf(Function);
    });
    
    test('should disable dynamic LOD if option is false', () => {
      // Créer un gestionnaire avec LOD dynamique désactivé
      const staticManager = new AdaptiveLODManager(mockScene, {
        dynamicLOD: false
      });
      
      // Espionner la traversée de la scène
      const traverseSpy = jest.spyOn(mockScene, 'traverse');
      
      // Appeler update
      staticManager.update();
      
      // Vérifier que la scène n'a pas été traversée (LOD statique)
      expect(traverseSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('setDetailLevel', () => {
    test('should set global detail level and refresh scene', () => {
      // Espionner refreshSceneLOD
      const refreshSpy = jest.spyOn(lodManager, 'refreshSceneLOD');
      
      // Définir le niveau de détail global
      lodManager.setDetailLevel(0.25); // 25% de détail
      
      // Vérifier que le détail a été mis à jour et que la scène a été rafraîchie
      expect(lodManager.detailLevel).toBe(0.25);
      expect(refreshSpy).toHaveBeenCalled();
    });
    
    test('should clamp detail level between 0 and 1', () => {
      // Tester avec des valeurs limites
      lodManager.setDetailLevel(-0.5);
      expect(lodManager.detailLevel).toBe(0);
      
      lodManager.setDetailLevel(1.5);
      expect(lodManager.detailLevel).toBe(1);
    });
  });
  
  describe('refreshSceneLOD', () => {
    test('should traverse scene and apply LOD to all meshes', () => {
      // Espionner la traversée de la scène
      const traverseSpy = jest.spyOn(mockScene, 'traverse');
      
      // Rafraîchir le LOD
      lodManager.refreshSceneLOD();
      
      // Vérifier que la scène a été traversée
      expect(traverseSpy).toHaveBeenCalled();
    });
  });
  
  describe('setLODByDistance', () => {
    test('should select appropriate LOD level based on distance', () => {
      // Créer un mock d'objet avec plusieurs niveaux de LOD
      const mockObject = createMockMesh('testObject', true);
      
      // Tester différentes distances
      // À courte distance, le niveau de détail le plus élevé devrait être choisi
      lodManager._setLODByDistance(mockObject, 2);
      expect(mockObject.geometry).toBe(mockObject.userData.lodLevels[0].geometry);
      
      // À distance moyenne
      lodManager._setLODByDistance(mockObject, 10);
      expect(mockObject.geometry).toBe(mockObject.userData.lodLevels[1].geometry);
      
      // À grande distance
      lodManager._setLODByDistance(mockObject, 20);
      expect(mockObject.geometry).toBe(mockObject.userData.lodLevels[2].geometry);
      
      // À très grande distance
      lodManager._setLODByDistance(mockObject, 40);
      expect(mockObject.geometry).toBe(mockObject.userData.lodLevels[3].geometry);
    });
    
    test('should not modify meshes without LOD data', () => {
      // Créer un mock d'objet sans LOD
      const mockObject = createMockMesh('simpleObject', false);
      const originalGeometry = mockObject.geometry;
      
      // Tenter de définir le LOD
      lodManager._setLODByDistance(mockObject, 10);
      
      // La géométrie ne devrait pas changer
      expect(mockObject.geometry).toBe(originalGeometry);
    });
    
    test('should adjust distance thresholds based on detail level', () => {
      // Créer un mock d'objet avec plusieurs niveaux de LOD
      const mockObject = createMockMesh('testObject', true);
      
      // Définir un niveau de détail plus bas (pour réduire la qualité)
      lodManager.setDetailLevel(0.5); // 50% de détail
      
      // Les seuils de distance devraient être réduits, donc même à une distance moyenne
      // un niveau de détail inférieur devrait être choisi
      lodManager._setLODByDistance(mockObject, 10);
      expect(mockObject.geometry).toBe(mockObject.userData.lodLevels[2].geometry);
    });
  });
  
  describe('registerLODForObject', () => {
    test('should register LOD levels for an object', () => {
      // Créer un mock d'objet sans LOD
      const mockObject = {
        name: 'newObject',
        isMesh: true,
        userData: {},
        geometry: { vertices: new Array(1000), dispose: jest.fn() }
      };
      
      // Définir des géométries LOD
      const lodGeometries = [
        { vertices: new Array(1000), dispose: jest.fn() },
        { vertices: new Array(500), dispose: jest.fn() },
        { vertices: new Array(200), dispose: jest.fn() }
      ];
      
      // Enregistrer les niveaux de LOD
      lodManager.registerLODForObject(mockObject, lodGeometries, [0, 10, 20]);
      
      // Vérifier que les données de LOD ont été ajoutées
      expect(mockObject.userData.hasLOD).toBe(true);
      expect(mockObject.userData.lodLevels.length).toBe(3);
      expect(mockObject.userData.originalGeometry).toBe(mockObject.geometry);
    });
    
    test('should validate and correct LOD registration parameters', () => {
      // Créer un mock d'objet
      const mockObject = {
        name: 'testObject',
        isMesh: true,
        userData: {},
        geometry: { vertices: new Array(1000), dispose: jest.fn() }
      };
      
      // Cas avec des tableaux de longueurs différentes (moins de distances que de géométries)
      const lodGeometries = [
        { vertices: new Array(1000), dispose: jest.fn() },
        { vertices: new Array(500), dispose: jest.fn() },
        { vertices: new Array(200), dispose: jest.fn() }
      ];
      
      // Seulement deux distances pour trois géométries
      const distances = [0, 10];
      
      // Enregistrer les niveaux de LOD
      expect(() => {
        lodManager.registerLODForObject(mockObject, lodGeometries, distances);
      }).not.toThrow(); // Ne devrait pas planter, mais ajuster
      
      // Les distances manquantes devraient être générées automatiquement
      expect(mockObject.userData.lodLevels.length).toBe(3);
      expect(mockObject.userData.lodLevels[2].distance).toBeGreaterThan(10);
    });
  });
  
  describe('dispose', () => {
    test('should clean up resources when disposed', () => {
      // Créer un objet avec des niveaux de LOD
      const mockObject = createMockMesh('disposableObject', true);
      
      // Espionner les méthodes dispose des géométries
      const disposeSpy = jest.spyOn(mockObject.userData.originalGeometry, 'dispose');
      const lodDisposeSpy = mockObject.userData.lodLevels.map(level => 
        jest.spyOn(level.geometry, 'dispose')
      );
      
      // Ajouter l'objet à une liste interne pour le nettoyage
      lodManager.lodObjects = [mockObject];
      
      // Disposer le gestionnaire
      lodManager.dispose();
      
      // Vérifier que les ressources ont été nettoyées
      expect(disposeSpy).not.toHaveBeenCalled(); // La géométrie originale ne doit pas être nettoyée
      lodDisposeSpy.forEach(spy => {
        expect(spy).not.toHaveBeenCalled(); // Les géométries LOD ne doivent pas être nettoyées
      });
      
      // Vérifier que la référence à la scène a été supprimée
      expect(lodManager.scene).toBeNull();
      expect(lodManager.camera).toBeNull();
    });
  });
});
