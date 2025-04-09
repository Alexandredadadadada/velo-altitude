/**
 * Module de calcul GPU pour les simulations météorologiques
 * Utilise les shaders pour accélérer les calculs de particules
 */

import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer';

/**
 * Configuration pour la simulation GPU
 */
export interface WeatherGPUConfig {
  particleCount: number;     // Nombre de particules
  textureSize: number;       // Taille de la texture (dimension)
  bounds: number;            // Limites de la zone de simulation
  velocityFactor: number;    // Facteur de vitesse
  useHighPrecision: boolean; // Utiliser la haute précision
}

/**
 * Service de calcul GPU pour les effets météorologiques
 */
export class WeatherGPUComputation {
  private gpuCompute: GPUComputationRenderer | null = null;
  private positionVariable: any = null;
  private velocityVariable: any = null;
  private positionUniforms: any = null;
  private velocityUniforms: any = null;
  
  // Shaders
  private positionShader: string = '';
  private velocityShader: string = '';
  
  // Configuration
  private config: WeatherGPUConfig = {
    particleCount: 16384,  // 128 * 128
    textureSize: 128,      // 128 * 128 = 16384 particules
    bounds: 200,
    velocityFactor: 0.2,
    useHighPrecision: false
  };

  /**
   * Constructeur
   * @param renderer Renderer WebGL
   * @param config Configuration
   */
  constructor(
    private renderer: THREE.WebGLRenderer,
    config?: Partial<WeatherGPUConfig>
  ) {
    this.config = { ...this.config, ...config };
    
    // Définir les shaders
    this.defineShaders();
    
    // Initialiser la simulation GPU
    this.initGPUCompute();
  }

  /**
   * Définit les shaders pour la simulation
   */
  private defineShaders(): void {
    // Shader de position
    this.positionShader = `
      uniform float time;
      uniform float deltaTime;
      uniform float bounds;
      uniform float velocityFactor;
      uniform float gravity;
      uniform float windX;
      uniform float windZ;
      
      void main() {
        // Récupérer les positions et vélocités actuelles
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 posData = texture2D(texturePosition, uv);
        vec4 velData = texture2D(textureVelocity, uv);
        
        // Position actuelle
        vec3 pos = posData.xyz;
        // Durée de vie
        float life = posData.w;
        
        // Vélocité actuelle
        vec3 vel = velData.xyz;
        
        // Appliquer la gravité
        vel.y -= gravity * deltaTime;
        
        // Appliquer le vent
        vel.x += windX * deltaTime;
        vel.z += windZ * deltaTime;
        
        // Mettre à jour la position
        pos += vel * velocityFactor * deltaTime;
        
        // Vérifier les limites et réinitialiser au besoin
        if (pos.y < -bounds || life <= 0.0) {
          // Réinitialiser la position au-dessus de la zone
          pos.x = (random(uv + time) * 2.0 - 1.0) * bounds;
          pos.y = bounds + random(uv + time + 0.1) * 10.0;
          pos.z = (random(uv + time + 0.2) * 2.0 - 1.0) * bounds;
          
          // Réinitialiser la durée de vie
          life = 1.0 + random(uv + time + 0.3) * 0.5;
        } else {
          // Diminuer la durée de vie
          life -= deltaTime * 0.2;
        }
        
        // Stocker la nouvelle position et durée de vie
        gl_FragColor = vec4(pos, life);
      }
    `;
    
    // Shader de vélocité
    this.velocityShader = `
      uniform float time;
      uniform float deltaTime;
      uniform float velocityFactor;
      uniform float turbulence;
      
      // Fonction de bruit simplex (à implémenter ou importer)
      float simplex(vec3 p) {
        return sin(p.x + p.y + p.z + time); // Pseudo-bruit simplifié
      }
      
      void main() {
        // Récupérer les positions et vélocités actuelles
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec4 posData = texture2D(texturePosition, uv);
        vec4 velData = texture2D(textureVelocity, uv);
        
        // Position actuelle
        vec3 pos = posData.xyz;
        
        // Vélocité actuelle
        vec3 vel = velData.xyz;
        
        // Appliquer la turbulence basée sur un bruit 3D
        if (turbulence > 0.0) {
          float noise = simplex(pos * 0.1) * turbulence;
          vel.x += noise * deltaTime;
          vel.z += simplex(pos * 0.1 + 10.0) * turbulence * deltaTime;
        }
        
        // Limiter la vitesse
        float speed = length(vel);
        float maxSpeed = 20.0;
        if (speed > maxSpeed) {
          vel = (vel / speed) * maxSpeed;
        }
        
        // Stocker la nouvelle vélocité
        gl_FragColor = vec4(vel, velData.w);
      }
    `;
  }

