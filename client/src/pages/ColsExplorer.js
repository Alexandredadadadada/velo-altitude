import React, { useMemo, lazy, Suspense, useCallback, useState } from 'react';
import { 
  Container, Grid, Typography, Box,
  CircularProgress, Pagination, Card, 
  CardContent, Tabs, Tab, Paper, 
  useMediaQuery, useTheme, Drawer, 
  IconButton, Fab, Tooltip, Skeleton, Alert, Divider,
  Button
} from '@mui/material';
import { 
  TravelExplore as ExploreIcon,
  EmojiEvents as TrophyIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  KeyboardArrowUp as ArrowUpIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Routes, Route, useLocation } from 'react-router-dom';
import { FixedSizeList as VirtualList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';

// Composants réguliers
import ColDetail from '../components/cols/ColDetail';
import ColCard from '../components/cols/ColCard';
import ColFilters from '../components/cols/ColFilters';
import Breadcrumbs from '../components/common/Breadcrumbs';
import useColsExplorer from './hooks/useColsExplorer';

// Chargement paresseux du composant lourd
const SevenMajorsChallenge = lazy(() => import('../components/challenges/SevenMajorsChallenge'));

// Composant de chargement pour Suspense
const LoadingFallback = () => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8}>
    <CircularProgress size={48} />
    <Typography variant="h6" sx={{ mt: 2 }}>
      Chargement du défi Les 7 Majeurs...
    </Typography>
  </Box>
);

/**
 * Page principale d'exploration des cols cyclistes
 * Permet la recherche, le filtrage et la visualisation détaillée des cols
 */
