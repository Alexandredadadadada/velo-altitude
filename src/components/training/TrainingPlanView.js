import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdFitnessCenter, MdDirectionsBike, MdTimer, MdCalendarToday, 
  MdPersonOutline, MdTrendingUp, MdAdd, MdFilterList, MdSearch,
  MdSort, MdArrowUpward, MdArrowDownward, MdCheck
} from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { PremiumLoader } from '../common/PremiumLoader';
import './TrainingPlanView.css';

/**
 * Vue des plans d'entraînement
 * Affiche et permet de gérer les plans d'entraînement de l'utilisateur
 * 
 * @component
 */
export const TrainingPlanView = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainingPlans, setTrainingPlans] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: [],
    duration: [],
    focus: []
  });
  
  // Catégories des plans d'entraînement
  const categories = [
    { id: 'all', name: 'Tous les plans', icon: <MdFitnessCenter /> },
    { id: 'active', name: 'Plans actifs', icon: <MdDirectionsBike /> },
    { id: 'completed', name: 'Terminés', icon: <MdCheck /> },
    { id: 'recommended', name: 'Recommandés', icon: <MdTrendingUp /> },
    { id: 'favorites', name: 'Favoris', icon: <MdPersonOutline /> }
  ];
  
  // Options de filtre
  const filterOptions = {
    difficulty: [
      { id: 'beginner', name: 'Débutant' },
      { id: 'intermediate', name: 'Intermédiaire' },
      { id: 'advanced', name: 'Avancé' },
      { id: 'expert', name: 'Expert' }
    ],
    duration: [
      { id: 'short', name: '< 4 semaines' },
      { id: 'medium', name: '4-8 semaines' },
      { id: 'long', name: '8-12 semaines' },
      { id: 'extended', name: '> 12 semaines' }
    ],
    focus: [
      { id: 'endurance', name: 'Endurance' },
      { id: 'strength', name: 'Force' },
      { id: 'sprinting', name: 'Sprint' },
      { id: 'climbing', name: 'Montagne' },
      { id: 'recovery', name: 'Récupération' }
    ]
  };
  
  // Options de tri
  const sortOptions = [
    { id: 'newest', name: 'Date (plus récent)' },
    { id: 'oldest', name: 'Date (plus ancien)' },
    { id: 'difficulty', name: 'Difficulté' },
    { id: 'duration', name: 'Durée' },
    { id: 'popularity', name: 'Popularité' }
  ];
  
  // Animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  };
  
  // Charger les plans d'entraînement
  useEffect(() => {
    const fetchTrainingPlans = async () => {
      try {
        setLoading(true);
        
        // Dans une implémentation réelle, ceci utiliserait le Cache Service
        // et l'Authentication Middleware pour récupérer les plans d'entraînement
        
        // Simuler un chargement avec des données fictives
        setTimeout(() => {
          const mockTrainingPlans = generateMockTrainingPlans();
          setTrainingPlans(mockTrainingPlans);
          setLoading(false);
        }, 1500);
      } catch (err) {
        console.error('Erreur lors du chargement des plans:', err);
        setError('Impossible de charger les plans d\'entraînement. Veuillez réessayer.');
        setLoading(false);
      }
    };
    
    fetchTrainingPlans();
  }, []);
  
  // Générer des plans d'entraînement fictifs pour la démo
  const generateMockTrainingPlans = () => {
    const plans = [];
    const planNames = [
      'Plan de préparation col du Galibier',
      'Entraînement montagne pour débutants',
      'Préparation course de fond',
      'Plan de sprints intensifs',
      'Récupération active post-compétition',
      'Renforcement musculaire pour cyclistes',
      'Préparation Grand Fond Vosges',
      'Endurance longue distance',
      'Plan hybride route/VTT',
      'Intensité et récupération optimisée',
      'Plan 12 semaines pré-saison',
      'Programme d\'entraînement par intervalles'
    ];
    
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    const focuses = ['endurance', 'strength', 'sprinting', 'climbing', 'recovery'];
    
    for (let i = 0; i < 15; i++) {
      const planName = planNames[i % planNames.length];
      const durationWeeks = 4 + (i % 12);
      const difficulty = difficulties[i % difficulties.length];
      const focus = focuses[i % focuses.length];
      const workoutsCount = 3 + (i % 4);
      
      // Déterminer la catégorie de durée
      let durationCategory;
      if (durationWeeks < 4) durationCategory = 'short';
      else if (durationWeeks < 8) durationCategory = 'medium';
      else if (durationWeeks < 12) durationCategory = 'long';
      else durationCategory = 'extended';
      
      // Calculer une date de début fictive
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (i * 7));
      
      // Générer des jours d'entraînement aléatoires
      const trainingDays = Array(7).fill(false).map(() => Math.random() > 0.5);
      
      plans.push({
        id: `plan-${i + 1}`,
        name: planName,
        description: `Un programme d'entraînement conçu pour améliorer votre ${focus === 'endurance' ? 'endurance' : 
          focus === 'strength' ? 'force' : 
          focus === 'sprinting' ? 'capacité de sprint' : 
          focus === 'climbing' ? 'performance en montagne' : 'récupération'} 
          sur une période de ${durationWeeks} semaines.`,
        difficulty,
        durationCategory,
        durationWeeks,
        focus,
        workoutsPerWeek: workoutsCount,
        totalWorkouts: workoutsCount * durationWeeks,
        completedWorkouts: Math.floor(Math.random() * (workoutsCount * durationWeeks)),
        image: `https://source.unsplash.com/random/300x200/?cycling,${focus}`,
        creator: i < 5 ? 'Équipe Velo-Altitude' : 'Personnel',
        startDate: startDate.toISOString(),
        active: i < 3,
        completed: i >= 12,
        favorite: i % 4 === 0,
        popularity: 50 + Math.floor(Math.random() * 450),
        trainingDays,
        nextWorkout: i < 3 ? {
          date: new Date(Date.now() + (Math.floor(Math.random() * 3) * 86400000)).toISOString(),
          title: `Séance ${['d\'endurance', 'de fractionné', 'de récupération'][i % 3]}`,
          duration: 45 + (i * 15)
        } : null
      });
    }
    
    return plans;
  };
  
  // Filtrer les plans selon la catégorie active, les filtres et la recherche
  const filteredPlans = trainingPlans.filter(plan => {
    // Filtrer par catégorie
    if (activeCategory === 'active' && !plan.active) return false;
    if (activeCategory === 'completed' && !plan.completed) return false;
    if (activeCategory === 'favorites' && !plan.favorite) return false;
    if (activeCategory === 'recommended' && plan.creator !== 'Équipe Velo-Altitude') return false;
    
    // Filtrer par recherche
    if (
      searchQuery &&
      !plan.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !plan.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    
    // Filtrer par filtres sélectionnés
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(plan.difficulty)) {
      return false;
    }
    
    if (filters.duration.length > 0 && !filters.duration.includes(plan.durationCategory)) {
      return false;
    }
    
    if (filters.focus.length > 0 && !filters.focus.includes(plan.focus)) {
      return false;
    }
    
    return true;
  });
  
  // Trier les plans
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'newest':
        comparison = new Date(b.startDate) - new Date(a.startDate);
        break;
      case 'oldest':
        comparison = new Date(a.startDate) - new Date(b.startDate);
        break;
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        break;
      case 'duration':
        comparison = a.durationWeeks - b.durationWeeks;
        break;
      case 'popularity':
        comparison = b.popularity - a.popularity;
        break;
      default:
        comparison = 0;
    }
    
    // Inverser si décroissant
    return sortDirection === 'desc' ? comparison : -comparison;
  });
  
  // Changer la catégorie active
  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
  };
  
  // Gérer le changement du tri
  const handleSortChange = (option) => {
    if (sortOption === option) {
      // Inverser la direction si même option
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      // Réinitialiser à desc pour les nouvelles options
      setSortDirection('desc');
    }
    setShowSortOptions(false);
  };
  
  // Gérer l'ajout/retrait d'un filtre
  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters };
      
      if (updatedFilters[type].includes(value)) {
        // Retirer le filtre s'il est déjà sélectionné
        updatedFilters[type] = updatedFilters[type].filter(item => item !== value);
      } else {
        // Ajouter le filtre
        updatedFilters[type] = [...updatedFilters[type], value];
      }
      
      return updatedFilters;
    });
  };
  
  // Effacer tous les filtres
  const clearAllFilters = () => {
    setFilters({
      difficulty: [],
      duration: [],
      focus: []
    });
    setSearchQuery('');
  };
  
  // Formater une date pour l'affichage
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  // Calculer la progression d'un plan
  const calculateProgress = (completed, total) => {
    return Math.round((completed / total) * 100);
  };

  return (
    <div className="training-plan-view">
      <div className="training-header glass">
        <h1 className="training-title">Plans d'entraînement</h1>
        
        <div className="training-actions">
          <button className="training-add-button glass glass--button">
            <MdAdd />
            <span>Nouveau plan</span>
          </button>
        </div>
      </div>
      
      {/* Catégories */}
      <div className="training-categories glass">
        {categories.map(category => (
          <button
            key={category.id}
            className={`training-category-button ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(category.id)}
          >
            <span className="category-icon">{category.icon}</span>
            <span className="category-name">{category.name}</span>
          </button>
        ))}
      </div>
      
      {/* Recherche et filtres */}
      <div className="training-search-filter glass">
        <div className="training-search">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un plan d'entraînement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="search-clear" 
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
        
        <div className="training-filter-sort">
          <div className="filter-container">
            <button 
              className={`filter-button ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <MdFilterList />
              <span>Filtrer</span>
              {Object.values(filters).some(arr => arr.length > 0) && (
                <span className="filter-badge">
                  {Object.values(filters).reduce((count, arr) => count + arr.length, 0)}
                </span>
              )}
            </button>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  className="filter-dropdown glass"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="filter-section">
                    <h4 className="filter-heading">Difficulté</h4>
                    <div className="filter-options">
                      {filterOptions.difficulty.map(option => (
                        <label key={option.id} className="filter-option">
                          <input
                            type="checkbox"
                            checked={filters.difficulty.includes(option.id)}
                            onChange={() => handleFilterChange('difficulty', option.id)}
                          />
                          <span className="filter-option-label">{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="filter-section">
                    <h4 className="filter-heading">Durée</h4>
                    <div className="filter-options">
                      {filterOptions.duration.map(option => (
                        <label key={option.id} className="filter-option">
                          <input
                            type="checkbox"
                            checked={filters.duration.includes(option.id)}
                            onChange={() => handleFilterChange('duration', option.id)}
                          />
                          <span className="filter-option-label">{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="filter-section">
                    <h4 className="filter-heading">Focus</h4>
                    <div className="filter-options">
                      {filterOptions.focus.map(option => (
                        <label key={option.id} className="filter-option">
                          <input
                            type="checkbox"
                            checked={filters.focus.includes(option.id)}
                            onChange={() => handleFilterChange('focus', option.id)}
                          />
                          <span className="filter-option-label">{option.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="filter-actions">
                    <button 
                      className="filter-clear"
                      onClick={clearAllFilters}
                    >
                      Tout effacer
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="sort-container">
            <button 
              className={`sort-button ${showSortOptions ? 'active' : ''}`}
              onClick={() => setShowSortOptions(!showSortOptions)}
            >
              <MdSort />
              <span>Trier</span>
              {sortDirection === 'asc' ? <MdArrowUpward /> : <MdArrowDownward />}
            </button>
            
            <AnimatePresence>
              {showSortOptions && (
                <motion.div 
                  className="sort-dropdown glass"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {sortOptions.map(option => (
                    <button
                      key={option.id}
                      className={`sort-option ${sortOption === option.id ? 'active' : ''}`}
                      onClick={() => handleSortChange(option.id)}
                    >
                      {option.name}
                      {sortOption === option.id && (
                        sortDirection === 'desc' ? <MdArrowDownward /> : <MdArrowUpward />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Filtres actifs */}
      {Object.values(filters).some(arr => arr.length > 0) && (
        <div className="active-filters">
          <div className="active-filters-label">Filtres actifs:</div>
          <div className="active-filters-tags">
            {Object.entries(filters).map(([type, values]) => 
              values.map(value => {
                // Trouver le nom d'affichage pour la valeur du filtre
                const filterOption = filterOptions[type].find(option => option.id === value);
                return (
                  <div key={`${type}-${value}`} className="filter-tag glass">
                    <span>{filterOption.name}</span>
                    <button 
                      className="filter-tag-remove"
                      onClick={() => handleFilterChange(type, value)}
                    >
                      ✕
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <button 
            className="clear-filters"
            onClick={clearAllFilters}
          >
            Effacer tous les filtres
          </button>
        </div>
      )}
      
      {/* Liste des plans */}
      {loading ? (
        <div className="training-loading glass">
          <PremiumLoader size={60} />
          <p>Chargement des plans d'entraînement...</p>
        </div>
      ) : error ? (
        <div className="training-error glass">
          <p>{error}</p>
          <button 
            className="retry-button glass glass--button"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </div>
      ) : sortedPlans.length > 0 ? (
        <motion.div 
          className="training-plans-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {sortedPlans.map(plan => (
            <motion.div 
              key={plan.id}
              className="training-plan-card glass"
              variants={itemVariants}
            >
              <div className="plan-image-container">
                <img 
                  src={plan.image} 
                  alt={plan.name}
                  className="plan-image"
                />
                <div className="plan-difficulty">
                  <span className={`difficulty-badge difficulty-${plan.difficulty}`}>
                    {plan.difficulty === 'beginner' ? 'Débutant' :
                     plan.difficulty === 'intermediate' ? 'Intermédiaire' :
                     plan.difficulty === 'advanced' ? 'Avancé' : 'Expert'}
                  </span>
                </div>
                {plan.active && (
                  <div className="plan-active-badge">
                    <span>En cours</span>
                  </div>
                )}
                {plan.completed && (
                  <div className="plan-completed-badge">
                    <span>Terminé</span>
                  </div>
                )}
              </div>
              
              <div className="plan-content">
                <h3 className="plan-title">{plan.name}</h3>
                
                <div className="plan-meta">
                  <div className="plan-meta-item">
                    <MdCalendarToday />
                    <span>{plan.durationWeeks} semaines</span>
                  </div>
                  <div className="plan-meta-item">
                    <MdTimer />
                    <span>{plan.workoutsPerWeek}x / semaine</span>
                  </div>
                  <div className="plan-meta-item">
                    <MdDirectionsBike />
                    <span>Focus: {
                      plan.focus === 'endurance' ? 'Endurance' :
                      plan.focus === 'strength' ? 'Force' :
                      plan.focus === 'sprinting' ? 'Sprint' :
                      plan.focus === 'climbing' ? 'Montagne' : 'Récupération'
                    }</span>
                  </div>
                </div>
                
                <p className="plan-description">{plan.description}</p>
                
                {plan.active && plan.nextWorkout && (
                  <div className="plan-next-workout glass">
                    <div className="next-workout-label">Prochaine séance:</div>
                    <div className="next-workout-details">
                      <div className="next-workout-date">
                        {formatDate(plan.nextWorkout.date)}
                      </div>
                      <div className="next-workout-title">
                        {plan.nextWorkout.title}
                      </div>
                      <div className="next-workout-duration">
                        {plan.nextWorkout.duration} min
                      </div>
                    </div>
                  </div>
                )}
                
                {!plan.completed && (
                  <div className="plan-progress">
                    <div className="progress-label">
                      <span>Progression</span>
                      <span>{plan.completedWorkouts}/{plan.totalWorkouts} séances</span>
                    </div>
                    <div className="progress-bar-container">
                      <motion.div 
                        className="progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateProgress(plan.completedWorkouts, plan.totalWorkouts)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="plan-footer">
                  <span className="plan-creator">{plan.creator}</span>
                  <span className="plan-date">Début: {formatDate(plan.startDate)}</span>
                </div>
                
                <div className="plan-actions">
                  <button className="plan-action-button glass glass--button">
                    Voir le plan
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="training-empty glass">
          <p>Aucun plan d'entraînement ne correspond à vos critères.</p>
          {(Object.values(filters).some(arr => arr.length > 0) || searchQuery) && (
            <button 
              className="clear-filters-button glass glass--button"
              onClick={clearAllFilters}
            >
              Effacer les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
};
