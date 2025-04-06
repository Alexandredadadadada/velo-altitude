import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Divider,
  Card,
  CardMedia,
  CardContent,
  Chip,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/router';
import TerrainIcon from '@mui/icons-material/Terrain';
import RouteIcon from '@mui/icons-material/Route';
import SpeedIcon from '@mui/icons-material/Speed';
import InfoIcon from '@mui/icons-material/Info';
import View3dIcon from '@mui/icons-material/ViewInAr';
import { APIOrchestrator } from '../api/orchestration';
import ElevationViewer3D from '../components/visualization/ElevationViewer3D';
import { Col, PointOfInterest } from '../types';

const Col3DViewer: React.FC = () => {
  const router = useRouter();
  const { colId } = router.query;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const apiOrchestrator = new APIOrchestrator();
  
  const [col, setCol] = useState<Col | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [relatedCols, setRelatedCols] = useState<Col[]>([]);
  
  // Charger les données du col
  useEffect(() => {
    if (!colId) return;
    
    const fetchColData = async () => {
      setLoading(true);
      try {
        const colData = await apiOrchestrator.getColById(colId as string);
        setCol(colData);
        
        // Charger les cols de la même région pour les suggestions
        if (colData.region) {
          // Utiliser la méthode publique de l'API Orchestrator
          const allCols = await apiOrchestrator.getAllCols();
          const relatedColsData = allCols.filter(c => 
            c.region === colData.region && c.id !== colId
          ).slice(0, 3);
          setRelatedCols(relatedColsData);
        }
      } catch (err) {
        setError(err as Error);
        console.error('Erreur lors du chargement des données du col:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchColData();
  }, [colId]);
  
  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };
  
  // Formater les points d'intérêt par type
  const formatPointsOfInterest = () => {
    if (!col || !col.pointsOfInterest || col.pointsOfInterest.length === 0) {
      return {};
    }
    
    return col.pointsOfInterest.reduce((grouped, poi) => {
      if (!grouped[poi.type]) {
        grouped[poi.type] = [];
      }
      grouped[poi.type].push(poi);
      return grouped;
    }, {} as Record<string, PointOfInterest[]>);
  };
  
  // Afficher un point d'intérêt
  const renderPointOfInterest = (poi: PointOfInterest) => {
    const poiTypeLabels: Record<string, string> = {
      restaurant: 'Restaurant',
      viewpoint: 'Point de vue',
      landmark: 'Monument',
      water: 'Point d\'eau',
      parking: 'Parking',
      other: 'Autre'
    };
    
    return (
      <Paper key={poi.id} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="flex-start">
          {poi.imageUrl && (
            <Box
              component="img"
              src={poi.imageUrl}
              alt={poi.name}
              sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, mr: 2 }}
            />
          )}
          
          <Box>
            <Box display="flex" alignItems="center" mb={1}>
              <Typography variant="subtitle1" fontWeight="bold">
                {poi.name}
              </Typography>
              <Chip 
                label={poiTypeLabels[poi.type] || 'Autre'} 
                size="small" 
                sx={{ ml: 1 }}
                color={
                  poi.type === 'restaurant' ? 'error' : 
                  poi.type === 'viewpoint' ? 'primary' : 
                  poi.type === 'landmark' ? 'warning' : 
                  poi.type === 'water' ? 'success' : 
                  poi.type === 'parking' ? 'secondary' : 
                  'default'
                }
              />
            </Box>
            
            {poi.distance !== undefined && (
              <Typography variant="body2" color="text.secondary">
                À {poi.distance.toFixed(1)} km du départ
              </Typography>
            )}
            
            {poi.description && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                {poi.description}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>
    );
  };
  
  // Contenu pour l'onglet Visualisation 3D
  const render3DTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Visualisation 3D du profil d'élévation
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Explorez le col en 3D. Utilisez la souris pour faire pivoter la vue, la molette pour zoomer et cliquez-glissez pour vous déplacer.
      </Typography>
      
      <ElevationViewer3D colId={colId as string} height={isMobile ? 400 : 600} />
      
      <Box mt={3}>
        <Typography variant="body2" color="text.secondary">
          Les points colorés représentent les points d'intérêt. Survolez-les pour afficher leur nom.
        </Typography>
      </Box>
    </Box>
  );
  
  // Contenu pour l'onglet Informations
  const renderInfoTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Informations sur le col
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Caractéristiques techniques
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Altitude
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {col?.elevation} m
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <RouteIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Distance
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {col?.length} km
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pente moyenne
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {col?.avgGradient}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={6}>
                  <Box display="flex" alignItems="center">
                    <SpeedIcon sx={{ mr: 1, color: 'error.main' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Pente maximale
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {col?.maxGradient}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Localisation
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Région
                </Typography>
                <Typography variant="body1">
                  {col?.region}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pays
                </Typography>
                <Typography variant="body1">
                  {col?.country}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box mb={3}>
            <Typography variant="subtitle1" gutterBottom>
              Description
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1">
                {col?.description || "Aucune description disponible pour ce col."}
              </Typography>
            </Paper>
          </Box>
          
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Difficulté
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Chip 
                label={
                  col?.difficulty === 'easy' ? 'Facile' : 
                  col?.difficulty === 'medium' ? 'Moyen' : 
                  col?.difficulty === 'hard' ? 'Difficile' : 'Extrême'
                }
                color={
                  col?.difficulty === 'easy' ? 'success' : 
                  col?.difficulty === 'medium' ? 'info' : 
                  col?.difficulty === 'hard' ? 'warning' : 'error'
                }
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2">
                {col?.difficulty === 'easy' ? 
                  'Ce col est accessible aux cyclistes de tous niveaux. La pente est généralement douce et régulière.' : 
                col?.difficulty === 'medium' ? 
                  'Ce col présente quelques sections plus raides, mais reste accessible aux cyclistes ayant une bonne condition physique.' : 
                col?.difficulty === 'hard' ? 
                  'Ce col est difficile et présente des sections avec des pentes importantes. Recommandé pour les cyclistes expérimentés.' : 
                  'Ce col est extrêmement difficile avec des pentes très raides. Réservé aux cyclistes très expérimentés.'}
              </Typography>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Contenu pour l'onglet Points d'intérêt
  const renderPOITab = () => {
    const groupedPOIs = formatPointsOfInterest();
    const poiTypes = Object.keys(groupedPOIs);
    
    if (poiTypes.length === 0) {
      return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Aucun point d'intérêt n'est disponible pour ce col.
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Points d'intérêt le long du parcours
        </Typography>
        
        {poiTypes.map(type => (
          <Box key={type} mb={4}>
            <Typography variant="subtitle1" gutterBottom sx={{ textTransform: 'capitalize' }}>
              {type === 'restaurant' ? 'Restaurants' : 
               type === 'viewpoint' ? 'Points de vue' : 
               type === 'landmark' ? 'Monuments' : 
               type === 'water' ? 'Points d\'eau' : 
               type === 'parking' ? 'Parkings' : 'Autres'}
            </Typography>
            
            {groupedPOIs[type].map(poi => renderPointOfInterest(poi))}
          </Box>
        ))}
      </Box>
    );
  };
  
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Chargement des données du col...
        </Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Erreur: {error.message}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/catalogue-cols')}
          sx={{ mt: 2 }}
        >
          Retour au catalogue de cols
        </Button>
      </Container>
    );
  }
  
  if (!col) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h6">
          Col non trouvé
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/catalogue-cols')}
          sx={{ mt: 2 }}
        >
          Retour au catalogue de cols
        </Button>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* En-tête */}
      <Box sx={{ mb: 4 }}>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/catalogue-cols')}
          sx={{ mb: 2 }}
        >
          Retour au catalogue
        </Button>
        
        <Paper 
          sx={{ 
            p: 3, 
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${col.imageUrl || '/images/default-col.jpg'})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            borderRadius: 2,
            position: 'relative'
          }}
        >
          <Box>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              {col.name}
            </Typography>
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
              <Chip 
                label={col.region}
                color="primary"
              />
              <Chip 
                label={col.country}
                variant="outlined"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}
              />
              <Chip 
                label={
                  col.difficulty === 'easy' ? 'Facile' : 
                  col.difficulty === 'medium' ? 'Moyen' : 
                  col.difficulty === 'hard' ? 'Difficile' : 'Extrême'
                }
                color={
                  col.difficulty === 'easy' ? 'success' : 
                  col.difficulty === 'medium' ? 'info' : 
                  col.difficulty === 'hard' ? 'warning' : 'error'
                }
              />
            </Box>
            
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box>
                <Typography variant="body2" color="grey.300">Altitude</Typography>
                <Typography variant="h6">{col.elevation} m</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="grey.300">Distance</Typography>
                <Typography variant="h6">{col.length} km</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="grey.300">Pente moyenne</Typography>
                <Typography variant="h6">{col.avgGradient}%</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="grey.300">Pente maximale</Typography>
                <Typography variant="h6">{col.maxGradient}%</Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
      
      {/* Onglets */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : undefined}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab icon={<View3dIcon />} label="Visualisation 3D" />
          <Tab icon={<InfoIcon />} label="Informations" />
          <Tab icon={<TerrainIcon />} label="Points d'intérêt" />
        </Tabs>
        
        <Divider />
        
        <Box p={3}>
          {selectedTab === 0 && render3DTab()}
          {selectedTab === 1 && renderInfoTab()}
          {selectedTab === 2 && renderPOITab()}
        </Box>
      </Paper>
      
      {/* Cols similaires */}
      {relatedCols.length > 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Cols similaires dans la région
          </Typography>
          
          <Grid container spacing={3}>
            {relatedCols.map(relatedCol => (
              <Grid item xs={12} sm={6} md={4} key={relatedCol.id}>
                <Card 
                  elevation={3} 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/col-3d-viewer?colId=${relatedCol.id}`)}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={relatedCol.imageUrl || '/images/default-col.jpg'}
                    alt={relatedCol.name}
                  />
                  <CardContent>
                    <Typography gutterBottom variant="h6" component="div">
                      {relatedCol.name}
                    </Typography>
                    
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip 
                        label={
                          relatedCol.difficulty === 'easy' ? 'Facile' : 
                          relatedCol.difficulty === 'medium' ? 'Moyen' : 
                          relatedCol.difficulty === 'hard' ? 'Difficile' : 'Extrême'
                        }
                        size="small"
                        color={
                          relatedCol.difficulty === 'easy' ? 'success' : 
                          relatedCol.difficulty === 'medium' ? 'info' : 
                          relatedCol.difficulty === 'hard' ? 'warning' : 'error'
                        }
                      />
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">
                        {relatedCol.length} km
                      </Typography>
                      <Typography variant="body2">
                        {relatedCol.avgGradient}%
                      </Typography>
                      <Typography variant="body2">
                        {relatedCol.elevation} m
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default Col3DViewer;
