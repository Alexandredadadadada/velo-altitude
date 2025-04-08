import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Container, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Typography, 
  Paper,
  Grid,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Info as InfoIcon,
  Terrain as TerrainIcon,
  PublicOutlined as MapIcon,
  BarChart as ChartIcon,
  ThreeDRotation as ThreeDIcon
} from '@mui/icons-material';

// Import subcomponents
import { WeatherSystem } from './WeatherSystem';
import { SEOManager } from './SEOManager';

// Import types
import { ColDetailProps, ColData, WeatherData, ElevationPoint } from './types';

/**
 * Hook personnalisé pour gérer les données du col
 */
const useColDataManager = (colId: string, initialData?: ColData) => {
  const [colData, setColData] = useState<ColData | null>(initialData || null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [elevationProfile, setElevationProfile] = useState<ElevationPoint[]>([]);
  const [terrainData, setTerrainData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchColData = async () => {
      if (initialData) {
        setColData(initialData);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Service API pour récupérer les données du col
        const colService = await import('../../../services/colService').then(module => module.default);
        
        // Charger les données principales du col
        const data = await colService.getColById(colId);
        setColData(data);
        
        // Charger les données d'élévation
        const elevData = await colService.getColElevationData(colId);
        setElevationProfile(elevData);
        
        // Charger les données météo
        const weatherService = await import('../../../services/weatherService').then(module => module.default);
        const weather = await weatherService.getColWeather(colId);
        setWeatherData(weather);
        
        // Charger les données de terrain 3D
        const terrainData = await colService.getCol3DTerrainData(colId);
        setTerrainData(terrainData);
        
        setLoading(false);
      } catch (err: any) {
        console.error('[ColDetail] Erreur lors du chargement des données:', err);
        setError(err.message || 'Erreur lors du chargement des données du col');
        setLoading(false);
      }
    };

    if (colId) {
      fetchColData();
    }
  }, [colId, initialData]);

  return {
    colData,
    weatherData,
    elevationProfile,
    terrainData,
    loading,
    error
  };
};

/**
 * Hook personnalisé pour la gestion du SEO
 */
const useSEOManager = (colData: ColData | null) => {
  return {
    title: colData ? `${colData.name} - Col des Vosges` : 'Détail du Col',
    description: colData 
      ? `Découvrez le Col ${colData.name}: ${colData.stats.length}km, dénivelé ${colData.stats.elevation}m, pente moyenne ${colData.stats.avgGradient}%`
      : 'Informations détaillées sur les cols cyclistes',
    colData
  };
};

/**
 * Hook personnalisé pour le système de cache
 */
const useCacheSystem = () => {
  const [cache, setCache] = useState<Map<string, any>>(new Map());
  
  const addToCache = useCallback((key: string, data: any, expiresIn: number = 1800000) => {
    const item = {
      data,
      expires: Date.now() + expiresIn
    };
    setCache(prevCache => new Map(prevCache.set(key, item)));
  }, []);
  
  const getFromCache = useCallback((key: string): any | null => {
    if (!cache.has(key)) return null;
    
    const item = cache.get(key);
    if (Date.now() > item.expires) {
      const newCache = new Map(cache);
      newCache.delete(key);
      setCache(newCache);
      return null;
    }
    
    return item.data;
  }, [cache]);
  
  const clearCache = useCallback(() => {
    setCache(new Map());
  }, []);
  
  return {
    addToCache,
    getFromCache,
    clearCache
  };
};

/**
 * Composant unifié pour l'affichage des détails d'un col
 * Intègre toutes les fonctionnalités dans un système modulaire et optimisé
 */
