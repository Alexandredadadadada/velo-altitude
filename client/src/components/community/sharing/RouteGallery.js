import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Avatar,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Paper,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MapIcon from '@mui/icons-material/Map';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DownloadIcon from '@mui/icons-material/Download';
import CommentIcon from '@mui/icons-material/Comment';
import TerrainIcon from '@mui/icons-material/Terrain';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';

const FilterBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
  },
}));

const RouteCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const NoResultsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: 'center',
  backgroundColor: '#f5f5f5',
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  paddingTop: '56.25%', // 16:9 ratio
  position: 'relative',
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(1, 2),
  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const StyledLink = styled(Link)({
  textDecoration: 'none',
  color: 'inherit',
  display: 'block',
  height: '100%',
});

// Options de filtrage
const difficultyOptions = [
  { value: 'all', label: 'Toutes difficultés' },
  { value: 'facile', label: 'Facile' },
  { value: 'modere', label: 'Modéré' },
  { value: 'difficile', label: 'Difficile' },
  { value: 'tres-difficile', label: 'Très difficile' },
  { value: 'extreme', label: 'Extrême' }
];

const regionOptions = [
  { value: 'all', label: 'Toutes régions' },
  { value: 'alpes', label: 'Alpes' },
  { value: 'pyrenees', label: 'Pyrénées' },
  { value: 'vosges', label: 'Vosges' },
  { value: 'jura', label: 'Jura' },
  { value: 'massif-central', label: 'Massif Central' }
];

const sortOptions = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'popular', label: 'Plus populaires' },
  { value: 'distance-asc', label: 'Distance (croissante)' },
  { value: 'distance-desc', label: 'Distance (décroissante)' },
  { value: 'elevation-asc', label: 'Dénivelé (croissant)' },
  { value: 'elevation-desc', label: 'Dénivelé (décroissant)' }
];

const RouteGallery = () => {
  const navigate = useNavigate();
  const { sharedRoutes, loading, likeRoute } = useCommunity();
  
  // État des filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [likedRoutes, setLikedRoutes] = useState({}); // Pour gérer l'état des likes côté client
  
  // Appliquer les filtres et le tri
  const filteredRoutes = useMemo(() => {
    let result = [...sharedRoutes];
    
    // Filtrer par terme de recherche
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        route => route.title.toLowerCase().includes(lowerTerm) || 
                (route.description && route.description.toLowerCase().includes(lowerTerm))
      );
    }
    
    // Filtrer par difficulté
    if (difficultyFilter !== 'all') {
      result = result.filter(route => route.difficulty === difficultyFilter);
    }
    
    // Filtrer par région
    if (regionFilter !== 'all') {
      result = result.filter(
        route => route.region && route.region.toLowerCase().includes(regionFilter.toLowerCase())
      );
    }
    
    // Trier les résultats
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'popular':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'distance-asc':
        result.sort((a, b) => a.distance - b.distance);
        break;
      case 'distance-desc':
        result.sort((a, b) => b.distance - a.distance);
        break;
      case 'elevation-asc':
        result.sort((a, b) => a.elevation - b.elevation);
        break;
      case 'elevation-desc':
        result.sort((a, b) => b.elevation - a.distance);
        break;
      default:
        break;
    }
    
    return result;
  }, [sharedRoutes, searchTerm, difficultyFilter, regionFilter, sortBy]);
  
  const handleLike = async (event, routeId) => {
    event.preventDefault();
    event.stopPropagation();
    
    try {
      await likeRoute(routeId);
      setLikedRoutes(prev => ({
        ...prev,
        [routeId]: true
      }));
    } catch (error) {
      console.error('Error liking route:', error);
    }
  };
  
  const getRouteImage = (route) => {
    return route.images && route.images.length > 0 
      ? route.images[0] 
      : '/images/routes/default-route.jpg';
  };
  
  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'facile': return 'success';
      case 'modere': return 'info';
      case 'difficile': return 'warning';
      case 'tres-difficile': case 'extreme': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="40%" height={30} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={80} sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rectangular" width="100%" height={300} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Itinéraires partagés
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Découvrez et partagez les plus beaux itinéraires cyclistes
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/community/routes/create')}
        >
          Partager un itinéraire
        </Button>
      </Box>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Rechercher un itinéraire..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      <FilterBar>
        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
          <InputLabel>Difficulté</InputLabel>
          <Select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            label="Difficulté"
          >
            {difficultyOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
          <InputLabel>Région</InputLabel>
          <Select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            label="Région"
          >
            {regionOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl sx={{ minWidth: 200, flexGrow: 1 }}>
          <InputLabel>Trier par</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Trier par"
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </FilterBar>
      
      <Divider sx={{ mb: 3 }} />
      
      {filteredRoutes.length === 0 ? (
        <NoResultsContainer>
          <Typography variant="h6" color="textSecondary" sx={{ mb: 2 }}>
            Aucun itinéraire ne correspond à vos critères
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/community/routes/create')}
          >
            Partager un nouvel itinéraire
          </Button>
        </NoResultsContainer>
      ) : (
        <Grid container spacing={3}>
          {filteredRoutes.map((route) => (
            <Grid item xs={12} sm={6} md={4} key={route.id}>
              <StyledLink to={`/community/routes/${route.id}`}>
                <RouteCard>
                  <StyledCardMedia
                    image={getRouteImage(route)}
                    title={route.title}
                  >
                    <CardOverlay>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          src={route.author.avatar} 
                          alt={route.author.name} 
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        <Typography variant="body2">
                          {route.author.name}
                        </Typography>
                      </Box>
                      <Typography variant="caption">
                        {formatDistanceToNow(new Date(route.createdAt), { addSuffix: true, locale: fr })}
                      </Typography>
                    </CardOverlay>
                  </StyledCardMedia>
                  
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {route.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      <Chip 
                        icon={<MapIcon />} 
                        label={`${route.distance} km`} 
                        size="small" 
                        variant="outlined" 
                      />
                      <Chip 
                        icon={<TerrainIcon />} 
                        label={`${route.elevation} m`} 
                        size="small" 
                        variant="outlined" 
                      />
                      {route.difficulty && (
                        <Chip 
                          label={route.difficulty}
                          size="small"
                          color={getDifficultyColor(route.difficulty)}
                          variant="outlined"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" color="textSecondary" sx={{ 
                      mb: 1, 
                      display: '-webkit-box',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {route.description}
                    </Typography>
                    
                    {route.colsIncluded && route.colsIncluded.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary">
                          Cols: {route.colsIncluded.join(', ')}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleLike(e, route.id)}
                        color={likedRoutes[route.id] ? 'primary' : 'default'}
                      >
                        {likedRoutes[route.id] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <Typography variant="body2" sx={{ mr: 2 }}>
                        {likedRoutes[route.id] ? route.likes + 1 : route.likes}
                      </Typography>
                      
                      <CommentIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2" sx={{ mr: 2 }}>
                        {route.comments}
                      </Typography>
                      
                      <DownloadIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                      <Typography variant="body2">
                        {route.downloads}
                      </Typography>
                    </Box>
                  </CardActions>
                </RouteCard>
              </StyledLink>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default RouteGallery;
