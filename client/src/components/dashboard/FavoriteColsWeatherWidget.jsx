import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  Grid,
  useTheme,
  alpha,
  Button,
  Skeleton,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import RefreshIcon from '@mui/icons-material/Refresh';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import AirIcon from '@mui/icons-material/Air';
import OpacityIcon from '@mui/icons-material/Opacity';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useNavigate } from 'react-router-dom';

// Utiliser le composant de prévision météo existant
import ColWeatherForecast from '../cols/ColWeatherForecast';

/**
 * Widget météo pour les cols favoris sur le dashboard
 * Affiche les prévisions météo pour les cols que l'utilisateur a mis en favoris
 */
const FavoriteColsWeatherWidget = ({ favoriteCols = [], maxCols = 3 }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedColIndex, setSelectedColIndex] = useState(0);
  const [displayCols, setDisplayCols] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Préparer les cols favoris pour l'affichage
  useEffect(() => {
    const loadFavoriteCols = async () => {
      setLoading(true);
      
      // Limiter le nombre de cols affichés
      const colsToDisplay = favoriteCols.slice(0, maxCols);
      
      setDisplayCols(colsToDisplay);
      
      // Si aucun col n'est sélectionné et nous avons des cols à afficher
      if (colsToDisplay.length > 0 && selectedColIndex >= colsToDisplay.length) {
        setSelectedColIndex(0);
      }
      
      setLoading(false);
    };
    
    loadFavoriteCols();
  }, [favoriteCols, maxCols]);
  
  // Gérer le changement de col
  const handleColChange = (event, newValue) => {
    setSelectedColIndex(newValue);
  };
  
  // Rafraîchir les données météo
  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simuler un temps de chargement
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };
  
  // Si aucun col favori n'est disponible
  if (displayCols.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 200
        }}
      >
        <FavoriteBorderIcon sx={{ color: alpha(theme.palette.primary.main, 0.3), fontSize: 40, mb: 2 }} />
        <Typography variant="body1" color="text.secondary" align="center">
          Aucun col favori sélectionné
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          size="small" 
          sx={{ mt: 2 }}
          onClick={() => navigate('/cols')}
        >
          Explorer les cols
        </Button>
      </Paper>
    );
  }
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  const selectedCol = displayCols[selectedColIndex];
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        bgcolor: 'background.paper',
        boxShadow: theme.shadows[1],
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          <WbSunnyIcon sx={{ mr: 1, fontSize: '1.2rem', color: 'primary.main' }} />
          Météo des cols favoris
        </Typography>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Rafraîchir">
            <IconButton 
              size="small" 
              color="primary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <RefreshIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Voir la météo détaillée">
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => navigate(`/cols/${selectedCol.id}`)} 
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
      
      {/* Navigation entre les cols favoris */}
      <Paper
        elevation={0}
        sx={{ 
          mb: 2, 
          bgcolor: alpha(theme.palette.primary.light, 0.08),
          borderRadius: '20px',
          overflow: 'hidden'
        }}
      >
        <Tabs
          value={selectedColIndex}
          onChange={handleColChange}
          variant={displayCols.length > 3 ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          sx={{
            minHeight: 'auto',
            '& .MuiTab-root': {
              minHeight: 40,
              px: 2,
              py: 1,
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600
              }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          {displayCols.map((col, index) => (
            <Tab 
              key={col.id} 
              label={col.name}
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
              }}
              icon={
                <Box 
                  component="img"
                  src={col.images?.thumbnail || '/images/cols/default-thumb.jpg'} 
                  alt={col.name}
                  sx={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%',
                    mr: 1,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, 0.1),
                    display: { xs: 'none', sm: 'inline-flex' }
                  }}
                />
              }
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>
      
      {/* Affichage de la météo pour le col sélectionné */}
      <motion.div
        key={selectedColIndex}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ flex: 1 }}
      >
        {loading ? (
          <Box sx={{ p: 3 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          </Box>
        ) : (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedCol.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ flex: 1 }}
              >
                {selectedCol && (
                  <ColWeatherForecast col={selectedCol} embedded={true} />
                )}
              </motion.div>
            </AnimatePresence>
          </Box>
        )}
      </motion.div>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" align="center" display="block">
          Données météo mises à jour toutes les 3 heures
        </Typography>
      </Box>
    </Paper>
  );
};

export default FavoriteColsWeatherWidget;
