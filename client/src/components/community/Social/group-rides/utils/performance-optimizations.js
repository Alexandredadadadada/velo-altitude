/**
 * performance-optimizations.js
 * Utilitaires pour optimiser les performances du module de sorties de groupe
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook personnalisé pour la pagination des sorties
 * @param {Array} items - Liste complète des éléments
 * @param {number} itemsPerPage - Nombre d'éléments par page
 * @returns {Object} - Fonctions et états pour gérer la pagination
 */
export const usePagination = (items = [], itemsPerPage = 12) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedItems, setPaginatedItems] = useState([]);
  const totalPages = useMemo(() => Math.ceil(items.length / itemsPerPage), [items, itemsPerPage]);

  // Mise à jour des éléments paginés lorsque les items ou la page changent
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedItems(items.slice(startIndex, endIndex));
  }, [items, currentPage, itemsPerPage]);

  // Reset à la page 1 si le nombre total d'items change significativement
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Fonctions de navigation de pages
  const goToNextPage = useCallback(() => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  }, []);

  const goToPage = useCallback((page) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  }, [totalPages]);

  return {
    currentPage,
    paginatedItems,
    totalPages,
    goToNextPage,
    goToPreviousPage,
    goToPage
  };
};

/**
 * Hook personnalisé pour la virtualisation des listes
 * Optimise le rendu des longues listes en n'affichant que les éléments visibles
 * @param {Object} options - Options de configuration
 * @returns {Object} - Fonctions et états pour la virtualisation
 */
export const useVirtualization = ({ 
  itemCount = 0, 
  itemHeight = 100, 
  overscan = 5, 
  viewportHeight = 600 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculer les indices des éléments visibles
  const { startIndex, endIndex, visibleItemCount } = useMemo(() => {
    const visibleItemCount = Math.ceil(viewportHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(itemCount - 1, Math.floor(scrollTop / itemHeight) + visibleItemCount + overscan);
    
    return { startIndex, endIndex, visibleItemCount };
  }, [scrollTop, itemHeight, viewportHeight, itemCount, overscan]);
  
  // Fonction pour gérer le défilement
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target;
    setScrollTop(scrollTop);
  }, []);
  
  // Calculer les styles pour le conteneur virtuel
  const containerStyle = useMemo(() => ({
    height: `${viewportHeight}px`,
    overflow: 'auto',
    position: 'relative'
  }), [viewportHeight]);
  
  // Calculer la hauteur totale pour permettre le défilement
  const totalHeight = itemCount * itemHeight;
  
  // Calculer les styles pour le contenu interne
  const innerStyle = useMemo(() => ({
    height: `${totalHeight}px`,
    position: 'relative'
  }), [totalHeight]);
  
  // Calculer les éléments à rendre et leurs positions
  const items = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < itemCount) {
        items.push({
          index: i,
          style: {
            position: 'absolute',
            top: `${i * itemHeight}px`,
            width: '100%',
            height: `${itemHeight}px`
          }
        });
      }
    }
    return items;
  }, [startIndex, endIndex, itemCount, itemHeight]);
  
  return {
    containerStyle,
    innerStyle,
    items,
    handleScroll,
    startIndex,
    endIndex,
    visibleItemCount
  };
};

/**
 * Hook personnalisé pour le chargement paresseux des images
 * @returns {Function} - Fonction pour appliquer aux éléments img
 */
export const useLazyLoading = () => {
  // Configuration de l'observateur d'intersection
  const [observer, setObserver] = useState(null);
  
  useEffect(() => {
    // Créer un observateur d'intersection si pris en charge par le navigateur
    if ('IntersectionObserver' in window) {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target;
            const src = lazyImage.getAttribute('data-src');
            
            if (src) {
              lazyImage.src = src;
              lazyImage.removeAttribute('data-src');
              intersectionObserver.unobserve(lazyImage);
            }
          }
        });
      }, {
        rootMargin: '200px 0px' // Précharger les images avant qu'elles n'entrent dans la viewport
      });
      
      setObserver(intersectionObserver);
    }
    
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);
  
  // Référence à appliquer aux images
  const imgRef = useCallback(node => {
    if (node && observer) {
      observer.observe(node);
    }
  }, [observer]);
  
  return imgRef;
};

/**
 * Hook pour la gestion optimisée du chat
 * Implémente la pagination et le chargement par lots des messages
 */
export const useChatOptimization = (messages = [], messagesPerBatch = 20) => {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  
  // Initialisation avec les messages les plus récents
  useEffect(() => {
    if (messages.length > 0) {
      const initialMessages = messages.slice(-messagesPerBatch);
      setVisibleMessages(initialMessages);
      setHasMore(messages.length > messagesPerBatch);
    } else {
      setVisibleMessages([]);
      setHasMore(false);
    }
  }, [messages, messagesPerBatch]);
  
  // Charger plus de messages (vers le passé)
  const loadMoreMessages = useCallback(() => {
    if (hasMore) {
      const currentCount = visibleMessages.length;
      const nextBatch = messages.slice(
        Math.max(0, messages.length - currentCount - messagesPerBatch), 
        messages.length - currentCount
      );
      
      if (nextBatch.length > 0) {
        setVisibleMessages(prevMessages => [...nextBatch, ...prevMessages]);
        setHasMore(messages.length > (currentCount + nextBatch.length));
      } else {
        setHasMore(false);
      }
    }
  }, [hasMore, messages, visibleMessages, messagesPerBatch]);
  
  // Ajouter de nouveaux messages (vers le présent)
  const addNewMessages = useCallback((newMessages) => {
    setVisibleMessages(prevMessages => [...prevMessages, ...newMessages]);
  }, []);
  
  return {
    visibleMessages,
    hasMore,
    loadMoreMessages,
    addNewMessages
  };
};

