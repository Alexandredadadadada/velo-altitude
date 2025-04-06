import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Grid, 
  Checkbox, 
  FormControlLabel, 
  FormGroup,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';
import SecurityIcon from '@mui/icons-material/Security';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArticleIcon from '@mui/icons-material/Article';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';

// Format d'exportation disponible
interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// Catégorie de données à exporter
interface DataCategory {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

// Historique d'export
interface ExportHistory {
  id: string;
  date: string;
  format: string;
  status: 'completed' | 'failed' | 'processing';
  downloadUrl?: string;
  size?: string;
  categories: string[];
}

const apiOrchestrator = new APIOrchestrator();

interface DataExportManagerProps {
  userId: string;
}

const DataExportManager: React.FC<DataExportManagerProps> = ({ userId }) => {
  const theme = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<string>('json');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [selectedDataCategories, setSelectedDataCategories] = useState<DataCategory[]>([
    { id: 'profile', name: 'Profil', description: 'Informations personnelles, préférences et paramètres', selected: true },
    { id: 'activities', name: 'Activités', description: 'Historique des sorties, parcours et performances', selected: true },
    { id: 'challenges', name: 'Défis', description: 'Défis réalisés et badges obtenus', selected: true },
    { id: 'nutrition', name: 'Nutrition', description: 'Plans nutritionnels et journal alimentaire', selected: true },
    { id: 'training', name: 'Entraînement', description: 'Plans d\'entraînement et sessions', selected: true },
    { id: 'social', name: 'Social', description: 'Amis, commentaires et interactions', selected: false },
  ]);

  // Formats d'exportation disponibles
  const exportFormats: ExportFormat[] = [
    { 
      id: 'json', 
      name: 'JSON', 
      description: 'Format structuré idéal pour l\'importation dans d\'autres applications', 
      icon: <ArticleIcon sx={{ color: theme.palette.primary.main }} /> 
    },
    { 
      id: 'csv', 
      name: 'CSV', 
      description: 'Format tabulaire facile à ouvrir dans Excel ou Google Sheets', 
      icon: <ArticleIcon sx={{ color: theme.palette.success.main }} /> 
    },
    { 
      id: 'gpx', 
      name: 'GPX', 
      description: 'Format de données GPS spécifique pour les activités (uniquement pour les données d\'activité)', 
      icon: <ArticleIcon sx={{ color: theme.palette.warning.main }} /> 
    },
  ];

  React.useEffect(() => {
    // Charger l'historique des exports
    const fetchExportHistory = async () => {
      try {
        const history = await apiOrchestrator.getUserDataExportHistory(userId);
        setExportHistory(history);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des exports', error);
      }
    };

    fetchExportHistory();
  }, [userId]);

  // Mettre à jour la sélection des catégories de données
  const handleCategoryChange = (categoryId: string) => {
    setSelectedDataCategories(
      selectedDataCategories.map(category => 
        category.id === categoryId 
          ? { ...category, selected: !category.selected } 
          : category
      )
    );
  };

  // Sélectionner toutes les catégories
  const handleSelectAll = () => {
    setSelectedDataCategories(
      selectedDataCategories.map(category => ({ ...category, selected: true }))
    );
  };

  // Désélectionner toutes les catégories
  const handleDeselectAll = () => {
    setSelectedDataCategories(
      selectedDataCategories.map(category => ({ ...category, selected: false }))
    );
  };

  // Lancer l'exportation des données
  const handleExportData = async () => {
    // Vérifier qu'au moins une catégorie est sélectionnée
    const hasSelectedCategories = selectedDataCategories.some(category => category.selected);
    if (!hasSelectedCategories) {
      setError('Veuillez sélectionner au moins une catégorie de données à exporter.');
      return;
    }

    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      // Préparer les données pour l'exportation
      const selectedCategories = selectedDataCategories
        .filter(category => category.selected)
        .map(category => category.id);

      // Appel à l'API pour l'exportation des données
      const exportResult = await apiOrchestrator.exportUserData(userId, {
        format: selectedFormat,
        categories: selectedCategories,
        includeMetadata: true
      });

      // Mettre à jour l'historique des exports
      setExportHistory([exportResult, ...exportHistory]);
      
      setSuccess('Vos données ont été préparées avec succès. Vous pouvez maintenant les télécharger.');
      
      // Si l'export est immédiatement disponible, déclencher le téléchargement
      if (exportResult.downloadUrl) {
        // Créer un lien invisible et cliquer dessus pour télécharger
        const downloadLink = document.createElement('a');
        downloadLink.href = exportResult.downloadUrl;
        downloadLink.download = `${userId}_data_export_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données', error);
      setError('Une erreur est survenue lors de l\'exportation de vos données. Veuillez réessayer plus tard.');
    } finally {
      setIsExporting(false);
      setConfirmDialogOpen(false);
    }
  };

  // Télécharger un export précédent
  const handleDownloadExport = (exportUrl: string) => {
    // Créer un lien invisible et cliquer dessus pour télécharger
    const downloadLink = document.createElement('a');
    downloadLink.href = exportUrl;
    downloadLink.download = `data_export.${selectedFormat}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Exportation de données
      </Typography>
      
      <Typography variant="body1" paragraph>
        Exportez vos données personnelles pour les sauvegarder ou les transférer vers un autre service. 
        Toutes les données sont exportées dans un format structuré et lisible par machine.
      </Typography>

      {/* Alertes et messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Section de sélection des données */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <SecurityIcon sx={{ mr: 1 }} />
              Sélection des données à exporter
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleSelectAll} 
                sx={{ mr: 1 }}
              >
                Tout sélectionner
              </Button>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleDeselectAll}
              >
                Tout désélectionner
              </Button>
            </Box>
            
            <FormGroup>
              {selectedDataCategories.map((category) => (
                <Paper 
                  key={category.id} 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    border: 1, 
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: category.selected ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={category.selected} 
                        onChange={() => handleCategoryChange(category.id)} 
                        name={category.id} 
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1">{category.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ width: '100%' }}
                  />
                </Paper>
              ))}
            </FormGroup>
          </Paper>
        </Grid>

        {/* Section de configuration de l'export */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <ArticleIcon sx={{ mr: 1 }} />
              Format d'export
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {exportFormats.map((format) => (
                <Grid item xs={12} sm={6} md={12} lg={6} key={format.id}>
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      cursor: 'pointer',
                      height: '100%',
                      bgcolor: selectedFormat === format.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                      borderColor: selectedFormat === format.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        borderColor: 'primary.main',
                      }
                    }}
                    onClick={() => setSelectedFormat(format.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {format.icon}
                        <Typography variant="h6" sx={{ ml: 1 }}>
                          {format.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {format.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<DownloadIcon />}
                disabled={isExporting}
                onClick={() => setConfirmDialogOpen(true)}
                fullWidth
              >
                {isExporting ? 'Exportation en cours...' : 'Exporter mes données'}
              </Button>
              
              {isExporting && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Box>
          </Paper>

          {/* Section d'historique des exports */}
          <Paper sx={{ p: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon sx={{ mr: 1 }} />
                Historique des exports
              </Typography>
              <Button 
                size="small" 
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Réduire' : 'Afficher'}
              </Button>
            </Box>
            
            {showHistory && (
              <Box>
                {exportHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Aucun historique d'export disponible
                  </Typography>
                ) : (
                  exportHistory.map((exportItem) => (
                    <Paper 
                      key={exportItem.id} 
                      variant="outlined" 
                      sx={{ p: 2, mb: 2 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">
                          Export {exportItem.format.toUpperCase()}
                        </Typography>
                        <Chip 
                          size="small" 
                          label={
                            exportItem.status === 'completed' ? 'Terminé' : 
                            exportItem.status === 'processing' ? 'En cours' : 'Échec'
                          }
                          color={
                            exportItem.status === 'completed' ? 'success' : 
                            exportItem.status === 'processing' ? 'info' : 'error'
                          }
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(exportItem.date).toLocaleString()}
                        </Typography>
                      </Box>
                      
                      {exportItem.categories.length > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Catégories: {exportItem.categories.join(', ')}
                          </Typography>
                        </Box>
                      )}
                      
                      {exportItem.size && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Taille: {exportItem.size}
                        </Typography>
                      )}
                      
                      {exportItem.status === 'completed' && exportItem.downloadUrl && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadExport(exportItem.downloadUrl!)}
                          sx={{ mt: 1 }}
                          fullWidth
                        >
                          Télécharger
                        </Button>
                      )}
                    </Paper>
                  ))
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Dialogue de confirmation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirmer l'exportation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vous êtes sur le point d'exporter vos données personnelles au format 
            <strong> {selectedFormat.toUpperCase()}</strong>. 
            Cette opération peut prendre quelques instants selon la quantité de données.
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>
            Catégories sélectionnées:
            <ul>
              {selectedDataCategories
                .filter(category => category.selected)
                .map(category => (
                  <li key={category.id}>{category.name}</li>
                ))
              }
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Annuler</Button>
          <Button 
            onClick={handleExportData} 
            variant="contained" 
            disabled={isExporting}
          >
            {isExporting ? 'Exportation...' : 'Confirmer l\'export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DataExportManager;