export const UnifiedColDetail: React.FC<ColDetailProps> = ({
  colId,
  initialData,
  config = {
    showWeather: true,
    show3D: true,
    showDetails: true,
    showMap: true
  }
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Onglet actif
  const [activeTab, setActiveTab] = useState<string>(config.defaultTab || 'info');
  
  // Système unifié de gestion des données
  const {
    colData,
    weatherData,
    elevationProfile,
    terrainData,
    loading,
    error
  } = useColDataManager(colId, initialData);

  // SEO optimisé
  const seoConfig = useSEOManager(colData);

  // Système de cache unifié
  const cache = useCacheSystem();
  
  // Gérer le changement d'onglet
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
  }, []);
  
  // Afficher le chargement
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={300} flexDirection="column" p={3}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Chargement des données du col...
        </Typography>
      </Box>
    );
  }
  
  // Afficher une erreur
  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'error.light', borderRadius: 1 }}>
        <Typography color="error" variant="subtitle1" fontWeight="medium" gutterBottom>
          Erreur de chargement
        </Typography>
        <Typography variant="body2">
          {error}
        </Typography>
      </Paper>
    );
  }
  
  // Si aucun col n'est trouvé
  if (!colData) {
    return (
      <Paper elevation={0} sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
        <Typography variant="subtitle1" align="center">
          Aucune information disponible pour ce col
        </Typography>
      </Paper>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 3, mb: 5 }}>
      {/* Optimization SEO */}
      <SEOManager {...seoConfig} />
      
      {/* En-tête du col */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: isMobile ? 2 : 3, 
          mb: 3, 
          backgroundImage: colData.images && colData.images.length > 0
            ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4)), url('/images/cols/${colData.id}/${colData.images[0]}')`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: colData.images && colData.images.length > 0 ? 'white' : 'inherit'
        }}
      >
        <Box>
          <Typography 
            variant={isMobile ? 'h5' : 'h4'} 
            component="h1" 
            gutterBottom
            sx={{ fontWeight: 'bold' }}
          >
            {colData.name}
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography variant="body1">
                  {colData.location.region}, {colData.location.country}
                </Typography>
                <Typography variant="h6" component="p">
                  {colData.stats.elevation}m d'altitude • {colData.stats.length}km
                </Typography>
                <Typography variant="body1">
                  Pente moyenne: {colData.stats.avgGradient}% • Max: {colData.stats.maxGradient}%
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent={isMobile ? 'flex-start' : 'flex-end'} pt={isMobile ? 1 : 0}>
                {/* Ici, on pourrait ajouter des badges ou des actions rapides */}
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Système d'onglets */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab 
            label="Informations" 
            value="info" 
            icon={<InfoIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Profil" 
            value="profile" 
            icon={<ChartIcon />}
            iconPosition="start"
          />
          {config.showMap && (
            <Tab 
              label="Carte" 
              value="map" 
              icon={<MapIcon />}
              iconPosition="start"
            />
          )}
          {config.show3D && (
            <Tab 
              label="3D" 
              value="3d" 
              icon={<ThreeDIcon />}
              iconPosition="start"
            />
          )}
          <Tab 
            label="Terrain" 
            value="terrain" 
            icon={<TerrainIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* Contenu des onglets */}
      <Box>
        {/* Onglet Informations */}
        {activeTab === 'info' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={7}>
              {/* Informations principales */}
              <Paper elevation={1} sx={{ p: isMobile ? 2 : 3, height: '100%' }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  À propos de ce col
                </Typography>
                <Typography variant="body1" paragraph>
                  {colData.description || `Le Col ${colData.name} est situé dans la région ${colData.location.region}. 
                  Il offre une ascension de ${colData.stats.length}km avec un dénivelé de ${colData.stats.elevation}m.`}
                </Typography>
                
                {colData.sides && colData.sides.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Versants
                    </Typography>
                    <Grid container spacing={2}>
                      {colData.sides.map((side, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              {side.name}
                            </Typography>
                            <Typography variant="body2">
                              Départ: {side.startLocation}
                            </Typography>
                            <Typography variant="body2">
                              Distance: {side.length}km
                            </Typography>
                            <Typography variant="body2">
                              Dénivelé: {side.elevation}m
                            </Typography>
                            <Typography variant="body2">
                              Pente moyenne: {side.avgGradient}%
                            </Typography>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6} lg={5}>
              {/* Météo */}
              {config.showWeather && (
                <WeatherSystem 
                  data={weatherData} 
                  colName={colData.name}
                  elevation={colData.stats.elevation}
                />
              )}
            </Grid>
          </Grid>
        )}
        
        {/* Implémentation des autres onglets */}
        {activeTab === 'profile' && (
          <Box>
            {/* On pourrait importer dynamiquement le composant de graphique d'élévation */}
            <Typography variant="body1">
              Chargement du profil d'élévation...
            </Typography>
          </Box>
        )}
        
        {activeTab === 'map' && config.showMap && (
          <Box>
            {/* Ici on pourrait importer dynamiquement le composant de carte */}
            <Typography variant="body1">
              Chargement de la carte...
            </Typography>
          </Box>
        )}
        
        {activeTab === '3d' && config.show3D && (
          <Box>
            {/* Ici on pourrait importer dynamiquement le composant de visualisation 3D */}
            <Typography variant="body1">
              Chargement de la visualisation 3D...
            </Typography>
          </Box>
        )}
        
        {activeTab === 'terrain' && (
          <Box>
            {/* Ici on pourrait afficher les détails du terrain */}
            <Typography variant="body1">
              Chargement des données de terrain...
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

// Export des fonctions et hooks pour réutilisation
export { useColDataManager, useSEOManager, useCacheSystem };

export default UnifiedColDetail;
