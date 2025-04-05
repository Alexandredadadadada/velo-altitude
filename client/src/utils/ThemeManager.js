/**
 * Gestionnaire de thème pour l'application Grand Est Cyclisme
 * Gère le mode sombre et les préférences utilisateur
 */

class ThemeManager {
  constructor() {
    this.darkModeKey = 'gec_dark_mode';
    this.darkModeClass = 'dark-mode';
    this.listeners = [];
    this.isInitialized = false;
    
    // Registre des composants personnalisés
    this.componentRegistry = new Map();
    this.componentUpdateQueue = [];
    this.isUpdating = false;
  }

  /**
   * Initialise le gestionnaire de thème
   * Détecte les préférences système et stockées
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Vérifie si une préférence est déjà stockée
    const storedPreference = localStorage.getItem(this.darkModeKey);
    
    if (storedPreference !== null) {
      // Applique la préférence stockée
      this.setDarkMode(storedPreference === 'true');
    } else {
      // Sinon, utilise la préférence système
      this.setDarkModeBasedOnSystemPreference();
    }
    
    // Écoute les changements de préférence système
    this.setupSystemPreferenceListener();
    
    this.isInitialized = true;
  }

  /**
   * Active ou désactive le mode sombre
   * @param {boolean} enabled - Si le mode sombre doit être activé
   * @param {boolean} savePreference - Si la préférence doit être sauvegardée
   */
  setDarkMode(enabled, savePreference = true) {
    if (enabled) {
      document.body.classList.add(this.darkModeClass);
    } else {
      document.body.classList.remove(this.darkModeClass);
    }
    
    // Met à jour l'attribut de thème pour les styles ciblés
    document.documentElement.setAttribute('data-theme', enabled ? 'dark' : 'light');
    
    // Enregistre la préférence si demandé
    if (savePreference) {
      localStorage.setItem(this.darkModeKey, enabled.toString());
    }
    
    // Notifie les abonnés du changement
    this.notifyListeners(enabled);
    
    // Met à jour les métadonnées pour les navigateurs
    this.updateMetaTags(enabled);
    
    // Met à jour les composants enregistrés
    this.updateRegisteredComponents(enabled);
  }

  /**
   * Bascule le mode sombre
   * @returns {boolean} - Le nouvel état du mode sombre
   */
  toggleDarkMode() {
    const isDarkMode = document.body.classList.contains(this.darkModeClass);
    this.setDarkMode(!isDarkMode);
    return !isDarkMode;
  }

  /**
   * Vérifie si le mode sombre est actif
   * @returns {boolean} - Si le mode sombre est actif
   */
  isDarkModeEnabled() {
    return document.body.classList.contains(this.darkModeClass);
  }

  /**
   * Définit le thème en fonction des préférences système
   */
  setDarkModeBasedOnSystemPreference() {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.setDarkMode(prefersDarkMode, false);
  }

