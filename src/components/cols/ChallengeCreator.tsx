import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  TextField, 
  FormControlLabel, 
  Switch, 
  Paper, 
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import TerrainIcon from '@mui/icons-material/Terrain';
import RouteIcon from '@mui/icons-material/Route';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ShareIcon from '@mui/icons-material/Share';
import AddIcon from '@mui/icons-material/Add';
import { Col, Challenge } from '../../types';
import ColsGrid from './ColsGrid';
import { APIOrchestrator } from '../../api/orchestration';

interface ChallengeCreatorProps {
  userId: string;
  challenge?: Challenge; // Si on édite un défi existant
  onSave?: (challenge: Challenge) => void;
  onCancel?: () => void;
}

const ChallengeCreator: React.FC<ChallengeCreatorProps> = ({
  userId,
  challenge,
  onSave,
  onCancel
}) => {
  const apiOrchestrator = new APIOrchestrator();
  
  // États
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState(challenge?.name || '');
  const [description, setDescription] = useState(challenge?.description || '');
  const [isPublic, setIsPublic] = useState(challenge?.isPublic || false);
  const [selectedCols, setSelectedCols] = useState<Col[]>(challenge?.cols || []);
  const [allCols, setAllCols] = useState<Col[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openColsDialog, setOpenColsDialog] = useState(false);
  const [stats, setStats] = useState({
    totalElevation: challenge?.totalElevation || 0,
    totalDistance: challenge?.totalDistance || 0,
    difficulty: challenge?.difficulty || 0
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [savingChallenge, setSavingChallenge] = useState(false);
  
  // Étapes du stepper
  const steps = ['Informations de base', 'Sélection des cols', 'Aperçu et validation'];
  
  // Charger tous les cols au démarrage
  useEffect(() => {
    const fetchCols = async () => {
      setLoading(true);
      try {
        const cols = await apiOrchestrator.getAllCols();
        setAllCols(cols);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCols();
  }, []);
  
  // Recalculer les statistiques lorsque la sélection de cols change
  useEffect(() => {
    if (selectedCols.length > 0) {
      const stats = apiOrchestrator.colsService.calculateChallengeStats(selectedCols);
      setStats(stats);
    }
  }, [selectedCols]);
  
  // Gérer la recherche de cols
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setLoading(true);
    
    try {
      const cols = await apiOrchestrator.searchCols(query);
      setAllCols(cols);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  // Ajouter ou retirer un col de la sélection
  const handleSelectCol = (col: Col) => {
    if (selectedCols.some(c => c.id === col.id)) {
      // Retirer le col s'il est déjà sélectionné
      setSelectedCols(selectedCols.filter(c => c.id !== col.id));
    } else {
      // Ajouter le col s'il n'est pas déjà sélectionné
      if (selectedCols.length < 7) {
        setSelectedCols([...selectedCols, col]);
      } else {
        // Afficher un message d'erreur si l'utilisateur a déjà sélectionné 7 cols
        setSnackbar({
          open: true,
          message: 'Vous ne pouvez pas sélectionner plus de 7 cols.',
          severity: 'error'
        });
      }
    }
  };
  
  // Retirer un col de la sélection
  const handleRemoveCol = (colId: string) => {
    setSelectedCols(selectedCols.filter(col => col.id !== colId));
  };
  
  // Naviguer au step suivant
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Naviguer au step précédent
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Valider les informations du défi
  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return name.trim() !== '' && description.trim() !== '';
      case 1:
        return selectedCols.length > 0 && selectedCols.length <= 7;
      default:
        return true;
    }
  };
  
  // Créer ou mettre à jour le défi
  const handleSaveChallenge = async () => {
    setSavingChallenge(true);
    
    try {
      const colIds = selectedCols.map(col => col.id);
      
      let savedChallenge;
      if (challenge?.id) {
        // Mettre à jour un défi existant
        savedChallenge = await apiOrchestrator.colsService.updateChallenge(challenge.id, {
          name,
          description,
          isPublic,
          cols: selectedCols
        });
      } else {
        // Créer un nouveau défi
        savedChallenge = await apiOrchestrator.createChallenge(
          userId,
          name,
          description,
          colIds,
          isPublic
        );
      }
      
      setSnackbar({
        open: true,
        message: `Défi ${challenge?.id ? 'mis à jour' : 'créé'} avec succès !`,
        severity: 'success'
      });
      
      if (onSave) {
        onSave(savedChallenge);
      }
    } catch (err) {
      setError(err as Error);
      setSnackbar({
        open: true,
        message: `Erreur lors de la ${challenge?.id ? 'mise à jour' : 'création'} du défi : ${(err as Error).message}`,
        severity: 'error'
      });
    } finally {
      setSavingChallenge(false);
    }
  };
  
  // Exporter le défi au format GPX
  const handleExportGpx = async () => {
    if (!challenge?.id) {
      setSnackbar({
        open: true,
        message: 'Veuillez d\'abord enregistrer votre défi pour pouvoir l\'exporter en GPX.',
        severity: 'error'
      });
      return;
    }
    
    try {
      const gpxUrl = await apiOrchestrator.generateGpxForChallenge(challenge.id);
      
      // Créer un lien et simuler un clic pour télécharger le fichier
      const a = document.createElement('a');
      a.href = gpxUrl;
      a.download = `${challenge.name.replace(/\s+/g, '_')}.gpx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setSnackbar({
        open: true,
        message: 'Fichier GPX généré avec succès !',
        severity: 'success'
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Erreur lors de la génération du fichier GPX : ${(err as Error).message}`,
        severity: 'error'
      });
    }
  };
  
  // Formatage de la difficulté pour l'affichage
  const getDifficultyLabel = (score: number) => {
    if (score < 30) return { label: 'Facile', color: 'success' };
    if (score < 60) return { label: 'Modéré', color: 'info' };
    if (score < 90) return { label: 'Difficile', color: 'warning' };
    return { label: 'Extrême', color: 'error' };
  };
  
  // Composant pour les informations de base (step 0)
  const renderBasicInfo = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Informations de base
      </Typography>
      
      <TextField
        fullWidth
        label="Nom du défi"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={name.trim() === ''}
        helperText={name.trim() === '' ? 'Le nom du défi est requis' : ''}
        sx={{ mb: 2 }}
      />
      
      <TextField
        fullWidth
        label="Description"
        variant="outlined"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        error={description.trim() === ''}
        helperText={description.trim() === '' ? 'La description est requise' : ''}
        multiline
        rows={4}
        sx={{ mb: 3 }}
      />
      
      <FormControlLabel
        control={
          <Switch 
            checked={isPublic} 
            onChange={(e) => setIsPublic(e.target.checked)}
            color="primary"
          />
        }
        label="Rendre ce défi public"
      />
      
      <Box mt={2}>
        <Typography variant="body2" color="text.secondary">
          En rendant ce défi public, il sera visible par tous les utilisateurs de Velo-Altitude.
        </Typography>
      </Box>
    </Box>
  );
  
  // Composant pour la sélection des cols (step 1)
  const renderColSelection = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          Cols sélectionnés ({selectedCols.length}/7)
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenColsDialog(true)}
        >
          Ajouter des cols
        </Button>
      </Box>
      
      {selectedCols.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Vous n'avez pas encore sélectionné de col. Cliquez sur "Ajouter des cols" pour commencer.
        </Alert>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {selectedCols.map(col => (
            <Grid item xs={12} sm={6} md={4} key={col.id}>
              <Card>
                <CardMedia
                  component="img"
                  height="100"
                  image={col.imageUrl || '/images/default-col.jpg'}
                  alt={col.name}
                />
                <CardContent sx={{ pt: 1, pb: '8px !important' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6">{col.name}</Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleRemoveCol(col.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  <Box display="flex" gap={1} alignItems="center">
                    <TerrainIcon sx={{ fontSize: '1rem' }} />
                    <Typography variant="body2">{col.elevation}m</Typography>
                    <RouteIcon sx={{ fontSize: '1rem' }} />
                    <Typography variant="body2">{col.length}km</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Statistiques du défi */}
      {selectedCols.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Statistiques du défi
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={1}>
                <Typography variant="body2" color="text.secondary">
                  Élévation totale
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {Math.round(stats.totalElevation)} m
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={1}>
                <Typography variant="body2" color="text.secondary">
                  Distance totale
                </Typography>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {Math.round(stats.totalDistance)} km
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box textAlign="center" p={1}>
                <Typography variant="body2" color="text.secondary">
                  Difficulté
                </Typography>
                <Chip 
                  label={getDifficultyLabel(stats.difficulty).label}
                  color={getDifficultyLabel(stats.difficulty).color as any}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Dialog pour la sélection des cols */}
      <Dialog
        open={openColsDialog}
        onClose={() => setOpenColsDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Sélectionner des cols ({selectedCols.length}/7)
        </DialogTitle>
        
        <DialogContent dividers>
          <ColsGrid
            cols={allCols}
            loading={loading}
            error={error}
            onSearch={handleSearch}
            onSelectCol={handleSelectCol}
            selectedCols={selectedCols}
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setOpenColsDialog(false)}>
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
  // Composant pour l'aperçu et la validation (step 2)
  const renderPreview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Aperçu du défi
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {name}
        </Typography>
        
        <Box display="flex" mb={2}>
          {isPublic ? (
            <Chip label="Public" color="primary" size="small" />
          ) : (
            <Chip label="Privé" variant="outlined" size="small" />
          )}
          
          <Chip 
            label={getDifficultyLabel(stats.difficulty).label}
            color={getDifficultyLabel(stats.difficulty).color as any}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
        
        <Typography variant="body1" paragraph>
          {description}
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Statistiques
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Cols</Typography>
              <Typography variant="body2" fontWeight="bold">
                {selectedCols.length}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Élévation totale</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.round(stats.totalElevation)} m
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Distance totale</Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.round(stats.totalDistance)} km
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Score de difficulté</Typography>
              <Typography variant="body2" fontWeight="bold">
                {stats.difficulty.toFixed(1)}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" gutterBottom>
              Cols inclus
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {selectedCols.map(col => (
                <Box key={col.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">{col.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {col.elevation}m · {col.length}km
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Typography variant="subtitle1" gutterBottom>
        Actions disponibles après la sauvegarde:
      </Typography>
      
      <Box display="flex" gap={2} flexWrap="wrap">
        <Button 
          variant="outlined" 
          startIcon={<FileDownloadIcon />}
          onClick={handleExportGpx}
          disabled={!challenge?.id}
        >
          Exporter en GPX
        </Button>
        
        <Button 
          variant="outlined" 
          startIcon={<ShareIcon />}
          disabled={!challenge?.id || !isPublic}
        >
          Partager
        </Button>
      </Box>
    </Box>
  );
  
  // Afficher les formulaires en fonction de l'étape active
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderBasicInfo();
      case 1:
        return renderColSelection();
      case 2:
        return renderPreview();
      default:
        return 'Étape inconnue';
    }
  };
  
  return (
    <Box>
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>
      
      <Paper elevation={2} sx={{ p: 3 }}>
        {getStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={activeStep === 0 ? onCancel : handleBack}
          >
            {activeStep === 0 ? 'Annuler' : 'Précédent'}
          </Button>
          
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                startIcon={savingChallenge ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSaveChallenge}
                disabled={!isStepValid() || savingChallenge}
              >
                {challenge?.id ? 'Mettre à jour' : 'Enregistrer'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Suivant
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChallengeCreator;
