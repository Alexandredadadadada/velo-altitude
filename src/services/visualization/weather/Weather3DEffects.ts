/**
 * Classe pour la gestion des effets météorologiques 3D
 * Permet d'ajouter des effets visuels dynamiques en fonction des conditions météo
 */

import * as THREE from 'three';
import { WeatherInfo } from '../../cols/types/WeatherTypes';
import { WeatherGPUComputation } from './WeatherGPUComputation';

/**
 * Configuration des effets météo
 */
export interface Weather3DEffectsConfig {
  intensity: number;         // Intensité globale des effets (0-1)
  enableRain: boolean;       // Activer la pluie
  enableSnow: boolean;       // Activer la neige
  enableFog: boolean;        // Activer le brouillard
  enableClouds: boolean;     // Activer les nuages
  enableWind: boolean;       // Activer les effets de vent
  enableLightning: boolean;  // Activer les éclairs
  quality: 'low' | 'medium' | 'high'; // Qualité des effets
  animationSpeed: number;    // Vitesse d'animation (0-1)
  useGPUComputation: boolean; // Utiliser le calcul GPU pour les particules
}

/**
 * Classe pour la gestion des effets météorologiques dans une scène 3D
 */
export class Weather3DEffects {
  // Systèmes de particules
  private rainSystem: THREE.Points | null = null;
  private snowSystem: THREE.Points | null = null;
  
  // Effets atmosphériques
  private fog: THREE.Fog | THREE.FogExp2 | null = null;
  private clouds: THREE.Group | null = null;
  
  // Autres éléments
  private lightning: THREE.PointLight | null = null;
  private windSimulation: WindSimulation | null = null;
  
  // État actuel
  private isActive: boolean = false;
  private currentWeather: WeatherInfo | null = null;
  
  // Configuration
  private config: Weather3DEffectsConfig = {
    intensity: 1.0,
    enableRain: true,
    enableSnow: true,
    enableFog: true,
    enableClouds: true,
    enableWind: true,
    enableLightning: true,
    quality: 'medium',
    animationSpeed: 1.0,
    useGPUComputation: false
  };
  
  // Calcul GPU pour les simulations météorologiques
  private gpuComputation: WeatherGPUComputation | null = null;
  
  // Horloge pour les animations
  private clock: THREE.Clock = new THREE.Clock();
  private elapsedTime: number = 0;

  /**
   * Constructeur
   * @param scene Scène THREE.js
   * @param config Configuration des effets météo
   * @param renderer Renderer WebGL (nécessaire pour le calcul GPU)
   */
  constructor(
    private scene: THREE.Scene,
    config?: Partial<Weather3DEffectsConfig>,
    private renderer?: THREE.WebGLRenderer
  ) {
    this.updateConfig(config || {});
    
    // Initialiser le calcul GPU si activé et si le renderer est fourni
    if (this.config.useGPUComputation && this.renderer) {
      this.initGPUComputation();
    }
  }

  /**
   * Initialise le moteur de calcul GPU
   */
  private initGPUComputation(): void {
    if (!this.renderer) {
      console.warn('Impossible d\'initialiser le calcul GPU sans renderer WebGL');
      return;
    }
    
    // Déterminer la taille de la texture en fonction de la qualité
    let textureSize: number;
    switch (this.config.quality) {
      case 'low': textureSize = 64; break;
      case 'high': textureSize = 256; break;
      case 'medium':
      default: textureSize = 128; break;
    }
    
    // Créer le moteur de calcul GPU
    this.gpuComputation = new WeatherGPUComputation(this.renderer, {
      textureSize: textureSize,
      particleCount: textureSize * textureSize,
      bounds: 200,
      velocityFactor: 0.2,
      useHighPrecision: this.config.quality === 'high'
    });
  }

