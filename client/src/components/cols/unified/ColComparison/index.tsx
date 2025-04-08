import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Autocomplete,
  TextField,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert
} from '@mui/material';
import {
  Compare as CompareIcon,
  Close as CloseIcon,
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  PrintOutlined as PrintIcon,
  Share as ShareIcon,
  BarChart as ChartIcon,
  DirectionsBike as BikeIcon,
  AccessTime as TimeIcon,
  GradientIcon,
  SwapVert as SwapIcon
} from '@mui/icons-material';

// Import components and hooks
import { useNotification } from '../../../../hooks/useNotification';
import { withLazyLoading } from '../../../optimization/withLazyLoading';

// Type definitions
interface ColComparisonProps {
  initialColIds?: string[];
  maxCompareItems?: number;
}

interface ColData {
  id: string;
  name: string;
  altitude: number;
  length: number;
  gradient: number;
  difficulty: number;
  region: string;
  image?: string;
  description?: string;
  estimatedTime?: string;
  segments?: {
    name: string;
    distance: number;
    gradient: number;
    altitude: number;
  }[];
  weather?: {
    current?: {
      temp: number;
      condition: string;
      icon: string;
    };
  };
}

/**
 * Component pour la comparaison des cols
 * Permet de comparer côte à côte plusieurs cols selon différents critères
 */