  /**
   * Configure l'écoute des changements de préférence système
   */
  setupSystemPreferenceListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Utilise l'API moderne si disponible
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', (e) => {
        // Ne modifie pas si l'utilisateur a explicitement choisi une préférence
        if (!localStorage.getItem(this.darkModeKey)) {
          this.setDarkMode(e.matches, false);
        }
      });
    } else if (mediaQuery.addListener) {
      // Fallback pour les anciens navigateurs
      mediaQuery.addListener((e) => {
        if (!localStorage.getItem(this.darkModeKey)) {
          this.setDarkMode(e.matches, false);
        }
      });
    }
  }

  /**
   * Ajoute un écouteur pour les changements de thème
   * @param {Function} listener - Fonction à appeler lors des changements
   */
  addThemeListener(listener) {
    if (typeof listener === 'function' && !this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }

  /**
   * Supprime un écouteur
   * @param {Function} listener - Fonction à retirer
   */
  removeThemeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notifie tous les écouteurs d'un changement de thème
   * @param {boolean} isDarkMode - Si le mode sombre est activé
   */
  notifyListeners(isDarkMode) {
    this.listeners.forEach(listener => {
      try {
        listener(isDarkMode);
      } catch (error) {
        console.error('Erreur dans un écouteur de thème:', error);
      }
    });
  }

  /**
   * Met à jour les balises meta pour les navigateurs
   * @param {boolean} isDarkMode - Si le mode sombre est activé
   */
  updateMetaTags(isDarkMode) {
    // Meta tag pour la barre de statut sur mobile
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    // Couleurs conformes au design system
    metaThemeColor.content = isDarkMode ? '#1f2937' : '#ffffff';
  }

  /**
   * Réinitialise les préférences stockées
   */
  resetPreferences() {
    localStorage.removeItem(this.darkModeKey);
    this.setDarkModeBasedOnSystemPreference();
  }

  /**
   * Configure le toggle de mode sombre dans l'interface
   * @param {string} toggleId - ID de l'élément toggle dans le DOM
   */
  setupToggle(toggleId) {
    const toggle = document.getElementById(toggleId);
    if (!toggle) return;
    
    // Met à jour l'état initial du toggle
    toggle.checked = this.isDarkModeEnabled();
    
    // Ajoute l'écouteur d'événement
    toggle.addEventListener('change', (e) => {
      this.setDarkMode(e.target.checked);
    });
    
    // Met à jour le toggle lors des changements de thème
    this.addThemeListener((isDarkMode) => {
      toggle.checked = isDarkMode;
    });
  }
  
  /**
   * ------------ API POUR COMPOSANTS PERSONNALISÉS ------------
   */
  
  /**
   * Enregistre un composant React ou un élément DOM pour les mises à jour de thème
   * @param {string} id - Identifiant unique du composant
   * @param {Object} component - Référence au composant ou élément
   * @param {Object} options - Options de configuration
   * @returns {Function} - Fonction pour désenregistrer le composant
   */
  registerComponent(id, component, options = {}) {
    if (!id || !component) {
      console.error('ID et composant requis pour l\'enregistrement');
      return () => {};
    }
    
    // Configuration par défaut
    const config = {
      updateMethod: 'auto',   // 'auto', 'callback', 'class', 'style', 'attr'
      darkClass: 'dark-mode', // Classe à ajouter en mode sombre
      lightClass: 'light-mode', // Classe à ajouter en mode clair
      callback: null,         // Fonction de rappel personnalisée
      styleProps: {},         // Propriétés CSS à modifier
      attributes: {},         // Attributs à modifier
      priority: 'normal',     // 'high', 'normal', 'low'
      ...options
    };
    
    // Déterminer la méthode d'update si auto
    if (config.updateMethod === 'auto') {
      if (typeof component.forceUpdate === 'function') {
        // Composant React avec forceUpdate
        config.updateMethod = 'react';
      } else if (config.callback && typeof config.callback === 'function') {
        // Callback personnalisé
        config.updateMethod = 'callback';
      } else if (component.classList) {
        // Élément DOM avec classList
        config.updateMethod = 'class';
      } else if (component.style) {
        // Élément avec style
        config.updateMethod = 'style';
      } else {
        // Fallback sur callback vide
        config.updateMethod = 'none';
      }
    }
    
    // Stocker la configuration
    this.componentRegistry.set(id, {
      component,
      config,
      lastUpdated: Date.now()
    });
    
    // Appliquer l'état actuel immédiatement
    const isDarkMode = this.isDarkModeEnabled();
    this._updateComponent(id, isDarkMode);
    
    // Retourner la fonction de nettoyage
    return () => this.unregisterComponent(id);
  }
  
  /**
   * Désenregistre un composant
   * @param {string} id - ID du composant à désenregistrer
   */
  unregisterComponent(id) {
    if (this.componentRegistry.has(id)) {
      this.componentRegistry.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Met à jour un composant spécifique avec l'état du thème
   * @param {string} id - ID du composant
   * @param {boolean} isDarkMode - Si le mode sombre est actif
   * @private
   */
  _updateComponent(id, isDarkMode) {
    const entry = this.componentRegistry.get(id);
    if (!entry) return;
    
    const { component, config } = entry;
    
    try {
      switch (config.updateMethod) {
        case 'react':
          // Forcer la mise à jour du composant React
          if (component.forceUpdate) {
            component.forceUpdate();
          }
          break;
          
        case 'callback':
          // Appeler la fonction de callback personnalisée
          if (config.callback && typeof config.callback === 'function') {
            config.callback(isDarkMode, component);
          }
          break;
          
        case 'class':
          // Mettre à jour les classes CSS
          if (component.classList) {
            if (isDarkMode) {
              component.classList.add(config.darkClass);
              component.classList.remove(config.lightClass);
            } else {
              component.classList.remove(config.darkClass);
              component.classList.add(config.lightClass);
            }
          }
          break;
          
        case 'style':
          // Mettre à jour les styles
          if (component.style && config.styleProps) {
            const styles = isDarkMode ? config.styleProps.dark : config.styleProps.light;
            if (styles) {
              Object.entries(styles).forEach(([prop, value]) => {
                component.style[prop] = value;
              });
            }
          }
          break;
          
        case 'attr':
          // Mettre à jour les attributs
          if (component.setAttribute && config.attributes) {
            const attrs = isDarkMode ? config.attributes.dark : config.attributes.light;
            if (attrs) {
              Object.entries(attrs).forEach(([attr, value]) => {
                component.setAttribute(attr, value);
              });
            }
          }
          break;
      }
      
      // Marquer comme mis à jour
      entry.lastUpdated = Date.now();
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du composant ${id}:`, error);
    }
  }
  
  /**
   * Met à jour tous les composants enregistrés
   * @param {boolean} isDarkMode - État du mode sombre
   */
  updateRegisteredComponents(isDarkMode) {
    // Si déjà en cours de mise à jour, ajouter à la queue
    if (this.isUpdating) {
      this.componentUpdateQueue.push(isDarkMode);
      return;
    }
    
    this.isUpdating = true;
    
    // Collecter les composants par priorité
    const highPriority = [];
    const normalPriority = [];
    const lowPriority = [];
    
    this.componentRegistry.forEach((entry, id) => {
      switch(entry.config.priority) {
        case 'high': highPriority.push(id); break;
        case 'low': lowPriority.push(id); break;
        default: normalPriority.push(id);
      }
    });
    
    // Mettre à jour par priorité, avec un léger délai entre chaque groupe
    Promise.resolve()
      .then(() => {
        // Mettre à jour les composants haute priorité immédiatement
        highPriority.forEach(id => this._updateComponent(id, isDarkMode));
        return new Promise(resolve => setTimeout(resolve, 0));
      })
      .then(() => {
        // Mettre à jour les composants priorité normale
        normalPriority.forEach(id => this._updateComponent(id, isDarkMode));
        return new Promise(resolve => setTimeout(resolve, 0));
      })
      .then(() => {
        // Mettre à jour les composants basse priorité
        lowPriority.forEach(id => this._updateComponent(id, isDarkMode));
      })
      .finally(() => {
        // Processus terminé
        this.isUpdating = false;
        
        // S'il y a des mises à jour en attente, traiter la dernière
        if (this.componentUpdateQueue.length > 0) {
          const latestUpdate = this.componentUpdateQueue.pop();
          this.componentUpdateQueue = []; // Effacer la queue
          this.updateRegisteredComponents(latestUpdate);
        }
      });
  }
  
  /**
   * Met à jour un composant spécifique avec l'état actuel du thème
   * @param {string} id - ID du composant à mettre à jour
   */
  refreshComponent(id) {
    if (this.componentRegistry.has(id)) {
      this._updateComponent(id, this.isDarkModeEnabled());
      return true;
    }
    return false;
  }
  
  /**
   * Obtient la liste des composants enregistrés
   * @returns {Array} Liste des composants enregistrés avec leur configuration
   */
  getRegisteredComponents() {
    const result = [];
    this.componentRegistry.forEach((entry, id) => {
      result.push({
        id,
        updateMethod: entry.config.updateMethod,
        priority: entry.config.priority,
        lastUpdated: entry.lastUpdated
      });
    });
    return result;
  }
  
  /**
   * Hook utilitaire pour React
   * @param {Object} component - Référence au composant React (this)
   * @param {Object} options - Options de configuration
   * @returns {boolean} État actuel du mode sombre
   */
  useTheme(component, options = {}) {
    const id = options.id || `comp_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    this.registerComponent(id, component, options);
    
    // Configurer le nettoyage automatique lors du démontage (si componentWillUnmount est disponible)
    if (component.componentWillUnmount) {
      const originalUnmount = component.componentWillUnmount;
      component.componentWillUnmount = function() {
        this.unregisterComponent(id);
        originalUnmount.call(component);
      }.bind(this);
    }
    
    return this.isDarkModeEnabled();
  }
}

// Export d'une instance unique
const themeManager = new ThemeManager();
export default themeManager;
