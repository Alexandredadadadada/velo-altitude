import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Switch, 
  FormControl, 
  FormControlLabel, 
  Select, 
  MenuItem, 
  InputLabel,
  Divider,
  Button,
  Tabs,
  Tab,
  TextField,
  Slider,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Save as SaveIcon,
  Refresh as ResetIcon,
  Translate as LanguageIcon,
  Speed as SpeedIcon,
  Straighten as DistanceIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  Palette as ThemeIcon,
  Tune as CustomizeIcon
} from '@mui/icons-material';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';

const apiOrchestrator = new APIOrchestrator();

interface PreferencesManagerProps {
  userId: string;
}

interface UserPreferences {
  display: {
    theme: 'light' | 'dark' | 'system';
    density: 'comfortable' | 'compact' | 'standard';
    fontSize: number;
    accentColor: string;
    animations: boolean;
    contrastMode: boolean;
  };
  units: {
    distance: 'km' | 'mi';
    elevation: 'm' | 'ft';
    weight: 'kg' | 'lb';
    temperature: 'c' | 'f';
    dateFormat: 'dd/mm/yyyy' | 'mm/dd/yyyy' | 'yyyy-mm-dd';
    timeFormat: '24h' | '12h';
  };
  language: {
    preferred: string;
    region: string;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    activityVisibility: 'public' | 'friends' | 'private';
    showRealName: boolean;
    showLocation: boolean;
    allowDataAnalytics: boolean;
  };
  performance: {
    loadHighResImages: boolean;
    enableAnimations: boolean;
    enable3dEffects: boolean;
    preloadData: boolean;
    enableOfflineMode: boolean;
  };
  notifications: {
    enableEmail: boolean;
    enablePush: boolean;
    enableInApp: boolean;
    emailDigestFrequency: 'daily' | 'weekly' | 'never';
  };
}

// Définition des options de langue disponibles
const languageOptions = [
  { code: 'fr', name: 'Français', regions: ['FR', 'BE', 'CH', 'CA', 'LU'] },
  { code: 'en', name: 'English', regions: ['US', 'GB', 'CA', 'AU', 'NZ'] },
  { code: 'de', name: 'Deutsch', regions: ['DE', 'AT', 'CH', 'LI'] },
  { code: 'es', name: 'Español', regions: ['ES', 'MX', 'AR', 'CO', 'PE'] },
  { code: 'it', name: 'Italiano', regions: ['IT', 'CH'] },
  { code: 'nl', name: 'Nederlands', regions: ['NL', 'BE'] }
];

// Définition des couleurs d'accent disponibles
const accentColors = [
  { name: 'Blue', value: '#1976d2' },
  { name: 'Purple', value: '#9c27b0' },
  { name: 'Green', value: '#2e7d32' },
  { name: 'Orange', value: '#ed6c02' },
  { name: 'Red', value: '#d32f2f' },
  { name: 'Teal', value: '#00796b' }
];

