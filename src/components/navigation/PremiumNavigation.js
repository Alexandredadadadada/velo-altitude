import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdHome, MdExplore, MdDirectionsBike, MdRestaurant, 
  MdSettings, MdPerson, MdNotifications, MdMenu, MdClose, 
  MdChevronRight, MdOutlineInfo, MdDashboard, MdEventNote
} from 'react-icons/md';
import './PremiumNavigation.css';

/**
 * Système de navigation principal premium avec animations fluides
 * et support pour mobile avec gestes tactiles
 * 
 * @component
 */
export const PremiumNavigation = ({
  user,
  notificationCount = 0,
  onNotificationsClick,
  onProfileClick,
  isMobileMenuOpen,
  setMobileMenuOpen
}) => {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef(null);
  const activeLinkRef = useRef(null);
  
  // Mise à jour de l'indicateur de section active
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Déterminer la section active en fonction du chemin
    const section = navItems.find(item => 
      currentPath === item.path || currentPath.startsWith(`${item.path}/`)
    );
    
    setActiveSection(section ? section.id : '');
    
    // Mettre à jour l'indicateur après que les refs sont disponibles
    setTimeout(() => updateIndicator(), 50);
  }, [location]);
  
  // Écouter le redimensionnement de la fenêtre pour ajuster l'indicateur
  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, []);
  
  // Mettre à jour la position et la taille de l'indicateur
  const updateIndicator = () => {
    if (!navRef.current || !activeLinkRef.current) return;
    
    const navRect = navRef.current.getBoundingClientRect();
    const activeRect = activeLinkRef.current.getBoundingClientRect();
    
    setIndicatorStyle({
      width: `${activeRect.width}px`,
      transform: `translateX(${activeRect.left - navRect.left}px)`
    });
  };
  
  // Items de navigation principaux
  const navItems = [
    { id: 'home', path: '/', label: 'Accueil', icon: <MdHome /> },
    { id: 'dashboard', path: '/dashboard', label: 'Tableau de bord', icon: <MdDashboard /> },
    { id: 'explore', path: '/explore', label: 'Explorer', icon: <MdExplore /> },
    { id: 'training', path: '/training', label: 'Entraînement', icon: <MdDirectionsBike /> },
    { id: 'nutrition', path: '/nutrition', label: 'Nutrition', icon: <MdRestaurant /> },
    { id: 'events', path: '/events', label: 'Événements', icon: <MdEventNote /> }
  ];
  
  // Animation pour le menu mobile
  const mobileMenuVariants = {
    closed: {
      x: '100%',
      transition: { 
        type: 'spring',
        stiffness: 400,
        damping: 40
      }
    },
    open: {
      x: '0%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.07,
        delayChildren: 0.2
      }
    }
  };
  
  // Animation pour les items du menu mobile
  const mobileItemVariants = {
    closed: { 
      opacity: 0,
      x: 50 
    },
    open: { 
      opacity: 1,
      x: 0 
    }
  };
  
  // Animation pour l'icône de l'utilisateur
  const userProfileVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 500,
        damping: 20
      }
    },
    tap: { scale: 0.95 }
  };
  
  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  // Gérer le bouton retour sur mobile
  const handleBackButton = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <>
      {/* Navigation principale (Desktop) */}
      <nav className="premium-navigation glass" ref={navRef}>
        <div className="premium-nav-logo">
          <img src="/logo.svg" alt="Velo-Altitude" />
        </div>
        
        <div className="premium-nav-main">
          <ul className="premium-nav-items">
            {navItems.map(item => (
              <li 
                key={item.id} 
                className={`premium-nav-item ${activeSection === item.id ? 'active' : ''}`}
                ref={activeSection === item.id ? activeLinkRef : null}
              >
                <Link to={item.path} className="premium-nav-link">
                  <span className="premium-nav-icon">{item.icon}</span>
                  <span className="premium-nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
            
            {/* Indicateur de lien actif */}
            <div 
              className="premium-nav-indicator"
              style={indicatorStyle}
            />
          </ul>
        </div>
        
        <div className="premium-nav-actions">
          {/* Bouton de notifications */}
          <button 
            className="premium-nav-action-button premium-nav-notification-button"
            onClick={onNotificationsClick}
            aria-label="Notifications"
          >
            <MdNotifications />
            {notificationCount > 0 && (
              <motion.span 
                className="premium-nav-notification-badge"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              >
                {notificationCount > 99 ? '99+' : notificationCount}
              </motion.span>
            )}
          </button>
          
          {/* Profil utilisateur */}
          {user ? (
            <motion.button 
              className="premium-nav-user-button"
              onClick={onProfileClick}
              variants={userProfileVariants}
              initial="initial"
              animate="animate"
              whileTap="tap"
            >
              {user.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt={user.name} 
                  className="premium-nav-user-image"
                />
              ) : (
                <div className="premium-nav-user-initials">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </motion.button>
          ) : (
            <Link to="/login" className="premium-nav-login-button glass glass--button">
              Connexion
            </Link>
          )}
          
          {/* Bouton de menu mobile */}
          <button 
            className="premium-nav-mobile-button"
            onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <MdMenu />
          </button>
        </div>
      </nav>
      
      {/* Navigation mobile (panneau latéral) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="premium-mobile-nav"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <div className="premium-mobile-nav-header">
              <button 
                className="premium-mobile-close-button"
                onClick={handleBackButton}
                aria-label="Fermer le menu"
              >
                <MdClose />
              </button>
              <div className="premium-mobile-logo">
                <img src="/logo.svg" alt="Velo-Altitude" />
              </div>
            </div>
            
            {user && (
              <motion.div 
                className="premium-mobile-user-section"
                variants={mobileItemVariants}
              >
                <div className="premium-mobile-user-info">
                  {user.profileImage ? (
                    <img 
                      src={user.profileImage} 
                      alt={user.name} 
                      className="premium-mobile-user-image"
                    />
                  ) : (
                    <div className="premium-mobile-user-initials">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="premium-mobile-user-details">
                    <h3 className="premium-mobile-user-name">{user.name}</h3>
                    <p className="premium-mobile-user-email">{user.email}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="premium-mobile-nav-main">
              <ul className="premium-mobile-nav-items">
                {navItems.map((item, index) => (
                  <motion.li 
                    key={item.id}
                    variants={mobileItemVariants}
                    custom={index}
                  >
                    <Link 
                      to={item.path} 
                      className={`premium-mobile-nav-link ${activeSection === item.id ? 'active' : ''}`}
                    >
                      <span className="premium-mobile-nav-icon">{item.icon}</span>
                      <span className="premium-mobile-nav-label">{item.label}</span>
                      <MdChevronRight className="premium-mobile-nav-arrow" />
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
            
            <div className="premium-mobile-nav-secondary">
              <ul className="premium-mobile-nav-items">
                <motion.li variants={mobileItemVariants}>
                  <Link to="/settings" className="premium-mobile-nav-link">
                    <span className="premium-mobile-nav-icon"><MdSettings /></span>
                    <span className="premium-mobile-nav-label">Paramètres</span>
                    <MdChevronRight className="premium-mobile-nav-arrow" />
                  </Link>
                </motion.li>
                
                <motion.li variants={mobileItemVariants}>
                  <Link to="/help" className="premium-mobile-nav-link">
                    <span className="premium-mobile-nav-icon"><MdOutlineInfo /></span>
                    <span className="premium-mobile-nav-label">Aide & Support</span>
                    <MdChevronRight className="premium-mobile-nav-arrow" />
                  </Link>
                </motion.li>
              </ul>
            </div>
            
            {user && (
              <motion.div 
                className="premium-mobile-nav-footer"
                variants={mobileItemVariants}
              >
                <button className="premium-mobile-logout-button">
                  Déconnexion
                </button>
                <p className="premium-mobile-version">Velo-Altitude v2.5.0</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay pour fermer le menu mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            className="premium-mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Fil d'Ariane / Indicateur de contexte */}
      <div className="premium-nav-breadcrumb glass">
        <div className="premium-breadcrumb-container">
          <Breadcrumb />
        </div>
      </div>
    </>
  );
};

PremiumNavigation.propTypes = {
  user: PropTypes.object,
  notificationCount: PropTypes.number,
  onNotificationsClick: PropTypes.func,
  onProfileClick: PropTypes.func,
  isMobileMenuOpen: PropTypes.bool.isRequired,
  setMobileMenuOpen: PropTypes.func.isRequired
};

PremiumNavigation.defaultProps = {
  notificationCount: 0,
  onNotificationsClick: () => {},
  onProfileClick: () => {}
};

/**
 * Composant de fil d'Ariane pour indiquer le contexte de navigation
 * 
 * @component
 */
export const Breadcrumb = () => {
  const location = useLocation();
  const [crumbs, setCrumbs] = useState([]);
  
  useEffect(() => {
    // Créer les éléments du fil d'Ariane à partir du chemin
    const pathParts = location.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      setCrumbs([{ label: 'Accueil', path: '/' }]);
      return;
    }
    
    const breadcrumbs = [];
    let currentPath = '';
    
    // Accueil comme premier élément
    if (pathParts[0] !== 'home') {
      breadcrumbs.push({ label: 'Accueil', path: '/' });
    }
    
    // Générer les parties du chemin
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      
      // Formater le label (première lettre en majuscule, remplacer les tirets par des espaces)
      let label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      
      // Cas spéciaux pour des routes spécifiques
      switch (part) {
        case 'dashboard':
          label = 'Tableau de bord';
          break;
        case 'explore':
          label = 'Explorer';
          break;
        case 'training':
          label = 'Entraînement';
          break;
        case 'nutrition':
          label = 'Nutrition';
          break;
        case 'settings':
          label = 'Paramètres';
          break;
        default:
          break;
      }
      
      breadcrumbs.push({ label, path: currentPath });
    });
    
    setCrumbs(breadcrumbs);
  }, [location]);
  
  if (crumbs.length <= 1 && location.pathname === '/') {
    return null; // Ne pas afficher le fil d'Ariane sur la page d'accueil
  }
  
  return (
    <div className="premium-breadcrumb">
      {crumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="premium-breadcrumb-separator">
              <MdChevronRight />
            </span>
          )}
          
          {index === crumbs.length - 1 ? (
            <span className="premium-breadcrumb-current">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="premium-breadcrumb-link">
              {crumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
