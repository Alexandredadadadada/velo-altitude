import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Tab, Tabs, Alert, Paper, CircularProgress, Button } from '@mui/material';
import { MapOutlined, ViewList, Info, Cloud } from '@mui/icons-material';
import colsAlpes from '../data/cols/colsAlpes';
import colsPyrenees from '../data/cols/colsPyrenees';
import colsVosges from '../data/cols/colsVosges';
import colsVosgesNord from '../data/cols/colsVosgesNord';
import colsJura from '../data/cols/colsJura';
import colsMassifCentral from '../data/cols/colsMassifCentral';
import colsAlpesSuisses from '../data/cols/colsAlpesSuisses';
import colsDolomites from '../data/cols/colsDolomites';
import ColFilterBar from '../components/cols/ColFilterBar';
import ColWeatherMap from '../components/cols/ColWeatherMap';
import ColsList from '../components/cols/ColsList';
import './ColsExplorer.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

// Ajouter les coordonnées aux cols pour la carte météo
const addDefaultCoordinates = (cols, region) => {
  return cols.map(col => {
    // Si les coordonnées sont déjà définies, on les garde
    if (col.coordinates) return col;
    
    // Sinon, on ajoute des coordonnées par défaut en fonction de la région
    let defaultCoordinates = { lat: 0, lng: 0 };
    
    switch (region) {
      case 'alpes':
        defaultCoordinates = { lat: 45.8, lng: 6.9 };
        break;
      case 'pyrenees':
        defaultCoordinates = { lat: 42.9, lng: 0.1 };
        break;
      case 'vosges':
        defaultCoordinates = { lat: 48.1, lng: 7.1 };
        break;
      case 'jura':
        defaultCoordinates = { lat: 46.6, lng: 6.0 };
        break;
      case 'massif-central':
        defaultCoordinates = { lat: 45.7, lng: 2.9 };
        break;
      case 'dolomites':
        defaultCoordinates = { lat: 46.4, lng: 11.9 };
        break;
      case 'alps-switzerland':
        defaultCoordinates = { lat: 46.6, lng: 8.0 };
        break;
      default:
        defaultCoordinates = { lat: 45.8, lng: 6.9 };
    }
    
    return {
      ...col,
      coordinates: defaultCoordinates
    };
  });
};

