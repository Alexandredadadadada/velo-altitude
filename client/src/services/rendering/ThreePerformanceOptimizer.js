/**
 * Service d'optimisation des performances pour la visualisation 3D
 * Implémente des stratégies avancées d'optimisation pour React Three Fiber
 */

import { AdaptiveDpr, AdaptiveEvents, BVH } from '@react-three/drei';
import { useThree, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Hook personnalisé pour gérer le niveau de détail (LOD) dynamique
 * @param {Object} options - Options de configuration
 * @returns {Object} Propriétés LOD à passer à un modèle 3D
 */
export const useDynamicLOD = (options = {}) => {
  const { 
    distanceLevels = [50, 200, 500], 
    geometryDetail = [1.0, 0.5, 0.2, 0.1],
    textureQuality = ['high', 'medium', 'low', 'lowest'],
    enabledByDefault = true
  } = options;
  
  const { camera } = useThree();
  const [detailLevel, setDetailLevel] = useState(0);
  const [isEnabled, setIsEnabled] = useState(enabledByDefault);
  const objectRef = useRef();
  
  // Surveiller la distance et ajuster le LOD
  useFrame(() => {
    if (!objectRef.current || !isEnabled) return;
    
    const distance = camera.position.distanceTo(objectRef.current.position);
    
    // Déterminer le niveau de détail en fonction de la distance
    let newLevel = 0;
    for (let i = 0; i < distanceLevels.length; i++) {
      if (distance > distanceLevels[i]) {
        newLevel = i + 1;
      }
    }
    
    if (newLevel !== detailLevel) {
      setDetailLevel(newLevel);
    }
  });
  
  return {
    ref: objectRef,
    detailLevel,
    geometryDetail: geometryDetail[Math.min(detailLevel, geometryDetail.length - 1)],
    textureQuality: textureQuality[Math.min(detailLevel, textureQuality.length - 1)],
    isLODEnabled: isEnabled,
    setLODEnabled: setIsEnabled
  };
};

/**
 * Hook pour gérer le culling intelligent des objets
 * Cache les objets hors champ pour améliorer les performances
 */
export const useIntelligentCulling = (options = {}) => {
  const {
    enabled = true,
    margin = 0.1,  // Marge au-delà du frustum
    updateInterval = 5  // Frames entre mises à jour
  } = options;
  
  const { camera } = useThree();
  const frustumRef = useRef(new THREE.Frustum());
  const frameCount = useRef(0);
  const objectRefs = useRef([]);
  
  // Enregistrer un objet pour le culling
  const registerObject = (object) => {
    if (object && !objectRefs.current.includes(object)) {
      objectRefs.current.push(object);
      return true;
    }
    return false;
  };
  
  // Désinscrire un objet
  const unregisterObject = (object) => {
    objectRefs.current = objectRefs.current.filter(obj => obj !== object);
  };
  
  useFrame(() => {
    if (!enabled) return;
    
    frameCount.current += 1;
    
    // N'effectuer le culling que tous les N frames pour économiser du CPU
    if (frameCount.current % updateInterval !== 0) return;
    
    // Mettre à jour la matrice de projection et le frustum
    camera.updateMatrixWorld();
    const frustum = frustumRef.current;
    frustum.setFromProjectionMatrix(
      new THREE.Matrix4().multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse
      )
    );
    
    // Appliquer le culling à tous les objets enregistrés
    objectRefs.current.forEach(object => {
      if (!object) return;
      
      // Calculer la sphère englobante si non définie
      if (!object.boundingSphere) {
        object.boundingSphere = new THREE.Sphere();
        if (object.geometry) {
          object.geometry.computeBoundingSphere();
          object.boundingSphere.copy(object.geometry.boundingSphere);
          object.boundingSphere.radius *= Math.max(
            object.scale.x, 
            object.scale.y, 
            object.scale.z
          );
        } else {
          object.boundingSphere.radius = 1;
        }
      }
      
      // Position dans l'espace monde
      const worldPos = new THREE.Vector3();
      object.getWorldPosition(worldPos);
      
      // Copier la sphère englobante et la placer à la position mondiale
      const sphere = object.boundingSphere.clone();
      sphere.center.copy(worldPos);
      
      // Ajouter une marge à la sphère
      sphere.radius *= (1 + margin);
      
      // Tester si la sphère est dans le frustum
      const isVisible = frustum.intersectsSphere(sphere);
      
      // Ne modifie la visibilité que si nécessaire pour éviter les rerenders inutiles
      if (object.visible !== isVisible) {
        object.visible = isVisible;
      }
    });
  });
  
  return { registerObject, unregisterObject };
};