  /**
   * Met à jour la configuration
   * @param config Nouvelle configuration partielle
   */
  updateConfig(config: Partial<Weather3DEffectsConfig>): void {
    const prevConfig = { ...this.config };
    this.config = { ...this.config, ...config };
    
    // Si la qualité ou l'utilisation du GPU a changé, réinitialiser le calcul GPU
    if (prevConfig.quality !== this.config.quality || 
        prevConfig.useGPUComputation !== this.config.useGPUComputation) {
      
      if (this.config.useGPUComputation && this.renderer) {
        if (this.gpuComputation) {
          this.gpuComputation.dispose();
        }
        this.initGPUComputation();
      }
    }
    
    // Mettre à jour les systèmes existants si nécessaire
    if (this.isActive && this.currentWeather) {
      this.updateFromWeatherData(this.currentWeather);
    }
  }

  /**
   * Met à jour les effets météo en fonction des données météo
   * @param weather Données météo
   */
  updateFromWeatherData(weather: WeatherInfo): void {
    this.currentWeather = weather;
    
    // Supprimer tous les effets existants
    this.clear();
    
    // Créer les nouveaux effets
    this.createEffects(weather);
    
    this.isActive = true;
  }

  /**
   * Supprime tous les effets de la scène
   */
  clear(): void {
    // Supprimer la pluie
    if (this.rainSystem) {
      this.scene.remove(this.rainSystem);
      this.rainSystem = null;
    }
    
    // Supprimer la neige
    if (this.snowSystem) {
      this.scene.remove(this.snowSystem);
      this.snowSystem = null;
    }
    
    // Supprimer le brouillard
    if (this.fog) {
      this.scene.fog = null;
      this.fog = null;
    }
    
    // Supprimer les nuages
    if (this.clouds) {
      this.scene.remove(this.clouds);
      this.clouds = null;
    }
    
    // Supprimer les éclairs
    if (this.lightning) {
      this.scene.remove(this.lightning);
      this.lightning = null;
    }
    
    // Arrêter la simulation de vent
    if (this.windSimulation) {
      this.windSimulation.stop();
      this.windSimulation = null;
    }
    
    this.isActive = false;
  }

  /**
   * Crée les effets météo en fonction des données
   * @param weather Données météo
   */
  private createEffects(weather: WeatherInfo): void {
    const current = weather.current;
    
    // Déterminer les conditions météo
    const isRaining = current.precipitation > 0.5 && current.temperature > 0;
    const isSnowing = current.precipitation > 0.5 && current.temperature <= 0;
    const isFoggy = current.visibility < 5000;
    const isCloudy = current.cloudCover > 0.5;
    const isStormy = weather.alerts?.some(alert => 
      alert.type === 'thunderstorm' || 
      alert.type === 'storm'
    ) || false;
    const windStrength = Math.min(1, current.windSpeed / 50); // Normaliser entre 0 et 1
    
    // Ajouter la pluie si nécessaire
    if (isRaining && this.config.enableRain) {
      const rainIntensity = Math.min(1, current.precipitation / 10);
      this.createRain(rainIntensity);
    }
    
    // Ajouter la neige si nécessaire
    if (isSnowing && this.config.enableSnow) {
      const snowIntensity = Math.min(1, current.precipitation / 10);
      this.createSnow(snowIntensity);
    }
    
    // Ajouter le brouillard si nécessaire
    if (isFoggy && this.config.enableFog) {
      const fogDensity = Math.min(1, (5000 - current.visibility) / 5000);
      this.createFog(fogDensity);
    }
    
    // Ajouter les nuages si nécessaire
    if (isCloudy && this.config.enableClouds) {
      const cloudDensity = current.cloudCover;
      this.createClouds(cloudDensity);
    }
    
    // Ajouter les éclairs si nécessaire
    if (isStormy && this.config.enableLightning) {
      this.createLightning();
    }
    
    // Ajouter les effets de vent si nécessaire
    if (this.config.enableWind && windStrength > 0.1) {
      this.createWind(windStrength, current.windDirection);
      
      // Configurer le vent pour le calcul GPU si disponible
      if (this.gpuComputation) {
        const windX = Math.sin(current.windDirection * Math.PI / 180) * windStrength * 2;
        const windZ = Math.cos(current.windDirection * Math.PI / 180) * windStrength * 2;
        this.gpuComputation.setWind(windX, windZ);
        this.gpuComputation.setTurbulence(windStrength * 0.5);
      }
    }
  }

