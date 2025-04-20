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
  Gradient,
  SwapVert as SwapIcon
} from '@mui/icons-material';

import { useNotification } from '../../../../hooks/useNotification';
import { withLazyLoading } from '../../../optimization/withLazyLoading';

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

const ColComparison: React.FC<ColComparisonProps> = ({
  initialColIds = [],
  maxCompareItems = 4
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const effectiveMaxCompareItems = useMemo(() => {
    if (isMobile) return 2;
    if (isTablet) return 3;
    return maxCompareItems;
  }, [isMobile, isTablet, maxCompareItems]);
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  const colIdsFromQuery = useMemo(() => {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get('ids')?.split(',') || [];
  }, [location.search]);
  const [selectedCols, setSelectedCols] = useState<ColData[]>([]);
  const [availableCols, setAvailableCols] = useState<ColData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedColId, setSelectedColId] = useState<string | null>(null);
  const [compareBy, setCompareBy] = useState<'altitude' | 'length' | 'gradient' | 'difficulty'>('difficulty');

  useEffect(() => {
    const fetchAvailableCols = async () => {
      try {
        setLoading(true);
        const colService = await import('../../../../services/colService').then(module => module.default);
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

  useEffect(() => {
    const loadInitialCols = async () => {
      const idsToLoad = colIdsFromQuery.length > 0 ? colIdsFromQuery : initialColIds;
      if (idsToLoad.length === 0) return;
      try {
        setLoading(true);
        const colService = await import('../../../../services/colService').then(module => module.default);
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

  useEffect(() => {
    if (selectedCols.length > 0) {
      const newQuery = new URLSearchParams();
      newQuery.set('ids', selectedCols.map(col => col.id).join(','));
      navigate(`${location.pathname}?${newQuery.toString()}`, { replace: true });
    }
  }, [selectedCols, navigate, location.pathname]);

  const filteredAvailableCols = useMemo(() => {
    return availableCols.filter(col => !selectedCols.some(selected => selected.id === col.id));
  }, [availableCols, selectedCols]);

  const handleAddCol = async () => {
    if (!selectedColId) return;
    if (selectedCols.length >= effectiveMaxCompareItems) {
      showNotification(`Vous ne pouvez comparer que ${effectiveMaxCompareItems} cols maximum`, 'warning');
      return;
    }
    try {
      const colService = await import('../../../../services/colService').then(module => module.default);
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Comparer par:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip 
              icon={<Gradient />} 
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
              icon={<Gradient />} 
              label="Pente" 
              color={compareBy === 'gradient' ? 'primary' : 'default'}
              onClick={() => setCompareBy('gradient')}
              clickable
            />
          </Box>
        </Box>
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Col</TableCell>
                {sortedCols.map((col) => (
                  <TableCell key={col.id} align="center">
                    {col.name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Altitude</TableCell>
                {sortedCols.map((col) => (
                  <TableCell key={`${col.id}-altitude`} align="center">
                    {col.altitude} m
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Longueur</TableCell>
                {sortedCols.map((col) => (
                  <TableCell key={`${col.id}-length`} align="center">
                    {col.length} km
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Pente moyenne</TableCell>
                {sortedCols.map((col) => (
                  <TableCell key={`${col.id}-gradient`} align="center">
                    {col.gradient} %
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Difficulté</TableCell>
                {sortedCols.map((col) => (
                  <TableCell key={`${col.id}-difficulty`} align="center">
                    {col.difficulty}/5
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
