/**
 * Tests pour l'optimiseur de textures
 */

import textureOptimizer from '../utils/TextureOptimizer';
import * as THREE from 'three';

// Mock de THREE.TextureLoader
jest.mock('three', () => {
  const actualThree = jest.requireActual('three');
  return {
    ...actualThree,
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn((url, onLoad, onProgress, onError) => {
        // Simuler le chargement d'une texture
        const mockTexture = {
          image: { src: url },
          needsUpdate: false,
          anisotropy: 1,
          dispose: jest.fn(),
          generateMipmaps: true,
          minFilter: actualThree.LinearMipMapLinearFilter,
          magFilter: actualThree.LinearFilter
        };
        
        // Appeler onLoad avec la texture mockée
        if (onLoad) {
          setTimeout(() => onLoad(mockTexture), 10);
        }
        
        // Retourner la texture (bien que dans la vraie implémentation cela soit asynchrone)
        return mockTexture;
      })
    })),
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      capabilities: {
        getMaxAnisotropy: jest.fn().mockReturnValue(16)
      },
      dispose: jest.fn()
    }))
  };
});

// Mock de deviceCapabilityDetector
jest.mock('../utils/deviceCapabilityDetector', () => ({
  getCapabilities: jest.fn().mockReturnValue({
    flags: {
      isMobile: false
    },
    performanceLevel: 5
  })
}));