  /**
   * Crée un système de particules pour la pluie
   * @param intensity Intensité de la pluie (0-1)
   */
  private createRain(intensity: number): void {
    // Ajuster l'intensité en fonction de la configuration
    const adjustedIntensity = intensity * this.config.intensity;
    
    // Si le calcul GPU est activé, utiliser le système basé sur GPU
    if (this.config.useGPUComputation && this.gpuComputation && this.renderer) {
      this.createGPURain(adjustedIntensity);
      return;
    }
    
    // Sinon, utiliser l'implémentation CPU standard
    // Déterminer le nombre de particules en fonction de la qualité
    let particleCount: number;
    switch (this.config.quality) {
      case 'low': particleCount = 1000; break;
      case 'high': particleCount = 10000; break;
      case 'medium':
      default: particleCount = 5000; break;
    }
    
    // Calculer le nombre final de particules
    const finalParticleCount = Math.floor(particleCount * adjustedIntensity);
    
    // Créer la géométrie
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(finalParticleCount * 3);
    const velocities = new Float32Array(finalParticleCount);
    
    // Zone de pluie (taille adaptée à la scène)
    const size = 1000;
    
    // Initialiser les positions et vélocités aléatoires
    for (let i = 0; i < finalParticleCount; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * size; // x
      positions[i * 3 + 1] = Math.random() * size; // y
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * size; // z
      
      velocities[i] = 1 + Math.random(); // Vitesse de chute
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    
    // Créer le matériau
    const material = new THREE.PointsMaterial({
      color: 0x999999,
      size: 1.5,
      transparent: true,
      opacity: 0.6,
      // Texture de goutte (à implémenter)
    });
    
    // Créer le système de particules
    this.rainSystem = new THREE.Points(geometry, material);
    this.scene.add(this.rainSystem);
    
    // Animation (à implémenter dans une boucle d'animation)
  }

  /**
   * Crée un système de particules pour la pluie utilisant le calcul GPU
   * @param intensity Intensité de la pluie (0-1)
   */
  private createGPURain(intensity: number): void {
    if (!this.gpuComputation || !this.renderer) return;
    
    // Configurer le calcul GPU pour la pluie
    // Augmenter la gravité pour les gouttes de pluie
    this.gpuComputation.setGravity(9.8 * intensity);
    
    // Créer la géométrie pour les points
    const geometry = new THREE.BufferGeometry();
    
    // Créer une grille de points correspondant à la texture de calcul GPU
    const textureSize = Math.sqrt(this.gpuComputation['config'].particleCount);
    const positions = new Float32Array(textureSize * textureSize * 3);
    
    let i = 0;
    for (let y = 0; y < textureSize; y++) {
      for (let x = 0; x < textureSize; x++) {
        positions[i++] = (x / textureSize) * 2 - 1;
        positions[i++] = (y / textureSize) * 2 - 1;
        positions[i++] = 0;
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Créer un shader personnalisé pour le rendu des particules
    const material = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        pointSize: { value: 1.5 * (this.config.quality === 'high' ? 1.0 : this.config.quality === 'medium' ? 0.8 : 0.6) },
        pointAlpha: { value: 0.6 * intensity },
        color: { value: new THREE.Color(0x999999) }
      },
      vertexShader: `
        uniform sampler2D positionTexture;
        uniform float pointSize;
        
        varying float vLife;
        
        void main() {
          // Convertir la position du sommet (0-1) en coordonnées de texture
          vec2 uv = position.xy * 0.5 + 0.5;
          
          // Obtenir la position 3D et la durée de vie depuis la texture
          vec4 posLife = texture2D(positionTexture, uv);
          vec3 pos = posLife.xyz;
          vLife = posLife.w;
          
          // Transformer la position
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Taille du point qui diminue avec la distance
          gl_PointSize = pointSize * (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float pointAlpha;
        
        varying float vLife;
        
        void main() {
          // Créer une forme de goutte
          vec2 coord = gl_PointCoord - vec2(0.5);
          float distanceFromCenter = length(coord);
          
          // Si en dehors du cercle, éliminer le fragment
          if (distanceFromCenter > 0.5) discard;
          
          // Opacité basée sur la durée de vie et la distance du centre
          float alpha = pointAlpha * vLife * (1.0 - distanceFromCenter);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Créer les points
    this.rainSystem = new THREE.Points(geometry, material);
    this.scene.add(this.rainSystem);
  }

  /**
   * Crée un système de particules pour la neige
   * @param intensity Intensité de la neige (0-1)
   */
  private createSnow(intensity: number): void {
    // Ajuster l'intensité en fonction de la configuration
    const adjustedIntensity = intensity * this.config.intensity;
    
    // Si le calcul GPU est activé, utiliser le système basé sur GPU
    if (this.config.useGPUComputation && this.gpuComputation && this.renderer) {
      this.createGPUSnow(adjustedIntensity);
      return;
    }
    
    // Sinon, utiliser l'implémentation CPU standard
    // Déterminer le nombre de particules en fonction de la qualité
    let particleCount: number;
    switch (this.config.quality) {
      case 'low': particleCount = 500; break;
      case 'high': particleCount = 5000; break;
      case 'medium':
      default: particleCount = 2000; break;
    }
    
    // Calculer le nombre final de particules
    const finalParticleCount = Math.floor(particleCount * adjustedIntensity);
    
    // Créer la géométrie
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(finalParticleCount * 3);
    const velocities = new Float32Array(finalParticleCount);
    const rotations = new Float32Array(finalParticleCount);
    
    // Zone de neige (taille adaptée à la scène)
    const size = 1000;
    
    // Initialiser les positions et vélocités aléatoires
    for (let i = 0; i < finalParticleCount; i++) {
      positions[i * 3] = (Math.random() * 2 - 1) * size; // x
      positions[i * 3 + 1] = Math.random() * size; // y
      positions[i * 3 + 2] = (Math.random() * 2 - 1) * size; // z
      
      velocities[i] = 0.2 + Math.random() * 0.3; // Vitesse de chute
      rotations[i] = Math.random() * Math.PI; // Rotation
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
    
    // Créer le matériau
    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3,
      transparent: true,
      opacity: 0.8,
      // Texture de flocon (à implémenter)
    });
    
    // Créer le système de particules
    this.snowSystem = new THREE.Points(geometry, material);
    this.scene.add(this.snowSystem);
    
    // Animation (à implémenter dans une boucle d'animation)
  }

  /**
   * Crée un système de particules pour la neige utilisant le calcul GPU
   * @param intensity Intensité de la neige (0-1)
   */
  private createGPUSnow(intensity: number): void {
    if (!this.gpuComputation || !this.renderer) return;
    
    // Configurer le calcul GPU pour la neige
    // Réduire la gravité pour les flocons de neige
    this.gpuComputation.setGravity(2.0 * intensity);
    // Augmenter la turbulence pour des mouvements plus aléatoires
    this.gpuComputation.setTurbulence(0.8);
    
    // Créer la géométrie pour les points
    const geometry = new THREE.BufferGeometry();
    
    // Créer une grille de points correspondant à la texture de calcul GPU
    const textureSize = Math.sqrt(this.gpuComputation['config'].particleCount);
    const positions = new Float32Array(textureSize * textureSize * 3);
    
    let i = 0;
    for (let y = 0; y < textureSize; y++) {
      for (let x = 0; x < textureSize; x++) {
        positions[i++] = (x / textureSize) * 2 - 1;
        positions[i++] = (y / textureSize) * 2 - 1;
        positions[i++] = 0;
      }
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // Créer un shader personnalisé pour le rendu des flocons
    const material = new THREE.ShaderMaterial({
      uniforms: {
        positionTexture: { value: null },
        pointSize: { value: 3.0 * (this.config.quality === 'high' ? 1.0 : this.config.quality === 'medium' ? 0.8 : 0.6) },
        pointAlpha: { value: 0.8 * intensity },
        color: { value: new THREE.Color(0xffffff) },
        time: { value: 0.0 }
      },
      vertexShader: `
        uniform sampler2D positionTexture;
        uniform float pointSize;
        uniform float time;
        
        varying float vLife;
        varying vec2 vUv;
        
        void main() {
          // Convertir la position du sommet (0-1) en coordonnées de texture
          vec2 uv = position.xy * 0.5 + 0.5;
          vUv = uv;
          
          // Obtenir la position 3D et la durée de vie depuis la texture
          vec4 posLife = texture2D(positionTexture, uv);
          vec3 pos = posLife.xyz;
          vLife = posLife.w;
          
          // Rotation pour les flocons
          float angle = time * 0.2 + uv.x * 6.28;
          float size = pointSize * (0.8 + sin(angle) * 0.2);
          
          // Transformer la position
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          
          // Taille du point qui diminue avec la distance
          gl_PointSize = size * (1.0 / -mvPosition.z);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float pointAlpha;
        uniform float time;
        
        varying float vLife;
        varying vec2 vUv;
        
        void main() {
          // Créer une forme de flocon
          vec2 coord = gl_PointCoord - vec2(0.5);
          float distanceFromCenter = length(coord);
          
          // Si en dehors du cercle, éliminer le fragment
          if (distanceFromCenter > 0.5) discard;
          
          // Texture de flocon simplifiée
          float branches = max(
            abs(coord.x),
            abs(coord.y)
          );
          
          float dots = length(sin(coord * 12.0 + vUv * 6.28 + time));
          
          float pattern = mix(branches, dots, 0.5);
          
          // Opacité basée sur la durée de vie et le motif
          float alpha = pointAlpha * vLife * (1.0 - pattern * 0.5);
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    // Créer les points
    this.snowSystem = new THREE.Points(geometry, material);
    this.scene.add(this.snowSystem);
  }

  /**
   * Crée un effet de brouillard
   * @param density Densité du brouillard (0-1)
   */
  private createFog(density: number): void {
    // Ajuster la densité en fonction de la configuration
    const adjustedDensity = density * this.config.intensity;
    
    // Créer le brouillard exponentiel
    const fogColor = new THREE.Color(0xcccccc);
    this.fog = new THREE.FogExp2(fogColor.getHex(), 0.005 * adjustedDensity);
    this.scene.fog = this.fog;
  }

  /**
   * Crée des nuages
   * @param density Densité des nuages (0-1)
   */
  private createClouds(density: number): void {
    // Ajuster la densité en fonction de la configuration
    const adjustedDensity = density * this.config.intensity;
    
    // Créer un groupe pour les nuages
    this.clouds = new THREE.Group();
    
    // Déterminer le nombre de nuages en fonction de la qualité
    let cloudCount: number;
    switch (this.config.quality) {
      case 'low': cloudCount = 5; break;
      case 'high': cloudCount = 20; break;
      case 'medium':
      default: cloudCount = 10; break;
    }
    
    // Calculer le nombre final de nuages
    const finalCloudCount = Math.floor(cloudCount * adjustedDensity);
    
    // Zone de nuages (taille adaptée à la scène)
    const size = 2000;
    const height = 300;
    
    // Créer les nuages
    for (let i = 0; i < finalCloudCount; i++) {
      const cloud = this.createCloudMesh();
      
      // Positionner le nuage aléatoirement
      cloud.position.set(
        (Math.random() * 2 - 1) * size,
        height + Math.random() * 100,
        (Math.random() * 2 - 1) * size
      );
      
      // Rotation aléatoire
      cloud.rotation.y = Math.random() * Math.PI * 2;
      
      // Échelle aléatoire
      const scale = 100 + Math.random() * 100;
      cloud.scale.set(scale, scale / 2, scale);
      
      this.clouds.add(cloud);
    }
    
    this.scene.add(this.clouds);
  }

  /**
   * Crée un maillage de nuage
   * @returns Maillage de nuage
   */
  private createCloudMesh(): THREE.Mesh {
    // Créer une forme de nuage avec plusieurs sphères
    const group = new THREE.Group();
    
    // Matériau du nuage
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    // Créer plusieurs sphères pour former un nuage
    const sphereCount = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < sphereCount; i++) {
      const radius = 0.5 + Math.random() * 0.5;
      const geometry = new THREE.SphereGeometry(radius, 8, 8);
      const sphere = new THREE.Mesh(geometry, material);
      
      // Positionner la sphère aléatoirement
      sphere.position.set(
        (Math.random() * 2 - 1) * 2,
        (Math.random() * 2 - 1) * 0.5,
        (Math.random() * 2 - 1) * 2
      );
      
      group.add(sphere);
    }
    
    // Créer un seul maillage à partir du groupe
    const cloudGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cloudMesh = new THREE.Mesh(cloudGeometry, material);
    cloudMesh.visible = false;
    
    group.add(cloudMesh);
    
    return cloudMesh;
  }

  /**
   * Crée des éclairs
   */
  private createLightning(): void {
    // Créer une lumière ponctuelle pour l'éclair
    this.lightning = new THREE.PointLight(0x5555ff, 0, 1000);
    
    // Positionner la lumière aléatoirement dans le ciel
    this.lightning.position.set(
      (Math.random() * 2 - 1) * 500,
      300 + Math.random() * 200,
      (Math.random() * 2 - 1) * 500
    );
    
    this.scene.add(this.lightning);
    
    // Animation des éclairs (à implémenter dans une boucle d'animation)
  }

  /**
   * Crée des effets de vent
   * @param strength Force du vent (0-1)
   * @param direction Direction du vent en degrés
   */
  private createWind(strength: number, direction: number): void {
    // Ajuster la force en fonction de la configuration
    const adjustedStrength = strength * this.config.intensity;
    
    // Créer une simulation de vent
    this.windSimulation = new WindSimulation(this.scene, {
      strength: adjustedStrength,
      direction: direction,
      gusts: true,
      gustFrequency: 0.2 + Math.random() * 0.3,
      gustIntensity: 0.5 + Math.random() * 0.5
    });
    
    this.windSimulation.start();
  }

  /**
   * Met à jour les effets météo pour l'animation
   * @param deltaTime Temps écoulé depuis la dernière mise à jour (en secondes)
   */
  update(deltaTime: number): void {
    if (!this.isActive) return;
    
    // Mettre à jour le temps total
    this.elapsedTime += deltaTime;
    
    // Ajuster la vitesse d'animation
    const speed = deltaTime * this.config.animationSpeed;
    
    // Mettre à jour le calcul GPU si disponible
    if (this.gpuComputation) {
      this.gpuComputation.update(speed, this.elapsedTime);
      
      // Mettre à jour les textures pour le rendu des particules
      if (this.rainSystem && this.rainSystem.material instanceof THREE.ShaderMaterial) {
        this.rainSystem.material.uniforms.positionTexture.value = this.gpuComputation.getPositionTexture();
      }
      
      if (this.snowSystem && this.snowSystem.material instanceof THREE.ShaderMaterial) {
        this.snowSystem.material.uniforms.positionTexture.value = this.gpuComputation.getPositionTexture();
        this.snowSystem.material.uniforms.time.value = this.elapsedTime;
      }
    } else {
      // Mettre à jour la pluie
      if (this.rainSystem) {
        this.updateRain(speed);
      }
      
      // Mettre à jour la neige
      if (this.snowSystem) {
        this.updateSnow(speed);
      }
    }
    
    // Mettre à jour les nuages
    if (this.clouds) {
      this.updateClouds(speed);
    }
    
    // Mettre à jour les éclairs
    if (this.lightning) {
      this.updateLightning(speed);
    }
    
    // Mettre à jour la simulation de vent
    if (this.windSimulation) {
      this.windSimulation.update(speed);
    }
  }

  /**
   * Met à jour l'animation de la pluie
   * @param speed Vitesse d'animation
   */
  private updateRain(speed: number): void {
    if (!this.rainSystem) return;
    
    const positions = (this.rainSystem.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const velocities = (this.rainSystem.geometry.getAttribute('velocity') as THREE.BufferAttribute).array as Float32Array;
    const count = positions.length / 3;
    
    for (let i = 0; i < count; i++) {
      // Mettre à jour la position Y (hauteur)
      positions[i * 3 + 1] -= velocities[i] * speed * 50;
      
      // Si la particule est trop basse, la réinitialiser en haut
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3] = (Math.random() * 2 - 1) * 1000; // x
        positions[i * 3 + 1] = 1000; // y
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * 1000; // z
      }
    }
    
    // Marquer les attributs comme nécessitant une mise à jour
    (this.rainSystem.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Met à jour l'animation de la neige
   * @param speed Vitesse d'animation
   */
  private updateSnow(speed: number): void {
    if (!this.snowSystem) return;
    
    const positions = (this.snowSystem.geometry.getAttribute('position') as THREE.BufferAttribute).array as Float32Array;
    const velocities = (this.snowSystem.geometry.getAttribute('velocity') as THREE.BufferAttribute).array as Float32Array;
    const rotations = (this.snowSystem.geometry.getAttribute('rotation') as THREE.BufferAttribute).array as Float32Array;
    const count = positions.length / 3;
    
    for (let i = 0; i < count; i++) {
      // Mettre à jour la position Y (hauteur)
      positions[i * 3 + 1] -= velocities[i] * speed * 20;
      
      // Ajouter un mouvement horizontal sinusoïdal
      positions[i * 3] += Math.sin(rotations[i] + speed) * 0.2;
      positions[i * 3 + 2] += Math.cos(rotations[i] + speed) * 0.2;
      
      // Mettre à jour la rotation
      rotations[i] += speed * 0.1;
      
      // Si la particule est trop basse, la réinitialiser en haut
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3] = (Math.random() * 2 - 1) * 1000; // x
        positions[i * 3 + 1] = 1000; // y
        positions[i * 3 + 2] = (Math.random() * 2 - 1) * 1000; // z
      }
    }
    
    // Marquer les attributs comme nécessitant une mise à jour
    (this.snowSystem.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
    (this.snowSystem.geometry.getAttribute('rotation') as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * Met à jour l'animation des nuages
   * @param speed Vitesse d'animation
   */
  private updateClouds(speed: number): void {
    if (!this.clouds) return;
    
    // Obtenir la direction du vent (si disponible)
    const windDirection = this.windSimulation ? 
      this.windSimulation.getCurrentDirection() : 
      new THREE.Vector3(-1, 0, 0);
    
    // Obtenir la force du vent (si disponible)
    const windStrength = this.windSimulation ? 
      this.windSimulation.getCurrentStrength() : 
      0.5;
    
    // Déplacer chaque nuage dans la direction du vent
    this.clouds.children.forEach(cloud => {
      cloud.position.x += windDirection.x * speed * 10 * windStrength;
      cloud.position.z += windDirection.z * speed * 10 * windStrength;
      
      // Si le nuage est trop loin, le repositionner de l'autre côté
      const maxDistance = 2000;
      if (cloud.position.x > maxDistance) cloud.position.x = -maxDistance;
      if (cloud.position.x < -maxDistance) cloud.position.x = maxDistance;
      if (cloud.position.z > maxDistance) cloud.position.z = -maxDistance;
      if (cloud.position.z < -maxDistance) cloud.position.z = maxDistance;
    });
  }

  /**
   * Met à jour l'animation des éclairs
   * @param speed Vitesse d'animation
   */
  private updateLightning(speed: number): void {
    if (!this.lightning) return;
    
    // Probabilité d'éclair basée sur la vitesse d'animation
    const lightningProbability = 0.01 * speed;
    
    // Déclencher un éclair aléatoirement
    if (Math.random() < lightningProbability) {
      // Intensité aléatoire
      const intensity = 5 + Math.random() * 10;
      
      // Activer l'éclair
      this.lightning.intensity = intensity;
      
      // Désactiver l'éclair après un court délai
      setTimeout(() => {
        if (this.lightning) {
          this.lightning.intensity = 0;
        }
      }, 100 + Math.random() * 100);
      
      // Repositionner l'éclair pour le prochain flash
      this.lightning.position.set(
        (Math.random() * 2 - 1) * 500,
        300 + Math.random() * 200,
        (Math.random() * 2 - 1) * 500
      );
    }
  }
}

/**
 * Classe pour la simulation de vent
 */
class WindSimulation {
  private isRunning: boolean = false;
  private time: number = 0;
  private baseStrength: number;
  private baseDirection: number;
  private currentStrength: number;
  private currentDirection: THREE.Vector3;
  private gustTimer: number = 0;
  
  // Configuration
  private config = {
    strength: 0.5,
    direction: 0,
    gusts: true,
    gustFrequency: 0.3,
    gustIntensity: 0.7
  };

  /**
   * Constructeur
   * @param scene Scène THREE.js
   * @param config Configuration du vent
   */
  constructor(
    private scene: THREE.Scene,
    config?: Partial<typeof WindSimulation.prototype.config>
  ) {
    this.config = { ...this.config, ...config };
    
    this.baseStrength = this.config.strength;
    this.baseDirection = this.config.direction;
    this.currentStrength = this.baseStrength;
    
    // Convertir la direction en degrés en vecteur
    const directionRad = this.baseDirection * Math.PI / 180;
    this.currentDirection = new THREE.Vector3(
      -Math.sin(directionRad),
      0,
      -Math.cos(directionRad)
    );
  }

  /**
   * Démarre la simulation
   */
  start(): void {
    this.isRunning = true;
  }

  /**
   * Arrête la simulation
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Met à jour la simulation
   * @param deltaTime Temps écoulé depuis la dernière mise à jour (en secondes)
   */
  update(deltaTime: number): void {
    if (!this.isRunning) return;
    
    this.time += deltaTime;
    
    // Mise à jour de base - légère variation du vent
    const baseVariation = Math.sin(this.time * 0.5) * 0.1;
    this.currentStrength = this.baseStrength * (1 + baseVariation);
    
    // Gestion des rafales de vent
    if (this.config.gusts) {
      this.gustTimer -= deltaTime;
      
      if (this.gustTimer <= 0) {
        // Créer une nouvelle rafale
        if (Math.random() < this.config.gustFrequency) {
          const gustStrength = this.baseStrength * (1 + this.config.gustIntensity);
          const gustDuration = 0.5 + Math.random();
          
          // Appliquer la rafale
          this.currentStrength = gustStrength;
          
          // Réinitialiser le timer
          this.gustTimer = gustDuration;
        } else {
          // Temps d'attente avant de vérifier à nouveau pour une rafale
          this.gustTimer = 1 + Math.random() * 2;
        }
      }
    }
    
    // Variation de la direction
    const directionVariation = Math.sin(this.time * 0.2) * 10; // ±10 degrés
    const newDirection = (this.baseDirection + directionVariation) * Math.PI / 180;
    
    this.currentDirection.set(
      -Math.sin(newDirection),
      0,
      -Math.cos(newDirection)
    );
  }

  /**
   * Obtient la force actuelle du vent
   * @returns Force du vent
   */
  getCurrentStrength(): number {
    return this.currentStrength;
  }

  /**
   * Obtient la direction actuelle du vent
   * @returns Direction du vent (vecteur normalisé)
   */
  getCurrentDirection(): THREE.Vector3 {
    return this.currentDirection.clone();
  }
}
