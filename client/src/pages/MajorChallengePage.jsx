import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Avatar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShareIcon from '@mui/icons-material/Share';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import CreateIcon from '@mui/icons-material/Create';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Import des composants
import CustomChallengeCreator from '../components/challenges/CustomChallengeCreator';

// Données fictives pour les défis
const mockChallenges = [
  {
    id: "community-1",
    name: "Les Géants des Alpes",
    description: "Un défi exigeant à travers les cols emblématiques des Alpes françaises",
    createdBy: "Équipe Velo-Altitude",
    official: true,
    likes: 1245,
    completions: 328,
    image: "/images/challenges/alpes.jpg",
    cols: ["col-galibier", "col-iseran", "col-bonette", "col-izoard", "col-madeleine", "col-glandon", "col-croix-fer"],
    totalDistance: 178,
    totalElevation: 12450
  },
  {
    id: "community-2",
    name: "Pyrénées Mythiques",
    description: "Découvrez les cols rendus célèbres par le Tour de France dans les Pyrénées",
    createdBy: "Club des Cyclistes Professionnels",
    official: true,
    likes: 984,
    completions: 216,
    image: "/images/challenges/pyrenees.jpg",
    cols: ["col-tourmalet", "col-aubisque", "col-aspin", "col-peyresourde", "col-portet", "col-soulor", "col-portillon"],
    totalDistance: 152,
    totalElevation: 9850
  },
  {
    id: "user-1",
    name: "Aventure Franco-Italienne",
    description: "Un parcours entre France et Italie avec des montées inoubliables",
    createdBy: "Marco R.",
    official: false,
    likes: 342,
    completions: 67,
    image: "/images/challenges/france-italie.jpg",
    cols: ["col-agnel", "col-vars", "col-lombarde", "col-bonette", "col-sampeyre", "colle-fauniera", "colle-agnello"],
    totalDistance: 165,
    totalElevation: 10200
  },
  {
    id: "user-2",
    name: "Défi Suisse",
    description: "Les plus beaux cols des Alpes suisses",
    createdBy: "Helvetia Team",
    official: false,
    likes: 267,
    completions: 48,
    image: "/images/challenges/suisse.jpg",
    cols: ["furkapass", "grimselpass", "sustenpass", "oberalppass", "klausenpass", "gotthard", "nufenenpass"],
    totalDistance: 142,
    totalElevation: 8650
  }
];

// Données fictives pour les cols
const mockCols = [
  {
    id: "col-galibier",
    name: "Col du Galibier",
    altitude: 2642,
    location: { country: "France", region: "Alpes" },
    length: 23,
    averageGradient: 5.1,
    maxGradient: 10.1,
    difficulty: 4,
    images: { thumbnail: "/images/cols/galibier-thumb.jpg" }
  },
  {
    id: "col-iseran",
    name: "Col de l'Iseran",
    altitude: 2770,
    location: { country: "France", region: "Alpes" },
    length: 13.4,
    averageGradient: 7.3,
    maxGradient: 12.0,
    difficulty: 5,
    images: { thumbnail: "/images/cols/iseran-thumb.jpg" }
  },
  {
    id: "col-bonette",
    name: "Col de la Bonette",
    altitude: 2802,
    location: { country: "France", region: "Alpes" },
    length: 24,
    averageGradient: 6.5,
    maxGradient: 11.0,
    difficulty: 5,
    images: { thumbnail: "/images/cols/bonette-thumb.jpg" }
  },
  {
    id: "col-izoard",
    name: "Col d'Izoard",
    altitude: 2360,
    location: { country: "France", region: "Alpes" },
    length: 19,
    averageGradient: 6.0,
    maxGradient: 10.0,
    difficulty: 4,
    images: { thumbnail: "/images/cols/izoard-thumb.jpg" }
  },
  {
    id: "col-tourmalet",
    name: "Col du Tourmalet",
    altitude: 2115,
    location: { country: "France", region: "Pyrénées" },
    length: 19,
    averageGradient: 7.4,
    maxGradient: 10.0,
    difficulty: 5,
    images: { thumbnail: "/images/cols/tourmalet-thumb.jpg" }
  },
  {
    id: "col-aubisque",
    name: "Col d'Aubisque",
    altitude: 1709,
    location: { country: "France", region: "Pyrénées" },
    length: 16.6,
    averageGradient: 7.2,
    maxGradient: 13.0,
    difficulty: 4,
    images: { thumbnail: "/images/cols/aubisque-thumb.jpg" }
  },
  {
    id: "stelvio-pass",
    name: "Passo dello Stelvio",
    altitude: 2758,
    location: { country: "Italie", region: "Alpes italiennes" },
    length: 24.3,
    averageGradient: 7.4,
    maxGradient: 12.0,
    difficulty: 5,
    images: { thumbnail: "/images/cols/stelvio-thumb.jpg" }
  },
  {
    id: "furkapass",
    name: "Furkapass",
    altitude: 2429,
    location: { country: "Suisse", region: "Alpes suisses" },
    length: 16.5,
    averageGradient: 7.0,
    maxGradient: 10.0,
    difficulty: 4,
    images: { thumbnail: "/images/cols/furka-thumb.jpg" }
  },
  {
    id: "col-madeleine",
    name: "Col de la Madeleine",
    altitude: 2000,
    location: { country: "France", region: "Alpes" },
    length: 19.2,
    averageGradient: 7.9,
    maxGradient: 10.0,
    difficulty: 5,
    images: { thumbnail: "/images/cols/madeleine-thumb.jpg" }
  },
  {
    id: "col-glandon",
    name: "Col du Glandon",
    altitude: 1924,
    location: { country: "France", region: "Alpes" },
    length: 21.3,
    averageGradient: 6.9,
    maxGradient: 11.0,
    difficulty: 4,
    images: { thumbnail: "/images/cols/glandon-thumb.jpg" }
  }
];

