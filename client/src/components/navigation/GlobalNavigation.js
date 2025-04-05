import React, { useState, useEffect, memo, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth'; 
import { 
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  IconButton,
  useMediaQuery,
  useTheme,
  Skeleton,
  Tooltip,
  Badge,
  Fade,
  Link
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Home as HomeIcon,
  Landscape as ColsIcon,
  DirectionsBike as TrainingIcon,
  Restaurant as NutritionIcon,
  Map as RoutesIcon,
  Group as SocialIcon,
  EmojiEvents as ChallengesIcon,
  Terrain as TerrainIcon,
  AdminPanelSettings as AdminPanelSettingsIcon
} from '@mui/icons-material';

// Import CSS pour animations et styles d'accessibilité
import './GlobalNavigation.css';

// Import avec lazy loading pour le Header (composant plus lourd)
const Header = lazy(() => import('../common/Header'));

/**
 * Composant de navigation global qui combine un header et un menu latéral
 * Optimisé pour les performances avec lazy loading et React.memo
 * Respecte les normes d'accessibilité WCAG 2.1 niveau AA
 */
const GlobalNavigation = memo(() => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { isAdmin } = useAuth(); 
  
  // États
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeItemId, setActiveItemId] = useState('');
  const [announceNavigation, setAnnounceNavigation] = useState('');
  
  // Détecter le défilement pour les effets visuels
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Ferme le drawer si l'écran devient assez large
  useEffect(() => {
    if (!isMobile) {
      setIsDrawerOpen(false);
    }
  }, [isMobile]);
  
  // Ferme le drawer quand l'URL change (navigation effectuée)
  useEffect(() => {
    setIsDrawerOpen(false);
    
    // Déterminer l'élément actif en fonction de l'URL
    const updateActiveItem = () => {
      let foundItem = false;
      
      mainNavItems.forEach(item => {
        if (isPathActive(item.path)) {
          setActiveItemId(item.id);
          foundItem = true;
        }
        
        if (item.subItems) {
          item.subItems.forEach(subItem => {
            if (isPathActive(subItem.path)) {
              setActiveItemId(subItem.id);
              // Ouvrir automatiquement le parent sur desktop
              if (!isMobile) {
                setExpandedItems(prev => ({ ...prev, [item.id]: true }));
              }
              foundItem = true;
            }
          });
        }
      });
      
      if (!foundItem) {
        setActiveItemId('');
      }
    };
    
    updateActiveItem();
  }, [location.pathname]);
  
  // Ouvrir/fermer le menu latéral
  const toggleDrawer = () => {
    setIsDrawerOpen(prevState => !prevState);
    
    // Annonce pour lecteurs d'écran
    setAnnounceNavigation(isDrawerOpen ? 
      t('a11y.menuClosed') : 
      t('a11y.menuOpened'));
  };
  
  // Développer/réduire un élément de menu avec sous-éléments
  const toggleMenuExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    
    // Annonce pour lecteurs d'écran
    setAnnounceNavigation(expandedItems[itemId] ? 
      t('a11y.submenuClosed', { menu: getItemLabelById(itemId) }) : 
      t('a11y.submenuOpened', { menu: getItemLabelById(itemId) }));
  };
  
  // Navigation vers une page
  const navigateTo = (path) => {
    navigate(path);
    setAnnounceNavigation(t('a11y.navigatedTo', { page: path }));
  };
  
  // Vérifie si un chemin est actif (pour la mise en évidence)
  const isPathActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Obtenir le libellé d'un élément par son ID
  const getItemLabelById = (itemId) => {
    for (const item of mainNavItems) {
      if (item.id === itemId) return item.label;
      if (item.subItems) {
        for (const subItem of item.subItems) {
          if (subItem.id === itemId) return subItem.label;
        }
      }
    }
    return '';
  };
  
  // Liste des éléments de navigation principale
  let mainNavItems = [
    { 
      id: 'home', 
      label: t('nav.home'), 
      path: '/', 
      icon: <HomeIcon />, 
      subItems: [] 
    },
    { 
      id: 'cols', 
      label: t('nav.cols'), 
      path: '/cols', 
      icon: <ColsIcon />, 
      subItems: [
        { id: 'cols-explorer', label: t('nav.colsExplorer'), path: '/cols/explorer' },
        { id: 'cols-map', label: t('nav.colsMap'), path: '/cols/map' },
        { id: 'cols-favorites', label: t('nav.colsFavorites'), path: '/cols/favorites' }
      ] 
    },
    { 
      id: 'training', 
      label: t('nav.training'), 
      path: '/training', 
      icon: <TrainingIcon />, 
      subItems: [
        { id: 'training-dashboard', label: t('nav.trainingDashboard'), path: '/training/dashboard' },
        { id: 'training-workouts', label: t('nav.workouts'), path: '/training/workouts' },
        { id: 'training-plans', label: t('nav.trainingPlans'), path: '/training/plans' },
        { id: 'training-strava-sync', label: 'Synchronisation Strava', path: '/strava/sync' },
        { id: 'training-analysis', label: t('nav.trainingAnalysis'), path: '/training/analysis' }
      ] 
    },
    { 
      id: 'nutrition', 
      label: t('nav.nutrition'), 
      path: '/nutrition', 
      icon: <NutritionIcon />, 
      subItems: [
        { id: 'nutrition-calculator', label: t('nav.nutritionCalculator'), path: '/nutrition/calculator' },
        { id: 'nutrition-meals', label: t('nav.nutritionMeals'), path: '/nutrition/meals' },
        { id: 'nutrition-diary', label: t('nav.nutritionDiary'), path: '/nutrition/diary' }
      ] 
    },
    { 
      id: 'routes', 
      label: t('nav.routes'), 
      path: '/routes', 
      icon: <RoutesIcon />, 
      subItems: [
        { id: 'routes-planner', label: t('nav.routesPlanner'), path: '/routes/planner' },
        { id: 'routes-discover', label: t('nav.routesDiscover'), path: '/routes/discover' }
      ] 
    },
    { 
      id: 'social', 
      label: t('nav.social'), 
      path: '/social', 
      icon: <SocialIcon />, 
      subItems: [
        { id: 'social-feed', label: t('nav.socialFeed'), path: '/social/feed' },
        { id: 'social-clubs', label: t('nav.socialClubs'), path: '/social/clubs' },
        { id: 'social-events', label: t('nav.socialEvents'), path: '/social/events' }
      ] 
    },
    { 
      id: 'challenges', 
      label: t('nav.challenges'), 
      path: '/challenges', 
      icon: <ChallengesIcon />,
      badge: <Badge badgeContent="NEW" color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />,
      subItems: [
        { id: 'challenges-seven-majors', label: t('nav.sevenMajors'), path: '/challenges/seven-majors' },
        { id: 'challenges-monthly', label: t('nav.monthlyChallenge'), path: '/challenges/monthly' }
      ] 
    },
    { 
      id: 'mountain', 
      label: 'Montagne', 
      path: '/mountain', 
      icon: <TerrainIcon />,
      badge: <Badge badgeContent="NEW" color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />,
      subItems: [
        { id: 'mountain-dashboard', label: 'Tableau de bord', path: '/mountain/dashboard' },
        { id: 'mountain-training', label: 'Entraînement par col', path: '/mountain/training' },
        { id: 'mountain-nutrition', label: 'Nutrition par col', path: '/mountain/nutrition' },
        { id: 'mountain-regional', label: 'Plans régionaux', path: '/mountain/regional' }
      ] 
    }
  ];
  
  // Ajouter le lien vers le tableau de bord d'administration si l'utilisateur est admin
  if (isAdmin()) {
    mainNavItems.push({
      id: 'admin',
      label: 'Administration',
      path: '/admin',
      icon: <AdminPanelSettingsIcon />,
      subItems: [
        { id: 'admin-api-monitoring', label: 'Monitoring API', path: '/admin/api-monitoring' }
      ]
    });
  }
  
  // Rendu d'un élément de menu
  const renderMenuItem = (item, isSubItem = false) => {
    const isActive = isPathActive(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.id];
    
    return (
      <React.Fragment key={item.id}>
        <ListItem 
          disablePadding
          sx={{ 
            display: 'block',
            mb: isSubItem ? 0 : 0.5
          }}
        >
          <ListItemButton
            onClick={() => {
              if (hasSubItems) {
                toggleMenuExpand(item.id);
              } else {
                navigateTo(item.path);
              }
            }}
            sx={{
              minHeight: 48,
              px: isSubItem ? 4 : 2.5,
              py: 1,
              borderRadius: isSubItem ? 0 : '8px',
              backgroundColor: isActive && !isSubItem ? 
                alpha(theme.palette.primary.main, 0.1) : 'transparent',
              color: isActive ? theme.palette.primary.main : 'inherit',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
            selected={isActive}
            // Attributs d'accessibilité
            aria-current={isActive ? 'page' : undefined}
            aria-expanded={hasSubItems ? isExpanded : undefined}
            aria-haspopup={hasSubItems ? 'true' : undefined}
            aria-label={hasSubItems 
              ? `${item.label}, ${isExpanded ? t('a11y.submenuOpen') : t('a11y.submenuClosed')}`
              : undefined
            }
            className="nav-focus-visible"
          >
            {item.icon && (
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: isActive ? theme.palette.primary.main : 'inherit'
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{
                fontSize: isSubItem ? 14 : 15,
                fontWeight: isActive ? 600 : 400
              }}
            />
            {item.badge && !isSubItem && item.badge}
            {hasSubItems && !isSubItem && (
              isExpanded ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
        
        {/* Sous-menu */}
        {hasSubItems && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List 
              component="div" 
              disablePadding 
              sx={{ mt: 0.5, mb: 1 }}
            >
              {item.subItems.map(subItem => renderMenuItem(subItem, true))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  // Fallback pendant le chargement du Header
  const HeaderFallback = (
    <Box sx={{ 
      height: 64, 
      bgcolor: 'background.paper',
      boxShadow: 2,
      display: 'flex',
      alignItems: 'center',
      px: 2
    }}>
      <Skeleton variant="rectangular" width={120} height={32} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1 }} />
      <Skeleton variant="circular" width={40} height={40} />
    </Box>
  );
  
  // Fonction pour gérer l'alpha de la couleur (extraite de MUI)
  function alpha(color, value) {
    return theme.palette.mode === 'dark'
      ? theme.palette.augmentColor({ color: { main: color } }).main
      : color.replace('rgb', 'rgba').replace(')', `, ${value})`);
  }
  
  return (
    <>
      {/* Skip to content link - accessible uniquement au clavier */}
      <Link 
        href="#main-content" 
        className="skip-to-content"
        aria-label={t('a11y.skipToContent')}
      >
        {t('a11y.skipToContent')}
      </Link>
      
      {/* Annonces pour lecteurs d'écran */}
      <div 
        className="visually-hidden" 
        aria-live="polite"
        role="status"
      >
        {announceNavigation}
      </div>
      
      {/* Header avec chargement paresseux */}
      <Suspense fallback={HeaderFallback}>
        <Header onMenuClick={toggleDrawer} />
      </Suspense>
      
      {/* Menu latéral (Drawer) */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={toggleDrawer}
        variant="temporary"
        sx={{
          '& .MuiDrawer-paper': {
            width: { xs: '85%', sm: 320 },
            boxSizing: 'border-box',
            border: 'none',
            boxShadow: 3
          },
        }}
        ModalProps={{
          keepMounted: true, // Améliore les performances sur mobile
        }}
        aria-label={t('a11y.mobileNavigation')}
      >
        <Box sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          px: 2,
          py: 1.5
        }}>
          <IconButton 
            onClick={toggleDrawer}
            aria-label={t('common.closeMenu')}
            className="nav-focus-visible"
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        <Box 
          sx={{ overflow: 'auto', p: 2 }}
          component="nav"
        >
          <List component="ul">
            {mainNavItems.map(item => renderMenuItem(item))}
          </List>
        </Box>
      </Drawer>
      
      {/* Navigation desktop sous le header (uniquement sur desktop) */}
      {!isMobile && (
        <Fade in={true}>
          <Box
            component="nav"
            sx={{
              display: 'flex',
              justifyContent: 'center',
              bgcolor: 'background.paper',
              boxShadow: isScrolled ? 1 : 0,
              transition: 'box-shadow 0.3s',
              zIndex: 20,
              position: 'sticky',
              top: 0
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                maxWidth: 'lg',
                width: '100%',
                overflow: 'auto',
                px: 2
              }}
              component="ul"
              role="menubar"
              aria-orientation="horizontal"
            >
              {mainNavItems.map((item) => (
                <Tooltip
                  key={item.id}
                  title={item.subItems.length > 0 ? t('common.clickToSeeSubmenu') : ''}
                  arrow
                >
                  <Box
                    component="div"
                    onClick={() => {
                      if (item.subItems.length > 0) {
                        toggleMenuExpand(item.id);
                      } else {
                        navigateTo(item.path);
                      }
                    }}
                    sx={{
                      p: 1.5,
                      pb: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: isPathActive(item.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      color: isPathActive(item.path) ? 'primary.main' : 'text.primary',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      borderLeft: isPathActive(item.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        '&::after': isPathActive(item.path) ? {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          backgroundColor: theme.palette.primary.main,
                          borderRadius: '3px 3px 0 0'
                        } : {}
                      }
                    }}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (item.subItems.length > 0) {
                          toggleMenuExpand(item.id);
                        } else {
                          navigateTo(item.path);
                        }
                      }
                    }}
                    role="menuitem"
                    aria-haspopup={item.subItems.length > 0 ? 'true' : undefined}
                    aria-expanded={item.subItems.length > 0 ? expandedItems[item.id] : undefined}
                    aria-current={isPathActive(item.path) ? 'page' : undefined}
                    className="nav-focus-visible"
                  >
                    {item.icon}
                    <Box sx={{ 
                      fontSize: '0.875rem', 
                      mt: 0.5,
                      fontWeight: isPathActive(item.path) ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      {item.label}
                      {item.badge && (
                        <Box component="span" sx={{ ml: 0.5, transform: 'scale(0.8)', display: 'inline-flex' }}>
                          {item.badge}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Tooltip>
              ))}
            </Box>
          </Box>
        </Fade>
      )}
      
      {/* Sous-menus pour desktop */}
      {!isMobile && (
        <Box>
          {mainNavItems.map((item) => (
            item.subItems.length > 0 && (
              <Collapse 
                key={`submenu-${item.id}`}
                in={expandedItems[item.id] || false} 
                timeout={300}
              >
                <Box
                  sx={{
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'center',
                    py: 1,
                    zIndex: 19,
                    position: 'relative'
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex',
                      maxWidth: 'lg',
                      width: '100%',
                      px: 2,
                      justifyContent: 'center'
                    }}
                    component="ul"
                    role="menu"
                  >
                    {item.subItems.map((subItem) => (
                      <Box
                        component="div"
                        onClick={() => navigateTo(subItem.path)}
                        sx={{
                          p: 1.5,
                          pl: 2,
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: isPathActive(subItem.path) ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                          color: isPathActive(subItem.path) ? 'primary.main' : 'text.secondary',
                          cursor: 'pointer',
                          position: 'relative',
                          borderLeft: isPathActive(subItem.path) ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            color: 'text.primary'
                          },
                          fontWeight: isPathActive(subItem.path) ? 600 : 400
                        }}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigateTo(subItem.path);
                          }
                        }}
                        role="menuitem"
                        aria-current={isPathActive(subItem.path) ? 'page' : undefined}
                        className="nav-focus-visible"
                      >
                        {subItem.label}
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Collapse>
            )
          ))}
        </Box>
      )}
    </>
  );
});

export default GlobalNavigation;
