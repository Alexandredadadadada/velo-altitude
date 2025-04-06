import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Dashboard as DashboardIcon,
  Public as PublicIcon,
  PeopleAlt as UsersIcon,
  Route as RoutesIcon,
  BarChart as StatisticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  Speed as QuotaIcon,
  AccountCircle,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuthCentral';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const AdminLayout = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [alertsAnchorEl, setAlertsAnchorEl] = useState(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAlertsMenuOpen = (event) => {
    setAlertsAnchorEl(event.currentTarget);
  };

  const handleAlertsMenuClose = () => {
    setAlertsAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      text: 'Tableau de bord', 
      icon: <DashboardIcon />, 
      path: '/admin' 
    },
    { 
      text: 'Monitoring API', 
      icon: <QuotaIcon />, 
      path: '/admin/api-monitoring' 
    },
    { 
      text: 'Utilisateurs', 
      icon: <UsersIcon />, 
      path: '/admin/users' 
    },
    { 
      text: 'Itinéraires', 
      icon: <RoutesIcon />, 
      path: '/admin/routes' 
    },
    { 
      text: 'Statistiques', 
      icon: <StatisticsIcon />, 
      path: '/admin/statistics' 
    },
    { 
      text: 'Paramètres', 
      icon: <SettingsIcon />, 
      path: '/admin/settings' 
    },
  ];

  // Alertes simulées
  const alertItems = [
    {
      text: 'Quota OpenAI à 82%',
      severity: 'warning',
      time: '10:30'
    },
    {
      text: 'Erreur API Strava',
      severity: 'error',
      time: 'Hier'
    },
    {
      text: 'Nouveau rapport hebdomadaire',
      severity: 'info',
      time: 'Lun'
    }
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Barre de navigation supérieure */}
      <AppBar
        position="fixed"
        sx={{
          width: open ? `calc(100% - ${drawerWidth}px)` : '100%',
          ml: open ? `${drawerWidth}px` : 0,
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Administration - Cyclisme Européen
          </Typography>
          
          {/* Bouton pour accéder au site public */}
          <Button 
            color="inherit" 
            startIcon={<PublicIcon />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Site Public
          </Button>
          
          {/* Icône de notifications */}
          <Tooltip title="Alertes">
            <IconButton
              color="inherit"
              onClick={handleAlertsMenuOpen}
              sx={{ mr: 2 }}
            >
              <Badge badgeContent={alertItems.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* Menu des alertes */}
          <Menu
            anchorEl={alertsAnchorEl}
            open={Boolean(alertsAnchorEl)}
            onClose={handleAlertsMenuClose}
            sx={{ mt: '45px' }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            {alertItems.map((alert, index) => (
              <MenuItem 
                key={index} 
                onClick={handleAlertsMenuClose}
                sx={{ 
                  minWidth: 250,
                  borderLeft: 3, 
                  borderColor: 
                    alert.severity === 'error' ? 'error.main' : 
                    alert.severity === 'warning' ? 'warning.main' : 
                    'info.main' 
                }}
              >
                <ListItemIcon>
                  {alert.severity === 'error' ? (
                    <WarningIcon color="error" />
                  ) : alert.severity === 'warning' ? (
                    <WarningIcon color="warning" />
                  ) : (
                    <NotificationsIcon color="info" />
                  )}
                </ListItemIcon>
                <Box>
                  <Typography variant="body2">{alert.text}</Typography>
                  <Typography variant="caption" color="text.secondary">{alert.time}</Typography>
                </Box>
              </MenuItem>
            ))}
            <Divider />
            <MenuItem onClick={() => navigate('/admin/alerts')}>
              <Typography variant="body2" color="primary">Voir toutes les alertes</Typography>
            </MenuItem>
          </Menu>
          
          {/* Avatar de l'utilisateur */}
          <Tooltip title="Profil">
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
          
          {/* Menu du profil */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            sx={{ mt: '45px' }}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/admin/profile'); }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Mon Profil</Typography>
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <Typography textAlign="center">Déconnexion</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Tiroir de navigation latéral */}
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <Box 
            display="flex" 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ width: '100%', px: 2 }}
          >
            <Typography variant="h6" color="primary">
              Admin Dashboard
            </Typography>
            <IconButton onClick={handleDrawerToggle}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={window.location.pathname === item.path}
              >
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <Box sx={{ p: 2, mt: 'auto' }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {new Date().getFullYear()} Dashboard-Velo
          </Typography>
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Version 1.0.0
          </Typography>
        </Box>
      </Drawer>
      
      {/* Contenu principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${open ? drawerWidth : 0}px)` },
          ml: { sm: open ? `${drawerWidth}px` : 0 },
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <DrawerHeader />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
