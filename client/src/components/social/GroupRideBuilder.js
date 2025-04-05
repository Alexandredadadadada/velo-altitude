/**
 * GroupRideBuilder.js
 * Composant principal pour la planification et gestion des sorties cyclistes en groupe
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import GroupRideService from '../../services/groupRideService';
import UserService from '../../services/UserService';
import AuthService from '../../services/authService';
import { useNotification } from '../common/NotificationSystem';
import GroupRidesList from './group-rides/GroupRidesList';
import GroupRideFilters from './group-rides/GroupRideFilters';
import CreateGroupRideDialog from './group-rides/CreateGroupRideDialog';
import GroupRideDetails from './group-rides/GroupRideDetails';
import { brandConfig } from '../../config/branding';

/**
 * Composant principal pour les sorties de groupe
 * @param {Object} props - Propriétés du composant
 * @param {string} props.userId - ID utilisateur courant
 */
const GroupRideBuilder = ({ userId }) => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [groupRides, setGroupRides] = useState([]);
  const [userRides, setUserRides] = useState([]);
  const [organizedRides, setOrganizedRides] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    region: '',
    levelRequired: '',
    terrainType: '',
    fromDate: new Date().toISOString().split('T')[0],
    minSpeed: '',
    maxSpeed: '',
    search: ''
  });
  const [selectedRide, setSelectedRide] = useState(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
    
    // Charger le profil utilisateur si connecté
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  // Charger le profil utilisateur
  const loadUserProfile = async () => {
    try {
      const profile = await UserService.getUserProfile(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Erreur lors du chargement du profil utilisateur:', error);
    }
  };

  // Charger les données des sorties
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Récupérer les sorties publiques avec les filtres appliqués
      const allRides = await GroupRideService.getAllGroupRides(filters);
      setGroupRides(allRides);

      // Si l'utilisateur est connecté, récupérer ses sorties
      if (userId) {
        const [userGroupRides, userOrgRides] = await Promise.all([
          GroupRideService.getUserGroupRides(userId),
          GroupRideService.getUserOrganizedRides(userId)
        ]);
        setUserRides(userGroupRides);
        setOrganizedRides(userOrgRides);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError(err.message || 'Une erreur est survenue lors du chargement des sorties de groupe');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Gérer l'ouverture des filtres
  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Appliquer les filtres
  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    loadData();
  };

  // Réinitialiser les filtres
  const handleResetFilters = () => {
    setFilters({
      region: '',
      levelRequired: '',
      terrainType: '',
      fromDate: new Date().toISOString().split('T')[0],
      minSpeed: '',
      maxSpeed: '',
      search: ''
    });
    loadData();
  };

  // Voir les détails d'une sortie
  const handleViewRide = (ride) => {
    setSelectedRide(ride);
    setShowRideDetails(true);
  };

  // Fermer les détails d'une sortie
  const handleCloseRideDetails = () => {
    setShowRideDetails(false);
  };

  // Créer une nouvelle sortie
  const handleCreateRide = () => {
    setCreateDialogOpen(true);
  };

  // Gérer la soumission du formulaire de création
  const handleSubmitRideCreation = async (rideData) => {
    try {
      setLoading(true);
      const newRide = await GroupRideService.createGroupRide(rideData);
      
      // Actualiser les données
      await loadData();
      
      // Fermer le dialogue
      setCreateDialogOpen(false);
      
      // Notification de succès
      setNotification({
        open: true,
        message: 'Sortie créée avec succès!',
        severity: 'success'
      });
      
      // Ouvrir les détails de la nouvelle sortie
      setSelectedRide(newRide);
      setShowRideDetails(true);
      
    } catch (error) {
      console.error('Erreur lors de la création de la sortie:', error);
      setNotification({
        open: true,
        message: error.message || 'Erreur lors de la création de la sortie',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Rejoindre une sortie
  const handleJoinRide = async (rideId) => {
    try {
      setLoading(true);
      const result = await GroupRideService.joinGroupRide(rideId);
      
      // Actualiser les données
      await loadData();
      
      // Si la sortie actuelle est sélectionnée, actualiser ses détails
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide(result.ride);
      }
      
      // Notification de succès
      setNotification({
        open: true,
        message: result.message || 'Vous avez rejoint la sortie avec succès!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erreur lors de la tentative de rejoindre la sortie:', error);
      setNotification({
        open: true,
        message: error.message || 'Erreur lors de la tentative de rejoindre la sortie',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Quitter une sortie
  const handleLeaveRide = async (rideId) => {
    try {
      setLoading(true);
      const result = await GroupRideService.leaveGroupRide(rideId);
      
      // Actualiser les données
      await loadData();
      
      // Si la sortie actuelle est sélectionnée, actualiser ses détails
      if (selectedRide && selectedRide.id === rideId) {
        setSelectedRide(result.ride);
      }
      
      // Notification de succès
      setNotification({
        open: true,
        message: result.message || 'Vous avez quitté la sortie avec succès!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erreur lors de la tentative de quitter la sortie:', error);
      setNotification({
        open: true,
        message: error.message || 'Erreur lors de la tentative de quitter la sortie',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Partager sur Strava
  const handleShareOnStrava = async (rideId) => {
    try {
      setLoading(true);
      const result = await GroupRideService.shareOnStrava(rideId);
      
      // Actualiser les données
      await loadData();
      
      // Si la sortie actuelle est sélectionnée, actualiser ses détails
      if (selectedRide && selectedRide.id === rideId) {
        const updatedRide = await GroupRideService.getGroupRideById(rideId);
        setSelectedRide(updatedRide);
      }
      
      // Notification de succès
      setNotification({
        open: true,
        message: result.message || 'Sortie partagée sur Strava avec succès!',
        severity: 'success'
      });
      
    } catch (error) {
      console.error('Erreur lors du partage sur Strava:', error);
      setNotification({
        open: true,
        message: error.message || 'Erreur lors du partage sur Strava',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fermer les notifications
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Rendu des onglets
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Toutes les sorties
        return (
          <GroupRidesList
            rides={groupRides}
            onViewRide={handleViewRide}
            onJoinRide={handleJoinRide}
            userProfile={userProfile}
            emptyMessage="Aucune sortie de groupe disponible avec ces critères"
          />
        );
      
      case 1: // Mes sorties
        return (
          <GroupRidesList
            rides={userRides}
            onViewRide={handleViewRide}
            onLeaveRide={handleLeaveRide}
            userProfile={userProfile}
            emptyMessage="Vous ne participez à aucune sortie pour le moment"
            type="user"
          />
        );
      
      case 2: // Sorties que j'organise
        return (
          <GroupRidesList
            rides={organizedRides}
            onViewRide={handleViewRide}
            onShareOnStrava={handleShareOnStrava}
            userProfile={userProfile}
            emptyMessage="Vous n'organisez aucune sortie pour le moment"
            type="organizer"
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="group-ride-builder">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">
          {t('groupRides')}
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<FilterIcon />}
            onClick={handleToggleFilters}
            sx={{ mr: 1 }}
          >
            {showFilters ? t('hideFilters') : t('showFilters')}
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={loadData}
            sx={{ mr: 1 }}
          >
            {t('refresh')}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateRide}
            disabled={!userId}
          >
            {t('createRide')}
          </Button>
        </Box>
      </Box>
      
      {showFilters && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <GroupRideFilters
            filters={filters}
            onApplyFilters={handleApplyFilters}
            onResetFilters={handleResetFilters}
          />
        </Paper>
      )}
      
      <Box sx={{ mb: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('allRides')} />
          <Tab label={t('myRides')} disabled={!userId} />
          <Tab label={t('myOrganizedRides')} disabled={!userId} />
        </Tabs>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        renderTabContent()
      )}
      
      {/* Dialog pour afficher les détails d'une sortie */}
      {selectedRide && (
        <GroupRideDetails
          open={showRideDetails}
          onClose={handleCloseRideDetails}
          ride={selectedRide}
          onJoinRide={handleJoinRide}
          onLeaveRide={handleLeaveRide}
          onShareOnStrava={handleShareOnStrava}
          userProfile={userProfile}
        />
      )}
      
      {/* Dialog pour créer une nouvelle sortie */}
      <CreateGroupRideDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleSubmitRideCreation}
        userProfile={userProfile}
      />
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

GroupRideBuilder.propTypes = {
  userId: PropTypes.string
};

export default GroupRideBuilder;
