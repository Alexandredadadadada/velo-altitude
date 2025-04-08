/**
 * Composant de liste virtualisée optimisé pour les cols
 * Implémente une stratégie de rendu virtualisé pour des performances maximales
 */

import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { useVirtual } from 'react-virtual';
import { Box, Typography, Chip, Skeleton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ArrowUpward, Terrain, LocationOn, Favorite } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { throttle } from 'lodash';

// Item de col mémorisé pour éviter les re-renders
const ColItem = memo(({ col, onClick, isSelected }) => {
  const theme = useTheme();
  
  // Déterminer la couleur en fonction de la difficulté
  const getDifficultyColor = (difficulty) => {
    const colors = ['#4caf50', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0'];
    return colors[Math.min(Math.floor(difficulty), 5)];
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Box
        onClick={() => onClick(col)}
        sx={{
          display: 'flex',
          flexDirection: {xs: 'column', sm: 'row'},
          alignItems: {xs: 'flex-start', sm: 'center'},
          justifyContent: 'space-between',
          p: 2,
          mb: 1,
          borderRadius: 1,
          cursor: 'pointer',
          bgcolor: isSelected 
            ? `${theme.palette.primary.main}15` 
            : theme.palette.background.paper,
          border: '1px solid',
          borderColor: isSelected 
            ? theme.palette.primary.main 
            : theme.palette.divider,
          '&:hover': {
            bgcolor: `${theme.palette.primary.main}10`,
            boxShadow: 1
          },
          boxShadow: isSelected ? 2 : 0,
          transition: 'all 0.2s ease'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: {xs: 1, sm: 0} }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              bgcolor: getDifficultyColor(col.difficulty),
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              mr: 2
            }}
          >
            {col.difficulty.toFixed(1)}
          </Box>
          
          <Box>
            <Typography variant="subtitle1" fontWeight={500} noWrap>
              {col.name}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <LocationOn sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {col.region || col.country}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box 
          sx={{
            display: 'flex', 
            alignItems: 'center',
            gap: 2,
            flexWrap: {xs: 'wrap', md: 'nowrap'}
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ArrowUpward fontSize="small" sx={{ color: 'primary.main', mr: 0.5 }} />
            <Typography variant="body2">
              {col.altitude} m
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Terrain fontSize="small" sx={{ color: 'secondary.main', mr: 0.5 }} />
            <Typography variant="body2">
              {col.length} km
            </Typography>
          </Box>
          
          <Chip 
            size="small" 
            label={`${col.gradient.toFixed(1)}%`} 
            color={col.gradient > 8 ? 'error' : 'default'}
            variant="outlined"
          />
          
          {col.isFavorite && (
            <Favorite fontSize="small" color="error" />
          )}
        </Box>
      </Box>
    </motion.div>
  );
});

// Composant de skeleton pour le chargement
const ColItemSkeleton = () => (
  <Box sx={{ p: 2, mb: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="50%" height={20} />
      </Box>
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1, gap: 2 }}>
      <Skeleton variant="rectangular" width={60} height={24} />
      <Skeleton variant="rectangular" width={60} height={24} />
      <Skeleton variant="rectangular" width={40} height={24} />
    </Box>
  </Box>
);

/**
 * Liste virtualisée des cols avec optimisations avancées
 */
const VirtualizedColsList = ({
  cols = [],
  loading = false,
  onColSelect = () => {},
  selectedColId = null,
  height = 600,
  estimateSize = 100,
  overscan = 5,
  filter = null,
  sort = null
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const parentRef = useRef(null);
  const [filteredCols, setFilteredCols] = useState(cols);
  
  // Appliquer filtres et tri
  useEffect(() => {
    let result = [...cols];
    
    // Filtrage
    if (filter && filter.key && filter.value !== undefined) {
      result = result.filter(col => {
        const colValue = col[filter.key];
        
        switch (filter.operator) {
          case 'eq': return colValue === filter.value;
          case 'gt': return colValue > filter.value;
          case 'lt': return colValue < filter.value;
          case 'contains': 
            return typeof colValue === 'string' && 
                   colValue.toLowerCase().includes(filter.value.toLowerCase());
          default: return true;
        }
      });
    }
    
    // Tri
    if (sort && sort.key) {
      result.sort((a, b) => {
        const valA = a[sort.key];
        const valB = b[sort.key];
        
        if (typeof valA === 'string') {
          return sort.direction === 'asc' 
            ? valA.localeCompare(valB) 
            : valB.localeCompare(valA);
        }
        
        return sort.direction === 'asc' 
          ? valA - valB 
          : valB - valA;
      });
    }
    
    setFilteredCols(result);
  }, [cols, filter, sort]);
  
  // Configuration de la virtualisation
  const rowVirtualizer = useVirtual({
    size: loading ? 10 : filteredCols.length,
    parentRef,
    estimateSize: useCallback(() => estimateSize * (isSmallScreen ? 1.5 : 1), [isSmallScreen, estimateSize]),
    overscan,
  });
  
  // Optimiser le défilement pour éviter les calculs excessifs
  const handleScroll = useCallback(
    throttle(() => {
      // Collecter les métriques de défilement pour optimisation
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          const scrollInfo = {
            scrollTop: parentRef.current?.scrollTop || 0,
            scrollHeight: parentRef.current?.scrollHeight || 0,
            clientHeight: parentRef.current?.clientHeight || 0
          };
          
          // Pré-charger plus d'éléments si proche de la fin
          const scrollPercentage = 
            scrollInfo.scrollTop / (scrollInfo.scrollHeight - scrollInfo.clientHeight);
            
          if (scrollPercentage > 0.8) {
            rowVirtualizer.measure();
          }
        });
      }
    }, 100),
    [rowVirtualizer]
  );
  
  // Faire défiler automatiquement jusqu'à l'élément sélectionné
  useEffect(() => {
    if (selectedColId && filteredCols.length > 0) {
      const index = filteredCols.findIndex(col => col.id === selectedColId);
      if (index !== -1) {
        rowVirtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [selectedColId, filteredCols, rowVirtualizer]);

  return (
    <Box
      ref={parentRef}
      sx={{
        height,
        overflow: 'auto',
        width: '100%',
        position: 'relative',
        scrollBehavior: 'smooth'
      }}
      onScroll={handleScroll}
    >
      {/* Conteneur de la taille totale pour permettre le défilement */}
      <Box
        sx={{
          height: `${rowVirtualizer.totalSize}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {rowVirtualizer.virtualItems.map(virtualRow => (
          <Box
            key={virtualRow.index}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            {loading ? (
              <ColItemSkeleton />
            ) : (
              <ColItem
                col={filteredCols[virtualRow.index]}
                onClick={onColSelect}
                isSelected={filteredCols[virtualRow.index]?.id === selectedColId}
              />
            )}
          </Box>
        ))}
      </Box>
      
      {!loading && filteredCols.length === 0 && (
        <Box sx={{ 
          p: 4, 
          textAlign: 'center',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Terrain sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Aucun col trouvé
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Essayez de modifier vos critères de recherche
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default VirtualizedColsList;
