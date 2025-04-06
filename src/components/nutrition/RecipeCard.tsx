import React from 'react';
import { 
  Card, 
  CardMedia, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  CardActions, 
  Button,
  Rating,
  Divider,
  useTheme
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import { Recipe } from '../../types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onClick }) => {
  const theme = useTheme();
  
  // Catégorie de la recette avec couleur correspondante
  const getCategoryInfo = () => {
    switch (recipe.category) {
      case 'before':
        return { 
          label: 'Avant effort', 
          color: theme.palette.info.main,
          icon: <FitnessCenterIcon fontSize="small" />
        };
      case 'during':
        return { 
          label: 'Pendant effort', 
          color: theme.palette.warning.main,
          icon: <LocalFireDepartmentIcon fontSize="small" />
        };
      case 'after':
        return { 
          label: 'Récupération', 
          color: theme.palette.success.main,
          icon: <RestaurantIcon fontSize="small" />
        };
      case 'special':
        return { 
          label: 'Spécial cols', 
          color: theme.palette.secondary.main,
          icon: <LocalFireDepartmentIcon fontSize="small" />
        };
      default:
        return { 
          label: 'Recette', 
          color: theme.palette.primary.main,
          icon: <RestaurantIcon fontSize="small" />
        };
    }
  };

  const categoryInfo = getCategoryInfo();
  const placeholder = `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(recipe.name)}`;

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
          cursor: 'pointer'
        }
      }}
      onClick={onClick}
      elevation={3}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="180"
          image={recipe.imageUrl || placeholder}
          alt={recipe.name}
        />
        <Chip
          icon={categoryInfo.icon}
          label={categoryInfo.label}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            backgroundColor: categoryInfo.color,
            color: '#fff',
            fontWeight: 'bold'
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 0 }}>
        <Typography variant="h6" component="div" gutterBottom noWrap>
          {recipe.name}
        </Typography>

        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            height: '40px'
          }}
        >
          {recipe.description}
        </Typography>

        <Box 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          sx={{ mb: 1 }}
        >
          <Box display="flex" alignItems="center">
            <AccessTimeIcon 
              fontSize="small" 
              sx={{ mr: 0.5, color: 'text.secondary' }} 
            />
            <Typography variant="body2" color="text.secondary">
              {recipe.prepTime} min
            </Typography>
          </Box>

          <Box display="flex" alignItems="center">
            <LocalFireDepartmentIcon 
              fontSize="small" 
              sx={{ mr: 0.5, color: 'text.secondary' }} 
            />
            <Typography variant="body2" color="text.secondary">
              {recipe.calories} kcal
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {recipe.tags.slice(0, 3).map((tag) => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              sx={{ 
                fontSize: '0.7rem',
                height: 20
              }} 
            />
          ))}
          {recipe.tags.length > 3 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
              +{recipe.tags.length - 3}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Box sx={{ flexGrow: 1 }} />

      <Divider sx={{ mt: 2 }} />
      
      <CardActions>
        <Box 
          display="flex" 
          justifyContent="space-between" 
          width="100%" 
          alignItems="center"
        >
          <Box display="flex" alignItems="center">
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mr: 0.5 }}
            >
              Macros:
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                borderRadius: 1,
                px: 0.5,
                mr: 0.5
              }}
            >
              P: {recipe.nutritionFacts.protein}g
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: theme.palette.info.light,
                color: theme.palette.info.contrastText,
                borderRadius: 1,
                px: 0.5,
                mr: 0.5
              }}
            >
              C: {recipe.nutritionFacts.carbs}g
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                backgroundColor: theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                borderRadius: 1,
                px: 0.5
              }}
            >
              L: {recipe.nutritionFacts.fat}g
            </Typography>
          </Box>
          
          <Button 
            size="small" 
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              onClick && onClick();
            }}
          >
            Détails
          </Button>
        </Box>
      </CardActions>
    </Card>
  );
};

export default RecipeCard;
