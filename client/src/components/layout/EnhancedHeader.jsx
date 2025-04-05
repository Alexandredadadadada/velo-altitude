import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  useScrollTrigger,
  Slide,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TerrainIcon from '@mui/icons-material/Terrain';
import GroupsIcon from '@mui/icons-material/Groups';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import TranslateIcon from '@mui/icons-material/Translate';
import { Link, useLocation } from 'react-router-dom';

// Composant pour l'animation de défilement
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Animation du logo de montagne
const MountainLogo = () => {
  const theme = useTheme();
  const [hover, setHover] = useState(false);

  return (
    <Box
      sx={{
        position: 'relative',
        width: 40,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mr: 1,
        cursor: 'pointer',
        transition: 'transform 0.3s',
        transform: hover ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Première montagne (plus grande) */}
      <Box
        sx={{
          position: 'absolute',
          width: 0,
          height: 0,
          borderLeft: '20px solid transparent',
          borderRight: '20px solid transparent',
          borderBottom: `30px solid ${hover ? theme.palette.primary.main : theme.palette.primary.dark}`,
          transition: 'border-bottom-color 0.3s',
          zIndex: 2,
        }}
      />
      {/* Deuxième montagne (plus petite) */}
      <Box
        sx={{
          position: 'absolute',
          left: 7,
          width: 0,
          height: 0,
          borderLeft: '13px solid transparent',
          borderRight: '13px solid transparent',
          borderBottom: `20px solid ${hover ? theme.palette.secondary.main : theme.palette.secondary.dark}`,
          transition: 'border-bottom-color 0.3s',
          zIndex: 1,
        }}
      />
      {/* "Neige" animée sur les sommets */}
      <Box
        sx={{
          position: 'absolute',
          top: hover ? 12 : 14,
          left: hover ? 16 : 15,
          width: hover ? 8 : 6,
          height: hover ? 4 : 3,
          borderRadius: '50%',
          backgroundColor: 'white',
          transition: 'all 0.3s',
          zIndex: 3,
        }}
      />
    </Box>
  );
};

// Indicateur de navigation active
const ActiveIndicator = ({ active }) => (
  <Box
    sx={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      bgcolor: 'primary.main',
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
      transform: active ? 'scaleX(1)' : 'scaleX(0)',
      transition: 'transform 0.3s',
      transformOrigin: 'center',
    }}
  />
);

// Menu de langue avec animation
const LanguageMenu = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [selectedLang, setSelectedLang] = useState('FR');

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectLanguage = (lang) => {
    setSelectedLang(lang);
    handleClose();
  };

  return (
    <>
      <Button
        onClick={handleClick}
        startIcon={<TranslateIcon />}
        endIcon={<KeyboardArrowDownIcon sx={{ 
          transform: open ? 'rotate(180deg)' : 'rotate(0)', 
          transition: 'transform 0.3s' 
        }} />}
        sx={{ color: 'inherit', minWidth: 90 }}
      >
        {selectedLang}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => selectLanguage('FR')} selected={selectedLang === 'FR'}>Français</MenuItem>
        <MenuItem onClick={() => selectLanguage('EN')} selected={selectedLang === 'EN'}>English</MenuItem>
        <MenuItem onClick={() => selectLanguage('ES')} selected={selectedLang === 'ES'}>Español</MenuItem>
        <MenuItem onClick={() => selectLanguage('IT')} selected={selectedLang === 'IT'}>Italiano</MenuItem>
        <MenuItem onClick={() => selectLanguage('DE')} selected={selectedLang === 'DE'}>Deutsch</MenuItem>
      </Menu>
    </>
  );
};

