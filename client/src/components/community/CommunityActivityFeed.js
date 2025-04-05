import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  Paper, 
  Divider, 
  Button, 
  IconButton, 
  Skeleton,
  Card, 
  CardHeader, 
  CardContent, 
  CardActions, 
  CardMedia,
  Chip,
  Tooltip,
  CircularProgress,
  Link,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../common/NotificationSystem';
import axios from 'axios';
import {
  ThumbUp, 
  Comment, 
  Share, 
  MoreVert, 
  Favorite, 
  DirectionsBike, 
  Public,
  EmojiEvents,
  AccessTime,
  Send
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistance, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// Composant de carte d'activité stylisée
const ActivityCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4]
  }
}));

// Animation d'entrée pour les cartes d'activité
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  })
};

/**
 * Flux d'activité pour la section Community
 * Affiche les activités récentes des membres de la communauté
 */
const CommunityActivityFeed = ({ limit = 10, filter = 'all' }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentActivityId, setCurrentActivityId] = useState(null);
  const [commentLoading, setCommentLoading] = useState(false);
  const { user, token } = useAuth();
  const { notify } = useNotification();

  // Configuration des en-têtes d'authentification pour les requêtes API
  const authConfig = useCallback(() => {
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }, [token]);

  // Récupérer les activités depuis l'API
  const fetchActivities = useCallback(async (pageNum = 1, replace = true) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`/api/community/activity-feed`, {
        ...authConfig(),
        params: {
          limit,
          page: pageNum,
          filter
        }
      });
      
      // Si la réponse est vide ou a moins d'éléments que la limite, il n'y a plus de données
      if (!response.data || response.data.length === 0 || response.data.length < limit) {
        setHasMore(false);
      }
      
      // Transformer les données pour correspondre à la structure attendue par le composant
      const formattedActivities = response.data.map(activity => {
        let formattedActivity = {
          id: activity._id,
          type: activity.type,
          user: {
            id: activity.userId._id,
            name: `${activity.userId.firstName} ${activity.userId.lastName}`,
            avatar: activity.userId.profilePicture || 'https://via.placeholder.com/40'
          },
          title: '',
          content: '',
          likes: activity.kudosCount || 0,
          comments: activity.commentCount || 0,
          hasLiked: activity.hasGivenKudos || false,
          timestamp: activity.createdAt
        };
        
        // Adapter le formatage en fonction du type d'activité
        switch(activity.type) {
          case 'ride':
            formattedActivity.title = activity.data.title || 'Nouvelle sortie vélo';
            formattedActivity.content = activity.data.description || '';
            formattedActivity.stats = {
              distance: activity.data.distance || 0,
              elevation: activity.data.elevation || 0,
              duration: activity.data.duration ? `${Math.floor(activity.data.duration / 60)}h ${activity.data.duration % 60}m` : '0h 0m',
              power: activity.data.power || 0
            };
            formattedActivity.images = activity.data.images || [];
            formattedActivity.location = activity.data.location || '';
            break;
            
          case 'comment':
            formattedActivity.title = 'A commenté une activité';
            formattedActivity.content = activity.data.comment || '';
            formattedActivity.targetActivity = activity.data.activityId;
            break;
            
          case 'event_join':
            formattedActivity.title = 'Participe à un événement';
            formattedActivity.event = {
              id: activity.data.eventId,
              name: activity.data.eventName || 'Événement',
              date: activity.data.eventDate,
              location: activity.data.eventLocation || '',
              distance: activity.data.eventDistance || 0,
              participants: activity.data.participantCount || 0
            };
            break;
            
          case 'achievement':
            formattedActivity.title = 'A obtenu un nouvel accomplissement';
            formattedActivity.achievement = {
              name: activity.data.achievementName || 'Accomplissement',
              improvement: activity.data.improvement || '',
              position: activity.data.position || ''
            };
            break;
            
          case 'challenge_completion':
            formattedActivity.title = 'A terminé un défi';
            formattedActivity.challenge = {
              name: activity.data.challengeName || 'Défi',
              completed: true,
              totalDistance: activity.data.totalDistance || 0,
              totalElevation: activity.data.totalElevation || 0
            };
            break;
            
          case 'follow':
            formattedActivity.title = 'Suit un nouveau cycliste';
            formattedActivity.followedUser = {
              id: activity.data.followedUserId,
              name: activity.data.followedUserName || 'Cycliste'
            };
            break;
            
          case 'kudos':
            formattedActivity.title = 'A aimé une activité';
            formattedActivity.targetActivity = activity.data.activityId;
            break;
            
          default:
            formattedActivity.title = 'Nouvelle activité';
            formattedActivity.content = '';
        }
        
        return formattedActivity;
      });
      
      // Mettre à jour l'état avec les nouvelles activités
      if (replace) {
        setActivities(formattedActivities);
      } else {
        setActivities(prev => [...prev, ...formattedActivities]);
      }
      
      setPage(pageNum);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des activités:', error);
      notify({
        type: 'error',
        message: 'Impossible de charger les activités. Veuillez réessayer.'
      });
      setLoading(false);
    }
  }, [authConfig, limit, filter, notify]);

  // Charger les activités lors du premier rendu
  useEffect(() => {
    if (user && token) {
      fetchActivities(1, true);
    }
  }, [fetchActivities, user, token, filter]);

  // Gérer le chargement de plus d'activités
  const handleLoadMore = async () => {
    if (!loading && hasMore) {
      await fetchActivities(page + 1, false);
    }
  };

  // Gérer les likes (kudos)
  const handleLike = async (activityId) => {
    try {
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return;
      
      const isLiked = activity.hasLiked;
      
      // Optimistic update
      setActivities(prevActivities => 
        prevActivities.map(a => 
          a.id === activityId
            ? { 
                ...a, 
                hasLiked: !isLiked, 
                likes: isLiked ? a.likes - 1 : a.likes + 1 
              }
            : a
        )
      );
      
      // Envoyer la requête à l'API
      if (isLiked) {
        await axios.delete(`/api/community/activity/${activityId}/kudos`, authConfig());
      } else {
        await axios.post(`/api/community/activity/${activityId}/kudos`, {}, authConfig());
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du like:', error);
      notify({
        type: 'error',
        message: 'Une erreur est survenue. Veuillez réessayer.'
      });
      
      // Revenir à l'état précédent en cas d'erreur
      fetchActivities(page, true);
    }
  };
  
  // Ouvrir la boîte de dialogue de commentaire
  const handleOpenCommentDialog = (activityId) => {
    setCurrentActivityId(activityId);
    setCommentText('');
    setCommentDialogOpen(true);
  };
  
  // Fermer la boîte de dialogue de commentaire
  const handleCloseCommentDialog = () => {
    setCommentDialogOpen(false);
    setCurrentActivityId(null);
    setCommentText('');
  };
  
  // Envoyer un commentaire
  const handleSubmitComment = async () => {
    if (!commentText.trim() || !currentActivityId) return;
    
    try {
      setCommentLoading(true);
      
      await axios.post(`/api/community/activity/${currentActivityId}/comment`, {
        content: commentText.trim()
      }, authConfig());
      
      // Mettre à jour le compteur de commentaires
      setActivities(prevActivities => 
        prevActivities.map(a => 
          a.id === currentActivityId
            ? { ...a, comments: a.comments + 1 }
            : a
        )
      );
      
      notify({
        type: 'success',
        message: 'Commentaire ajouté avec succès'
      });
      
      handleCloseCommentDialog();
    } catch (error) {
      console.error('Erreur lors de l\'ajout du commentaire:', error);
      notify({
        type: 'error',
        message: 'Impossible d\'ajouter le commentaire. Veuillez réessayer.'
      });
    } finally {
      setCommentLoading(false);
    }
  };

  // Formater la date relative
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      return formatDistance(date, new Date(), { 
        addSuffix: true,
        locale: fr 
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '';
    }
  };

  return (
    <Box>
      {loading && activities.length === 0 ? (
        // Afficher des skeletons pendant le chargement initial
        <Box>
          {Array.from(new Array(3)).map((_, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ ml: 2 }}>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width={80} />
                </Box>
              </Box>
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="rectangular" height={200} sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={60} />
                <Skeleton variant="text" width={60} />
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box>
          {activities.length === 0 ? (
            // Message si aucune activité
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Aucune activité à afficher pour le moment
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Suivez plus de cyclistes ou rejoignez des défis pour voir leur activité ici.
              </Typography>
            </Paper>
          ) : (
            // Affichage des activités
            <Box>
              {activities.map((activity, index) => (
                <Box 
                  component={motion.div}
                  key={activity.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                >
                  <ActivityCard>
                    <CardHeader
                      avatar={
                        <Avatar src={activity.user.avatar} alt={activity.user.name}>
                          {activity.user.name.charAt(0)}
                        </Avatar>
                      }
                      action={
                        <IconButton aria-label="settings">
                          <MoreVert />
                        </IconButton>
                      }
                      title={
                        <Typography variant="subtitle1" component="span">
                          {activity.user.name}
                        </Typography>
                      }
                      subheader={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          {activity.type === 'ride' && <DirectionsBike fontSize="small" color="primary" sx={{ mr: 0.5 }} />}
                          {activity.type === 'achievement' && <EmojiEvents fontSize="small" color="secondary" sx={{ mr: 0.5 }} />}
                          {activity.type === 'event_join' && <Public fontSize="small" color="info" sx={{ mr: 0.5 }} />}
                          <Typography variant="body2" color="text.secondary">
                            {activity.title} • {formatRelativeTime(activity.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />

                    <CardContent sx={{ py: 1 }}>
                      {activity.content && (
                        <Typography variant="body1" component="p" sx={{ mb: 2 }}>
                          {activity.content}
                        </Typography>
                      )}

                      {/* Stats pour les sorties vélo */}
                      {activity.type === 'ride' && activity.stats && (
                        <Box sx={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: 1,
                          my: 2
                        }}>
                          <Chip 
                            icon={<DirectionsBike />} 
                            label={`${activity.stats.distance} km`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            icon={<AccessTime />} 
                            label={activity.stats.duration} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${activity.stats.elevation} m D+`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          {activity.stats.power > 0 && (
                            <Chip 
                              label={`${activity.stats.power} W`} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          )}
                          {activity.location && (
                            <Chip 
                              icon={<Public />} 
                              label={activity.location} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      )}

                      {/* Infos pour les accomplissements */}
                      {activity.type === 'achievement' && activity.achievement && (
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'warning.light', 
                          borderRadius: 1,
                          mb: 2,
                          border: 1,
                          borderColor: 'warning.main'
                        }}>
                          <Typography variant="subtitle2" color="warning.dark">
                            {activity.achievement.name}
                          </Typography>
                          {activity.achievement.improvement && (
                            <Typography variant="body2" color="text.secondary">
                              Amélioration: {activity.achievement.improvement}
                            </Typography>
                          )}
                          {activity.achievement.position && (
                            <Typography variant="body2" color="text.secondary">
                              Classement: {activity.achievement.position}
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Infos pour les événements */}
                      {activity.type === 'event_join' && activity.event && (
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'info.light', 
                          borderRadius: 1,
                          mb: 2
                        }}>
                          <Typography variant="subtitle2" color="info.dark">
                            {activity.event.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(activity.event.date).toLocaleDateString('fr-FR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                            {' • '}
                            {new Date(activity.event.date).toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </Typography>
                          <Typography variant="body2">
                            {activity.event.location} • {activity.event.distance} km • {activity.event.participants} participants
                          </Typography>
                          <Button 
                            variant="contained" 
                            size="small" 
                            sx={{ 
                              mt: 1, 
                              bgcolor: 'primary.dark',
                              '&:hover': {
                                bgcolor: 'primary.main'
                              }
                            }}
                          >
                            S'inscrire
                          </Button>
                        </Box>
                      )}

                      {activity.type === 'challenge_completion' && activity.challenge && (
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: 'secondary.light', 
                          color: 'secondary.contrastText',
                          borderRadius: 1,
                          mb: 2
                        }}>
                          <Typography variant="subtitle2">
                            {activity.challenge.name} {activity.challenge.completed ? '✓' : ''}
                          </Typography>
                          <Typography variant="body2">
                            {activity.challenge.totalDistance} km • {activity.challenge.totalElevation} m D+
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    {/* Affichage des images */}
                    {activity.images && activity.images.length > 0 && (
                      <CardMedia
                        component="img"
                        height="240"
                        image={activity.images[0]}
                        alt={activity.title}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}

                    <CardActions disableSpacing>
                      <Tooltip title={activity.hasLiked ? "Je n'aime plus" : "J'aime"}>
                        <IconButton 
                          aria-label="like" 
                          onClick={() => handleLike(activity.id)}
                          color={activity.hasLiked ? "primary" : "default"}
                        >
                          <ThumbUp />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {activity.likes}
                      </Typography>
                      
                      <Tooltip title="Commenter">
                        <IconButton 
                          aria-label="comment"
                          onClick={() => handleOpenCommentDialog(activity.id)}
                        >
                          <Comment />
                        </IconButton>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {activity.comments}
                      </Typography>
                      
                      <Tooltip title="Partager">
                        <IconButton aria-label="share">
                          <Share />
                        </IconButton>
                      </Tooltip>
                    </CardActions>
                  </ActivityCard>
                </Box>
              ))}

              {/* Bouton pour charger plus d'activités */}
              {hasMore && (
                <Box display="flex" justifyContent="center" mt={2} mb={4}>
                  <Button 
                    variant="outlined" 
                    onClick={handleLoadMore}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={16} />}
                  >
                    {loading ? 'Chargement...' : 'Voir plus d\'activités'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      )}
      
      {/* Boîte de dialogue pour ajouter un commentaire */}
      <Dialog 
        open={commentDialogOpen} 
        onClose={handleCloseCommentDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Ajouter un commentaire</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            multiline
            rows={4}
            margin="dense"
            label="Votre commentaire"
            fullWidth
            variant="outlined"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCommentDialog} color="primary">
            Annuler
          </Button>
          <Button 
            onClick={handleSubmitComment} 
            color="primary" 
            variant="contained"
            disabled={!commentText.trim() || commentLoading}
            startIcon={commentLoading ? <CircularProgress size={16} /> : <Send />}
          >
            Publier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityActivityFeed;
