/**
 * Service de visualisation 3D pour les cols
 * Fournit une visualisation interactive en 3D des cols et de leurs profils d'élévation
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Col } from '../cols/types/ColTypes';
import { ElevationPoint, ElevationProfile } from '../cols/types/ElevationTypes';

/**
 * Options de configuration pour la visualisation 3D
 */
export interface Col3DOptions {
  width: number;
  height: number;
  exaggeration: number;
  colors: {
    terrain: string;
    path: string;
    markers: string;
    grid: string;
    difficult: string;
    extreme: string;
  };
  renderQuality: 'low' | 'medium' | 'high';
  shadows: boolean;
  antialiasing: boolean;
}

/**
 * Service de base pour la visualisation 3D des cols
 */
export class Col3DVisualizationService {
  protected scene: THREE.Scene;
  protected camera: THREE.PerspectiveCamera;
  protected renderer: THREE.WebGLRenderer;
  protected controls: OrbitControls;
  
  // Objets de la scène
  protected terrainMesh?: THREE.Mesh;
  protected pathLine?: THREE.Line;
  protected markers: THREE.Mesh[] = [];
  
  // État de l'animation
  protected animating: boolean = false;
  
  // Données du col
  protected currentCol?: Col;
  protected currentElevationProfile?: ElevationProfile;
  
  // Options par défaut
  protected defaultOptions: Col3DOptions = {
    width: 800,
    height: 600,
    exaggeration: 2,
    colors: {
      terrain: '#a5d6a7',
      path: '#3f51b5',
      markers: '#ffd700',
      grid: '#cccccc',
      difficult: '#ff9800',
      extreme: '#f44336'
    },
    renderQuality: 'medium',
    shadows: true,
    antialiasing: true
  };

