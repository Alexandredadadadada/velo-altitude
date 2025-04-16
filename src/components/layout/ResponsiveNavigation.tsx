/**
 * Composant de navigation responsive pour le site Velo-Altitude
 * Résout les problèmes d'affichage sur les appareils mobiles
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Button, Drawer, List, ListItem, 
         ListItemText, Collapse, useMediaQuery, useTheme, Divider } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { styled } from '@mui/material/styles';

// Menu principal pour l'application
const mainMenuItems = [
  { title: 'home', path: '/' },
  { title: 'cols', path: '/cols', children: [
    { title: 'colCatalog', path: '/cols/catalog' },
    { title: 'sevenMajors', path: '/cols/seven-majors' },
    { title: '3dVisualization', path: '/cols/3d-view' }
  ]},
  { title: 'training', path: '/training', children: [
    { title: 'trainingPrograms', path: '/training/programs' },
    { title: 'workouts', path: '/training/workouts' },
    { title: 'hiit', path: '/training/hiit' }
  ]},
  { title: 'nutrition', path: '/nutrition', children: [
    { title: 'recipes', path: '/nutrition/recipes' },
    { title: 'mealPlanner', path: '/nutrition/meal-planner' },
    { title: 'nutritionCalculator', path: '/nutrition/calculator' }
  ]},
  { title: 'community', path: '/community' },
  { title: 'profile', path: '/profile' }
];

// Styles pour l'AppBar responsive
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  [theme.breakpoints.down('md')]: {
    padding: '0 8px'
  }
}));

// Styles pour le logo
const Logo = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '& img': {
    height: '42px',
    [theme.breakpoints.down('sm')]: {
      height: '32px',
    }
  }
}));

// Styles pour les boutons du menu
const NavButton = styled(Button)(({ theme }) => ({
  margin: '0 4px',
  borderRadius: '4px',
  textTransform: 'none',
  fontWeight: 500,
  color: theme.palette.common.white,
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  }
}));

// Styles pour le menu mobile
const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '280px',
    backgroundColor: theme.palette.background.paper,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
    }
  }
}));

// Styles pour les items du menu mobile
const MobileMenuItem = styled(ListItem)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  }
}));

// Styles pour les sous-menus
const SubMenu = styled(Collapse)(({ theme }) => ({
  padding: '0',
  '& .MuiListItem-root': {
    paddingLeft: theme.spacing(4),
  }
}));

/**
 * Composant principal de navigation responsive
 */
export const ResponsiveNavigation: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const prevIsMobile = useRef(isMobile);

  // Fermer le mobile drawer lors du changement de route
  useEffect(() => {
    if (mobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  // Réinitialiser l'état du menu lors du changement de taille d'écran
  useEffect(() => {
    if (prevIsMobile.current !== isMobile) {
      prevIsMobile.current = isMobile;
      setMobileOpen(false);
      setExpandedItems({});
    }
  }, [isMobile]);

  // Gérer l'ouverture/fermeture du menu mobile
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Gérer l'expansion des sous-menus
  const handleExpandItem = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Vérifier si un élément est actif
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  // Rendre le menu mobile
  const renderMobileMenu = () => (
    <MobileDrawer
      anchor="right"
      open={mobileOpen}
      onClose={handleDrawerToggle}
      ModalProps={{ keepMounted: true }}
    >
      <div className="mobile-drawer-header">
        <IconButton onClick={handleDrawerToggle} aria-label="fermer le menu">
          <CloseIcon />
        </IconButton>
      </div>
      <Divider />
      <List>
        {mainMenuItems.map((item) => (
          <React.Fragment key={item.path}>
            {item.children ? (
              <>
                <MobileMenuItem button onClick={() => handleExpandItem(item.path)}>
                  <ListItemText primary={t(item.title)} />
                  {expandedItems[item.path] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </MobileMenuItem>
                <SubMenu in={expandedItems[item.path]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child) => (
                      <MobileMenuItem 
                        button 
                        key={child.path} 
                        component={Link} 
                        to={child.path}
                        selected={isActive(child.path)}
                      >
                        <ListItemText primary={t(child.title)} />
                      </MobileMenuItem>
                    ))}
                  </List>
                </SubMenu>
              </>
            ) : (
              <MobileMenuItem 
                button 
                component={Link} 
                to={item.path}
                selected={isActive(item.path)}
              >
                <ListItemText primary={t(item.title)} />
              </MobileMenuItem>
            )}
          </React.Fragment>
        ))}
      </List>
    </MobileDrawer>
  );

  // Rendre le menu desktop
  const renderDesktopMenu = () => (
    <div className="desktop-menu">
      {mainMenuItems.map((item) => (
        <NavButton
          key={item.path}
          component={Link}
          to={item.path}
          color={isActive(item.path) ? "secondary" : "inherit"}
          className={isActive(item.path) ? "active" : ""}
        >
          {t(item.title)}
        </NavButton>
      ))}
    </div>
  );

  return (
    <StyledAppBar position="sticky">
      <Toolbar>
        <Logo>
          <Link to="/">
            <img src="/logo.png" alt="Velo-Altitude" />
          </Link>
        </Logo>
        
        <div style={{ flexGrow: 1 }} />
        
        {isMobile ? (
          <IconButton
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
        ) : (
          renderDesktopMenu()
        )}
      </Toolbar>
      {renderMobileMenu()}
    </StyledAppBar>
  );
};

export default ResponsiveNavigation;
