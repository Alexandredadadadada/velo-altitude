import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardMedia, 
  CardActionArea, 
  Typography, 
  Box, 
  Chip, 
  Rating,
  IconButton,
  Modal,
  Grow,
  Zoom,
  Tooltip,
  Stack,
  Skeleton
} from '@mui/material';
import { 
  Favorite, 
  FavoriteBorder, 
  AccessTime, 
  Restaurant, 
  DirectionsBike,
  FitnessCenter,
  ZoomIn,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles pour les cartes de recettes
const RecipeCardStyled = styled(Card)(({ theme }) => ({
  position: 'relative',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
  '& .MuiCardMedia-root': {
    paddingTop: '56.25%', // 16:9
    position: 'relative',
  },
  borderRadius: '12px',
  overflow: 'hidden',
}));

const CategoryChip = styled(Chip)(({ theme, category }) => {
  // Couleurs par catégorie
  const colors = {
    breakfast: { bg: '#FFF9C4', color: '#F57F17' },
    'pre-ride': { bg: '#C8E6C9', color: '#2E7D32' },
    'during-ride': { bg: '#FFECB3', color: '#FF6F00' },
    'post-ride': { bg: '#BBDEFB', color: '#1565C0' }
  };
  
  const defaultColor = { bg: theme.palette.grey[200], color: theme.palette.text.secondary };
  const colorSet = colors[category] || defaultColor;
  
  return {
    position: 'absolute',
    top: 12,
    left: 12,
    fontWeight: 'bold',
    backgroundColor: colorSet.bg,
    color: colorSet.color,
    zIndex: 10,
    fontSize: '0.75rem',
    height: '24px',
  };
});

const ZoomButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  top: 12,
  right: 12,
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  color: theme.palette.grey[800],
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  zIndex: 1,
  padding: 6,
}));

const MacroWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
  marginTop: theme.spacing(1),
}));

const MacroChip = styled(Box)(({ theme, type }) => {
  // Couleurs par type de macronutriment
  const colors = {
    protein: { bg: '#E3F2FD', color: '#1565C0' },
    carbs: { bg: '#FFF3E0', color: '#E65100' },
    fat: { bg: '#F3E5F5', color: '#6A1B9A' },
    calories: { bg: '#E8F5E9', color: '#2E7D32' }
  };
  
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 6px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    borderRadius: '12px',
    backgroundColor: colors[type].bg,
    color: colors[type].color,
  };
});

// Composant de carte de recette améliorée avec zoom et informations visuelles
const EnhancedRecipeCard = ({ recipe, isFavorite, onFavoriteToggle, onSaveToggle, isSaved, loading = false }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Gestion du zoom sur l'image
  const handleOpenZoom = (e) => {
    e.stopPropagation();
    setOpen(true);
  };
  
  // Gestion des favoris
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onFavoriteToggle(recipe.id);
  };
  
  // Gestion des favoris
  const handleSaveClick = (e) => {
    e.stopPropagation();
    onSaveToggle(recipe.id);
  };
  
  // Ouvrir la page détaillée de la recette
  const handleCardClick = () => {
    navigate(`/nutrition/recipes/${recipe.id}`);
  };
  
  // Catégories de recettes avec icônes associées
  const getCategoryIcon = (category) => {
    const icons = {
      breakfast: <Restaurant fontSize="small" />,
      'pre-ride': <DirectionsBike fontSize="small" />,
      'during-ride': <DirectionsBike fontSize="small" />,
      'post-ride': <FitnessCenter fontSize="small" />
    };
    return icons[category] || <Restaurant fontSize="small" />;
  };
  
  // Affichage d'un skeleton loader pendant le chargement
  if (loading) {
    return (
      <RecipeCardStyled>
        <Skeleton variant="rectangular" height={160} animation="wave" />
        <CardContent>
          <Skeleton variant="text" height={32} width="80%" animation="wave" />
          <Skeleton variant="text" height={20} width="60%" animation="wave" />
          <Box sx={{ mt: 2 }}>
            <Skeleton variant="text" height={24} width="90%" animation="wave" />
            <Skeleton variant="text" height={24} width="100%" animation="wave" />
          </Box>
        </CardContent>
      </RecipeCardStyled>
    );
  }
  
  return (
    <>
      <Grow in={!loading} timeout={300}>
        <RecipeCardStyled>
          <CardActionArea onClick={handleCardClick}>
            <CategoryChip 
              label={recipe.categoryLabel || "Recette"}
              size="small"
              category={recipe.category}
              icon={getCategoryIcon(recipe.category)}
            />
            <ZoomButton onClick={handleOpenZoom} size="small">
              <ZoomIn fontSize="small" />
            </ZoomButton>
            <CardMedia
              component="div"
              image={recipe.imageUrl}
              title={recipe.title}
              sx={{
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '30%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                }
              }}
            />
            <Box sx={{ 
              position: 'absolute', 
              bottom: 70, 
              right: 10, 
              display: 'flex', 
              gap: 1 
            }}>
              <Tooltip title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <IconButton 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' } 
                  }}
                  onClick={handleFavoriteClick}
                  size="small"
                >
                  {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
                </IconButton>
              </Tooltip>
              <Tooltip title={isSaved ? "Retirer des enregistrements" : "Enregistrer pour plus tard"}>
                <IconButton 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.8)', 
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.95)' } 
                  }}
                  onClick={handleSaveClick}
                  size="small"
                >
                  {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
                </IconButton>
              </Tooltip>
            </Box>
            <CardContent>
              <Typography variant="h6" component="h3" noWrap gutterBottom>
                {recipe.title}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Rating value={recipe.rating} readOnly size="small" precision={0.5} />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({recipe.reviewsCount || 0})
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {recipe.prepTime} min
                </Typography>
              </Box>
              
              <MacroWrapper>
                <MacroChip type="calories">
                  {recipe.calories} kcal
                </MacroChip>
                <MacroChip type="protein">
                  {recipe.macros?.protein}g P
                </MacroChip>
                <MacroChip type="carbs">
                  {recipe.macros?.carbs}g C
                </MacroChip>
                <MacroChip type="fat">
                  {recipe.macros?.fat}g L
                </MacroChip>
              </MacroWrapper>
            </CardContent>
          </CardActionArea>
        </RecipeCardStyled>
      </Grow>
      
      {/* Modal de zoom pour l'image HD */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="zoom-image-title"
        closeAfterTransition
      >
        <Zoom in={open}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
            boxShadow: 24,
            p: 0,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: 'background.paper'
          }}>
            <Box sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
            }}>
              <img 
                src={recipe.hqImageUrl || recipe.imageUrl} 
                alt={recipe.title} 
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  maxHeight: '90vh',
                  cursor: 'zoom-out',
                }}
                onClick={() => setOpen(false)}
              />
              <Box sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                padding: 2,
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white'
              }}>
                <Typography variant="h6">{recipe.title}</Typography>
                <Typography variant="body2">{recipe.description}</Typography>
              </Box>
            </Box>
          </Box>
        </Zoom>
      </Modal>
    </>
  );
};

export default EnhancedRecipeCard;
