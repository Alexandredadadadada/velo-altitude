import React, { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  InputAdornment,
  Autocomplete,
  Chip,
  Stack,
  Tab,
  Tabs,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Drawer,
  ListItemIcon,
  ListItemButton
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import TodayIcon from '@mui/icons-material/Today';
import BreakfastDiningIcon from '@mui/icons-material/BreakfastDining';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';

// Ces importations devront être activées une fois les dépendances installées
// import { FixedSizeList as List } from 'react-window';
// import AutoSizer from 'react-virtualized-auto-sizer';
// import InfiniteLoader from 'react-window-infinite-loader';

/**
 * Composant pour le journal alimentaire
 * Optimisé avec la virtualisation des listes pour une meilleure performance
 * Adapté pour les appareils mobiles avec une interface responsive
 * Amélioré avec des attributs ARIA pour l'accessibilité
 * 
 * @param {Object} props - Propriétés du composant
 */
const FoodJournal = memo(({
  foodJournal,
  journalDates,
  foodSearch,
  searchResults,
  selectedFood,
  selectedMeal,
  foodQuantity,
  setFoodSearch,
  setSelectedMeal,
  setFoodQuantity,
  changeJournalDate,
  selectFood,
  addFoodToJournal,
  removeFoodFromJournal,
  loading,
  error,
  isMobile
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Fonction pour obtenir l'icône correspondant au type de repas
  const getMealIcon = (mealName) => {
    const icons = {
      breakfast: <BreakfastDiningIcon />,
      lunch: <LunchDiningIcon />,
      dinner: <DinnerDiningIcon />,
      snack: <EmojiFoodBeverageIcon />
    };
    return icons[mealName] || <MenuBookIcon />;
  };

  // Memoïsation des résultats de recherche pour éviter les re-renders inutiles
  const memoizedSearchResults = useMemo(() => searchResults, [searchResults]);
  
  // Memoïsation du journal pour éviter les re-renders inutiles
  const memoizedJournal = useMemo(() => foodJournal, [foodJournal]);

  // Fonction optimisée pour le rendu des aliments dans les résultats de recherche
  // Elle sera utilisée avec react-window une fois les dépendances installées
  const renderSearchResult = useMemo(() => (
    // Cette fonction sera optimisée avec react-window, 
    // pour l'instant nous affichons la liste standard
    <List 
      aria-label={t('nutrition.search_results')}
      sx={{ 
        maxHeight: '300px', 
        overflow: 'auto', 
        bgcolor: 'background.paper',
        '& .MuiListItem-root:hover': {
          bgcolor: 'action.hover'
        }
      }}
    >
      {memoizedSearchResults.map((food) => (
        <ListItemButton
          key={food.id}
          onClick={() => selectFood(food)}
          selected={selectedFood && food.id === selectedFood.id}
          aria-selected={selectedFood && food.id === selectedFood.id}
          dense
        >
          <ListItemIcon>
            <EmojiFoodBeverageIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={food.name}
            secondary={`${food.calories} kcal | P: ${food.protein}g | C: ${food.carbs}g | F: ${food.fat}g`}
            primaryTypographyProps={{ variant: 'body2' }}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </ListItemButton>
      ))}
    </List>
  ), [memoizedSearchResults, selectFood, selectedFood, t]);
  
  // Rendu du panel de recherche adapté selon le type d'appareil
  const renderSearchPanel = useMemo(() => (
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ 
        p: 2, 
        height: '100%', 
        minHeight: isSmallScreen ? 'auto' : 400,
        mb: isSmallScreen ? 3 : 0
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('nutrition.add_food')}
      </Typography>
      
      <Autocomplete
        freeSolo
        options={memoizedSearchResults}
        getOptionLabel={(option) => option.name || ''}
        inputValue={foodSearch}
        onInputChange={(event, newValue) => {
          setFoodSearch(newValue);
        }}
        onChange={(event, newValue) => {
          selectFood(newValue);
        }}
        loading={loading && foodSearch.length > 1}
        loadingText={t('common.loading')}
        noOptionsText={t('nutrition.no_results')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('nutrition.search_food')}
            margin="normal"
            fullWidth
            size="small"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <>
                  {loading && foodSearch.length > 1 ? (
                    <CircularProgress size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }}
            aria-label={t('nutrition.search_food')}
          />
        )}
      />
      
      {foodSearch.length > 1 && renderSearchResult}
      
      {selectedFood && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Typography variant="subtitle1" gutterBottom>
            {selectedFood.name}
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth margin="dense" size="small">
                <InputLabel id="meal-select-label">{t('nutrition.meal')}</InputLabel>
                <Select
                  labelId="meal-select-label"
                  value={selectedMeal}
                  onChange={(e) => setSelectedMeal(e.target.value)}
                  label={t('nutrition.meal')}
                  aria-label={t('nutrition.select_meal')}
                >
                  <MenuItem value="breakfast">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BreakfastDiningIcon fontSize="small" sx={{ mr: 1 }} />
                      {t('nutrition.meals.breakfast')}
                    </Box>
                  </MenuItem>
                  <MenuItem value="lunch">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LunchDiningIcon fontSize="small" sx={{ mr: 1 }} />
                      {t('nutrition.meals.lunch')}
                    </Box>
                  </MenuItem>
                  <MenuItem value="dinner">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DinnerDiningIcon fontSize="small" sx={{ mr: 1 }} />
                      {t('nutrition.meals.dinner')}
                    </Box>
                  </MenuItem>
                  <MenuItem value="snack">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmojiFoodBeverageIcon fontSize="small" sx={{ mr: 1 }} />
                      {t('nutrition.meals.snack')}
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                type="number"
                label={t('nutrition.quantity')}
                value={foodQuantity}
                onChange={(e) => setFoodQuantity(Number(e.target.value))}
                InputProps={{
                  endAdornment: <InputAdornment position="end">g</InputAdornment>,
                }}
                fullWidth
                margin="dense"
                size="small"
                inputProps={{ min: 1, max: 2000, step: 5 }}
                aria-label={t('nutrition.quantity')}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  mt: 1
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {Math.round(selectedFood.calories * foodQuantity / 100)} kcal
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => addFoodToJournal()}
                  disabled={!selectedFood || foodQuantity <= 0}
                  aria-label={t('nutrition.add_to_journal')}
                >
                  {t('nutrition.add')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  ), [
    t, isSmallScreen, memoizedSearchResults, foodSearch, selectedFood, 
    selectedMeal, foodQuantity, loading, setFoodSearch, 
    selectFood, setSelectedMeal, setFoodQuantity, addFoodToJournal,
    renderSearchResult
  ]);
  
  // Rendu du journal alimentaire avec les repas
  const renderFoodJournal = useMemo(() => (
    <Paper 
      elevation={0} 
      variant="outlined" 
      sx={{ p: 2, height: '100%', minHeight: isSmallScreen ? 'auto' : 400 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {t('nutrition.journal')}
        </Typography>
        
        <FormControl variant="standard" size="small" sx={{ minWidth: 120 }}>
          <Select
            value={memoizedJournal.date}
            onChange={(e) => changeJournalDate(e.target.value)}
            displayEmpty
            startAdornment={<TodayIcon fontSize="small" sx={{ mr: 1 }} />}
            aria-label={t('nutrition.select_date')}
          >
            {journalDates.map((date) => (
              <MenuItem key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      {memoizedJournal.meals.map((meal) => (
        <Box key={meal.name} sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {getMealIcon(meal.name)}
            <Typography 
              variant="subtitle1" 
              sx={{ ml: 1 }}
              component="h3"
              aria-label={`${meal.title} - ${t('nutrition.journal')}`}
            >
              {meal.title}
            </Typography>
          </Box>
          
          <Box>
            {meal.foods && meal.foods.length > 0 ? (
              <List disablePadding dense>
                {meal.foods.map((food) => (
                  <ListItem
                    key={food.id}
                    disablePadding
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        aria-label={`${t('nutrition.remove')} ${food.name}`}
                        onClick={() => removeFoodFromJournal(meal.name, food.id)}
                        size="small"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    }
                    sx={{ 
                      py: 0.5,
                      borderBottom: '1px dashed rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2">
                            {food.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {food.quantity}g
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {food.calories} kcal | P: {food.protein}g | C: {food.carbs}g | F: {food.fat}g
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 4 }}>
                {t('nutrition.no_foods_added')}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
      
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('nutrition.daily_totals')}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" display="block">
                {t('nutrition.calories')}
              </Typography>
              <Typography variant="h6" color="primary.main">
                {memoizedJournal.totals.calories} kcal
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" display="block">
                {t('nutrition.macros.protein')}
              </Typography>
              <Typography variant="h6" color="success.main">
                {memoizedJournal.totals.protein}g
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" display="block">
                {t('nutrition.macros.carbs')}
              </Typography>
              <Typography variant="h6" color="info.main">
                {memoizedJournal.totals.carbs}g
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={6} sm={3}>
            <Paper variant="outlined" sx={{ p: 1, textAlign: 'center' }}>
              <Typography variant="caption" display="block">
                {t('nutrition.macros.fat')}
              </Typography>
              <Typography variant="h6" color="warning.main">
                {memoizedJournal.totals.fat}g
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  ), [
    memoizedJournal, journalDates, changeJournalDate, t, 
    getMealIcon, removeFoodFromJournal, isSmallScreen
  ]);
  
  // Rendu principal du composant adapté pour mobile et desktop
  return (
    <Card elevation={2}>
      <CardHeader
        title={t('nutrition.food_journal')}
        avatar={<MenuBookIcon />}
        subheader={t('nutrition.food_journal_subtitle')}
        aria-label={t('nutrition.food_journal')}
      />
      
      <CardContent>
        <Grid container spacing={3}>
          {/* Layout adaptatif selon la taille de l'écran */}
          {isSmallScreen ? (
            // Layout pour mobiles avec onglets
            <>
              <Grid item xs={12}>
                <Tabs 
                  value={0} 
                  aria-label={t('nutrition.journal_tabs')}
                  variant="fullWidth"
                  sx={{ mb: 2 }}
                >
                  <Tab label={t('nutrition.journal')} />
                  <Tab label={t('nutrition.add_food')} />
                </Tabs>
              </Grid>
              <Grid item xs={12}>
                {renderFoodJournal}
              </Grid>
              <Grid item xs={12}>
                {renderSearchPanel}
              </Grid>
            </>
          ) : (
            // Layout pour desktop avec deux colonnes
            <>
              <Grid item xs={12} md={4}>
                {renderSearchPanel}
              </Grid>
              <Grid item xs={12} md={8}>
                {renderFoodJournal}
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
});

export default FoodJournal;
