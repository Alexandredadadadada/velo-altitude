import React, { memo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';

// Import différé du composant de carte pour améliorer les performances
const MapWithComponents = React.lazy(() => import('../../common/MapWithComponents'));

/**
 * Composant pour afficher la carte d'un col
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.col - Données du col
 * @param {string} props.selectedSide - Côté sélectionné
 * @param {Array} props.elevationProfile - Profil d'élévation
 */
const ColMap = memo(({ col, selectedSide, elevationProfile }) => {
  const { t } = useTranslation();

  if (!col || !col.location || !col.location.coordinates) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="body1" color="text.secondary">
          {t('cols.no_map_data')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 500, position: 'relative' }}>
      <Suspense fallback={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('cols.loading_map')}
          </Typography>
        </Box>
      }>
        <MapWithComponents 
          center={[col.location.coordinates.lat, col.location.coordinates.lng]} 
          zoom={12} 
          colData={col}
          selectedSide={selectedSide}
          elevationProfile={elevationProfile}
        />
      </Suspense>
    </Box>
  );
});

export default ColMap;
