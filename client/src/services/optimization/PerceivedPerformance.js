/**
 * Service d'optimisation de la performance perçue pour Velo-Altitude
 * Améliore la perception utilisateur des temps de chargement
 */

class PerceivedPerformance {
  constructor() {
    this.isInitialized = false;
    this.layoutShiftsCount = 0;
    this.progressSteps = {
      initialDOMReady: false,
      criticalResourcesLoaded: false,
      authStateResolved: false,
      initialDataLoaded: false,
      renderComplete: false
    };
    
    // Suivi des étapes de chargement avec horodatage
    this.timings = {};
    this.startTime = performance.now();
    
    // Configuration
    this.config = {
      minProgressBarDuration: 1000, // ms
      renderingThrottle: 200,       // ms
      skeletonMinDisplay: 500,      // ms
      layoutShiftThreshold: 5       // nombre de shifts avant considérer un problème
    };
    
    // Observer pour détecter les changements de layout
    this._setupLayoutObserver();
  }

  /**
   * Configure l'observer pour les changements de layout
   * @private
   */
  _setupLayoutObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const layoutShiftObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            // Ne compter les shifts que s'ils ne sont pas causés par une interaction utilisateur
            if (!entry.hadRecentInput) {
              this.layoutShiftsCount++;
              
              // Si beaucoup trop de shifts, prendre des mesures
              if (this.layoutShiftsCount > this.config.layoutShiftThreshold) {
                this._mitigateLayoutShifts();
              }
            }
          }
        });
        
        layoutShiftObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('[PerceivedPerformance] Layout Shift observer not supported', e);
      }
    }
  }

  /**
   * Réduit les changements de layout en appliquant des réservations d'espace
   * @private
   */
  _mitigateLayoutShifts() {
    // Cette fonction n'est appelée qu'une seule fois, quand trop de layout shifts sont détectés
    if (this._mitigationApplied) return;
    this._mitigationApplied = true;
    
    console.warn('[PerceivedPerformance] Excessive layout shifts detected, applying mitigation');
    
    // Appliquer les corrections spécifiques pour les composants problématiques
    const fixLayoutShifts = () => {
      // 1. Ajouter des dimensions minimums aux conteneurs d'images
      document.querySelectorAll('.img-container, .avatar-container, .col-image, .profile-image')
        .forEach(container => {
          if (!container.style.minHeight) {
            const rect = container.getBoundingClientRect();
            if (rect.height < 20) {
              // Aucune taille définie, probablement un conteneur qui cause des shifts
              container.style.minHeight = '150px';
            }
          }
        });
      
      // 2. Réserver de l'espace pour les polices personnalisées
      const style = document.createElement('style');
      style.textContent = `
        body {
          font-display: swap; /* Utiliser la police système jusqu'au chargement complet */
        }
        
        /* Réserver de l'espace pour les éléments dynamiques courants */
        .navigation-placeholder {
          min-height: 60px;
        }
        
        .banner-placeholder {
          min-height: 200px;
        }
        
        .card-placeholder {
          min-height: 320px;
        }
        
        /* Transition douce pour les changements de taille */
        .col-card, .challenge-card, .activity-card {
          transition: height 0.2s ease-out;
        }
      `;
      
      document.head.appendChild(style);
      
      // 3. Éviter les shifts lors du chargement des webfonts
      if ('fonts' in document) {
        document.fonts.ready.then(() => {
          document.documentElement.classList.add('fonts-loaded');
          this.markStep('fontsLoaded');
        });
      }
    };
    
    // Exécuter immédiatement si DOM est chargé, sinon attendre
    if (document.readyState !== 'loading') {
      fixLayoutShifts();
    } else {
      document.addEventListener('DOMContentLoaded', fixLayoutShifts);
    }
  }

  /**
   * Initialise le service
   * @public
   */
  initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    // Enregistrer le temps de démarrage
    this.markStep('initialize');
    
    // Surveiller le chargement initial
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.markStep('DOMContentLoaded');
        this.progressSteps.initialDOMReady = true;
        this._updateProgress();
      });
    } else {
      this.markStep('DOMContentLoaded');
      this.progressSteps.initialDOMReady = true;
    }
    
    // Surveiller le chargement complet
    window.addEventListener('load', () => {
      this.markStep('windowLoad');
      this.progressSteps.criticalResourcesLoaded = true;
      this._updateProgress();
      
      // Détecter les images non chargées qui pourraient causer des shifts
      this._ensureImagesStability();
    });
    
    // Initialiser la barre de progression
    this._initializeProgressBar();
    
    return this;
  }

  /**
   * Marque une étape de chargement comme terminée
   * @param {string} stepName - Nom de l'étape
   * @public
   */
  markStep(stepName) {
    const timing = performance.now() - this.startTime;
    this.timings[stepName] = timing;
    
    console.log(`[PerceivedPerformance] Step "${stepName}" completed at ${Math.round(timing)}ms`);
    
    // Mettre à jour les progressSteps si c'est une étape reconnue
    if (this.progressSteps.hasOwnProperty(stepName)) {
      this.progressSteps[stepName] = true;
      this._updateProgress();
    }
    
    return timing;
  }

  /**
   * Initialise la barre de progression visuelle
   * @private
   */
  _initializeProgressBar() {
    // Créer l'élément de barre de progression s'il n'existe pas déjà
    if (!document.getElementById('va-progress-bar')) {
      const progressBar = document.createElement('div');
      progressBar.id = 'va-progress-bar';
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        width: 0%;
        background: linear-gradient(to right, #0466C8, #00A896);
        transition: width 0.2s ease-out;
        z-index: 9999;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      `;
      
      document.body.appendChild(progressBar);
      
      // Démarrer à 10% immédiatement
      setTimeout(() => this.updateProgressBar(10), 10);
    }
  }

  /**
   * Met à jour la barre de progression visuelle
   * @param {number} percentage - Pourcentage de progression (0-100)
   * @public
   */
  updateProgressBar(percentage) {
    const progressBar = document.getElementById('va-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
      
      // Masquer la barre quand on atteint 100%
      if (percentage >= 100) {
        setTimeout(() => {
          progressBar.style.opacity = '0';
          setTimeout(() => {
            if (progressBar.parentNode) {
              progressBar.parentNode.removeChild(progressBar);
            }
          }, 500); // Attendre la fin de la transition d'opacité
        }, 200);
      }
    }
  }

  /**
   * Met à jour la progression globale en fonction des étapes terminées
   * @private
   */
  _updateProgress() {
    // Calculer le pourcentage de progression
    const steps = Object.values(this.progressSteps);
    const completedSteps = steps.filter(Boolean).length;
    const totalSteps = steps.length;
    
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    // Éviter les progressions trop rapides pour une meilleure UX
    let displayedPercentage = percentage;
    
    // Au moins 70% quand DOM est chargé
    if (this.progressSteps.initialDOMReady) {
      displayedPercentage = Math.max(displayedPercentage, 70);
    }
    
    // Au moins 90% quand les ressources critiques sont chargées
    if (this.progressSteps.criticalResourcesLoaded) {
      displayedPercentage = Math.max(displayedPercentage, 90);
    }
    
    this.updateProgressBar(displayedPercentage);
    
    // Terminer la progression si toutes les étapes sont complétées
    if (completedSteps === totalSteps) {
      this.updateProgressBar(100);
    }
  }

  /**
   * Assure la stabilité des dimensions des images
   * @private
   */
  _ensureImagesStability() {
    const images = document.querySelectorAll('img:not([width]):not([height])');
    
    if (images.length > 0) {
      console.warn(`[PerceivedPerformance] Found ${images.length} images without dimensions, applying fixes`);
      
      images.forEach(img => {
        // Si l'image est déjà chargée
        if (img.complete) {
          if (img.naturalWidth > 0) {
            img.setAttribute('width', img.naturalWidth);
            img.setAttribute('height', img.naturalHeight);
          }
        } else {
          // Écouter le chargement
          img.addEventListener('load', function() {
            if (this.naturalWidth > 0) {
              this.setAttribute('width', this.naturalWidth);
              this.setAttribute('height', this.naturalHeight);
            }
          });
        }
        
        // Ajouter une classe de style
        img.classList.add('dimension-stabilized');
        
        // Ajouter un style pour éviter les CLS
        const parent = img.parentElement;
        if (parent) {
          // N'appliquer que si le parent n'a pas déjà un style défini
          if (!parent.style.minHeight && !parent.style.height) {
            if (img.hasAttribute('data-height')) {
              parent.style.minHeight = `${img.getAttribute('data-height')}px`;
            } else {
              // Valeur par défaut selon le contexte
              const rect = img.getBoundingClientRect();
              if (rect.width > 0) {
                parent.style.aspectRatio = `${rect.width} / ${rect.height || 1}`;
              } else if (img.classList.contains('avatar')) {
                parent.style.minHeight = '40px';
              } else if (img.classList.contains('thumbnail')) {
                parent.style.minHeight = '80px';
              } else if (img.classList.contains('banner')) {
                parent.style.minHeight = '200px';
              } else {
                parent.style.minHeight = '100px';
              }
            }
          }
        }
      });
    }
  }
  
  /**
   * Précharge les ressources critiques pour une route
   * @param {string} routePath - Chemin de la route actuelle
   * @public
   */
  preloadCriticalResources(routePath) {
    // Liste de ressources critiques par route
    const criticalRouteResources = {
      '/': [
        '/static/media/hero-background.jpg',
        '/static/media/dashboard-icons.svg',
      ],
      '/cols': [
        '/static/media/cols-header.jpg',
        '/static/js/mapbox.chunk.js'
      ],
      '/profile': [
        '/static/media/profile-background.jpg',
        '/static/js/charts.chunk.js'
      ],
      '/challenges': [
        '/static/media/challenge-background.jpg',
        '/static/js/challenges.chunk.js'
      ]
    };
    
    // Trouver les ressources correspondantes à la route actuelle
    let resourcesToPreload = [];
    
    // Recherche exacte
    if (criticalRouteResources[routePath]) {
      resourcesToPreload = criticalRouteResources[routePath];
    } else {
      // Recherche de route partielle (préfixe)
      for (const route of Object.keys(criticalRouteResources)) {
        if (routePath.startsWith(route) && route !== '/') {
          resourcesToPreload = criticalRouteResources[route];
          break;
        }
      }
      
      // Si toujours pas trouvé, utiliser la route par défaut
      if (resourcesToPreload.length === 0) {
        resourcesToPreload = criticalRouteResources['/'] || [];
      }
    }
    
    // Précharger les ressources
    resourcesToPreload.forEach(resource => {
      const linkEl = document.createElement('link');
      linkEl.rel = 'preload';
      linkEl.href = resource;
      
      if (resource.endsWith('.js')) {
        linkEl.as = 'script';
      } else if (resource.endsWith('.css')) {
        linkEl.as = 'style';
      } else if (/\.(jpe?g|png|gif|svg|webp)$/.test(resource)) {
        linkEl.as = 'image';
      } else if (/\.(woff2?|ttf|otf|eot)$/.test(resource)) {
        linkEl.as = 'font';
        linkEl.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(linkEl);
    });
    
    return resourcesToPreload;
  }

  /**
   * Gère l'affichage des squelettes de chargement
   * @param {boolean} show - Afficher ou masquer les squelettes
   * @param {string} containerId - ID du conteneur (optionnel)
   * @public
   */
  handleSkeletons(show, containerId = null) {
    const minDisplayTime = this.config.skeletonMinDisplay;
    const selector = containerId 
      ? `#${containerId} .skeleton-loader` 
      : '.skeleton-loader';
    
    const skeletons = document.querySelectorAll(selector);
    
    if (show) {
      // Afficher les squelettes
      skeletons.forEach(skeleton => {
        skeleton.classList.add('visible');
        skeleton.dataset.loadStartTime = Date.now().toString();
      });
    } else {
      // Masquer les squelettes, mais pas avant une durée minimale
      skeletons.forEach(skeleton => {
        const startTime = parseInt(skeleton.dataset.loadStartTime || '0');
        const elapsedTime = Date.now() - startTime;
        
        if (elapsedTime >= minDisplayTime) {
          skeleton.classList.remove('visible');
          skeleton.classList.add('loaded');
        } else {
          // Attendre la différence de temps
          const remainingTime = minDisplayTime - elapsedTime;
          setTimeout(() => {
            skeleton.classList.remove('visible');
            skeleton.classList.add('loaded');
          }, remainingTime);
        }
      });
    }
  }
  
  /**
   * Obtient les statistiques de performance et de perception
   * @returns {object} Statistiques de performance
   * @public
   */
  getPerformanceStats() {
    return {
      timings: this.timings,
      layoutShifts: this.layoutShiftsCount,
      progressSteps: this.progressSteps,
      stepsDuration: {
        toFirstInteraction: this.timings.authStateResolved || null,
        toRenderComplete: this.timings.renderComplete || null,
        total: performance.now() - this.startTime
      }
    };
  }
}

// Exporter une instance singleton
const perceivedPerformance = new PerceivedPerformance();
export default perceivedPerformance;