/**
 * Composant pour adapter la qualité du rendu en fonction des performances
 */
export const PerformanceAdaptiveRenderer = ({ children, targetFPS = 40 }) => {
  const [dpr, setDpr] = useState(1.5);
  const fpsBuffer = useRef([]);
  const frameTimeRef = useRef();
  const { gl } = useThree();
  
  useEffect(() => {
    // Configurer les optimisations de base de Three.js
    gl.physicallyCorrectLights = true;
    
    if (gl.capabilities.isWebGL2) {
      gl.outputEncoding = THREE.sRGBEncoding;
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.0;
    }
  }, [gl]);
  
  useFrame((_, delta) => {
    if (!frameTimeRef.current) {
      frameTimeRef.current = Date.now();
      return;
    }
    
    // Calculer le FPS actuel
    const now = Date.now();
    const elapsedMs = now - frameTimeRef.current;
    frameTimeRef.current = now;
    
    const currentFPS = 1000 / elapsedMs;
    
    // Maintenir un buffer des derniers FPS
    fpsBuffer.current.push(currentFPS);
    if (fpsBuffer.current.length > 30) {
      fpsBuffer.current.shift();
    }
    
    // Calculer la moyenne des FPS
    const averageFPS = fpsBuffer.current.reduce((sum, fps) => sum + fps, 0) / fpsBuffer.current.length;
    
    // Adapter la qualité en fonction des performances
    if (fpsBuffer.current.length >= 20) {
      if (averageFPS < targetFPS * 0.7 && dpr > 1) {
        setDpr(Math.max(dpr - 0.25, 0.75));
      } else if (averageFPS > targetFPS * 1.2 && dpr < window.devicePixelRatio) {
        setDpr(Math.min(dpr + 0.25, window.devicePixelRatio));
      }
    }
  });

  return (
    <>
      <AdaptiveDpr pixelated={true} />
      <AdaptiveEvents />
      <BVH />
      {children}
    </>
  );
};

/**
 * Optimise le GPU par le chunking des opérations lourdes
 */
export const useChunkedComputation = (heavyFunction, deps = [], chunkSize = 100, framesBetweenChunks = 1) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const chunkIndex = useRef(0);
  const data = useRef([]);
  const frameSkip = useRef(0);
  
  const processInChunks = useCallback((inputData) => {
    data.current = inputData;
    chunkIndex.current = 0;
    setIsProcessing(true);
    setProgress(0);
  }, []);
  
  useFrame(() => {
    if (!isProcessing || data.current.length === 0) return;
    
    // Sauter des frames pour être plus doux sur le CPU
    frameSkip.current += 1;
    if (frameSkip.current < framesBetweenChunks) return;
    frameSkip.current = 0;
    
    // Traiter le chunk actuel
    const start = chunkIndex.current * chunkSize;
    const end = Math.min(start + chunkSize, data.current.length);
    
    if (start < data.current.length) {
      const chunk = data.current.slice(start, end);
      heavyFunction(chunk);
      
      chunkIndex.current += 1;
      setProgress(Math.min(end / data.current.length, 1));
    }
    
    // Vérifier si on a terminé
    if (start >= data.current.length) {
      setIsProcessing(false);
      data.current = [];
    }
  });
  
  // Reset quand les dépendances changent
  useEffect(() => {
    setIsProcessing(false);
    chunkIndex.current = 0;
    data.current = [];
    setProgress(0);
  }, deps);
  
  return { isProcessing, progress, processInChunks };
};

// Exporter les composants optimisés
export {
  AdaptiveDpr,
  AdaptiveEvents,
  BVH
};
