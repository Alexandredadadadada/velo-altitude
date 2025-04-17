import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaUser, FaMapMarkedAlt, FaRoute, FaChartLine, FaHome, FaBug, FaMountain } from 'react-icons/fa';
import { brandConfig, getBrandName } from '../../config/branding';
import './Navigation.css';

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
    <nav role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/logo.png" alt={brandConfig.siteName} />
          <span>{brandConfig.siteName}</span>
        </Link>

        <div className="menu-icon" onClick={toggleMenu} aria-label="Open menu" aria-expanded={menuOpen} aria-controls="main-nav-links" tabIndex="0" role="button">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul id="main-nav-links" className={`nav-links ${menuOpen ? 'active' : ''}`} role="menubar">
          <li role="none">
            <Link to="/" className={isActive('/')} onClick={closeMenu} role="menuitem" aria-current={location.pathname === '/' ? 'page' : undefined}>
              <FaHome /> Accueil
            </Link>
          </li>
          <li role="none">
            <Link to="/passes" className={isActive('/passes')} onClick={closeMenu} role="menuitem" aria-current={location.pathname === '/passes' ? 'page' : undefined}>
              <FaMountain /> Cols
            </Link>
          </li>
          <li role="none">
            <Link to="/route-planner" className={isActive('/route-planner')} onClick={closeMenu} role="menuitem" aria-current={location.pathname === '/route-planner' ? 'page' : undefined}>
              <FaRoute /> Planificateur
            </Link>
          </li>
          <li role="none">
            <Link to="/visualizations" className={isActive('/visualizations')} onClick={closeMenu} role="menuitem" aria-current={location.pathname === '/visualizations' ? 'page' : undefined}>
              <FaChartLine /> Visualisations
            </Link>
          </li>
          <li role="none">
            <Link to="/profile" className={isActive('/profile')} onClick={closeMenu} role="menuitem" aria-current={location.pathname === '/profile' ? 'page' : undefined}>
              <FaUser /> Profil
            </Link>
          </li>
          <li className="footer-text" role="none presentation">
            <small>&copy; {new Date().getFullYear()} {brandConfig.siteName}</small>
            <small>{brandConfig.partnershipShort}</small>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
