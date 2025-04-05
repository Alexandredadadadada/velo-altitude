import React from 'react';
import './EnhancedNavigation.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import OptimizedImage from '../common/OptimizedImage';

const EnhancedNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('home');
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/enhancednavigation"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <nav className={`enhanced-navigation ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo">
          <a href="/">
            <OptimizedImage src="/images/logo-small.svg" alt="Grand Est Cyclisme" />
          </a>
        </div>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className="menu-icon"></span>
        </button>
        
        <ul className="nav-links">
          <li className={activeSection === 'home' ? 'active' : ''}>
            <a href="/" onClick={() => setActiveSection('home')}>Accueil</a>
          </li>
          <li className={activeSection === 'cols' ? 'active' : ''}>
            <a href="/cols" onClick={() => setActiveSection('cols')}>Cols</a>
          </li>
          <li className={activeSection === 'training' ? 'active' : ''}>
            <a href="/training" onClick={() => setActiveSection('training')}>Entraînement</a>
          </li>
          <li className={activeSection === 'nutrition' ? 'active' : ''}>
            <a href="/nutrition" onClick={() => setActiveSection('nutrition')}>Nutrition</a>
          </li>
          <li className={activeSection === 'coach' ? 'active' : ''}>
            <a href="/coach" onClick={() => setActiveSection('coach')}>Coach</a>
          </li>
          <li className={activeSection === 'routes' ? 'active' : ''}>
            <a href="/routes" onClick={() => setActiveSection('routes')}>Itinéraires</a>
          </li>
          <li className={activeSection === 'social' ? 'active' : ''}>
            <a href="/social" onClick={() => setActiveSection('social')}>Communauté</a>
          </li>
          <li className={activeSection === 'dashboard' ? 'active' : ''}>
            <a href="/dashboard" onClick={() => setActiveSection('dashboard')}>Dashboard</a>
          </li>
        </ul>
        
        <div className="nav-actions">
          <a href="/profile" className="profile-link">
            <span className="profile-icon"></span>
          </a>
          <select className="language-selector">
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="de">DE</option>
            <option value="it">IT</option>
            <option value="es">ES</option>
          </select>
        </div>
      </div>
    </nav>
  );
};

export default EnhancedNavigation;