const ColsExplorer = () => {
  const {
    loading,
    error,
    selectedColId,
    searchTerm,
    filterRegion,
    filterDifficulty,
    filterElevation,
    filterSurface,
    filterTechnicalDifficulty,
    filterSeasons,
    filtersOpen,
    page,
    activeSection,
    paginatedCols,
    pageCount,
    filteredCols,
    favorites,
    toggleFavorite,
    setSearchTerm,
    setFilterRegion,
    setFilterDifficulty,
    setFilterElevation,
    setFilterSurface,
    setFilterTechnicalDifficulty,
    setFilterSeasons,
    setFiltersOpen,
    setPage,
    handleColSelect,
    resetFilters,
    navigateToSection
  } = useColsExplorer();
  
  // Media queries pour le responsive
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  
  // État pour le bouton de retour en haut et le tiroir de filtres sur mobile
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
  // Calculer le titre de la page en fonction de la section active
  const pageTitle = useMemo(() => {
    if (activeSection === 'seven-majors') {
      return 'Les 7 Majeurs - Défi Cycliste';
    }
    return 'Explorez les Cols Cyclistes';
  }, [activeSection]);
  
  // Gérer le défilement pour afficher/masquer le bouton de retour en haut
  const handleScroll = useCallback(() => {
    if (window.scrollY > 300) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  }, []);
  
  // Attacher l'écouteur d'événement de défilement
  React.useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  
  // Fonction pour remonter en haut de la page
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Gérer l'ouverture/fermeture du tiroir de filtres sur mobile
  const toggleMobileFilters = () => {
    setMobileFiltersOpen(!mobileFiltersOpen);
  };
  
  // Rendu optimisé d'un élément de la liste virtualisée
  const ColCardItem = React.memo(({ index, style, data }) => {
    const col = data.items[index];
    if (!col) {
      return (
        <div style={style}>
          <Skeleton variant="rectangular" height={120} />
        </div>
      );
    }
    
    return (
      <div style={{...style, paddingRight: 16, paddingLeft: 16}}>
        <ColCard 
          col={col}
          isSelected={data.selectedId === col.id}
          onClick={() => data.onSelect(col.id)}
          isFavorite={data.favorites.includes(col.id)}
          onToggleFavorite={data.onToggleFavorite}
        />
      </div>
    );
  });
  
  // Configuration pour la virtualisation
  const itemSize = isMobile ? 160 : 180;
  const listHeight = isMobile ? 450 : 600;
  
  // Rendu du composant
  return (
    <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
      {/* Breadcrumbs avec aria */}
      <Box mb={2} role="navigation" aria-label="Fil d'Ariane">
        <Breadcrumbs />
      </Box>
      
      {/* Titre de la page avec aria */}
      <Typography 
        variant={isMobile ? "h5" : "h4"} 
        component="h1" 
        gutterBottom
        sx={{ fontWeight: 'bold' }}
      >
        {pageTitle}
      </Typography>
      
      {/* Navigation principale */}
      <Tabs 
        value={activeSection}
        onChange={(e, newValue) => navigateToSection(newValue)}
        sx={{ 
          mb: isMobile ? 2 : 4, 
          borderBottom: 1, 
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontSize: isMobile ? '0.8rem' : 'inherit',
            minHeight: isMobile ? 48 : 'auto'
          }
        }}
        aria-label="Sections de l'explorateur de cols"
        variant={isMobile ? "fullWidth" : "standard"}
      >
        <Tab 
          value="explorer" 
          label="Explorateur de Cols" 
          icon={isMobile ? null : <ExploreIcon />} 
          iconPosition="start"
          sx={{ fontWeight: activeSection === 'explorer' ? 'bold' : 'normal' }}
          aria-controls={activeSection === 'explorer' ? 'cols-explorer-content' : undefined}
        />
        <Tab 
          value="seven-majors" 
          label="Les 7 Majeurs" 
          icon={isMobile ? null : <TrophyIcon />} 
          iconPosition="start"
          sx={{ fontWeight: activeSection === 'seven-majors' ? 'bold' : 'normal' }}
          aria-controls={activeSection === 'seven-majors' ? 'seven-majors-content' : undefined}
        />
      </Tabs>
      
      {/* Routes pour les différentes sections */}
      <Routes>
        <Route path="/" element={
          <Box id="cols-explorer-content" role="main">
            {/* Bouton de filtres visible uniquement sur mobile */}
            {isMobile && (
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<FilterIcon />}
                  onClick={toggleMobileFilters}
                >
                  {filtersOpen ? 'Masquer les filtres' : 'Afficher les filtres'}
                </Button>
              </Box>
            )}
            
            {/* Tiroir de filtres pour mobile */}
            {isMobile && (
              <Drawer
                anchor="left"
                open={mobileFiltersOpen}
                onClose={toggleMobileFilters}
                sx={{ zIndex: 1200 }}
              >
                <Box sx={{ minWidth: 280, maxWidth: '95vw', p: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Filtres</Typography>
                    <IconButton onClick={toggleMobileFilters} aria-label="Fermer les filtres">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                  <ColFilters
                    searchTerm={searchTerm}
                    filterRegion={filterRegion}
                    filterDifficulty={filterDifficulty}
                    filterElevation={filterElevation}
                    filterSurface={filterSurface}
                    filterTechnicalDifficulty={filterTechnicalDifficulty}
                    filterSeasons={filterSeasons}
                    filtersOpen={filtersOpen}
                    onSearchChange={setSearchTerm}
                    onRegionChange={setFilterRegion}
                    onDifficultyChange={setFilterDifficulty}
                    onElevationChange={setFilterElevation}
                    onSurfaceChange={setFilterSurface}
                    onTechnicalDifficultyChange={setFilterTechnicalDifficulty}
                    onSeasonsChange={setFilterSeasons}
                    onFiltersOpenChange={setFiltersOpen}
                    onResetFilters={resetFilters}
                    isMobile={true}
                  />
                </Box>
              </Drawer>
            )}
            
            <Grid container spacing={3}>
              {/* Partie gauche: recherche et filtres */}
              <Grid item xs={12} md={4} lg={3}>
                {/* Filtres sur desktop et tablet */}
                {!isMobile && (
                  <ColFilters
                    searchTerm={searchTerm}
                    filterRegion={filterRegion}
                    filterDifficulty={filterDifficulty}
                    filterElevation={filterElevation}
                    filterSurface={filterSurface}
                    filterTechnicalDifficulty={filterTechnicalDifficulty}
                    filterSeasons={filterSeasons}
                    filtersOpen={filtersOpen}
                    onSearchChange={setSearchTerm}
                    onRegionChange={setFilterRegion}
                    onDifficultyChange={setFilterDifficulty}
                    onElevationChange={setFilterElevation}
                    onSurfaceChange={setFilterSurface}
                    onTechnicalDifficultyChange={setFilterTechnicalDifficulty}
                    onSeasonsChange={setFilterSeasons}
                    onFiltersOpenChange={setFiltersOpen}
                    onResetFilters={resetFilters}
                  />
                )}
                
                {/* Liste des cols */}
                <Paper 
                  elevation={3} 
                  sx={{ 
                    overflow: 'hidden',
                    mt: !isMobile ? 3 : 0
                  }}
                  aria-label="Liste des cols"
                >
                  <CardContent 
                    sx={{ 
                      bgcolor: 'background.paper', 
                      py: isMobile ? 1.5 : 2,
                      px: isMobile ? 2 : 3
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant={isMobile ? "subtitle1" : "h6"}>
                        <ExploreIcon sx={{ verticalAlign: 'middle', mr: 1, fontSize: isMobile ? '1.2rem' : '1.5rem' }} />
                        {filteredCols.length} cols trouvés
                      </Typography>
                      {isMobile && (
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={toggleMobileFilters}
                          aria-label="Filtrer"
                        >
                          <SearchIcon />
                        </IconButton>
                      )}
                    </Box>
                  </CardContent>
                  
                  <Divider />
                
                  {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress aria-label="Chargement des cols" />
                    </Box>
                  ) : error ? (
                    <Box p={3}>
                      <Alert severity="error" variant="outlined">
                        {error}
                      </Alert>
                    </Box>
                  ) : (
                    <Box sx={{ overflowY: 'auto' }}>
                      {filteredCols.length === 0 ? (
                        <Box p={3}>
                          <Typography align="center">
                            Aucun col ne correspond à vos critères
                          </Typography>
                        </Box>
                      ) : (
                        <Box height={listHeight} width="100%">
                          <AutoSizer disableHeight>
                            {({ width }) => (
                              <VirtualList
                                height={listHeight}
                                width={width}
                                itemCount={paginatedCols.length}
                                itemSize={itemSize}
                                itemData={{
                                  items: paginatedCols,
                                  selectedId: selectedColId,
                                  onSelect: handleColSelect,
                                  favorites: favorites,
                                  onToggleFavorite: toggleFavorite
                                }}
                                overscanCount={3}
                              >
                                {ColCardItem}
                              </VirtualList>
                            )}
                          </AutoSizer>
                        </Box>
                      )}
                      
                      {pageCount > 1 && (
                        <Box 
                          display="flex" 
                          justifyContent="center" 
                          py={2}
                          sx={{
                            borderTop: `1px solid ${theme.palette.divider}`
                          }}
                        >
                          <Pagination 
                            count={pageCount} 
                            page={page}
                            onChange={(e, value) => setPage(value)}
                            color="primary"
                            siblingCount={isMobile ? 0 : 1}
                            size={isMobile ? "small" : "medium"}
                            showFirstButton={!isMobile}
                            showLastButton={!isMobile}
                            aria-label="Pagination des cols"
                          />
                        </Box>
                      )}
                    </Box>
                  )}
                </Paper>
              </Grid>
              
              {/* Visualisation du col sélectionné */}
              <Grid item xs={12} md={8} lg={9}>
                <ColDetail colId={selectedColId} />
              </Grid>
            </Grid>
          </Box>
        } />
        
        <Route path="/seven-majors/*" element={
          <Box id="seven-majors-content" role="main">
            <Suspense fallback={<LoadingFallback />}>
              <SevenMajorsChallenge />
            </Suspense>
          </Box>
        } />
      </Routes>
      
      {/* Bouton pour remonter en haut de la page */}
      {showScrollTop && (
        <Tooltip title="Retour en haut">
          <Fab 
            color="primary" 
            size="small" 
            aria-label="Retour en haut de la page"
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              zIndex: 1000
            }}
            onClick={scrollToTop}
          >
            <ArrowUpIcon />
          </Fab>
        </Tooltip>
      )}
    </Container>
  );
};

export default React.memo(ColsExplorer);