  /**
   * Initialise la simulation GPU
   */
  private initGPUCompute(): void {
    // Créer le moteur de calcul GPU
    this.gpuCompute = new GPUComputationRenderer(
      this.config.textureSize, 
      this.config.textureSize, 
      this.renderer
    );
    
    if (this.gpuCompute === null) {
      console.error('WebGLRenderTarget non pris en charge par votre navigateur');
      return;
    }
    
    // Si la haute précision est requise
    if (this.config.useHighPrecision) {
      if (this.renderer.capabilities.isWebGL2) {
        this.gpuCompute.setDataType(THREE.FloatType);
      } else {
        this.gpuCompute.setDataType(THREE.HalfFloatType);
      }
    }
    
    // Créer les textures de données
    const positionTexture = this.gpuCompute.createTexture();
    const velocityTexture = this.gpuCompute.createTexture();
    
    // Initialiser les données
    this.initPositionTexture(positionTexture);
    this.initVelocityTexture(velocityTexture);
    
    // Créer les variables de calcul
    this.positionVariable = this.gpuCompute.addVariable(
      'texturePosition',
      this.positionShader,
      positionTexture
    );
    
    this.velocityVariable = this.gpuCompute.addVariable(
      'textureVelocity',
      this.velocityShader,
      velocityTexture
    );
    
    // Définir les dépendances variables
    this.gpuCompute.setVariableDependencies(this.positionVariable, [this.positionVariable, this.velocityVariable]);
    this.gpuCompute.setVariableDependencies(this.velocityVariable, [this.positionVariable, this.velocityVariable]);
    
    // Créer les uniformes pour la position
    this.positionUniforms = this.positionVariable.material.uniforms;
    this.positionUniforms.time = { value: 0.0 };
    this.positionUniforms.deltaTime = { value: 0.0 };
    this.positionUniforms.bounds = { value: this.config.bounds };
    this.positionUniforms.velocityFactor = { value: this.config.velocityFactor };
    this.positionUniforms.gravity = { value: 9.8 };
    this.positionUniforms.windX = { value: 0.0 };
    this.positionUniforms.windZ = { value: 0.0 };
    
    // Créer les uniformes pour la vélocité
    this.velocityUniforms = this.velocityVariable.material.uniforms;
    this.velocityUniforms.time = { value: 0.0 };
    this.velocityUniforms.deltaTime = { value: 0.0 };
    this.velocityUniforms.velocityFactor = { value: this.config.velocityFactor };
    this.velocityUniforms.turbulence = { value: 0.0 };
    
    // Initialiser le calcul GPU
    const error = this.gpuCompute.init();
    if (error !== null) {
      console.error(`Erreur d'initialisation du calcul GPU: ${error}`);
    }
  }

  /**
   * Initialise la texture de position
   * @param texture Texture à initialiser
   */
  private initPositionTexture(texture: THREE.DataTexture): void {
    const bounds = this.config.bounds;
    const textureArray = texture.image.data;
    
    for (let i = 0; i < textureArray.length; i += 4) {
      // Position x (-bounds à +bounds)
      textureArray[i] = (Math.random() * 2 - 1) * bounds;
      
      // Position y (hauteur aléatoire au-dessus de la scène)
      textureArray[i + 1] = bounds + Math.random() * 10;
      
      // Position z (-bounds à +bounds)
      textureArray[i + 2] = (Math.random() * 2 - 1) * bounds;
      
      // Durée de vie (1.0 - 1.5)
      textureArray[i + 3] = 1.0 + Math.random() * 0.5;
    }
  }

  /**
   * Initialise la texture de vélocité
   * @param texture Texture à initialiser
   */
  private initVelocityTexture(texture: THREE.DataTexture): void {
    const textureArray = texture.image.data;
    
    for (let i = 0; i < textureArray.length; i += 4) {
      // Vélocité initiale x (petite variation aléatoire)
      textureArray[i] = (Math.random() * 2 - 1) * 0.1;
      
      // Vélocité initiale y (vitesse de chute initiale)
      textureArray[i + 1] = -1.0 - Math.random() * 0.5;
      
      // Vélocité initiale z (petite variation aléatoire)
      textureArray[i + 2] = (Math.random() * 2 - 1) * 0.1;
      
      // Attribut supplémentaire (non utilisé pour l'instant)
      textureArray[i + 3] = 0.0;
    }
  }

  /**
   * Met à jour la simulation
   * @param deltaTime Temps écoulé depuis la dernière mise à jour (en secondes)
   * @param time Temps écoulé total (en secondes)
   */
  public update(deltaTime: number, time: number): void {
    if (!this.gpuCompute) return;
    
    // Mettre à jour les uniformes
    this.positionUniforms.time.value = time;
    this.positionUniforms.deltaTime.value = deltaTime;
    
    this.velocityUniforms.time.value = time;
    this.velocityUniforms.deltaTime.value = deltaTime;
    
    // Calculer la nouvelle étape
    this.gpuCompute.compute();
  }

  /**
   * Définit la force du vent
   * @param x Composante X du vent
   * @param z Composante Z du vent
   */
  public setWind(x: number, z: number): void {
    if (!this.positionUniforms) return;
    
    this.positionUniforms.windX.value = x;
    this.positionUniforms.windZ.value = z;
  }

  /**
   * Définit la force de la turbulence
   * @param value Force de la turbulence (0-1)
   */
  public setTurbulence(value: number): void {
    if (!this.velocityUniforms) return;
    
    this.velocityUniforms.turbulence.value = value;
  }

  /**
   * Définit la force de gravité
   * @param value Force de gravité
   */
  public setGravity(value: number): void {
    if (!this.positionUniforms) return;
    
    this.positionUniforms.gravity.value = value;
  }

  /**
   * Obtient la texture de position actuelle
   * @returns Texture de position
   */
  public getPositionTexture(): THREE.Texture | null {
    if (!this.gpuCompute) return null;
    
    return this.gpuCompute.getCurrentRenderTarget(this.positionVariable).texture;
  }

  /**
   * Obtient la texture de vélocité actuelle
   * @returns Texture de vélocité
   */
  public getVelocityTexture(): THREE.Texture | null {
    if (!this.gpuCompute) return null;
    
    return this.gpuCompute.getCurrentRenderTarget(this.velocityVariable).texture;
  }

  /**
   * Dispose les ressources
   */
  public dispose(): void {
    if (this.gpuCompute) {
      // Nettoyer les ressources du GPU
      this.gpuCompute.dispose();
    }
  }
}
