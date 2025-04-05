import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  IconButton, 
  Chip, 
  Divider, 
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  CompareArrows, 
  Close, 
  Add, 
  TrendingUp, 
  Speed, 
  Terrain, 
  Delete,
  CloudDownload,
  BarChart,
  Share
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip as ChartTooltip } from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRoad, faTree, faSun, faSnowflake, faLeaf, faWind } from '@fortawesome/free-solid-svg-icons';

// Service fictif pour obtenir les données des cols
const getColById = (id) => {
  // Simulation de récupération de données
  return new Promise((resolve) => {
    setTimeout(() => {
      // Données fictives pour la démo
      const cols = [
        {
          id: 'alpe-dhuez',
          name: "L'Alpe d'Huez",
          region: 'Alpes',
          country: 'France',
          elevation: 1860,
          length: 13.8,
          avgGradient: 8.1,
          maxGradient: 13,
          difficulty: 4,
          surface: 'Asphalte',
          hairpins: 21,
          seasons: ['spring', 'summer', 'fall'],
          description: "L'Alpe d'Huez est l'ascension légendaire du Tour de France, célèbre pour ses 21 virages en épingle numérotés.",
          image: "/assets/cols/alpe-dhuez.jpg",
          technicalDifficulty: 3,
          popularity: 9.8,
          scenicBeauty: 9.5,
          trafficDensity: 'Élevée en été',
          climateInfo: 'Température moyenne en été: 18°C',
          localServices: 'Nombreux cafés, magasins et services en station',
          tourAppearances: 31,
          recordTime: '37:35 (Marco Pantani, 1997)'
        },
        {
          id: 'tourmalet',
          name: "Col du Tourmalet",
          region: 'Pyrénées',
          country: 'France',
          elevation: 2115,
          length: 19,
          avgGradient: 7.4,
          maxGradient: 10.5,
          difficulty: 5,
          surface: 'Asphalte',
          hairpins: 10,
          seasons: ['summer', 'fall'],
          description: "Le Tourmalet est le col le plus fréquemment inclus dans le Tour de France. C'est le plus haut col routier des Pyrénées.",
          image: "/assets/cols/tourmalet.jpg",
          technicalDifficulty: 4,
          popularity: 9.5,
          scenicBeauty: 9.7,
          trafficDensity: 'Modérée',
          climateInfo: 'Température moyenne en été: 14°C',
          localServices: 'Refuges et restaurants au sommet',
          tourAppearances: 87,
          recordTime: '48:23 (Thibaut Pinot, 2019)'
        },
        {
          id: 'ventoux',
          name: "Mont Ventoux",
          region: 'Provence',
          country: 'France',
          elevation: 1909,
          length: 21.5,
          avgGradient: 7.5,
          maxGradient: 12,
          difficulty: 5,
          surface: 'Asphalte',
          hairpins: 7,
          seasons: ['spring', 'summer', 'fall'],
          description: "Surnommé le 'Géant de Provence', le Mont Ventoux est célèbre pour son paysage lunaire et son sommet balayé par le vent.",
          image: "/assets/cols/ventoux.jpg",
          technicalDifficulty: 4,
          popularity: 9.6,
          scenicBeauty: 9.8,
          trafficDensity: 'Élevée en saison',
          climateInfo: 'Conditions météo changeantes, vent fort',
          localServices: 'Restaurant et boutique souvenir au sommet',
          tourAppearances: 23,
          recordTime: '55:51 (Iban Mayo, 2004)'
        },
        {
          id: 'galibier',
          name: "Col du Galibier",
          region: 'Alpes',
          country: 'France',
          elevation: 2642,
          length: 23,
          avgGradient: 5.5,
          maxGradient: 10.1,
          difficulty: 4,
          surface: 'Asphalte',
          hairpins: 14,
          seasons: ['summer'],
          description: "Le Galibier est l'un des plus beaux cols des Alpes, offrant une vue spectaculaire sur les montagnes environnantes.",
          image: "/assets/cols/galibier.jpg",
          technicalDifficulty: 3,
          popularity: 9.3,
          scenicBeauty: 9.9,
          trafficDensity: 'Modérée',
          climateInfo: 'Souvent fermé jusqu'en juin à cause de la neige',
          localServices: 'Peu de services au sommet',
          tourAppearances: 60,
          recordTime: '1:02:15 (Marco Pantani, 1998)'
        },
        {
          id: 'stelvio',
          name: "Passo dello Stelvio",
          region: 'Alpes',
          country: 'Italie',
          elevation: 2758,
          length: 24.3,
          avgGradient: 7.4,
          maxGradient: 14,
          difficulty: 5,
          surface: 'Asphalte',
          hairpins: 48,
          seasons: ['summer'],
          description: "Le Stelvio est célèbre pour ses 48 virages en épingle et est considéré comme l'une des plus belles routes des Alpes.",
          image: "/assets/cols/stelvio.jpg",
          technicalDifficulty: 5,
          popularity: 9.7,
          scenicBeauty: 10,
          trafficDensity: 'Élevée en été',
          climateInfo: 'Ouvert seulement de juin à octobre',
          localServices: 'Hôtels et restaurants au sommet',
          tourAppearances: 12,
          recordTime: '1:07:34 (Marco Pantani, 1994)'
        },
        {
          id: 'grand-colombier',
          name: "Grand Colombier",
          region: 'Jura',
          country: 'France',
          elevation: 1501,
          length: 17.4,
          avgGradient: 7.1,
          maxGradient: 14,
          difficulty: 4,
          surface: 'Asphalte',
          hairpins: 6,
          seasons: ['spring', 'summer', 'fall'],
          description: "Le Grand Colombier offre quatre routes d'ascension différentes, toutes présentant des défis uniques.",
          image: "/assets/cols/grand-colombier.jpg",
          technicalDifficulty: 3,
          popularity: 8.5,
          scenicBeauty: 9.1,
          trafficDensity: 'Faible',
          climateInfo: 'Accessible presque toute l'année',
          localServices: 'Peu de services',
          tourAppearances: 5,
          recordTime: '41:20 (Primož Roglič, 2020)'
        },
        {
          id: 'croix-fer',
          name: "Col de la Croix de Fer",
          region: 'Alpes',
          country: 'France',
          elevation: 2067,
          length: 29,
          avgGradient: 5.2,
          maxGradient: 11,
          difficulty: 4,
          surface: 'Asphalte',
          hairpins: 12,
          seasons: ['summer', 'fall'],
          description: "Le Col de la Croix de Fer traverse un paysage sauvage et impressionnant avec de nombreux lacs alpins.",
          image: "/assets/cols/croix-fer.jpg",
          technicalDifficulty: 3,
          popularity: 8.6,
          scenicBeauty: 9.4,
          trafficDensity: 'Modérée',
          climateInfo: 'Généralement ouvert de mai à octobre',
          localServices: 'Restaurant au sommet',
          tourAppearances: 19,
          recordTime: '1:15:23 (Romain Bardet, 2018)'
        }
      ];
      
      const col = cols.find(c => c.id === id);
      resolve(col || null);
    }, 500);
  });
};

