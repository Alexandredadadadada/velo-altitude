/**
 * FoodList - Section du guide présentant les aliments recommandés pour les événements longue distance
 */
import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, InputAdornment,
  Chip, Card, CardContent, CardMedia, Divider, List,
  ListItem, ListItemText, ListItemIcon, Button, IconButton,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { 
  Search, RestaurantMenu, LocalFireDepartment, AccessTime,
  FilterList, Bookmark, BookmarkBorder, ArrowForward,
  FiberManualRecord
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Styles personnalisés
const SectionPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

const FoodCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[4],
  },
}));

const FoodMedia = styled(CardMedia)(({ theme }) => ({
  height: 140,
}));

const TagChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
}));

const MacroBox = styled(Box)(({ theme, type }) => {
  const colors = {
    carbs: theme.palette.warning.light,
    protein: theme.palette.success.light,
    fat: theme.palette.info.light,
    fiber: theme.palette.secondary.light
  };
  
  return {
    backgroundColor: colors[type] || theme.palette.grey[100],
    color: theme.palette.getContrastText(colors[type] || theme.palette.grey[100]),
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0.5, 1),
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(1),
  };
});

/**
 * Section présentant les aliments recommandés pour les événements longue distance
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.recommendations - Contenu de la section
 */
const FoodList = ({ recommendations = {} }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterTiming, setFilterTiming] = useState('all');
  const [favorites, setFavorites] = useState([]);
  
  // Données de secours en cas de contenu manquant
  const defaultRecommendations = {
    foods: [
      {
        name: "Banane",
        description: "Fruit riche en potassium, facile à digérer et transportable.",
        type: "fruit",
        timing: ["before", "during"],
        macros: {
          calories: 105,
          carbs: 27,
          protein: 1.3,
          fat: 0.4,
          fiber: 3.1
        },
        benefits: [
          "Énergie rapide",
          "Riche en potassium",
          "Anti-crampes"
        ],
        image: "/images/nutrition/foods/banana.jpg",
        tags: ["facile à digérer", "pratique", "naturel"]
      },
      {
        name: "Barres énergétiques maison",
        description: "Concentré d'énergie personnalisable selon vos besoins et préférences.",
        type: "bars",
        timing: ["before", "during"],
        macros: {
          calories: 220,
          carbs: 35,
          protein: 5,
          fat: 7,
          fiber: 2.5
        },
        benefits: [
          "Énergie soutenue",
          "Personnalisable",
          "Économique"
        ],
        image: "/images/nutrition/foods/energy-bars.jpg",
        tags: ["durable", "pratique", "complet"]
      },
      {
        name: "Gels énergétiques",
        description: "Source de glucides rapides, idéale pendant l'effort intense.",
        type: "gels",
        timing: ["during"],
        macros: {
          calories: 100,
          carbs: 25,
          protein: 0,
          fat: 0,
          fiber: 0
        },
        benefits: [
          "Absorption ultra-rapide",
          "Facile à consommer",
          "Compact"
        ],
        image: "/images/nutrition/foods/energy-gel.jpg",
        tags: ["rapide", "pratique", "intense"]
      },
      {
        name: "Boisson isotonique",
        description: "Hydratation optimale avec électrolytes et glucides.",
        type: "drinks",
        timing: ["during"],
        macros: {
          calories: 60,
          carbs: 15,
          protein: 0,
          fat: 0,
          fiber: 0
        },
        benefits: [
          "Hydratation efficace",
          "Apport en électrolytes",
          "Énergie liquide"
        ],
        image: "/images/nutrition/foods/isotonic-drink.jpg",
        tags: ["hydratation", "électrolytes", "absorption rapide"]
      },
      {
        name: "Sandwich PB&J",
        description: "Combinaison classique de pain, beurre de cacahuète et confiture.",
        type: "sandwich",
        timing: ["before", "during"],
        macros: {
          calories: 350,
          carbs: 45,
          protein: 12,
          fat: 14,
          fiber: 4
        },
        benefits: [
          "Énergie longue durée",
          "Bon goût",
          "Complet"
        ],
        image: "/images/nutrition/foods/pbj-sandwich.jpg",
        tags: ["complet", "satiété", "durable"]
      },
      {
        name: "Fruits secs",
        description: "Concentré naturel d'énergie et de nutriments.",
        type: "snacks",
        timing: ["before", "during"],
        macros: {
          calories: 240,
          carbs: 65,
          protein: 2,
          fat: 0.5,
          fiber: 7
        },
        benefits: [
          "Sucre naturel",
          "Riches en antioxydants",
          "Faciles à transporter"
        ],
        image: "/images/nutrition/foods/dried-fruits.jpg",
        tags: ["naturel", "pratique", "compact"]
      },
      {
        name: "Purée de fruits",
        description: "Alternative naturelle aux gels énergétiques.",
        type: "gels",
        timing: ["during"],
        macros: {
          calories: 90,
          carbs: 23,
          protein: 0.5,
          fat: 0,
          fiber: 1.5
        },
        benefits: [
          "Digestion facile",
          "Naturel",
          "Goût agréable"
        ],
        image: "/images/nutrition/foods/fruit-puree.jpg",
        tags: ["naturel", "savoureux", "digestion facile"]
      },
      {
        name: "Patate douce cuite",
        description: "Super-aliment naturel riche en glucides complexes.",
        type: "real-food",
        timing: ["before", "during"],
        macros: {
          calories: 115,
          carbs: 27,
          protein: 2,
          fat: 0.1,
          fiber: 3.8
        },
        benefits: [
          "Énergie prolongée",
          "Riche en vitamines",
          "Facile à digérer"
        ],
        image: "/images/nutrition/foods/sweet-potato.jpg",
        tags: ["naturel", "complet", "durable"]
      },
      {
        name: "Smoothie de récupération",
        description: "Boisson complète idéale après l'effort pour une récupération optimale.",
        type: "drinks",
        timing: ["after"],
        macros: {
          calories: 320,
          carbs: 45,
          protein: 20,
          fat: 6,
          fiber: 5
        },
        benefits: [
          "Récupération musculaire",
          "Réhydratation",
          "Digestion facile"
        ],
        image: "/images/nutrition/foods/recovery-smoothie.jpg",
        tags: ["récupération", "complet", "protéiné"]
      },
      {
        name: "Riz au lait",
        description: "Collation riche en glucides faciles à digérer, parfaite après l'effort.",
        type: "real-food",
        timing: ["after"],
        macros: {
          calories: 225,
          carbs: 38,
          protein: 6,
          fat: 4,
          fiber: 0.5
        },
        benefits: [
          "Reconstitution du glycogène",
          "Apport protéique",
          "Confort digestif"
        ],
        image: "/images/nutrition/foods/rice-pudding.jpg",
        tags: ["récupération", "réconfortant", "complet"]
      },
      {
        name: "Amandes",
        description: "Source de lipides sains et d'énergie durable.",
        type: "snacks",
        timing: ["before"],
        macros: {
          calories: 170,
          carbs: 6,
          protein: 6,
          fat: 15,
          fiber: 3.5
        },
        benefits: [
          "Énergie longue durée",
          "Rassasiant",
          "Antioxydants"
        ],
        image: "/images/nutrition/foods/almonds.jpg",
        tags: ["lipides sains", "protéines", "durable"]
      },
      {
        name: "Pastèque",
        description: "Fruit hydratant idéal par temps chaud.",
        type: "fruit",
        timing: ["before", "after"],
        macros: {
          calories: 46,
          carbs: 11.5,
          protein: 0.9,
          fat: 0.2,
          fiber: 0.6
        },
        benefits: [
          "Très hydratante",
          "Riche en électrolytes",
          "Légère et rafraîchissante"
        ],
        image: "/images/nutrition/foods/watermelon.jpg",
        tags: ["hydratation", "rafraîchissant", "digestion facile"]
      }
    ],
    supplements: [
      {
        name: "Boisson à base de BCAA",
        description: "Acides aminés à chaîne ramifiée pour préserver la masse musculaire.",
        type: "supplements",
        timing: ["during", "after"],
        dosage: "5-10g dilués dans 500ml d'eau",
        benefits: [
          "Limite le catabolisme musculaire",
          "Peut réduire la fatigue centrale",
          "Soutient la récupération"
        ],
        cautions: "Peut provoquer des déséquilibres d'acides aminés si mal dosé",
        image: "/images/nutrition/supplements/bcaa.jpg"
      },
      {
        name: "Électrolytes en comprimés",
        description: "Complément minéral à dissoudre dans l'eau pour maintenir l'équilibre électrolytique.",
        type: "supplements",
        timing: ["before", "during", "after"],
        dosage: "1 comprimé dans 500-750ml d'eau, selon les conditions",
        benefits: [
          "Prévient les crampes",
          "Optimise l'hydratation",
          "Adapté aux efforts par temps chaud"
        ],
        cautions: "Vérifier la teneur en sodium si vous suivez un régime hyposodé",
        image: "/images/nutrition/supplements/electrolytes.jpg"
      },
      {
        name: "Caféine",
        description: "Stimulant naturel pour améliorer la vigilance et la performance.",
        type: "supplements",
        timing: ["before", "during"],
        dosage: "3-6mg/kg, 45-60min avant l'effort ou pendant",
        benefits: [
          "Réduit la perception de l'effort",
          "Améliore la vigilance",
          "Peut augmenter l'endurance"
        ],
        cautions: "Peut causer anxiété, problèmes digestifs ou troubles du sommeil",
        image: "/images/nutrition/supplements/caffeine.jpg"
      },
      {
        name: "Beta-alanine",
        description: "Acide aminé qui améliore la capacité tampon du muscle.",
        type: "supplements",
        timing: ["before"],
        dosage: "2-5g/jour pendant 2-4 semaines avant l'événement",
        benefits: [
          "Réduit l'acidité musculaire",
          "Retarde la fatigue",
          "Améliore la performance sur efforts intenses"
        ],
        cautions: "Peut provoquer des picotements cutanés temporaires (paresthésie)",
        image: "/images/nutrition/supplements/beta-alanine.jpg"
      }
    ]
  };
  
  // Utiliser les recommandations fournies ou les données par défaut
  const {
    foods = defaultRecommendations.foods,
    supplements = defaultRecommendations.supplements
  } = recommendations;
  
  // Fusion des aliments et suppléments pour faciliter la recherche
  const allItems = [...foods, ...supplements];
  
  // Convertir le timing pour l'affichage
  const getTimingLabel = (timing) => {
    switch(timing) {
      case 'before': return 'Avant';
      case 'during': return 'Pendant';
      case 'after': return 'Après';
      default: return timing;
    }
  };
  
  // Convertir le type pour l'affichage
  const getTypeLabel = (type) => {
    switch(type) {
      case 'fruit': return 'Fruit';
      case 'bars': return 'Barres';
      case 'gels': return 'Gels';
      case 'drinks': return 'Boissons';
      case 'sandwich': return 'Sandwich';
      case 'snacks': return 'Collations';
      case 'real-food': return 'Aliments solides';
      case 'supplements': return 'Suppléments';
      default: return type;
    }
  };
  
  // Filtrer les aliments selon les critères
  const filteredItems = allItems.filter(item => {
    // Filtre de recherche
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    
    // Filtre par type
    const matchesType = filterType === 'all' || item.type === filterType;
    
    // Filtre par timing
    const matchesTiming = filterTiming === 'all' || 
                         (item.timing && item.timing.includes(filterTiming));
    
    return matchesSearch && matchesType && matchesTiming;
  });
  
  // Gérer les favoris
  const toggleFavorite = (name) => {
    if (favorites.includes(name)) {
      setFavorites(favorites.filter(fav => fav !== name));
    } else {
      setFavorites([...favorites, name]);
    }
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterTiming('all');
  };

  return (
    <Box>
      <Typography variant="h4" component="h2" gutterBottom>
        Aliments recommandés
      </Typography>
      
      <Typography variant="body1" paragraph>
        Découvrez notre sélection d'aliments et suppléments adaptés aux événements longue distance.
        Filtrez selon vos besoins et préférences pour trouver les options idéales pour votre prochaine sortie.
      </Typography>
      
      {/* Outils de recherche et filtrage */}
      <SectionPaper elevation={1}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Rechercher"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="type-filter-label">Type d'aliment</InputLabel>
              <Select
                labelId="type-filter-label"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Type d'aliment"
              >
                <MenuItem value="all">Tous les types</MenuItem>
                <MenuItem value="fruit">Fruits</MenuItem>
                <MenuItem value="bars">Barres</MenuItem>
                <MenuItem value="gels">Gels</MenuItem>
                <MenuItem value="drinks">Boissons</MenuItem>
                <MenuItem value="sandwich">Sandwichs</MenuItem>
                <MenuItem value="snacks">Collations</MenuItem>
                <MenuItem value="real-food">Aliments solides</MenuItem>
                <MenuItem value="supplements">Suppléments</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="timing-filter-label">Timing</InputLabel>
              <Select
                labelId="timing-filter-label"
                value={filterTiming}
                onChange={(e) => setFilterTiming(e.target.value)}
                label="Timing"
              >
                <MenuItem value="all">Tous moments</MenuItem>
                <MenuItem value="before">Avant l'effort</MenuItem>
                <MenuItem value="during">Pendant l'effort</MenuItem>
                <MenuItem value="after">Après l'effort</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button 
              variant="outlined" 
              startIcon={<FilterList />} 
              onClick={resetFilters}
              fullWidth
            >
              Réinitialiser
            </Button>
          </Grid>
        </Grid>
      </SectionPaper>
      
      {/* Résultats */}
      <Box mt={3}>
        {filteredItems.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="subtitle1">
              Aucun aliment ne correspond à votre recherche. Essayez de modifier vos filtres.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={resetFilters}
            >
              Réinitialiser les filtres
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredItems.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <FoodCard>
                  <FoodMedia
                    image={item.image}
                    title={item.name}
                  />
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="h6">
                        {item.name}
                      </Typography>
                      <IconButton 
                        onClick={() => toggleFavorite(item.name)}
                        size="small"
                        color="primary"
                      >
                        {favorites.includes(item.name) ? <Bookmark /> : <BookmarkBorder />}
                      </IconButton>
                    </Box>
                    
                    <Box display="flex" flexWrap="wrap" mb={1.5}>
                      <TagChip 
                        label={getTypeLabel(item.type)} 
                        size="small" 
                        color="primary"
                      />
                      {item.timing && item.timing.map((time, timeIdx) => (
                        <TagChip 
                          key={timeIdx}
                          label={getTimingLabel(time)}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="body2" paragraph>
                      {item.description}
                    </Typography>
                    
                    {/* Macros pour les aliments */}
                    {item.macros && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Macronutriments:
                        </Typography>
                        <Box display="flex" alignItems="center" mb={1}>
                          <LocalFireDepartment fontSize="small" color="error" sx={{ mr: 0.5 }} />
                          <Typography variant="body2">
                            {item.macros.calories} kcal
                          </Typography>
                        </Box>
                        <Box display="flex" flexWrap="wrap" mb={1.5}>
                          <MacroBox type="carbs">
                            <Typography variant="caption">
                              Glucides: {item.macros.carbs}g
                            </Typography>
                          </MacroBox>
                          <MacroBox type="protein">
                            <Typography variant="caption">
                              Protéines: {item.macros.protein}g
                            </Typography>
                          </MacroBox>
                          <MacroBox type="fat">
                            <Typography variant="caption">
                              Lipides: {item.macros.fat}g
                            </Typography>
                          </MacroBox>
                        </Box>
                      </Box>
                    )}
                    
                    {/* Dosage pour les suppléments */}
                    {item.dosage && (
                      <Box mb={1.5}>
                        <Typography variant="subtitle2" gutterBottom>
                          Dosage:
                        </Typography>
                        <Typography variant="body2">
                          {item.dosage}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="subtitle2" gutterBottom>
                      Avantages:
                    </Typography>
                    <List dense>
                      {item.benefits.map((benefit, benefitIdx) => (
                        <ListItem key={benefitIdx} sx={{ py: 0.25 }}>
                          <ListItemIcon sx={{ minWidth: 24 }}>
                            <FiberManualRecord sx={{ fontSize: 8 }} color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={benefit} 
                            primaryTypographyProps={{ variant: 'body2' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                    
                    {/* Précautions pour les suppléments */}
                    {item.cautions && (
                      <Box mt={1.5}>
                        <Typography variant="subtitle2" color="error" gutterBottom>
                          Précautions:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.cautions}
                        </Typography>
                      </Box>
                    )}
                    
                    {/* Tags pour les aliments */}
                    {item.tags && (
                      <Box mt={1.5} display="flex" flexWrap="wrap">
                        {item.tags.map((tag, tagIdx) => (
                          <Chip 
                            key={tagIdx}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <Box p={2} pt={0} mt="auto">
                    {item.type !== 'supplements' ? (
                      <Button 
                        variant="text" 
                        endIcon={<ArrowForward />}
                        fullWidth
                        component="a"
                        href={`/nutrition/recipes?search=${encodeURIComponent(item.name)}`}
                      >
                        Voir les recettes
                      </Button>
                    ) : (
                      <Button 
                        variant="text" 
                        endIcon={<ArrowForward />}
                        fullWidth
                        component="a"
                        href={`/nutrition/supplements/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        En savoir plus
                      </Button>
                    )}
                  </Box>
                </FoodCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default FoodList;
