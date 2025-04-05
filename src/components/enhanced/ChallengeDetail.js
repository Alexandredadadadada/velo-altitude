import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Chip, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Button,
  Card,
  CardMedia,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Rating,
  Avatar,
  Stack
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  DirectionsBike as BikeIcon,
  Terrain as TerrainIcon,
  AccessTime as TimeIcon,
  LocalOffer as TagIcon,
  ExpandMore as ExpandMoreIcon,
  PhotoCamera as CameraIcon,
  History as HistoryIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  SportsScore as FinishIcon,
  Star as StarIcon,
  Map as MapIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant pour afficher les détails d'un défi cycliste
 */
const ChallengeDetail = ({ challenge, colsData, userProgress }) => {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Détermine la couleur correspondant à la difficulté
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Modérée":
        return theme.palette.success.main;
      case "Difficile":
        return theme.palette.warning.main;
      case "Très difficile":
        return theme.palette.error.light;
      case "Extrême":
        return theme.palette.error.dark;
      default:
        return theme.palette.info.main;
    }
  };

  // Vérifie si un col est complété par l'utilisateur
  const isColCompleted = (colId) => {
    if (!userProgress || !userProgress.completedCols) return false;
    return userProgress.completedCols.includes(colId);
  };

  // Différentes vues selon l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Aperçu
        return renderOverviewTab();
      case 1: // Cols
        return renderColsTab();
      case 2: // Récompenses
        return renderRewardsTab();
      case 3: // Leaderboard
        return renderLeaderboardTab();
      default:
        return renderOverviewTab();
    }
  };

  // Vue d'ensemble du défi
  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Description
            </Typography>
            <Typography variant="body1" paragraph>
              {challenge.description}
            </Typography>

            {challenge.tips && challenge.tips.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom>
                  Conseils pour réussir
                </Typography>
                <List>
                  {challenge.tips.map((tip, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <InfoIcon color="primary" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}

            {challenge.requirements && (
              <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Conditions pour valider le défi
                </Typography>
                <List dense>
                  {challenge.requirements.photosRequired && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CameraIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Photos requises au sommet de chaque col" />
                    </ListItem>
                  )}
                  {challenge.requirements.stravaActivities && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <BikeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Activités Strava validées pour chaque col" />
                    </ListItem>
                  )}
                  {challenge.requirements.timeLimit && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TimeIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={`Limite de temps: ${challenge.requirements.timeLimit}`} />
                    </ListItem>
                  )}
                  {challenge.requirements.sameDay && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <HistoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Toutes les ascensions doivent être faites le même jour" />
                    </ListItem>
                  )}
                  {challenge.requirements.officialResults && (
                    <ListItem>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TrophyIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Résultats officiels des événements requis" />
                    </ListItem>
                  )}
                </List>
              </Paper>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardMedia
              component="img"
              height="200"
              image={challenge.badgeImage || "/assets/default-challenge.jpg"}
              alt={challenge.name}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TerrainIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Difficulté" 
                    secondary={challenge.difficulty} 
                    secondaryTypographyProps={{
                      style: {
                        color: getDifficultyColor(challenge.difficulty),
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TimeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Temps estimé" 
                    secondary={challenge.estimatedTimeToComplete}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TagIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Catégorie" 
                    secondary={challenge.category}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <BikeIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Nombre de cols" 
                    secondary={challenge.cols?.length || 'N/A'}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TrophyIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Points à gagner" 
                    secondary={challenge.rewards.points}
                    secondaryTypographyProps={{
                      style: {
                        color: theme.palette.primary.main,
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        {challenge.historicalFacts && challenge.historicalFacts.length > 0 && (
          <Grid item xs={12}>
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Anecdotes historiques
              </Typography>
              
              <Grid container spacing={2}>
                {challenge.historicalFacts.map((fact, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                      <Box display="flex" alignItems="flex-start" mb={1}>
                        <HistoryIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">
                          {colsData[fact.col]?.name || 'Col mythique'}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {fact.fact}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        )}
        
        {challenge.stages && challenge.stages.length > 0 && (
          <Grid item xs={12}>
            <Box mt={2}>
              <Typography variant="h6" gutterBottom>
                Étapes suggérées
              </Typography>
              
              <Grid container spacing={2}>
                {challenge.stages.map((stage, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Paper sx={{ p: 2, bgcolor: 'background.default', height: '100%' }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        {stage.name}
                      </Typography>
                      
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Départ: <b>{stage.start}</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Arrivée: <b>{stage.end}</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Distance: <b>{stage.distance} km</b>
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="text.secondary">
                            Dénivelé: <b>{stage.elevation} m</b>
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );

  // Onglet des cols du défi
  const renderColsTab = () => (
    <Box>
      {challenge.cols && challenge.cols.length > 0 ? (
        <Grid container spacing={2}>
          {challenge.cols.map((colId, index) => (
            <Grid item xs={12} sm={6} md={4} key={colId}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  borderColor: isColCompleted(colId) ? theme.palette.success.main : 'inherit',
                  position: 'relative',
                  overflow: 'visible'
                }}
              >
                {isColCompleted(colId) && (
                  <Box 
                    sx={{ 
                      position: 'absolute', 
                      top: -10, 
                      right: -10, 
                      width: 30, 
                      height: 30, 
                      borderRadius: '50%', 
                      bgcolor: theme.palette.success.main, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      zIndex: 1,
                      boxShadow: 1
                    }}
                  >
                    <FinishIcon fontSize="small" />
                  </Box>
                )}
                
                <CardMedia
                  component="img"
                  height="140"
                  image={colsData[colId]?.images?.[0] || "/assets/default-col.jpg"}
                  alt={colsData[colId]?.name || `Col ${index + 1}`}
                />
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {colsData[colId]?.name || `Col ${index + 1}`}
                  </Typography>
                  
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Altitude:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {colsData[colId]?.statistics?.summit_elevation || 'N/A'} m
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Dénivelé:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {colsData[colId]?.statistics?.elevation_gain || 'N/A'} m
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Distance:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {colsData[colId]?.statistics?.length || 'N/A'} km
                      </Typography>
                    </Grid>
                    
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Pente moy:
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {colsData[colId]?.statistics?.avg_gradient || 'N/A'}%
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box mt={2} display="flex" justifyContent="space-between">
                    <Chip 
                      size="small" 
                      label={`Difficulté: ${colsData[colId]?.difficulty || '?'}/5`} 
                      color="primary" 
                      variant="outlined" 
                    />
                    
                    <Button 
                      size="small" 
                      variant="text" 
                      component="a" 
                      href={`/cols/${colId}`}
                    >
                      Détails
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Aucune information sur les cols de ce défi.
        </Typography>
      )}
    </Box>
  );

  // Onglet des récompenses
  const renderRewardsTab = () => (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrophyIcon fontSize="large" color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">
                  Récompenses du défi
                </Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <StarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={`${challenge.rewards.points} points`} 
                    secondary="Pour votre classement global" 
                  />
                </ListItem>
                
                {challenge.rewards.badge && (
                  <ListItem>
                    <ListItemIcon>
                      <EmojiEvents color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Badge: ${challenge.rewards.badge}`} 
                      secondary="Badge exclusif sur votre profil" 
                    />
                  </ListItem>
                )}
                
                {challenge.rewards.certificate && (
                  <ListItem>
                    <ListItemIcon>
                      <InfoIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Certificat d'accomplissement" 
                      secondary="Téléchargeable et imprimable" 
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card 
            variant="outlined" 
            sx={{ 
              bgcolor: 'background.default',
              height: '100%'
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Niveaux de progression
              </Typography>
              
              <Box mt={2}>
                <Grid container spacing={1}>
                  {challenge.cols && [25, 50, 75, 100].map((percent) => {
                    const colsRequired = Math.ceil(challenge.cols.length * (percent / 100));
                    return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/challengedetail"
        }
      </script>
      <EnhancedMetaTags
        title="Défis Cyclistes | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
                      <Grid item xs={6} key={percent}>
                        <Paper 
                          elevation={0} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider'
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            color="primary" 
                            fontWeight="bold"
                          >
                            {percent}%
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            {colsRequired} col{colsRequired > 1 ? 's' : ''}
                          </Typography>
                          
                          <Typography variant="body2" fontWeight="medium" mt={1}>
                            {percent === 25 ? `${Math.floor(challenge.rewards.points * 0.25)} pts` : 
                             percent === 50 ? `${Math.floor(challenge.rewards.points * 0.5)} pts` :
                             percent === 75 ? `${Math.floor(challenge.rewards.points * 0.75)} pts` :
                             `${challenge.rewards.points} pts`}
                          </Typography>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
                
                <Box mt={3} p={2} bgcolor="primary.main" color="white" borderRadius={1}>
                  <Typography variant="subtitle2" align="center">
                    Terminez tous les cols pour débloquer toutes les récompenses!
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  // Onglet du classement
  const renderLeaderboardTab = () => (
    <Box>
      {challenge.leaderboard ? (
        <>
          <Typography variant="subtitle1" paragraph>
            Classement des cyclistes qui ont complété ce défi:
          </Typography>
          
          <Paper variant="outlined">
            <List>
              {/* Données fictives pour la démo */}
              {[
                { id: 1, name: 'Thomas P.', completedDate: '2024-03-15', time: '15j 2h', avatar: '/assets/avatars/user1.jpg' },
                { id: 2, name: 'Sophie M.', completedDate: '2024-02-28', time: '20j 14h', avatar: '/assets/avatars/user2.jpg' },
                { id: 3, name: 'Lucas G.', completedDate: '2023-09-05', time: '32j 6h', avatar: '/assets/avatars/user3.jpg' },
                { id: 4, name: 'Emma L.', completedDate: '2023-08-22', time: '45j 10h', avatar: '/assets/avatars/user4.jpg' },
                { id: 5, name: 'Julien T.', completedDate: '2023-07-01', time: '60j 8h', avatar: '/assets/avatars/user5.jpg' }
              ].map((user, index) => (
                <ListItem key={user.id} divider={index < 4}>
                  <Box mr={2} display="flex" alignItems="center" justifyContent="center" width={30}>
                    <Typography 
                      variant="body1" 
                      fontWeight="bold"
                      color={index === 0 ? 'warning.dark' : index === 1 ? 'text.secondary' : index === 2 ? 'warning.main' : 'text.primary'}
                    >
                      {index + 1}
                    </Typography>
                  </Box>
                  
                  <Avatar src={user.avatar} sx={{ mr: 2 }} />
                  
                  <ListItemText 
                    primary={user.name} 
                    secondary={`Complété le ${new Date(user.completedDate).toLocaleDateString('fr-FR')}`} 
                  />
                  
                  <Box>
                    <Chip 
                      label={user.time} 
                      variant="outlined" 
                      size="small" 
                      icon={<TimeIcon fontSize="small" />} 
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
          
          <Box mt={3}>
            <Typography variant="body2" color="text.secondary">
              Le classement est basé sur le temps total pour compléter le défi. Seuls les utilisateurs ayant terminé 100% du défi apparaissent dans ce classement.
            </Typography>
          </Box>
        </>
      ) : (
        <Typography variant="body1" color="text.secondary">
          Le classement n'est pas disponible pour ce défi.
        </Typography>
      )}
    </Box>
  );

  return (
    <Box>
      <Box mb={3}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<InfoIcon />} label="Aperçu" />
          <Tab icon={<TerrainIcon />} label="Cols" />
          <Tab icon={<TrophyIcon />} label="Récompenses" />
          {challenge.leaderboard && <Tab icon={<PeopleIcon />} label="Classement" />}
        </Tabs>
      </Box>
      
      {renderTabContent()}
    </Box>
  );
};

export default ChallengeDetail;