/**
 * Composant de comparaison des cols cyclistes
 * Permet aux utilisateurs de comparer plusieurs cols côte à côte
 */
const ColsComparison = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  
  // État pour les cols à comparer
  const [selectedCols, setSelectedCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les cols depuis les paramètres d'URL au chargement
  useEffect(() => {
    const loadColsFromUrl = async () => {
      const params = new URLSearchParams(location.search);
      const colIds = params.get('cols')?.split(',') || [];
      
      if (colIds.length > 0) {
        setLoading(true);
        try {
          const colPromises = colIds.map(id => getColById(id));
          const loadedCols = await Promise.all(colPromises);
          // Filtrer les cols qui n'ont pas été trouvés
          const validCols = loadedCols.filter(col => col !== null);
          setSelectedCols(validCols);
        } catch (err) {
          console.error('Erreur lors du chargement des cols:', err);
          setError('Impossible de charger les données des cols sélectionnés.');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadColsFromUrl();
  }, [location.search]);

  // Mise à jour de l'URL lorsque les cols sélectionnés changent
  useEffect(() => {
    if (selectedCols.length > 0) {
      const colIds = selectedCols.map(col => col.id).join(',');
      navigate(`/cols/compare?cols=${colIds}`, { replace: true });
    } else {
      navigate('/cols/compare', { replace: true });
    }
  }, [selectedCols, navigate]);

  // Ajouter un col à la comparaison
  const handleAddCol = useCallback(async (colId) => {
    if (selectedCols.some(col => col.id === colId)) {
      return; // Le col est déjà dans la liste
    }
    
    setLoading(true);
    try {
      const col = await getColById(colId);
      if (col) {
        setSelectedCols(prev => [...prev, col]);
      }
    } catch (err) {
      setError('Impossible d\'ajouter ce col à la comparaison.');
    } finally {
      setLoading(false);
    }
  }, [selectedCols]);

  // Supprimer un col de la comparaison
  const handleRemoveCol = useCallback((colId) => {
    setSelectedCols(prev => prev.filter(col => col.id !== colId));
  }, []);

  // Effacer tous les cols
  const handleClearAll = useCallback(() => {
    setSelectedCols([]);
  }, []);

  // Format des données pour le graphique de comparaison d'élévation
  const getElevationChartData = useCallback(() => {
    return selectedCols.map(col => ({
      name: col.name,
      elevation: col.elevation,
    }));
  }, [selectedCols]);

  // Format des données pour le graphique de comparaison de difficulté
  const getDifficultyChartData = useCallback(() => {
    return selectedCols.map(col => ({
      name: col.name,
      avgGradient: col.avgGradient,
      maxGradient: col.maxGradient,
      difficulty: col.difficulty * 2 // Multiplier par 2 pour l'échelle visuelle
    }));
  }, [selectedCols]);

  // Rendu d'une icône pour la saison
  const renderSeasonIcon = (season) => {
    switch (season) {
      case 'winter':
        return <FontAwesomeIcon icon={faSnowflake} style={{ color: '#2196F3' }} />;
      case 'spring':
        return <FontAwesomeIcon icon={faLeaf} style={{ color: '#4CAF50' }} />;
      case 'summer':
        return <FontAwesomeIcon icon={faSun} style={{ color: '#FF9800' }} />;
      case 'fall':
        return <FontAwesomeIcon icon={faWind} style={{ color: '#795548' }} />;
      default:
        return null;
    }
  };

  // Rendu des points de difficulté
  const renderDifficultyPoints = (difficulty) => {
    return Array(5).fill(0).map((_, index) => (
      <Box
        key={index}
        component="span"
        sx={{
          display: 'inline-block',
          width: 12,
          height: 12,
          borderRadius: '50%',
          backgroundColor: index < difficulty ? 
            index >= 4 ? 'error.main' : 
            index >= 3 ? 'warning.main' : 
            index >= 2 ? 'info.main' : 
            'success.main' 
            : 'grey.300',
          mx: 0.25
        }}
      />
    ));
  };

  return (
    <Box>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h5" component="h1" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
              <CompareArrows sx={{ mr: 1 }} />
              Comparaison de Cols
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comparez les caractéristiques de différents cols pour planifier vos aventures cyclistes.
            </Typography>
          </Box>
          
          <Box>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<Delete />}
              onClick={handleClearAll}
              disabled={selectedCols.length === 0}
              sx={{ mr: 1 }}
            >
              Tout effacer
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => navigate('/cols')}
            >
              Ajouter un col
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>Chargement des cols...</Typography>
          </Box>
        ) : selectedCols.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Aucun col sélectionné pour la comparaison. Ajoutez des cols depuis l'explorateur de cols.
          </Alert>
        ) : (
          <>
            {/* Cartes des cols sélectionnés */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {selectedCols.map(col => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={col.id}>
                  <Card elevation={3} sx={{ height: '100%' }}>
                    <Box sx={{ position: 'relative' }}>
                      <Box
                        component="img"
                        sx={{
                          height: 140,
                          width: '100%',
                          objectFit: 'cover',
                        }}
                        src={col.image}
                        alt={col.name}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: 'rgba(0, 0, 0, 0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(211, 47, 47, 0.8)',
                          }
                        }}
                        onClick={() => handleRemoveCol(col.id)}
                        aria-label={`Retirer ${col.name} de la comparaison`}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {col.name}
                      </Typography>
                      <Box display="flex" alignItems="center" mb={1}>
                        <Chip 
                          size="small" 
                          label={col.region} 
                          sx={{ mr: 1 }}
                        />
                        <Chip 
                          size="small" 
                          label={col.country} 
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {col.length} km | {col.avgGradient}% moyen
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" color="text.secondary" mr={1}>
                          Difficulté:
                        </Typography>
                        {renderDifficultyPoints(col.difficulty)}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Tableau comparatif */}
            <TableContainer component={Paper} elevation={2} sx={{ mb: 4, overflow: 'auto' }}>
              <Table aria-label="tableau de comparaison des cols" size={isMobile ? "small" : "medium"}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.action.hover }}>
                    <TableCell><strong>Caractéristiques</strong></TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}><strong>{col.name}</strong></TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Altitude (m)</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.elevation}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Longueur (km)</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.length}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Dénivelé (m)</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{Math.round(col.length * col.avgGradient * 10)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Pourcentage moyen (%)</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.avgGradient}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Pourcentage maximal (%)</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.maxGradient}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Nombre de virages en épingle</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.hairpins}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Surface</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>
                        <Box display="flex" alignItems="center">
                          <FontAwesomeIcon icon={faRoad} style={{ marginRight: '8px' }} />
                          {col.surface}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Difficulté technique</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>
                        {renderDifficultyPoints(col.technicalDifficulty)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Saisons recommandées</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>
                        <Box display="flex" gap={1}>
                          {col.seasons.map(season => (
                            <Tooltip key={season} title={season}>
                              <Box sx={{ mx: 0.5 }}>
                                {renderSeasonIcon(season)}
                              </Box>
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Apparitions au Tour de France</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.tourAppearances}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Temps record</TableCell>
                    {selectedCols.map(col => (
                      <TableCell key={col.id}>{col.recordTime}</TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            {/* Graphiques de comparaison */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <TrendingUp sx={{ mr: 1 }} />
                    Comparaison d'élévation
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={getElevationChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Altitude (m)', angle: -90, position: 'insideLeft' }} />
                        <ChartTooltip formatter={(value) => [`${value} m`, 'Altitude']} />
                        <Bar dataKey="elevation" fill={theme.palette.primary.main} name="Altitude (m)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper elevation={2} sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <Speed sx={{ mr: 1 }} />
                    Comparaison de difficulté
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={getDifficultyChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <ChartTooltip />
                        <Legend />
                        <Bar dataKey="avgGradient" fill={theme.palette.primary.light} name="Pente moyenne (%)" />
                        <Bar dataKey="maxGradient" fill={theme.palette.error.light} name="Pente max (%)" />
                        <Bar dataKey="difficulty" fill={theme.palette.warning.main} name="Difficulté (échelle)" />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Actions supplémentaires */}
            <Box display="flex" justifyContent="center" mt={4} gap={2} flexWrap="wrap">
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<CloudDownload />}
                onClick={() => alert('Fonctionnalité à venir: télécharger les données de comparaison')}
              >
                Exporter en PDF
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                startIcon={<BarChart />}
                onClick={() => alert('Fonctionnalité à venir: visualisation avancée')}
              >
                Visualisation avancée
              </Button>
              <Button 
                variant="outlined" 
                color="info" 
                startIcon={<Share />}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Lien de comparaison copié dans le presse-papier!');
                }}
              >
                Partager cette comparaison
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ColsComparison;
