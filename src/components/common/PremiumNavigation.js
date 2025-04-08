import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import './PremiumNavigation.css';

/**
 * Navigation principale premium avec effet glassmorphism
 * 
 * Interface de navigation moderne, élégante et réactive qui utilise
 * des effets visuels avancés pour une expérience utilisateur exceptionnelle
 */
const PremiumNavigation = ({
  logo,
  items = [],
  userProfile = null,
  isFloating = true,
  isTransparent = true,
  enableAnimations = true,
  onProfileClick,
  weatherService,
  notificationsCount = 0
}) => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Effet de changement au scroll
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Récupération des données météo (simulée si le service n'est pas disponible)
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (weatherService) {
        try {
          setLoading(true);
          const data = await weatherService.getCurrentWeather();
          setWeatherData(data);
        } catch (error) {
          console.error('Erreur de chargement des données météo:', error);
          // Données simulées en cas d'erreur
          setWeatherData({
            temperature: 18,
            condition: 'Ensoleillé',
            icon: '☀️'
          });
        } finally {
          setLoading(false);
        }
      } else {
        // Données simulées si pas de service
        setWeatherData({
          temperature: 18,
          condition: 'Ensoleillé',
          icon: '☀️'
        });
      }
    };

    fetchWeatherData();
  }, [weatherService]);

  // Variantes d'animation pour les éléments du menu
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: i => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: [0.6, 0.05, -0.01, 0.9]
      }
    }),
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  // Classes dynamiques pour la navigation
  const navClasses = [
    'premium-navigation',
    isFloating ? 'premium-navigation--floating' : '',
    isTransparent && !scrolled ? 'premium-navigation--transparent' : '',
    scrolled ? 'premium-navigation--scrolled' : '',
    'glass', 
    isTransparent && !scrolled ? 'glass--subtle' : 'glass--premium'
  ].filter(Boolean).join(' ');

  return (
    <>
      <nav className={navClasses}>
        <div className="premium-navigation__container">
          {/* Logo */}
          <Link to="/" className="premium-navigation__logo">
            {logo ? (
              <img src={logo} alt="Velo-Altitude" />
            ) : (
              <div className="premium-navigation__logo-text">Velo-Altitude</div>
            )}
          </Link>

          {/* Menu de navigation principal - Desktop */}
          <ul className="premium-navigation__menu">
            {items.map((item, index) => (
              <motion.li
                key={item.title}
                custom={index}
                initial={enableAnimations ? "hidden" : "visible"}
                animate="visible"
                variants={itemVariants}
                className="premium-navigation__item"
              >
                <Link
                  to={item.path}
                  className={`premium-navigation__link ${
                    location.pathname === item.path ? 'premium-navigation__link--active' : ''
                  }`}
                >
                  {item.icon && <span className="premium-navigation__icon">{item.icon}</span>}
                  <span className="premium-navigation__text">{item.title}</span>
                  {item.badge && (
                    <span className="premium-navigation__badge">{item.badge}</span>
                  )}
                </Link>
              </motion.li>
            ))}
          </ul>

          {/* Section droite avec météo, notifications et profil */}
          <div className="premium-navigation__actions">
            {/* Widget météo compact */}
            {weatherData && (
              <div className="premium-navigation__weather">
                <span className="premium-navigation__weather-icon">
                  {loading ? '⟳' : weatherData.icon}
                </span>
                <span className="premium-navigation__weather-temp">
                  {loading ? '--' : `${weatherData.temperature}°C`}
                </span>
              </div>
            )}

            {/* Notifications */}
            <button className="premium-navigation__notification-btn">
              <span className="premium-navigation__icon">🔔</span>
              {notificationsCount > 0 && (
                <span className="premium-navigation__notification-badge">
                  {notificationsCount}
                </span>
              )}
            </button>

            {/* Profil utilisateur */}
            {userProfile ? (
              <button
                className="premium-navigation__profile"
                onClick={onProfileClick}
              >
                {userProfile.avatar ? (
                  <img
                    src={userProfile.avatar}
                    alt={userProfile.name}
                    className="premium-navigation__avatar"
                  />
                ) : (
                  <div className="premium-navigation__avatar-placeholder">
                    {userProfile.name.charAt(0)}
                  </div>
                )}
              </button>
            ) : (
              <Link to="/login" className="premium-navigation__login button-glass button-glass--rounded">
                Connexion
              </Link>
            )}

            {/* Bouton menu mobile */}
            <button
              className={`premium-navigation__mobile-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </nav>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="premium-navigation__mobile-menu glass glass--premium"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="premium-navigation__mobile-items">
              {items.map((item, index) => (
                <motion.li
                  key={item.title}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={itemVariants}
                  className="premium-navigation__mobile-item"
                >
                  <Link
                    to={item.path}
                    className={`premium-navigation__mobile-link ${
                      location.pathname === item.path ? 'premium-navigation__mobile-link--active' : ''
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.icon && <span className="premium-navigation__mobile-icon">{item.icon}</span>}
                    <span>{item.title}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

PremiumNavigation.propTypes = {
  logo: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      path: PropTypes.string.isRequired,
      icon: PropTypes.node,
      badge: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    })
  ),
  userProfile: PropTypes.shape({
    name: PropTypes.string.isRequired,
    avatar: PropTypes.string
  }),
  isFloating: PropTypes.bool,
  isTransparent: PropTypes.bool,
  enableAnimations: PropTypes.bool,
  onProfileClick: PropTypes.func,
  weatherService: PropTypes.object,
  notificationsCount: PropTypes.number
};

export default PremiumNavigation;
