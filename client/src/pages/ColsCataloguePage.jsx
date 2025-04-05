import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Tabs,
  Tab,
  Divider,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Sort,
  FilterList,
  Search,
  Terrain,
  Timer,
  DirectionsBike,
  Star,
  InfoOutlined,
  FmdGood
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ColVisualization3D from '../components/visualization/ColVisualization3D';
import mockColsData from '../data/mockColsData';

// Composant pour les filtres
const ColsFilters = ({ filters, setFilters, onFiltersApplied }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [localFilters, setLocalFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(!isMobile);

  // Mettre à jour les filtres locaux quand les props changent
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Gérer les changements de filtres
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Gérer les changements de slider
  const handleSliderChange = (name, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Appliquer les filtres
  const applyFilters = () => {
    setFilters(localFilters);
    onFiltersApplied();
    if (isMobile) {
      setShowFilters(false);
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    const defaultFilters = {
      region: 'all',
      difficulty: 'all',
      minAltitude: 0,
      maxAltitude: 3000,
      minLength: 0,
      maxLength: 50,
      minGradient: 0,
      maxGradient: 20,
      search: '',
    };
    setLocalFilters(defaultFilters);
    setFilters(defaultFilters);
    onFiltersApplied();
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        transition: 'all 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Filtres
        </Typography>
        {isMobile && (
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterList />
          </IconButton>
        )}
      </Box>

      {(showFilters || !isMobile) && (
        <Box component={motion.div} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name="search"
                label="Rechercher un col"
                variant="outlined"
                value={localFilters.search}
                onChange={handleFilterChange}
                InputProps={{
                  startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                }}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Région</InputLabel>
                <Select
                  name="region"
                  value={localFilters.region}
                  label="Région"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">Toutes les régions</MenuItem>
                  <MenuItem value="alpes">Alpes</MenuItem>
                  <MenuItem value="pyrenees">Pyrénées</MenuItem>
                  <MenuItem value="massif-central">Massif Central</MenuItem>
                  <MenuItem value="jura">Jura</MenuItem>
                  <MenuItem value="vosges">Vosges</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Difficulté</InputLabel>
                <Select
                  name="difficulty"
                  value={localFilters.difficulty}
                  label="Difficulté"
                  onChange={handleFilterChange}
                >
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="easy">Facile</MenuItem>
                  <MenuItem value="medium">Moyen</MenuItem>
                  <MenuItem value="hard">Difficile</MenuItem>
                  <MenuItem value="extreme">Extrême</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Altitude (m)
              </Typography>
              <Slider
                value={[localFilters.minAltitude, localFilters.maxAltitude]}
                onChange={(_, value) => {
                  handleSliderChange('minAltitude', value[0]);
                  handleSliderChange('maxAltitude', value[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={3000}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Longueur (km)
              </Typography>
              <Slider
                value={[localFilters.minLength, localFilters.maxLength]}
                onChange={(_, value) => {
                  handleSliderChange('minLength', value[0]);
                  handleSliderChange('maxLength', value[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={50}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                Pente moyenne (%)
              </Typography>
              <Slider
                value={[localFilters.minGradient, localFilters.maxGradient]}
                onChange={(_, value) => {
                  handleSliderChange('minGradient', value[0]);
                  handleSliderChange('maxGradient', value[1]);
                }}
                valueLabelDisplay="auto"
                min={0}
                max={20}
                sx={{ mt: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end' }}>
              <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetFilters}
                >
                  Réinitialiser
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={applyFilters}
                >
                  Appliquer
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

// Composant pour la carte d'un col
const ColCard = ({ col, onSelect, isSelected }) => {
  const theme = useTheme();
  const [favorite, setFavorite] = useState(col.isFavorite || false);

  // Gérer les favoris
  const toggleFavorite = (e) => {
    e.stopPropagation();
    setFavorite(!favorite);
    // Ici on pourrait sauvegarder le statut favori dans une API
  };

  // Convertir difficulté en couleur
  const difficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return theme.palette.success.main;
      case 'medium': return theme.palette.info.main;
      case 'hard': return theme.palette.warning.main;
      case 'extreme': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  // Convertir difficulté en texte
  const difficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      case 'extreme': return 'Extrême';
      default: return 'Non défini';
    }
  };

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
        boxShadow: isSelected ? theme.shadows[10] : theme.shadows[1],
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: theme.shadows[6],
        },
      }}
      onClick={() => onSelect(col)}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="160"
          image={col.imageUrl || '/images/cols/default-col.jpg'}
          alt={col.name}
        />
        <IconButton
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.95)',
            },
          }}
          onClick={toggleFavorite}
        >
          {favorite ? <Favorite color="error" /> : <FavoriteBorder />}
        </IconButton>
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 1,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
          }}
        >
          <Typography variant="subtitle1" component="h3" noWrap>
            {col.name}
          </Typography>
          <Typography variant="body2" component="p" noWrap>
            {col.location?.region}, {col.location?.country}
          </Typography>
        </Box>
      </Box>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
          <Chip
            icon={<Terrain />}
            label={`${col.altitude} m`}
            size="small"
            color="primary"
          />
          <Chip
            icon={<DirectionsBike />}
            label={`${col.distance} km`}
            size="small"
            color="secondary"
          />
          <Chip
            icon={<Timer />}
            label={`${col.avgGradient}%`}
            size="small"
            sx={{ bgcolor: difficultyColor(col.difficulty), color: 'white' }}
          />
        </Box>
        {col.difficulty && (
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            Difficulté: 
            <span style={{ color: difficultyColor(col.difficulty), fontWeight: 'bold' }}>
              {difficultyText(col.difficulty)}
            </span>
          </Typography>
        )}
        {col.rating && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Star sx={{ color: theme.palette.warning.main, fontSize: 18 }} />
            <Typography variant="body2">
              {col.rating} ({col.reviews} avis)
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Composant de détail du col sélectionné
const ColDetail = ({ col }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Aucun col sélectionné
  if (!col) {
    return (
      <Box 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
        }}
      >
        <Box>
          <InfoOutlined sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Sélectionnez un col pour afficher ses détails
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vous pourrez visualiser son profil 3D et toutes ses caractéristiques
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          <ColVisualization3D 
            colData={col} 
            height={isMobile ? 300 : 400} 
            showStats={false}
          />
        </Box>
      </Box>

      <Typography variant="h4" component="h2" gutterBottom>
        {col.name}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FmdGood sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="body1">
          {col.location?.region}, {col.location?.country}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Altitude
            </Typography>
            <Typography variant="h6" component="p">
              {col.altitude} m
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Distance
            </Typography>
            <Typography variant="h6" component="p">
              {col.distance} km
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Dénivelé
            </Typography>
            <Typography variant="h6" component="p">
              {col.elevation} m
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Pente moyenne
            </Typography>
            <Typography variant="h6" component="p">
              {col.avgGradient}%
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {col.description && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" paragraph>
            {col.description}
          </Typography>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
        <Button 
          variant="outlined" 
          component={Link} 
          to={`/cols/${col.id}/details`}
        >
          Informations complètes
        </Button>
        <Button 
          variant="contained" 
          component={Link} 
          to={`/challenges/create?col=${col.id}`}
        >
          Ajouter à un défi
        </Button>
      </Box>
    </Box>
  );
};

// Page principale du catalogue des cols
const ColsCataloguePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [selectedCol, setSelectedCol] = useState(null);
  const [filters, setFilters] = useState({
    region: 'all',
    difficulty: 'all',
    minAltitude: 0,
    maxAltitude: 3000,
    minLength: 0,
    maxLength: 50,
    minGradient: 0,
    maxGradient: 20,
    search: '',
  });
  const [sortOption, setSortOption] = useState('name-asc');

  // Simulation du chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Filtrer les cols en fonction des critères
  const filteredCols = useMemo(() => {
    return mockColsData.filter(col => {
      // Filtre de recherche textuelle
      if (filters.search && !col.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      
      // Filtre par région
      if (filters.region !== 'all' && col.location?.region.toLowerCase() !== filters.region) {
        return false;
      }
      
      // Filtre par difficulté
      if (filters.difficulty !== 'all' && col.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Filtres par plages numériques
      if (col.altitude < filters.minAltitude || col.altitude > filters.maxAltitude) {
        return false;
      }
      
      if (col.distance < filters.minLength || col.distance > filters.maxLength) {
        return false;
      }
      
      if (col.avgGradient < filters.minGradient || col.avgGradient > filters.maxGradient) {
        return false;
      }
      
      return true;
    });
  }, [filters, mockColsData]);

  // Trier les cols
  const sortedCols = useMemo(() => {
    const sorted = [...filteredCols];
    
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'altitude-asc':
        return sorted.sort((a, b) => a.altitude - b.altitude);
      case 'altitude-desc':
        return sorted.sort((a, b) => b.altitude - a.altitude);
      case 'distance-asc':
        return sorted.sort((a, b) => a.distance - b.distance);
      case 'distance-desc':
        return sorted.sort((a, b) => b.distance - a.distance);
      case 'gradient-asc':
        return sorted.sort((a, b) => a.avgGradient - b.avgGradient);
      case 'gradient-desc':
        return sorted.sort((a, b) => b.avgGradient - a.avgGradient);
      case 'rating-desc':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popularity-desc':
        return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      default:
        return sorted;
    }
  }, [filteredCols, sortOption]);

  // Grouper les cols par catégorie pour les onglets
  const groupedCols = useMemo(() => {
    const groups = {
      all: sortedCols,
      famous: sortedCols.filter(col => col.famous),
      mythical: sortedCols.filter(col => col.mythical),
      recent: sortedCols.filter(col => col.recent),
      popular: sortedCols.sort((a, b) => (b.reviews || 0) - (a.reviews || 0)).slice(0, 20),
    };
    
    return groups;
  }, [sortedCols]);

  // Obtenir les cols actuellement affichés selon l'onglet
  const displayedCols = useMemo(() => {
    switch (tabValue) {
      case 0: return groupedCols.all;
      case 1: return groupedCols.famous;
      case 2: return groupedCols.mythical;
      case 3: return groupedCols.recent;
      case 4: return groupedCols.popular;
      default: return groupedCols.all;
    }
  }, [groupedCols, tabValue]);

  // Changement d'onglet
  const handleTabChange = (_, newValue) => {
    setTabValue(newValue);
  };

  // Appliquer des filtres
  const handleFiltersApplied = () => {
    // Réinitialiser la sélection
    setSelectedCol(null);
  };

  // Gérer le changement de tri
  const handleSortChange = (event) => {
    setSortOption(event.target.value);
  };

  // Sélectionner un col
  const handleSelectCol = (col) => {
    setSelectedCol(col);
    
    // Scroller vers le haut sur mobile
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Catalogue des Cols
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Explorez plus de {mockColsData.length} cols avec leurs profils 3D et préparez vos prochains défis
          </Typography>
        </Box>
        
        {/* Filtres */}
        <ColsFilters 
          filters={filters} 
          setFilters={setFilters} 
          onFiltersApplied={handleFiltersApplied} 
        />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 10 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* Liste des cols */}
            <Grid item xs={12} lg={7} xl={8}>
              <Box>
                {/* Onglets et Options de tri */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  mb: 2,
                  gap: 2
                }}>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange}
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons={isMobile ? "auto" : false}
                  >
                    <Tab label={`Tous (${groupedCols.all.length})`} />
                    <Tab label="Célèbres" />
                    <Tab label="Mythiques" />
                    <Tab label="Récents" />
                    <Tab label="Populaires" />
                  </Tabs>
                  
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Trier par</InputLabel>
                    <Select
                      value={sortOption}
                      label="Trier par"
                      onChange={handleSortChange}
                      startAdornment={<Sort sx={{ mr: 1, ml: -0.5 }} />}
                    >
                      <MenuItem value="name-asc">Nom (A-Z)</MenuItem>
                      <MenuItem value="name-desc">Nom (Z-A)</MenuItem>
                      <MenuItem value="altitude-asc">Altitude (croissant)</MenuItem>
                      <MenuItem value="altitude-desc">Altitude (décroissant)</MenuItem>
                      <MenuItem value="distance-asc">Distance (croissant)</MenuItem>
                      <MenuItem value="distance-desc">Distance (décroissant)</MenuItem>
                      <MenuItem value="gradient-asc">Pente (croissant)</MenuItem>
                      <MenuItem value="gradient-desc">Pente (décroissant)</MenuItem>
                      <MenuItem value="rating-desc">Évaluation</MenuItem>
                      <MenuItem value="popularity-desc">Popularité</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Divider sx={{ mb: 3 }} />
                
                {/* Résultats */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {displayedCols.length} résultat{displayedCols.length !== 1 ? 's' : ''}
                  </Typography>
                </Box>
                
                {/* Grille de cols */}
                <Grid container spacing={3}>
                  {displayedCols.length > 0 ? (
                    displayedCols.map(col => (
                      <Grid item key={col.id} xs={12} sm={6} md={4}>
                        <ColCard 
                          col={col} 
                          onSelect={handleSelectCol} 
                          isSelected={selectedCol?.id === col.id}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Box sx={{ 
                        py: 5, 
                        textAlign: 'center',
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                      }}>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          Aucun col ne correspond à vos critères
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Essayez d'ajuster vos filtres pour voir plus de résultats
                        </Typography>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Grid>
            
            {/* Détail du col sélectionné */}
            <Grid item xs={12} lg={5} xl={4}>
              <Box 
                component={Paper} 
                elevation={3} 
                sx={{ 
                  position: { md: 'sticky' }, 
                  top: { md: '100px' }, 
                  p: 3,
                  borderRadius: 2,
                  height: isMobile ? 'auto' : 'calc(100vh - 180px)',
                  overflowY: 'auto',
                }}
              >
                <ColDetail col={selectedCol} />
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </MainLayout>
  );
};

export default ColsCataloguePage;
