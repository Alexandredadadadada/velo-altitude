/**
 * Page de profil pour Velo-Altitude
 * 
 * Cette page affiche et permet la modification des informations du profil utilisateur.
 * Elle sert également de hub pour accéder aux fonctionnalités personnalisées.
 */

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button,
  Divider,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../auth';

// Interface pour les onglets
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Composant TabPanel pour afficher le contenu de l'onglet sélectionné
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);

  // Gérer le changement d'onglet
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Paper elevation={3}>
          {/* En-tête du profil */}
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={user.picture} 
              alt={user.name || ''}
              sx={{ width: 80, height: 80, mr: 3 }}
            />
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                {user.name || 'Utilisateur Velo-Altitude'}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {user.email || ''}
              </Typography>
              {user.role && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Rôle: {user.role}
                </Typography>
              )}
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={handleLogout}
              >
                Se déconnecter
              </Button>
            </Box>
          </Box>

          <Divider />

          {/* Navigation par onglets */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
              <Tab label="Informations" id="profile-tab-0" aria-controls="profile-tabpanel-0" />
              <Tab label="Activités" id="profile-tab-1" aria-controls="profile-tabpanel-1" />
              <Tab label="Paramètres" id="profile-tab-2" aria-controls="profile-tabpanel-2" />
            </Tabs>
          </Box>

          {/* Contenu des onglets */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Informations personnelles
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Cette section affichera vos informations personnelles et statistiques.
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Vos activités
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Consultez vos dernières activités et performances.
              </Typography>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Paramètres du compte
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                Gérez vos préférences et paramètres de compte.
              </Typography>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage;
