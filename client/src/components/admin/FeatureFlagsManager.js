import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  TextField,
  Button,
  Divider,
  Chip,
  Alert,
  Paper,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useFeatureFlags } from '../../services/featureFlags';

// Catégories de feature flags
const FLAG_CATEGORIES = {
  'ui': 'Interface utilisateur',
  'challenge': 'Défis',
  'api': 'API et performance',
  'experimental': 'Fonctionnalités expérimentales',
  'admin': 'Administration'
};

// Mapping des flags avec leurs catégories et descriptions
const FLAG_METADATA = {
  // UI flags
  enableDarkMode: {
    category: 'ui',
    description: 'Active le mode sombre dans toute l\'application',
    impact: 'low'
  },
  showBetaFeatures: {
    category: 'ui',
    description: 'Affiche les fonctionnalités en bêta aux utilisateurs',
    impact: 'medium'
  },
  useNewNavigation: {
    category: 'ui',
    description: 'Utilise le nouveau design de navigation expérimental',
    impact: 'high'
  },
  
  // Challenge flags
  enableSevenMajorsChallenge: {
    category: 'challenge',
    description: 'Active le défi des 7 cols majeurs',
    impact: 'medium'
  },
  enableMonthlyChallenge: {
    category: 'challenge',
    description: 'Active les défis mensuels',
    impact: 'medium'
  },
  enableSocialSharing: {
    category: 'challenge',
    description: 'Permet le partage des défis sur les réseaux sociaux',
    impact: 'low'
  },
  
  // API flags
  enableApiCaching: {
    category: 'api',
    description: 'Active la mise en cache des réponses API',
    impact: 'medium'
  },
  enablePerformanceMonitoring: {
    category: 'api',
    description: 'Active la surveillance des performances des API',
    impact: 'low'
  },
  
  // Experimental flags
  enable3DColVisualization: {
    category: 'experimental',
    description: 'Active la visualisation 3D des cols',
    impact: 'high'
  },
  enableAIRecommendations: {
    category: 'experimental',
    description: 'Active les recommandations basées sur l\'IA',
    impact: 'medium'
  },
  enableRealTimeWeather: {
    category: 'experimental',
    description: 'Active les informations météo en temps réel',
    impact: 'medium'
  },
  
  // Admin flags
  enableAdvancedMetrics: {
    category: 'admin',
    description: 'Active les métriques avancées dans le tableau de bord',
    impact: 'low'
  },
  enableBulkOperations: {
    category: 'admin',
    description: 'Permet les opérations en masse sur les données',
    impact: 'high'
  }
};

/**
 * Composant de gestion des feature flags
 * Permet aux administrateurs de voir et modifier les drapeaux de fonctionnalités
 */
