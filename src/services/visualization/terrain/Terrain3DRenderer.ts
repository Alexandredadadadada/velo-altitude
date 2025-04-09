/**
 * Service de rendu de terrain 3D
 * Fournit des fonctionnalités avancées pour le rendu de terrain basé sur des données d'élévation
 */

import * as THREE from 'three';
import { ElevationProfile } from '../../cols/types/ElevationTypes';

/**
 * Configuration pour le rendu de terrain
 */
export interface Terrain3DConfig {
  resolution: 'low' | 'medium' | 'high'; // Résolution du maillage
  textureQuality: 'low' | 'medium' | 'high'; // Qualité des textures
  enableHeightMap: boolean;     // Activation de la carte de hauteur
  enableNormalMap: boolean;     // Activation de la carte normale
  enableShadows: boolean;       // Activation des ombres
  terrainScale: number;         // Échelle verticale du terrain
  detailLevel: number;          // Niveau de détail (LOD)
  waterLevel: number;           // Niveau d'eau (altitude en mètres)
  enableWater: boolean;         // Activation de l'eau
  enableVegetation: boolean;    // Activation de la végétation
  vegetationDensity: number;    // Densité de la végétation
  snowLevel: number;            // Niveau de neige (altitude en mètres)
  enableSnowcaps: boolean;      // Activation des sommets enneigés
}

/**
 * Service pour le rendu de terrain 3D
 */
export class Terrain3DRenderer {
  // Objets 3D
  private terrain: THREE.Mesh | null = null;
  private water: THREE.Mesh | null = null;
  private vegetation: THREE.Group | null = null;
  
  // Textures
  private terrainTextures: {
    diffuse?: THREE.Texture;
    normal?: THREE.Texture;
    roughness?: THREE.Texture;
    height?: THREE.Texture;
  } = {};
  
  // Matériaux
  private terrainMaterial: THREE.MeshStandardMaterial | null = null;
  private waterMaterial: THREE.MeshStandardMaterial | null = null;
  
  // Configuration par défaut
  private config: Terrain3DConfig = {
    resolution: 'medium',
    textureQuality: 'medium',
    enableHeightMap: true,
    enableNormalMap: true,
    enableShadows: true,
    terrainScale: 1.0,
    detailLevel: 3,
    waterLevel: 0,
    enableWater: true,
    enableVegetation: true,
    vegetationDensity: 0.5,
    snowLevel: 1800, // 1800m
    enableSnowcaps: true
  };
  
  // Données d'élévation
  private elevationData: ElevationProfile | null = null;
  private terrainSize = { width: 0, height: 0 };
  private terrainBounds = { 
    min: { lat: 0, lng: 0 },
    max: { lat: 0, lng: 0 }
  };

  /**
   * Constructeur
   * @param scene Scène THREE.js
   * @param config Configuration du terrain
   */
  constructor(
    private scene: THREE.Scene,
    config?: Partial<Terrain3DConfig>
  ) {
    this.updateConfig(config || {});
  }

  /**
   * Met à jour la configuration
   * @param config Nouvelle configuration partielle
   */
  updateConfig(config: Partial<Terrain3DConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Mettre à jour le terrain s'il existe déjà
    if (this.terrain && this.elevationData) {
      this.updateTerrainFromConfig();
    }
  }

  /**
   * Met à jour le terrain basé sur la configuration actuelle
   */
  private updateTerrainFromConfig(): void {
    // Mettre à jour le matériau du terrain
    if (this.terrainMaterial) {
      // Mise à jour des cartes de texture
      if (this.config.enableNormalMap && this.terrainTextures.normal) {
        this.terrainMaterial.normalMap = this.terrainTextures.normal;
      } else {
        this.terrainMaterial.normalMap = null;
      }
      
      if (this.config.enableHeightMap && this.terrainTextures.height) {
        this.terrainMaterial.displacementMap = this.terrainTextures.height;
        this.terrainMaterial.displacementScale = 20 * this.config.terrainScale;
      } else {
        this.terrainMaterial.displacementMap = null;
      }
      
      // Mise à jour des ombres
      if (this.terrain) {
        this.terrain.castShadow = this.config.enableShadows;
        this.terrain.receiveShadow = this.config.enableShadows;
      }
    }
    
    // Mise à jour de l'eau
    this.updateWater();
    
    // Mise à jour de la végétation
    this.updateVegetation();
    
    // Mise à jour des sommets enneigés
    this.updateSnowcaps();
  }

