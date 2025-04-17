/**
 * Composant de page de catégorie pour Velo-Altitude
 * 
 * Ce composant génère des pages d'index optimisées pour chaque catégorie principale,
 * avec filtres avancés, pagination SEO et contenu riche.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useHistory } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Grid, 
  Box, 
  Divider,
  useMediaQuery
} from '@material-ui/core';
import { makeStyles, useTheme } from '@material-ui/core/styles';

// Composants personnalisés
import Breadcrumbs from '../common/Breadcrumbs';
import CategoryFilters from './CategoryFilters';
import ContentCard from './ContentCard';
import SEOPagination from './SEOPagination';
import CategoryHeader from './CategoryHeader';
import CategoryFooter from './CategoryFooter';
import RelatedContent from '../common/RelatedContent';
import LoadingIndicator from '../common/LoadingIndicator';

// Utilitaires et services
import { fetchCategoryData } from '../../services/dataService';
import { getCategoryConfig } from '../../utils/categoryConfig';
import { useLanguage } from '../../contexts/LanguageContext';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(6),
  },
  mainContent: {
    marginTop: theme.spacing(4),
  },
  filtersContainer: {
    marginBottom: theme.spacing(4),
  },
  resultsGrid: {
    marginTop: theme.spacing(2),
  },
  noResults: {
    textAlign: 'center',
    padding: theme.spacing(4),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  paginationContainer: {
    marginTop: theme.spacing(4),
    display: 'flex',
    justifyContent: 'center',
  },
  sortSelect: {
    minWidth: 200,
    marginLeft: 'auto',
  },
  topControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  countLabel: {
    color: theme.palette.text.secondary,
  }
}));

/**
 * Composant principal pour les pages de catégorie
 */