const FeatureFlagsManager = () => {
  const { flags, isLoading, error, updateFlag, refreshFlags } = useFeatureFlags();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openNewFlagDialog, setOpenNewFlagDialog] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: '', description: '', category: 'ui', value: false, impact: 'medium' });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [flagHistory, setFlagHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Réinitialiser l'historique quand on ouvre le dialogue
  useEffect(() => {
    if (historyDialogOpen) {
      // Ceci est une simulation, dans une implémentation réelle on récupérerait
      // l'historique depuis une API
      setFlagHistory([
        { flag: 'enableDarkMode', value: true, user: 'admin@example.com', timestamp: new Date().toISOString() },
        { flag: 'enableApiCaching', value: false, user: 'admin@example.com', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { flag: 'showBetaFeatures', value: true, user: 'admin@example.com', timestamp: new Date(Date.now() - 172800000).toISOString() },
      ]);
    }
  }, [historyDialogOpen]);

  // Filtre les flags en fonction de la recherche et de la catégorie
  const filteredFlags = Object.entries(flags).filter(([key, value]) => {
    const matchesSearch = key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      (FLAG_METADATA[key] && FLAG_METADATA[key].category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  // Groupe les flags par catégorie
  const groupedFlags = filteredFlags.reduce((acc, [key, value]) => {
    const category = FLAG_METADATA[key]?.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key, value });
    return acc;
  }, {});

  // Gère le changement d'un flag
  const handleFlagChange = async (flagName, checked) => {
    await updateFlag(flagName, checked);
  };

  // Rafraîchit tous les flags
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFlags();
    setRefreshing(false);
  };

  // Gère l'ajout d'un nouveau flag
  const handleAddNewFlag = async () => {
    if (newFlag.name) {
      await updateFlag(newFlag.name, newFlag.value);
      setOpenNewFlagDialog(false);
      setNewFlag({ name: '', description: '', category: 'ui', value: false, impact: 'medium' });
    }
  };

  // Rendu de l'indicateur d'impact
  const renderImpactChip = (impact) => {
    const colors = {
      low: 'success',
      medium: 'warning',
      high: 'error'
    };
    
    return (
      <Chip 
        size="small" 
        color={colors[impact] || 'default'} 
        label={impact === 'low' ? 'Faible impact' : impact === 'medium' ? 'Impact moyen' : 'Impact élevé'} 
        variant="outlined" 
      />
    );
  };

  return (
    <Box>
      {/* En-tête avec titre et actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Gestion des Feature Flags
        </Typography>
        <Box>
          <Tooltip title="Voir l'historique des modifications">
            <IconButton onClick={() => setHistoryDialogOpen(true)} sx={{ mr: 1 }}>
              <HistoryIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rafraîchir les flags">
            <IconButton onClick={handleRefresh} disabled={isLoading || refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Message d'erreur si nécessaire */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filtres et recherche */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rechercher un flag"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Catégorie"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            SelectProps={{
              native: true,
            }}
          >
            <option value="all">Toutes les catégories</option>
            {Object.entries(FLAG_CATEGORIES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenNewFlagDialog(true)}
            sx={{ height: '100%' }}
          >
            Ajouter
          </Button>
        </Grid>
      </Grid>

      {/* Affichage des flags */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        Object.entries(groupedFlags).map(([category, categoryFlags]) => (
          <Card key={category} sx={{ mb: 3 }}>
            <CardHeader
              title={FLAG_CATEGORIES[category] || 'Autres flags'}
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}
            />
            <CardContent>
              <Grid container spacing={3}>
                {categoryFlags.map(({ key, value }) => (
                  <Grid item xs={12} md={6} lg={4} key={key}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: value ? 'rgba(46, 125, 50, 0.04)' : 'transparent',
                        border: value ? '1px solid rgba(46, 125, 50, 0.2)' : '1px solid rgba(0, 0, 0, 0.12)',
                      }}
                    >
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {key}
                          </Typography>
                          {FLAG_METADATA[key]?.impact && renderImpactChip(FLAG_METADATA[key].impact)}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {FLAG_METADATA[key]?.description || 'Aucune description disponible'}
                        </Typography>
                      </Box>
                      
                      <FormControlLabel
                        control={<Switch checked={value} onChange={(e) => handleFlagChange(key, e.target.checked)} color="primary" />}
                        label={value ? "Activé" : "Désactivé"}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        ))
      )}

      {/* Si aucun flag ne correspond à la recherche */}
      {Object.keys(groupedFlags).length === 0 && !isLoading && (
        <Alert severity="info">
          Aucun feature flag ne correspond à votre recherche.
        </Alert>
      )}

      {/* Dialogue pour ajouter un nouveau flag */}
      <Dialog open={openNewFlagDialog} onClose={() => setOpenNewFlagDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter un nouveau Feature Flag</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom du flag"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  helperText="Utilisez un format camelCase, ex: enableNewFeature"
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newFlag.description}
                  onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Catégorie"
                  value={newFlag.category}
                  onChange={(e) => setNewFlag({ ...newFlag, category: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  {Object.entries(FLAG_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Impact"
                  value={newFlag.impact}
                  onChange={(e) => setNewFlag({ ...newFlag, impact: e.target.value })}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="low">Faible impact</option>
                  <option value="medium">Impact moyen</option>
                  <option value="high">Impact élevé</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={newFlag.value} onChange={(e) => setNewFlag({ ...newFlag, value: e.target.checked })} />}
                  label="État initial"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewFlagDialog(false)}>Annuler</Button>
          <Button
            onClick={handleAddNewFlag}
            variant="contained"
            disabled={!newFlag.name}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialogue d'historique des modifications */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Historique des modifications</DialogTitle>
        <DialogContent>
          <Paper variant="outlined" sx={{ my: 2 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Les 30 derniers jours
              </Typography>
              {flagHistory.length > 0 ? (
                flagHistory.map((item, index) => (
                  <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < flagHistory.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(item.timestamp).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2">
                          <strong>{item.flag}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Chip
                          size="small"
                          color={item.value ? 'success' : 'default'}
                          label={item.value ? "Activé" : "Désactivé"}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="body2">
                          {item.user}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                ))
              ) : (
                <Typography variant="body2">Aucun historique disponible</Typography>
              )}
            </Box>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeatureFlagsManager;
