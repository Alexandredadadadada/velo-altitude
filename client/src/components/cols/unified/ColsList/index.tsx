import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Pagination,
  useMediaQuery,
  useTheme,
  Switch,
  Skeleton
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  ViewList as ListIcon,
  ViewModule as GridIcon,
  Map as MapIcon,
  Close as CloseIcon,
  DirectionsBike as BikeIcon,
  ShowChart as ChartIcon
} from '@mui/icons-material';

// Import hooks and services
import useCols from '../../../../hooks/api/useCols';
import { useAuth } from '../../../../auth';
import { useNotification } from '../../../../hooks/useNotification';

interface ColListProps {
  enableFavorites?: boolean;
  enableMap?: boolean;
  initialFilters?: {
    region?: string[];
    difficulty?: number[];
    altitude?: [number, number];
    length?: [number, number];
  };
  defaultView?: 'grid' | 'list';
  itemsPerPage?: number;
}

interface ColCardProps {
  col: any;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick: (id: string) => void;
  view: 'grid' | 'list';
}

/**
 * Carte d'un col pour l'affichage en liste ou grille
 */
const ColCard: React.FC<ColCardProps> = ({ col, isFavorite, onToggleFavorite, onClick, view }) => {
  const theme = useTheme();
  
  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(col.id);
  };
  
  // Affichage en grille
  if (view === 'grid') {
    return (
      <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardActionArea onClick={() => onClick(col.id)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
          <CardMedia
            component="img"
            height="140"
            image={col.image || '/images/default-col.jpg'}
            alt={col.name}
          />
          <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Typography variant="h6" component="div" noWrap>
                {col.name}
              </Typography>
              <Tooltip title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <IconButton 
                  size="small" 
                  onClick={handleToggleFavorite}
                  color={isFavorite ? "error" : "default"}
                >
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {col.region}
            </Typography>
            
            <Box mt={1} display="flex" gap={1} flexWrap="wrap">
              <Chip 
                icon={<ChartIcon fontSize="small" />} 
                label={`${col.altitude} m`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                icon={<BikeIcon fontSize="small" />} 
                label={`${col.length} km`} 
                size="small" 
                variant="outlined"
              />
              <Chip 
                label={`Difficulté ${col.difficulty}/5`} 
                size="small" 
                color={
                  col.difficulty >= 4 ? "error" : 
                  col.difficulty >= 3 ? "warning" : 
                  col.difficulty >= 2 ? "success" : 
                  "default"
                }
              />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
  
  // Affichage en liste
  return (
    <Card elevation={1} sx={{ width: '100%' }}>
      <CardActionArea onClick={() => onClick(col.id)}>
        <Grid container>
          <Grid item xs={12} sm={3}>
            <CardMedia
              component="img"
              sx={{ height: '100%', minHeight: 120 }}
              image={col.image || '/images/default-col.jpg'}
              alt={col.name}
            />
          </Grid>
          <Grid item xs={12} sm={9}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Typography variant="h6" component="div">
                  {col.name}
                </Typography>
                <Tooltip title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}>
                  <IconButton 
                    size="small" 
                    onClick={handleToggleFavorite}
                    color={isFavorite ? "error" : "default"}
                  >
                    {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {col.region}
              </Typography>
              
              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                <Chip 
                  icon={<ChartIcon fontSize="small" />} 
                  label={`${col.altitude} m`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  icon={<BikeIcon fontSize="small" />} 
                  label={`${col.length} km`} 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={`Difficulté ${col.difficulty}/5`} 
                  size="small" 
                  color={
                    col.difficulty >= 4 ? "error" : 
                    col.difficulty >= 3 ? "warning" : 
                    col.difficulty >= 2 ? "success" : 
                    "default"
                  }
                />
              </Box>
              
              <Typography variant="body2" sx={{ mt: 1, display: { xs: 'none', md: 'block' } }}>
                {col.description?.slice(0, 120)}
                {col.description?.length > 120 ? '...' : ''}
              </Typography>
            </CardContent>
          </Grid>
        </Grid>
      </CardActionArea>
    </Card>
  );
};

/**
 * Liste unifiée des cols
 * Composant principal pour l'affichage, le filtrage et le tri des cols
 */
const ColsList: React.FC<ColListProps> = ({
  enableFavorites = true,
  enableMap = true,
  initialFilters = {},
  defaultView = 'grid',
  itemsPerPage = 12
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { showNotification } = useNotification();
  
  // États locaux
  const [cols, setCols] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [view, setView] = useState<'grid' | 'list'>(defaultView);
  const [page, setPage] = useState<number>(1);
  
  // Charger tous les cols
  useEffect(() => {
    const fetchCols = async () => {
      try {
        setLoading(true);
        
        // Importer le service dynamiquement
        const colService = await import('../../../../services/colService').then(module => module.default);
        
        // Récupérer tous les cols
        const data = await colService.getAllCols();
        
        setCols(data);
        setLoading(false);
      } catch (err: any) {
        console.error('[ColsList] Erreur lors du chargement des cols:', err);
        setError(err.message || 'Erreur lors du chargement des cols');
        setLoading(false);
      }
    };
    
    fetchCols();
  }, []);
  
  // Charger les favoris pour les utilisateurs authentifiés
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!isAuthenticated || !user) {
        setFavorites([]);
        return;
      }
      
      try {
        // Importer le service dynamiquement
        const userService = await import('../../../../services/userService').then(module => module.default);
        
        // Récupérer les favoris
        const userFavorites = await userService.getUserFavorites(user.id);
        
        setFavorites(userFavorites.cols || []);
      } catch (err: any) {
        console.error('[ColsList] Erreur lors du chargement des favoris:', err);
        showNotification('Erreur lors du chargement des favoris', 'error');
      }
    };
    
    if (enableFavorites) {
      fetchFavorites();
    }
  }, [isAuthenticated, user, enableFavorites, showNotification]);
  
  // Gestionnaire pour ajouter/retirer des favoris
  const handleToggleFavorite = useCallback(async (colId: string) => {
    if (!isAuthenticated) {
      showNotification('Veuillez vous connecter pour ajouter des favoris', 'warning');
      return;
    }
    
    try {
      const userService = await import('../../../../services/userService').then(module => module.default);
      
      if (favorites.includes(colId)) {
        // Retirer des favoris
        await userService.removeFromFavorites(user.id, 'cols', colId);
        setFavorites(prev => prev.filter(id => id !== colId));
        showNotification('Retiré des favoris', 'success');
      } else {
        // Ajouter aux favoris
        await userService.addToFavorites(user.id, 'cols', colId);
        setFavorites(prev => [...prev, colId]);
        showNotification('Ajouté aux favoris', 'success');
      }
    } catch (err: any) {
      console.error('[ColsList] Erreur lors de la modification des favoris:', err);
      showNotification('Erreur lors de la modification des favoris', 'error');
    }
  }, [isAuthenticated, favorites, user, showNotification]);
  
  // Navigation vers la page détaillée du col
  const handleColClick = useCallback((colId: string) => {
    navigate(`/cols/${colId}`);
  }, [navigate]);
  
  // Ouvrir la vue carte
  const handleOpenMap = useCallback(() => {
    navigate('/cols/map');
  }, [navigate]);
  
  // Filtrage et tri des cols
  const filteredCols = useMemo(() => {
    return cols
      .filter(col => {
        // Filtre par favoris
        if (showOnlyFavorites && !favorites.includes(col.id)) {
          return false;
        }
        
        // Filtre par recherche textuelle
        if (searchQuery && !col.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
            !col.region.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Filtres avancés
        if (filters.region && filters.region.length > 0 && !filters.region.includes(col.region)) {
          return false;
        }
        
        if (filters.difficulty && filters.difficulty.length > 0 && !filters.difficulty.includes(col.difficulty)) {
          return false;
        }
        
        if (filters.altitude) {
          const [min, max] = filters.altitude;
          if (col.altitude < min || col.altitude > max) {
            return false;
          }
        }
        
        if (filters.length) {
          const [min, max] = filters.length;
          if (col.length < min || col.length > max) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // Tri
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'altitude':
            comparison = a.altitude - b.altitude;
            break;
          case 'length':
            comparison = a.length - b.length;
            break;
          case 'difficulty':
            comparison = a.difficulty - b.difficulty;
            break;
          case 'region':
            comparison = a.region.localeCompare(b.region);
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [cols, favorites, searchQuery, filters, sortBy, sortDirection, showOnlyFavorites]);
  
  // Pagination
  const paginatedCols = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredCols.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCols, page, itemsPerPage]);
  
  // Nombre total de pages
  const totalPages = Math.ceil(filteredCols.length / itemsPerPage);
  
  // Régions uniques pour les filtres
  const uniqueRegions = useMemo(() => {
    return Array.from(new Set(cols.map(col => col.region))).sort();
  }, [cols]);
  
  // Effacer tous les filtres
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilters({});
    setShowOnlyFavorites(false);
    setSortBy('name');
    setSortDirection('asc');
    setPage(1);
  }, []);
  
  // Rendu des squelettes de chargement
  const renderSkeletons = () => {
    return Array.from({ length: 6 }).map((_, index) => (
      <Grid item xs={12} sm={6} md={view === 'grid' ? 4 : 12} key={`skeleton-${index}`}>
        {view === 'grid' ? (
          <Card>
            <Skeleton variant="rectangular" height={140} />
            <CardContent>
              <Skeleton variant="text" width="60%" height={30} />
              <Skeleton variant="text" width="40%" />
              <Box mt={1} display="flex" gap={1}>
                <Skeleton variant="rectangular" width={80} height={24} />
                <Skeleton variant="rectangular" width={80} height={24} />
              </Box>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Grid container>
              <Grid item xs={12} sm={3}>
                <Skeleton variant="rectangular" height={150} />
              </Grid>
              <Grid item xs={12} sm={9}>
                <CardContent>
                  <Skeleton variant="text" width="50%" height={30} />
                  <Skeleton variant="text" width="30%" />
                  <Box mt={1} display="flex" gap={1}>
                    <Skeleton variant="rectangular" width={80} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                    <Skeleton variant="rectangular" width={80} height={24} />
                  </Box>
                  <Skeleton variant="text" sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Grid>
            </Grid>
          </Card>
        )}
      </Grid>
    ));
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* En-tête */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Les Cols
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Découvrez les plus beaux cols cyclistes de la région
        </Typography>
      </Box>
      
      {/* Barre de recherche et filtres */}
      <Paper elevation={1} sx={{ p: 2, mb: 3, borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Rechercher un col..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              size="small"
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterIcon />}
                onClick={() => setShowFilters(!showFilters)}
                size="small"
              >
                Filtres
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={() => {
                  if (sortBy === 'name') {
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('name');
                    setSortDirection('asc');
                  }
                }}
                size="small"
              >
                {sortBy === 'name' 
                  ? `Nom ${sortDirection === 'asc' ? '↑' : '↓'}` 
                  : sortBy === 'altitude'
                    ? `Altitude ${sortDirection === 'asc' ? '↑' : '↓'}` 
                    : sortBy === 'difficulty'
                      ? `Difficulté ${sortDirection === 'asc' ? '↑' : '↓'}` 
                      : sortBy === 'length'
                        ? `Longueur ${sortDirection === 'asc' ? '↑' : '↓'}` 
                        : 'Trier'
                }
              </Button>
              
              <Tooltip title={view === 'grid' ? "Vue liste" : "Vue grille"}>
                <IconButton onClick={() => setView(view === 'grid' ? 'list' : 'grid')}>
                  {view === 'grid' ? <ListIcon /> : <GridIcon />}
                </IconButton>
              </Tooltip>
              
              {enableMap && (
                <Tooltip title="Voir sur la carte">
                  <IconButton color="primary" onClick={handleOpenMap}>
                    <MapIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Grid>
          
          {enableFavorites && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyFavorites}
                    onChange={(e) => setShowOnlyFavorites(e.target.checked)}
                    disabled={!isAuthenticated}
                  />
                }
                label="Afficher uniquement mes favoris"
              />
            </Grid>
          )}
        </Grid>
        
        {/* Filtres avancés */}
        {showFilters && (
          <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Grid container spacing={3}>
              {/* Filtre par région */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Régions
                </Typography>
                <FormGroup row>
                  {uniqueRegions.map((region) => (
                    <FormControlLabel
                      key={region}
                      control={
                        <Checkbox
                          checked={filters.region?.includes(region) || false}
                          onChange={(e) => {
                            const newRegions = e.target.checked
                              ? [...(filters.region || []), region]
                              : (filters.region || []).filter(r => r !== region);
                            
                            setFilters(prev => ({
                              ...prev,
                              region: newRegions.length ? newRegions : undefined
                            }));
                          }}
                          size="small"
                        />
                      }
                      label={region}
                    />
                  ))}
                </FormGroup>
              </Grid>
              
              {/* Filtre par difficulté */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Difficulté
                </Typography>
                <FormGroup row>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <FormControlLabel
                      key={level}
                      control={
                        <Checkbox
                          checked={filters.difficulty?.includes(level) || false}
                          onChange={(e) => {
                            const newDifficulties = e.target.checked
                              ? [...(filters.difficulty || []), level]
                              : (filters.difficulty || []).filter(d => d !== level);
                            
                            setFilters(prev => ({
                              ...prev,
                              difficulty: newDifficulties.length ? newDifficulties : undefined
                            }));
                          }}
                          size="small"
                        />
                      }
                      label={`${level}`}
                    />
                  ))}
                </FormGroup>
              </Grid>
              
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end">
                  <Button
                    variant="text"
                    startIcon={<CloseIcon />}
                    onClick={handleClearFilters}
                    size="small"
                  >
                    Effacer les filtres
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {/* État de chargement */}
      {loading ? (
        <Grid container spacing={3}>
          {renderSkeletons()}
        </Grid>
      ) : error ? (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: 1, borderColor: 'error.light' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Erreur lors du chargement des cols
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Aucun résultat */}
          {filteredCols.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 1, bgcolor: 'background.paper' }}>
              <Typography variant="h6" gutterBottom>
                Aucun col trouvé
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Modifiez vos critères de recherche ou essayez sans filtres
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters} 
                sx={{ mt: 2 }}
              >
                Effacer les filtres
              </Button>
            </Paper>
          ) : (
            <>
              {/* Affichage du nombre de résultats */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {filteredCols.length} résultat{filteredCols.length > 1 ? 's' : ''} trouvé{filteredCols.length > 1 ? 's' : ''}
                </Typography>
                
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                )}
              </Box>
              
              {/* Liste des cols */}
              <Grid container spacing={3}>
                {paginatedCols.map((col) => (
                  <Grid item xs={12} sm={6} md={view === 'grid' ? 4 : 12} key={col.id}>
                    <ColCard
                      col={col}
                      isFavorite={favorites.includes(col.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onClick={handleColClick}
                      view={view}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination en bas */}
              {totalPages > 1 && (
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, value) => setPage(value)}
                    color="primary"
                    size={isMobile ? "small" : "medium"}
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default ColsList;
