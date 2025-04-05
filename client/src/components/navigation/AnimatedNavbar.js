import React, { useState, useEffect } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AppBar,
  Toolbar,
  Box,
  Container,
  Button,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Avatar,
  useMediaQuery,
  Badge,
  Menu,
  MenuItem,
  alpha
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Terrain as TerrainIcon,
  Route as RouteIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Calculate as CalculateIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Close as CloseIcon,
  ArrowDropDown as ArrowDropDownIcon,
  DirectionsBike as BikeIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

// Styled Components
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  color: theme.palette.text.primary,
  transition: 'all 0.3s ease'
}));

const NavButton = styled(Button)(({ theme, active }) => ({
  position: 'relative',
  margin: theme.spacing(0, 0.5),
  padding: theme.spacing(1.5, 2),
  color: active ? theme.palette.primary.main : theme.palette.text.primary,
  fontWeight: active ? 600 : 500,
  fontSize: '0.95rem',
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    color: theme.palette.primary.main
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: active ? 'translateX(-50%)' : 'translateX(-50%) scaleX(0)',
    height: 3,
    width: active ? '60%' : '0%',
    borderRadius: '3px',
    backgroundColor: theme.palette.primary.main,
    transition: 'all 0.3s ease',
  },
  '&:hover::after': {
    transform: 'translateX(-50%) scaleX(1)',
    width: '60%'
  }
}));

const MobileNavItem = styled(ListItem)(({ theme, active }) => ({
  paddingTop: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(0.5),
  '& .MuiListItemIcon-root': {
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    minWidth: '40px'
  },
  '& .MuiListItemText-primary': {
    color: active ? theme.palette.primary.main : theme.palette.text.primary,
    fontWeight: active ? 600 : 500
  }
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  letterSpacing: '0.5px',
  marginLeft: theme.spacing(1)
}));

const UserMenuButton = styled(Button)(({ theme }) => ({
  borderRadius: '50px',
  padding: theme.spacing(0.5, 2),
  textTransform: 'none',
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  color: theme.palette.text.primary,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1)
  }
}));

// Animation variants
const navVariants = {
  hidden: { 
    y: -100,
    opacity: 0 
  },
  visible: { 
    y: 0,
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 100,
      damping: 15
    } 
  }
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: i => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3
    }
  }),
  exit: { opacity: 0, x: -20 }
};

const logoVariants = {
  normal: { scale: 1 },
  hover: { 
    scale: 1.05,
    transition: {
      duration: 0.3,
      yoyo: Infinity,
      ease: "easeInOut"
    }
  }
};

const AnimatedNavbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'));
  
  // Menu routes
  const routes = [
    { name: 'Accueil', path: '/', icon: <DashboardIcon /> },
    { name: 'Cols', path: '/cols', icon: <TerrainIcon /> },
    { name: 'Parcours', path: '/routes', icon: <RouteIcon /> },
    { name: 'Événements', path: '/events', icon: <EventIcon /> },
    { name: 'Communauté', path: '/social', icon: <PeopleIcon /> },
    { name: 'Outils', path: '/tools', icon: <CalculateIcon /> }
  ];
  
  // Check if current route is active
  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Toggle drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  // Content for mobile drawer
  const drawerContent = (
    <Box
      sx={{ width: 280, pt: 2, height: '100%' }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BikeIcon color="primary" fontSize="large" />
          <LogoText variant="h6">Velo-Altitude</LogoText>
        </Box>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      
      <Divider sx={{ mb: 2 }} />
      
      <List>
        {routes.map((route, index) => (
          <motion.div
            key={route.path}
            custom={index}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <MobileNavItem
              button
              component={RouterLink}
              to={route.path}
              active={isActiveRoute(route.path) ? 1 : 0}
            >
              <ListItemIcon>{route.icon}</ListItemIcon>
              <ListItemText primary={route.name} />
            </MobileNavItem>
          </motion.div>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {user ? (
        <List>
          <motion.div
            custom={routes.length}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <MobileNavItem button component={RouterLink} to="/profile">
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Mon Profil" />
            </MobileNavItem>
          </motion.div>
          
          <motion.div
            custom={routes.length + 1}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <MobileNavItem button component={RouterLink} to="/settings">
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Paramètres" />
            </MobileNavItem>
          </motion.div>
          
          <motion.div
            custom={routes.length + 2}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <MobileNavItem button onClick={logout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Déconnexion" />
            </MobileNavItem>
          </motion.div>
        </List>
      ) : (
        <List>
          <motion.div
            custom={routes.length}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <MobileNavItem button component={RouterLink} to="/auth/login">
              <ListItemIcon><LoginIcon /></ListItemIcon>
              <ListItemText primary="Connexion" />
            </MobileNavItem>
          </motion.div>
          
          <motion.div
            custom={routes.length + 1}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={listItemVariants}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Button
                variant="contained"
                fullWidth
                component={RouterLink}
                to="/auth/signup"
                startIcon={<PersonIcon />}
              >
                Créer un compte
              </Button>
            </Box>
          </motion.div>
        </List>
      )}
    </Box>
  );

  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={navVariants}
      >
        <StyledAppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            height: scrolled ? 64 : 80,
            transition: 'height 0.3s ease'
          }}
        >
          <Container maxWidth="xl">
            <Toolbar disableGutters sx={{ height: '100%' }}>
              {/* Logo and Brand */}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <motion.div
                  whileHover="hover"
                  animate="normal"
                  variants={logoVariants}
                >
                  <RouterLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                    <BikeIcon color="primary" fontSize="large" />
                    <LogoText variant="h6">Velo-Altitude</LogoText>
                  </RouterLink>
                </motion.div>
              </Box>

              {/* Mobile Menu Button */}
              {isMobile && (
                <Box sx={{ ml: 'auto' }}>
                  <IconButton
                    size="large"
                    edge="end"
                    aria-label="menu"
                    onClick={toggleDrawer(true)}
                  >
                    <MenuIcon />
                  </IconButton>
                </Box>
              )}

              {/* Desktop Navigation */}
              {!isMobile && (
                <>
                  <Box sx={{ mx: 'auto', display: 'flex' }}>
                    {routes.map((route) => (
                      <NavButton
                        key={route.path}
                        component={RouterLink}
                        to={route.path}
                        active={isActiveRoute(route.path) ? 1 : 0}
                        startIcon={route.icon}
                      >
                        {route.name}
                      </NavButton>
                    ))}
                  </Box>

                  {/* User Section */}
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
                    {user ? (
                      <>
                        <IconButton sx={{ mr: 2 }}>
                          <Badge badgeContent={3} color="error">
                            <NotificationsIcon />
                          </Badge>
                        </IconButton>
                        
                        <UserMenuButton
                          aria-controls="user-menu"
                          aria-haspopup="true"
                          onClick={handleUserMenuOpen}
                          endIcon={<ArrowDropDownIcon />}
                        >
                          <Avatar 
                            src={user.avatar} 
                            alt={user.name} 
                            sx={{ width: 32, height: 32, mr: 1 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {user.name || 'Utilisateur'}
                          </Typography>
                        </UserMenuButton>
                        
                        <Menu
                          id="user-menu"
                          anchorEl={anchorEl}
                          keepMounted
                          open={Boolean(anchorEl)}
                          onClose={handleUserMenuClose}
                          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                          PaperProps={{
                            elevation: 2,
                            sx: { 
                              mt: 1,
                              width: 200,
                              borderRadius: 2
                            }
                          }}
                        >
                          <MenuItem component={RouterLink} to="/profile" onClick={handleUserMenuClose}>
                            <ListItemIcon>
                              <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Mon Profil" />
                          </MenuItem>
                          
                          <MenuItem component={RouterLink} to="/settings" onClick={handleUserMenuClose}>
                            <ListItemIcon>
                              <SettingsIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Paramètres" />
                          </MenuItem>
                          
                          <Divider />
                          
                          <MenuItem onClick={handleLogout}>
                            <ListItemIcon>
                              <LogoutIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary="Déconnexion" />
                          </MenuItem>
                        </Menu>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          color="primary"
                          component={RouterLink}
                          to="/auth/login"
                          sx={{ mr: 1, textTransform: 'none' }}
                        >
                          Connexion
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          component={RouterLink}
                          to="/auth/signup"
                          sx={{ textTransform: 'none' }}
                        >
                          Inscription
                        </Button>
                      </>
                    )}
                  </Box>
                </>
              )}
            </Toolbar>
          </Container>
        </StyledAppBar>
      </motion.div>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <AnimatePresence>
          {drawerOpen && drawerContent}
        </AnimatePresence>
      </Drawer>
    </>
  );
};

export default AnimatedNavbar;
