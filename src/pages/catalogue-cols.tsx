import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Head from 'next/head';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import TerrainIcon from '@mui/icons-material/Terrain';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { APIOrchestrator } from '../api/orchestration';
import ColsGrid from '../components/cols/ColsGrid';
import { Col } from '../types';

const CatalogueColsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cols, setCols] = useState<Col[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const apiOrchestrator = new APIOrchestrator();

  // Récupérer la liste des cols au chargement
  useEffect(() => {
    const fetchCols = async () => {
      setLoading(true);
      try {
        const colsData = await apiOrchestrator.getAllCols();
        setCols(colsData);
      } catch (err) {
        setError(err as Error);
        console.error('Erreur lors du chargement des cols:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCols();
  }, []);

  // Rechercher des cols par nom, région, etc.
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Si la recherche est vide, réinitialiser à la liste complète
      const allCols = await apiOrchestrator.getAllCols();
      setCols(allCols);
      return;
    }

    setLoading(true);
    try {
      const results = await apiOrchestrator.searchCols(query);
      setCols(results);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Contenu de l'onglet "Tous les cols"
  const renderAllColsTab = () => (
    <Box mt={4}>
      <ColsGrid 
        cols={cols} 
        loading={loading} 
        error={error} 
        onSearch={handleSearch}
      />
    </Box>
  );

  // Contenu de l'onglet "Cols par région"
  const renderRegionTab = () => {
    // Extraire toutes les régions uniques
    const regions = [...new Set(cols.map(col => col.region))].sort();

    return (
      <Box mt={4}>
        {regions.map(region => (
          <Box key={region} mb={6}>
            <Typography variant="h5" gutterBottom sx={{ 
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              pb: 1,
              display: 'inline-block'
            }}>
              {region}
            </Typography>
            
            <Box mt={2}>
              <ColsGrid 
                cols={cols.filter(col => col.region === region)} 
                loading={false} 
                error={null} 
                onSearch={handleSearch}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Contenu de l'onglet "Cols par difficulté"
  const renderDifficultyTab = () => {
    const difficultyCategories = [
      { key: 'easy', label: 'Cols faciles', description: 'Accessibles aux cyclistes de tous niveaux' },
      { key: 'medium', label: 'Cols moyens', description: 'Pour cyclistes avec une bonne condition physique' },
      { key: 'hard', label: 'Cols difficiles', description: 'Pour cyclistes expérimentés' },
      { key: 'extreme', label: 'Cols extrêmes', description: 'Pour cyclistes très expérimentés' }
    ];

    return (
      <Box mt={4}>
        {difficultyCategories.map(category => (
          <Box key={category.key} mb={6}>
            <Typography variant="h5" gutterBottom sx={{ 
              borderBottom: `2px solid ${
                category.key === 'easy' ? theme.palette.success.main :
                category.key === 'medium' ? theme.palette.info.main :
                category.key === 'hard' ? theme.palette.warning.main : theme.palette.error.main
              }`,
              pb: 1,
              display: 'inline-block'
            }}>
              {category.label}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              {category.description}
            </Typography>
            
            <Box mt={2}>
              <ColsGrid 
                cols={cols.filter(col => col.difficulty === category.key)} 
                loading={false} 
                error={null} 
                onSearch={handleSearch}
              />
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  // Contenu de la page
  return (
    <>
      <Head>
        <title>Catalogue des Cols | Velo-Altitude</title>
        <meta name="description" content="Explorez notre catalogue de cols cyclistes à travers l'Europe. Visualisation 3D, données techniques et points d'intérêt." />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Catalogue des Cols
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Explorez plus de 50 cols documentés en détail à travers l'Europe
          </Typography>
          
          <Box display="flex" alignItems="center" mt={2} flexWrap="wrap" gap={2}>
            <Button 
              variant="contained" 
              startIcon={<ViewInArIcon />}
              color="primary"
              href="#visualisation-3d"
            >
              Voir la visualisation 3D
            </Button>
            
            <Button 
              variant="outlined"
              startIcon={<TerrainIcon />}
              href="/seven-majors"
            >
              Créer un défi "7 Majeurs"
            </Button>
          </Box>
        </Box>
        
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Box p={3}>
            <Box display="flex" alignItems="center" mb={2}>
              <InfoOutlinedIcon color="primary" sx={{ mr: 2 }} />
              <Typography variant="body1">
                Découvrez les cols les plus prestigieux d'Europe avec des visualisations 3D interactives. 
                Explorez les profils d'altitude, les points d'intérêt et les données techniques pour préparer vos ascensions.
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Utilisez le bouton "Vue 3D" sur chaque col pour accéder à sa visualisation 3D interactive, 
                ou explorez les cols par région et niveau de difficulté.
              </Typography>
            </Alert>
          </Box>
        </Paper>
        
        <Paper elevation={3}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : undefined}
            textColor="primary"
            indicatorColor="primary"
            aria-label="Onglets du catalogue de cols"
          >
            <Tab icon={<SearchIcon />} label="Tous les cols" />
            <Tab icon={<TerrainIcon />} label="Par région" />
            <Tab icon={<TerrainIcon />} label="Par difficulté" />
          </Tabs>
          
          <Divider />
          
          <Box p={3}>
            {loading && activeTab === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
                <Typography variant="body1" ml={2}>
                  Chargement des cols...
                </Typography>
              </Box>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    Erreur lors du chargement des données: {error.message}
                  </Alert>
                )}
                
                {activeTab === 0 && renderAllColsTab()}
                {activeTab === 1 && renderRegionTab()}
                {activeTab === 2 && renderDifficultyTab()}
              </>
            )}
          </Box>
        </Paper>
        
        <Box mt={8} id="visualisation-3d">
          <Typography variant="h4" gutterBottom>
            Visualisation 3D des Cols
          </Typography>
          
          <Typography variant="body1" paragraph>
            Notre technologie de visualisation 3D vous permet de "prévisualiser" les ascensions et de vous préparer mentalement à l'effort. 
            Explorez les profils d'élévation en 3D, avec tous les points d'intérêt interactifs (restaurants, vues panoramiques, monuments).
          </Typography>
          
          <Box 
            component="img" 
            src="/images/3d-preview.jpg" 
            alt="Prévisualisation 3D" 
            sx={{ 
              width: '100%', 
              maxHeight: 400, 
              objectFit: 'cover', 
              borderRadius: 2,
              mt: 2
            }} 
          />
          
          <Typography variant="h6" mt={4} mb={2}>
            Fonctionnalités de la visualisation 3D :
          </Typography>
          
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Navigation Interactive
              </Typography>
              <Typography variant="body2">
                Utilisez la souris pour faire pivoter la vue, zoomer et vous déplacer dans la visualisation 3D. 
                Explorez le col sous tous les angles pour mieux appréhender son profil.
              </Typography>
            </Paper>
            
            <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Points d'Intérêt Interactifs
              </Typography>
              <Typography variant="body2">
                Repérez facilement les restaurants, points d'eau, vues panoramiques et autres services 
                directement sur le modèle 3D grâce à des marqueurs colorés interactifs.
              </Typography>
            </Paper>
            
            <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: { xs: '100%', sm: '45%', md: '30%' } }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Adaptation Automatique
              </Typography>
              <Typography variant="body2">
                La qualité du rendu 3D s'adapte automatiquement à votre appareil, offrant une 
                expérience optimale sur desktop, tablette ou smartphone.
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default CatalogueColsPage;
