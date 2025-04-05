/**
 * Grand Est Cyclisme - Script de gestion des images manquantes
 * Ce script ajoute automatiquement un gestionnaire d'erreur à toutes les images 
 * pour remplacer les images manquantes par un placeholder.
 */
(function() {
  // Fonction de remplacement des images manquantes
  function handleMissingImage(img) {
    // Définir l'URL du placeholder selon le type d'image
    let placeholderUrl = '/images/placeholder.svg';
    
    // Utiliser des placeholders spécifiques selon le contexte
    if (img.src.includes('/weather/')) {
      placeholderUrl = '/images/weather/unknown.png';
    } else if (img.src.includes('/social/')) {
      placeholderUrl = '/images/social/unknown.svg';
    } else if (img.src.includes('/cols/')) {
      placeholderUrl = '/images/summits/placeholder.jpg';
    } else if (img.src.includes('/profiles/')) {
      placeholderUrl = '/images/profiles/avatar-placeholder.png';
    }
    
    // Logging pour le débogage
    console.warn('Image non trouvée, fallback appliqué:', img.src, '→', placeholderUrl);
    
    // Remplacer l'image
    img.src = placeholderUrl;
    
    // Ajouter une classe pour le styling CSS
    img.classList.add('fallback-image');
    
    // S'assurer que l'erreur ne se déclenche pas à nouveau avec le placeholder
    img.onerror = null;
  }
  
  // Ajouter un gestionnaire global pour les erreurs d'image
  document.addEventListener('DOMContentLoaded', function() {
    // Appliquer à toutes les images existantes
    const images = document.querySelectorAll('img');
    images.forEach(function(img) {
      img.onerror = function() {
        handleMissingImage(this);
      };
    });
    
    // Créer un observateur pour les nouvelles images ajoutées dynamiquement
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach(function(node) {
            // Vérifier si le nœud est une image
            if (node.nodeName === 'IMG') {
              node.onerror = function() {
                handleMissingImage(this);
              };
            }
            // Vérifier les images à l'intérieur des nœuds ajoutés
            else if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              images.forEach(function(img) {
                img.onerror = function() {
                  handleMissingImage(this);
                };
              });
            }
          });
        }
      });
    });
    
    // Configurer l'observateur
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
  
  // Ajouter des styles CSS pour les images de fallback
  const style = document.createElement('style');
  style.textContent = `
    .fallback-image {
      opacity: 0.8;
      background-color: #f8f9fa;
      border: 1px dashed #dee2e6;
    }
  `;
  document.head.appendChild(style);
})();
