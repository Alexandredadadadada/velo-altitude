// src/components/profile/PrivacyManager.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Switch, 
  FormControlLabel, 
  Divider, 
  Alert, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Button,
  Snackbar,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Radio,
  RadioGroup,
  FormLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Public as PublicIcon,
  Group as GroupIcon,
  Lock as LockIcon,
  DeleteForever as DeleteForeverIcon,
  CloudDownload as CloudDownloadIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useApiOrchestrator } from '../../hooks/useApiOrchestrator';

// Types pour les paramètres de confidentialité
interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  activitySharing: {
    enabled: boolean;
    includeMap: boolean;
    includePerformance: boolean;
    includePhotos: boolean;
    defaultVisibility: 'public' | 'friends' | 'private';
  };
  dataRetention: {
    keepActivities: 'forever' | '1year' | '3months';
    automaticDeletion: boolean;
    deleteInactiveAfter: '1year' | '2years' | 'never';
  };
  socialIntegration: {
    allowTagging: boolean;
    shareAchievements: boolean;
    allowFriendSearch: boolean;
  };
  personalData: {
    shareLocation: boolean;
    shareStats: boolean;
    allowAnalytics: boolean;
    showInRankings: boolean;
    showRealName: boolean;
  };
}

// Composant principal
const PrivacyManager: React.FC = () => {
  const apiOrchestrator = useApiOrchestrator();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [expanded, setExpanded] = useState<string | false>('panel1');

  // Charger les paramètres de confidentialité
  useEffect(() => {
    loadPrivacySettings();
  }, []);

  // Gérer l'expansion des panneaux
  const handlePanelChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  // Charger les paramètres de confidentialité
  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      // Dans une application réelle, cela viendrait de l'API
      // const response = await apiOrchestrator.getUserPrivacySettings();
      
      // Simulation de données pour le développement
      await new Promise(resolve => setTimeout(resolve, 800)); // Simuler un délai réseau
      
      const mockSettings: PrivacySettings = {
        profileVisibility: 'friends',
        activitySharing: {
          enabled: true,
          includeMap: true,
          includePerformance: false,
          includePhotos: true,
          defaultVisibility: 'friends'
        },
        dataRetention: {
          keepActivities: 'forever',
          automaticDeletion: false,
          deleteInactiveAfter: '2years'
        },
        socialIntegration: {
          allowTagging: true,
          shareAchievements: true,
          allowFriendSearch: true
        },
        personalData: {
          shareLocation: false,
          shareStats: true,
          allowAnalytics: true,
          showInRankings: true,
          showRealName: false
        }
      };
      
      setSettings(mockSettings);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des paramètres de confidentialité:', err);
      setError('Impossible de charger les paramètres de confidentialité');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les paramètres de confidentialité
  const savePrivacySettings = async () => {
    if (!settings) return;
    
    try {
      setLoading(true);
      
      // Dans une application réelle, envoyer à l'API
      // await apiOrchestrator.updateUserPrivacySettings(settings);
      
      // Simulation pour le développement
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Paramètres de confidentialité mis à jour avec succès');
      setUnsavedChanges(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError('Impossible de mettre à jour les paramètres de confidentialité');
    } finally {
      setLoading(false);
    }
  };

  // Gérer les changements de paramètres
  const handleSettingChange = (section: keyof PrivacySettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings(prevSettings => {
      if (!prevSettings) return null;
      
      const newSettings = { ...prevSettings };
      
      if (field.includes('.')) {
        // Gérer les champs imbriqués (ex: "activitySharing.enabled")
        const [subSection, subField] = field.split('.');
        newSettings[section as keyof PrivacySettings][subSection as keyof typeof newSettings[typeof section]][subField as any] = value;
      } else {
        // Champs directs
        newSettings[section][field as keyof typeof newSettings[typeof section]] = value;
      }
      
      return newSettings;
    });
    
    setUnsavedChanges(true);
  };

  // Télécharger les données personnelles
  const handleDataDownload = async () => {
    try {
      setLoading(true);
      
      // Simulation pour le développement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess('Demande de téléchargement des données traitée. Vous recevrez un email avec un lien de téléchargement.');
    } catch (err) {
      console.error('Erreur lors de la demande de téléchargement:', err);
      setError('Impossible de traiter la demande de téléchargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour fermer les alertes
  const handleCloseAlert = () => {
    setError(null);
    setSuccess(null);
  };

  if (loading && !settings) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !settings) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadPrivacySettings}>
            Réessayer
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!settings) {
    return (
      <Alert severity="warning">
        Impossible de charger les paramètres de confidentialité
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Contrôles de confidentialité
        </Typography>
        
        <Box>
          {unsavedChanges && (
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<SaveIcon />}
              onClick={savePrivacySettings}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Enregistrer les modifications
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPrivacySettings}
            disabled={loading}
          >
            Actualiser
          </Button>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Configurez qui peut voir vos données, comment elles sont partagées et gérez vos préférences de confidentialité.
      </Typography>
      
      {/* Section visibilité du profil */}
      <Accordion 
        expanded={expanded === 'panel1'} 
        onChange={handlePanelChange('panel1')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <VisibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Visibilité du profil
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl component="fieldset">
            <FormLabel component="legend">Qui peut voir votre profil ?</FormLabel>
            <RadioGroup
              value={settings.profileVisibility}
              onChange={(e) => handleSettingChange('profileVisibility', '', e.target.value)}
            >
              <FormControlLabel 
                value="public" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" display="flex" alignItems="center">
                      <PublicIcon fontSize="small" sx={{ mr: 0.5 }} /> Public
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tout le monde peut voir votre profil, y compris les visiteurs non inscrits
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="friends" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" display="flex" alignItems="center">
                      <GroupIcon fontSize="small" sx={{ mr: 0.5 }} /> Amis uniquement
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Seuls vos amis peuvent voir votre profil complet
                    </Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="private" 
                control={<Radio />} 
                label={
                  <Box>
                    <Typography variant="body1" display="flex" alignItems="center">
                      <LockIcon fontSize="small" sx={{ mr: 0.5 }} /> Privé
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Votre profil n'est visible que par vous
                    </Typography>
                  </Box>
                } 
              />
            </RadioGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
      
      {/* Section partage d'activités */}
      <Accordion 
        expanded={expanded === 'panel2'} 
        onChange={handlePanelChange('panel2')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <PublicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Partage d'activités
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={settings.activitySharing.enabled}
                onChange={(e) => handleSettingChange('activitySharing', 'enabled', e.target.checked)}
              />
            }
            label="Partager mes activités"
          />
          
          <Box sx={{ ml: 4, mt: 2 }}>
            <Typography variant="body2" gutterBottom>Éléments à inclure dans les activités partagées :</Typography>
            
            <FormControlLabel
              disabled={!settings.activitySharing.enabled}
              control={
                <Switch
                  checked={settings.activitySharing.includeMap}
                  onChange={(e) => handleSettingChange('activitySharing', 'includeMap', e.target.checked)}
                />
              }
              label="Carte du parcours"
            />
            
            <FormControlLabel
              disabled={!settings.activitySharing.enabled}
              control={
                <Switch
                  checked={settings.activitySharing.includePerformance}
                  onChange={(e) => handleSettingChange('activitySharing', 'includePerformance', e.target.checked)}
                />
              }
              label="Données de performance (puissance, fréquence cardiaque)"
            />
            
            <FormControlLabel
              disabled={!settings.activitySharing.enabled}
              control={
                <Switch
                  checked={settings.activitySharing.includePhotos}
                  onChange={(e) => handleSettingChange('activitySharing', 'includePhotos', e.target.checked)}
                />
              }
              label="Photos"
            />
            
            <Box mt={2}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Visibilité par défaut des nouvelles activités</InputLabel>
                <Select
                  value={settings.activitySharing.defaultVisibility}
                  onChange={(e) => handleSettingChange('activitySharing', 'defaultVisibility', e.target.value)}
                  label="Visibilité par défaut des nouvelles activités"
                  disabled={!settings.activitySharing.enabled}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="friends">Amis uniquement</MenuItem>
                  <MenuItem value="private">Privé</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Section intégration sociale */}
      <Accordion 
        expanded={expanded === 'panel3'} 
        onChange={handlePanelChange('panel3')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Intégration sociale
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={settings.socialIntegration.allowTagging}
                onChange={(e) => handleSettingChange('socialIntegration', 'allowTagging', e.target.checked)}
              />
            }
            label="Autoriser les autres utilisateurs à me taguer dans leurs activités"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.socialIntegration.shareAchievements}
                onChange={(e) => handleSettingChange('socialIntegration', 'shareAchievements', e.target.checked)}
              />
            }
            label="Partager automatiquement mes réalisations et badges"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.socialIntegration.allowFriendSearch}
                onChange={(e) => handleSettingChange('socialIntegration', 'allowFriendSearch', e.target.checked)}
              />
            }
            label="Autoriser la recherche de mon profil via email ou nom"
          />
        </AccordionDetails>
      </Accordion>
      
      {/* Section données personnelles */}
      <Accordion 
        expanded={expanded === 'panel4'} 
        onChange={handlePanelChange('panel4')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <LockIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Données personnelles
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={
              <Switch
                checked={settings.personalData.shareLocation}
                onChange={(e) => handleSettingChange('personalData', 'shareLocation', e.target.checked)}
              />
            }
            label="Partager ma position de départ/arrivée précise"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.personalData.shareStats}
                onChange={(e) => handleSettingChange('personalData', 'shareStats', e.target.checked)}
              />
            }
            label="Partager mes statistiques personnelles (FTP, FC max, etc.)"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.personalData.allowAnalytics}
                onChange={(e) => handleSettingChange('personalData', 'allowAnalytics', e.target.checked)}
              />
            }
            label="Autoriser l'analyse de mes données pour des recommandations personnalisées"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.personalData.showInRankings}
                onChange={(e) => handleSettingChange('personalData', 'showInRankings', e.target.checked)}
              />
            }
            label="Apparaître dans les classements et comparaisons"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.personalData.showRealName}
                onChange={(e) => handleSettingChange('personalData', 'showRealName', e.target.checked)}
              />
            }
            label="Afficher mon nom réel (sinon, seul le pseudonyme sera visible)"
          />
        </AccordionDetails>
      </Accordion>
      
      {/* Section conservation des données */}
      <Accordion 
        expanded={expanded === 'panel5'} 
        onChange={handlePanelChange('panel5')}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle1">
            <DeleteForeverIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Conservation des données
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
            <InputLabel>Conserver mes activités pendant</InputLabel>
            <Select
              value={settings.dataRetention.keepActivities}
              onChange={(e) => handleSettingChange('dataRetention', 'keepActivities', e.target.value)}
              label="Conserver mes activités pendant"
            >
              <MenuItem value="forever">Indéfiniment</MenuItem>
              <MenuItem value="1year">1 an</MenuItem>
              <MenuItem value="3months">3 mois</MenuItem>
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.dataRetention.automaticDeletion}
                onChange={(e) => handleSettingChange('dataRetention', 'automaticDeletion', e.target.checked)}
              />
            }
            label="Supprimer automatiquement les anciennes activités"
          />
          
          <FormControl 
            fullWidth 
            variant="outlined" 
            size="small" 
            sx={{ mt: 2 }}
            disabled={!settings.dataRetention.automaticDeletion}
          >
            <InputLabel>Supprimer le compte en cas d'inactivité après</InputLabel>
            <Select
              value={settings.dataRetention.deleteInactiveAfter}
              onChange={(e) => handleSettingChange('dataRetention', 'deleteInactiveAfter', e.target.value)}
              label="Supprimer le compte en cas d'inactivité après"
            >
              <MenuItem value="1year">1 an</MenuItem>
              <MenuItem value="2years">2 ans</MenuItem>
              <MenuItem value="never">Jamais</MenuItem>
            </Select>
          </FormControl>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="subtitle2" gutterBottom color="primary">
              Exportation et suppression des données
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  fullWidth
                  startIcon={<CloudDownloadIcon />}
                  onClick={handleDataDownload}
                >
                  Télécharger mes données
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth
                  startIcon={<DeleteForeverIcon />}
                  onClick={() => setDeleteAccountConfirm(true)}
                >
                  Supprimer mon compte
                </Button>
              </Grid>
            </Grid>
          </Box>
        </AccordionDetails>
      </Accordion>
      
      {/* Boîte de confirmation pour la suppression du compte */}
      {deleteAccountConfirm && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6" gutterBottom>
            <WarningIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Confirmer la suppression du compte
          </Typography>
          
          <Typography variant="body2" paragraph>
            Cette action est <strong>irréversible</strong>. Toutes vos données, activités, et réalisations seront définitivement supprimées.
          </Typography>
          
          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Button 
              variant="outlined" 
              onClick={() => setDeleteAccountConfirm(false)}
              sx={{ mr: 1 }}
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              color="error"
              onClick={() => {
                // Logique de suppression du compte
                setDeleteAccountConfirm(false);
                setSuccess('Demande de suppression du compte traitée. Vous recevrez un email de confirmation.');
              }}
            >
              Confirmer la suppression
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Alertes de succès/erreur */}
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="success">
          {success}
        </Alert>
      </Snackbar>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity="error">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PrivacyManager;