const ColsExplorer = () => {
  // État pour le mode d'affichage (liste ou carte)
  const [view, setView] = useState('list');
  
  // État pour les filtres
  const [filters, setFilters] = useState({
    region: 'all',
    difficulty: 'all',
    altitude: [0, 3500],
    length: [0, 30],
    gradient: [0, 15],
    withWeatherOnly: false
  });
  
  // État pour les cols (tous et filtrés)
  const [allCols, setAllCols] = useState([]);
  const [filteredCols, setFilteredCols] = useState([]);
  
  // État pour le chargement
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chargement initial des cols
  useEffect(() => {
    try {
      // Combine tous les cols de différentes régions
      const alpes = addDefaultCoordinates(colsAlpes, 'alpes');
      const pyrenees = addDefaultCoordinates(colsPyrenees, 'pyrenees');
      const vosges = addDefaultCoordinates(colsVosges, 'vosges');
      const vosgesNord = addDefaultCoordinates(colsVosgesNord, 'vosges');
      const jura = addDefaultCoordinates(colsJura, 'jura');
      const massifCentral = addDefaultCoordinates(colsMassifCentral, 'massif-central');
      const alpesSuisses = addDefaultCoordinates(colsAlpesSuisses, 'alps-switzerland');
      const dolomites = addDefaultCoordinates(colsDolomites, 'dolomites');
      
      const allColsData = [
        ...alpes,
        ...pyrenees,
        ...vosges,
        ...vosgesNord,
        ...jura,
        ...massifCentral,
        ...alpesSuisses,
        ...dolomites
      ];
      
      setAllCols(allColsData);
      setFilteredCols(allColsData);
      setLoading(false);
    } catch (err) {
      console.error('Erreur lors du chargement des données des cols:', err);
      setError('Une erreur est survenue lors du chargement des données. Veuillez réessayer plus tard.');
      setLoading(false);
    }
  }, []);
  
  // Filtre les cols lorsque les filtres changent
  useEffect(() => {
    if (allCols.length === 0) return;
    
    const filtered = allCols.filter(col => {
      // Filtre par région
      if (filters.region !== 'all' && col.region !== filters.region) {
        return false;
      }
      
      // Filtre par difficulté
      if (filters.difficulty !== 'all' && col.difficulty !== filters.difficulty) {
        return false;
      }
      
      // Filtre par altitude
      if (col.altitude < filters.altitude[0] || col.altitude > filters.altitude[1]) {
        return false;
      }
      
      // Filtre par longueur
      if (col.length < filters.length[0] || col.length > filters.length[1]) {
        return false;
      }
      
      // Filtre par pente moyenne
      if (col.avgGradient < filters.gradient[0] || col.avgGradient > filters.gradient[1]) {
        return false;
      }
      
      // Filtre par présence de données météo
      if (filters.withWeatherOnly && !col.weather) {
        return false;
      }
      
      return true;
    });
    
    setFilteredCols(filtered);
  }, [filters, allCols]);
  
  // Réinitialise les filtres
  const resetFilters = () => {
    setFilters({
      region: 'all',
      difficulty: 'all',
      altitude: [0, 3500],
      length: [0, 30],
      gradient: [0, 15],
      withWeatherOnly: false
    });
  };
  
  // Gère le changement de vue (liste ou carte)
  const handleViewChange = (event, newValue) => {
    setView(newValue);
  };
  
  if (loading) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SportsActivity",
          "name": "{col.name}",
          "description": "{col.description}",
          "url": "https://velo-altitude.com/colsexplorer"
        }
      </script>
      <EnhancedMetaTags
        title="Détail du Col | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
      <Container className="cols-explorer-container">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="cols-explorer-container">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container className="cols-explorer-container">
      <Paper elevation={0} className="cols-header">
        <Typography variant="h3" component="h1" gutterBottom>
          Explorateur de Cols
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Découvrez et explorez les plus beaux cols cyclistes d'Europe, avec des données météo en temps réel, des profils d'élévation détaillés et des informations complètes pour planifier vos sorties vélo.
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs 
            value={view} 
            onChange={handleViewChange} 
            aria-label="Mode d'affichage des cols"
            variant="fullWidth"
          >
            <Tab icon={<ViewList />} label="LISTE" value="list" />
            <Tab icon={<MapOutlined />} label="CARTE MÉTÉO" value="map" />
            <Tab icon={<Info />} label="COMMENT UTILISER" value="help" />
          </Tabs>
        </Box>
      </Paper>
      
      {view !== 'help' && (
        <ColFilterBar 
          filters={filters} 
          setFilters={setFilters} 
          resetFilters={resetFilters} 
          colsCount={filteredCols.length}
        />
      )}
      
      {view === 'list' && (
        <ColsList cols={filteredCols} />
      )}
      
      {view === 'map' && (
        <ColWeatherMap 
          cols={filteredCols} 
          selectedRegion={filters.region}
        />
      )}
      
      {view === 'help' && (
        <Paper elevation={2} className="help-paper">
          <Typography variant="h5" gutterBottom>
            Comment utiliser l'explorateur de cols
          </Typography>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Fonctionnalités disponibles
          </Typography>
          
          <ul className="help-list">
            <li>
              <strong>Filtrage avancé:</strong> Filtrez les cols par région, difficulté, altitude, longueur et pente moyenne pour trouver exactement ce que vous cherchez.
            </li>
            <li>
              <strong>Vue Liste:</strong> Consultez la liste complète des cols avec leurs caractéristiques principales, triez-les et accédez aux détails complets.
            </li>
            <li>
              <strong>Carte Météo:</strong> Visualisez les cols sur la carte avec les conditions météo en temps réel pour planifier votre prochaine sortie.
            </li>
            <li>
              <strong>Fiches détaillées:</strong> Accédez à toutes les informations sur chaque col: profil d'élévation, histoire, segments populaires, différentes approches et installations disponibles.
            </li>
            <li>
              <strong>Intégration Strava:</strong> Consultez les segments Strava et les records associés à chaque col.
            </li>
          </ul>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Utilisation des filtres
          </Typography>
          
          <ul className="help-list">
            <li>
              <strong>Région:</strong> Sélectionnez une région spécifique (Alpes, Pyrénées, Vosges, etc.) ou "Toutes les régions".
            </li>
            <li>
              <strong>Difficulté:</strong> Filtrez par niveau de difficulté, de Facile à Extrême.
            </li>
            <li>
              <strong>Altitude:</strong> Définissez une plage d'altitude pour le sommet du col.
            </li>
            <li>
              <strong>Longueur:</strong> Spécifiez la longueur de l'ascension en kilomètres.
            </li>
            <li>
              <strong>Pente moyenne:</strong> Filtrez par pourcentage de pente moyenne.
            </li>
            <li>
              <strong>Données météo:</strong> Affichez uniquement les cols avec des données météo disponibles.
            </li>
          </ul>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<ViewList />}
              onClick={() => setView('list')}
              sx={{ mr: 2 }}
            >
              Voir la liste des cols
            </Button>
            <Button 
              variant="outlined"
              color="primary"
              size="large"
              startIcon={<Cloud />}
              onClick={() => setView('map')}
            >
              Voir la carte météo
            </Button>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default ColsExplorer;
