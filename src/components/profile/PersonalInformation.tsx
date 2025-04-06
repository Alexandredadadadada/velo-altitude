import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  AddAPhoto as AddAPhotoIcon
} from '@mui/icons-material';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';

const apiOrchestrator = new APIOrchestrator();

interface PersonalInformationProps {
  userId: string;
}

interface UserPersonalInfo {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  bio?: string;
  avatarUrl?: string;
  website?: string;
  cyclingExperience?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  // Statistiques cyclistes
  weight?: number;
  height?: number;
  ftp?: number; // Functional Threshold Power
  maxHr?: number; // Maximum Heart Rate
  restingHr?: number; // Resting Heart Rate
  vo2max?: number; // VO2 Max
}

// Liste des régions françaises
const frenchRegions = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur'
];

const PersonalInformation: React.FC<PersonalInformationProps> = ({ userId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [personalInfo, setPersonalInfo] = useState<UserPersonalInfo>({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [tempInfo, setTempInfo] = useState<UserPersonalInfo | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Charger les informations personnelles de l'utilisateur
  useEffect(() => {
    const loadPersonalInfo = async () => {
      try {
        setLoading(true);
        const userInfo = await apiOrchestrator.getUserPersonalInfo(userId);
        if (userInfo) {
          setPersonalInfo(userInfo);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations personnelles', error);
      } finally {
        setLoading(false);
      }
    };

    loadPersonalInfo();
  }, [userId]);

  // Activer le mode édition
  const handleEditClick = () => {
    setTempInfo({ ...personalInfo });
    setEditMode(true);
  };

  // Annuler les modifications
  const handleCancelClick = () => {
    setEditMode(false);
    setTempInfo(null);
    setAvatarFile(null);
  };

  // Mettre à jour les informations temporaires lors de l'édition
  const handleInfoChange = (field: keyof UserPersonalInfo, value: any) => {
    if (tempInfo) {
      setTempInfo({
        ...tempInfo,
        [field]: value
      });
    }
  };

  // Gérer le changement d'avatar
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        // Limite de 5MB
        alert('L\'image est trop volumineuse. Veuillez choisir une image de moins de 5MB.');
        return;
      }
      
      setAvatarFile(file);
    }
  };

  // Déclencher le sélecteur de fichier
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Supprimer l'avatar
  const handleRemoveAvatar = () => {
    if (tempInfo) {
      setTempInfo({
        ...tempInfo,
        avatarUrl: undefined
      });
      setAvatarFile(null);
    }
  };

  // Télécharger l'avatar
  const uploadAvatar = async (): Promise<string | undefined> => {
    if (!avatarFile) return personalInfo.avatarUrl;
    
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      formData.append('userId', userId);
      
      const result = await apiOrchestrator.uploadUserAvatar(formData);
      return result.avatarUrl;
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'avatar', error);
      throw error;
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Sauvegarder les modifications
  const handleSaveClick = async () => {
    if (!tempInfo) return;
    
    try {
      // Télécharger l'avatar si nécessaire
      let updatedAvatarUrl = personalInfo.avatarUrl;
      if (avatarFile) {
        updatedAvatarUrl = await uploadAvatar();
      }
      
      // Mettre à jour les informations avec le nouvel avatar
      const updatedInfo = {
        ...tempInfo,
        avatarUrl: updatedAvatarUrl
      };
      
      // Envoyer les données mises à jour au serveur
      await apiOrchestrator.updateUserPersonalInfo(userId, updatedInfo);
      
      // Mettre à jour l'état local
      setPersonalInfo(updatedInfo);
      setEditMode(false);
      setTempInfo(null);
      setAvatarFile(null);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des informations personnelles', error);
      setSaveError(true);
    }
  };

  // Afficher le loader pendant le chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h2">
          Informations personnelles
        </Typography>
        {!editMode ? (
          <Button 
            variant="outlined" 
            startIcon={<EditIcon />} 
            onClick={handleEditClick}
          >
            Modifier
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<CancelIcon />} 
              onClick={handleCancelClick}
              color="inherit"
            >
              Annuler
            </Button>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSaveClick}
              color="primary"
              disabled={uploadingAvatar}
            >
              Enregistrer
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Avatar */}
          <Grid item xs={12} sm={4} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={avatarFile ? URL.createObjectURL(avatarFile) : personalInfo.avatarUrl} 
                alt={personalInfo.username}
                sx={{ width: 150, height: 150, mb: 2 }}
              />
              {editMode && (
                <Box sx={{ position: 'absolute', bottom: 10, right: -10, display: 'flex', gap: 1 }}>
                  <Tooltip title="Changer l'avatar">
                    <IconButton 
                      color="primary" 
                      onClick={triggerFileInput}
                      sx={{ bgcolor: 'background.paper' }}
                    >
                      <AddAPhotoIcon />
                    </IconButton>
                  </Tooltip>
                  {(personalInfo.avatarUrl || avatarFile) && (
                    <Tooltip title="Supprimer l'avatar">
                      <IconButton 
                        color="error" 
                        onClick={handleRemoveAvatar}
                        sx={{ bgcolor: 'background.paper' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleAvatarChange}
            />
            <Typography variant="h6" align="center">
              {personalInfo.username}
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              {personalInfo.cyclingExperience === 'beginner' && 'Cycliste débutant'}
              {personalInfo.cyclingExperience === 'intermediate' && 'Cycliste intermédiaire'}
              {personalInfo.cyclingExperience === 'advanced' && 'Cycliste avancé'}
              {personalInfo.cyclingExperience === 'professional' && 'Cycliste professionnel'}
            </Typography>
          </Grid>

          {/* Informations de base */}
          <Grid item xs={12} sm={8} md={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom d'utilisateur"
                  value={editMode ? tempInfo?.username : personalInfo.username}
                  onChange={(e) => handleInfoChange('username', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editMode ? tempInfo?.email : personalInfo.email}
                  onChange={(e) => handleInfoChange('email', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prénom"
                  value={editMode ? tempInfo?.firstName : personalInfo.firstName}
                  onChange={(e) => handleInfoChange('firstName', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom"
                  value={editMode ? tempInfo?.lastName : personalInfo.lastName}
                  onChange={(e) => handleInfoChange('lastName', e.target.value)}
                  disabled={!editMode}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Téléphone"
                  value={editMode ? tempInfo?.phone || '' : personalInfo.phone || ''}
                  onChange={(e) => handleInfoChange('phone', e.target.value)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date de naissance"
                  type="date"
                  value={editMode ? tempInfo?.birthdate || '' : personalInfo.birthdate || ''}
                  onChange={(e) => handleInfoChange('birthdate', e.target.value)}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel id="gender-label">Genre</InputLabel>
                  <Select
                    labelId="gender-label"
                    value={editMode ? tempInfo?.gender || '' : personalInfo.gender || ''}
                    label="Genre"
                    onChange={(e) => handleInfoChange('gender', e.target.value)}
                  >
                    <MenuItem value="male">Homme</MenuItem>
                    <MenuItem value="female">Femme</MenuItem>
                    <MenuItem value="other">Autre</MenuItem>
                    <MenuItem value="prefer_not_to_say">Je préfère ne pas préciser</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel id="region-label">Région</InputLabel>
                  <Select
                    labelId="region-label"
                    value={editMode ? tempInfo?.location || '' : personalInfo.location || ''}
                    label="Région"
                    onChange={(e) => handleInfoChange('location', e.target.value)}
                  >
                    {frenchRegions.map((region) => (
                      <MenuItem key={region} value={region}>
                        {region}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Site web"
                  value={editMode ? tempInfo?.website || '' : personalInfo.website || ''}
                  onChange={(e) => handleInfoChange('website', e.target.value)}
                  disabled={!editMode}
                  placeholder="https://..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Biographie"
                  multiline
                  rows={4}
                  value={editMode ? tempInfo?.bio || '' : personalInfo.bio || ''}
                  onChange={(e) => handleInfoChange('bio', e.target.value)}
                  disabled={!editMode}
                  placeholder="Parlez-nous de vous et de votre expérience cycliste..."
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel id="experience-label">Niveau d'expérience</InputLabel>
                  <Select
                    labelId="experience-label"
                    value={editMode ? tempInfo?.cyclingExperience || '' : personalInfo.cyclingExperience || ''}
                    label="Niveau d'expérience"
                    onChange={(e) => handleInfoChange('cyclingExperience', e.target.value)}
                  >
                    <MenuItem value="beginner">Débutant</MenuItem>
                    <MenuItem value="intermediate">Intermédiaire</MenuItem>
                    <MenuItem value="advanced">Avancé</MenuItem>
                    <MenuItem value="professional">Professionnel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Statistiques physiques et cyclistes */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            Statistiques cyclistes
          </Typography>
          <Button 
            variant="text" 
            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
          >
            {showAdvancedStats ? 'Masquer les stats avancées' : 'Afficher les stats avancées'}
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Poids (kg)"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
              value={editMode ? tempInfo?.weight || '' : personalInfo.weight || ''}
              onChange={(e) => handleInfoChange('weight', parseFloat(e.target.value))}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Taille (cm)"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              }}
              value={editMode ? tempInfo?.height || '' : personalInfo.height || ''}
              onChange={(e) => handleInfoChange('height', parseFloat(e.target.value))}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="FTP (W)"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">W</InputAdornment>,
              }}
              value={editMode ? tempInfo?.ftp || '' : personalInfo.ftp || ''}
              onChange={(e) => handleInfoChange('ftp', parseFloat(e.target.value))}
              disabled={!editMode}
              helperText="Functional Threshold Power"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="FC max (bpm)"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
              }}
              value={editMode ? tempInfo?.maxHr || '' : personalInfo.maxHr || ''}
              onChange={(e) => handleInfoChange('maxHr', parseFloat(e.target.value))}
              disabled={!editMode}
              helperText="Fréquence cardiaque maximale"
            />
          </Grid>

          {showAdvancedStats && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="FC repos (bpm)"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                  }}
                  value={editMode ? tempInfo?.restingHr || '' : personalInfo.restingHr || ''}
                  onChange={(e) => handleInfoChange('restingHr', parseFloat(e.target.value))}
                  disabled={!editMode}
                  helperText="Fréquence cardiaque au repos"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="VO2 Max (ml/kg/min)"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">ml/kg/min</InputAdornment>,
                  }}
                  value={editMode ? tempInfo?.vo2max || '' : personalInfo.vo2max || ''}
                  onChange={(e) => handleInfoChange('vo2max', parseFloat(e.target.value))}
                  disabled={!editMode}
                  helperText="Volume maximum d'oxygène"
                />
              </Grid>
            </>
          )}
        </Grid>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Ces statistiques sont utilisées pour personnaliser vos plans d'entraînement et calculer vos zones de puissance et de fréquence cardiaque.
          </Typography>
        </Box>
      </Paper>

      {/* Notifications de succès/erreur */}
      <Snackbar 
        open={saveSuccess} 
        autoHideDuration={6000} 
        onClose={() => setSaveSuccess(false)}
      >
        <Alert onClose={() => setSaveSuccess(false)} severity="success">
          Informations personnelles mises à jour avec succès
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={saveError} 
        autoHideDuration={6000} 
        onClose={() => setSaveError(false)}
      >
        <Alert onClose={() => setSaveError(false)} severity="error">
          Erreur lors de la mise à jour des informations personnelles
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PersonalInformation;
