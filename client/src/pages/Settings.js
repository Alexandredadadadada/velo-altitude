import React, { useState } from 'react';
import { Container, Paper, Typography, Box, Tabs, Tab, Divider, Button, Snackbar, Alert } from '@mui/material';
import { Save as SaveIcon, Language as LanguageIcon, Palette as PaletteIcon, Notifications as NotificationsIcon, Security as SecurityIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Composants de réglages
import ThemeSettings from '../components/settings/ThemeSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import LanguageSettings from '../components/settings/LanguageSettings';
import PrivacySettings from '../components/settings/PrivacySettings';

/**
 * Page de réglages utilisateur
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { userProfile, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Gestion des onglets
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Valeurs par défaut pour les réglages
  const defaultSettings = {
    theme: {
      mode: 'light',
      primaryColor: '#1976d2',
      fontSize: 'medium',
      animations: true
    },
    notifications: {
      pushEnabled: true,
      emailEnabled: true,
      achievementsNotification: true,
      friendsActivityNotification: true,
      marketingNotification: false
    },
    language: {
      interface: 'fr',
      units: 'metric',
      dateFormat: 'DD/MM/YYYY'
    },
    privacy: {
      profileVisibility: 'public',
      activitySharing: 'friends',
      locationSharing: 'off',
      dataCollection: 'minimal'
    }
  };

  // État pour les réglages utilisateur
  const [settings, setSettings] = useState(
    userProfile?.preferences || defaultSettings
  );

  // Mise à jour des réglages
  const handleSettingsChange = (category, values) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...values
      }
    }));
  };

  // Sauvegarde des réglages
  const saveSettings = async () => {
    try {
      await updateUserProfile({ preferences: settings });
      setSnackbar({
        open: true,
        message: 'Réglages enregistrés avec succès',
        severity: 'success'
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des réglages:', error);
      setSnackbar({
        open: true,
        message: 'Erreur lors de la sauvegarde des réglages',
        severity: 'error'
      });
    }
  };

  // Fermeture du snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Simulons simplement l'existence des composants de réglages
  // Dans un projet réel, ces composants existeraient et utiliseraient les props
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Personnalisez l'apparence de l'application, y compris le thème, la taille du texte et les animations.
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Mode d'affichage
              </Typography>
              <div>Options du thème ici (clair/sombre/automatique)</div>
            </Box>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Couleurs et police
              </Typography>
              <div>Options de personnalisation de couleurs ici</div>
            </Box>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Animations et transitions
              </Typography>
              <div>Activation/désactivation des animations</div>
            </Box>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Gérez vos préférences de notifications pour rester informé des activités qui vous intéressent.
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Canaux de notification
              </Typography>
              <div>Options push/email ici</div>
            </Box>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Types de notifications
              </Typography>
              <div>Paramètres par type d'activité</div>
            </Box>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Définissez la langue de l'interface et vos préférences régionales.
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Langue de l'interface
              </Typography>
              <div>Options de langue ici</div>
            </Box>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Format des unités
              </Typography>
              <div>Choix métrique/impérial</div>
            </Box>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="body1" paragraph>
              Contrôlez la confidentialité de votre profil et de vos données.
            </Typography>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Visibilité du profil
              </Typography>
              <div>Options de visibilité ici</div>
            </Box>
            <Box sx={{ bgcolor: 'background.paper', p: 3, borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                Partage des données
              </Typography>
              <div>Options de partage d'activité</div>
            </Box>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h5" component="h1" fontWeight="bold">
            Paramètres
          </Typography>
          <Typography variant="body2">
            Personnalisez votre expérience Velo-Altitude
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="paramètres tabs"
          >
            <Tab icon={<PaletteIcon />} label="Apparence" iconPosition="start" />
            <Tab icon={<NotificationsIcon />} label="Notifications" iconPosition="start" />
            <Tab icon={<LanguageIcon />} label="Langue et région" iconPosition="start" />
            <Tab icon={<SecurityIcon />} label="Confidentialité" iconPosition="start" />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>

        <Divider />
        
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button 
            variant="outlined" 
            color="secondary"
            onClick={() => navigate(-1)}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveSettings}
          >
            Enregistrer les modifications
          </Button>
        </Box>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Settings;
