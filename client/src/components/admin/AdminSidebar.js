import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  MonitorHeart as ApiMonitoringIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Terrain as ColsIcon,
  FeaturedPlayList as FeatureFlagsIcon,
  AdminPanelSettings as AdminIcon
} from '@mui/icons-material';

/**
 * Barre latérale de navigation pour les pages d'administration
 * @param {Object} props - Propriétés du composant
 * @param {string} props.activeItem - Identifiant de l'élément actif
 */
const AdminSidebar = ({ activeItem }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Liste des éléments de navigation admin
  const adminNavItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      path: '/admin',
      icon: <DashboardIcon />
    },
    {
      id: 'api-monitoring',
      label: 'Monitoring API',
      path: '/admin/api-monitoring',
      icon: <ApiMonitoringIcon />
    },
    {
      id: 'api-analytics',
      label: 'Analytique API',
      path: '/admin/api-analytics',
      icon: <AnalyticsIcon />
    },
    {
      id: 'api-settings',
      label: 'Paramètres API',
      path: '/admin/api-settings',
      icon: <SettingsIcon />
    },
    {
      id: 'cols-conditions',
      label: 'Conditions des cols',
      path: '/admin/cols-conditions',
      icon: <ColsIcon />
    },
    {
      id: 'feature-flags',
      label: 'Feature Flags',
      path: '/admin/feature-flags',
      icon: <FeatureFlagsIcon />
    }
  ];

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        height: '100%',
        position: 'sticky',
        top: '80px'
      }}
    >
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <AdminIcon sx={{ mr: 1 }} />
          <Typography variant="h6">Administration</Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Gestion du site
        </Typography>
      </Box>
      <Divider />
      <List component="nav" sx={{ p: 1 }}>
        {adminNavItems.map((item) => (
          <ListItem key={item.id} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={activeItem === item.id}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: activeItem === item.id ? 'primary.main' : 'inherit',
                minWidth: '40px'
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.label} 
                primaryTypographyProps={{
                  fontWeight: activeItem === item.id ? 600 : 400,
                  fontSize: '0.9rem'
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default AdminSidebar;