const ColComparison: React.FC<ColComparisonProps> = ({
  initialColIds = [],
  maxCompareItems = 4
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Ajuster le nombre maximum de cols à comparer en fonction de la taille de l'écran
  const effectiveMaxCompareItems = useMemo(() => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return maxCompareItems;
  }, [isMobile, isTablet, maxCompareItems]);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  
  // Récupérer les IDs des cols depuis l'URL si présents
  const colIdsFromQuery = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('ids')?.split(',') || [];
  }, [location.search]);
  
  // État local
  const [selectedCols, setSelectedCols] = useState<ColData[]>([]);
  const [availableCols, setAvailableCols] = useState<ColData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [compareBy, setCompareBy] = useState<'altitude' | 'length' | 'gradient' | 'difficulty'>('difficulty');
  
  // Charger tous les cols disponibles
  useEffect(() => {
    const fetchAvailableCols = async () => {
      try {
        setLoading(true);
        
        // Importer le service dynamiquement
        const colService = await import('../../../../services/colService').then(module => module.default);
        
        // Récupérer tous les cols
        const data = await colService.getAllCols();
        
        setAvailableCols(data);
        setLoading(false);
      } catch (err: any) {
        console.error('[ColComparison] Erreur lors du chargement des cols:', err);
        setError(err.message || 'Erreur lors du chargement des cols disponibles');
        setLoading(false);
      }
    };
    
    fetchAvailableCols();
  }, []);
  
  // Charger les cols initiaux (depuis l'URL ou les props)
  useEffect(() => {
    const loadInitialCols = async () => {
      const idsToLoad = colIdsFromQuery.length > 0 ? colIdsFromQuery : initialColIds;
      
      if (idsToLoad.length === 0) return;
      
      try {
        setLoading(true);
        
        // Importer le service dynamiquement
        const colService = await import('../../../../services/colService').then(module => module.default);
        
        // Récupérer les données pour chaque col
        const colsData = await Promise.all(
          idsToLoad.map(id => colService.getColById(id))
        );
        
        setSelectedCols(colsData);
        setLoading(false);
      } catch (err: any) {
        console.error('[ColComparison] Erreur lors du chargement des cols:', err);
        setError(err.message || 'Erreur lors du chargement des cols sélectionnés');
        setLoading(false);
      }
    };
    
    if (!loading) {
      loadInitialCols();
    }
  }, [colIdsFromQuery, initialColIds, loading]);
  
  // Mettre à jour l'URL lorsque les cols sélectionnés changent
  useEffect(() => {
    if (selectedCols.length > 0) {
      const newQuery = new URLSearchParams();
      newQuery.set('ids', selectedCols.map(col => col.id).join(','));
      navigate(`${location.pathname}?${newQuery.toString()}`, { replace: true });
    }
  }, [selectedCols, navigate, location.pathname]);
  
  // Filtrer les cols disponibles pour ne pas inclure ceux déjà sélectionnés
  const filteredAvailableCols = useMemo(() => {
    return availableCols.filter(col => !selectedCols.some(selected => selected.id === col.id));
  }, [availableCols, selectedCols]);
  
  // Gestion des cols
  const handleAddCol = async () => {
    if (!selectedColId) return;
    
    if (selectedCols.length >= effectiveMaxCompareItems) {
      showNotification(`Vous ne pouvez comparer que ${effectiveMaxCompareItems} cols maximum`, 'warning');
      return;
    }
    
    try {
      // Importer le service dynamiquement
      const colService = await import('../../../../services/colService').then(module => module.default);
      
      // Récupérer les données complètes du col
      const colData = await colService.getColById(selectedColId);
      
      setSelectedCols(prev => [...prev, colData]);
      setSelectedColId(null);
    } catch (err: any) {
      console.error('[ColComparison] Erreur lors de l\'ajout du col:', err);
      showNotification('Erreur lors de l\'ajout du col à la comparaison', 'error');
    }
  };
  
  const handleRemoveCol = (colId: string) => {
    setSelectedCols(prev => prev.filter(col => col.id !== colId));
  };
  
  const handlePrintComparison = () => {
    window.print();
  };
  
  const handleShareComparison = () => {
    try {
      // Copier l'URL dans le presse-papiers
      navigator.clipboard.writeText(window.location.href);
      showNotification('Lien de comparaison copié dans le presse-papiers', 'success');
    } catch (err) {
      console.error('[ColComparison] Erreur lors du partage:', err);
      showNotification('Erreur lors du partage de la comparaison', 'error');
    }
  };
  
  const handleGoBack = () => {
    navigate('/cols');
  };
  
  const handleViewCol = (colId: string) => {
    navigate(`/cols/${colId}`);
  };
  
  // Trier les cols selon le critère sélectionné
  const sortedCols = useMemo(() => {
    return [...selectedCols].sort((a, b) => {
      switch (compareBy) {
        case 'altitude':
          return b.altitude - a.altitude;
        case 'length':
          return b.length - a.length;
        case 'gradient':
          return b.gradient - a.gradient;
        case 'difficulty':
          return b.difficulty - a.difficulty;
        default:
          return 0;
      }
    });
  }, [selectedCols, compareBy]);
  
  // Trouver le meilleur col selon chaque critère
  const bestAltitude = useMemo(() => Math.max(...selectedCols.map(col => col.altitude)), [selectedCols]);
  const bestLength = useMemo(() => Math.max(...selectedCols.map(col => col.length)), [selectedCols]);
  const bestGradient = useMemo(() => Math.max(...selectedCols.map(col => col.gradient)), [selectedCols]);
  
  // État de chargement
  if (loading && !availableCols.length) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // État d'erreur
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: 1, borderColor: 'error.light' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Erreur
          </Typography>
          <Typography variant="body1">
            {error}
          </Typography>
          <Box mt={2}>
            <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack}>
              Retour à la liste des cols
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <Paper elevation={1} sx={{ p: { xs: 2, md: 3 }, mb: 3, borderRadius: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={handleGoBack}
              sx={{ mr: 1 }}
              color="primary"
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h5" component="h1">
                Comparaison de cols
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comparez jusqu'à {effectiveMaxCompareItems} cols côte à côte
              </Typography>
            </Box>
          </Box>
          
          <Box>
            <Tooltip title="Imprimer la comparaison">
              <IconButton onClick={handlePrintComparison} sx={{ ml: 1 }}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Partager la comparaison">
              <IconButton onClick={handleShareComparison} sx={{ ml: 1 }}>
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Sélection des cols à comparer */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Autocomplete
                value={null}
                onChange={(_, newValue) => {
                  if (newValue) {
                    setSelectedColId(newValue.id);
                  }
                }}
                options={filteredAvailableCols}
                getOptionLabel={(option) => `${option.name} (${option.region})`}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Ajouter un col à comparer"
                    variant="outlined"
                    fullWidth
                    placeholder="Rechercher un col..."
                    size="small"
                  />
                )}
                disabled={selectedCols.length >= effectiveMaxCompareItems}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddCol}
                disabled={!selectedColId || selectedCols.length >= effectiveMaxCompareItems}
                fullWidth
              >
                Ajouter à la comparaison
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {/* Critère de comparaison */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Comparer par:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              icon={<GradientIcon />} 
              label="Difficulté" 
              color={compareBy === 'difficulty' ? 'primary' : 'default'}
              onClick={() => setCompareBy('difficulty')}
              clickable
            />
            <Chip 
              icon={<ChartIcon />} 
              label="Altitude" 
              color={compareBy === 'altitude' ? 'primary' : 'default'}
              onClick={() => setCompareBy('altitude')}
              clickable
            />
            <Chip 
              icon={<BikeIcon />} 
              label="Longueur" 
              color={compareBy === 'length' ? 'primary' : 'default'}
              onClick={() => setCompareBy('length')}
              clickable
            />
            <Chip 
              icon={<GradientIcon />} 
              label="Pente" 
              color={compareBy === 'gradient' ? 'primary' : 'default'}
              onClick={() => setCompareBy('gradient')}
              clickable
            />
          </Box>
        </Box>
        
        {/* Afficher un message si aucun col n'est sélectionné */}
        {selectedCols.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Aucun col sélectionné
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Utilisez le champ de recherche ci-dessus pour ajouter des cols à comparer
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                const randomIndex = Math.floor(Math.random() * availableCols.length);
                setSelectedColId(availableCols[randomIndex]?.id || null);
              }}
              disabled={availableCols.length === 0}
            >
              Ajouter un col aléatoire
            </Button>
          </Paper>
        ) : (
          <>
            {/* Vue mobile: cartes */}
            {isMobile && (
              <Box sx={{ mb: 3 }}>
                {sortedCols.map((col) => (
                  <Card key={col.id} sx={{ mb: 2 }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={col.image || '/images/default-col.jpg'}
                      alt={col.name}
                    />
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" component="div">
                          {col.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveCol(col.id)}
                          color="default"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {col.region}
                      </Typography>
                      
                      <Box mt={1}>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Typography variant="body2" component="div">
                              <strong>Altitude:</strong> {col.altitude} m
                              {col.altitude === bestAltitude && (
                                <Chip size="small" label="Max" color="success" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" component="div">
                              <strong>Longueur:</strong> {col.length} km
                              {col.length === bestLength && (
                                <Chip size="small" label="Max" color="success" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" component="div">
                              <strong>Pente:</strong> {col.gradient.toFixed(1)}%
                              {col.gradient === bestGradient && (
                                <Chip size="small" label="Max" color="warning" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" component="div">
                              <strong>Difficulté:</strong> {col.difficulty}/5
                            </Typography>
                          </Grid>
                          {col.estimatedTime && (
                            <Grid item xs={12}>
                              <Typography variant="body2" component="div">
                                <strong>Temps estimé:</strong> {col.estimatedTime}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleViewCol(col.id)}
                      >
                        Voir détails
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
            
            {/* Vue tablette/desktop: tableau */}
            {!isMobile && (
              <TableContainer component={Paper} sx={{ mb: 3, overflow: 'auto' }}>
                <Table aria-label="comparaison des cols">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      {sortedCols.map((col) => (
                        <TableCell key={col.id} align="center">
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Box display="flex" justifyContent="center" alignItems="center" mb={1}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {col.name}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveCol(col.id)}
                                sx={{ ml: 1 }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Box 
                              component="img" 
                              src={col.image || '/images/default-col.jpg'} 
                              alt={col.name}
                              sx={{
                                height: 100,
                                width: 150,
                                objectFit: 'cover',
                                borderRadius: 1,
                                mb: 1
                              }}
                            />
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewCol(col.id)}
                            >
                              Voir détails
                            </Button>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Région */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        Région
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell key={`${col.id}-region`} align="center">
                          {col.region}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Altitude */}
                    <TableRow sx={{ backgroundColor: compareBy === 'altitude' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: compareBy === 'altitude' ? 'bold' : 'regular',
                          color: compareBy === 'altitude' ? 'primary.main' : 'inherit'
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <ChartIcon sx={{ mr: 1, fontSize: 18 }} />
                          Altitude
                          {compareBy === 'altitude' && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={() => setCompareBy('altitude')}>
                              <SwapIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell 
                          key={`${col.id}-altitude`} 
                          align="center"
                          sx={{ fontWeight: col.altitude === bestAltitude ? 'bold' : 'regular' }}
                        >
                          {col.altitude} m
                          {col.altitude === bestAltitude && (
                            <Chip size="small" label="Max" color="success" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Longueur */}
                    <TableRow sx={{ backgroundColor: compareBy === 'length' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: compareBy === 'length' ? 'bold' : 'regular',
                          color: compareBy === 'length' ? 'primary.main' : 'inherit'
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <BikeIcon sx={{ mr: 1, fontSize: 18 }} />
                          Longueur
                          {compareBy === 'length' && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={() => setCompareBy('length')}>
                              <SwapIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell 
                          key={`${col.id}-length`} 
                          align="center"
                          sx={{ fontWeight: col.length === bestLength ? 'bold' : 'regular' }}
                        >
                          {col.length} km
                          {col.length === bestLength && (
                            <Chip size="small" label="Max" color="success" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Pente */}
                    <TableRow sx={{ backgroundColor: compareBy === 'gradient' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: compareBy === 'gradient' ? 'bold' : 'regular',
                          color: compareBy === 'gradient' ? 'primary.main' : 'inherit'
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <GradientIcon sx={{ mr: 1, fontSize: 18 }} />
                          Pente moyenne
                          {compareBy === 'gradient' && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={() => setCompareBy('gradient')}>
                              <SwapIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell 
                          key={`${col.id}-gradient`} 
                          align="center"
                          sx={{ fontWeight: col.gradient === bestGradient ? 'bold' : 'regular' }}
                        >
                          {col.gradient.toFixed(1)}%
                          {col.gradient === bestGradient && (
                            <Chip size="small" label="Max" color="warning" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Difficulté */}
                    <TableRow sx={{ backgroundColor: compareBy === 'difficulty' ? 'rgba(25, 118, 210, 0.08)' : 'inherit' }}>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ 
                          fontWeight: compareBy === 'difficulty' ? 'bold' : 'regular',
                          color: compareBy === 'difficulty' ? 'primary.main' : 'inherit'
                        }}
                      >
                        <Box display="flex" alignItems="center">
                          <CompareIcon sx={{ mr: 1, fontSize: 18 }} />
                          Difficulté
                          {compareBy === 'difficulty' && (
                            <IconButton size="small" sx={{ ml: 1 }} onClick={() => setCompareBy('difficulty')}>
                              <SwapIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell 
                          key={`${col.id}-difficulty`} 
                          align="center"
                        >
                          <Chip 
                            label={`${col.difficulty}/5`}
                            color={
                              col.difficulty >= 4 ? "error" : 
                              col.difficulty >= 3 ? "warning" : 
                              col.difficulty >= 2 ? "success" : 
                              "default"
                            }
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                    
                    {/* Temps estimé */}
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <Box display="flex" alignItems="center">
                          <TimeIcon sx={{ mr: 1, fontSize: 18 }} />
                          Temps estimé
                        </Box>
                      </TableCell>
                      {sortedCols.map((col) => (
                        <TableCell key={`${col.id}-time`} align="center">
                          {col.estimatedTime || 'N/A'}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            
            {selectedCols.length < 2 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Ajoutez au moins un autre col pour voir une comparaison complète
              </Alert>
            )}
          </>
        )}
        
        {/* Actions */}
        <Box display="flex" justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleGoBack}
          >
            Retour aux cols
          </Button>
          
          {selectedCols.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<CloseIcon />}
              onClick={() => setSelectedCols([])}
            >
              Effacer tout
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default withLazyLoading(ColComparison);
