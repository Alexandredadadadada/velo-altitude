import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Container, Grid, Typography, Card, CardContent, CardMedia, 
  CardActionArea, Box, Breadcrumbs, Link, Paper, Divider, Button,
  List, ListItem, ListItemIcon, ListItemText, Chip, Stack, Avatar
} from '@mui/material';
import { 
  NavigateNext, DirectionsBike, FitnessCenterOutlined, TimelineOutlined,
  TrendingUp, BarChart, SettingsOutlined, Schedule, SportsScore,
  CalendarMonth, EmojiEvents, Whatshot, AltRoute, Timer, Instagram,
  YouTube, Speed, MenuBook, HealthAndSafety, FilterList, Landscape,
  FitnessCenter, Female, MonitorWeight, HighlightAlt, People, LocationOn
} from '@mui/icons-material';
import trainingWorkouts from '../../data/trainingWorkouts';
import trainingProgramsIndex from '../../data/trainingProgramsIndex';
import TrainingProgramsExplorer from './TrainingProgramsExplorer';

/**
 * Hub de navigation principal pour la section Entraînement
 * Présente les différentes ressources disponibles avec des visuels attrayants
 */
const TrainingHub = () => {
  // Comptage des séances disponibles
  const workoutsCount = Object.values(trainingWorkouts).reduce((acc, curr) => acc + curr.length, 0);
  
  // État pour contrôler l'affichage de l'explorateur complet
  const [showFullExplorer, setShowFullExplorer] = React.useState(false);
  
  // Profil utilisateur fictif pour les recommandations (à remplacer par le profil réel)
  const userProfile = {
    level: 'intermediate',
    objectives: ['mountain', 'endurance'],
    availability: 8, // heures par semaine
    preferredIntensity: 'moderate'
  };
  
  // Contenus d'entraînement additionnels
  const featuredCoaches = [
    {
      id: 'coach1',
      name: 'Julien Pinot',
      specialty: 'Préparation pour compétition',
      image: '/images/coaches/julien.jpg',
      instagram: '@julien_pinot',
      youtube: 'JulienPinot'
    },
    {
      id: 'coach2',
      name: 'Marion Rousse',
      specialty: 'Endurance fondamentale',
      image: '/images/coaches/marion.jpg',
      instagram: '@rousse_marion',
      youtube: 'MarionRousse'
    },
    {
      id: 'coach3',
      name: 'Thomas Voeckler',
      specialty: 'Entraînement en côte',
      image: '/images/coaches/thomas.jpg',
      instagram: '@thomas_voeckler',
      youtube: 'ThomasVoeckler'
    }
  ];
  
  // Ressources d'entraînement avancées
  const trainingResources = [
    {
      id: 'periodization',
      title: 'Guide de périodisation',
      description: 'Comment structurer votre saison en phases pour optimiser vos performances',
      icon: <TimelineOutlined />,
      link: '/training/resources/periodization'
    },
    {
      id: 'ftp',
      title: 'Test FTP et zones d\'entraînement',
      description: 'Comment déterminer votre FTP et calculer vos zones d\'entraînement optimales',
      icon: <Speed />,
      link: '/training/resources/ftp-testing'
    },
    {
      id: 'intervals',
      title: 'Science des intervalles',
      description: 'Comprendre pourquoi et comment les intervalles améliorent vos performances',
      icon: <AltRoute />,
      link: '/training/resources/intervals-science'
    },
    {
      id: 'recovery',
      title: 'Récupération optimale',
      description: 'Stratégies avancées pour maximiser votre récupération entre les entraînements',
      icon: <HealthAndSafety />,
      link: '/training/resources/recovery'
    },
    {
      id: 'altitude',
      title: 'Entraînement en altitude',
      description: 'Comment planifier et exécuter un stage en altitude efficace',
      icon: <TrendingUp />,
      link: '/training/resources/altitude'
    },
    {
      id: 'race-prep',
      title: 'Préparation spécifique course',
      description: 'Planifier les semaines précédant une compétition importante',
      icon: <EmojiEvents />,
      link: '/training/resources/race-preparation'
    }
  ];
  
  // Types d'entraînements
  const workoutTypes = [
    { id: 'power', name: 'Puissance', description: 'Développer votre puissance explosive et votre capacité anaérobie', icon: <Whatshot color="error" /> },
    { id: 'endurance', name: 'Endurance', description: 'Construire votre endurance fondamentale et votre efficacité aérobie', icon: <DirectionsBike color="success" /> },
    { id: 'threshold', name: 'Seuil', description: 'Augmenter votre puissance au seuil lactique', icon: <BarChart color="primary" /> },
    { id: 'vo2max', name: 'VO2max', description: 'Développer votre capacité cardiovasculaire maximale', icon: <TrendingUp color="secondary" /> },
    { id: 'recovery', name: 'Récupération', description: 'Optimiser votre récupération entre les séances intenses', icon: <HealthAndSafety color="info" /> }
  ];

  return (
    <Container maxWidth="lg">
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 4 }}>
        <Link component={RouterLink} to="/" color="inherit">
          Accueil
        </Link>
        <Typography color="text.primary">Entraînement</Typography>
      </Breadcrumbs>

      {/* Section Header */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Centre d'Entraînement
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Programmes, séances et ressources pour améliorer vos performances cyclistes
        </Typography>
        
        {!showFullExplorer && (
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<FilterList />}
              onClick={() => setShowFullExplorer(true)}
            >
              Explorer tous les programmes
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<FitnessCenterOutlined />}
              component={RouterLink}
              to="/training/workouts"
            >
              Bibliothèque de séances
            </Button>
          </Stack>
        )}
      </Box>

      {/* Explorateur de programmes */}
      {showFullExplorer ? (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={<NavigateNext />} 
              onClick={() => setShowFullExplorer(false)}
            >
              Retour au hub d'entraînement
            </Button>
          </Box>
          <TrainingProgramsExplorer userProfile={userProfile} />
        </>
      ) : (
        <>
          {/* Cartes de navigation principales */}
          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* Programmes d'entraînement */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardActionArea component={RouterLink} to="/training/programs" sx={{ flexGrow: 1 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image="/images/training/programs-header.jpg"
                    alt="Programmes d'entraînement cyclistes"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Programmes d'Entraînement
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Des programmes d'entraînement structurés sur plusieurs semaines pour atteindre 
                      des objectifs spécifiques comme la préparation aux cols, l'endurance longue distance ou la compétition.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="primary">
                          {Object.keys(trainingProgramsIndex).length} programmes spécialisés
                        </Typography>
                      </Box>
                      <Chip 
                        icon={<Schedule />} 
                        label="8 à 16 semaines" 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* Séances d'entraînement */}
            <Grid item xs={12} md={6}>
              <Card 
                elevation={3} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardActionArea component={RouterLink} to="/training/workouts" sx={{ flexGrow: 1 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image="/images/training/workouts-header.jpg"
                    alt="Séances d'entraînement"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom>
                      Bibliothèque de Séances
                    </Typography>
                    <Typography variant="body1" color="text.secondary" paragraph>
                      Découvrez notre collection complète de séances d'entraînement détaillées, 
                      adaptables selon votre niveau et vos objectifs spécifiques.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" color="primary">
                          {workoutsCount} séances disponibles
                        </Typography>
                      </Box>
                      <Chip 
                        icon={<Timer />} 
                        label="30 à 180 minutes" 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>

          {/* Types d'entraînements disponibles */}
          <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Types d'entraînements disponibles
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {workoutTypes.map(type => (
                <Grid item xs={12} sm={6} md={4} key={type.id}>
                  <Card variant="outlined">
                    <CardActionArea component={RouterLink} to={`/training/workouts/${type.id}`}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ mr: 1 }}>
                            {type.icon}
                          </Box>
                          <Typography variant="h6" component="h3">
                            {type.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Lien avec la section Cols pour valoriser la fonctionnalité "7 Majeurs" */}
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 6, 
              backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.4)), url(/images/cols/alps-banner.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 2,
              color: 'white'
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Préparez-vous pour le défi des 7 Majeurs
                </Typography>
                <Typography variant="body1" paragraph>
                  Vous rêvez de conquérir les cols mythiques d'Europe ? Notre outil "Les 7 Majeurs" 
                  vous permet de créer votre propre défi personnalisé et nos programmes d'entraînement 
                  spécifiques vous aideront à vous y préparer.
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  component={RouterLink}
                  to="/mountain/seven-majors"
                >
                  Créer mon défi des 7 Majeurs
                </Button>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(5px)'
                  }}
                >
                  <Typography variant="h2" sx={{ fontWeight: 'bold' }}>7</Typography>
                  <Typography variant="h6">MAJEURS</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* Ressources d'entraînement */}
          <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Ressources d'entraînement avancées
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              {trainingResources.map(resource => (
                <Grid item xs={12} sm={6} md={4} key={resource.id}>
                  <Card variant="outlined">
                    <CardActionArea component={RouterLink} to={resource.link}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ mr: 1, color: 'primary.main' }}>
                            {resource.icon}
                          </Box>
                          <Typography variant="h6" component="h3">
                            {resource.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {resource.description}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Coachs et préparateurs */}
          <Paper elevation={0} variant="outlined" sx={{ p: 3, mb: 6 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Nos coachs et préparateurs
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {featuredCoaches.map(coach => (
                <Grid item xs={12} sm={6} md={4} key={coach.id}>
                  <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <CardActionArea component={RouterLink} to={`/training/coaches/${coach.id}`}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={coach.image}
                        alt={coach.name}
                        sx={{ objectFit: 'cover' }}
                      />
                      <CardContent>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {coach.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {coach.specialty}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Chip 
                            icon={<Instagram fontSize="small" />} 
                            label={coach.instagram} 
                            size="small" 
                            variant="outlined"
                          />
                          <Chip 
                            icon={<YouTube fontSize="small" />} 
                            label={coach.youtube} 
                            size="small" 
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Services d'entraînement */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 6, 
              backgroundColor: 'primary.dark', 
              color: 'white',
              borderRadius: 2
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h5" component="h2" gutterBottom>
                  Besoin d'un programme sur mesure ?
                </Typography>
                <Typography variant="body1" paragraph>
                  Nos entraîneurs certifiés peuvent élaborer un plan d'entraînement personnalisé 
                  adapté à vos objectifs spécifiques, votre disponibilité et votre physiologie.
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  size="large"
                  component={RouterLink}
                  to="/training/coaching"
                >
                  Découvrir le coaching personnalisé
                </Button>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <MenuBook sx={{ fontSize: 160, opacity: 0.6 }} />
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* FAQ */}
          <Paper elevation={0} variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Questions fréquentes sur l'entraînement
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <List>
              <ListItem>
                <ListItemIcon>
                  <NavigateNext color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Combien de temps faut-il pour préparer un objectif comme un col majeur ?" 
                  secondary="Pour un cycliste régulier, prévoyez au minimum 8 à 12 semaines de préparation spécifique pour aborder sereinement un col majeur. Pour un débutant ou pour enchaîner plusieurs cols, 16 semaines sont recommandées."
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <NavigateNext color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Comment répartir mes séances dans la semaine ?" 
                  secondary="Pour un entraînement équilibré, visez 1-2 séances d'intensité (seuil, VO2max, puissance), 1-2 sorties longues d'endurance, et 1 séance de récupération. Adaptez selon votre disponibilité et votre capacité de récupération."
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <NavigateNext color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Qu'est-ce que le FTP et comment l'améliorer ?" 
                  secondary="Le FTP (Functional Threshold Power) est la puissance maximale que vous pouvez maintenir pendant environ une heure. Pour l'améliorer, intégrez des séances au seuil (2-3 séries de 10-20 minutes à 95-105% du FTP) et des Sweet Spots (88-93% du FTP) plus longs."
                />
              </ListItem>
              <Divider component="li" />
              <ListItem>
                <ListItemIcon>
                  <NavigateNext color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Comment simuler la montagne si j'habite en plaine ?" 
                  secondary="Utilisez des séances de force-endurance à basse cadence (50-60 rpm) sur des côtes disponibles, même courtes. Les séances sur home trainer avec résistance élevée et les entraînements par intervalles peuvent également simuler la demande physiologique des longues ascensions."
                />
              </ListItem>
            </List>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default TrainingHub;
