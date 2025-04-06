import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  Grid,
  CircularProgress,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  IconButton,
} from '@mui/material';
import { Challenge, Col, Certification } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import TerrainIcon from '@mui/icons-material/Terrain';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useRouter } from 'next/router';
import CertificationShare from './CertificationShare';

const apiOrchestrator = new APIOrchestrator();

interface ChallengeCertificationProps {
  challengeId: string;
}

const ChallengeCertification: React.FC<ChallengeCertificationProps> = ({ challengeId }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [cols, setCols] = useState<Col[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingCertification, setExistingCertification] = useState<Certification | null>(null);
  const [openShareDialog, setOpenShareDialog] = useState(false);
  
  // Référence pour l'input de fichier caché
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État du formulaire
  const [formData, setFormData] = useState({
    completionDate: new Date().toISOString().split('T')[0],
    stravaActivityId: '',
    description: '',
    gpxFile: null as File | null,
    photoUrls: [] as string[],
    photoFiles: [] as File[]
  });
  
  // États des messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallengeData = async () => {
      if (!challengeId || !user?.id) return;
      
      setLoading(true);
      try {
        // Récupération du défi
        const challengeData = await apiOrchestrator.getChallengeById(challengeId);
        setChallenge(challengeData);
        
        // Récupération des cols
        const colsData = await Promise.all(
          challengeData.cols.map((colId: string) => apiOrchestrator.getColById(colId))
        );
        setCols(colsData);
        
        // Vérifier si l'utilisateur a déjà une certification pour ce défi
        try {
          const userCertifications = await apiOrchestrator.getUserCertifications(user.id);
          const existingCert = userCertifications.find(cert => 
            cert.challengeId === challengeId
          );
          
          if (existingCert) {
            setExistingCertification(existingCert);
            // Si la certification est déjà validée, aller directement à l'étape de succès
            if (existingCert.status === 'verified') {
              setActiveStep(3); // Étape de succès
            }
          }
        } catch (error) {
          console.error('Erreur lors de la vérification des certifications existantes:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données du défi:', error);
        setError('Impossible de charger les données du défi');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChallengeData();
  }, [challengeId, user]);

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handlePrevStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleGpxFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, gpxFile: file }));
    }
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newPhotoFiles = [...formData.photoFiles, ...files];
      
      // Créer des URL temporaires pour l'aperçu
      const newPhotoUrls = files.map(file => URL.createObjectURL(file));
      
      setFormData(prev => ({
        ...prev,
        photoFiles: newPhotoFiles,
        photoUrls: [...prev.photoUrls, ...newPhotoUrls]
      }));
    }
  };
  
  const handleRemovePhoto = (index: number) => {
    const newPhotoUrls = [...formData.photoUrls];
    const newPhotoFiles = [...formData.photoFiles];
    
    // Libérer l'URL de l'objet pour éviter les fuites de mémoire
    URL.revokeObjectURL(newPhotoUrls[index]);
    
    newPhotoUrls.splice(index, 1);
    newPhotoFiles.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      photoUrls: newPhotoUrls,
      photoFiles: newPhotoFiles
    }));
  };
  
  const handleSubmitCertification = async () => {
    if (!user?.id || !challengeId) return;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Préparer les données pour la soumission
      const certificationData = {
        stravaActivityId: formData.stravaActivityId || undefined,
        gpxFile: formData.gpxFile || undefined,
        photoUrls: formData.photoUrls,
        completionDate: formData.completionDate,
        description: formData.description || undefined
      };
      
      // Soumettre la certification
      const certification = await apiOrchestrator.submitChallengeCertification(
        challengeId,
        user.id,
        certificationData
      );
      
      setExistingCertification(certification);
      setSuccess('Votre certification a été soumise avec succès!');
      handleNextStep();
    } catch (error) {
      console.error('Erreur lors de la soumission de la certification:', error);
      setError('Erreur lors de la soumission de la certification. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const triggerPhotoInput = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handlePhotoUpload(e as any);
    input.click();
  };
  
  const handleShareCertification = () => {
    if (existingCertification) {
      setOpenShareDialog(true);
    }
  };
  
  const handleCloseShareDialog = () => {
    setOpenShareDialog(false);
  };
  
  // Conversion de la date dans un format lisible
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!challenge) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">
          Défi introuvable. Veuillez vérifier l'identifiant du défi.
        </Alert>
      </Box>
    );
  }
  
  // Étapes du processus de certification
  const steps = [
    'Détails du défi',
    'Ajouter des preuves',
    'Révision',
    'Certification'
  ];
  
  return (
    <Box sx={{ py: 4, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Certification du défi
      </Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {/* Contenu de l'étape en cours */}
      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Étape 1: Détails du défi */}
        {activeStep === 0 && (
          <>
            <Typography variant="h5" gutterBottom>{challenge.name}</Typography>
            <Typography variant="body1" paragraph>{challenge.description}</Typography>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TerrainIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>
                    {challenge.totalElevation.toFixed(0)} m de dénivelé
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DirectionsRunIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>
                    {challenge.totalDistance.toFixed(1)} km de distance
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HourglassEmptyIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography>
                    Difficulté: {challenge.difficulty.toFixed(1)}/10
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            
            <Typography variant="h6" gutterBottom>Cols à gravir</Typography>
            <List>
              {cols.map((col) => (
                <ListItem key={col.id}>
                  <ListItemIcon>
                    <TerrainIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={col.name} 
                    secondary={`${col.length.toFixed(1)} km • ${col.elevation.toFixed(0)} m • ${col.avgGradient.toFixed(1)}%`} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 3 }} />
            
            {existingCertification && (
              <Alert 
                severity={existingCertification.status === 'verified' ? 'success' : 'info'}
                sx={{ mb: 3 }}
              >
                {existingCertification.status === 'verified' 
                  ? 'Vous avez déjà complété ce défi! Votre certification a été vérifiée.' 
                  : 'Vous avez déjà soumis une certification pour ce défi. Elle est en cours de vérification.'}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleNextStep}
                disabled={existingCertification?.status === 'verified'}
              >
                {existingCertification 
                  ? 'Voir ma certification' 
                  : 'Démarrer la certification'}
              </Button>
            </Box>
          </>
        )}
        
        {/* Étape 2: Ajouter des preuves */}
        {activeStep === 1 && (
          <>
            <Typography variant="h5" gutterBottom>Ajouter des preuves</Typography>
            <Typography variant="body1" paragraph>
              Pour certifier votre accomplissement, veuillez fournir au moins une des preuves suivantes:
              une activité Strava, un fichier GPX ou des photos du parcours.
            </Typography>
            
            <Grid container spacing={3}>
              {/* Date de complétion */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Date de complétion"
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleTextChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              {/* ID d'activité Strava */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="ID d'activité Strava (optionnel)"
                  type="text"
                  name="stravaActivityId"
                  value={formData.stravaActivityId}
                  onChange={handleTextChange}
                  helperText="Entrez l'ID numérique de votre activité Strava (ex: 1234567890)"
                />
              </Grid>
              
              {/* Upload GPX */}
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    border: '1px dashed #ccc', 
                    borderRadius: 1, 
                    p: 3, 
                    textAlign: 'center',
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    accept=".gpx"
                    style={{ display: 'none' }}
                    ref={fileInputRef}
                    onChange={handleGpxFileUpload}
                  />
                  <UploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1" gutterBottom>
                    {formData.gpxFile 
                      ? `Fichier sélectionné: ${formData.gpxFile.name}` 
                      : 'Cliquez pour ajouter un fichier GPX (optionnel)'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formats acceptés: .gpx
                  </Typography>
                </Box>
              </Grid>
              
              {/* Upload photos */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Photos (optionnel)
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px dashed #ccc', 
                    borderRadius: 1, 
                    p: 3, 
                    textAlign: 'center',
                    mb: 2,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                  }}
                  onClick={triggerPhotoInput}
                >
                  <AddPhotoAlternateIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="body1">
                    Cliquez pour ajouter des photos de votre parcours
                  </Typography>
                </Box>
                
                {/* Aperçu des photos */}
                {formData.photoUrls.length > 0 && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    {formData.photoUrls.map((url, index) => (
                      <Grid item xs={6} sm={4} md={3} key={index}>
                        <Box sx={{ position: 'relative' }}>
                          <img 
                            src={url} 
                            alt={`Photo ${index + 1}`} 
                            style={{ 
                              width: '100%', 
                              height: 120, 
                              objectFit: 'cover',
                              borderRadius: 4
                            }} 
                          />
                          <IconButton
                            size="small"
                            sx={{ 
                              position: 'absolute', 
                              top: 5, 
                              right: 5,
                              bgcolor: 'rgba(0,0,0,0.5)',
                              color: 'white',
                              '&:hover': {
                                bgcolor: 'rgba(0,0,0,0.7)',
                              }
                            }}
                            onClick={() => handleRemovePhoto(index)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Grid>
              
              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description de votre expérience (optionnel)"
                  name="description"
                  value={formData.description}
                  onChange={handleTextChange}
                  helperText="Racontez votre expérience, les difficultés rencontrées, etc."
                />
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handlePrevStep}>Retour</Button>
              <Button 
                variant="contained" 
                onClick={handleNextStep}
                disabled={!formData.completionDate}
              >
                Continuer
              </Button>
            </Box>
          </>
        )}
        
        {/* Étape 3: Révision */}
        {activeStep === 2 && (
          <>
            <Typography variant="h5" gutterBottom>Vérifier vos informations</Typography>
            <Typography variant="body1" paragraph>
              Veuillez vérifier les informations ci-dessous avant de soumettre votre certification.
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Défi</Typography>
                <Typography variant="body1" paragraph>{challenge.name}</Typography>
                
                <List dense>
                  <ListItem>
                    <ListItemIcon><CalendarTodayIcon /></ListItemIcon>
                    <ListItemText 
                      primary="Date de complétion"
                      secondary={formatDate(formData.completionDate)}
                    />
                  </ListItem>
                  
                  {formData.stravaActivityId && (
                    <ListItem>
                      <ListItemIcon><DirectionsRunIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Activité Strava"
                        secondary={`ID: ${formData.stravaActivityId}`}
                      />
                    </ListItem>
                  )}
                  
                  {formData.gpxFile && (
                    <ListItem>
                      <ListItemIcon><DescriptionIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Fichier GPX"
                        secondary={formData.gpxFile.name}
                      />
                    </ListItem>
                  )}
                  
                  {formData.photoUrls.length > 0 && (
                    <ListItem>
                      <ListItemIcon><ImageIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Photos"
                        secondary={`${formData.photoUrls.length} photo(s) ajoutée(s)`}
                      />
                    </ListItem>
                  )}
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Votre description</Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="body1">
                    {formData.description || "Aucune description fournie."}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
            
            {error && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button onClick={handlePrevStep}>Retour</Button>
              <Button 
                variant="contained" 
                onClick={handleSubmitCertification}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Soumettre la certification'}
              </Button>
            </Box>
          </>
        )}
        
        {/* Étape 4: Certification réussie */}
        {activeStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon 
              sx={{ fontSize: 64, color: 'success.main', mb: 2 }} 
            />
            
            <Typography variant="h5" gutterBottom>
              {existingCertification?.status === 'verified' 
                ? 'Félicitations! Défi complété!' 
                : 'Demande de certification soumise!'}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {existingCertification?.status === 'verified' 
                ? 'Votre certification a été vérifiée. Vous pouvez maintenant partager votre réussite avec la communauté!' 
                : 'Votre demande de certification a été enregistrée. Notre équipe la vérifiera dans les plus brefs délais.'}
            </Typography>
            
            {existingCertification?.status === 'verified' && (
              <Box sx={{ mt: 3, mb: 4 }}>
                <Chip 
                  icon={<CheckCircleIcon />}
                  label={`Certifié le ${formatDate(existingCertification.verifiedAt || '')}`}
                  color="success"
                  variant="outlined"
                  sx={{ px: 2, py: 1, fontSize: '1rem' }}
                />
              </Box>
            )}
            
            {existingCertification?.status === 'pending' && (
              <Box sx={{ mt: 3, mb: 4 }}>
                <Chip 
                  icon={<HourglassEmptyIcon />}
                  label="En attente de vérification"
                  color="info"
                  variant="outlined"
                  sx={{ px: 2, py: 1, fontSize: '1rem' }}
                />
              </Box>
            )}
            
            <Box sx={{ mt: 3 }}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item>
                  <Button 
                    variant="outlined" 
                    onClick={() => router.push('/seven-majors')}
                  >
                    Retour aux défis
                  </Button>
                </Grid>
                
                {existingCertification?.status === 'verified' && (
                  <Grid item>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleShareCertification}
                    >
                      Partager ma réussite
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Dialogue de partage */}
      {existingCertification && (
        <CertificationShare 
          certificationId={existingCertification.id}
          open={openShareDialog}
          onClose={handleCloseShareDialog}
        />
      )}
    </Box>
  );
};

export default ChallengeCertification;