describe('TextureOptimizer', () => {
  beforeEach(() => {
    // Réinitialiser le cache de textures pour chaque test
    textureOptimizer.releaseAllTextures();
  });
  
  describe('loadTexture', () => {
    test('should load textures with correct parameters', async () => {
      // Charger une texture simple
      const texture = await textureOptimizer.loadTexture('test-texture.jpg');
      
      // Vérifier les propriétés de base
      expect(texture).toBeDefined();
      expect(texture.image.src).toContain('test-texture');
      expect(texture.needsUpdate).toBe(true);
    });
    
    test('should apply quality adjustments to url', async () => {
      // Charger une texture avec une qualité spécifique
      const texture = await textureOptimizer.loadTexture('test-texture.jpg', {
        quality: 0.5 // Qualité medium
      });
      
      // La texture devrait avoir été chargée avec une URL modifiée
      // Ceci vérifie que _buildOptimizedUrl a été appelé correctement
      expect(texture.image.src).toContain('_q50');
    });
    
    test('should cache loaded textures', async () => {
      // Charger la même texture deux fois
      const texture1 = await textureOptimizer.loadTexture('cache-test.jpg');
      const texture2 = await textureOptimizer.loadTexture('cache-test.jpg');
      
      // Les deux références devraient pointer vers le même objet
      expect(texture1).toBe(texture2);
    });
    
    test('should handle loading errors gracefully', async () => {
      // Remplacer temporairement la méthode _loadTextureAsync
      const originalLoadMethod = textureOptimizer._loadTextureAsync;
      textureOptimizer._loadTextureAsync = jest.fn()
        .mockRejectedValueOnce(new Error('Loading failed'))
        .mockResolvedValueOnce({
          image: { src: 'fallback.jpg' },
          needsUpdate: false
        });
      
      try {
        // Cette texture devrait échouer puis réessayer avec l'URL originale
        const texture = await textureOptimizer.loadTexture('error-texture_q75.webp');
        
        // Vérifier qu'on a tenté de charger avec l'URL originale
        expect(textureOptimizer._loadTextureAsync).toHaveBeenCalledTimes(2);
        expect(texture).toBeDefined();
      } finally {
        // Restaurer la méthode originale
        textureOptimizer._loadTextureAsync = originalLoadMethod;
      }
    });
  });
  
  describe('loadTextures', () => {
    test('should load multiple textures in parallel', async () => {
      // Préparer les configurations de texture
      const textureConfigs = [
        { id: 'texture1', url: 'texture1.jpg' },
        { id: 'texture2', url: 'texture2.jpg', options: { quality: 0.25 } }
      ];
      
      // Charger les textures
      const textures = await textureOptimizer.loadTextures(textureConfigs);
      
      // Vérifier que toutes les textures ont été chargées
      expect(textures.texture1).toBeDefined();
      expect(textures.texture2).toBeDefined();
      expect(textures.texture1.image.src).toContain('texture1');
      expect(textures.texture2.image.src).toContain('texture2');
      expect(textures.texture2.image.src).toContain('_q25');
    });
  });
  
  describe('_buildOptimizedUrl', () => {
    test('should modify URL for quality', () => {
      // Tester différentes combinaisons
      const url1 = textureOptimizer._buildOptimizedUrl('test.jpg', 0.75);
      const url2 = textureOptimizer._buildOptimizedUrl('test.png', 0.5);
      const url3 = textureOptimizer._buildOptimizedUrl('path/to/test.jpg', 0.25);
      
      // Vérifier les URL résultantes
      expect(url1).toContain('_q75');
      expect(url2).toContain('_q50');
      expect(url3).toContain('_q25');
    });
    
    test('should preserve existing quality parameters', () => {
      // URL déjà optimisée
      const url = textureOptimizer._buildOptimizedUrl('test_q50.jpg', 0.75);
      
      // Ne devrait pas changer
      expect(url).toBe('test_q50.jpg');
    });
    
    test('should handle format conversion', () => {
      // Remplacer temporairement _getBestSupportedFormat pour tester la conversion de format
      const originalMethod = textureOptimizer._getBestSupportedFormat;
      textureOptimizer._getBestSupportedFormat = jest.fn().mockReturnValue('webp');
      
      try {
        const url = textureOptimizer._buildOptimizedUrl('test.jpg', 0.75);
        
        // Vérifier l'URL résultante
        expect(url).toContain('.webp');
        expect(url).toContain('_q75');
      } finally {
        // Restaurer la méthode originale
        textureOptimizer._getBestSupportedFormat = originalMethod;
      }
    });
  });
  
  describe('releaseTexture', () => {
    test('should remove texture from cache and dispose resources', async () => {
      // Charger une texture
      const texture = await textureOptimizer.loadTexture('release-test.jpg');
      
      // Vérifier qu'elle est en cache
      const cacheKey = 'release-test.jpg_0.75'; // High quality par défaut pour desktop
      
      // Espionner dispose
      const disposeSpy = jest.spyOn(texture, 'dispose');
      
      // Libérer la texture
      textureOptimizer.releaseTexture('release-test.jpg');
      
      // Vérifier que dispose a été appelé
      expect(disposeSpy).toHaveBeenCalled();
      
      // Recharger la texture - si elle n'est plus en cache, un nouvel objet sera créé
      const reloadedTexture = await textureOptimizer.loadTexture('release-test.jpg');
      expect(reloadedTexture).not.toBe(texture);
    });
  });
  
  describe('releaseAllTextures', () => {
    test('should clear entire texture cache', async () => {
      // Charger plusieurs textures
      await textureOptimizer.loadTexture('texture1.jpg');
      await textureOptimizer.loadTexture('texture2.jpg');
      
      // Espionner la méthode dispose
      const originalDispose = THREE.Texture.prototype.dispose;
      THREE.Texture.prototype.dispose = jest.fn();
      
      try {
        // Libérer toutes les textures
        textureOptimizer.releaseAllTextures();
        
        // Vérifier que dispose a été appelé pour chaque texture
        expect(THREE.Texture.prototype.dispose).toHaveBeenCalled();
        
        // Recharger une texture - devrait être un nouvel objet
        const texture1 = await textureOptimizer.loadTexture('texture1.jpg');
        const texture2 = await textureOptimizer.loadTexture('texture1.jpg');
        
        // Comme le cache a été vidé, le premier chargement devrait créer un nouvel objet
        // Mais le second devrait récupérer du cache
        expect(texture1).toBe(texture2);
      } finally {
        // Restaurer la méthode originale
        THREE.Texture.prototype.dispose = originalDispose;
      }
    });
  });
  
  describe('getOptimalAnisotropy', () => {
    test('should return appropriate anisotropy based on device', () => {
      // Mock différentes capacités d'appareil
      const originalMethod = textureOptimizer._getOptimalAnisotropy;
      
      try {
        // Test pour un appareil haut de gamme
        let anisotropy = originalMethod.call(textureOptimizer);
        // La valeur maximum devrait être retournée pour un desktop haut de gamme
        expect(anisotropy).toBe(16);
        
        // Tester maintenant avec un appareil mobile
        textureOptimizer.isHighEndDevice = false;
        textureOptimizer.isMobile = true;
        
        anisotropy = originalMethod.call(textureOptimizer);
        // Valeur limitée pour mobile
        expect(anisotropy).toBeLessThanOrEqual(4);
      } finally {
        // Restaurer les propriétés originales
        textureOptimizer.isHighEndDevice = true;
        textureOptimizer.isMobile = false;
      }
    });
  });
});
