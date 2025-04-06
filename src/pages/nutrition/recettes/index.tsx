import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs,
  Link,
  Paper,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import Head from 'next/head';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { APIOrchestrator } from '../../../api/orchestration';
import RecipesGrid from '../../../components/nutrition/RecipesGrid';
import { Recipe } from '../../../types';
import NextLink from 'next/link';

const RecipesPage: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const apiOrchestrator = new APIOrchestrator();

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true);
      try {
        const data = await apiOrchestrator.getAllRecipes();
        setRecipes(data);
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement des recettes:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Si la recherche est vide, réinitialiser à la liste complète
      const allRecipes = await apiOrchestrator.getAllRecipes();
      setRecipes(allRecipes);
      return;
    }

    setLoading(true);
    try {
      const results = await apiOrchestrator.searchRecipes(query);
      setRecipes(results);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors de la recherche:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = async (category: string) => {
    if (category === 'all') {
      const allRecipes = await apiOrchestrator.getAllRecipes();
      setRecipes(allRecipes);
      return;
    }

    setLoading(true);
    try {
      const results = await apiOrchestrator.getRecipesByCategory(category as 'before' | 'during' | 'after' | 'special');
      setRecipes(results);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors du filtrage par catégorie:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = async (tag: string) => {
    setLoading(true);
    try {
      const results = await apiOrchestrator.getRecipesByTags([tag]);
      setRecipes(results);
    } catch (err) {
      setError(err as Error);
      console.error('Erreur lors du filtrage par tag:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Recettes pour Cyclistes | Nutrition | Velo-Altitude</title>
        <meta name="description" content="Découvrez plus de 100 recettes adaptées aux cyclistes pour optimiser votre nutrition avant, pendant et après l'effort." />
      </Head>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 4 }}
        >
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Accueil
          </Link>
          <Link component={NextLink} href="/nutrition" underline="hover" color="inherit">
            Nutrition
          </Link>
          <Typography color="text.primary">Recettes</Typography>
        </Breadcrumbs>

        {/* En-tête */}
        <Box mb={4}>
          <Typography variant="h3" component="h1" gutterBottom>
            Recettes pour Cyclistes
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Des recettes adaptées à vos besoins avant, pendant et après l'effort
          </Typography>
        </Box>

        {/* Information sur les recettes */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Notre collection de recettes spécialement conçues pour les cyclistes
          </Typography>
          
          <Typography variant="body1" paragraph>
            Découvrez plus de 100 recettes adaptées aux besoins énergétiques spécifiques des cyclistes. 
            Que vous prépariez une ascension de col difficile ou cherchiez à optimiser votre récupération, 
            vous trouverez des options nutritives et délicieuses pour chaque moment de votre entraînement.
          </Typography>
          
          <Box 
            display="flex" 
            flexWrap="wrap" 
            gap={2} 
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box flex="1" minWidth="200px">
              <Typography variant="subtitle2" gutterBottom color="info.main">
                Avant l'effort
              </Typography>
              <Typography variant="body2">
                Repas riches en glucides complexes pour vous fournir une énergie durable pendant vos ascensions.
              </Typography>
            </Box>
            
            <Box flex="1" minWidth="200px">
              <Typography variant="subtitle2" gutterBottom color="warning.main">
                Pendant l'effort
              </Typography>
              <Typography variant="body2">
                Collations et boissons facilement digestibles pour maintenir votre niveau d'énergie en altitude.
              </Typography>
            </Box>
            
            <Box flex="1" minWidth="200px">
              <Typography variant="subtitle2" gutterBottom color="success.main">
                Récupération
              </Typography>
              <Typography variant="body2">
                Repas équilibrés en protéines et glucides pour favoriser la récupération musculaire après l'effort.
              </Typography>
            </Box>
            
            <Box flex="1" minWidth="200px">
              <Typography variant="subtitle2" gutterBottom color="secondary.main">
                Spécial cols
              </Typography>
              <Typography variant="body2">
                Recettes adaptées aux défis spécifiques des cols avec des ingrédients disponibles en altitude.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Grille de recettes */}
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2 }}>
          {loading && !recipes.length ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              Erreur lors du chargement des recettes: {error.message}
            </Alert>
          ) : (
            <RecipesGrid 
              recipes={recipes} 
              loading={loading}
              error={error}
              onSearch={handleSearch}
              onCategoryChange={handleCategoryChange}
              onTagSelect={handleTagSelect}
            />
          )}
        </Paper>
      </Container>
    </>
  );
};

export default RecipesPage;