  /**
   * Constructeur
   * @param container Élément HTML contenant la visualisation
   * @param options Options de configuration
   */
  constructor(
    protected container: HTMLElement,
    protected options: Partial<Col3DOptions> = {}
  ) {
    // Fusionner les options par défaut et les options fournies
    this.options = { ...this.defaultOptions, ...options };
    
    // Initialisation Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialiasing,
      alpha: true
    });
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    
    // Configuration de la scène
    this.setupScene();
  }

  /**
   * Configure la scène 3D de base
   */
  protected setupScene(): void {
    // Configuration du renderer
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    if (this.options.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Ajouter le canvas au conteneur
    this.container.appendChild(this.renderer.domElement);
    
    // Configurer l'éclairage
    this.setupLighting();
    
    // Ajouter une grille de référence
    const gridSize = 100;
    const gridDivisions = 20;
    const gridColor = new THREE.Color(this.options.colors.grid);
    const grid = new THREE.GridHelper(gridSize, gridDivisions, gridColor, gridColor);
    grid.position.y = -0.1; // Légèrement sous le terrain
    this.scene.add(grid);
    
    // Position initiale de la caméra
    this.camera.position.set(5, 8, 15);
    this.controls.update();
    
    // Configurer les contrôles
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 80;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Limiter légèrement pour éviter de voir sous le terrain
  }

  /**
   * Configure l'éclairage de la scène
   */
  protected setupLighting(): void {
    // Lumière ambiante
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Lumière directionnelle (soleil)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(30, 50, 30);
    directionalLight.castShadow = this.options.shadows;
    
    // Configurer les ombres
    if (this.options.shadows) {
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      directionalLight.shadow.camera.near = 0.5;
      directionalLight.shadow.camera.far = 200;
      
      const size = 50;
      directionalLight.shadow.camera.left = -size;
      directionalLight.shadow.camera.right = size;
      directionalLight.shadow.camera.top = size;
      directionalLight.shadow.camera.bottom = -size;
    }
    
    this.scene.add(directionalLight);
    
    // Lumière d'appoint
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-30, 20, -30);
    this.scene.add(fillLight);
  }

  /**
   * Visualise un col en 3D
   * @param col Col à visualiser
   * @returns Promise résolue lorsque la visualisation est prête
   */
  public async visualizeCol(col: Col): Promise<void> {
    // Sauvegarder les données
    this.currentCol = col;
    this.currentElevationProfile = col.elevationProfile;
    
    // Nettoyer la scène précédente
    this.clearScene();
    
    // Générer le terrain
    await this.generateTerrain(col.elevationProfile);
    
    // Tracer le chemin
    this.createPath(col.elevationProfile.points);
    
    // Ajouter les marqueurs
    this.addMarkers(col);
    
    // Optimiser la vue
    this.focusView();
    
    // Démarrer le rendu si nécessaire
    if (!this.animating) {
      this.startAnimation();
    }
  }

  /**
   * Génère le maillage de terrain à partir du profil d'élévation
   * @param profile Profil d'élévation
   */
  protected async generateTerrain(profile: ElevationProfile): Promise<void> {
    if (!profile || !profile.points || profile.points.length === 0) {
      console.error('Profil d\'élévation invalide ou vide');
      return;
    }
    
    // Déterminer l'exagération verticale
    const verticalExaggeration = this.options.exaggeration;
    
    // Créer la géométrie de base du terrain
    // La largeur est basée sur le nombre de points, la hauteur sur l'amplitude de l'élévation
    const width = profile.distance || profile.points.length / 10;
    const elevationRange = (profile.maxElevation || 0) - (profile.minElevation || 0);
    const height = elevationRange * verticalExaggeration;
    
    // Ajuster la résolution en fonction de la qualité
    let segments: number;
    switch (this.options.renderQuality) {
      case 'low': segments = Math.min(50, profile.points.length - 1); break;
      case 'high': segments = profile.points.length - 1; break;
      default: segments = Math.min(100, profile.points.length - 1);
    }
    
    // Créer la géométrie
    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      segments,
      1
    );
    
    // Appliquer les élévations
    const minElevation = profile.minElevation || 0;
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Interpoler les élévations sur les segments
    for (let i = 0; i <= segments; i++) {
      // Index dans le tableau de positions (3 composantes par vertex)
      const posIndex = i * 3;
      
      // Calculer l'index correspondant dans les points d'élévation
      const pointIndex = Math.floor((i / segments) * (profile.points.length - 1));
      
      // Obtenir l'élévation
      const elevation = profile.points[pointIndex].altitude;
      
      // Appliquer l'élévation normalisée
      const normalizedElevation = (elevation - minElevation) * verticalExaggeration;
      
      // Pour chaque point sur la rangée (ici une seule rangée pour un profil 2D)
      positions[posIndex + 2] = normalizedElevation;
    }
    
    // Mettre à jour la géométrie
    geometry.computeVertexNormals();
    
    // Créer le matériau du terrain
    const terrainColor = new THREE.Color(this.options.colors.terrain);
    const material = new THREE.MeshStandardMaterial({
      color: terrainColor,
      roughness: 0.8,
      metalness: 0.2,
      flatShading: this.options.renderQuality === 'low',
      side: THREE.DoubleSide
    });
    
    // Créer le maillage
    this.terrainMesh = new THREE.Mesh(geometry, material);
    
    // Configurer les ombres
    if (this.options.shadows) {
      this.terrainMesh.castShadow = true;
      this.terrainMesh.receiveShadow = true;
    }
    
    // Orienter le terrain correctement (par défaut, le plan est XZ)
    this.terrainMesh.rotation.x = -Math.PI / 2;
    
    // Ajouter à la scène
    this.scene.add(this.terrainMesh);
  }

  /**
   * Crée une ligne représentant le parcours sur le terrain
   * @param points Points d'élévation
   */
  protected createPath(points: ElevationPoint[]): void {
    if (!points || points.length < 2) return;
    
    // Créer la géométrie du chemin
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(points.length * 3);
    
    // Déterminer les valeurs min/max pour normalisation
    const minElevation = this.currentElevationProfile?.minElevation || 0;
    const width = this.currentElevationProfile?.distance || points.length / 10;
    
    // Remplir les vertex du chemin
    for (let i = 0; i < points.length; i++) {
      // Calculer la position X normalisée (progression horizontale)
      const normalizedX = (i / (points.length - 1)) * width;
      
      // Élévation normalisée
      const normalizedY = (points[i].altitude - minElevation) * this.options.exaggeration;
      
      // Décaler légèrement au-dessus du terrain pour éviter le z-fighting
      const offset = 0.05;
      
      vertices[i * 3] = normalizedX;
      vertices[i * 3 + 1] = offset;
      vertices[i * 3 + 2] = normalizedY;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Créer le matériau du chemin
    const pathColor = new THREE.Color(this.options.colors.path);
    const material = new THREE.LineBasicMaterial({
      color: pathColor,
      linewidth: 2
    });
    
    // Créer la ligne
    this.pathLine = new THREE.Line(geometry, material);
    
    // Orienter le chemin comme le terrain
    this.pathLine.rotation.x = -Math.PI / 2;
    
    // Ajouter à la scène
    this.scene.add(this.pathLine);
  }

  /**
   * Ajoute des marqueurs pour les points d'intérêt sur le parcours
   * @param col Col à visualiser
   */
  protected addMarkers(col: ElevationProfile): void {
    if (!col || !col.points || col.points.length === 0) return;
    
    const points = col.points;
    const minElevation = col.minElevation || 0;
    const width = col.distance || points.length / 10;
    
    // Marqueur de départ
    const startMarker = this.createMarker(
      0,
      (points[0].altitude - minElevation) * this.options.exaggeration,
      this.options.colors.markers,
      'Départ'
    );
    this.markers.push(startMarker);
    
    // Marqueur de sommet/arrivée
    const endIndex = points.length - 1;
    const endMarker = this.createMarker(
      width,
      (points[endIndex].altitude - minElevation) * this.options.exaggeration,
      this.options.colors.markers,
      'Sommet'
    );
    this.markers.push(endMarker);
    
    // Marqueurs pour les segments significatifs
    if (col.segments) {
      col.segments.forEach(segment => {
        if (segment.classification === 'difficile' || segment.classification === 'extrême') {
          const startX = (segment.startIndex / (points.length - 1)) * width;
          const startY = (points[segment.startIndex].altitude - minElevation) * this.options.exaggeration;
          
          const color = segment.classification === 'extrême' ? 
            this.options.colors.extreme : 
            this.options.colors.difficult;
          
          const marker = this.createMarker(
            startX,
            startY,
            color,
            `${segment.classification}: ${segment.grade}%`
          );
          
          this.markers.push(marker);
        }
      });
    }
  }

  /**
   * Crée un marqueur 3D à une position donnée
   * @param x Position X
   * @param y Position Y
   * @param color Couleur du marqueur
   * @param label Étiquette du marqueur (optionnel)
   * @returns Mesh du marqueur
   */
  protected createMarker(x: number, y: number, color: string, label?: string): THREE.Mesh {
    // Créer une géométrie de sphère
    const radius = 0.2;
    const segments = this.options.renderQuality === 'high' ? 16 : 8;
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    
    // Créer un matériau brillant
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.3,
      metalness: 0.7
    });
    
    // Créer le mesh
    const marker = new THREE.Mesh(geometry, material);
    
    // Positionner le marqueur
    marker.position.set(x, 0.2, y); // Légèrement au-dessus du terrain
    
    // Configurer les ombres
    if (this.options.shadows) {
      marker.castShadow = true;
      marker.receiveShadow = true;
    }
    
    // Orienter le marqueur comme le terrain
    marker.rotation.x = -Math.PI / 2;
    
    // Si une étiquette est fournie, créer un sprite de texte
    if (label) {
      const labelSprite = this.createTextSprite(label);
      labelSprite.position.set(0, radius * 3, 0);
      marker.add(labelSprite);
    }
    
    // Ajouter à la scène
    this.scene.add(marker);
    
    return marker;
  }

  /**
   * Crée un sprite de texte
   * @param text Texte à afficher
   * @returns Sprite contenant le texte
   */
  protected createTextSprite(text: string): THREE.Sprite {
    // Créer un canvas pour le rendu du texte
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      throw new Error('Impossible de créer un contexte 2D pour le sprite de texte');
    }
    
    // Définir les dimensions
    canvas.width = 256;
    canvas.height = 128;
    
    // Effacer le canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Définir l'arrière-plan
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Définir le style de texte
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = 'white';
    
    // Dessiner le texte
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Créer une texture à partir du canvas
    const texture = new THREE.CanvasTexture(canvas);
    
    // Créer un matériau pour le sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true
    });
    
    // Créer le sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    
    return sprite;
  }

  /**
   * Ajuste la caméra pour avoir une bonne vue du terrain
   */
  protected focusView(): void {
    if (!this.terrainMesh) return;
    
    // Créer une boîte englobante autour du terrain
    const box = new THREE.Box3().setFromObject(this.terrainMesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Calculer une distance appropriée basée sur la taille
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 1.5;
    
    // Positionner la caméra
    this.camera.position.set(
      center.x + distance * 0.7, // Légèrement décalé pour une vue en perspective
      distance * 0.7,            // En hauteur
      center.z + distance * 0.7  // Légèrement décalé
    );
    
    // Orienter les contrôles vers le centre du terrain
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Démarre la boucle d'animation
   */
  protected startAnimation(): void {
    this.animating = true;
    this.animate();
  }

  /**
   * Boucle d'animation
   */
  protected animate(): void {
    if (!this.animating) return;
    
    requestAnimationFrame(() => this.animate());
    
    // Mettre à jour les contrôles
    this.controls.update();
    
    // Autres animations (à surcharger dans les classes dérivées)
    this.updateAnimations();
    
    // Rendu de la scène
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Met à jour les animations spécifiques
   * À surcharger dans les classes dérivées
   */
  protected updateAnimations(): void {
    // Implémentation par défaut vide - à surcharger
  }

  /**
   * Nettoie la scène en supprimant les objets existants
   */
  protected clearScene(): void {
    // Supprimer le terrain
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = undefined;
    }
    
    // Supprimer le chemin
    if (this.pathLine) {
      this.scene.remove(this.pathLine);
      this.pathLine.geometry.dispose();
      (this.pathLine.material as THREE.Material).dispose();
      this.pathLine = undefined;
    }
    
    // Supprimer les marqueurs
    this.markers.forEach(marker => {
      this.scene.remove(marker);
      marker.geometry.dispose();
      if (marker.material instanceof THREE.Material) {
        marker.material.dispose();
      } else if (Array.isArray(marker.material)) {
        marker.material.forEach(mat => mat.dispose());
      }
      
      // Supprimer les enfants (sprites d'étiquettes)
      marker.children.forEach(child => {
        if (child instanceof THREE.Sprite) {
          (child.material as THREE.SpriteMaterial).map?.dispose();
          (child.material as THREE.SpriteMaterial).dispose();
        }
      });
    });
    
    this.markers = [];
  }

  /**
   * Met à jour les dimensions du rendu
   * @param width Largeur en pixels
   * @param height Hauteur en pixels
   */
  public resize(width: number, height: number): void {
    this.options.width = width;
    this.options.height = height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  /**
   * Libère les ressources utilisées par le service
   */
  public dispose(): void {
    // Arrêter l'animation
    this.animating = false;
    
    // Nettoyer la scène
    this.clearScene();
    
    // Supprimer le renderer du DOM
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
    
    // Disposer des ressources THREE.js
    this.renderer.dispose();
    this.controls.dispose();
  }
}