  /**
   * Charge et applique les données d'élévation pour créer le terrain
   * @param elevationData Données d'élévation
   * @param bounds Limites géographiques (lat/lng)
   */
  loadTerrain(
    elevationData: ElevationProfile,
    bounds: { min: { lat: number, lng: number }, max: { lat: number, lng: number } }
  ): void {
    this.elevationData = elevationData;
    this.terrainBounds = bounds;
    
    // Déterminer la taille du terrain en fonction des limites
    const latDiff = bounds.max.lat - bounds.min.lat;
    const lngDiff = bounds.max.lng - bounds.min.lng;
    
    // Convertir approximativement les différences de lat/lng en mètres
    // (cette conversion n'est pas précise mais suffisante pour notre rendu)
    const metersPerLat = 111320; // 1 degré de latitude ≈ 111.32 km
    const metersPerLng = 111320 * Math.cos(((bounds.min.lat + bounds.max.lat) / 2) * Math.PI / 180);
    
    this.terrainSize = {
      width: lngDiff * metersPerLng,
      height: latDiff * metersPerLat
    };
    
    // Supprimer le terrain existant
    this.clear();
    
    // Charger les textures
    this.loadTextures();
    
    // Créer le terrain
    this.createTerrain();
    
    // Ajouter l'eau
    if (this.config.enableWater) {
      this.createWater();
    }
    
    // Ajouter la végétation
    if (this.config.enableVegetation) {
      this.createVegetation();
    }
    
    // Ajouter les sommets enneigés
    if (this.config.enableSnowcaps) {
      this.createSnowcaps();
    }
  }

