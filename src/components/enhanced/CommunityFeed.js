import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardActions, Typography, Box, 
  Avatar, Button, IconButton, TextField, Grid, 
  Chip, Divider, CircularProgress, Menu, MenuItem,
  Snackbar, Alert, List, ListItem, ListItemText,
  ListItemAvatar, Collapse, Tabs, Tab
} from '@mui/material';
import { 
  Favorite, FavoriteBorder, Comment, Share, 
  MoreVert, Send, FilterList
} from '@mui/icons-material';
import SocialService from '../../services/socialService';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

/**
 * CommunityFeed component for displaying social activities and posts
 * @param {Object} props - Component properties
 * @param {string} props.userId - Current user ID
 */
const CommunityFeed = ({ userId }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [expandedPost, setExpandedPost] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [postMenuId, setPostMenuId] = useState(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [alertInfo, setAlertInfo] = useState({ open: false, message: '', severity: 'info' });
  
  // Fetch posts on component mount and when filter changes
  useEffect(() => {
    fetchPosts();
  }, [activeFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérification que le service est disponible
      if (!SocialService || !SocialService.getFeedPosts) {
        throw new Error('Service social non disponible');
      }
      
      const fetchedPosts = await SocialService.getFeedPosts({ filter: activeFilter });
      
      // Validation des données reçues
      if (!fetchedPosts || !Array.isArray(fetchedPosts)) {
        throw new Error('Format de données invalide reçu du serveur');
      }
      
      // Nettoyage et validation des données des posts
      const validatedPosts = fetchedPosts.filter(post => post && post.id)
        .map(post => ({
          ...post,
          // S'assurer que les commentaires sont toujours un tableau
          comments: Array.isArray(post.comments) ? post.comments : [],
          // Assurer que commentCount correspond au nombre de commentaires si disponible
          commentCount: post.commentCount || (Array.isArray(post.comments) ? post.comments.length : 0),
          // Assurer que likes est toujours un nombre
          likes: typeof post.likes === 'number' ? post.likes : 0
        }));
      
      setPosts(validatedPosts);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Erreur lors du chargement des posts. Veuillez réessayer.');
      setPosts([]);  // Réinitialiser les posts en cas d'erreur
      setLoading(false);
      
      setAlertInfo({
        open: true,
        message: `Erreur: ${err.message || 'Impossible de charger les publications'}`,
        severity: 'error'
      });
    }
  };
  
  // Toggle post like
  const handleToggleLike = async (postId) => {
    if (!postId) {
      console.error('Post ID manquant');
      return;
    }
    
    try {
      // Find the post
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex === -1) {
        console.error(`Post avec ID ${postId} non trouvé`);
        return;
      }
      
      const currentPost = posts[postIndex];
      const newLikedStatus = !currentPost.userLiked;
      
      // Vérifier le nombre de likes et éviter les valeurs négatives
      const currentLikes = typeof currentPost.likes === 'number' ? currentPost.likes : 0;
      const newLikes = Math.max(0, currentLikes + (newLikedStatus ? 1 : -1));
      
      // Optimistic update
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...currentPost,
        userLiked: newLikedStatus,
        likes: newLikes,
        likeLoading: true
      };
      setPosts(updatedPosts);
      
      // API call
      const response = await SocialService.toggleLike(postId, newLikedStatus);
      
      // Vérifier la réponse de l'API
      if (!response || typeof response.success !== 'boolean') {
        throw new Error('Réponse invalide du serveur');
      }
      
      if (!response.success) {
        throw new Error(response.message || 'Échec de la mise à jour du like');
      }
      
      // Mise à jour finale avec les données confirmées
      const finalPosts = [...posts];
      const finalPostIndex = finalPosts.findIndex(post => post.id === postId);
      
      if (finalPostIndex !== -1) {
        finalPosts[finalPostIndex] = {
          ...finalPosts[finalPostIndex],
          userLiked: newLikedStatus,
          likes: response.likesCount || newLikes,
          likeLoading: false
        };
        
        setPosts(finalPosts);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setAlertInfo({
        open: true,
        message: 'Erreur lors de la mise à jour du like. Veuillez réessayer.',
        severity: 'error'
      });
      
      // Revert to original state on error
      const originalPostIndex = posts.findIndex(post => post.id === postId);
      if (originalPostIndex !== -1) {
        const originalPost = posts[originalPostIndex];
        const revertedPosts = [...posts];
        
        // Calculate correct like count
        const originalLikes = typeof originalPost.likes === 'number' ? originalPost.likes : 0;
        const newLikeCount = Math.max(0, originalLikes + (originalPost.userLiked ? -1 : 1));
        
        revertedPosts[originalPostIndex] = {
          ...originalPost,
          userLiked: !originalPost.userLiked,
          likes: newLikeCount,
          likeLoading: false
        };
        
        setPosts(revertedPosts);
      }
    }
  };
  
  // Load comments for a post
  const handleExpandComments = async (postId) => {
    if (!postId) {
      console.error('Post ID manquant');
      return;
    }
    
    // Toggle collapse if already expanded
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    
    try {
      // Find the post
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex === -1) {
        console.error(`Post avec ID ${postId} non trouvé`);
        return;
      }
      
      const currentPost = posts[postIndex];
      
      // If comments already loaded, just expand
      if (currentPost.comments && Array.isArray(currentPost.comments) && currentPost.comments.length > 0) {
        setExpandedPost(postId);
        return;
      }
      
      // Mettre à jour UI pour montrer le chargement des commentaires
      const updatedPosts = [...posts];
      updatedPosts[postIndex] = {
        ...currentPost,
        loadingComments: true
      };
      setPosts(updatedPosts);
      
      // Load comments from API
      const comments = await SocialService.getComments(postId);
      
      // Vérifier que les commentaires récupérés sont valides
      if (!comments || !Array.isArray(comments)) {
        throw new Error('Format de commentaires invalide reçu du serveur');
      }
      
      // Update post with comments
      const finalPosts = [...posts];
      const finalPostIndex = finalPosts.findIndex(post => post.id === postId);
      
      if (finalPostIndex !== -1) {
        finalPosts[finalPostIndex] = {
          ...finalPosts[finalPostIndex],
          comments: comments,
          commentCount: comments.length,
          loadingComments: false
        };
        
        setPosts(finalPosts);
      }
      
      // Expand comments section
      setExpandedPost(postId);
    } catch (err) {
      console.error('Error loading comments:', err);
      setAlertInfo({
        open: true,
        message: 'Erreur lors du chargement des commentaires. Veuillez réessayer.',
        severity: 'error'
      });
      
      // Mettre à jour le post pour indiquer que le chargement des commentaires a échoué
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
          ...updatedPosts[postIndex],
          loadingComments: false,
          commentError: true
        };
        setPosts(updatedPosts);
      }
    }
  };
  
  // Add a comment to a post
  const handleAddComment = async (postId) => {
    if (!postId || !newComment[postId] || newComment[postId].trim() === '') return;
    
    try {
      // Prepare the comment data
      const commentData = {
        content: newComment[postId].trim(),
        postId: postId,
        user: {
          id: userId,
          name: 'Jean Dupont', // Idéalement, récupéré du contexte utilisateur
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg' // Placeholder
        },
        timestamp: new Date().toISOString()
      };
      
      // Add comment optimistically
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex === -1) {
        console.error(`Post with ID ${postId} not found`);
        return;
      }
      
      const tempCommentId = `temp-${Date.now()}`;
      const optimisticComment = {
        ...commentData,
        id: tempCommentId // Temporary ID that will be replaced by server-generated ID
      };
      
      const updatedPosts = [...posts];
      const currentPost = updatedPosts[postIndex];
      
      updatedPosts[postIndex] = {
        ...currentPost,
        comments: [...(currentPost.comments || []), optimisticComment],
        commentCount: (currentPost.commentCount || 0) + 1
      };
      
      setPosts(updatedPosts);
      
      // Clear the input
      setNewComment({ ...newComment, [postId]: '' });
      
      // API call
      const createdComment = await SocialService.addComment(postId, commentData.content);
      
      if (!createdComment) {
        throw new Error('Aucune donnée de commentaire reçue du serveur');
      }
      
      // Update with real server data
      const finalPosts = [...posts];
      const finalPostIndex = finalPosts.findIndex(post => post.id === postId);
      
      if (finalPostIndex !== -1) {
        const finalPost = finalPosts[finalPostIndex];
        const comments = Array.isArray(finalPost.comments) 
          ? finalPost.comments.map(comment => 
              comment.id === tempCommentId ? createdComment : comment
            )
          : [createdComment];
        
        finalPosts[finalPostIndex] = {
          ...finalPost,
          comments: comments,
          commentCount: comments.length
        };
        
        setPosts(finalPosts);
      }
    } catch (err) {
      console.error('Error adding comment:', err);
      setAlertInfo({
        open: true,
        message: 'Erreur lors de l\'ajout du commentaire. Veuillez réessayer.',
        severity: 'error'
      });
      
      // Remove the optimistic comment in case of error
      const postIndex = posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        const post = posts[postIndex];
        const filteredComments = Array.isArray(post.comments) 
          ? post.comments.filter(comment => !comment.id.startsWith('temp-'))
          : [];
        
        const updatedPosts = [...posts];
        updatedPosts[postIndex] = {
          ...post,
          comments: filteredComments,
          commentCount: filteredComments.length
        };
        
        setPosts(updatedPosts);
      }
    }
  };
  
  // Create a new post
  const handleCreatePost = async () => {
    if (!newPostContent || newPostContent.trim() === '') return;
    
    try {
      setIsCreatingPost(true);
      
      // Prepare the post data
      const postData = {
        content: newPostContent.trim(),
        type: 'text',
        timestamp: new Date().toISOString(),
        user: {
          id: userId,
          name: 'Jean Dupont',  // À remplacer par les données réelles de l'utilisateur
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
        }
      };
      
      // API call
      const createdPost = await SocialService.createPost(postData);
      
      if (!createdPost || !createdPost.id) {
        throw new Error('Données de post invalides reçues du serveur');
      }
      
      // Add the new post to the feed
      setPosts(prevPosts => [createdPost, ...prevPosts]);
      
      // Clear the input and reset state
      setNewPostContent('');
      setIsCreatingPost(false);
      
      setAlertInfo({
        open: true,
        message: 'Post créé avec succès !',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error creating post:', err);
      setAlertInfo({
        open: true,
        message: 'Erreur lors de la création du post. Veuillez réessayer.',
        severity: 'error'
      });
      setIsCreatingPost(false);
    }
  };
  
  // Handle post menu open
  const handlePostMenuOpen = (event, postId) => {
    setAnchorEl(event.currentTarget);
    setPostMenuId(postId);
  };
  
  // Handle post menu close
  const handlePostMenuClose = () => {
    setAnchorEl(null);
    setPostMenuId(null);
  };
  
  // Close alert
  const handleCloseAlert = () => {
    setAlertInfo({ ...alertInfo, open: false });
  };
  
  // Format date for display
  const formatPostDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Filter options
  const filterOptions = [
    { id: 'all', label: 'Tous' },
    { id: 'ride', label: 'Sorties' },
    { id: 'event', label: 'Événements' },
    { id: 'route', label: 'Itinéraires' },
    { id: 'photo', label: 'Photos' }
  ];
  
  if (loading && posts.length === 0) {
    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/communityfeed"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Chargement des publications...
        </Typography>
      </Box>
    );
  }
  
  if (error && posts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px" flexDirection="column">
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
        >
          Réessayer
        </Button>
      </Box>
    );
  }
  
  return (
    <div className="community-feed">
      {/* Filters */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeFilter} 
          onChange={(e, newValue) => setActiveFilter(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {filterOptions.map(option => (
            <Tab 
              key={option.id} 
              label={option.label} 
              value={option.id} 
              id={`filter-tab-${option.id}`}
            />
          ))}
        </Tabs>
      </Box>
      
      {/* New Post Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" mb={2}>
            <Avatar 
              src="https://randomuser.me/api/portraits/men/32.jpg" 
              alt="Jean Dupont"
              sx={{ mr: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Partagez votre expérience cycliste..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              variant="outlined"
            />
          </Box>
          <Box display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              startIcon={<Send />}
              onClick={handleCreatePost}
              disabled={!newPostContent.trim() || isCreatingPost}
            >
              {isCreatingPost ? 'Publication en cours...' : 'Publier'}
            </Button>
          </Box>
        </CardContent>
      </Card>
      
      {/* Posts List */}
      {posts.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" gutterBottom>
            Aucune publication à afficher
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {activeFilter === 'all' 
              ? 'Soyez le premier à partager votre expérience !'
              : 'Aucune publication ne correspond à ce filtre.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {posts.map(post => (
            <Grid item xs={12} key={post.id}>
              <Card>
                <CardContent>
                  {/* Post Header */}
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Avatar 
                        src={post.user.avatar} 
                        alt={post.user.name}
                        sx={{ mr: 2 }}
                      />
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {post.user.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatPostDate(post.timestamp)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      aria-label="more options"
                      onClick={(e) => handlePostMenuOpen(e, post.id)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>
                  
                  {/* Post Type */}
                  {post.type && (
                    <Box mb={1}>
                      <Chip 
                        label={filterOptions.find(opt => opt.id === post.type)?.label || post.type}
                        size="small"
                        color={
                          post.type === 'event' ? 'secondary' :
                          post.type === 'ride' ? 'primary' :
                          post.type === 'route' ? 'success' :
                          'default'
                        }
                        variant="outlined"
                      />
                    </Box>
                  )}
                  
                  {/* Post Content */}
                  <Typography variant="body1" paragraph>
                    {post.content}
                  </Typography>
                  
                  {/* Route Info */}
                  {post.type === 'route' && post.route && (
                    <Box
                      mb={2}
                      p={1.5}
                      bgcolor="#f5f5f5"
                      borderRadius={1}
                      border="1px solid #e0e0e0"
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {post.route.name}
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Typography variant="body2">
                          {post.route.distance} km
                        </Typography>
                        <Typography variant="body2">
                          Difficulté: {post.route.difficulty}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Activity Info */}
                  {post.type === 'ride' && post.activity && (
                    <Box
                      mb={2}
                      p={1.5}
                      bgcolor="#f5f5f5"
                      borderRadius={1}
                      border="1px solid #e0e0e0"
                    >
                      <Typography variant="subtitle2" gutterBottom>
                        {post.activity.title}
                      </Typography>
                      <Box display="flex" gap={2}>
                        <Typography variant="body2">
                          {post.activity.distance} km
                        </Typography>
                        <Typography variant="body2">
                          {post.activity.duration}
                        </Typography>
                        <Typography variant="body2">
                          {post.activity.elevationGain} m D+
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  
                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <Box mb={2} sx={{ borderRadius: 1, overflow: 'hidden' }}>
                      <img 
                        src={post.images[0]} 
                        alt="Post"
                        style={{ 
                          width: '100%', 
                          maxHeight: '400px',
                          objectFit: 'cover'
                        }} 
                      />
                    </Box>
                  )}
                  
                  {/* Likes & Comments Count */}
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="textSecondary">
                      {post.likes} {post.likes === 1 ? 'J\'aime' : 'J\'aimes'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="textSecondary"
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleExpandComments(post.id)}
                    >
                      {post.comments ? post.comments.length : 0} commentaires
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 1 }} />
                  
                  {/* Action Buttons */}
                  <CardActions sx={{ px: 0 }}>
                    <Button 
                      startIcon={post.userLiked ? <Favorite color="error" /> : <FavoriteBorder />}
                      onClick={() => handleToggleLike(post.id)}
                    >
                      J'aime
                    </Button>
                    <Button 
                      startIcon={<Comment />}
                      onClick={() => handleExpandComments(post.id)}
                    >
                      Commenter
                    </Button>
                    <Button startIcon={<Share />}>
                      Partager
                    </Button>
                  </CardActions>
                  
                  {/* Comments */}
                  <Collapse in={expandedPost === post.id} timeout="auto" unmountOnExit>
                    <Box mt={2}>
                      <Divider />
                      <List sx={{ width: '100%', pt: 0 }}>
                        {post.comments && post.comments.map((comment) => (
                          <ListItem 
                            alignItems="flex-start" 
                            key={comment.id}
                            sx={{ px: 0 }}
                          >
                            <ListItemAvatar>
                              <Avatar src={comment.user.avatar} alt={comment.user.name} />
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between">
                                  <Typography variant="subtitle2">
                                    {comment.user.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {formatPostDate(comment.timestamp)}
                                  </Typography>
                                </Box>
                              }
                              secondary={comment.content}
                            />
                          </ListItem>
                        ))}
                      </List>
                      
                      {/* New Comment Form */}
                      <Box display="flex" alignItems="flex-start" mt={2}>
                        <Avatar 
                          src="https://randomuser.me/api/portraits/men/32.jpg" 
                          alt="Jean Dupont"
                          sx={{ mr: 2 }}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="Ajoutez un commentaire..."
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment({ ...newComment, [post.id]: e.target.value })}
                          variant="outlined"
                          InputProps={{
                            endAdornment: (
                              <IconButton 
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment[post.id] || newComment[post.id].trim() === ''}
                              >
                                <Send />
                              </IconButton>
                            )
                          }}
                        />
                      </Box>
                    </Box>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Post Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handlePostMenuClose}
      >
        <MenuItem onClick={handlePostMenuClose}>
          Signaler
        </MenuItem>
        {posts.find(post => post.id === postMenuId)?.user.id === userId && (
          <>
            <MenuItem onClick={handlePostMenuClose}>
              Modifier
            </MenuItem>
            <MenuItem onClick={handlePostMenuClose}>
              Supprimer
            </MenuItem>
          </>
        )}
      </Menu>
      
      {/* Alert Snackbar */}
      <Snackbar
        open={alertInfo.open}
        autoHideDuration={5000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alertInfo.severity}>
          {alertInfo.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CommunityFeed;
