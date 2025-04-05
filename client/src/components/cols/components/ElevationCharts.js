import React, { memo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';

// Importation lazy du composant de graphique pour améliorer les performances
const LineChart = React.lazy(() => import('../../common/LineChart'));

/**
 * Composant pour afficher les graphiques d'élévation ou de pente
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.data - Données du graphique
 * @param {Object} props.options - Options du graphique
 * @param {string} props.type - Type de graphique ('elevation' ou 'gradient')
 */
const ElevationCharts = memo(({ data, options, type }) => {
  const { t } = useTranslation();
  
  if (!data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <Typography variant="body1" color="text.secondary">
          {t('cols.no_elevation_data')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Suspense fallback={
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {t('common.loading')}
          </Typography>
        </Box>
      }>
        <LineChart 
          data={data} 
          options={options} 
        />
      </Suspense>
    </Box>
  );
});

export default ElevationCharts;
