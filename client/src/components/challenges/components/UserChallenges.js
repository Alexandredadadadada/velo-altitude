import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Public as GlobeIcon,
  Visibility as VisibilityIcon,
  Share as ShareIcon
} from '@mui/icons-material';

/**
 * Composant pour afficher et gérer les défis sauvegardés par l'utilisateur
 */
const UserChallenges = ({ 
  challenges, 
  loading, 
  onLoadChallenge,
  onDeleteChallenge,
  onLikeChallenge,
  onViewColDetails,
  onShareChallenge,
  userLikes
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  
  // Filtrer les défis en fonction de la recherche
  const filteredChallenges = challenges.filter(challenge => 
    challenge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    challenge.createdBy.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Gérer la suppression d'un défi
  const handleDeleteClick = (challenge) => {
    setChallengeToDelete(challenge);
    setShowConfirmDelete(true);
  };
  
  const confirmDelete = () => {
    if (challengeToDelete) {
      onDeleteChallenge(challengeToDelete.id);
      setChallengeToDelete(null);
      setShowConfirmDelete(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!challenges || challenges.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        {t('challenges.seven_majors.no_saved_challenges')}
      </Alert>
    );
  }
  
  return (
    <Box>
      {/* Barre de recherche */}
      <TextField
        fullWidth
        placeholder={t('common.search_challenges')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      
      {filteredChallenges.length === 0 ? (
        <Alert severity="info">
          {t('challenges.seven_majors.no_search_results')}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredChallenges.map(challenge => (
            <Grid item key={challenge.id} xs={12} md={6}>
              <Card elevation={3}>
                <CardMedia
                  component="img"
                  height="140"
                  image={challenge.image || '/images/challenges/placeholder.jpg'}
                  alt={challenge.name}
                  sx={{ objectFit: 'cover' }}
                />
                
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrophyIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h5">
                      {challenge.name}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {t('challenges.seven_majors.created_by')}: {challenge.createdBy.name}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip 
                      icon={<GlobeIcon />} 
                      label={challenge.isPublic ? t('common.public') : t('common.private')} 
                      size="small"
                      color={challenge.isPublic ? "primary" : "default"}
                    />
                    
                    <Chip 
                      label={`${challenge.cols.length} cols`} 
                      size="small"
                    />
                    
                    <Chip 
                      icon={<FavoriteIcon />} 
                      label={challenge.likes || 0} 
                      size="small"
                      color="secondary"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    {t('challenges.seven_majors.included_cols')}:
                  </Typography>
                  
                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {challenge.cols.slice(0, 3).map(col => (
                      <Grid item key={col.id} xs={12}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1,
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <Box>
                            <Typography variant="body2">
                              {col.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {col.region}, {col.country} • {col.altitude}m
                            </Typography>
                          </Box>
                          
                          <Tooltip title={t('common.view_details')}>
                            <IconButton 
                              size="small" 
                              onClick={() => onViewColDetails(col)}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>
                    ))}
                    
                    {challenge.cols.length > 3 && (
                      <Typography variant="body2" sx={{ p: 1, color: 'text.secondary' }}>
                        +{challenge.cols.length - 3} {t('common.more')}...
                      </Typography>
                    )}
                  </Grid>
                </CardContent>
                
                <CardActions sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title={t('common.like')}>
                      <IconButton 
                        color={userLikes[challenge.id] ? "secondary" : "default"}
                        onClick={() => onLikeChallenge(challenge.id)}
                      >
                        {userLikes[challenge.id] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t('common.share')}>
                      <IconButton 
                        color="primary"
                        onClick={() => onShareChallenge(challenge)}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {challenge.createdBy.isSelf && (
                      <Tooltip title={t('common.delete')}>
                        <IconButton 
                          color="error"
                          onClick={() => handleDeleteClick(challenge)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => onLoadChallenge(challenge)}
                  >
                    {t('challenges.seven_majors.load_challenge')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
      >
        <DialogTitle>
          {t('common.confirm_delete')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('challenges.seven_majors.confirm_delete_challenge', { 
              name: challengeToDelete?.name || ''
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDelete(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserChallenges;
