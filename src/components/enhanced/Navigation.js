import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaMapMarkedAlt, FaRoute, FaChartLine, FaHome, FaTrophy } from 'react-icons/fa';
import './Navigation.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

const Navigation = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/navigation"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <OptimizedImage src="/logo.png" alt="Velo-Altitude" />
          <span>Velo-Altitude</span>
        </Link>

        <div className="menu-icon" onClick={toggleMenu}>
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li>
            <Link to="/" className={isActive('/')} onClick={closeMenu}>
              <FaHome /> Accueil
            </Link>
          </li>
          <li>
            <Link to="/seven-majors" className={isActive('/seven-majors')} onClick={closeMenu}>
              <FaTrophy /> Les 7 Majeurs
            </Link>
          </li>
          <li>
            <Link to="/passes" className={isActive('/passes')} onClick={closeMenu}>
              <FaMapMarkedAlt /> Cols
            </Link>
          </li>
          <li>
            <Link to="/route-planner" className={isActive('/route-planner')} onClick={closeMenu}>
              <FaRoute /> Planificateur
            </Link>
          </li>
          <li>
            <Link to="/visualizations" className={isActive('/visualizations')} onClick={closeMenu}>
              <FaChartLine /> Visualisations
            </Link>
          </li>
          <li className="profile-link">
            <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
              <FaUser /> Profil
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