  /**
   * Charge les textures pour le terrain
   */
  private loadTextures(): void {
    const textureLoader = new THREE.TextureLoader();
    
    // Déterminer le niveau de qualité des textures
    let resolution = '';
    switch (this.config.textureQuality) {
      case 'low': resolution = '512'; break;
      case 'high': resolution = '2048'; break;
      case 'medium':
      default: resolution = '1024'; break;
    }
    
    // Charger les textures
    // Note: Les chemins sont relatifs au dossier public/assets/textures
    // Ces textures devront être créées ou téléchargées
    this.terrainTextures.diffuse = textureLoader.load(`/assets/textures/terrain/diffuse_${resolution}.jpg`);
    
    if (this.config.enableNormalMap) {
      this.terrainTextures.normal = textureLoader.load(`/assets/textures/terrain/normal_${resolution}.jpg`);
    }
    
    if (this.config.enableHeightMap) {
      this.terrainTextures.height = textureLoader.load(`/assets/textures/terrain/height_${resolution}.jpg`);
    }
    
    this.terrainTextures.roughness = textureLoader.load(`/assets/textures/terrain/roughness_${resolution}.jpg`);
    
    // Configurer les textures
    Object.values(this.terrainTextures).forEach(texture => {
      if (texture) {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5);
      }
    });
  }

  /**
   * Crée le maillage de terrain à partir des données d'élévation
   */
  private createTerrain(): void {
    if (!this.elevationData) return;
    
    // Déterminer la résolution du terrain
    let gridSize: number;
    switch (this.config.resolution) {
      case 'low': gridSize = 64; break;
      case 'high': gridSize = 256; break;
      case 'medium':
      default: gridSize = 128; break;
    }
    
    // Créer la géométrie du terrain
    const geometry = this.createTerrainGeometry(gridSize);
    
    // Créer le matériau du terrain
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      map: this.terrainTextures.diffuse,
      normalMap: this.config.enableNormalMap ? this.terrainTextures.normal : null,
      displacementMap: this.config.enableHeightMap ? this.terrainTextures.height : null,
      displacementScale: 20 * this.config.terrainScale,
      roughnessMap: this.terrainTextures.roughness,
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    
    // Créer le maillage
    this.terrain = new THREE.Mesh(geometry, this.terrainMaterial);
    this.terrain.castShadow = this.config.enableShadows;
    this.terrain.receiveShadow = this.config.enableShadows;
    
    // Faire pivoter le terrain pour l'aligner correctement
    this.terrain.rotation.x = -Math.PI / 2;
    
    // Mettre à l'échelle le terrain
    const scale = 1000; // Échelle de base
    this.terrain.scale.set(scale, scale, scale * this.config.terrainScale);
    
    // Ajouter le terrain à la scène
    this.scene.add(this.terrain);
  }

  /**
   * Crée la géométrie du terrain à partir des données d'élévation
   * @param gridSize Taille de la grille
   * @returns Géométrie du terrain
   */
  private createTerrainGeometry(gridSize: number): THREE.PlaneGeometry {
    // Créer une géométrie de plan
    const geometry = new THREE.PlaneGeometry(1, 1, gridSize - 1, gridSize - 1);
    
    // Obtenir les positions des sommets
    const positions = geometry.getAttribute('position').array as Float32Array;
    
    // Calculer les altitudes pour chaque point
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = (i * gridSize + j) * 3;
        
        // Coordonnées normalisées (0-1)
        const u = j / (gridSize - 1);
        const v = i / (gridSize - 1);
        
        // Interpoler les coordonnées géographiques
        const lat = this.terrainBounds.min.lat + v * (this.terrainBounds.max.lat - this.terrainBounds.min.lat);
        const lng = this.terrainBounds.min.lng + u * (this.terrainBounds.max.lng - this.terrainBounds.min.lng);
        
        // Obtenir l'altitude interpolée
        const altitude = this.getInterpolatedAltitude(lat, lng);
        
        // Normaliser l'altitude pour la géométrie
        // Typiquement on divise par une valeur qui représente l'altitude maximale attendue
        // pour que le terrain reste dans des proportions raisonnables
        const normalizedAltitude = altitude / 3000; // 3000m comme altitude max de référence
        
        // Appliquer l'altitude au sommet
        positions[index + 2] = normalizedAltitude;
      }
    }
    
    // Mettre à jour les positions
    geometry.getAttribute('position').needsUpdate = true;
    
    // Recalculer les normales pour l'éclairage
    geometry.computeVertexNormals();
    
    return geometry;
  }

  /**
   * Obtient l'altitude interpolée à une position géographique donnée
   * @param lat Latitude
   * @param lng Longitude
   * @returns Altitude en mètres
   */
  private getInterpolatedAltitude(lat: number, lng: number): number {
    if (!this.elevationData) return 0;
    
    // Implémentation simplifiée pour l'interpolation
    // Trouver les points de données les plus proches et interpoler linéairement
    
    // Parcourir les points du profil d'élévation
    const points = this.elevationData.points;
    
    // Si pas de points, retourner 0
    if (!points || points.length === 0) return 0;
    
    // Si un seul point, retourner son altitude
    if (points.length === 1) return points[0].altitude;
    
    // Trouver les deux points les plus proches en distance
    let minDist1 = Number.MAX_VALUE;
    let minDist2 = Number.MAX_VALUE;
    let index1 = 0;
    let index2 = 0;
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const dist = this.calculateDistance(lat, lng, point.lat, point.lng);
      
      if (dist < minDist1) {
        minDist2 = minDist1;
        index2 = index1;
        minDist1 = dist;
        index1 = i;
      } else if (dist < minDist2) {
        minDist2 = dist;
        index2 = i;
      }
    }
    
    // Obtenir les deux points les plus proches
    const point1 = points[index1];
    const point2 = points[index2];
    
    // Calculer le facteur d'interpolation
    const totalDist = minDist1 + minDist2;
    const weight1 = totalDist === 0 ? 1 : minDist2 / totalDist;
    const weight2 = totalDist === 0 ? 0 : minDist1 / totalDist;
    
    // Interpoler l'altitude
    return point1.altitude * weight1 + point2.altitude * weight2;
  }

  /**
   * Calcule la distance entre deux points géographiques
   * @param lat1 Latitude du point 1
   * @param lng1 Longitude du point 1
   * @param lat2 Latitude du point 2
   * @param lng2 Longitude du point 2
   * @returns Distance en mètres (approximation)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Formule de Haversine pour calculer la distance entre deux points sur une sphère
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Crée et ajoute une surface d'eau au terrain
   */
  private createWater(): void {
    if (!this.terrain) return;
    
    // Créer la géométrie de l'eau (un simple plan)
    const geometry = new THREE.PlaneGeometry(1, 1);
    
    // Créer le matériau de l'eau
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: 0x3333ff,
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
      side: THREE.DoubleSide
    });
    
    // Créer le maillage de l'eau
    this.water = new THREE.Mesh(geometry, this.waterMaterial);
    
    // Faire pivoter l'eau pour l'aligner avec le terrain
    this.water.rotation.x = -Math.PI / 2;
    
    // Positionner l'eau au niveau souhaité
    const normalizedWaterLevel = this.config.waterLevel / 3000; // Normaliser comme pour le terrain
    this.water.position.y = normalizedWaterLevel * 1000 * this.config.terrainScale;
    
    // Mettre à l'échelle l'eau pour couvrir tout le terrain
    const scale = 1100; // Légèrement plus grand que le terrain
    this.water.scale.set(scale, scale, 1);
    
    // Ajouter l'eau à la scène
    this.scene.add(this.water);
  }

  /**
   * Met à jour la position et la visibilité de l'eau
   */
  private updateWater(): void {
    if (!this.water) return;
    
    // Mettre à jour la visibilité
    this.water.visible = this.config.enableWater;
    
    // Mettre à jour la position
    const normalizedWaterLevel = this.config.waterLevel / 3000;
    this.water.position.y = normalizedWaterLevel * 1000 * this.config.terrainScale;
  }

  /**
   * Crée et ajoute de la végétation au terrain
   */
  private createVegetation(): void {
    if (!this.terrain || !this.elevationData) return;
    
    // Créer un groupe pour toute la végétation
    this.vegetation = new THREE.Group();
    
    // Déterminer le nombre d'arbres en fonction de la densité
    const terrainArea = this.terrainSize.width * this.terrainSize.height;
    const baseTreeCount = 100; // Nombre de base pour une densité de 1.0
    const treeCount = Math.floor(baseTreeCount * this.config.vegetationDensity);
    
    // Créer un modèle d'arbre simplifié (cône + cylindre)
    const treeModel = this.createTreeModel();
    
    // Placer les arbres aléatoirement sur le terrain
    for (let i = 0; i < treeCount; i++) {
      // Coordonnées aléatoires
      const u = Math.random();
      const v = Math.random();
      
      // Interpoler les coordonnées géographiques
      const lat = this.terrainBounds.min.lat + v * (this.terrainBounds.max.lat - this.terrainBounds.min.lat);
      const lng = this.terrainBounds.min.lng + u * (this.terrainBounds.max.lng - this.terrainBounds.min.lng);
      
      // Obtenir l'altitude à cette position
      const altitude = this.getInterpolatedAltitude(lat, lng);
      
      // Ne pas placer d'arbres au-dessus du niveau de neige ou sous le niveau d'eau
      if (altitude > this.config.snowLevel || altitude < this.config.waterLevel) {
        continue;
      }
      
      // Créer une instance de l'arbre
      const tree = treeModel.clone();
      
      // Positionner l'arbre sur le terrain
      // Convertir les coordonnées normalisées en positions dans la scène
      const x = (u - 0.5) * 1000; // Centrer sur le terrain
      const z = (v - 0.5) * 1000;
      const y = altitude / 3000 * 1000 * this.config.terrainScale;
      
      tree.position.set(x, y, z);
      
      // Faire varier légèrement la taille et la rotation
      const scale = 0.8 + Math.random() * 0.4;
      tree.scale.set(scale, scale, scale);
      tree.rotation.y = Math.random() * Math.PI * 2;
      
      // Ajouter l'arbre au groupe
      this.vegetation.add(tree);
    }
    
    // Ajouter le groupe à la scène
    this.scene.add(this.vegetation);
  }

  /**
   * Crée un modèle d'arbre simple
   * @returns Groupe THREE.js contenant le modèle d'arbre
   */
  private createTreeModel(): THREE.Group {
    const tree = new THREE.Group();
    
    // Matériau pour le tronc
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.9,
      metalness: 0.0
    });
    
    // Matériau pour les feuilles
    const leavesMaterial = new THREE.MeshStandardMaterial({
      color: 0x2E8B57,
      roughness: 0.8,
      metalness: 0.0
    });
    
    // Créer le tronc (cylindre)
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2.5;
    trunk.castShadow = this.config.enableShadows;
    trunk.receiveShadow = this.config.enableShadows;
    
    // Créer les feuilles (cône)
    const leavesGeometry = new THREE.ConeGeometry(3, 8, 8);
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.y = 8;
    leaves.castShadow = this.config.enableShadows;
    leaves.receiveShadow = this.config.enableShadows;
    
    // Ajouter le tronc et les feuilles au groupe
    tree.add(trunk);
    tree.add(leaves);
    
    // Mettre à l'échelle pour que l'arbre ait une taille raisonnable
    tree.scale.set(3, 3, 3);
    
    return tree;
  }

  /**
   * Met à jour la végétation en fonction de la configuration
   */
  private updateVegetation(): void {
    if (!this.vegetation) return;
    
    // Mettre à jour la visibilité
    this.vegetation.visible = this.config.enableVegetation;
    
    // Si la densité a beaucoup changé, recréer la végétation
    if (this.vegetation.children.length > 0 && 
        Math.abs(this.vegetation.children.length / 100 - this.config.vegetationDensity) > 0.2) {
      // Supprimer la végétation existante
      this.scene.remove(this.vegetation);
      this.vegetation = null;
      
      // Recréer si activé
      if (this.config.enableVegetation) {
        this.createVegetation();
      }
    }
  }

  /**
   * Crée et ajoute des sommets enneigés au terrain
   */
  private createSnowcaps(): void {
    if (!this.terrain || !this.elevationData) return;
    
    // Les sommets enneigés sont implémentés comme une texture de neige
    // qui se mélange avec la texture principale au-dessus du niveau de neige
    
    // Besoin d'un shader personnalisé pour implémenter cet effet
    // Voici une implémentation simplifiée qui modifie le matériau du terrain
    
    if (this.terrainMaterial) {
      // Créer une texture de neige
      const textureLoader = new THREE.TextureLoader();
      const snowTexture = textureLoader.load('/assets/textures/terrain/snow.jpg');
      
      // Configurer la texture
      snowTexture.wrapS = THREE.RepeatWrapping;
      snowTexture.wrapT = THREE.RepeatWrapping;
      snowTexture.repeat.set(5, 5);
      
      // Stocker la texture de neige dans le matériau
      this.terrainMaterial.userData.snowTexture = snowTexture;
      this.terrainMaterial.userData.snowLevel = this.config.snowLevel / 3000; // Normaliser
      
      // Note: Une implémentation complète nécessiterait un shader personnalisé
      // pour mélanger les textures en fonction de l'altitude
    }
  }

  /**
   * Met à jour les sommets enneigés en fonction de la configuration
   */
  private updateSnowcaps(): void {
    if (!this.terrainMaterial) return;
    
    // Mettre à jour le niveau de neige
    this.terrainMaterial.userData.snowLevel = this.config.snowLevel / 3000;
    
    // Note: Une implémentation complète mettrait à jour le shader
  }

  /**
   * Supprime tous les objets 3D de la scène
   */
  clear(): void {
    // Supprimer le terrain
    if (this.terrain) {
      this.scene.remove(this.terrain);
      this.terrain.geometry.dispose();
      if (this.terrainMaterial) {
        this.terrainMaterial.dispose();
      }
      this.terrain = null;
      this.terrainMaterial = null;
    }
    
    // Supprimer l'eau
    if (this.water) {
      this.scene.remove(this.water);
      this.water.geometry.dispose();
      if (this.waterMaterial) {
        this.waterMaterial.dispose();
      }
      this.water = null;
      this.waterMaterial = null;
    }
    
    // Supprimer la végétation
    if (this.vegetation) {
      this.scene.remove(this.vegetation);
      this.vegetation.traverse(object => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          }
        }
      });
      this.vegetation = null;
    }
    
    // Supprimer les textures
    Object.values(this.terrainTextures).forEach(texture => {
      if (texture) texture.dispose();
    });
    this.terrainTextures = {};
  }

  /**
   * Met à jour le rendu pour l'animation
   * @param deltaTime Temps écoulé depuis la dernière mise à jour (en secondes)
   */
  update(deltaTime: number): void {
    // Animer l'eau si nécessaire
    if (this.water && this.water.visible) {
      // Animation simple : faire onduler l'eau en modifiant sa position Y
      const time = performance.now() * 0.001;
      const amplitude = 0.005;
      const frequency = 0.5;
      
      this.water.position.y += Math.sin(time * frequency) * amplitude;
    }
    
    // Autres animations possibles...
  }
}