const CategoryPage = () => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { language, translations } = useLanguage();
  const { category, subcategory } = useParams();
  const location = useLocation();
  const history = useHistory();
  
  // État local
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('featured');
  
  // Configuration de la catégorie
  const categoryConfig = getCategoryConfig(category);
  const pageSize = 12;
  
  // Récupérer les paramètres de l'URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    
    // Extraire la page courante
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(parseInt(page, 10));
    } else {
      setCurrentPage(1);
    }
    
    // Extraire le tri
    const sort = searchParams.get('sort');
    if (sort) {
      setSortBy(sort);
    }
    
    // Extraire les filtres
    const newFilters = {};
    
    // Parcourir tous les filtres possibles pour cette catégorie
    if (categoryConfig && categoryConfig.filters) {
      categoryConfig.filters.forEach(filter => {
        const value = searchParams.get(filter.key);
        if (value) {
          // Pour les filtres à valeurs multiples (séparés par des virgules)
          if (filter.multiSelect) {
            newFilters[filter.key] = value.split(',');
          } else {
            newFilters[filter.key] = value;
          }
        }
      });
    }
    
    setActiveFilters(newFilters);
  }, [location.search, categoryConfig]);
  
  // Charger les données
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        const data = await fetchCategoryData(category, subcategory);
        setItems(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError(err.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [category, subcategory]);
  
  // Appliquer les filtres aux items
  const filteredItems = useMemo(() => {
    if (!items.length) return [];
    
    return items.filter(item => {
      // Vérifier tous les filtres actifs
      for (const [key, value] of Object.entries(activeFilters)) {
        // Si le filtre a plusieurs valeurs (tableaux)
        if (Array.isArray(value)) {
          // Si l'item n'a pas cette propriété ou si aucune valeur ne correspond
          if (!item[key] || !value.some(v => 
            Array.isArray(item[key]) 
              ? item[key].includes(v) 
              : item[key] === v
          )) {
            return false;
          }
        } 
        // Pour les filtres numériques avec min/max
        else if (key.endsWith('_min') && item[key.replace('_min', '')] < value) {
          return false;
        } 
        else if (key.endsWith('_max') && item[key.replace('_max', '')] > value) {
          return false;
        }
        // Pour les filtres textuels simples
        else if (item[key] !== value && key !== 'search') {
          return false;
        }
        // Pour la recherche textuelle
        else if (key === 'search' && value && !itemMatchesSearch(item, value)) {
          return false;
        }
      }
      
      return true;
    });
  }, [items, activeFilters]);
  
  // Trier les items
  const sortedItems = useMemo(() => {
    if (!filteredItems.length) return [];
    
    const itemsCopy = [...filteredItems];
    
    switch (sortBy) {
      case 'name_asc':
        return itemsCopy.sort((a, b) => 
          (a.name[language] || a.name).localeCompare(b.name[language] || b.name)
        );
      case 'name_desc':
        return itemsCopy.sort((a, b) => 
          (b.name[language] || b.name).localeCompare(a.name[language] || a.name)
        );
      case 'date_desc':
        return itemsCopy.sort((a, b) => 
          new Date(b.last_updated || b.createdAt) - new Date(a.last_updated || a.createdAt)
        );
      case 'date_asc':
        return itemsCopy.sort((a, b) => 
          new Date(a.last_updated || a.createdAt) - new Date(b.last_updated || b.createdAt)
        );
      case 'altitude_desc':
        return itemsCopy.sort((a, b) => (b.altitude || 0) - (a.altitude || 0));
      case 'altitude_asc':
        return itemsCopy.sort((a, b) => (a.altitude || 0) - (b.altitude || 0));
      case 'difficulty_desc':
        return itemsCopy.sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
      case 'difficulty_asc':
        return itemsCopy.sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
      case 'featured':
      default:
        return itemsCopy.sort((a, b) => (b.featured || 0) - (a.featured || 0));
    }
  }, [filteredItems, sortBy, language]);
  
  // Calculer les items paginés
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, currentPage, pageSize]);
  
  // Fonction pour vérifier si un item correspond à la recherche texte
  const itemMatchesSearch = (item, searchValue) => {
    const searchLower = searchValue.toLowerCase();
    
    // Chercher dans le nom (multilingue ou simple)
    const name = typeof item.name === 'object' 
      ? Object.values(item.name).join(' ') 
      : item.name || '';
    
    if (name.toLowerCase().includes(searchLower)) return true;
    
    // Chercher dans la description (multilingue ou simple)
    const description = typeof item.description === 'object'
      ? Object.values(item.description).join(' ')
      : item.description || '';
      
    if (description.toLowerCase().includes(searchLower)) return true;
    
    // Chercher dans les tags s'ils existent
    if (item.tags && Array.isArray(item.tags)) {
      if (item.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        return true;
      }
    }
    
    return false;
  };
  
  // Mettre à jour l'URL avec les filtres et la pagination
  const updateUrlParams = (filters, page, sort) => {
    const searchParams = new URLSearchParams();
    
    // Ajouter les paramètres de filtres
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length) {
          searchParams.set(key, value.join(','));
        }
      } else if (value) {
        searchParams.set(key, value);
      }
    });
    
    // Ajouter la page si > 1
    if (page > 1) {
      searchParams.set('page', page.toString());
    }
    
    // Ajouter le tri si différent de la valeur par défaut
    if (sort !== 'featured') {
      searchParams.set('sort', sort);
    }
    
    // Mettre à jour l'URL sans rafraîchir la page
    const newUrl = `${location.pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    history.push(newUrl);
  };
  
  // Gestionnaires d'événements
  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1); // Retour à la première page
    updateUrlParams(newFilters, 1, sortBy);
  };
  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateUrlParams(activeFilters, newPage, sortBy);
    
    // Scroll vers le haut de la page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateUrlParams(activeFilters, currentPage, newSort);
  };
  
  // Déterminer le titre de la page
  const getPageTitle = () => {
    // Si une sous-catégorie est spécifiée
    if (subcategory && categoryConfig) {
      const subcategoryName = categoryConfig.subcategories?.find(
        sub => sub.key === subcategory
      )?.label[language];
      
      if (subcategoryName) {
        return `${categoryConfig.label[language]} - ${subcategoryName}`;
      }
    }
    
    // Sinon, retourner le nom de la catégorie
    return categoryConfig?.label[language] || category;
  };
  
  // Afficher un message de chargement
  if (loading) {
    return (
      <Container className={classes.root}>
        <Breadcrumbs currentPageTitle={getPageTitle()} language={language} />
        <LoadingIndicator />
      </Container>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <Container className={classes.root}>
        <Breadcrumbs currentPageTitle={getPageTitle()} language={language} />
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error">
            {translations.errorLoading || 'Erreur lors du chargement des données'}
          </Typography>
          <Typography>{error}</Typography>
        </Box>
      </Container>
    );
  }
  
  return (
    <div className={classes.root}>
      <Breadcrumbs currentPageTitle={getPageTitle()} language={language} />
      
      <Container>
        {/* En-tête de la catégorie avec introduction */}
        <CategoryHeader 
          category={category} 
          subcategory={subcategory}
          language={language}
          itemCount={filteredItems.length}
        />
        
        {/* Filtres */}
        <div className={classes.filtersContainer}>
          <CategoryFilters 
            category={category}
            filters={categoryConfig?.filters || []}
            activeFilters={activeFilters}
            onFilterChange={handleFilterChange}
            onSortChange={handleSortChange}
            currentSort={sortBy}
            sortOptions={categoryConfig?.sortOptions || []}
            language={language}
          />
        </div>
        
        {/* Contrôles supérieurs (compteur et tri sur mobile) */}
        <div className={classes.topControls}>
          <Typography variant="body2" className={classes.countLabel}>
            {filteredItems.length} {filteredItems.length === 1 
              ? translations.result || 'résultat' 
              : translations.results || 'résultats'}
          </Typography>
          
          {isMobile && categoryConfig?.sortOptions && (
            <div className={classes.sortSelect}>
              {/* Version mobile du tri */}
            </div>
          )}
        </div>
        
        {/* Grille de résultats */}
        <div className={classes.mainContent}>
          {paginatedItems.length > 0 ? (
            <>
              <Grid container spacing={3} className={classes.resultsGrid}>
                {paginatedItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.id}>
                    <ContentCard 
                      item={item} 
                      category={category}
                      language={language}
                      subcategory={item._subCategory || subcategory}
                    />
                  </Grid>
                ))}
              </Grid>
              
              {/* Pagination */}
              <div className={classes.paginationContainer}>
                <SEOPagination 
                  currentPage={currentPage}
                  totalItems={filteredItems.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  category={category}
                  subcategory={subcategory}
                  baseUrl={location.pathname}
                  language={language}
                />
              </div>
            </>
          ) : (
            <div className={classes.noResults}>
              <Typography variant="h6">
                {translations.noResults || 'Aucun résultat trouvé'}
              </Typography>
              <Typography>
                {translations.tryAdjustingFilters || 'Essayez d\'ajuster vos filtres'}
              </Typography>
            </div>
          )}
        </div>
        
        <Divider style={{ margin: '2rem 0' }} />
        
        {/* Contenu connexe */}
        <RelatedContent 
          category={category}
          subcategory={subcategory}
          currentItems={items.map(item => item.id)}
          language={language}
        />
        
        {/* Pied de page de la catégorie avec FAQ et contenu riche */}
        <CategoryFooter 
          category={category} 
          subcategory={subcategory}
          language={language}
        />
      </Container>
    </div>
  );
};

export default CategoryPage;