const PreferencesManager: React.FC<PreferencesManagerProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState<number>(0);
  const [preferences, setPreferences] = useState<UserPreferences>({
    display: {
      theme: 'system',
      density: 'standard',
      fontSize: 16,
      accentColor: '#1976d2',
      animations: true,
      contrastMode: false
    },
    units: {
      distance: 'km',
      elevation: 'm',
      weight: 'kg',
      temperature: 'c',
      dateFormat: 'dd/mm/yyyy',
      timeFormat: '24h'
    },
    language: {
      preferred: 'fr',
      region: 'FR'
    },
    privacy: {
      profileVisibility: 'friends',
      activityVisibility: 'friends',
      showRealName: true,
      showLocation: true,
      allowDataAnalytics: true
    },
    performance: {
      loadHighResImages: true,
      enableAnimations: true,
      enable3dEffects: true,
      preloadData: true,
      enableOfflineMode: false
    },
    notifications: {
      enableEmail: true,
      enablePush: true,
      enableInApp: true,
      emailDigestFrequency: 'weekly'
    }
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);

  // Charger les préférences de l'utilisateur
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setLoading(true);
        const userPrefs = await apiOrchestrator.getUserPreferences(userId);
        if (userPrefs) {
          setPreferences(userPrefs);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences utilisateur', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  // Gérer le changement d'onglet
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Mettre à jour les préférences d'affichage
  const updateDisplayPreferences = (key: keyof UserPreferences['display'], value: any) => {
    setPreferences({
      ...preferences,
      display: {
        ...preferences.display,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Mettre à jour les préférences d'unités
  const updateUnitPreferences = (key: keyof UserPreferences['units'], value: any) => {
    setPreferences({
      ...preferences,
      units: {
        ...preferences.units,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Mettre à jour les préférences de langue
  const updateLanguagePreferences = (key: keyof UserPreferences['language'], value: any) => {
    setPreferences({
      ...preferences,
      language: {
        ...preferences.language,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Mettre à jour les préférences de confidentialité
  const updatePrivacyPreferences = (key: keyof UserPreferences['privacy'], value: any) => {
    setPreferences({
      ...preferences,
      privacy: {
        ...preferences.privacy,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Mettre à jour les préférences de performance
  const updatePerformancePreferences = (key: keyof UserPreferences['performance'], value: any) => {
    setPreferences({
      ...preferences,
      performance: {
        ...preferences.performance,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Mettre à jour les préférences de notifications
  const updateNotificationPreferences = (key: keyof UserPreferences['notifications'], value: any) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value
      }
    });
    setHasChanges(true);
  };

  // Sauvegarder toutes les préférences
  const savePreferences = async () => {
    try {
      await apiOrchestrator.updateUserPreferences(userId, preferences);
      setSaveSuccess(true);
      setHasChanges(false);
      
      // Broadcaster l'événement de mise à jour des préférences
      window.dispatchEvent(new CustomEvent('userPreferencesUpdated', { 
        detail: preferences 
      }));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des préférences', error);
      setSaveError(true);
    }
  };

  // Réinitialiser les préférences
  const resetPreferences = async () => {
    if (resetConfirm) {
      try {
        const defaultPrefs = await apiOrchestrator.getDefaultUserPreferences();
        setPreferences(defaultPrefs);
        setHasChanges(true);
        setResetConfirm(false);
      } catch (error) {
        console.error('Erreur lors de la réinitialisation des préférences', error);
      }
    } else {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
    }
  };

  // Afficher le contenu correspondant à l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderDisplayPreferences();
      case 1:
        return renderUnitPreferences();
      case 2:
        return renderLanguagePreferences();
      case 3:
        return renderPrivacyPreferences();
      case 4:
        return renderPerformancePreferences();
      default:
        return null;
    }
  };

  // Rendu des préférences d'affichage
  const renderDisplayPreferences = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Apparence et thème
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Thème
            </Typography>
            <RadioGroup 
              value={preferences.display.theme}
              onChange={(e) => updateDisplayPreferences('theme', e.target.value)}
            >
              <FormControlLabel 
                value="light" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LightModeIcon sx={{ mr: 1 }} />
                    <Typography>Clair</Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="dark" 
                control={<Radio />} 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DarkModeIcon sx={{ mr: 1 }} />
                    <Typography>Sombre</Typography>
                  </Box>
                } 
              />
              <FormControlLabel 
                value="system" 
                control={<Radio />} 
                label="Utiliser les préférences système" 
              />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            Couleur d'accent
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {accentColors.map((color) => (
              <Tooltip key={color.value} title={color.name}>
                <IconButton
                  sx={{
                    bgcolor: color.value,
                    width: 40,
                    height: 40,
                    border: preferences.display.accentColor === color.value ? '3px solid #fff' : 'none',
                    boxShadow: preferences.display.accentColor === color.value ? '0 0 0 2px #000' : 'none',
                    '&:hover': {
                      bgcolor: color.value,
                    }
                  }}
                  onClick={() => updateDisplayPreferences('accentColor', color.value)}
                />
              </Tooltip>
            ))}
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" gutterBottom>
            Taille de police
          </Typography>
          <Box sx={{ width: '100%', px: 2 }}>
            <Slider
              value={preferences.display.fontSize}
              min={12}
              max={20}
              step={1}
              marks={[
                { value: 12, label: 'Petit' },
                { value: 16, label: 'Moyen' },
                { value: 20, label: 'Grand' }
              ]}
              onChange={(_e, value) => updateDisplayPreferences('fontSize', value)}
              valueLabelDisplay="auto"
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="density-label">Densité d'affichage</InputLabel>
            <Select
              labelId="density-label"
              value={preferences.display.density}
              label="Densité d'affichage"
              onChange={(e) => updateDisplayPreferences('density', e.target.value)}
            >
              <MenuItem value="compact">Compact</MenuItem>
              <MenuItem value="standard">Standard</MenuItem>
              <MenuItem value="comfortable">Confortable</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.display.animations} 
                  onChange={(e) => updateDisplayPreferences('animations', e.target.checked)} 
                />
              }
              label="Activer les animations d'interface"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.display.contrastMode} 
                  onChange={(e) => updateDisplayPreferences('contrastMode', e.target.checked)} 
                />
              }
              label="Mode contraste élevé (accessibilité)"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  // Rendu des préférences d'unités
  const renderUnitPreferences = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Unités de mesure
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Distance
            </Typography>
            <RadioGroup 
              value={preferences.units.distance}
              onChange={(e) => updateUnitPreferences('distance', e.target.value)}
            >
              <FormControlLabel value="km" control={<Radio />} label="Kilomètres (km)" />
              <FormControlLabel value="mi" control={<Radio />} label="Miles (mi)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Altitude / Dénivelé
            </Typography>
            <RadioGroup 
              value={preferences.units.elevation}
              onChange={(e) => updateUnitPreferences('elevation', e.target.value)}
            >
              <FormControlLabel value="m" control={<Radio />} label="Mètres (m)" />
              <FormControlLabel value="ft" control={<Radio />} label="Pieds (ft)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Poids
            </Typography>
            <RadioGroup 
              value={preferences.units.weight}
              onChange={(e) => updateUnitPreferences('weight', e.target.value)}
            >
              <FormControlLabel value="kg" control={<Radio />} label="Kilogrammes (kg)" />
              <FormControlLabel value="lb" control={<Radio />} label="Livres (lb)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Température
            </Typography>
            <RadioGroup 
              value={preferences.units.temperature}
              onChange={(e) => updateUnitPreferences('temperature', e.target.value)}
            >
              <FormControlLabel value="c" control={<Radio />} label="Celsius (°C)" />
              <FormControlLabel value="f" control={<Radio />} label="Fahrenheit (°F)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="date-format-label">Format de date</InputLabel>
            <Select
              labelId="date-format-label"
              value={preferences.units.dateFormat}
              label="Format de date"
              onChange={(e) => updateUnitPreferences('dateFormat', e.target.value)}
            >
              <MenuItem value="dd/mm/yyyy">JJ/MM/AAAA (31/12/2024)</MenuItem>
              <MenuItem value="mm/dd/yyyy">MM/JJ/AAAA (12/31/2024)</MenuItem>
              <MenuItem value="yyyy-mm-dd">AAAA-MM-JJ (2024-12-31)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="time-format-label">Format d'heure</InputLabel>
            <Select
              labelId="time-format-label"
              value={preferences.units.timeFormat}
              label="Format d'heure"
              onChange={(e) => updateUnitPreferences('timeFormat', e.target.value)}
            >
              <MenuItem value="24h">Format 24h (14:30)</MenuItem>
              <MenuItem value="12h">Format 12h (2:30 PM)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );

  // Rendu des préférences de langue
  const renderLanguagePreferences = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Langue et région
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="language-label">Langue préférée</InputLabel>
            <Select
              labelId="language-label"
              value={preferences.language.preferred}
              label="Langue préférée"
              onChange={(e) => {
                const newLang = e.target.value as string;
                updateLanguagePreferences('preferred', newLang);
                
                // Si la région actuelle n'est pas compatible avec la nouvelle langue, proposer la première région compatible
                const langOption = languageOptions.find(l => l.code === newLang);
                if (langOption && !langOption.regions.includes(preferences.language.region)) {
                  updateLanguagePreferences('region', langOption.regions[0]);
                }
              }}
            >
              {languageOptions.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="region-label">Région</InputLabel>
            <Select
              labelId="region-label"
              value={preferences.language.region}
              label="Région"
              onChange={(e) => updateLanguagePreferences('region', e.target.value)}
            >
              {languageOptions
                .find(l => l.code === preferences.language.preferred)
                ?.regions.map((region) => (
                  <MenuItem key={region} value={region}>
                    {region}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Ces paramètres affectent le format des dates, les unités par défaut et les traductions spécifiques à votre région.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  // Rendu des préférences de confidentialité
  const renderPrivacyPreferences = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confidentialité et visibilité
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Visibilité du profil
            </Typography>
            <RadioGroup 
              value={preferences.privacy.profileVisibility}
              onChange={(e) => updatePrivacyPreferences('profileVisibility', e.target.value)}
            >
              <FormControlLabel value="public" control={<Radio />} label="Public (visible par tous)" />
              <FormControlLabel value="friends" control={<Radio />} label="Amis seulement" />
              <FormControlLabel value="private" control={<Radio />} label="Privé (visible uniquement par vous)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              Visibilité des activités
            </Typography>
            <RadioGroup 
              value={preferences.privacy.activityVisibility}
              onChange={(e) => updatePrivacyPreferences('activityVisibility', e.target.value)}
            >
              <FormControlLabel value="public" control={<Radio />} label="Public (visible par tous)" />
              <FormControlLabel value="friends" control={<Radio />} label="Amis seulement" />
              <FormControlLabel value="private" control={<Radio />} label="Privé (visible uniquement par vous)" />
            </RadioGroup>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Options de confidentialité supplémentaires
          </Typography>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.privacy.showRealName} 
                  onChange={(e) => updatePrivacyPreferences('showRealName', e.target.checked)} 
                />
              }
              label="Afficher mon nom réel (sinon, seul le pseudonyme sera affiché)"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.privacy.showLocation} 
                  onChange={(e) => updatePrivacyPreferences('showLocation', e.target.checked)} 
                />
              }
              label="Afficher ma localisation approximative"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.privacy.allowDataAnalytics} 
                  onChange={(e) => updatePrivacyPreferences('allowDataAnalytics', e.target.checked)} 
                />
              }
              label="Permettre l'analyse anonymisée des données pour améliorer l'expérience"
            />
          </FormGroup>
        </Grid>
      </Grid>
    </Box>
  );

  // Rendu des préférences de performance
  const renderPerformancePreferences = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Performance et optimisations
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.performance.loadHighResImages} 
                  onChange={(e) => updatePerformancePreferences('loadHighResImages', e.target.checked)} 
                />
              }
              label="Charger les images en haute résolution"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.performance.enableAnimations} 
                  onChange={(e) => updatePerformancePreferences('enableAnimations', e.target.checked)} 
                />
              }
              label="Activer les transitions et animations (peut affecter les performances)"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.performance.enable3dEffects} 
                  onChange={(e) => updatePerformancePreferences('enable3dEffects', e.target.checked)} 
                />
              }
              label="Activer les effets 3D avancés (peut affecter les performances)"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.performance.preloadData} 
                  onChange={(e) => updatePerformancePreferences('preloadData', e.target.checked)} 
                />
              }
              label="Précharger les données pour une navigation plus rapide"
            />
            <FormControlLabel
              control={
                <Switch 
                  checked={preferences.performance.enableOfflineMode} 
                  onChange={(e) => updatePerformancePreferences('enableOfflineMode', e.target.checked)} 
                />
              }
              label="Activer le mode hors-ligne (stockage local des données)"
            />
          </FormGroup>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Réduire ces paramètres peut améliorer la performance sur les appareils moins puissants ou avec une connexion limitée.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Préférences utilisateur
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : undefined}
        >
          <Tab icon={<ThemeIcon />} label="Affichage" />
          <Tab icon={<SpeedIcon />} label="Unités" />
          <Tab icon={<LanguageIcon />} label="Langue" />
          <Tab icon={<VisibilityIcon />} label="Confidentialité" />
          <Tab icon={<SettingsIcon />} label="Performance" />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {renderTabContent()}
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="outlined"
          color={resetConfirm ? "error" : "primary"}
          startIcon={<ResetIcon />}
          onClick={resetPreferences}
        >
          {resetConfirm ? "Confirmer réinitialisation" : "Réinitialiser aux valeurs par défaut"}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={savePreferences}
          disabled={!hasChanges}
        >
          Enregistrer les préférences
        </Button>
      </Box>
      
      {/* Notifications de succès/erreur */}
      <Snackbar 
        open={saveSuccess} 
        autoHideDuration={6000} 
        onClose={() => setSaveSuccess(false)}
      >
        <Alert onClose={() => setSaveSuccess(false)} severity="success">
          Préférences enregistrées avec succès
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={saveError} 
        autoHideDuration={6000} 
        onClose={() => setSaveError(false)}
      >
        <Alert onClose={() => setSaveError(false)} severity="error">
          Erreur lors de l'enregistrement des préférences
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PreferencesManager;
