import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './VirtualizedList.css';
import PropTypes from 'prop-types';

/**
 * Composant de liste virtualisée pour afficher efficacement de grandes listes
 * 
 * Rend uniquement les éléments visibles dans la fenêtre d'affichage,
 * ce qui améliore considérablement les performances pour les longues listes
 * 
 * @param {Array} items - Les éléments à afficher dans la liste
 * @param {Function} renderItem - Fonction de rendu pour chaque élément
 * @param {number} itemHeight - Hauteur de chaque élément en pixels
 * @param {number} height - Hauteur du conteneur de liste en pixels
 * @param {number} overscanCount - Nombre d'éléments à rendre au-dessus et en dessous de la fenêtre visible
 * @param {string} className - Classe CSS additionnelle
 * @param {Function} onScroll - Callback appelé lors du défilement
 * @param {Function} onItemsRendered - Callback appelé quand les éléments sont rendus
 */
const VirtualizedList = ({
  items = [],
  renderItem,
  itemHeight = 50,
  height = 400,
  overscanCount = 3,
  className = '',
  onScroll,
  onItemsRendered,
  enableCache = true,
  scrollToItemId = null
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const [renderedItems, setRenderedItems] = useState([]);
  const [measurementCache, setMeasurementCache] = useState({});
  const [useVariableHeights, setUseVariableHeights] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const lastScrollPosition = useRef(0);
  const scrollTimeout = useRef(null);
  
  // Déterminer les indices des éléments visibles
  const getItemIndexRange = useCallback(() => {
    // La position de départ est le défilement actuel
    let startPosition = scrollTop;
    
    // Si nous utilisons des hauteurs variables, nous devons parcourir le cache pour trouver l'index de début
    let startIndex = 0;
    let endIndex = 0;
    
    if (useVariableHeights && Object.keys(measurementCache).length > 0) {
      // Parcourir le cache jusqu'à ce qu'on trouve l'élément qui correspond à la position visible
      let currentPosition = 0;
      
      for (let i = 0; i < items.length; i++) {
        const currentHeight = measurementCache[i]?.height || itemHeight;
        if (currentPosition + currentHeight >= startPosition) {
          startIndex = i;
          break;
        }
        currentPosition += currentHeight;
      }
      
      // À partir de l'index de début, déterminer le dernier élément visible
      // en ajoutant des hauteurs jusqu'à ce qu'on dépasse la hauteur du viewport
      let visibleHeight = 0;
      for (let i = startIndex; i < items.length; i++) {
        const currentHeight = measurementCache[i]?.height || itemHeight;
        visibleHeight += currentHeight;
        
        if (visibleHeight > height) {
          endIndex = i;
          break;
        }
      }
      
      // Si nous n'avons pas dépassé la hauteur, prendre le dernier élément
      if (endIndex === 0) {
        endIndex = items.length - 1;
      }
    } else {
      // Calcul avec hauteurs fixes (plus efficace)
      startIndex = Math.max(0, Math.floor(startPosition / itemHeight) - overscanCount);
      const visibleItemCount = Math.ceil(height / itemHeight);
      endIndex = Math.min(items.length - 1, startIndex + visibleItemCount + overscanCount * 2);
    }
    
    return { startIndex, endIndex };
  }, [scrollTop, items.length, height, itemHeight, overscanCount, useVariableHeights, measurementCache]);
  
  // Calculer la hauteur totale de la liste
  const totalHeight = useMemo(() => {
    if (useVariableHeights && Object.keys(measurementCache).length > 0) {
      return Object.values(measurementCache).reduce((total, item) => total + (item.height || itemHeight), 0);
    }
    return items.length * itemHeight;
  }, [items.length, itemHeight, useVariableHeights, measurementCache]);
  
  // Calculer le décalage initial pour le conteneur des éléments
  const getItemOffset = useCallback((index) => {
    if (useVariableHeights) {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += measurementCache[i]?.height || itemHeight;
      }
      return offset;
    }
    return index * itemHeight;
  }, [itemHeight, useVariableHeights, measurementCache]);
  
  // Mettre à jour la position d'un élément dans le cache
  const updateItemMeasurement = useCallback((index, height) => {
    if (!enableCache) return;
    
    setMeasurementCache(prevCache => {
      // Si la hauteur est la même qu'avant, ne pas déclencher de mise à jour
      if (prevCache[index] && prevCache[index].height === height) {
        return prevCache;
      }
      
      const newCache = { ...prevCache, [index]: { height } };
      
      // Si nous avons détecté une hauteur différente de la valeur par défaut,
      // activer le mode de hauteurs variables
      if (height !== itemHeight && !useVariableHeights) {
        setUseVariableHeights(true);
      }
      
      return newCache;
    });
  }, [itemHeight, useVariableHeights, enableCache]);
  
  // Gérer le scroll vers un élément spécifique
  useEffect(() => {
    if (scrollToItemId != null && containerRef.current) {
      // Trouver l'index de l'élément par son id
      const itemIndex = items.findIndex(item => item.id === scrollToItemId);
      
      if (itemIndex !== -1) {
        // Calculer la position de l'élément
        const offset = getItemOffset(itemIndex);
        
        // Faire défiler jusqu'à cette position
        containerRef.current.scrollTop = offset;
      }
    }
  }, [scrollToItemId, items, getItemOffset]);
  
  // Gérer le défilement du conteneur
  const handleScroll = useCallback((e) => {
    const { scrollTop } = e.target;
    setScrollTop(scrollTop);
    lastScrollPosition.current = scrollTop;
    
    // Gérer l'état de défilement pour les optimisations d'affichage
    setIsScrolling(true);
    
    // Réinitialiser l'état de défilement après un délai
    clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
    
    // Appeler le callback onScroll s'il est fourni
    if (onScroll) {
      onScroll({
        scrollTop,
        scrollDirection: scrollTop > lastScrollPosition.current ? 'down' : 'up'
      });
    }
  }, [onScroll]);
  
  // Mettre à jour les éléments rendus lorsqu'on fait défiler la liste
  useEffect(() => {
    const { startIndex, endIndex } = getItemIndexRange();
    
    // Tableau pour stocker les éléments à rendre
    const itemsToRender = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= 0 && i < items.length) {
        const item = items[i];
        const itemStyle = {
          position: 'absolute',
          top: getItemOffset(i),
          width: '100%',
          height: useVariableHeights ? 'auto' : `${itemHeight}px`
        };
        
        // Créer un wrapper pour l'élément qui peut mesurer sa hauteur
        const itemWithMeasurement = (
          <div
            key={`virtualized-item-${i}`}
            className="virtualized-item"
            style={itemStyle}
            ref={node => {
              if (node && enableCache) {
                const height = node.getBoundingClientRect().height;
                if (height > 0 && (!measurementCache[i] || measurementCache[i].height !== height)) {
                  updateItemMeasurement(i, height);
                }
              }
            }}
          >
            {renderItem(item, i, isScrolling)}
          </div>
        );
        
        itemsToRender.push(itemWithMeasurement);
      }
    }
    
    setRenderedItems(itemsToRender);
    
    // Notifier du rendu des éléments
    if (onItemsRendered) {
      onItemsRendered({ startIndex, endIndex });
    }
  }, [
    items, 
    renderItem, 
    getItemIndexRange, 
    getItemOffset, 
    itemHeight, 
    onItemsRendered, 
    useVariableHeights,
    measurementCache,
    isScrolling,
    enableCache
  ]);
  
  return (
    <div
      ref={containerRef}
      className={`virtualized-list-container ${className}`}
      style={{ height, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="virtualized-list-content"
        style={{ position: 'relative', height: `${totalHeight}px` }}
      >
        {renderedItems}
      </div>
    </div>
  );
};

VirtualizedList.propTypes = {
  items: PropTypes.array.isRequired,
  renderItem: PropTypes.func.isRequired,
  itemHeight: PropTypes.number,
  height: PropTypes.number,
  overscanCount: PropTypes.number,
  className: PropTypes.string,
  onScroll: PropTypes.func,
  onItemsRendered: PropTypes.func,
  enableCache: PropTypes.bool,
  scrollToItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default VirtualizedList;
