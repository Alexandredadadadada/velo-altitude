import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Tooltip, 
  useTheme, 
  Button,
  Chip,
  CardActionArea,
  Divider
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat,
  ArrowForward
} from '@mui/icons-material';

/**
 * Composant affichant une carte de statistique avec titre, valeur et tendance
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la statistique
 * @param {string|number} props.value - Valeur de la statistique
 * @param {string} [props.unit] - Unité de mesure (optionnel)
 * @param {ReactNode} [props.icon] - Icône à afficher (optionnel)
 * @param {number} [props.trend] - Tendance en pourcentage (optionnel)
 * @param {string} [props.trendLabel] - Libellé de la tendance (optionnel)
 * @param {string} [props.actionLabel] - Libellé du bouton d'action (optionnel)
 * @param {Function} [props.onAction] - Fonction à exécuter lors du clic sur le bouton d'action (optionnel)
 * @param {string} [props.chipText] - Texte à afficher dans une puce (optionnel)
 * @param {string} [props.chipTooltip] - Infobulle pour la puce (optionnel)
 * @param {Object} [props.sx] - Styles supplémentaires pour la carte
 */
const StatCard = ({ 
  title, 
  value, 
  unit, 
  icon, 
  trend, 
  trendLabel, 
  actionLabel, 
  onAction,
  chipText,
  chipTooltip,
  sx 
}) => {
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
    if (trend > 0) return <TrendingUp fontSize="small" aria-hidden="true" />;
    if (trend < 0) return <TrendingDown fontSize="small" aria-hidden="true" />;
    return <TrendingFlat fontSize="small" aria-hidden="true" />;
  };
  
  // Formater l'affichage de la tendance
  const formatTrend = (trend) => {
    if (!trend && trend !== 0) return '';
    return `${trend > 0 ? '+' : ''}${Math.abs(trend).toFixed(1)}%`;
  };
  
  // Déterminer si la carte a une action cliquable
  const isClickable = !!onAction;
  
  // Contenu de la carte
  const cardContent = (
    <CardContent sx={{ flexGrow: 1, p: 2, pb: isClickable ? 1 : 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {title}
        </Typography>
        {icon && (
          <Box 
            sx={{ 
              opacity: 0.8,
              color: theme.palette.primary.main
            }}
            aria-hidden="true"
          >
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
      
      {chipText && (
        <Tooltip title={chipTooltip || ''} arrow placement="top">
          <Chip 
            label={chipText}
            size="small"
            sx={{ 
              mt: 1, 
              fontWeight: 500,
              backgroundColor: theme.palette.action.selected,
              color: theme.palette.primary.main,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Tooltip>
      )}
      
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
      
      {isClickable && actionLabel && (
        <>
          <Divider sx={{ my: 1 }} />
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              alignItems: 'center',
              py: 0.5
            }}
          >
            <Button
              size="small"
              endIcon={<ArrowForward />}
              onClick={onAction}
              sx={{ 
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.75rem',
              }}
            >
              {actionLabel}
            </Button>
          </Box>
        </>
      )}
    </CardContent>
  );
  
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
        position: 'relative',
        overflow: 'visible',
        ...sx
      }}
      component={isClickable ? 'div' : 'article'}
      role={isClickable ? undefined : 'article'}
      aria-labelledby={`stat-card-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {isClickable ? (
        <CardActionArea 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'stretch', 
            height: '100%' 
          }}
          onClick={onAction}
          aria-label={`${actionLabel || 'Voir détails'} - ${title}: ${value}${unit || ''}`}
        >
          {cardContent}
        </CardActionArea>
      ) : (
        cardContent
      )}
    </Card>
  );
};

export default StatCard;