// Pour un cas réel, ces données viendraient d'une API

/**
 * Page principale du Défi "7 Majeurs"
 * Présente les défis communautaires, les défis personnels de l'utilisateur
 * et permet de créer de nouveaux défis personnalisés
 */
const MajorChallengePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // État pour les défis et les onglets
  const [activeTab, setActiveTab] = useState('community');
  const [userChallenges, setUserChallenges] = useState(mockChallenges.filter(c => c.id.startsWith('user')));
  const [likedChallenges, setLikedChallenges] = useState({});
  const [scrollY, setScrollY] = useState(0);
  
  // Effect pour gérer le défilement pour l'effet parallaxe
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Si l'URL contient un paramètre tab, initialiser l'onglet actif avec cette valeur
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['community', 'user', 'create'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Gestionnaire de changement d'onglet
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Mettre à jour l'URL sans recharger la page
    navigate(`?tab=${newValue}`, { replace: true });
  };
  
  // Gestionnaire pour aimer/ne plus aimer un défi
  const handleToggleLike = (challengeId) => {
    if (likedChallenges[challengeId]) {
      setLikedChallenges(prevState => ({ ...prevState, [challengeId]: !prevState[challengeId] }));
    } else {
      setLikedChallenges(prevState => ({ ...prevState, [challengeId]: true }));
    }
  };
  
  // Gestionnaire pour sauvegarder un nouveau défi
  const handleSaveChallenge = (challenge) => {
    // Générer un ID unique
    const newChallenge = {
      ...challenge,
      id: `user-${Date.now()}`,
      likes: 0,
      completions: 0,
      createdBy: "Vous",
      official: false
    };
    
    setUserChallenges([...userChallenges, newChallenge]);
    setActiveTab('user'); // Rediriger vers l'onglet des défis utilisateur
  };

  // Animation variants pour les éléments Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  const cardVariants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
    hover: { 
      y: -15, 
      scale: 1.02,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    }
  };
  
  const tabVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* Section Hero avec effet de parallaxe */}
      <Box
        component={motion.div}
        sx={{
          height: { xs: '40vh', md: '50vh' },
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Image de fond avec parallaxe */}
        <Box
          component={motion.div}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/images/challenges/hero-background.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
          style={{
            y: scrollY * 0.5,
            scale: 1 + scrollY * 0.001,
          }}
        />
        
        {/* Superposition de gradient animé */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, 
              rgba(37, 99, 235, 0.8) 0%, 
              rgba(37, 99, 235, 0.4) 25%, 
              rgba(249, 115, 22, 0.4) 75%, 
              rgba(249, 115, 22, 0.8) 100%)`,
            zIndex: 1,
            opacity: 0.85,
          }}
          component={motion.div}
          animate={{
            background: [
              `linear-gradient(135deg, 
                rgba(37, 99, 235, 0.8) 0%, 
                rgba(37, 99, 235, 0.4) 25%, 
                rgba(249, 115, 22, 0.4) 75%, 
                rgba(249, 115, 22, 0.8) 100%)`,
              `linear-gradient(135deg, 
                rgba(249, 115, 22, 0.8) 0%, 
                rgba(249, 115, 22, 0.4) 25%, 
                rgba(37, 99, 235, 0.4) 75%, 
                rgba(37, 99, 235, 0.8) 100%)`,
              `linear-gradient(135deg, 
                rgba(37, 99, 235, 0.8) 0%, 
                rgba(37, 99, 235, 0.4) 25%, 
                rgba(249, 115, 22, 0.4) 75%, 
                rgba(249, 115, 22, 0.8) 100%)`
            ]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: 'mirror'
          }}
        />
        
        {/* Contenu flottant */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            textAlign: 'center',
            maxWidth: '800px',
            px: { xs: 3, md: 0 }
          }}
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Typography
            variant="h2"
            component="h1"
            fontWeight={800}
            sx={{
              color: 'white',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Le Défi "7 Majeurs"
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              textShadow: '0 2px 6px rgba(0,0,0,0.3)',
              mb: 4,
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            Créez et partagez votre sélection des 7 cols les plus emblématiques
            que tout cycliste devrait gravir au moins une fois dans sa vie.
          </Typography>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => setActiveTab('create')}
              sx={{
                borderRadius: '30px',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(90deg, #f97316 0%, #f59e0b 100%)',
                boxShadow: '0 8px 20px rgba(249, 115, 22, 0.4)',
                '&:hover': {
                  boxShadow: '0 8px 25px rgba(249, 115, 22, 0.6)',
                }
              }}
            >
              Créer Mon Défi
            </Button>
          </motion.div>
          
          {/* Indicateur de défilement */}
          <Box
            component={motion.div}
            sx={{
              position: 'absolute',
              bottom: -120,
              left: '50%',
              transform: 'translateX(-50%)',
              display: { xs: 'none', md: 'block' }
            }}
            animate={{
              y: [0, 10, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity
            }}
          >
            <ArrowDownwardIcon
              sx={{
                color: 'white',
                fontSize: '2rem',
                opacity: 0.8
              }}
            />
          </Box>
        </Box>
      </Box>
      
      <Container maxWidth="xl">
        {/* Onglets de navigation */}
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2, 
            mb: 4, 
            background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
            sx={{ 
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '4px 4px 0 0'
              }
            }}
          >
            <Tab 
              value="community" 
              label="Défis Communautaires" 
              icon={<GroupIcon />} 
              iconPosition="start"
            />
            <Tab 
              value="user" 
              label="Mes Défis" 
              icon={<PersonIcon />} 
              iconPosition="start"
            />
            <Tab 
              value="create" 
              label="Créer un Défi" 
              icon={<AddIcon />} 
              iconPosition="start"
            />
          </Tabs>
        </Paper>
        
        {activeTab === 'community' && (
          <motion.div
            key="community-tab"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Box sx={{ mt: 4 }}>
              <Grid container spacing={3}>
                {mockChallenges.filter(c => c.id.startsWith('community')).map((challenge) => (
                  <Grid item xs={12} sm={6} md={4} key={challenge.id}>
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ 
                        scale: 1.03, 
                        rotateY: 5,
                        z: 50,
                        transition: { duration: 0.3 }
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: 3,
                          boxShadow: theme => theme.palette.mode === 'dark' 
                            ? '0 10px 30px -10px rgba(0,0,0,0.3)' 
                            : '0 10px 30px -10px rgba(0,0,0,0.2)',
                          transition: 'all 0.3s ease-in-out',
                          transform: 'perspective(1000px)',
                          '&:hover': {
                            boxShadow: theme => theme.palette.mode === 'dark' 
                              ? '0 20px 40px -10px rgba(0,0,0,0.5)' 
                              : '0 20px 40px -10px rgba(0,0,0,0.25)',
                          }
                        }}
                      >
                        <CardMedia
                          component="div"
                          sx={{
                            height: 180,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)',
                              zIndex: 1
                            }
                          }}
                        >
                          <Box
                            component={motion.div}
                            sx={{
                              backgroundImage: `url(${challenge.image})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              height: '100%',
                              width: '100%',
                            }}
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 1.5 }}
                          />
                          
                          {/* Badge officiel */}
                          {challenge.official && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                zIndex: 2,
                                background: 'linear-gradient(135deg, #2563EB, #60A5FA)',
                                borderRadius: '20px',
                                px: 2,
                                py: 0.5,
                                display: 'flex',
                                alignItems: 'center',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                              }}
                            >
                              <DirectionsBikeIcon sx={{ fontSize: 18, mr: 0.5, color: 'white' }} />
                              <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                Officiel
                              </Typography>
                            </Box>
                          )}
                        </CardMedia>
                        
                        <CardContent
                          sx={{
                            pb: 1,
                            pt: 3,
                            px: 3,
                            position: 'relative',
                          }}
                        >
                          <Typography 
                            variant="h6" 
                            component="h3"
                            fontWeight={600}
                            gutterBottom
                            sx={{ 
                              lineHeight: 1.3,
                              fontSize: { xs: '1.1rem', sm: '1.25rem' },
                              mb: 1
                            }}
                          >
                            {challenge.name}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              mb: 2,
                              minHeight: { xs: 'auto', sm: '3rem' },
                              opacity: 0.8
                            }}
                          >
                            {challenge.description}
                          </Typography>
                          
                          <Box sx={{ mb: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 1,
                                    borderRadius: 2,
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Distance
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {challenge.totalDistance} km
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    p: 1,
                                    borderRadius: 2,
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Dénivelé
                                  </Typography>
                                  <Typography variant="body1" fontWeight={600}>
                                    {challenge.totalElevation} m
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Box>
                          
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              mt: 2
                            }}
                          >
                            <Avatar 
                              sx={{ 
                                width: 28, 
                                height: 28,
                                bgcolor: theme => theme.palette.primary.main,
                                fontSize: '0.9rem'
                              }}
                            >
                              {challenge.createdBy.charAt(0)}
                            </Avatar>
                            <Typography 
                              variant="body2" 
                              sx={{ ml: 1, opacity: 0.8 }}
                            >
                              {challenge.createdBy}
                            </Typography>
                          </Box>
                        </CardContent>
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            px: 3,
                            pb: 2
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <IconButton
                              onClick={() => handleToggleLike(challenge.id)}
                              color="primary"
                              sx={{
                                transition: 'all 0.3s',
                                '&:hover': { transform: 'scale(1.2)' }
                              }}
                            >
                              {likedChallenges[challenge.id] ? 
                                <FavoriteIcon /> : 
                                <FavoriteBorderIcon />
                              }
                            </IconButton>
                            <Typography variant="body2" color="text.secondary">
                              {challenge.likes}
                            </Typography>
                          </Box>
                          
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Voir le détail">
                              <Button 
                                variant="outlined" 
                                size="small" 
                                color="primary"
                                sx={{ 
                                  borderRadius: '20px',
                                  minWidth: 'auto',
                                  px: 2,
                                  border: '1px solid',
                                  borderColor: 'primary.main',
                                  '&:hover': {
                                    backgroundColor: 'primary.main',
                                    color: 'white'
                                  }
                                }}
                              >
                                Détails
                              </Button>
                            </Tooltip>
                            
                            <Tooltip title="Partager ce défi">
                              <IconButton
                                size="small"
                                sx={{ 
                                  ml: 1,
                                  bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                  '&:hover': {
                                    bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                                  }
                                }}
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        )}
        
        {activeTab === 'user' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            key="user-tab"
          >
            <Box>
              <Typography 
                variant="h4" 
                component="h2" 
                gutterBottom
                sx={{
                  position: 'relative',
                  display: 'inline-block',
                  fontWeight: 700,
                  mb: 4,
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -8,
                    left: 0,
                    width: '60%',
                    height: 4,
                    backgroundColor: 'primary.main',
                    borderRadius: 4
                  }
                }}
              >
                Mes défis personnalisés
              </Typography>
              
              {userChallenges.length === 0 ? (
                <Paper 
                  component={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", duration: 0.8 }}
                  sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    borderRadius: 4,
                    background: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
                  >
                    <DirectionsBikeIcon 
                      sx={{ 
                        fontSize: 80, 
                        color: 'primary.main', 
                        opacity: 0.8, 
                        mb: 3,
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                      }} 
                    />
                  </motion.div>
                  
                  <Typography variant="h5" gutterBottom fontWeight={600}>
                    Vous n'avez pas encore créé de défi
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
                    Créez votre premier défi "7 Majeurs" et commencez à tracer votre parcours d'exception.
                    Sélectionnez jusqu'à 7 cols parmi notre catalogue et créez un défi qui vous ressemble !
                  </Typography>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="contained" 
                      size="large"
                      startIcon={<AddIcon />}
                      onClick={() => setActiveTab('create')}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderRadius: '50px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        background: 'linear-gradient(45deg, #2563EB 30%, #60A5FA 90%)',
                        '&:hover': {
                          boxShadow: '0 6px 25px rgba(0,0,0,0.2)',
                        }
                      }}
                    >
                      Créer mon premier défi
                    </Button>
                  </motion.div>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {userChallenges.map(challenge => (
                    <Grid item xs={12} sm={6} md={4} key={challenge.id}>
                      <motion.div
                        variants={itemVariants}
                        whileHover="hover"
                      >
                        <Card 
                          component={motion.div}
                          variants={cardVariants}
                          whileHover="hover"
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            backdropFilter: 'blur(10px)',
                            background: theme => theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.8)' : 'rgba(255,255,255,0.8)',
                          }}
                        >
                          {/* Contenu similaire aux cartes de défis communautaires */}
                          <CardContent>
                            <Typography variant="h6" component="div">
                              {challenge.name}
                            </Typography>
                            {/* Autres détails */}
                          </CardContent>
                          <CardActions>
                            <Button size="small" color="primary">
                              Modifier
                            </Button>
                            <Button size="small" color="primary">
                              Voir
                            </Button>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                  
                  {/* Carte pour créer un nouveau défi */}
                  <Grid item xs={12} sm={6} md={4}>
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          p: 3,
                          cursor: 'pointer',
                          backdropFilter: 'blur(10px)',
                          background: theme => theme.palette.mode === 'dark' ? 'rgba(30,30,30,0.5)' : 'rgba(255,255,255,0.6)',
                          border: '2px dashed',
                          borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                          '&:hover': {
                            borderColor: 'primary.main',
                            bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(45,45,45,0.8)' : 'rgba(245,245,245,0.8)'
                          }
                        }}
                        onClick={() => setActiveTab('create')}
                      >
                        <Box sx={{ textAlign: 'center' }}>
                          <motion.div
                            initial={{ scale: 1 }}
                            whileHover={{ 
                              scale: 1.2,
                              rotate: [0, 5, -5, 0],
                              transition: { duration: 0.5, repeat: Infinity, repeatType: "reverse" }
                            }}
                          >
                            <AddIcon sx={{ fontSize: 60, color: 'primary.main', opacity: 0.7, mb: 2 }} />
                          </motion.div>
                          <Typography variant="h6" fontWeight={600}>
                            Créer un nouveau défi
                          </Typography>
                        </Box>
                      </Card>
                    </motion.div>
                  </Grid>
                </Grid>
              )}
            </Box>
          </motion.div>
        )}
        
        {activeTab === 'create' && (
          <motion.div
            key="create-tab"
            variants={tabVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <CustomChallengeCreator 
              cols={mockCols} 
              userChallenges={userChallenges}
              onSaveChallenge={handleSaveChallenge}
            />
          </motion.div>
        )}
      </Container>
    </Box>
  );
};

export default MajorChallengePage;
