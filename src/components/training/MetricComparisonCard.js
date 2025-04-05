import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tooltip,
  useTheme
} from '@mui/material';
import { 
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';

/**
 * Composant pour afficher la comparaison d'une métrique entre deux périodes
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Libellé de la métrique
 * @param {string|number} props.value1 - Valeur pour la première période (déjà formatée)
 * @param {string|number} props.value2 - Valeur pour la deuxième période (déjà formatée)
 * @param {string} props.unit - Unité de mesure (km, h, etc.)
 * @param {number} props.difference - Différence en pourcentage entre les deux valeurs
 * @param {string} props.period1Label - Libellé de la première période
 * @param {string} props.period2Label - Libellé de la deuxième période
 */
const MetricComparisonCard = ({ 
  label, 
  value1, 
  value2, 
  unit, 
  difference, 
  period1Label, 
  period2Label 
}) => {
  const theme = useTheme();

  // Déterminer le sens de l'évolution et la couleur associée
  const trendDirection = difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat';
  const trendColor = 
    (trendDirection === 'up') ? theme.palette.success.main : 
    (trendDirection === 'down') ? theme.palette.error.main : 
    theme.palette.grey[500];
  
  // Déterminer le texte de tendance
  const getTrendText = () => {
    const absPercentage = Math.abs(difference).toFixed(1);
    
    if (difference === 0) return 'Aucun changement';
    if (Math.abs(difference) < 0.1) return 'Pratiquement identique';
    
    return `${absPercentage}% ${difference > 0 ? 'de plus' : 'de moins'}`;
  };
  
  // Obtenir l'icône de tendance
  const getTrendIcon = () => {
    if (difference > 2) return <TrendingUp color="success" fontSize="small" />;
    if (difference < -2) return <TrendingDown color="error" fontSize="small" />;
    return <TrendingFlat color="action" fontSize="small" />;
  };
  
  // Déterminer si l'évolution est positive ou négative en fonction de la métrique
  // Pour certaines métriques comme le temps, une diminution est positive
  const isPositiveTrend = () => {
    // Si la métrique est "duration", une diminution est positive
    if (label.toLowerCase().includes('durée') || label.toLowerCase().includes('temps')) {
      return difference < 0;
    }
    
    // Pour les autres métriques, une augmentation est positive
    return difference > 0;
  };
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: '100%',
        borderLeft: `4px solid ${isPositiveTrend() ? theme.palette.success.main : theme.palette.error.main}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {label}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Tooltip title={period1Label} arrow placement="top-start">
            <Typography 
              variant="body2" 
              component="div" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary
              }}
            >
              {value1} {unit}
            </Typography>
          </Tooltip>
          
          <Box 
            sx={{ 
              mx: 1, 
              width: 40, 
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {getTrendIcon()}
          </Box>
          
          <Tooltip title={period2Label} arrow placement="top-end">
            <Typography 
              variant="body2" 
              component="div"
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary
              }}
            >
              {value2} {unit}
            </Typography>
          </Tooltip>
        </Box>
        
        <Tooltip 
          title={`De ${value1} ${unit} à ${value2} ${unit}`} 
          arrow
        >
          <Box 
            sx={{ 
              bgcolor: 'background.neutral',
              borderRadius: 1,
              px: 1,
              py: 0.5,
              textAlign: 'center'
            }}
          >
            <Typography 
              variant="caption" 
              component="div"
              sx={{ 
                color: trendColor,
                fontWeight: 'medium'
              }}
            >
              {getTrendText()}
            </Typography>
          </Box>
        </Tooltip>
      </CardContent>
    </Card>
  );
};

export default MetricComparisonCard;
