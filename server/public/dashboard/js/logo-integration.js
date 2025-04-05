/**
 * Script d'intégration du logo Dashboard-Velo pour le tableau de bord
 * Adapté du script original de l'Agent 3
 */

(function() {
  // Configuration des chemins d'accès aux logos
  const logoConfig = {
    // Chemins des logos
    paths: {
      standard: '../images/dashboard-velo-75x75.png',
      small: '../images/icon48.png',
      large: '../images/logo_large.png',
      favicon: '../images/favicon.ico'
    },
    
    // Couleurs de la nouvelle identité visuelle
    colors: {
      primary: '#1A73E8',    // Bleu principal
      secondary: '#34A853',  // Vert
      accent: '#FA7B17',     // Orange
      light: '#F8F9FA',      // Gris clair
      dark: '#202124'        // Gris foncé
    }
  };

  /**
   * Initialise l'intégration du logo dans le tableau de bord
   */
  function initLogoIntegration() {
    // Mettre à jour les logos dans la navbar
    updateNavbarLogo();
    
    // Mettre à jour les logos dans le pied de page
    updateFooterLogo();
    
    // Appliquer les couleurs de la nouvelle identité visuelle
    applyBrandColors();
    
    // Mettre à jour le favicon
    updateFavicon();
    
    console.log('Intégration du logo Dashboard-Velo terminée');
  }

  /**
   * Met à jour le logo dans la barre de navigation
   */
  function updateNavbarLogo() {
    const navbarBrands = document.querySelectorAll('.navbar-brand');
    
    navbarBrands.forEach(brand => {
      // Vérifier si le logo existe déjà
      let logoImg = brand.querySelector('img');
      
      if (!logoImg) {
        // Créer un nouvel élément d'image si nécessaire
        logoImg = document.createElement('img');
        logoImg.alt = 'Dashboard-Velo Logo';
        logoImg.height = 30;
        logoImg.className = 'd-inline-block align-top me-2';
        
        // Insérer le logo avant le texte
        brand.insertBefore(logoImg, brand.firstChild);
      }
      
      // Mettre à jour l'attribut src
      logoImg.src = logoConfig.paths.standard;
      
      // Mettre à jour le texte si nécessaire
      if (brand.textContent.includes('Grand Est Cyclisme')) {
        brand.textContent = brand.textContent.replace('Grand Est Cyclisme', 'Dashboard-Velo');
      }
    });
  }

  /**
   * Met à jour le logo dans le pied de page
   */
  function updateFooterLogo() {
    const footers = document.querySelectorAll('footer');
    
    footers.forEach(footer => {
      const footerLogos = footer.querySelectorAll('img[alt*="logo"], img[alt*="Logo"]');
      
      if (footerLogos.length > 0) {
        // Mettre à jour les logos existants
        footerLogos.forEach(logo => {
          logo.src = logoConfig.paths.small;
          logo.alt = 'Dashboard-Velo Logo';
        });
      } else {
        // Ajouter un logo si aucun n'existe
        const footerBrands = footer.querySelectorAll('.footer-brand, .copyright');
        
        footerBrands.forEach(brand => {
          const logoImg = document.createElement('img');
          logoImg.src = logoConfig.paths.small;
          logoImg.alt = 'Dashboard-Velo Logo';
          logoImg.height = 24;
          logoImg.className = 'me-2';
          
          brand.insertBefore(logoImg, brand.firstChild);
        });
      }
      
      // Mettre à jour le texte du copyright
      const copyrightElements = footer.querySelectorAll('.copyright, .text-muted');
      
      copyrightElements.forEach(element => {
        if (element.textContent.includes('Grand Est Cyclisme')) {
          element.textContent = element.textContent.replace('Grand Est Cyclisme', 'Dashboard-Velo');
        }
      });
    });
  }

  /**
   * Applique les couleurs de la nouvelle identité visuelle
   */
  function applyBrandColors() {
    // Créer une feuille de style pour les nouvelles couleurs
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    
    // Définir les règles CSS pour les nouvelles couleurs
    styleSheet.textContent = `
      :root {
        --primary: ${logoConfig.colors.primary};
        --secondary: ${logoConfig.colors.secondary};
        --accent: ${logoConfig.colors.accent};
        --light: ${logoConfig.colors.light};
        --dark: ${logoConfig.colors.dark};
      }
      
      .bg-primary, .btn-primary {
        background-color: var(--primary) !important;
        border-color: var(--primary) !important;
      }
      
      .bg-secondary, .btn-secondary {
        background-color: var(--secondary) !important;
        border-color: var(--secondary) !important;
      }
      
      .bg-accent, .btn-accent {
        background-color: var(--accent) !important;
        border-color: var(--accent) !important;
      }
      
      .text-primary {
        color: var(--primary) !important;
      }
      
      .text-secondary {
        color: var(--secondary) !important;
      }
      
      .text-accent {
        color: var(--accent) !important;
      }
      
      .border-primary {
        border-color: var(--primary) !important;
      }
      
      .progress-bar {
        background-color: var(--primary);
      }
      
      .nav-pills .nav-link.active {
        background-color: var(--primary);
      }
      
      .page-item.active .page-link {
        background-color: var(--primary);
        border-color: var(--primary);
      }
      
      a {
        color: var(--primary);
      }
      
      a:hover {
        color: var(--secondary);
      }
      
      /* Styles spécifiques aux graphiques */
      .chart-primary {
        border-color: var(--primary);
        background-color: rgba(26, 115, 232, 0.1);
      }
      
      .chart-secondary {
        border-color: var(--secondary);
        background-color: rgba(52, 168, 83, 0.1);
      }
      
      .chart-accent {
        border-color: var(--accent);
        background-color: rgba(250, 123, 23, 0.1);
      }
    `;
    
    // Ajouter la feuille de style au document
    document.head.appendChild(styleSheet);
    
    // Mettre à jour les couleurs des graphiques existants
    updateChartColors();
  }

  /**
   * Met à jour les couleurs des graphiques existants
   */
  function updateChartColors() {
    if (window.Chart) {
      // Définir les nouvelles couleurs par défaut pour Chart.js
      const newColors = [
        logoConfig.colors.primary,
        logoConfig.colors.secondary,
        logoConfig.colors.accent,
        '#4285F4', // Bleu Google
        '#FBBC05', // Jaune Google
        '#EA4335', // Rouge Google
        '#5F6368'  // Gris Google
      ];
      
      // Mettre à jour les couleurs par défaut de Chart.js
      Chart.defaults.color = logoConfig.colors.dark;
      
      // Mettre à jour les graphiques existants
      if (Chart.instances) {
        Object.values(Chart.instances).forEach((chart, index) => {
          if (chart.config && chart.config.data && chart.config.data.datasets) {
            chart.config.data.datasets.forEach((dataset, i) => {
              // Appliquer les nouvelles couleurs
              if (dataset.backgroundColor && Array.isArray(dataset.backgroundColor)) {
                dataset.backgroundColor = newColors;
              } else if (dataset.backgroundColor) {
                dataset.backgroundColor = newColors[i % newColors.length];
              }
              
              if (dataset.borderColor && !Array.isArray(dataset.borderColor)) {
                dataset.borderColor = newColors[i % newColors.length];
              }
            });
            
            // Mettre à jour le graphique
            chart.update();
          }
        });
      }
    }
  }

  /**
   * Met à jour le favicon
   */
  function updateFavicon() {
    // Rechercher les liens de favicon existants
    const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
    
    if (faviconLinks.length > 0) {
      // Mettre à jour les liens existants
      faviconLinks.forEach(link => {
        if (link.href.includes('favicon.ico')) {
          link.href = logoConfig.paths.favicon;
        } else if (link.sizes) {
          if (link.sizes.value === '16x16') {
            link.href = '../images/icon16.png';
          } else if (link.sizes.value === '32x32') {
            link.href = '../images/icon48.png';
          } else if (link.sizes.value === '192x192' || link.sizes.value === '180x180') {
            link.href = '../images/icons/icon-192.png';
          }
        }
      });
    } else {
      // Créer de nouveaux liens de favicon
      const favicons = [
        { rel: 'icon', href: logoConfig.paths.favicon },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '../images/icon16.png' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '../images/icon48.png' },
        { rel: 'apple-touch-icon', href: '../images/icons/icon-192.png' }
      ];
      
      favicons.forEach(favicon => {
        const link = document.createElement('link');
        link.rel = favicon.rel;
        link.href = favicon.href;
        
        if (favicon.type) {
          link.type = favicon.type;
        }
        
        if (favicon.sizes) {
          link.sizes = favicon.sizes;
        }
        
        document.head.appendChild(link);
      });
    }
  }

  // Exécuter l'initialisation lorsque le DOM est chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogoIntegration);
  } else {
    initLogoIntegration();
  }
})();