// Composant principal du header
const EnhancedHeader = ({ darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const notificationsOpen = Boolean(notificationsAnchorEl);
  const profileOpen = Boolean(profileAnchorEl);

  // Déterminer si un lien est actif
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // Gestion des menus
  const handleNotificationsClick = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationsAnchorEl(null);
  };

  const handleCloseProfile = () => {
    setProfileAnchorEl(null);
  };

  // Animation de gradient pour le header
  const [gradientPos, setGradientPos] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setGradientPos((prev) => (prev + 1) % 200);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);

  // Configuration du menu de navigation
  const navigationItems = [
    { text: '7 Majeurs', icon: <TerrainIcon />, path: '/challenges' },
    { text: 'Catalogue des Cols', icon: <DirectionsBikeIcon />, path: '/cols' },
    { text: 'Nutrition', icon: <RestaurantIcon />, path: '/nutrition' },
    { text: 'Entraînement', icon: <FitnessCenterIcon />, path: '/training' },
    { text: 'Communauté', icon: <GroupsIcon />, path: '/community' },
  ];

  return (
    <>
      <HideOnScroll>
        <AppBar 
          position="fixed"
          elevation={0}
          sx={{
            backdropFilter: 'blur(10px)',
            backgroundColor: alpha(theme.palette.background.default, 0.85),
            borderBottom: `1px solid ${theme.palette.divider}`,
            boxShadow: `0 4px 20px rgba(0, 0, 0, 0.05)`,
            backgroundImage: `linear-gradient(90deg, 
              ${alpha(theme.palette.primary.main, 0.1)} ${gradientPos}%, 
              ${alpha(theme.palette.secondary.main, 0.1)} ${gradientPos + 50}%, 
              ${alpha(theme.palette.primary.main, 0.1)} ${gradientPos + 100}%)`,
            backgroundSize: '200% 100%',
            transition: 'background-position 0.5s',
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ py: { xs: 0.5, md: 1 } }}>
              {/* Logo et nom du site */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                mr: { xs: 1, md: 2 }
              }}>
                <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: 'inherit' }}>
                  <MountainLogo />
                  <Typography
                    variant="h5"
                    noWrap
                    sx={{
                      fontWeight: 700,
                      letterSpacing: '.1rem',
                      textDecoration: 'none',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      mr: 2,
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  >
                    VELO-ALTITUDE
                  </Typography>
                </Link>
              </Box>

              {/* Menu de navigation pour desktop */}
              {!isMobile && (
                <Box sx={{ 
                  display: 'flex', 
                  flexGrow: 1,
                }}>
                  {navigationItems.map((item) => (
                    <Box
                      key={item.text}
                      sx={{
                        position: 'relative',
                        mx: 0.5,
                      }}
                    >
                      <Button
                        component={Link}
                        to={item.path}
                        sx={{
                          px: 2,
                          py: 1.5,
                          color: isActive(item.path) ? 'primary.main' : 'text.primary',
                          fontWeight: isActive(item.path) ? 600 : 500,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        startIcon={item.icon}
                      >
                        {item.text}
                      </Button>
                      <ActiveIndicator active={isActive(item.path)} />
                    </Box>
                  ))}
                </Box>
              )}

              {/* Boutons à droite */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                ml: 'auto',
              }}>
                {/* Sélecteur de thème */}
                <IconButton 
                  onClick={toggleDarkMode}
                  color="inherit"
                  sx={{ 
                    borderRadius: '50%',
                    transition: 'transform 0.2s, background-color 0.2s',
                    '&:hover': {
                      transform: 'rotate(20deg)',
                      backgroundColor: 'action.hover',
                    }
                  }}
                >
                  {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>

                {/* Sélecteur de langue */}
                <LanguageMenu />

                {/* Notifications */}
                <IconButton 
                  color="inherit" 
                  onClick={handleNotificationsClick}
                  sx={{ 
                    mx: 0.5,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::after': notificationsOpen ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '50%',
                      border: `2px solid ${theme.palette.primary.main}`,
                      animation: 'ripple 1.5s infinite ease-in-out',
                      '@keyframes ripple': {
                        '0%': {
                          transform: 'scale(0.8)',
                          opacity: 1,
                        },
                        '100%': {
                          transform: 'scale(2.4)',
                          opacity: 0,
                        },
                      },
                    } : {},
                  }}
                >
                  <Badge badgeContent={3} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>

                {/* Profil utilisateur */}
                <IconButton 
                  onClick={handleProfileClick}
                  sx={{ 
                    p: 0,
                    ml: 1,
                    border: profileOpen ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                    transition: 'transform 0.2s, border 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  <Avatar 
                    alt="User Profile"
                    src="/images/profile-placeholder.jpg"
                    sx={{ 
                      width: 35, 
                      height: 35,
                    }}
                  />
                </IconButton>

                {/* Menu burger pour mobile */}
                {isMobile && (
                  <IconButton
                    color="inherit"
                    onClick={() => setDrawerOpen(true)}
                    edge="end"
                    sx={{ ml: 1 }}
                  >
                    <MenuIcon />
                  </IconButton>
                )}
              </Box>
            </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>

      {/* Menu de notifications */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={notificationsOpen}
        onClose={handleCloseNotifications}
        PaperProps={{
          elevation: 4,
          sx: {
            width: 320,
            maxHeight: 400,
            mt: 1.5,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
            '& .MuiList-root': {
              py: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
        </Box>
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 2 }}>
          <Box sx={{ mr: 1.5, mt: 0.25 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
              <TerrainIcon fontSize="small" />
            </Avatar>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Nouveau défi communautaire</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Essayez le défi "Géants des Alpes" créé par l'équipe
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              Il y a 3 heures
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 2 }}>
          <Box sx={{ mr: 1.5, mt: 0.25 }}>
            <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
              <GroupsIcon fontSize="small" />
            </Avatar>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Commentaire sur votre parcours</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Jean D. a commenté votre défi "Pyrénées Express"
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              Hier
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleCloseNotifications} sx={{ py: 2 }}>
          <Box sx={{ mr: 1.5, mt: 0.25 }}>
            <Avatar sx={{ bgcolor: 'warning.main', width: 40, height: 40 }}>
              <RestaurantIcon fontSize="small" />
            </Avatar>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Nouveau plan nutritionnel disponible</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Plan "Haute montagne" ajouté à la bibliothèque
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
              Il y a 2 jours
            </Typography>
          </Box>
        </MenuItem>
        <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button size="small" onClick={handleCloseNotifications}>
            Voir toutes les notifications
          </Button>
        </Box>
      </Menu>

      {/* Menu de profil */}
      <Menu
        anchorEl={profileAnchorEl}
        open={profileOpen}
        onClose={handleCloseProfile}
        PaperProps={{
          elevation: 4,
          sx: {
            mt: 1.5,
            minWidth: 200,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
          <Avatar 
            alt="User Profile"
            src="/images/profile-placeholder.jpg"
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Box>
            <Typography variant="subtitle2">Thomas Martin</Typography>
            <Typography variant="body2" color="text.secondary">Cycliste Passionné</Typography>
          </Box>
        </Box>
        <Divider />
        <MenuItem component={Link} to="/profile" onClick={handleCloseProfile}>Mon profil</MenuItem>
        <MenuItem component={Link} to="/profile/challenges" onClick={handleCloseProfile}>Mes défis</MenuItem>
        <MenuItem component={Link} to="/profile/settings" onClick={handleCloseProfile}>Paramètres</MenuItem>
        <Divider />
        <MenuItem onClick={handleCloseProfile} sx={{ color: 'error.main' }}>Déconnexion</MenuItem>
      </Menu>

      {/* Drawer pour la navigation mobile */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: 350,
            backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.default, 0.97)}, ${alpha(theme.palette.background.paper, 0.97)})`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box display="flex" alignItems="center">
            <MountainLogo />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>VELO-ALTITUDE</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        <Box sx={{ py: 1 }}>
          <List>
            {navigationItems.map((item) => (
              <ListItem 
                button 
                key={item.text}
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                sx={{
                  py: 1.5,
                  backgroundColor: isActive(item.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                  borderRight: isActive(item.path) ? `3px solid ${theme.palette.primary.main}` : 'none',
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? 'primary.main' : 'inherit', minWidth: 45 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{ 
                    fontWeight: isActive(item.path) ? 600 : 400,
                    color: isActive(item.path) ? 'primary.main' : 'inherit',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Button 
            variant="contained" 
            fullWidth 
            component={Link} 
            to="/profile" 
            onClick={() => setDrawerOpen(false)}
            sx={{ mb: 1 }}
          >
            Mon profil
          </Button>
          <Button 
            variant="outlined" 
            fullWidth 
            color="error"
            onClick={() => setDrawerOpen(false)}
          >
            Déconnexion
          </Button>
        </Box>
      </Drawer>
      
      {/* Espaceur pour pousser le contenu sous le header */}
      <Toolbar />
    </>
  );
};

export default EnhancedHeader;
