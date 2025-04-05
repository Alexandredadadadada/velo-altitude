import React from 'react';
import { Box, Card, CardContent, Typography, Tooltip, useTheme } from '@mui/material';
import { TrendingUp, TrendingDown, TrendingFlat } from '@mui/icons-material';

/**
 * Composant affichant une carte de statistique avec titre, valeur et tendance
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la statistique
 * @param {string|number} props.value - Valeur de la statistique
 * @param {string} [props.unit] - Unité de mesure (optionnel)
 * @param {ReactNode} [props.icon] - Icône à afficher (optionnel)
 * @param {number} [props.trend] - Tendance en pourcentage (optionnel)
 * @param {string} [props.trendLabel] - Libellé de la tendance (optionnel)
 * @param {Object} [props.sx] - Styles supplémentaires pour la carte
 */
const StatCard = ({ title, value, unit, icon, trend, trendLabel, sx }) => {
  const theme = useTheme();
  
  // Déterminer la couleur et l'icône de tendance
  const getTrendColor = (trend) => {
    if (!trend && trend !== 0) return 'text.secondary';
    if (trend > 0) return 'success.main';
    if (trend < 0) return 'error.main';
    return 'text.secondary';
  };
  
  const getTrendIcon = (trend) => {
    if (!trend && trend !== 0) return null;
    if (trend > 0) return <TrendingUp fontSize="small" />;
    if (trend < 0) return <TrendingDown fontSize="small" />;
    return <TrendingFlat fontSize="small" />;
  };
  
  // Formater l'affichage de la tendance
  const formatTrend = (trend) => {
    if (!trend && trend !== 0) return '';
    return `${trend > 0 ? '+' : ''}${Math.abs(trend).toFixed(1)}%`;
  };
  
  return (
    <Card
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 3,
          borderColor: theme.palette.primary.main,
        },
        ...sx
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ fontWeight: 500 }}
          >
            {title}
          </Typography>
          {icon && (
            <Box sx={{ opacity: 0.8 }}>
              {icon}
            </Box>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Typography
            variant="h5"
            component="div"
            sx={{ fontWeight: 700, lineHeight: 1.2 }}
          >
            {value}
          </Typography>
          {unit && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 0.5 }}
            >
              {unit}
            </Typography>
          )}
        </Box>
        
        {(trend !== undefined || trendLabel) && (
          <Tooltip 
            title={trendLabel || `${trend > 0 ? 'Augmentation' : trend < 0 ? 'Diminution' : 'Stable'} par rapport à la période précédente`}
            arrow
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                color: getTrendColor(trend),
              }}
            >
              {getTrendIcon(trend)}
              <Typography
                variant="caption"
                sx={{ ml: 0.5, fontWeight: 500 }}
              >
                {trendLabel || formatTrend(trend)}
              </Typography>
            </Box>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
