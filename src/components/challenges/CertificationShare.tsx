import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Chip,
  Snackbar,
  Alert
} from '@mui/material';
import { Certification, Challenge, Col } from '../../types';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import CloseIcon from '@mui/icons-material/Close';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DownloadIcon from '@mui/icons-material/Download';
import LinkIcon from '@mui/icons-material/Link';
import TerrainIcon from '@mui/icons-material/Terrain';
import SpeedIcon from '@mui/icons-material/Speed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const apiOrchestrator = new APIOrchestrator();

interface CertificationShareProps {
  certificationId: string;
  open: boolean;
  onClose: () => void;
}

type ShareTemplate = 'standard' | 'detailed' | 'minimal';
type SocialPlatform = 'twitter' | 'facebook' | 'instagram' | 'strava';

/**
 * Composant de dialogue pour partager une certification de défi
 * sur les réseaux sociaux
 */
const CertificationShare: React.FC<CertificationShareProps> = ({ 
  certificationId, 
  open, 
  onClose 
}) => {
  const [certification, setCertification] = useState<Certification | null>(null);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [cols, setCols] = useState<Col[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sharingImage, setSharingImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [shareTemplate, setShareTemplate] = useState<ShareTemplate>('standard');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [sharing, setSharing] = useState<boolean>(false);
  const [platform, setPlatform] = useState<SocialPlatform | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [options, setOptions] = useState({
    includeMap: true,
    includeElevation: true,
    includeStats: true
  });

  useEffect(() => {
    const fetchCertificationData = async () => {
      if (!certificationId || !open) return;
      
      setLoading(true);
      try {
        // Supposons qu'il existe une méthode pour obtenir une certification par ID
        // Nous la simulons ici en récupérant toutes les certifications d'un défi
        const certResponse = await fetch(`/api/certifications/${certificationId}`);
        const certData = await certResponse.json();
        setCertification(certData);
        
        // Chargement du défi associé
        const challengeData = await apiOrchestrator.getChallengeById(certData.challengeId);
        setChallenge(challengeData);
        
        // Chargement des cols
        const colsData = await Promise.all(
          challengeData.cols.map((colId: string) => apiOrchestrator.getColById(colId))
        );
        setCols(colsData);
        
        // Génération de l'image de partage par défaut
        generateShareImage('standard');
        
        // Message par défaut
        setShareMessage(`J'ai relevé le défi "${challengeData.name}" sur Velo-Altitude ! ${challengeData.totalDistance.toFixed(1)}km et ${challengeData.totalElevation.toFixed(0)}m de dénivelé dans les Vosges. #VeloAltitude #7Majeurs`);
      } catch (error) {
        console.error('Erreur lors du chargement des données de certification:', error);
        setErrorMessage('Impossible de charger les données de certification');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificationData();
  }, [certificationId, open]);
  
  const generateShareImage = async (template: ShareTemplate) => {
    if (!certificationId) return;
    
    try {
      setShareTemplate(template);
      
      const imageUrl = await apiOrchestrator.generateSharingImage(
        certificationId,
        {
          template,
          ...options
        }
      );
      
      setSharingImage(imageUrl);
    } catch (error) {
      console.error('Erreur lors de la génération de l\'image de partage:', error);
      setErrorMessage('Erreur lors de la génération de l\'image de partage');
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleShare = async (platform: SocialPlatform) => {
    if (!certificationId) return;
    
    setSharing(true);
    setPlatform(platform);
    
    try {
      const result = await apiOrchestrator.shareAchievement(
        certificationId,
        platform,
        shareMessage
      );
      
      if (result.success) {
        setSuccessMessage(`Partagé avec succès sur ${getPlatformName(platform)} !`);
        
        // Si une URL de redirection est fournie (pour continuer sur la plateforme)
        if (result.url) {
          window.open(result.url, '_blank');
        }
      } else {
        setErrorMessage(`Échec du partage sur ${getPlatformName(platform)}`);
      }
    } catch (error) {
      console.error('Erreur lors du partage:', error);
      setErrorMessage(`Erreur lors du partage sur ${getPlatformName(platform)}`);
    } finally {
      setSharing(false);
      setPlatform(null);
    }
  };
  
  const handleDownloadImage = () => {
    if (!sharingImage) return;
    
    // Création d'un lien temporaire pour télécharger l'image
    const a = document.createElement('a');
    a.href = sharingImage;
    a.download = `certification-${certificationId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}/certifications/${certificationId}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setSuccessMessage('Lien copié dans le presse-papier !');
      })
      .catch(err => {
        console.error('Erreur lors de la copie du lien:', err);
        setErrorMessage('Impossible de copier le lien');
      });
  };
  
  const getPlatformName = (platform: SocialPlatform): string => {
    switch (platform) {
      case 'twitter': return 'Twitter';
      case 'facebook': return 'Facebook';
      case 'instagram': return 'Instagram';
      case 'strava': return 'Strava';
      default: return 'la plateforme';
    }
  };
  
  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };
  
  const handleOptionChange = (option: keyof typeof options) => {
    const newOptions = { ...options, [option]: !options[option] };
    setOptions(newOptions);
    
    // Régénérer l'image avec les nouvelles options
    apiOrchestrator.generateSharingImage(certificationId, {
      template: shareTemplate,
      ...newOptions
    }).then(setSharingImage);
  };
  
  if (!open) return null;
  
  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        fullWidth 
        maxWidth="md"
        aria-labelledby="certification-share-dialog"
      >
        <DialogTitle id="certification-share-dialog">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Partager votre réussite
            </Typography>
            <IconButton onClick={onClose} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Aperçu de l'image de partage */}
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" gutterBottom>
                  Aperçu
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px solid #ddd', 
                    borderRadius: 1, 
                    p: 1, 
                    mb: 2,
                    height: 400,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#f5f5f5'
                  }}
                >
                  {sharingImage ? (
                    <img 
                      src={sharingImage} 
                      alt="Certification" 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chargement de l'aperçu...
                    </Typography>
                  )}
                </Box>
                
                {/* Style de template */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Style de badge
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Standard" 
                      onClick={() => generateShareImage('standard')}
                      color={shareTemplate === 'standard' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Détaillé" 
                      onClick={() => generateShareImage('detailed')}
                      color={shareTemplate === 'detailed' ? 'primary' : 'default'}
                    />
                    <Chip 
                      label="Minimaliste" 
                      onClick={() => generateShareImage('minimal')}
                      color={shareTemplate === 'minimal' ? 'primary' : 'default'}
                    />
                  </Box>
                </Box>
                
                {/* Options d'affichage */}
                <Box>
                  <Typography variant="body2" gutterBottom>
                    Options
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label="Carte" 
                      onClick={() => handleOptionChange('includeMap')}
                      color={options.includeMap ? 'primary' : 'default'}
                      variant={options.includeMap ? 'filled' : 'outlined'}
                    />
                    <Chip 
                      label="Profil d'élévation" 
                      onClick={() => handleOptionChange('includeElevation')}
                      color={options.includeElevation ? 'primary' : 'default'}
                      variant={options.includeElevation ? 'filled' : 'outlined'}
                    />
                    <Chip 
                      label="Statistiques" 
                      onClick={() => handleOptionChange('includeStats')}
                      color={options.includeStats ? 'primary' : 'default'}
                      variant={options.includeStats ? 'filled' : 'outlined'}
                    />
                  </Box>
                </Box>
              </Grid>
              
              {/* Options de partage */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" gutterBottom>
                  Défi complété : {challenge?.name}
                </Typography>
                
                {/* Informations sur le défi */}
                <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Complété le {certification && new Date(certification.completionDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TerrainIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {challenge?.totalElevation.toFixed(0)} m de dénivelé
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DirectionsRunIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      {challenge?.totalDistance.toFixed(1)} km parcourus
                    </Typography>
                  </Box>
                  
                  {certification?.completionTime && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2">
                        Temps: {Math.floor(certification.completionTime / 3600)}h
                        {Math.floor((certification.completionTime % 3600) / 60).toString().padStart(2, '0')}m
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                {/* Message de partage */}
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Message de partage"
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  variant="outlined"
                  margin="normal"
                />
                
                {/* Onglets de partage */}
                <Box sx={{ mt: 3 }}>
                  <Tabs value={activeTab} onChange={handleTabChange} aria-label="options de partage">
                    <Tab label="Réseaux sociaux" />
                    <Tab label="Télécharger" />
                  </Tabs>
                  
                  {/* Contenu des onglets */}
                  <Box sx={{ mt: 2 }}>
                    {activeTab === 0 && (
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<TwitterIcon />}
                            onClick={() => handleShare('twitter')}
                            disabled={sharing}
                          >
                            {platform === 'twitter' && sharing ? 'Partage...' : 'Twitter'}
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<FacebookIcon />}
                            onClick={() => handleShare('facebook')}
                            disabled={sharing}
                            sx={{ bgcolor: '#4267B2' }}
                          >
                            {platform === 'facebook' && sharing ? 'Partage...' : 'Facebook'}
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<InstagramIcon />}
                            onClick={() => handleShare('instagram')}
                            disabled={sharing}
                            sx={{ bgcolor: '#C13584' }}
                          >
                            {platform === 'instagram' && sharing ? 'Partage...' : 'Instagram'}
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<DirectionsRunIcon />}
                            onClick={() => handleShare('strava')}
                            disabled={sharing}
                            sx={{ bgcolor: '#FC4C02' }}
                          >
                            {platform === 'strava' && sharing ? 'Partage...' : 'Strava'}
                          </Button>
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            variant="outlined"
                            color="primary"
                            startIcon={<LinkIcon />}
                            onClick={handleCopyLink}
                          >
                            Copier le lien
                          </Button>
                        </Grid>
                      </Grid>
                    )}
                    
                    {activeTab === 1 && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={<DownloadIcon />}
                          onClick={handleDownloadImage}
                          disabled={!sharingImage}
                          sx={{ mb: 2 }}
                        >
                          Télécharger l'image
                        </Button>
                        
                        <Typography variant="body2" color="text.secondary">
                          L'image sera téléchargée au format PNG et pourra être partagée 
                          manuellement sur les réseaux sociaux ou imprimée pour votre collection personnelle.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications de succès/erreur */}
      <Snackbar 
        open={!!successMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!errorMessage} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CertificationShare;
