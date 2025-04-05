import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Grid, Card, CardContent, CardActions, 
  Avatar, Button, TextField, IconButton, Chip, Divider,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Badge, CircularProgress, Alert, Paper,
  Menu, MenuItem, Tooltip, InputAdornment, Snackbar
} from '@mui/material';
import {
  Search, PersonAdd, Message, Favorite, FavoriteBorder,
  Share, MoreVert, Send, Image, EmojiEmotions, 
  DirectionsBike, Route, Group, Notifications, 
  FilterList, Sort, Delete, Edit, Close, Check,
  Public, Lock, People, PersonAddDisabled, Block
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../common/NotificationSystem';
import SocialService from '../../services/socialService';
import AuthService from '../../services/authService';
import RouteService from '../../services/routeService';
import { MapContainer, TileLayer, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { format, formatDistanceToNow } from 'date-fns';
import { fr, enUS, de, es, it } from 'date-fns/locale';
import './EnhancedSocialHub.css';

// Sélectionner la locale en fonction de la langue
const getLocale = (lang) => {
  switch (lang) {
    case 'fr': return fr;
    case 'de': return de;
    case 'es': return es;
    case 'it': return it;
    default: return enUS;
  }
};

/**
 * Composant pour afficher un post dans le fil d'actualité
 */
const SocialPost = ({ post, currentUser, onLike, onComment, onShare, onDelete, onEdit }) => {
  const { t, i18n } = useTranslation();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const locale = getLocale(i18n.language);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEdit = () => {
    setEditMode(true);
    handleMenuClose();
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedContent(post.content);
  };

  const handleSaveEdit = () => {
    onEdit(post.id, editedContent);
    setEditMode(false);
  };

  const handleDelete = () => {
    onDelete(post.id);
    handleMenuClose();
  };

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      onComment(post.id, newComment);
      setNewComment('');
    }
  };

  const isOwnPost = currentUser && post.userId === currentUser.id;
  const hasLiked = post.likes && post.likes.includes(currentUser?.id);

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar 
            src={post.userAvatar} 
            alt={post.userName}
            sx={{ width: 48, height: 48, mr: 2 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {post.userName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale })}
              {post.privacy === 'private' && (
                <Chip 
                  icon={<Lock fontSize="small" />} 
                  label={t('private')} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
              {post.privacy === 'friends' && (
                <Chip 
                  icon={<People fontSize="small" />} 
                  label={t('friendsOnly')} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
          
          {isOwnPost && (
            <>
              <IconButton onClick={handleMenuOpen}>
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(menuAnchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEdit}>
                  <Edit fontSize="small" sx={{ mr: 1 }} />
                  {t('edit')}
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                  <Delete fontSize="small" sx={{ mr: 1 }} />
                  {t('delete')}
                </MenuItem>
              </Menu>
            </>
          )}
        </Box>
        
        {editMode ? (
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                onClick={handleCancelEdit}
                startIcon={<Close />}
              >
                {t('cancel')}
              </Button>
              <Button 
                variant="contained" 
                size="small" 
                onClick={handleSaveEdit}
                startIcon={<Check />}
                disabled={!editedContent.trim()}
              >
                {t('save')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography variant="body1" paragraph>
            {post.content}
          </Typography>
        )}
        
        {post.routeId && post.routePreview && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {post.routePreview.name}
            </Typography>
            
            <Box sx={{ height: 200, mb: 1, borderRadius: 1, overflow: 'hidden' }}>
              <MapContainer
                center={[post.routePreview.centerLat, post.routePreview.centerLng]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
                attributionControl={false}
                dragging={false}
                scrollWheelZoom={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {post.routePreview.points && (
                  <Polyline
                    positions={post.routePreview.points.map(p => [p.lat, p.lng])}
                    color="#3388ff"
                  />
                )}
              </MapContainer>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  {t('distance')}
                </Typography>
                <Typography variant="body2">
                  {post.routePreview.distance} km
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  {t('elevation')}
                </Typography>
                <Typography variant="body2">
                  {post.routePreview.elevationGain} m
                </Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="caption" color="text.secondary">
                  {t('difficulty')}
                </Typography>
                <Typography variant="body2">
                  {post.routePreview.difficulty}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {post.images && post.images.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={1}>
              {post.images.map((image, index) => (
                <Grid item xs={12} sm={post.images.length > 1 ? 6 : 12} key={index}>
                  <Box
                    component="img"
                    src={image.url}
                    alt={`Post image ${index + 1}`}
                    sx={{
                      width: '100%',
                      borderRadius: 1,
                      maxHeight: 400,
                      objectFit: 'cover'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {post.likes?.length || 0} {t('likes')} • {post.comments?.length || 0} {t('comments')}
            </Typography>
          </Box>
          
          <Box>
            {post.tags && post.tags.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                sx={{ mr: 0.5 }}
              />
            ))}
          </Box>
        </Box>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button
          startIcon={hasLiked ? <Favorite color="error" /> : <FavoriteBorder />}
          onClick={() => onLike(post.id)}
        >
          {t('like')}
        </Button>
        
        <Button
          startIcon={<Message />}
          onClick={() => setShowComments(!showComments)}
        >
          {t('comment')}
        </Button>
        
        <Button
          startIcon={<Share />}
          onClick={() => onShare(post)}
        >
          {t('share')}
        </Button>
      </CardActions>
      
      {showComments && (
        <Box sx={{ p: 2, bgcolor: 'action.hover' }}>
          {post.comments && post.comments.length > 0 ? (
            <List>
              {post.comments.map((comment, index) => (
                <ListItem key={index} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={comment.userAvatar} alt={comment.userName} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="subtitle2">
                          {comment.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale })}
                        </Typography>
                      </Box>
                    }
                    secondary={comment.content}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('noComments')}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', mt: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder={t('writeComment')}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small">
                      <EmojiEmotions fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <IconButton 
              color="primary" 
              onClick={handleSubmitComment}
              disabled={!newComment.trim()}
            >
              <Send />
            </IconButton>
          </Box>
        </Box>
      )}
    </Card>
  );
};

/**
 * Composant pour afficher un ami ou une suggestion d'ami
 */
const FriendItem = ({ user, isFriend, isPending, onAddFriend, onAcceptFriend, onRejectFriend, onRemoveFriend, onMessage }) => {
  const { t } = useTranslation();
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar src={user.avatar} alt={user.name} />
      </ListItemAvatar>
      <ListItemText
        primary={user.name}
        secondary={
          <Box component="span">
            {user.mutualFriends > 0 && (
              <Typography variant="caption" display="block">
                {user.mutualFriends} {t('mutualFriends')}
              </Typography>
            )}
            {user.lastActivity && (
              <Typography variant="caption" display="block">
                {t('lastActive')}: {formatDistanceToNow(new Date(user.lastActivity), { addSuffix: true })}
              </Typography>
            )}
          </Box>
        }
      />
      <ListItemSecondaryAction>
        {isFriend ? (
          <>
            <IconButton onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => {
                onMessage(user.id);
                handleMenuClose();
              }}>
                <Message fontSize="small" sx={{ mr: 1 }} />
                {t('message')}
              </MenuItem>
              <MenuItem onClick={() => {
                onRemoveFriend(user.id);
                handleMenuClose();
              }}>
                <PersonAddDisabled fontSize="small" sx={{ mr: 1 }} />
                {t('unfriend')}
              </MenuItem>
              <MenuItem onClick={handleMenuClose}>
                <Block fontSize="small" sx={{ mr: 1 }} />
                {t('block')}
              </MenuItem>
            </Menu>
          </>
        ) : isPending ? (
          <Box>
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={() => onAcceptFriend(user.id)}
              sx={{ mr: 1 }}
            >
              {t('accept')}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onRejectFriend(user.id)}
            >
              {t('decline')}
            </Button>
          </Box>
        ) : (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PersonAdd />}
            onClick={() => onAddFriend(user.id)}
          >
            {t('addFriend')}
          </Button>
        )}
      </ListItemSecondaryAction>
    </ListItem>
  );
};

/**
 * Composant principal du hub social
 */
const EnhancedSocialHub = ({ userId }) => {
  const { t, i18n } = useTranslation();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('feed');
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [suggestedFriends, setSuggestedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [postPrivacy, setPostPrivacy] = useState('public');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [userRoutes, setUserRoutes] = useState([]);
  const [showRouteSelector, setShowRouteSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // Charger les données utilisateur et autres données initiales
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Simuler un chargement de données
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Données utilisateur fictives pour le développement
        setCurrentUser({
          id: userId || 'user123',
          name: 'Jean Dupont',
          avatar: '/images/avatars/default-avatar.jpg',
          level: 'intermédiaire',
          location: 'Strasbourg, Grand Est'
        });
        
        // Exemple de posts pour le développement
        setPosts([
          {
            id: 'post1',
            userId: 'user123',
            userName: 'Jean Dupont',
            userAvatar: '/images/avatars/default-avatar.jpg',
            content: 'Belle sortie dans les Vosges aujourd\'hui! 120km avec 1800m de dénivelé.',
            image: '/images/routes/vosges-route.jpg',
            timestamp: new Date('2025-04-01T14:32:00'),
            likes: ['user345', 'user567'],
            comments: [
              {
                userId: 'user345',
                userName: 'Marie Lefebvre',
                content: 'Superbe parcours!',
                timestamp: new Date('2025-04-01T15:10:00')
              }
            ],
            privacy: 'public'
          }
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [userId]);
  
  // Fonctions pour gérer les interactions sociales
  const handleLikePost = (postId) => {
    // Implementation pour aimer un post
    console.log(`Post ${postId} aimé`);
  };
  
  const handleCommentPost = (postId, comment) => {
    // Implementation pour commenter un post
    console.log(`Commentaire sur le post ${postId}: ${comment}`);
  };
  
  const handleSharePost = (postId) => {
    // Implementation pour partager un post
    console.log(`Post ${postId} partagé`);
  };
  
  const handleDeletePost = (postId) => {
    // Implementation pour supprimer un post
    console.log(`Post ${postId} supprimé`);
  };
  
  const handleEditPost = (postId, newContent) => {
    // Implementation pour éditer un post
    console.log(`Post ${postId} modifié: ${newContent}`);
  };
  
  // Contenu à afficher en fonction de l'état de chargement
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box className="enhanced-social-hub">
      <Box className="enhanced-header">
        <Typography variant="h5" fontWeight="bold">
          {t('socialHub')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton>
            <Notifications />
          </IconButton>
          <Avatar 
            src={currentUser?.avatar}
            alt={currentUser?.name}
            sx={{ ml: 2 }}
          />
        </Box>
      </Box>
      
      {/* Contenu principal */}
      <Grid container spacing={3} sx={{ p: 3 }}>
        {/* Fil d'actualité */}
        <Grid item xs={12} md={8}>
          {posts.map(post => (
            <SocialPost
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLike={handleLikePost}
              onComment={handleCommentPost}
              onShare={handleSharePost}
              onDelete={handleDeletePost}
              onEdit={handleEditPost}
            />
          ))}
        </Grid>
        
        {/* Barre latérale */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('suggestions')}
            </Typography>
            <List>
              {suggestedFriends.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {t('noSuggestions')}
                </Typography>
              ) : (
                suggestedFriends.map(friend => (
                  <FriendItem 
                    key={friend.id}
                    user={friend}
                    isFriend={false}
                    isPending={false}
                    onAddFriend={() => console.log(`Ami ajouté: ${friend.id}`)}
                  />
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EnhancedSocialHub;