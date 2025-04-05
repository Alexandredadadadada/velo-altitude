import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Box, 
  Container, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider, 
  useScrollTrigger,
  Slide,
  useTheme,
  useMediaQuery,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Home, 
  DirectionsBike, 
  Terrain, 
  FitnessCenter, 
  Restaurant, 
  Person, 
  Notifications, 
  Search, 
  DarkMode, 
  LightMode, 
  AdminPanelSettings,
  Logout,
  Settings,
  ArrowDropDown
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Composant pour masquer l'AppBar lors du défilement
function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

// Composant principal du layout
const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();

  // États pour les menus et le drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  // Fermer le drawer lors du changement de route
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Navigation principale
  const mainNavItems = [
    { text: 'Accueil', icon: <Home />, path: '/' },
    { text: 'Cols', icon: <Terrain />, path: '/cols' },
    { text: 'Itinéraires', icon: <DirectionsBike />, path: '/routes' },
    { text: 'Entraînement', icon: <FitnessCenter />, path: '/training' },
    { text: 'Nutrition', icon: <Restaurant />, path: '/nutrition' }
  ];

  // Notifications factices
  const notifications = [
    { id: 1, message: 'Nouvel itinéraire recommandé pour vous', read: false },
    { id: 2, message: 'Jean Dupont a commenté votre itinéraire', read: false },
    { id: 3, message: 'Mise à jour des conditions météo pour le Col du Galibier', read: true }
  ];

  // Gestion du menu utilisateur
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Gestion du menu des notifications
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  // Gestion de la déconnexion
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/');
  };

  // Contenu du drawer pour mobile
  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component={Link} to="/" sx={{ textDecoration: 'none', color: 'inherit' }}>
          Dashboard-Velo
        </Typography>
      </Box>
      <Divider />
      <List>
        {mainNavItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      {user ? (
        <List>
          <ListItem button component={Link} to="/profile">
            <ListItemIcon><Person /></ListItemIcon>
            <ListItemText primary="Mon profil" />
          </ListItem>
          {isAdmin() && (
            <ListItem button component={Link} to="/admin">
              <ListItemIcon><AdminPanelSettings /></ListItemIcon>
              <ListItemText primary="Administration" />
            </ListItem>
          )}
          <ListItem button onClick={handleLogout}>
            <ListItemIcon><Logout /></ListItemIcon>
            <ListItemText primary="Déconnexion" />
          </ListItem>
        </List>
      ) : (
        <List>
          <ListItem button component={Link} to="/login">
            <ListItemText primary="Connexion" />
          </ListItem>
          <ListItem button component={Link} to="/register">
            <ListItemText primary="Inscription" />
          </ListItem>
        </List>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Barre de navigation */}
      <HideOnScroll>
        <AppBar position="sticky" color="default" elevation={1}>
          <Toolbar>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="menu"
                edge="start"
                onClick={() => setDrawerOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography 
              variant="h6" 
              component={Link} 
              to="/" 
              sx={{ 
                flexGrow: 1, 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <img 
                src="/logo.png" 
                alt="Dashboard-Velo" 
                style={{ height: 40, marginRight: 10 }} 
              />
              {!isMobile && "Dashboard-Velo"}
            </Typography>
            
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mainNavItems.map((item) => (
                  <Button
                    key={item.text}
                    component={Link}
                    to={item.path}
                    color="inherit"
                    sx={{ 
                      mx: 1,
                      position: 'relative',
                      '&::after': location.pathname === item.path ? {
                        content: '""',
                        position: 'absolute',
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '30%',
                        height: 3,
                        backgroundColor: 'primary.main',
                        borderRadius: 1.5
                      } : {}
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton color="inherit" aria-label="search" component={Link} to="/search">
                <Search />
              </IconButton>
              
              {user && (
                <IconButton 
                  color="inherit" 
                  aria-label="notifications"
                  onClick={handleNotificationsOpen}
                >
                  <Badge badgeContent={notifications.filter(n => !n.read).length} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
              )}
              
              {user ? (
                <Box sx={{ ml: 1 }}>
                  <Button
                    onClick={handleUserMenuOpen}
                    color="inherit"
                    sx={{ textTransform: 'none' }}
                    endIcon={<ArrowDropDown />}
                  >
                    <Avatar 
                      src={user.profilePicture} 
                      alt={user.firstName} 
                      sx={{ width: 32, height: 32, mr: 1 }}
                    >
                      {user.firstName ? user.firstName.charAt(0) : 'U'}
                    </Avatar>
                    {!isMobile && user.firstName}
                  </Button>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem component={Link} to="/profile" onClick={handleUserMenuClose}>
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      Mon profil
                    </MenuItem>
                    <MenuItem component={Link} to="/settings" onClick={handleUserMenuClose}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Paramètres
                    </MenuItem>
                    {isAdmin() && (
                      <MenuItem component={Link} to="/admin" onClick={handleUserMenuClose}>
                        <ListItemIcon>
                          <AdminPanelSettings fontSize="small" />
                        </ListItemIcon>
                        Administration
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Déconnexion
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Box sx={{ display: 'flex' }}>
                  <Button color="inherit" component={Link} to="/login">
                    Connexion
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={Link} 
                    to="/register"
                    sx={{ ml: 1 }}
                  >
                    Inscription
                  </Button>
                </Box>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      
      {/* Drawer pour mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {drawerContent}
      </Drawer>
      
      {/* Menu des notifications */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleNotificationsClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notifications
          </Typography>
        </Box>
        
        {notifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Aucune notification
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id} 
                  button 
                  sx={{ 
                    borderLeft: notification.read ? 'none' : `4px solid ${theme.palette.primary.main}`,
                    bgcolor: notification.read ? 'inherit' : 'action.hover'
                  }}
                >
                  <ListItemText 
                    primary={notification.message} 
                    secondary="Il y a 2 heures"
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: notification.read ? 'normal' : 'bold'
                    }}
                  />
                </ListItem>
              ))}
            </List>
            <Box sx={{ p: 1, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}` }}>
              <Button size="small" color="primary">
                Voir toutes les notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
      
      {/* Contenu principal */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      {/* Pied de page */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto',
          backgroundColor: theme.palette.grey[100]
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Box sx={{ mb: { xs: 3, md: 0 }, textAlign: { xs: 'center', md: 'left' } }}>
              <Typography variant="h6" gutterBottom>
                Dashboard-Velo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                La plateforme de référence pour les cyclistes du Grand Est
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4, textAlign: { xs: 'center', sm: 'left' } }}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Navigation
                </Typography>
                <Box component="nav">
                  <Typography variant="body2" component={Link} to="/" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Accueil
                  </Typography>
                  <Typography variant="body2" component={Link} to="/cols" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Cols
                  </Typography>
                  <Typography variant="body2" component={Link} to="/routes" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Itinéraires
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Ressources
                </Typography>
                <Box component="nav">
                  <Typography variant="body2" component={Link} to="/about" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    À propos
                  </Typography>
                  <Typography variant="body2" component={Link} to="/contact" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Contact
                  </Typography>
                  <Typography variant="body2" component={Link} to="/faq" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    FAQ
                  </Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Légal
                </Typography>
                <Box component="nav">
                  <Typography variant="body2" component={Link} to="/terms" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Conditions d'utilisation
                  </Typography>
                  <Typography variant="body2" component={Link} to="/privacy" color="text.secondary" display="block" sx={{ textDecoration: 'none', mb: 1 }}>
                    Politique de confidentialité
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center', borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {new Date().getFullYear()} Dashboard-Velo. Tous droits réservés.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;
