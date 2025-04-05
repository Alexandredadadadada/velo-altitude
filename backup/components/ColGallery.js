import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Button, 
  IconButton, 
  Dialog, 
  DialogContent, 
  DialogActions,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  Snackbar,
  ImageList,
  ImageListItem,
  Card,
  CardMedia
} from '@mui/material';
import { 
  Close as CloseIcon, 
  KeyboardArrowLeft as LeftIcon,
  KeyboardArrowRight as RightIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';

/**
 * Composant pour afficher et gérer la galerie photos d'un col
 */
const ColGallery = ({ colId, initialPhotos = [] }) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Charger les photos si elles ne sont pas fournies
  useEffect(() => {
    if (initialPhotos.length === 0) {
      fetchPhotos();
    }
  }, [colId, initialPhotos]);
  
  // Nettoyage de l'URL d'aperçu lors du démontage
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  // Récupérer les photos du col
  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/passes/cols/${colId}/photos`);
      setPhotos(response.data.photos || []);
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des photos:', err);
      setError('Impossible de charger les photos. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };
  
  // Ouvrir le visualiseur de photos
  const openPhotoViewer = (index) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };
  
  // Fermer le visualiseur de photos
  const closePhotoViewer = () => {
    setViewerOpen(false);
  };
  
  // Naviguer vers la photo précédente
  const goToPreviousPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : photos.length - 1
    );
  };
  
  // Naviguer vers la photo suivante
  const goToNextPhoto = () => {
    setCurrentPhotoIndex((prevIndex) => 
      prevIndex < photos.length - 1 ? prevIndex + 1 : 0
    );
  };
  
  // Ouvrir la boîte de dialogue d'upload
  const openUploadDialog = () => {
    if (!user) {
      setNotification({
        open: true,
        message: 'Vous devez être connecté pour ajouter des photos',
        type: 'error'
      });
      return;
    }
    setPhotoFile(null);
    setPhotoCaption('');
    setPreviewUrl(null);
    setUploadDialogOpen(true);
  };
  
  // Fermer la boîte de dialogue d'upload
  const closeUploadDialog = () => {
    setUploadDialogOpen(false);
  };
  
  // Gérer la sélection d'un fichier image
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Créer une URL temporaire pour l'aperçu
      const fileUrl = URL.createObjectURL(file);
      setPreviewUrl(fileUrl);
    }
  };
  
  // Soumettre une nouvelle photo
  const handleSubmitPhoto = async () => {
    if (!photoFile) {
      setNotification({
        open: true,
        message: 'Veuillez sélectionner une photo',
        type: 'error'
      });
      return;
    }
    
    try {
      setUploading(true);
      
      // Créer un formData pour l'upload
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('caption', photoCaption);
      formData.append('colId', colId);
      
      // Envoyer la photo
      const response = await axios.post(`/api/passes/cols/${colId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      // Ajouter la nouvelle photo à la liste
      setPhotos((prevPhotos) => [...prevPhotos, response.data.photo]);
      
      // Fermer la boîte de dialogue et afficher une notification
      closeUploadDialog();
      setNotification({
        open: true,
        message: 'Photo ajoutée avec succès',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de l\'upload de la photo:', err);
      setNotification({
        open: true,
        message: 'Erreur lors de l\'upload. Veuillez réessayer.',
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Supprimer une photo
  const handleDeletePhoto = async (photoId) => {
    if (!user) {
      setNotification({
        open: true,
        message: 'Vous devez être connecté pour supprimer des photos',
        type: 'error'
      });
      return;
    }
    
    try {
      await axios.delete(`/api/passes/cols/${colId}/photos/${photoId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });
      
      // Retirer la photo de la liste
      setPhotos((prevPhotos) => prevPhotos.filter(photo => photo.id !== photoId));
      
      // Si la photo supprimée est celle affichée, fermer le visualiseur
      if (viewerOpen && photos[currentPhotoIndex].id === photoId) {
        closePhotoViewer();
      }
      
      setNotification({
        open: true,
        message: 'Photo supprimée avec succès',
        type: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de la suppression de la photo:', err);
      setNotification({
        open: true,
        message: 'Erreur lors de la suppression. Veuillez réessayer.',
        type: 'error'
      });
    }
  };
  
  // Fermer la notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };
  
  // Afficher un loader pendant le chargement
  if (loading && photos.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }
  
  // Afficher un message d'erreur
  if (error && photos.length === 0) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      {/* En-tête avec nombre de photos et bouton d'ajout */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle1">
          {photos.length} photo{photos.length !== 1 ? 's' : ''}
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={openUploadDialog}
        >
          Ajouter une photo
        </Button>
      </Box>
      
      {/* Galerie de photos */}
      {photos.length === 0 ? (
        <Paper 
          elevation={0} 
          variant="outlined" 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="body1" color="text.secondary" paragraph>
            Aucune photo disponible pour ce col.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={openUploadDialog}
          >
            Soyez le premier à ajouter une photo
          </Button>
        </Paper>
      ) : (
        <ImageList
          variant="quilted"
          cols={4}
          gap={8}
          sx={{ 
            mb: 0,
            // Ajustements responsifs
            '@media (max-width: 600px)': {
              cols: 2
            }
          }}
        >
          {photos.map((photo, index) => (
            <ImageListItem 
              key={photo.id || index}
              component={motion.div}
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              onClick={() => openPhotoViewer(index)}
              sx={{ 
                cursor: 'pointer',
                overflow: 'hidden',
                borderRadius: 1
              }}
              // Différentes tailles pour certaines images
              cols={index % 5 === 0 ? 2 : 1}
              rows={index % 5 === 0 ? 2 : 1}
            >
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${index + 1}`}
                loading="lazy"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'cover' 
                }}
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
      
      {/* Visualiseur de photos (boîte de dialogue plein écran) */}
      <Dialog
        fullScreen
        open={viewerOpen}
        onClose={closePhotoViewer}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: 'rgba(0, 0, 0, 0.9)'
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1
          }}
        >
          <IconButton
            edge="end"
            color="inherit"
            onClick={closePhotoViewer}
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <DialogContent 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 0
          }}
        >
          {photos.length > 0 && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '85vh',
                  position: 'relative'
                }}
              >
                <IconButton
                  onClick={goToPreviousPhoto}
                  sx={{
                    position: 'absolute',
                    left: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }}
                >
                  <LeftIcon fontSize="large" />
                </IconButton>
                
                <Box
                  component="img"
                  src={photos[currentPhotoIndex].url}
                  alt={photos[currentPhotoIndex].caption || `Photo ${currentPhotoIndex + 1}`}
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
                
                <IconButton
                  onClick={goToNextPhoto}
                  sx={{
                    position: 'absolute',
                    right: 16,
                    color: 'white',
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.5)'
                    }
                  }}
                >
                  <RightIcon fontSize="large" />
                </IconButton>
              </Box>
              
              <Box
                sx={{
                  p: 2,
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body1" color="white">
                    {photos[currentPhotoIndex].caption || `Photo ${currentPhotoIndex + 1}`}
                  </Typography>
                  <Typography variant="caption" color="grey.400">
                    Par {photos[currentPhotoIndex].userName || 'Anonyme'} • 
                    {photos[currentPhotoIndex].createdAt ? 
                      new Date(photos[currentPhotoIndex].createdAt).toLocaleDateString() : 
                      'Date inconnue'}
                  </Typography>
                </Box>
                
                {/* Afficher le bouton de suppression si l'utilisateur est le propriétaire */}
                {user && photos[currentPhotoIndex].userId === user.id && (
                  <IconButton
                    color="error"
                    onClick={() => handleDeletePhoto(photos[currentPhotoIndex].id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Boîte de dialogue pour l'upload de photo */}
      <Dialog
        open={uploadDialogOpen}
        onClose={closeUploadDialog}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ajouter une photo
          </Typography>
          
          <Box my={2}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{ height: 56 }}
            >
              Sélectionner une image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Box>
          
          {previewUrl && (
            <Box my={2} textAlign="center">
              <img
                src={previewUrl}
                alt="Aperçu"
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            </Box>
          )}
          
          <TextField
            label="Légende (optionnelle)"
            fullWidth
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
            margin="normal"
            multiline
            rows={2}
            placeholder="Décrivez brièvement cette photo..."
          />
        </Box>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeUploadDialog} disabled={uploading}>
            Annuler
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitPhoto}
            disabled={!photoFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : null}
          >
            {uploading ? 'Envoi en cours...' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        message={notification.message}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type}
          elevation={6} 
          variant="filled"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ColGallery;
