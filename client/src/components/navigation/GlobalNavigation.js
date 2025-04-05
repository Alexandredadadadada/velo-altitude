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
const Breadcrumbs = lazy(() => import('../common/Breadcrumbs'));

// Import de la bibliothèque de motion pour les animations
import { motion } from 'framer-motion';

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
        { id: 'cols-catalog', label: t('nav.colsCatalog'), path: '/cols/catalog' },
        { id: 'cols-map', label: t('nav.colsMap'), path: '/cols/map' },
        { id: 'cols-3d', label: t('nav.cols3d'), path: '/cols/3d-visualization' },
        { id: 'cols-compare', label: t('nav.colsCompare'), path: '/cols/compare' },
        { id: 'cols-favorite', label: t('nav.colsFavorite'), path: '/cols/favorites' }
      ] 
    },
    { 
      id: 'major-challenge', 
      label: 'Les 7 Majeurs', 
      path: '/challenges/major', 
      icon: <TerrainIcon />,
      badge: <Badge badgeContent="POPULAIRE" color="success" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem' } }} />,
      subItems: [
        { id: 'major-overview', label: 'Vue d\'ensemble', path: '/challenges/major' },
        { id: 'major-custom', label: 'Créer mon défi', path: '/challenges/major/custom' },
        { id: 'major-community', label: 'Défis communautaires', path: '/challenges/major/community' },
        { id: 'major-leaderboard', label: 'Classements', path: '/challenges/major/leaderboard' }
      ] 
    },
    { 
      id: 'training', 
      label: t('nav.training'), 
      path: '/training', 
      icon: <TrainingIcon />, 
      subItems: [
        { id: 'training-plans', label: t('nav.trainingPlans'), path: '/training/plans' },
        { id: 'training-programs', label: t('nav.trainingPrograms'), path: '/training/programs' },
        { id: 'training-calendar', label: t('nav.trainingCalendar'), path: '/training/calendar' },
        { id: 'training-analytics', label: t('nav.trainingAnalytics'), path: '/training/analytics' },
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
        { id: 'nutrition-planner', label: t('nav.nutritionPlanner'), path: '/nutrition/planner' },
        { id: 'nutrition-recipes', label: t('nav.nutritionRecipes'), path: '/nutrition/recipes' },
        { id: 'nutrition-blog', label: t('nav.nutritionBlog'), path: '/nutrition/blog' },
        { id: 'nutrition-guides', label: t('nav.nutritionGuides'), path: '/nutrition/guides' }
      ] 
    },
    { 
      id: 'community', 
      label: t('nav.community'), 
      path: '/community', 
      icon: <SocialIcon />, 
      subItems: [
        { id: 'community-feed', label: 'Fil d\'activité', path: '/community/feed' },
        { id: 'community-groups', label: 'Groupes', path: '/community/groups' },
        { id: 'community-events', label: 'Événements', path: '/community/events' },
        { id: 'community-challenges', label: 'Défis partagés', path: '/community/challenges' },
        { id: 'community-forum', label: 'Forum', path: '/community/forum' }
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
  
  // Animation variants pour les menus
  const navItemVariants = {
    hidden: { opacity: 0, y: -5 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.3,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  const submenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: "auto",
      transition: {
        duration: 0.3,
        ease: "easeInOut",
        staggerChildren: 0.05
      }
    }
  };

  const submenuItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  // Génération du fil d'Ariane basé sur le chemin actuel
  const generateBreadcrumbs = () => {
    if (location.pathname === '/') return null;

    let paths = location.pathname.split('/').filter(path => path);
    let breadcrumbs = [];
    let currentPath = '';

    // Ajouter l'accueil au début
    breadcrumbs.push({
      path: '/',
      label: 'Accueil'
    });

    // Construire le fil d'Ariane pour les chemins intermédiaires
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      let label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
      
      // Rechercher un libellé plus précis dans les items de navigation
      mainNavItems.forEach(item => {
        if (item.path === currentPath) {
          label = item.label;
        }
        
        item.subItems.forEach(subItem => {
          if (subItem.path === currentPath) {
            label = subItem.label;
          }
        });
      });
      
      breadcrumbs.push({
        path: currentPath,
        label
      });
    });

    return breadcrumbs;
  };
  
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
        <Header 
          onMenuToggle={toggleDrawer} 
          isScrolled={isScrolled}
        />
      </Suspense>
      
      {/* Drawer pour mobile */}
      <Drawer
        anchor="left"
        open={isDrawerOpen && isMobile}
        onClose={() => setIsDrawerOpen(false)}
        sx={{
          zIndex: theme.zIndex.drawer + 2,
          '& .MuiDrawer-paper': { 
            width: { xs: '85%', sm: 300 },
            boxSizing: 'border-box'
          }
        }}
      >
        <Box
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 1
          }}
        >
          <Box 
            component="img" 
            src="/logo.png" 
            alt="Logo" 
            sx={{ height: 40 }}
          />
          <IconButton 
            onClick={() => setIsDrawerOpen(false)}
            aria-label={t('a11y.closeMenu')}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        
        <Divider />
        
        <List component="nav" aria-label={t('a11y.mainNavigation')}>
          {mainNavItems.map(item => renderMenuItem(item))}
        </List>
      </Drawer>
      
      {/* Navigation principale pour desktop */}
      {!isMobile && (
        <Fade in={true}>
          <Box 
            component={motion.nav}
            initial="hidden"
            animate="visible"
            sx={{
              position: 'sticky',
              top: 64, // Hauteur du header
              zIndex: 20,
              width: '100%',
              bgcolor: 'background.paper',
              boxShadow: isScrolled ? 2 : 0,
              transition: 'box-shadow 0.3s ease-in-out',
              borderBottom: `1px solid ${alpha(theme.palette.divider, isScrolled ? 0.8 : 0.5)}`
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                px: 2,
                py: 0.5
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  maxWidth: 'lg',
                  width: '100%',
                  justifyContent: 'space-between'
                }}
                role="menubar"
                component={motion.div}
                variants={submenuVariants}
              >
                {mainNavItems.map((item, index) => (
                  <Tooltip 
                    key={item.id} 
                    title={item.subItems.length > 0 ? `${item.label} (${item.subItems.length})` : item.label}
                    arrow
                    placement="bottom"
                    TransitionComponent={Fade}
                    TransitionProps={{ timeout: 300 }}
                  >
                    <Box
                      component={motion.div}
                      custom={index}
                      variants={navItemVariants}
                      whileHover="hover"
                      role="menuitem"
                      aria-haspopup={item.subItems.length > 0 ? 'true' : 'false'}
                      onClick={() => {
                        navigateTo(item.path);
                        if (item.subItems.length > 0) {
                          toggleMenuExpand(item.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          navigateTo(item.path);
                          if (item.subItems.length > 0) {
                            toggleMenuExpand(item.id);
                          }
                        }
                      }}
                      tabIndex={0}
                      sx={{ 
                        p: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        cursor: 'pointer',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          width: isPathActive(item.path) ? '70%' : '0%',
                          height: '3px',
                          bgcolor: 'primary.main',
                          transition: 'width 0.3s ease-in-out, left 0.3s ease-in-out',
                          transform: 'translateX(-50%)',
                          borderRadius: '3px 3px 0 0'
                        },
                        '&:hover::after': {
                          width: '70%'
                        },
                        color: isPathActive(item.path) ? 'primary.main' : 'text.primary'
                      }}
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
          </Box>
        </Fade>
      )}
      
      {/* Sous-menus pour desktop avec animation améliorée */}
      {!isMobile && (
        <Box>
          {mainNavItems.map((item) => (
            item.subItems.length > 0 && (
              <motion.div
                key={`submenu-${item.id}`}
                initial="hidden"
                animate={expandedItems[item.id] ? "visible" : "hidden"}
                variants={submenuVariants}
                style={{ overflow: 'hidden' }}
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
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}
                    component="ul"
                    role="menu"
                  >
                    {item.subItems.map((subItem, idx) => (
                      <motion.div
                        key={subItem.id}
                        variants={submenuItemVariants}
                        custom={idx}
                        whileHover={{ scale: 1.03 }}
                        style={{ margin: '0 8px' }}
                      >
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
                            borderRadius: '4px',
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
                      </motion.div>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )
          ))}
        </Box>
      )}
      
      {/* Fil d'Ariane */}
      <Suspense fallback={null}>
        <Box 
          sx={{ 
            py: 1, 
            px: 2, 
            display: 'flex', 
            justifyContent: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            bgcolor: alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(8px)'
          }}
        >
          <Box sx={{ maxWidth: 'lg', width: '100%' }}>
            <Breadcrumbs crumbs={generateBreadcrumbs()} />
          </Box>
        </Box>
      </Suspense>
    </>
  );
});

export default GlobalNavigation;
