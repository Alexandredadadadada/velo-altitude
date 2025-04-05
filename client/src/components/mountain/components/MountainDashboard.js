import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Card, CardContent, CardMedia, CardActionArea, Box, Chip, ToggleButtonGroup, ToggleButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import TerrainIcon from '@mui/icons-material/Terrain';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import HeightIcon from '@mui/icons-material/Height';
import RouteIcon from '@mui/icons-material/Route';
import mountainService from '../../../services/mountainService';
import ColVisualization3D from '../../visualization/ColVisualization3D';
import { useFeatureFlags } from '../../../hooks/useFeatureFlags';
import axios from 'axios';

// Styles personnalisés
const RegionToggleButton = styled(ToggleButton)(({ theme }) => ({
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const ColCard = styled(Card)(({ theme, selected }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  border: selected ? `2px solid ${theme.palette.primary.main}` : 'none',
  transform: selected ? 'translateY(-4px)' : 'none',
  boxShadow: selected ? theme.shadows[8] : theme.shadows[1],
}));

/**
 * MountainDashboard - Tableau de bord pour la sélection et la visualisation des cols
 */
function MountainDashboard({ onRegionChange, onColSelect, selectedRegion = 'alpes', selectedCol }) {
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visualizationData, setVisualizationData] = useState(null);
  const [visualizationLoading, setVisualizationLoading] = useState(false);
  const { enableColSpecificTraining, enableColSpecificNutrition } = useFeatureFlags();
  const [stats, setStats] = useState({
    totalCols: 0,
    averageAltitude: 0,
    averageDifficulty: 0,
    regionDistribution: {}
  });

  // État local pour stocker la région et le col sélectionnés si les props ne sont pas fournies
  const [localSelectedRegion, setLocalSelectedRegion] = useState(selectedRegion || 'alpes');
  const [localSelectedCol, setLocalSelectedCol] = useState(null);

  // Déterminer les valeurs réelles à utiliser
  const effectiveSelectedRegion = selectedRegion || localSelectedRegion;
  const effectiveSelectedCol = selectedCol || localSelectedCol;

  useEffect(() => {
    // Fonction pour charger les cols en fonction de la région sélectionnée
    const fetchCols = async () => {
      setLoading(true);
      try {
        const colsData = await mountainService.getCols({ region: effectiveSelectedRegion });
        
        setCols(colsData || mockCols); // Utiliser les données mockées en cas d'erreur
        
        // Calculer les statistiques
        if (colsData && colsData.length > 0) {
          calculateStats(colsData);
        } else {
          calculateStats(mockCols);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des cols:", error);
        setCols(mockCols);
        calculateStats(mockCols);
      } finally {
        setLoading(false);
      }
    };

    fetchCols();
  }, [effectiveSelectedRegion]);

  // Charger les données de visualisation 3D lorsqu'un col est sélectionné
  useEffect(() => {
    const fetch3DData = async () => {
      if (!effectiveSelectedCol) return;
      
      setVisualizationLoading(true);
      try {
        const data = await mountainService.getCol3DVisualizationData(effectiveSelectedCol.id);
        setVisualizationData(data);
      } catch (error) {
        console.error("Erreur lors du chargement des données 3D:", error);
        setVisualizationData(null);
      } finally {
        setVisualizationLoading(false);
      }
    };

    fetch3DData();
  }, [effectiveSelectedCol]);

  // Calcul des statistiques pour le dashboard
  const calculateStats = (colsData) => {
    const totalCols = colsData.length;
    const totalAltitude = colsData.reduce((sum, col) => sum + col.altitude, 0);
    const totalDifficulty = colsData.reduce((sum, col) => sum + col.difficulty, 0);
    
    // Distribution par région
    const regions = {};
    colsData.forEach(col => {
      if (!regions[col.region]) {
        regions[col.region] = 0;
      }
      regions[col.region]++;
    });

    setStats({
      totalCols,
      averageAltitude: totalAltitude / totalCols,
      averageDifficulty: totalDifficulty / totalCols,
      regionDistribution: regions
    });
  };

  const handleRegionChange = (event, newRegion) => {
    if (newRegion !== null) {
      if (onRegionChange) {
        onRegionChange(newRegion);
      } else {
        setLocalSelectedRegion(newRegion);
      }
    }
  };

  const handleColClick = (col) => {
    if (onColSelect) {
      onColSelect(col);
    } else {
      setLocalSelectedCol(col);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Sélecteur de région */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Sélection de région</Typography>
          <ToggleButtonGroup
            value={effectiveSelectedRegion}
            exclusive
            onChange={handleRegionChange}
            aria-label="région de cols"
            color="primary"
            fullWidth
          >
            <RegionToggleButton value="alpes" aria-label="Alpes">
              Alpes
            </RegionToggleButton>
            <RegionToggleButton value="pyrenees" aria-label="Pyrénées">
              Pyrénées
            </RegionToggleButton>
            <RegionToggleButton value="dolomites" aria-label="Dolomites">
              Dolomites
            </RegionToggleButton>
            <RegionToggleButton value="ardennes" aria-label="Ardennes/Flandres">
              Ardennes/Flandres
            </RegionToggleButton>
          </ToggleButtonGroup>
        </Paper>
      </Grid>
      
      {/* Statistiques */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Statistiques
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <HeightIcon color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h6">{Math.round(stats.averageAltitude)}m</Typography>
                    <Typography variant="body2" color="text.secondary">Altitude moyenne</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <WhatshotIcon color="warning" sx={{ fontSize: 40 }} />
                    <Typography variant="h6">{stats.averageDifficulty.toFixed(1)}/10</Typography>
                    <Typography variant="body2" color="text.secondary">Difficulté moyenne</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    {stats.totalCols} cols disponibles
                  </Typography>
                  
                  {effectiveSelectedCol && (
                    <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Col sélectionné: {effectiveSelectedCol.name}
                      </Typography>
                      <Typography variant="body2">
                        Altitude: {effectiveSelectedCol.altitude}m
                      </Typography>
                      <Typography variant="body2">
                        Longueur: {effectiveSelectedCol.length}km à {effectiveSelectedCol.gradient}%
                      </Typography>
                      <Typography variant="body2">
                        Difficulté: {effectiveSelectedCol.difficulty}/10
                      </Typography>
                      
                      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {enableColSpecificTraining && (
                          <Chip 
                            label="Entraînement" 
                            color="primary"
                            size="small"
                            onClick={() => window.location.href = `/mountain/training?colId=${effectiveSelectedCol.id}`}
                          />
                        )}
                        {enableColSpecificNutrition && (
                          <Chip 
                            label="Nutrition" 
                            color="secondary"
                            size="small"
                            onClick={() => window.location.href = `/mountain/nutrition?colId=${effectiveSelectedCol.id}`}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Liste des cols */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cols {effectiveSelectedRegion.charAt(0).toUpperCase() + effectiveSelectedRegion.slice(1)}
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {cols.map((col) => (
                <Grid item xs={12} sm={6} md={4} key={col.id}>
                  <ColCard selected={effectiveSelectedCol && effectiveSelectedCol.id === col.id}>
                    <CardActionArea onClick={() => handleColClick(col)}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={col.image}
                        alt={col.name}
                      />
                      <CardContent>
                        <Typography gutterBottom variant="h6" component="div" noWrap>
                          {col.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          <Chip 
                            icon={<HeightIcon />} 
                            label={`${col.altitude}m`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                          <Chip 
                            icon={<WhatshotIcon />} 
                            label={`Difficulté: ${col.difficulty}/10`} 
                            size="small"
                            color={col.difficulty > 7 ? "error" : col.difficulty > 5 ? "warning" : "success"}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          <RouteIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {col.length}km @ {col.gradient}%
                          </Typography>
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </ColCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Grid>
      
      {/* Visualisation 3D du col */}
      {effectiveSelectedCol && (
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Visualisation 3D: {effectiveSelectedCol.name}
            </Typography>
            
            {visualizationLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
              </Box>
            ) : visualizationData ? (
              <ColVisualization3D 
                passId={effectiveSelectedCol.id}
                elevationData={visualizationData.elevationData}
                surfaceTypes={visualizationData.surfaceTypes}
                pointsOfInterest={visualizationData.pointsOfInterest}
              />
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  Données de visualisation 3D non disponibles pour ce col.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      )}
    </Grid>
  );
}

// Données mockées pour le développement
const mockCols = [
  {
    id: 1,
    name: "Col du Galibier",
    region: "alpes",
    altitude: 2642,
    length: 23,
    gradient: 5.5,
    difficulty: 8.5,
    image: "https://www.cyclingcols.com/sites/default/files/col/galibier%20S%20%2810%29.jpg"
  },
  {
    id: 2,
    name: "Alpe d'Huez",
    region: "alpes",
    altitude: 1860,
    length: 13.8,
    gradient: 8.1,
    difficulty: 8.0,
    image: "https://www.cyclingcols.com/sites/default/files/col/alpe_d_huez.jpg"
  },
  {
    id: 3,
    name: "Col du Tourmalet",
    region: "pyrenees",
    altitude: 2115,
    length: 19,
    gradient: 7.4,
    difficulty: 8.8,
    image: "https://www.cyclingcols.com/sites/default/files/col/tourmalet.jpg"
  },
  {
    id: 4,
    name: "Stelvio",
    region: "dolomites",
    altitude: 2758,
    length: 24.3,
    gradient: 7.4,
    difficulty: 9.2,
    image: "https://www.cyclingcols.com/sites/default/files/col/stelvio%20N%20%281%29.jpg"
  },
  {
    id: 5,
    name: "Mur de Huy",
    region: "ardennes",
    altitude: 204,
    length: 1.3,
    gradient: 9.6,
    difficulty: 7.0,
    image: "https://www.cyclingcols.com/sites/default/files/col/huy%20%285%29.JPG"
  },
  {
    id: 6,
    name: "Col d'Izoard",
    region: "alpes",
    altitude: 2360,
    length: 19,
    gradient: 6.0,
    difficulty: 7.5,
    image: "https://www.cyclingcols.com/sites/default/files/col/izoard%20north%20%287%29.jpg"
  }
];

export default MountainDashboard;
