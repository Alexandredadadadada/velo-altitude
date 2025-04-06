import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Divider,
  Button,
  IconButton,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Tab,
  Tabs,
  useMediaQuery
} from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import TerrainIcon from '@mui/icons-material/Terrain';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FlagIcon from '@mui/icons-material/Flag';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import DownloadIcon from '@mui/icons-material/Download';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import WarningIcon from '@mui/icons-material/Warning';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useCommunity } from '../../../contexts/CommunityContext';
import { useAuth } from '../../../context/AuthContext';

// Composants stylisés
const ImageGallery = styled(Box)(({ theme }) => ({
  display: 'flex',
  overflowX: 'auto',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
  '&::-webkit-scrollbar': {
    height: 8,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: theme.palette.action.hover,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.primary.main,
    borderRadius: 4,
  },
}));

const GalleryImage = styled(Box)(({ theme }) => ({
  minWidth: 240,
  height: 180,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  flexShrink: 0,
  '&:hover::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const ImagePopup = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    overflow: 'hidden',
  },
  '& img': {
    width: '100%',
    maxHeight: '80vh',
    objectFit: 'contain',
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const RouteInfo = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
}));

const ElevationProfile = styled(Box)(({ theme }) => ({
  backgroundColor: '#f5f5f5',
  height: 200,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

// Mock données de commentaires
const mockComments = [
  {
    id: 'comment-1',
    routeId: 'route-1',
    author: {
      id: '456',
      name: 'Marie Martin',
      avatar: '/images/profiles/user2.jpg',
    },
    content: "J'ai fait cet itinéraire le mois dernier et c'était magnifique ! Les cols sont difficiles mais les paysages en valent vraiment la peine.",
    createdAt: '2025-03-25T14:30:00Z',
    likes: 5
  },
  {
    id: 'comment-2',
    routeId: 'route-1',
    author: {
      id: '789',
      name: 'Lucas Bernard',
      avatar: '/images/profiles/user3.jpg',
    },
    content: "Attention, il n'y a pas beaucoup de points d'eau sur le parcours. Prévoyez de grandes gourdes, surtout en été !",
    createdAt: '2025-03-28T09:15:00Z',
    likes: 3
  }
];

const RouteDetail = () => {
  const { routeId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { sharedRoutes, likeRoute, formatDate } = useCommunity();
  const { isAuthenticated, user } = useAuth();
  
  // États
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePopupOpen, setImagePopupOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  
  // Récupérer les données de l'itinéraire
  useEffect(() => {
    // Dans une implémentation réelle, ces données viendraient d'une API
    if (sharedRoutes && sharedRoutes.length > 0) {
      setLoading(true);
      
      setTimeout(() => {
        const foundRoute = sharedRoutes.find(r => r.id === routeId);
        
        if (foundRoute) {
          setRoute(foundRoute);
          // Simuler le chargement des commentaires
          setComments(mockComments.filter(c => c.routeId === routeId));
        } else {
          setError('Itinéraire introuvable');
        }
        
        setLoading(false);
      }, 800);
    }
  }, [routeId, sharedRoutes]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleLike = async () => {
    if (!isAuthenticated) {
      // Rediriger vers la page de connexion ou afficher une alerte
      return;
    }
    
    try {
      await likeRoute(routeId);
      setLiked(true);
      setRoute(prev => ({
        ...prev,
        likes: prev.likes + 1
      }));
    } catch (error) {
      console.error('Error liking route:', error);
    }
  };
  
  const handleDownload = () => {
    // Dans une implémentation réelle, ceci téléchargerait un fichier GPX ou similaire
    alert('Téléchargement de l\'itinéraire...');
    setRoute(prev => ({
      ...prev,
      downloads: prev.downloads + 1
    }));
  };
  
  const handleShare = () => {
    // Dans une implémentation réelle, ceci ouvrirait une modal de partage
    navigator.clipboard.writeText(window.location.href);
    alert('Lien copié dans le presse-papiers');
  };
  
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setImagePopupOpen(true);
  };
  
  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !isAuthenticated) {
      return;
    }
    
    try {
      setCommentSubmitting(true);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newCommentObj = {
        id: `comment-${Date.now()}`,
        routeId,
        author: {
          id: user?.sub || '123',
          name: user?.name || 'Jean Dupont',
          avatar: user?.picture || '/images/profiles/default-avatar.jpg',
        },
        content: newComment,
        createdAt: new Date().toISOString(),
        likes: 0
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setNewComment('');
      
      setRoute(prev => ({
        ...prev,
        comments: prev.comments + 1
      }));
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setCommentSubmitting(false);
    }
  };
  
  const handleDeleteRoute = () => {
    setConfirmDeleteOpen(true);
  };
  
  const confirmDelete = async () => {
    // Dans une implémentation réelle, ceci appellerait une API pour supprimer l'itinéraire
    setConfirmDeleteOpen(false);
    alert('Itinéraire supprimé');
    navigate('/community/routes');
  };
  
  const isOwner = route && route.author && user && route.author.id === user.sub;
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !route) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Erreur lors du chargement de l\'itinéraire'}
        </Alert>
        <Button component={Link} to="/community/routes" variant="outlined">
          Retour à la liste des itinéraires
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Fil d'Ariane */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="navigation" 
        sx={{ mb: 2 }}
      >
        <Link to="/community" style={{ textDecoration: 'none', color: 'inherit' }}>
          Communauté
        </Link>
        <Link to="/community/routes" style={{ textDecoration: 'none', color: 'inherit' }}>
          Itinéraires
        </Link>
        <Typography color="textPrimary">{route.title}</Typography>
      </Breadcrumbs>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Titre et infos principales */}
          <StyledPaper>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  {route.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Avatar src={route.author.avatar} alt={route.author.name} sx={{ width: 32, height: 32, mr: 1 }} />
                  <Typography variant="subtitle1">
                    {route.author.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mx: 1 }}>
                    •
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Publié le {formatDate(route.createdAt)}
                  </Typography>
                </Box>
              </Box>
              
              {isOwner && (
                <Box>
                  <IconButton color="primary" component={Link} to={`/community/routes/edit/${route.id}`}>
                    <EditIcon />
                  </IconButton>
                  <IconButton color="error" onClick={handleDeleteRoute}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              <Chip 
                icon={<MapIcon />} 
                label={`${route.distance} km`} 
                variant="outlined" 
              />
              <Chip 
                icon={<TerrainIcon />} 
                label={`${route.elevation} m`} 
                variant="outlined" 
              />
              <Chip 
                icon={<AccessTimeIcon />} 
                label={`Durée: ${route.duration}`} 
                variant="outlined" 
              />
              {route.difficulty && (
                <Chip 
                  label={`Difficulté: ${route.difficulty}`} 
                  variant="outlined"
                  color={
                    route.difficulty === 'facile' ? 'success' :
                    route.difficulty === 'modere' ? 'info' :
                    route.difficulty === 'difficile' ? 'warning' :
                    'error'
                  }
                />
              )}
              {route.region && (
                <Chip 
                  label={route.region} 
                  variant="outlined" 
                />
              )}
            </Box>
            
            {/* Galerie d'images */}
            {route.images && route.images.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Photos
                </Typography>
                <ImageGallery>
                  {route.images.map((image, index) => (
                    <GalleryImage 
                      key={index} 
                      onClick={() => handleImageClick(image)}
                    >
                      <img src={image} alt={`${route.title} - Photo ${index + 1}`} />
                    </GalleryImage>
                  ))}
                </ImageGallery>
              </Box>
            )}
            
            {/* Informations détaillées */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1" paragraph>
                {route.description}
              </Typography>
            </Box>
            
            {route.tips && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Conseils et astuces
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f8f9fa' }}>
                  <ReactMarkdown>
                    {route.tips}
                  </ReactMarkdown>
                </Paper>
              </Box>
            )}
            
            {/* Points de départ et d'arrivée */}
            {(route.startLocation || route.endLocation) && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {route.startLocation && (
                  <RouteInfo>
                    <Typography variant="subtitle2" color="textSecondary">
                      Départ
                    </Typography>
                    <Typography variant="body1">
                      {route.startLocation}
                    </Typography>
                  </RouteInfo>
                )}
                
                {route.endLocation && (
                  <RouteInfo>
                    <Typography variant="subtitle2" color="textSecondary">
                      Arrivée
                    </Typography>
                    <Typography variant="body1">
                      {route.endLocation}
                    </Typography>
                  </RouteInfo>
                )}
              </Box>
            )}
            
            {/* Profil altimétrique */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Profil altimétrique
              </Typography>
              <ElevationProfile>
                <Typography variant="body2" color="textSecondary">
                  Profil altimétrique non disponible pour le moment
                </Typography>
              </ElevationProfile>
            </Box>
          </StyledPaper>
          
          {/* Commentaires */}
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Commentaires ({comments.length})
            </Typography>
            
            {isAuthenticated ? (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Partagez votre expérience ou posez une question..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  variant="outlined"
                  disabled={commentSubmitting}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim() || commentSubmitting}
                    startIcon={commentSubmitting ? <CircularProgress size={20} /> : <CommentIcon />}
                  >
                    {commentSubmitting ? 'Envoi...' : 'Commenter'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>Connectez-vous</Link> pour laisser un commentaire
              </Alert>
            )}
            
            <Divider sx={{ mb: 2 }} />
            
            {comments.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body1" color="textSecondary">
                  Soyez le premier à commenter cet itinéraire !
                </Typography>
              </Box>
            ) : (
              <List>
                {comments.map((comment) => (
                  <React.Fragment key={comment.id}>
                    <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar src={comment.author.avatar} alt={comment.author.name} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="subtitle2">
                              {comment.author.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {format(new Date(comment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography
                            variant="body2"
                            color="textPrimary"
                            component="span"
                            sx={{ display: 'inline', mt: 1 }}
                          >
                            {comment.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </StyledPaper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* Carte et actions */}
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              Carte
            </Typography>
            <Card sx={{ mb: 3 }}>
              <CardMedia
                component="img"
                height="200"
                image="/images/maps/route-map-placeholder.jpg"
                alt="Carte de l'itinéraire"
              />
              <CardContent sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption" color="textSecondary">
                  Carte interactive disponible bientôt
                </Typography>
              </CardContent>
            </Card>
            
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Télécharger l'itinéraire
              </Button>
              
              <Button
                fullWidth
                variant={liked ? 'contained' : 'outlined'}
                color="primary"
                startIcon={liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                onClick={handleLike}
                disabled={!isAuthenticated}
              >
                {liked ? 'Aimé' : 'J\'aime'} ({route.likes + (liked ? 1 : 0)})
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={handleShare}
              >
                Partager
              </Button>
            </Box>
          </StyledPaper>
          
          {/* Cols inclus */}
          {route.colsIncluded && route.colsIncluded.length > 0 && (
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Cols traversés
              </Typography>
              <List dense>
                {route.colsIncluded.map((col, index) => (
                  <ListItem key={index}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <TerrainIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={col}
                    />
                  </ListItem>
                ))}
              </List>
            </StyledPaper>
          )}
          
          {/* Auteur */}
          <StyledPaper>
            <Typography variant="h6" gutterBottom>
              À propos de l'auteur
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                src={route.author.avatar} 
                alt={route.author.name}
                sx={{ width: 64, height: 64, mr: 2 }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  {route.author.name}
                </Typography>
                <Button
                  variant="text"
                  size="small"
                  component={Link}
                  to={`/community/profile/${route.author.id}`}
                  startIcon={<PersonIcon />}
                >
                  Voir le profil
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </Grid>
      </Grid>
      
      {/* Popup d'image en plein écran */}
      <ImagePopup
        open={imagePopupOpen}
        onClose={() => setImagePopupOpen(false)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedImage && (
            <img src={selectedImage} alt="Vue agrandie" />
          )}
        </DialogContent>
      </ImagePopup>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
      >
        <DialogTitle>
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WarningIcon color="warning" sx={{ mr: 1 }} />
            <Typography>
              Êtes-vous sûr de vouloir supprimer cet itinéraire ? Cette action est irréversible.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>
            Annuler
          </Button>
          <Button color="error" onClick={confirmDelete} variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RouteDetail;
