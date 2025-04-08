import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Grid, 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider,
  Breadcrumbs,
  Link,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  PictureAsPdf as PdfIcon,
  Map as MapIcon,
  Info as InfoIcon,
  Terrain as TerrainIcon
} from '@mui/icons-material';

// Import unified components 
import ColDetail from '../ColDetail';
import Visualization3D from '../Visualization3D';

// Import optimization HOC
import { withLazyLoading } from '../../../optimization/withLazyLoading';

// Import hooks and services
import { ColDetails, Cycling, LocationForecast } from '../../../../types';
import { useAuth } from '../../../../auth';
import { useNotification } from '../../../../hooks/useNotification';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * Panel de contenu pour les onglets
 */
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`col-explorer-tabpanel-${index}`}
      aria-labelledby={`col-explorer-tab-${index}`}
      {...other}
      style={{ minHeight: '350px' }}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

/**
 * Props du composant ColExplorer
 */
interface ColExplorerProps {
  initialTab?: number;
  showBreadcrumbs?: boolean;
  showActions?: boolean;
  showTabs?: boolean;
}

/**
 * Explorateur unifié des cols
 * Combine les détails du col et la visualisation 3D dans une interface à onglets
 */
const ColExplorer: React.FC<ColExplorerProps> = ({
  initialTab = 0,
  showBreadcrumbs = true,
  showActions = true,
  showTabs = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Router hooks
  const { colId } = useParams<{ colId: string }>();
  const navigate = useNavigate();
  
  // Auth hook
  const { isAuthenticated, user } = useAuth();
  
  // Notification hook
  const { showNotification } = useNotification();
  
  // États locaux
  const [activeTab, setActiveTab] = useState<number>(initialTab);
  const [colData, setColData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  
  // Charger les données du col
  useEffect(() => {
    const fetchColData = async () => {
      if (!colId) {
        setError("ID du col non spécifié");
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Importer le service dynamiquement
        const colService = await import('../../../../services/colService').then(module => module.default);
        
        // Récupérer les données du col
        const data = await colService.getColById(colId);
        
        // Vérifier si le col est en favoris (pour les utilisateurs authentifiés)
        if (isAuthenticated && user) {
          const userService = await import('../../../../services/userService').then(module => module.default);
          const favorites = await userService.getUserFavorites(user.id);
          setIsFavorite(favorites.cols?.includes(colId) || false);
        }
        
        setColData(data);
        setLoading(false);
      } catch (err: any) {
        console.error('[ColExplorer] Erreur lors du chargement des données:', err);
        setError(err.message || 'Erreur lors du chargement des données du col');
        setLoading(false);
      }
    };
    
    fetchColData();
  }, [colId, isAuthenticated, user]);
  
  // Gestionnaires d'événements
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleGoBack = () => {
    navigate(-1);
  };
  
  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      showNotification('Veuillez vous connecter pour ajouter des favoris', 'warning');
      return;
    }
    
    try {
      const userService = await import('../../../../services/userService').then(module => module.default);
      
      if (isFavorite) {
        await userService.removeFromFavorites(user.id, 'cols', colId);
        showNotification('Retiré des favoris', 'success');
      } else {
        await userService.addToFavorites(user.id, 'cols', colId);
        showNotification('Ajouté aux favoris', 'success');
      }
      
      setIsFavorite(!isFavorite);
    } catch (err: any) {
      console.error('[ColExplorer] Erreur lors de la modification des favoris:', err);
      showNotification('Erreur lors de la modification des favoris', 'error');
    }
  };
  
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Col ${colData?.name}`,
          text: `Découvrez le col ${colData?.name} - Altitude: ${colData?.altitude}m`,
          url: window.location.href
        });
      } else {
        // Copier l'URL dans le presse-papiers
        await navigator.clipboard.writeText(window.location.href);
        showNotification('Lien copié dans le presse-papiers', 'success');
      }
    } catch (err) {
      console.error('[ColExplorer] Erreur lors du partage:', err);
      showNotification('Erreur lors du partage', 'error');
    }
  };
  
  const handleExportPDF = async () => {
    try {
      showNotification('Génération du PDF en cours...', 'info');
      
      // Importer le service PDF dynamiquement
      const pdfService = await import('../../../../services/pdfService').then(module => module.default);
      
      // Générer et télécharger le PDF
      await pdfService.generateColPDF(colData);
      
      showNotification('PDF généré avec succès', 'success');
    } catch (err) {
      console.error('[ColExplorer] Erreur lors de la génération du PDF:', err);
      showNotification('Erreur lors de la génération du PDF', 'error');
    }
  };
  
  // État de chargement
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // État d'erreur
  if (error || !colData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 1, border: 1, borderColor: 'error.light' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Erreur lors du chargement des données du col
          </Typography>
          <Typography variant="body1">
            {error || "Le col demandé n'a pas été trouvé"}
          </Typography>
          <Box mt={2}>
            <IconButton onClick={handleGoBack}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      {/* En-tête avec fil d'Ariane */}
      {showBreadcrumbs && (
        <Box sx={{ mb: 2 }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
              Accueil
            </Link>
            <Link color="inherit" onClick={() => navigate('/cols')} sx={{ cursor: 'pointer' }}>
              Cols
            </Link>
            <Typography color="text.primary">{colData.name}</Typography>
          </Breadcrumbs>
        </Box>
      )}
      
      {/* En-tête avec titre et actions */}
      <Paper 
        elevation={1} 
        sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: { xs: 2, md: 3 }, 
          borderRadius: 1,
          background: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(${colData.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <IconButton onClick={handleGoBack} color="primary">
              <ArrowBackIcon />
            </IconButton>
          </Grid>
          
          <Grid item xs>
            <Typography variant="h4" component="h1">
              {colData.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {colData.altitude}m • {colData.region}
            </Typography>
          </Grid>
          
          {showActions && (
            <Grid item>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton onClick={handleToggleFavorite} color={isFavorite ? "error" : "default"}>
                  {isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
                <IconButton onClick={handleShare} color="primary">
                  <ShareIcon />
                </IconButton>
                <IconButton onClick={handleExportPDF} color="primary">
                  <PdfIcon />
                </IconButton>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Onglets */}
      {showTabs ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="col explorer tabs"
              variant={isMobile ? "fullWidth" : "standard"}
              scrollButtons={isMobile}
              allowScrollButtonsMobile
            >
              <Tab icon={<InfoIcon />} label="Détails" id="col-explorer-tab-0" />
              <Tab icon={<TerrainIcon />} label="3D" id="col-explorer-tab-1" />
              <Tab icon={<MapIcon />} label="Carte" id="col-explorer-tab-2" />
            </Tabs>
          </Box>
          
          <Fade in={activeTab === 0} timeout={500}>
            <div>
              <TabPanel value={activeTab} index={0}>
                <ColDetail 
                  colId={colId || ''} 
                  initialData={colData}
                />
              </TabPanel>
            </div>
          </Fade>
          
          <Fade in={activeTab === 1} timeout={500}>
            <div>
              <TabPanel value={activeTab} index={1}>
                <Visualization3D 
                  colId={colId || ''} 
                  config={{
                    showControls: true,
                    quality: isTablet || isMobile ? 'medium' : 'high',
                    enableAnimation: true,
                    adaptiveLoading: true
                  }}
                />
              </TabPanel>
            </div>
          </Fade>
          
          <Fade in={activeTab === 2} timeout={500}>
            <div>
              <TabPanel value={activeTab} index={2}>
                <Typography variant="h6" gutterBottom>
                  Carte du Col
                </Typography>
                {/* Ici, nous intégrerons ultérieurement le composant de carte */}
                <Box 
                  sx={{ 
                    height: 400, 
                    bgcolor: 'grey.100', 
                    borderRadius: 1,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Typography>
                    Carte à implémenter
                  </Typography>
                </Box>
              </TabPanel>
            </div>
          </Fade>
        </>
      ) : (
        // Sans onglets, afficher directement le contenu
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ColDetail 
              colId={colId || ''} 
              initialData={colData}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Visualization3D 
              colId={colId || ''} 
              config={{
                showControls: true,
                quality: isTablet || isMobile ? 'low' : 'medium',
                enableAnimation: false,
                adaptiveLoading: true
              }}
            />
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

// Export avec lazy loading pour optimiser le chargement initial
export default withLazyLoading(ColExplorer);
