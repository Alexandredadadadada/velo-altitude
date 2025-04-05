import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Grid,
  Box,
  Typography,
  Skeleton,
  InputAdornment,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  useTheme,
  useMediaQuery,
  Chip,
  Button
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  TerrainOutlined as TerrainIcon,
  RouteOutlined as RouteIcon,
  TuneOutlined as TuneIcon
} from '@mui/icons-material';
import VisualizationCard from './VisualizationCard';

const AnimatedGrid = styled(motion.div)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  flexGrow: 1,
  maxWidth: '100%',
  [theme.breakpoints.up('md')]: {
    maxWidth: 300,
  },
}));

const FilterForm = styled(Box)(({ theme, expanded }) => ({
  display: expanded ? 'flex' : 'none',
  flexWrap: 'wrap',
  alignItems: 'center', 
  gap: theme.spacing(2),
  padding: expanded ? theme.spacing(2) : 0,
  marginTop: expanded ? theme.spacing(2) : 0,
  marginBottom: expanded ? theme.spacing(2) : 0,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: expanded ? theme.shadows[1] : 'none',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
}));

const FilterChipsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  marginBottom: theme.spacing(2)
}));

const NoResultsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(6),
  textAlign: 'center',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1],
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledPagination = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
}));

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

/**
 * VisualizationGrid - Composant de grille pour afficher des cartes de visualisation avec filtres et pagination
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Liste des éléments à afficher
 * @param {boolean} props.loading - Indique si les données sont en cours de chargement
 * @param {string} props.title - Titre de la grille
 * @param {Object} props.filters - Filtres disponibles (types, difficultés, régions, etc.)
 * @param {Function} props.onFilterChange - Fonction appelée lorsque les filtres changent
 * @param {Function} props.onSearch - Fonction appelée lors d'une recherche
 * @param {Function} props.onFavoriteToggle - Fonction appelée lors du clic sur le bouton favori
 * @param {Function} props.onBookmarkToggle - Fonction appelée lors du clic sur le bouton enregistrement
 * @param {Function} props.onShare - Fonction appelée lors du clic sur le bouton partage
 * @param {number} props.itemsPerPage - Nombre d'éléments par page
 * @param {string} props.emptyStateMessage - Message à afficher quand il n'y a pas de résultats
 */
