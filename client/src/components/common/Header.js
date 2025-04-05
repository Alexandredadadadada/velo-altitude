import React, { useState, memo, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Container, 
  IconButton, 
  Menu, 
  MenuItem, 
  Divider, 
  Avatar, 
  useMediaQuery, 
  useTheme 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  AccountCircle, 
  ArrowDropDown, 
  DirectionsBike as BikeIcon,
  Apps as AppsIcon,
  Terrain as MountainIcon
} from '@mui/icons-material';
import ThemeToggle from './ThemeToggle';
import { AuthContext } from '../../context/AuthContext';
import Logo from './Logo';
import { brandConfig, getBrandName, getFullBrandName } from '../../config/branding';

/**
 * Composant d'en-tête principal de l'application
 * Contient le logo, la navigation principale, le sélecteur de langue, le bouton de thème et le menu utilisateur
 * Optimisé avec React.memo pour éviter les re-renders inutiles
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {Function} props.onMenuClick - Fonction appelée au clic sur le bouton de menu mobile
 */
const Header = memo(({ onMenuClick }) => {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // États pour les menus déroulants
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [anchorElLang, setAnchorElLang] = useState(null);
  
  // Gestion du menu utilisateur
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };
  
  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };
  
  // Gestion du menu de langue
  const handleOpenLangMenu = (event) => {
    setAnchorElLang(event.currentTarget);
  };
  
  const handleCloseLangMenu = () => {
    setAnchorElLang(null);
  };
  
  // Changement de langue
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    handleCloseLangMenu();
  };
  
  // Déconnexion
  const handleLogout = () => {
    logout();
    handleCloseUserMenu();
  };
  
  // Langue actuelle
  const currentLang = i18n.language || 'fr';
  
  // Liste des langues disponibles
  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
  ];
  
  return (
    <AppBar position="static" elevation={2} sx={{ bgcolor: 'background.paper', color: 'text.primary', zIndex: 1201 }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Bouton du menu (mobile) */}
          {isMobile && (
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label={t('common.openMenu')}
              onClick={onMenuClick}
              sx={{ mr: 1 }}
              data-testid="menu-button"
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo et titre */}
          <Box sx={{ display: 'flex', mr: 2, alignItems: 'center' }}>
            <Logo height={isMobile ? 32 : 40} />
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                ml: 1,
                fontWeight: 600,
                fontSize: isMobile ? '1.1rem' : '1.25rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              {isMobile ? 'VA' : getBrandName()}
            </Typography>
          </Box>

          {/* Espaceur qui prend tout l'espace disponible */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Partie droite: Thème, Langue, Menu Utilisateur */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Bouton de thème */}
            <ThemeToggle 
              size="small"
              lightTooltip={t('common.darkMode')}
              darkTooltip={t('common.lightMode')}
            />
            
            {/* Bouton de langue */}
            <Box sx={{ ml: 1 }}>
              <Button
                onClick={handleOpenLangMenu}
                color="inherit"
                endIcon={<ArrowDropDown />}
                size="small"
                aria-haspopup="true"
                aria-expanded={Boolean(anchorElLang)}
                aria-label={t('common.changeLanguage')}
              >
                {currentLang.toUpperCase()}
              </Button>
              <Menu
                anchorEl={anchorElLang}
                open={Boolean(anchorElLang)}
                onClose={handleCloseLangMenu}
                MenuListProps={{
                  'aria-labelledby': 'language-button',
                }}
              >
                {languages.map((lang) => (
                  <MenuItem 
                    key={lang.code} 
                    onClick={() => changeLanguage(lang.code)}
                    selected={currentLang === lang.code}
                  >
                    {lang.name}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            
            {/* Menu utilisateur */}
            <Box sx={{ ml: 1 }}>
              {isAuthenticated ? (
                <>
                  <Button
                    onClick={handleOpenUserMenu}
                    color="inherit"
                    startIcon={
                      user?.picture ? (
                        <Avatar 
                          src={user.picture} 
                          alt={user.name}
                          sx={{ width: 24, height: 24 }}
                        />
                      ) : (
                        <AccountCircle />
                      )
                    }
                    endIcon={<ArrowDropDown />}
                    size="small"
                    aria-haspopup="true"
                    aria-expanded={Boolean(anchorElUser)}
                    aria-label={t('common.userMenu')}
                  >
                    {!isMobile && (user?.name?.split(' ')[0] || t('auth.profile'))}
                  </Button>
                  <Menu
                    id="user-menu"
                    anchorEl={anchorElUser}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                    PaperProps={{
                      elevation: 2,
                      sx: { mt: 1.5 }
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem 
                      component={Link} 
                      to="/profile" 
                      onClick={handleCloseUserMenu}
                      selected={location.pathname === '/profile'}
                    >
                      <AccountCircle sx={{ mr: 1, fontSize: 20 }} />
                      {t('auth.profile')}
                    </MenuItem>
                    <MenuItem 
                      component={Link} 
                      to="/dashboard" 
                      onClick={handleCloseUserMenu}
                      selected={location.pathname === '/dashboard'}
                    >
                      <AppsIcon sx={{ mr: 1, fontSize: 20 }} />
                      {t('common.dashboard')}
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleLogout}>
                      {t('auth.logout')}
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  color="primary"
                  variant="contained"
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 1
                  }}
                >
                  {t('auth.login')}
                </Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
});

Header.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
};

export default Header;