/**
 * Hook pour la mise en cache des résultats de recherche d'itinéraires
 */
export const useRouteSearchCache = () => {
  const [cache, setCache] = useState({});
  
  // Obtenir des résultats depuis le cache ou effectuer une nouvelle recherche
  const getRoutes = useCallback(async (searchParams, fetchFunction) => {
    const cacheKey = JSON.stringify(searchParams);
    
    // Si résultats en cache et non expirés, les utiliser
    if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < 5 * 60 * 1000)) {
      return cache[cacheKey].data;
    }
    
    // Sinon, effectuer une nouvelle recherche
    try {
      const results = await fetchFunction(searchParams);
      
      // Mettre en cache les résultats
      setCache(prevCache => ({
        ...prevCache,
        [cacheKey]: {
          data: results,
          timestamp: Date.now()
        }
      }));
      
      return results;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'itinéraires:', error);
      throw error;
    }
  }, [cache]);
  
  // Invalider le cache (par exemple après une modification d'itinéraire)
  const invalidateCache = useCallback(() => {
    setCache({});
  }, []);
  
  return {
    getRoutes,
    invalidateCache
  };
};

/**
 * Hook pour optimiser les performances de rendu des cartes
 */
export const useMapOptimization = () => {
  const [deferredRoutes, setDeferredRoutes] = useState([]);
  
  // Ajouter progressivement les itinéraires à la carte pour éviter le blocage du thread principal
  const loadRoutesProgressively = useCallback((routes, callback) => {
    if (!routes || routes.length === 0) {
      return;
    }
    
    // Nombre d'itinéraires à ajouter par lot
    const BATCH_SIZE = 3;
    let currentIndex = 0;
    
    const addNextBatch = () => {
      const endIndex = Math.min(currentIndex + BATCH_SIZE, routes.length);
      const currentBatch = routes.slice(currentIndex, endIndex);
      
      setDeferredRoutes(prev => [...prev, ...currentBatch]);
      
      currentIndex = endIndex;
      
      if (currentIndex < routes.length) {
        // Planifier le prochain lot
        setTimeout(addNextBatch, 100);
      } else if (callback) {
        // Tous les itinéraires sont chargés
        callback();
      }
    };
    
    // Démarrer le processus
    addNextBatch();
  }, []);
  
  // Réinitialiser les itinéraires
  const resetRoutes = useCallback(() => {
    setDeferredRoutes([]);
  }, []);
  
  return {
    deferredRoutes,
    loadRoutesProgressively,
    resetRoutes
  };
};

/**
 * Optimisation du rendu des composants
 * Utilitaire pour éviter les re-renders inutiles avec React.memo
 */
export const optimizeMemoization = {
  // Fonction de comparaison profonde pour React.memo
  deepCompare: (prevProps, nextProps) => {
    for (const key in prevProps) {
      if (prevProps[key] !== nextProps[key]) {
        if (typeof prevProps[key] === 'object' && typeof nextProps[key] === 'object') {
          if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    for (const key in nextProps) {
      if (!(key in prevProps)) {
        return false;
      }
    }
    
    return true;
  },
  
  // Fonction de comparaison pour ignorer certaines props
  ignoreProps: (ignoredProps = []) => (prevProps, nextProps) => {
    const relevantProps = Object.keys(prevProps).filter(key => !ignoredProps.includes(key));
    
    for (const key of relevantProps) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }
    
    return true;
  }
};

/**
 * Applique des optimisations critiques aux composants de sorties de groupe
 * @param {Array} originalArray - Tableau original à optimiser
 * @returns {Array} - Tableau optimisé avec des métadonnées ajoutées
 */
export const optimizeGroupRideList = (originalArray) => {
  if (!originalArray || !Array.isArray(originalArray)) {
    return [];
  }
  
  // Ajouter des métriques d'optimisation
  return originalArray.map(item => ({
    ...item,
    // Prétraiter les données pour améliorer les performances de rendu
    _optimized: {
      // Formatage des dates pour éviter les calculs répétés
      formattedDate: new Date(item.dateTime).toLocaleDateString(),
      formattedTime: new Date(item.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      // Classification pour faciliter le filtrage
      difficultyLevel: getDifficultyLevel(item.levelRequired),
      // Indicateurs visuels précalculés
      capacityPercentage: Math.round((item.currentParticipants / item.maxParticipants) * 100),
      // Indicateur d'imminence pour le tri
      isImminent: isEventImminent(item.dateTime)
    }
  }));
};

// Fonction utilitaire pour déterminer le niveau de difficulté numérique
const getDifficultyLevel = (level) => {
  const levels = {
    beginner: 1,
    intermediate: 2,
    advanced: 3,
    expert: 4
  };
  
  return levels[level] || 2;
};

// Fonction utilitaire pour déterminer si un événement est imminent (< 24h)
const isEventImminent = (dateTimeString) => {
  const eventTime = new Date(dateTimeString).getTime();
  const currentTime = Date.now();
  const timeUntilEvent = eventTime - currentTime;
  
  // Moins de 24 heures
  return timeUntilEvent > 0 && timeUntilEvent < 24 * 60 * 60 * 1000;
};