const VisualizationGrid = ({
  items = [],
  loading = false,
  title = 'Visualisations',
  filters = {},
  onFilterChange,
  onSearch,
  onFavoriteToggle,
  onBookmarkToggle,
  onShare,
  itemsPerPage = 12,
  emptyStateMessage = "Aucune visualisation trouvée correspondant à vos critères de recherche."
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  
  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Réinitialiser la page lorsque les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilters, searchQuery]);
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };
  
  const handleFilterChange = (filterName, value) => {
    const newFilters = {
      ...activeFilters,
      [filterName]: value
    };
    
    // Si la valeur est vide, supprimer le filtre
    if (value === '') {
      delete newFilters[filterName];
    }
    
    setActiveFilters(newFilters);
    
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    
    if (onFilterChange) {
      onFilterChange({});
    }
    
    if (onSearch) {
      onSearch('');
    }
  };
  
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const getFilterChips = () => {
    if (!Object.keys(activeFilters).length && !searchQuery) {
      return null;
    }
    
    return (
      <FilterChipsContainer>
        {searchQuery && (
          <Chip
            label={`Recherche: ${searchQuery}`}
            onDelete={() => {
              setSearchQuery('');
              if (onSearch) onSearch('');
            }}
            color="primary"
            variant="outlined"
          />
        )}
        
        {Object.entries(activeFilters).map(([key, value]) => {
          // Skip empty values
          if (!value) return null;
          
          let label = '';
          let chipColor = 'primary';
          
          // Format the label based on filter type
          if (key === 'type') {
            label = `Type: ${value === 'col' ? 'Col' : 'Parcours'}`;
            chipColor = value === 'col' ? 'primary' : 'secondary';
          } else if (key === 'difficulty') {
            label = `Difficulté: ${value}`;
          } else if (key === 'region') {
            label = `Région: ${value}`;
          } else {
            label = `${key}: ${value}`;
          }
          
          return (
            <Chip
              key={key}
              label={label}
              onDelete={() => handleFilterChange(key, '')}
              color={chipColor}
              variant="outlined"
            />
          );
        })}
        
        <Chip
          label="Effacer tout"
          onDelete={clearAllFilters}
          deleteIcon={<ClearIcon />}
          variant="outlined"
          color="error"
        />
      </FilterChipsContainer>
    );
  };
  
  const renderFilters = () => {
    return (
      <>
        <FilterContainer>
          <SearchField
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            fullWidth={isMobile}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    aria-label="clear search"
                    onClick={() => {
                      setSearchQuery('');
                      if (onSearch) onSearch('');
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
          
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            size="small"
          >
            Filtres
          </Button>
          
          {!isTablet && filters.type && (
            <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="type-filter-label">Type</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                value={activeFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
                IconComponent={TuneIcon}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="col">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TerrainIcon sx={{ mr: 1 }} /> Cols
                  </Box>
                </MenuItem>
                <MenuItem value="route">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <RouteIcon sx={{ mr: 1 }} /> Parcours
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          )}
        </FilterContainer>
        
        <FilterForm expanded={filtersExpanded ? 1 : 0}>
          {filters.type && isTablet && (
            <FormControl fullWidth variant="outlined" size="small">
              <InputLabel id="mobile-type-filter-label">Type</InputLabel>
              <Select
                labelId="mobile-type-filter-label"
                id="mobile-type-filter"
                value={activeFilters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="col">Cols</MenuItem>
                <MenuItem value="route">Parcours</MenuItem>
              </Select>
            </FormControl>
          )}
          
          {filters.difficulty && (
            <FormControl sx={{ minWidth: 150 }} size="small" fullWidth={isMobile}>
              <InputLabel id="difficulty-filter-label">Difficulté</InputLabel>
              <Select
                labelId="difficulty-filter-label"
                id="difficulty-filter"
                value={activeFilters.difficulty || ''}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                label="Difficulté"
              >
                <MenuItem value="">Toutes</MenuItem>
                {filters.difficulty.map((diff) => (
                  <MenuItem key={diff} value={diff}>{diff}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {filters.region && (
            <FormControl sx={{ minWidth: 200 }} size="small" fullWidth={isMobile}>
              <InputLabel id="region-filter-label">Région</InputLabel>
              <Select
                labelId="region-filter-label"
                id="region-filter"
                value={activeFilters.region || ''}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                label="Région"
              >
                <MenuItem value="">Toutes</MenuItem>
                {filters.region.map((region) => (
                  <MenuItem key={region} value={region}>{region}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          {/* Boutons d'action pour les filtres */}
          <Box sx={{ display: 'flex', gap: 1, mt: isMobile ? 2 : 0, ml: 'auto' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={clearAllFilters}
              startIcon={<ClearIcon />}
            >
              Réinitialiser
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => setFiltersExpanded(false)}
              color="primary"
            >
              Appliquer
            </Button>
          </Box>
        </FilterForm>
        
        {getFilterChips()}
      </>
    );
  };
  
  // Loading skeletons
  const renderSkeletons = () => {
    return Array.from(new Array(itemsPerPage)).map((_, index) => (
      <Grid item xs={12} sm={6} md={4} lg={3} key={`skeleton-${index}`}>
        <Box sx={{ width: '100%' }}>
          <Skeleton variant="rectangular" height={140} sx={{ borderRadius: '16px 16px 0 0' }} />
          <Skeleton variant="text" height={40} sx={{ mt: 1 }} />
          <Skeleton variant="text" height={20} width="60%" />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
            <Skeleton variant="text" width={60} height={30} />
            <Skeleton variant="text" width={60} height={30} />
          </Box>
        </Box>
      </Grid>
    ));
  };
  
  // Empty state
  const renderEmptyState = () => {
    return (
      <NoResultsContainer>
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Aucun résultat
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          {emptyStateMessage}
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={clearAllFilters}
          startIcon={<ClearIcon />}
        >
          Effacer les filtres
        </Button>
      </NoResultsContainer>
    );
  };
  
  return (
    <Box>
      {title && (
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            mb: 3,
            borderBottom: `3px solid ${theme.palette.primary.main}`,
            pb: 1,
            display: 'inline-block'
          }}
        >
          {title}
        </Typography>
      )}
      
      {renderFilters()}
      
      <AnimatedGrid
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {loading ? (
            renderSkeletons()
          ) : paginatedItems.length > 0 ? (
            paginatedItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <VisualizationCard
                  id={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  image={item.image}
                  type={item.type}
                  location={item.location}
                  stats={item.stats}
                  details={item.details}
                  detailsUrl={item.detailsUrl}
                  isFavorite={item.isFavorite}
                  isBookmarked={item.isBookmarked}
                  onFavoriteToggle={onFavoriteToggle}
                  onBookmarkToggle={onBookmarkToggle}
                  onShare={onShare}
                />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              {renderEmptyState()}
            </Grid>
          )}
        </Grid>
      </AnimatedGrid>
      
      {!loading && totalPages > 1 && (
        <StyledPagination>
          <Pagination 
            count={totalPages} 
            page={currentPage} 
            onChange={handlePageChange} 
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
          />
        </StyledPagination>
      )}
    </Box>
  );
};

export default VisualizationGrid;
