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
    <nav className="navigation">
      <div className="nav-container">
        <Link to="/" className="logo">
          <img src="/logo.png" alt={brandConfig.siteName} />
          <span>{brandConfig.siteName}</span>
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
            <Link to="/passes" className={isActive('/passes')} onClick={closeMenu}>
              <FaMountain /> Cols
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
          <li>
            <Link to="/profile" className={isActive('/profile')} onClick={closeMenu}>
              <FaUser /> Profil
            </Link>
          </li>
          <li className="footer-text">
            <small>&copy; {new Date().getFullYear()} {brandConfig.siteName}</small>
            <small>{brandConfig.partnershipShort}</small>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;
