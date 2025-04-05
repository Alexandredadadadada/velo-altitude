import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography, 
  Chip, 
  Grid, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  AccessTime as TimeIcon, 
  LocalFireDepartment as CalorieIcon,
  FitnessCenter as ProteinIcon,
  Grain as CarbIcon,
  Opacity as FatIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import ResponsiveImage from '../common/ResponsiveImage';

/**
 * Composant de template pour les recettes nutritionnelles
 * Adapté aux différentes phases d'effort (avant, pendant, après)
 */
const RecipeTemplate = ({ 
  recipe, 
  phase = 'before', // 'before', 'during', 'after'
  onSave,
  onShare,
  onPrint,
  isSaved = false
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [ingredientsChecked, setIngredientsChecked] = useState({});

  if (!recipe) return null;

  // Couleurs selon la phase d'effort
  const phaseColors = {
    before: theme.palette.primary.main,
    during: theme.palette.warning.main,
    after: theme.palette.success.main
  };

  // Libellés selon la phase d'effort
  const phaseLabels = {
    before: 'Avant l\'effort',
    during: 'Pendant l\'effort',
    after: 'Récupération'
  };

  // Gestion de la sauvegarde de la recette
  const handleSaveRecipe = () => {
    setSaved(!saved);
    if (onSave) onSave(recipe.id, !saved);
  };

  // Gestion du partage de la recette
  const handleShareRecipe = () => {
    if (onShare) onShare(recipe);
  };

  // Gestion de l'impression de la recette
  const handlePrintRecipe = () => {
    if (onPrint) onPrint(recipe);
    else window.print();
  };

  // Gestion des ingrédients cochés
  const toggleIngredientChecked = (index) => {
    setIngredientsChecked(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Ouvrir la boîte de dialogue des instructions
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  // Fermer la boîte de dialogue des instructions
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Card elevation={3} sx={{ mb: 4, overflow: 'visible', position: 'relative' }}>
      {/* Badge de phase */}
      <Chip 
        label={phaseLabels[phase]} 
        sx={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 10,
          backgroundColor: phaseColors[phase],
          color: '#fff',
          fontWeight: 'bold',
          boxShadow: 2
        }} 
      />

      {/* Image de la recette */}
      <Box sx={{ position: 'relative', height: 250 }}>
        <ResponsiveImage
          src={recipe.imageUrl}
          alt={recipe.title}
          sizes="(max-width: 600px) 100vw, 600px"
          sx={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            borderTopLeftRadius: theme.shape.borderRadius,
            borderTopRightRadius: theme.shape.borderRadius
          }}
          placeholderSrc={recipe.thumbnailUrl || '/images/recipe-placeholder.jpg'}
        />
      </Box>

      <CardContent>
        {/* Titre et actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            {recipe.title}
          </Typography>
          <Box>
            <Tooltip title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}>
              <IconButton onClick={handleSaveRecipe} color={saved ? "primary" : "default"}>
                {saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Partager">
              <IconButton onClick={handleShareRecipe}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Imprimer">
              <IconButton onClick={handlePrintRecipe}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" paragraph>
          {recipe.description}
        </Typography>

        {/* Informations nutritionnelles */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TimeIcon color="action" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {recipe.prepTime} min
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalorieIcon color="error" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {recipe.calories} kcal
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CarbIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {recipe.macros.carbs}g
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ProteinIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {recipe.macros.protein}g
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={2}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FatIcon color="success" sx={{ mr: 1 }} />
              <Typography variant="body2">
                {recipe.macros.fat}g
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        {/* Ingrédients */}
        <Typography variant="h6" gutterBottom>
          Ingrédients
        </Typography>
        <List dense>
          {recipe.ingredients.map((ingredient, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                py: 0.5,
                textDecoration: ingredientsChecked[index] ? 'line-through' : 'none',
                color: ingredientsChecked[index] ? 'text.disabled' : 'text.primary'
              }}
              onClick={() => toggleIngredientChecked(index)}
              button
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {ingredientsChecked[index] ? (
                  <CheckIcon color="success" fontSize="small" />
                ) : (
                  <Box 
                    sx={{ 
                      width: 18, 
                      height: 18, 
                      border: '1px solid', 
                      borderColor: 'action.disabled',
                      borderRadius: '4px'
                    }} 
                  />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Bouton pour voir les instructions */}
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          onClick={handleOpenDialog}
          sx={{ mb: isMobile ? 2 : 0 }}
        >
          Voir les instructions
        </Button>
      </CardContent>

      {/* Boîte de dialogue pour les instructions */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        fullScreen={isMobile}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Instructions: {recipe.title}
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {recipe.instructions.map((step, index) => (
              <ListItem key={index} alignItems="flex-start" sx={{ py: 2 }}>
                <ListItemIcon>
                  <Box 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      backgroundColor: phaseColors[phase],
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold'
                    }}
                  >
                    {index + 1}
                  </Box>
                </ListItemIcon>
                <ListItemText 
                  primary={step}
                />
              </ListItem>
            ))}
          </List>

          {recipe.tips && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Conseils nutritionnels
              </Typography>
              <Typography variant="body2" paragraph>
                {recipe.tips}
              </Typography>
            </>
          )}

          {recipe.variations && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Variations
              </Typography>
              <List dense>
                {recipe.variations.map((variation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={variation} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrintRecipe} startIcon={<PrintIcon />}>
            Imprimer
          </Button>
          <Button onClick={handleCloseDialog}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default RecipeTemplate;
