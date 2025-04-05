import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon
} from '@mui/icons-material';
import './EnhancedNavigation.css';

const EnhancedNavigation = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('home');
  const [openSubmenu, setOpenSubmenu] = React.useState(null);
  const location = useLocation();
  
  React.useEffect(() => {
    // Déterminer la section active basée sur l'URL
    const path = location.pathname;
    if (path === '/') setActiveSection('home');
    else if (path.startsWith('/cols')) setActiveSection('cols');
    else if (path.startsWith('/training')) setActiveSection('training');
    else if (path.startsWith('/nutrition')) setActiveSection('nutrition');
    else if (path.startsWith('/coach')) setActiveSection('coach');
    else if (path.startsWith('/routes')) setActiveSection('routes');
    else if (path.startsWith('/social')) setActiveSection('social');
    else if (path.startsWith('/dashboard')) setActiveSection('dashboard');
  }, [location]);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleSubmenu = (submenu) => {
    if (openSubmenu === submenu) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(submenu);
    }
  };
  
  const submenus = {
    nutrition: [
      { label: 'Dashboard Nutrition', path: '/nutrition/dashboard', new: true },
      { label: 'Galerie de Recettes HD', path: '/nutrition/recipes', new: true },
      { label: 'Calculateur de Macros', path: '/nutrition/macro-calculator' },
      { label: 'Planificateur de Repas', path: '/nutrition/meal-planner' },
      { label: 'Suivi Nutritionnel', path: '/nutrition/tracker' }
    ]
  };
  
  return (
    <nav className={`enhanced-navigation ${isMenuOpen ? 'menu-open' : ''}`}>
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/">
            <img src="/images/logo-small.svg" alt="Velo-Altitude" />
          </Link>
        </div>
        
        <button className="menu-toggle" onClick={toggleMenu}>
          <span className="menu-icon"></span>
        </button>
        
        <ul className="nav-links">
          <li className={activeSection === 'home' ? 'active' : ''}>
            <Link to="/" onClick={() => setActiveSection('home')}>Accueil</Link>
          </li>
          <li className={activeSection === 'cols' ? 'active' : ''}>
            <Link to="/cols" onClick={() => setActiveSection('cols')}>Cols</Link>
          </li>
          <li className={activeSection === 'training' ? 'active' : ''}>
            <Link to="/training" onClick={() => setActiveSection('training')}>Entraînement</Link>
          </li>
          <li 
            className={`has-submenu ${activeSection === 'nutrition' ? 'active' : ''} ${openSubmenu === 'nutrition' ? 'submenu-open' : ''}`}
            onClick={() => toggleSubmenu('nutrition')}
          >
            <span className="submenu-toggle">
              Nutrition
              {openSubmenu === 'nutrition' ? <ArrowUpIcon fontSize="small" /> : <ArrowDownIcon fontSize="small" />}
            </span>
            <ul className="submenu">
              {submenus.nutrition.map((item, index) => (
                <li key={index}>
                  <Link to={item.path}>
                    {item.label}
                    {item.new && <span className="new-badge">Nouveau</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
          <li className={activeSection === 'coach' ? 'active' : ''}>
            <Link to="/coach" onClick={() => setActiveSection('coach')}>Coach</Link>
          </li>
          <li className={activeSection === 'routes' ? 'active' : ''}>
            <Link to="/routes" onClick={() => setActiveSection('routes')}>Itinéraires</Link>
          </li>
          <li className={activeSection === 'social' ? 'active' : ''}>
            <Link to="/social" onClick={() => setActiveSection('social')}>Communauté</Link>
          </li>
          <li className={activeSection === 'dashboard' ? 'active' : ''}>
            <Link to="/dashboard" onClick={() => setActiveSection('dashboard')}>Dashboard</Link>
          </li>
        </ul>
        
        <div className="nav-actions">
          <Link to="/profile" className="profile-link">
            <span className="profile-icon"></span>
          </Link>
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
