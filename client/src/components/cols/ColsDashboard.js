import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
  Skeleton,
  Alert,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Switch,
  FormGroup,
  FormControlLabel,
  Slider,
  Autocomplete
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Map as MapIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
  Sort as SortIcon,
  Terrain as TerrainIcon,
  CompareArrows as CompareArrowsIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  TravelExplore as TravelExploreIcon,
  History as HistoryIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  StarHalf as StarHalfIcon,
  Public as PublicIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Timeline as TimelineIcon,
  Share as ShareIcon,
  DownloadIcon,
  Route as RouteIcon
} from '@mui/icons-material';

// Sous-composants
import ColCard from './ColCard';
import ColFilters from './ColFilters';
import ColMap from './ColMap';
import ColWeatherForecast from './ColWeatherForecast';
import ColsComparison from './ColsComparison';
import ElevationProfileChart from './ElevationProfileChart';

// Données de cols (à remplacer par un appel API)
import { colsData as mockColsData } from '../../data/mockData';

/**
 * Tableau de bord principal des cols
 * Comprend recherche, filtres, comparaison, cartes des cols, etc.
 */
const ColsDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // État local
  const [activeTab, setActiveTab] = useState('discover');
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCols, setSelectedCols] = useState([]);
  const [colsData, setColsData] = useState([]);
  const [favoriteColsIds, setFavoriteColsIds] = useState([]);
  const [historyColsIds, setHistoryColsIds] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    regions: [],
    minElevation: 0,
    maxElevation: 3000,
    minLength: 0,
    maxLength: 50,
    minGradient: 0,
    maxGradient: 15,
    difficulty: []
  });
  const [sortOption, setSortOption] = useState('popularity');
  const [anchorElSort, setAnchorElSort] = useState(null);
  const [mapView, setMapView] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  
  // Régions disponibles
  const regions = [
    { id: 'all', name: t('cols.all_regions') },
    { id: 'alpes', name: t('cols.regions.alpes') },
    { id: 'pyrenees', name: t('cols.regions.pyrenees') },
    { id: 'jura', name: t('cols.regions.jura') },
    { id: 'vosges', name: t('cols.regions.vosges') },
    { id: 'massif-central', name: t('cols.regions.massif_central') },
    { id: 'dolomites', name: t('cols.regions.dolomites') }
  ];
  
  // Simuler le chargement des données
  useEffect(() => {
    const fetchColsData = async () => {
      setLoading(true);
      try {
        // Remplacer par un appel API réel
        await new Promise(resolve => setTimeout(resolve, 800));
        setColsData(mockColsData);
        
        // Charger les favoris depuis localStorage
        const savedFavorites = localStorage.getItem('favoriteColsIds');
        if (savedFavorites) {
          setFavoriteColsIds(JSON.parse(savedFavorites));
        }
        
        // Charger l'historique depuis localStorage
        const savedHistory = localStorage.getItem('historyColsIds');
        if (savedHistory) {
          setHistoryColsIds(JSON.parse(savedHistory));
        }
        
        setLoading(false);
      } catch (err) {
        setError(t('cols.error_loading_data'));
        setLoading(false);
      }
    };
    
    fetchColsData();
  }, [t]);
  
  // Gestion des cols filtrés
  const filteredCols = useMemo(() => {
    // Appliquer les filtres de recherche, région, etc.
    let filtered = colsData;
    
    // Filtrer par requête de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(col => 
        col.name.toLowerCase().includes(query) || 
        col.location.toLowerCase().includes(query) ||
        (col.description && col.description.toLowerCase().includes(query))
      );
    }
    
    // Filtrer par région
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(col => col.region === selectedRegion);
    }
    
    // Filtrer par élévation
    filtered = filtered.filter(col => 
      col.elevation >= filterOptions.minElevation && 
      col.elevation <= filterOptions.maxElevation
    );
    
    // Filtrer par longueur
    filtered = filtered.filter(col => 
      col.length >= filterOptions.minLength && 
      col.length <= filterOptions.maxLength
    );
    
    // Filtrer par pente moyenne
    filtered = filtered.filter(col => 
      col.avgGradient >= filterOptions.minGradient && 
      col.avgGradient <= filterOptions.maxGradient
    );
    
    // Filtrer par difficulté
    if (filterOptions.difficulty.length > 0) {
      filtered = filtered.filter(col => 
        filterOptions.difficulty.includes(col.difficulty)
      );
    }
    
    // Appliquer le tri
    switch (sortOption) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'elevation':
        filtered.sort((a, b) => b.elevation - a.elevation);
        break;
      case 'length':
        filtered.sort((a, b) => b.length - a.length);
        break;
      case 'gradient':
        filtered.sort((a, b) => b.avgGradient - a.avgGradient);
        break;
      case 'difficulty':
        filtered.sort((a, b) => b.difficulty - a.difficulty);
        break;
      case 'popularity':
      default:
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
    }
    
    // Changer l'ordre selon l'onglet
    if (activeTab === 'favorites') {
      filtered = filtered.filter(col => favoriteColsIds.includes(col.id));
    } else if (activeTab === 'history') {
      // Trier l'historique par dernier visité (en utilisant l'ordre dans historyColsIds)
      const historyMap = new Map(historyColsIds.map((id, index) => [id, index]));
      filtered = filtered
        .filter(col => historyColsIds.includes(col.id))
        .sort((a, b) => historyMap.get(a.id) - historyMap.get(b.id));
    }
    
    return filtered;
  }, [colsData, searchQuery, selectedRegion, filterOptions, sortOption, activeTab, favoriteColsIds, historyColsIds]);
  
  // Gestion de la mise à jour des filtres
  const handleFilterChange = (newFilters) => {
    setFilterOptions(prev => ({ ...prev, ...newFilters }));
  };
  
  // Gérer la sélection d'un col pour la comparaison
  const handleColSelection = (colId) => {
    if (compareMode) {
      // Ajouter ou retirer de la sélection pour comparaison
      if (selectedCols.includes(colId)) {
        setSelectedCols(selectedCols.filter(id => id !== colId));
      } else if (selectedCols.length < 3) { // Limiter à 3 cols maximum
        setSelectedCols([...selectedCols, colId]);
      }
    } else {
      // Ajouter à l'historique
      const newHistory = [colId, ...historyColsIds.filter(id => id !== colId)].slice(0, 10);
      setHistoryColsIds(newHistory);
      localStorage.setItem('historyColsIds', JSON.stringify(newHistory));
      
      // Naviguer vers la page de détails
      navigate(`/cols/${colId}`);
    }
  };
  
  // Gérer l'ajout/retrait des favoris
  const handleToggleFavorite = (colId) => {
    const newFavorites = favoriteColsIds.includes(colId)
      ? favoriteColsIds.filter(id => id !== colId)
      : [...favoriteColsIds, colId];
    
    setFavoriteColsIds(newFavorites);
    localStorage.setItem('favoriteColsIds', JSON.stringify(newFavorites));
  };
  
  // Gérer l'ouverture du menu de tri
  const handleSortMenuOpen = (event) => {
    setAnchorElSort(event.currentTarget);
  };
  
  // Gérer la fermeture du menu de tri
  const handleSortMenuClose = () => {
    setAnchorElSort(null);
  };
  
  // Gérer le changement d'option de tri
  const handleSortChange = (option) => {
    setSortOption(option);
    handleSortMenuClose();
  };
  
  // Passer en mode comparaison
  const toggleCompareMode = () => {
    setCompareMode(!compareMode);
    if (compareMode) {
      setSelectedCols([]);
    }
  };
  
  return (
    <Container maxWidth="xl" component="section" aria-labelledby="cols-dashboard-title">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" id="cols-dashboard-title" gutterBottom 
          sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
        >
          <TerrainIcon color="primary" fontSize="large" sx={{ mr: 1.5 }} />
          {t('cols.dashboard_title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t('cols.dashboard_description')}
        </Typography>
        
        {/* Onglets principaux */}
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            value="discover" 
            label={t('cols.discover')} 
            icon={<TravelExploreIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="favorites" 
            label={t('cols.favorites')} 
            icon={<FavoriteIcon />} 
            iconPosition="start"
            disabled={favoriteColsIds.length === 0}
          />
          <Tab 
            value="history" 
            label={t('cols.recently_viewed')} 
            icon={<HistoryIcon />} 
            iconPosition="start"
            disabled={historyColsIds.length === 0}
          />
          <Tab 
            value="compare" 
            label={t('cols.compare')} 
            icon={<CompareArrowsIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="weather" 
            label={t('cols.weather')} 
            icon={<PublicIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* En-tête avec recherche et filtres */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 3, 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          alignItems: { md: 'center' }, 
          gap: 2 
        }}
      >
        {/* Champ de recherche */}
        <TextField
          placeholder={t('cols.search_placeholder')}
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        
        {/* Sélecteur de région */}
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="region-select-label">{t('cols.region')}</InputLabel>
          <Select
            labelId="region-select-label"
            id="region-select"
            value={selectedRegion}
            label={t('cols.region')}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {regions.map((region) => (
              <MenuItem key={region.id} value={region.id}>{region.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Menu de tri */}
        <Box>
          <Button
            variant="outlined"
            onClick={handleSortMenuOpen}
            startIcon={<SortIcon />}
            size="medium"
          >
            {t('cols.sort_by')}
          </Button>
          <Menu
            anchorEl={anchorElSort}
            open={Boolean(anchorElSort)}
            onClose={handleSortMenuClose}
          >
            <MenuItem onClick={() => handleSortChange('popularity')} selected={sortOption === 'popularity'}>
              {t('cols.sort_options.popularity')}
            </MenuItem>
            <MenuItem onClick={() => handleSortChange('name')} selected={sortOption === 'name'}>
              {t('cols.sort_options.name')}
            </MenuItem>
            <MenuItem onClick={() => handleSortChange('elevation')} selected={sortOption === 'elevation'}>
              {t('cols.sort_options.elevation')}
            </MenuItem>
            <MenuItem onClick={() => handleSortChange('length')} selected={sortOption === 'length'}>
              {t('cols.sort_options.length')}
            </MenuItem>
            <MenuItem onClick={() => handleSortChange('gradient')} selected={sortOption === 'gradient'}>
              {t('cols.sort_options.gradient')}
            </MenuItem>
            <MenuItem onClick={() => handleSortChange('difficulty')} selected={sortOption === 'difficulty'}>
              {t('cols.sort_options.difficulty')}
            </MenuItem>
          </Menu>
        </Box>
        
        {/* Filtres avancés */}
        <Button 
          variant="outlined" 
          startIcon={<FilterListIcon />}
          size="medium"
          onClick={() => console.log('Ouvrir modal de filtres')}
        >
          {t('cols.advanced_filters')}
        </Button>
        
        {/* Bouton de mode vue */}
        <Tooltip title={t(`cols.view_${viewMode === 'grid' ? 'list' : 'grid'}`)}>
          <IconButton onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <ViewListIcon /> : <ViewModuleIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Bouton de vue carte */}
        <Tooltip title={t(mapView ? 'cols.hide_map' : 'cols.show_map')}>
          <IconButton onClick={() => setMapView(!mapView)} color={mapView ? 'primary' : 'default'}>
            <MapIcon />
          </IconButton>
        </Tooltip>
        
        {/* Bouton de comparaison (uniquement visible si pas déjà en mode comparaison) */}
        {activeTab !== 'compare' && (
          <Tooltip title={t(compareMode ? 'cols.cancel_compare' : 'cols.start_compare')}>
            <IconButton 
              onClick={toggleCompareMode} 
              color={compareMode ? 'primary' : 'default'}
            >
              <CompareArrowsIcon />
            </IconButton>
          </Tooltip>
        )}
      </Paper>
      
      {/* Information de mode comparaison */}
      {compareMode && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={toggleCompareMode}
            >
              {t('cols.done')}
            </Button>
          }
        >
          {t('cols.compare_mode_info', { selected: selectedCols.length, max: 3 })}
        </Alert>
      )}
      
      {/* Vue carte si activée */}
      {mapView && (
        <Paper elevation={3} sx={{ height: 400, mb: 3, overflow: 'hidden' }}>
          <ColMap 
            cols={filteredCols}
            selectedCols={selectedCols}
            onColSelect={handleColSelection}
          />
        </Paper>
      )}
      
      {/* Mode Weather Forecast */}
      {activeTab === 'weather' && (
        <Box sx={{ mb: 4 }}>
          <ColWeatherForecast 
            cols={colsData}
            favoriteColsIds={favoriteColsIds}
          />
        </Box>
      )}
      
      {/* Mode comparaison dédié */}
      {activeTab === 'compare' && (
        <Box sx={{ mb: 4 }}>
          <ColsComparison 
            cols={colsData}
            favoriteColsIds={favoriteColsIds}
          />
        </Box>
      )}
      
      {/* Liste des cols (visible si pas en mode Weather ou Compare) */}
      {(activeTab !== 'weather' && activeTab !== 'compare') && (
        <>
          {/* Information si aucun résultat */}
          {filteredCols.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 3 }}>
              {activeTab === 'favorites' 
                ? t('cols.no_favorites') 
                : activeTab === 'history'
                  ? t('cols.no_history')
                  : t('cols.no_results')}
            </Alert>
          )}
          
          {/* Grille de cols */}
          {loading ? (
            <Grid container spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Grid item key={item} xs={12} sm={6} md={4} lg={3}>
                  <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="text" sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="60%" />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="circular" width={40} height={40} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Grid container spacing={3}>
              {filteredCols.map((col) => (
                <Grid 
                  item 
                  key={col.id} 
                  xs={12} 
                  sm={viewMode === 'grid' ? 6 : 12} 
                  md={viewMode === 'grid' ? 4 : 12} 
                  lg={viewMode === 'grid' ? 3 : 12}
                >
                  <ColCard 
                    col={col}
                    isFavorite={favoriteColsIds.includes(col.id)}
                    isSelected={selectedCols.includes(col.id)}
                    compareMode={compareMode}
                    onCardClick={() => handleColSelection(col.id)}
                    onToggleFavorite={() => handleToggleFavorite(col.id)}
                    viewMode={viewMode}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
};

export default ColsDashboard;
