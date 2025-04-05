import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SEOHead from '../common/SEOHead';
import { generateRecipeSchema, generateBreadcrumbSchema } from '../../utils/schemaTemplates';
import { 
  Box, 
  Container,
  Grid, 
  Typography, 
  Chip, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Button,
  Paper,
  Card,
  CardContent,
  Rating,
  Avatar,
  IconButton,
  Tooltip,
  Tab,
  Tabs
} from '@mui/material';
import { 
  AccessTime as TimeIcon, 
  LocalFireDepartment as CalorieIcon,
  FitnessCenter as ProteinIcon,
  Grain as CarbIcon,
  Opacity as FatIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Check as CheckIcon,
  DirectionsBike as BikeIcon,
  Restaurant as DiningIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import './EnhancedRecipeDetail.css';

/**
 * EnhancedRecipeDetail component displays detailed information about a nutrition recipe
 * with SEO optimization and structured data
 */
const EnhancedRecipeDetail = () => {
  const { id } = useParams();
  const [recipeData, setRecipeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [saved, setSaved] = useState(false);
  const [ingredientsChecked, setIngredientsChecked] = useState({});
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [relatedRecipes, setRelatedRecipes] = useState([]);
  
  useEffect(() => {
    // Fetch recipe data
    const fetchRecipeData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // fetch(`/api/recipes/${id}`)
        setTimeout(() => {
          const mockRecipeData = {
            id: id,
            title: "Barres Énergétiques Maison",
            description: "Ces barres énergétiques maison sont parfaites pour les sorties longues. Riches en glucides complexes et en protéines, elles fournissent une énergie durable pendant l'effort.",
            phase: "during", // 'before', 'during', 'after'
            prepTime: 20, // minutes
            cookTime: 15, // minutes
            totalTime: 35, // minutes
            servings: 8,
            calories: 220,
            macros: {
              protein: 8, // g
              carbs: 32, // g
              fat: 6 // g
            },
            ingredients: [
              { quantity: 200, unit: "g", name: "flocons d'avoine" },
              { quantity: 80, unit: "g", name: "miel" },
              { quantity: 60, unit: "g", name: "beurre de cacahuète" },
              { quantity: 50, unit: "g", name: "pépites de chocolat noir" },
              { quantity: 40, unit: "g", name: "amandes concassées" },
              { quantity: 30, unit: "g", name: "graines de chia" },
              { quantity: 1, unit: "cuillère à café", name: "extrait de vanille" },
              { quantity: 1, unit: "pincée", name: "sel" }
            ],
            instructions: [
              "Préchauffer le four à 180°C et tapisser un moule carré de papier cuisson.",
              "Dans une grande casserole, faire chauffer le miel à feu doux.",
              "Ajouter le beurre de cacahuète et mélanger jusqu'à obtention d'une consistance homogène.",
              "Retirer du feu et incorporer les flocons d'avoine, les amandes, les graines de chia, l'extrait de vanille et le sel.",
              "Laisser refroidir légèrement puis ajouter les pépites de chocolat.",
              "Verser le mélange dans le moule et presser fermement pour obtenir une épaisseur uniforme.",
              "Cuire au four pendant 15 minutes ou jusqu'à ce que les bords commencent à dorer.",
              "Laisser refroidir complètement avant de découper en 8 barres."
            ],
            tips: "Ces barres se conservent jusqu'à une semaine dans un contenant hermétique. Pour les sorties longues, enveloppez-les individuellement dans du papier sulfurisé pour faciliter le transport.",
            variations: [
              "Version sans gluten: remplacer les flocons d'avoine par des flocons de quinoa.",
              "Version plus protéinée: ajouter 30g de protéine en poudre (whey ou végétale).",
              "Version fruits rouges: remplacer les pépites de chocolat par des cranberries séchées."
            ],
            bestFor: [
              "Sorties longues (>2h)",
              "Cols de montagne",
              "Ravitaillement pendant une cyclosportive"
            ],
            nutritionalBenefits: [
              "Libération progressive d'énergie grâce aux glucides complexes",
              "Apport en acides gras essentiels (oméga-3) des graines de chia",
              "Protéines pour limiter la dégradation musculaire pendant l'effort"
            ],
            imageUrl: "/images/nutrition/energy-bars.jpg",
            thumbnailUrl: "/images/nutrition/energy-bars-thumb.jpg",
            reviews: [
              {
                id: 1,
                user: "Thomas L.",
                rating: 5,
                date: "15/04/2025",
                comment: "Excellente recette ! Je les prépare avant chaque sortie longue. Elles tiennent bien dans la poche de maillot et sont bien plus économiques que les barres du commerce."
              },
              {
                id: 2,
                user: "Sophie M.",
                rating: 4,
                date: "02/03/2025",
                comment: "Très bonnes et faciles à préparer. J'ai ajouté des cranberries pour plus de goût."
              }
            ],
            relatedCols: [
              { id: "col-galibier", name: "Col du Galibier" },
              { id: "col-tourmalet", name: "Col du Tourmalet" }
            ]
          };
          setRecipeData(mockRecipeData);
          
          // Simuler le chargement des recettes similaires
          const mockRelatedRecipes = [
            { 
              id: "recipe-gel-maison", 
              title: "Gel Énergétique Maison", 
              phase: "during",
              imageUrl: "/images/nutrition/homemade-gel.jpg" 
            },
            { 
              id: "recipe-boisson-isotonique", 
              title: "Boisson Isotonique Naturelle", 
              phase: "during",
              imageUrl: "/images/nutrition/isotonic-drink.jpg" 
            },
            { 
              id: "recipe-muffins-banane", 
              title: "Muffins Banane-Avoine", 
              phase: "before",
              imageUrl: "/images/nutrition/banana-muffins.jpg" 
            }
          ];
          setRelatedRecipes(mockRelatedRecipes);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    };
    
    fetchRecipeData();
  }, [id]);
  
  // Toggle saved state
  const handleSaveRecipe = () => {
    setSaved(!saved);
    // In a real implementation, this would call an API
    // saveRecipeToUserFavorites(id, !saved);
  };
  
  // Toggle ingredient checked state
  const toggleIngredientChecked = (index) => {
    setIngredientsChecked(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  // Handle review submission
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (userRating === 0) {
      alert("Veuillez attribuer une note avant de soumettre votre avis.");
      return;
    }
    
    const newReview = {
      id: recipeData.reviews.length + 1,
      user: "Vous",
      rating: userRating,
      date: new Date().toLocaleDateString('fr-FR'),
      comment: userReview
    };
    
    setRecipeData({
      ...recipeData,
      reviews: [newReview, ...recipeData.reviews]
    });
    setUserRating(0);
    setUserReview('');
  };
  
  // Prepare SEO data
  const prepareSEOData = () => {
    if (!recipeData) return null;

    // Phase labels for SEO
    const phaseLabels = {
      before: "avant effort",
      during: "pendant effort",
      after: "récupération"
    };

    // SEO optimized title
    const seoTitle = `${recipeData.title} | Recette ${phaseLabels[recipeData.phase]} Cyclisme | Velo-Altitude`;
    
    // SEO optimized description
    const seoDescription = `Préparez ces ${recipeData.title} pour vos sorties vélo: ${recipeData.calories} calories, ${recipeData.prepTime} min de préparation. ${recipeData.description.substring(0, 100)}...`;
    
    // Canonical URL
    const canonicalUrl = `https://www.velo-altitude.com/nutrition/recettes/${recipeData.id}`;
    
    // Open Graph image
    const ogImage = recipeData.imageUrl 
      ? `https://www.velo-altitude.com${recipeData.imageUrl}` 
      : 'https://www.velo-altitude.com/images/default-recipe.jpg';
    
    // Keywords
    const keywords = [
      `recette ${recipeData.title.toLowerCase()}`,
      `nutrition cyclisme ${phaseLabels[recipeData.phase]}`,
      `alimentation vélo ${phaseLabels[recipeData.phase]}`,
      `recette cycliste ${recipeData.calories} calories`,
      `barres énergétiques maison vélo`,
      `nutrition sportive cyclisme`,
      `recette ${recipeData.macros.carbs}g glucides`,
      `alimentation cycliste montagne`,
      `recette cyclisme facile`,
      `nutrition vélo longue distance`
    ];
    
    // Hreflang links for internationalization
    const hreflangLinks = {
      'fr': canonicalUrl,
      'en': `https://www.velo-altitude.com/en/nutrition/recipes/${recipeData.id}`,
      'x-default': canonicalUrl
    };
    
    // Structured data schema for the recipe
    const recipeSchema = generateRecipeSchema(recipeData);
    
    // Breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Accueil', url: 'https://www.velo-altitude.com/' },
      { name: 'Nutrition', url: 'https://www.velo-altitude.com/nutrition' },
      { name: 'Recettes', url: 'https://www.velo-altitude.com/nutrition/recettes' },
      { name: recipeData.title, url: canonicalUrl }
    ]);
    
    // Combined schemas
    const combinedSchema = [recipeSchema, breadcrumbSchema];
    
    return {
      title: seoTitle,
      description: seoDescription,
      canonicalUrl,
      ogImage,
      keywords,
      schema: combinedSchema,
      hreflangLinks,
      ogType: 'recipe'
    };
  };
  
  if (loading) {
    return (
      <div className="enhanced-recipe-detail loading">
        <div className="loading-spinner"></div>
        <p>Chargement de la recette...</p>
      </div>
    );
  }
  
  if (!recipeData) {
    return (
      <div className="enhanced-recipe-detail error">
        <h2>Erreur</h2>
        <p>Impossible de charger les informations de la recette. Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  const seoData = prepareSEOData();
  
  // Phase colors and labels
  const phaseColors = {
    before: "#3498db", // blue
    during: "#f39c12", // orange
    after: "#2ecc71"   // green
  };
  
  const phaseLabels = {
    before: "Avant l'effort",
    during: "Pendant l'effort",
    after: "Récupération"
  };
  
  return (
    <div className="enhanced-recipe-detail">
      {seoData && (
        <SEOHead 
          title={seoData.title}
          description={seoData.description}
          canonicalUrl={seoData.canonicalUrl}
          ogImage={seoData.ogImage}
          keywords={seoData.keywords}
          schema={seoData.schema}
          hreflangLinks={seoData.hreflangLinks}
          ogType={seoData.ogType}
        />
      )}
      
      <div className="recipe-header" style={{ backgroundImage: `url(${recipeData.imageUrl})` }}>
        <div className="recipe-header-overlay">
          <div className="recipe-phase-badge" style={{ backgroundColor: phaseColors[recipeData.phase] }}>
            {phaseLabels[recipeData.phase]}
          </div>
          <h1>{recipeData.title}</h1>
          <div className="recipe-header-meta">
            <div className="recipe-meta-item">
              <TimeIcon />
              <span>{recipeData.totalTime} min</span>
            </div>
            <div className="recipe-meta-item">
              <CalorieIcon />
              <span>{recipeData.calories} kcal</span>
            </div>
            <div className="recipe-meta-item">
              <DiningIcon />
              <span>{recipeData.servings} portions</span>
            </div>
            <div className="recipe-rating">
              <Rating value={recipeData.reviews.reduce((sum, review) => sum + review.rating, 0) / recipeData.reviews.length} precision={0.5} readOnly />
              <span>({recipeData.reviews.length} avis)</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="recipe-navigation">
        <div className="recipe-tabs">
          <button 
            className={activeTab === 'overview' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('overview')}
          >
            Recette
          </button>
          <button 
            className={activeTab === 'nutrition' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('nutrition')}
          >
            Nutrition
          </button>
          <button 
            className={activeTab === 'cycling' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('cycling')}
          >
            Cyclisme
          </button>
          <button 
            className={activeTab === 'reviews' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('reviews')}
          >
            Avis
          </button>
        </div>
      </div>
      
      <div className="recipe-content">
        {activeTab === 'overview' && (
          <div className="tab-content overview-tab">
            <div className="recipe-description">
              <p>{recipeData.description}</p>
            </div>
            
            <div className="recipe-actions">
              <Tooltip title={saved ? "Retirer des favoris" : "Ajouter aux favoris"}>
                <Button 
                  variant="outlined" 
                  color={saved ? "primary" : "default"}
                  startIcon={saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                  onClick={handleSaveRecipe}
                >
                  {saved ? "Sauvegardé" : "Sauvegarder"}
                </Button>
              </Tooltip>
              
              <Tooltip title="Imprimer la recette">
                <Button 
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                >
                  Imprimer
                </Button>
              </Tooltip>
              
              <Tooltip title="Partager la recette">
                <Button 
                  variant="outlined"
                  startIcon={<ShareIcon />}
                >
                  Partager
                </Button>
              </Tooltip>
            </div>
            
            <div className="recipe-main-content">
              <div className="recipe-ingredients">
                <h2>Ingrédients</h2>
                <p className="recipe-servings">Pour {recipeData.servings} portions</p>
                
                <List className="ingredients-list">
                  {recipeData.ingredients.map((ingredient, index) => (
                    <ListItem 
                      key={index} 
                      className={ingredientsChecked[index] ? 'ingredient-checked' : ''}
                      onClick={() => toggleIngredientChecked(index)}
                    >
                      <ListItemIcon>
                        {ingredientsChecked[index] ? (
                          <CheckIcon className="check-icon" />
                        ) : (
                          <div className="checkbox"></div>
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={`${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </div>
              
              <div className="recipe-instructions">
                <h2>Instructions</h2>
                <ol className="instructions-list">
                  {recipeData.instructions.map((step, index) => (
                    <li key={index}>
                      <div className="step-number">{index + 1}</div>
                      <div className="step-text">{step}</div>
                    </li>
                  ))}
                </ol>
                
                {recipeData.tips && (
                  <div className="recipe-tips">
                    <h3>Conseils</h3>
                    <p>{recipeData.tips}</p>
                  </div>
                )}
                
                {recipeData.variations && recipeData.variations.length > 0 && (
                  <div className="recipe-variations">
                    <h3>Variations</h3>
                    <ul>
                      {recipeData.variations.map((variation, index) => (
                        <li key={index}>{variation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'nutrition' && (
          <div className="tab-content nutrition-tab">
            <h2>Profil Nutritionnel</h2>
            
            <div className="nutrition-macros">
              <div className="macro-card">
                <CalorieIcon className="macro-icon calories" />
                <div className="macro-value">{recipeData.calories}</div>
                <div className="macro-label">Calories</div>
                <div className="macro-unit">kcal/portion</div>
              </div>
              
              <div className="macro-card">
                <ProteinIcon className="macro-icon protein" />
                <div className="macro-value">{recipeData.macros.protein}</div>
                <div className="macro-label">Protéines</div>
                <div className="macro-unit">g/portion</div>
              </div>
              
              <div className="macro-card">
                <CarbIcon className="macro-icon carbs" />
                <div className="macro-value">{recipeData.macros.carbs}</div>
                <div className="macro-label">Glucides</div>
                <div className="macro-unit">g/portion</div>
              </div>
              
              <div className="macro-card">
                <FatIcon className="macro-icon fat" />
                <div className="macro-value">{recipeData.macros.fat}</div>
                <div className="macro-label">Lipides</div>
                <div className="macro-unit">g/portion</div>
              </div>
            </div>
            
            <div className="nutrition-chart">
              <h3>Répartition des macronutriments</h3>
              <div className="chart-placeholder">
                {/* In a real implementation, this would be a pie chart */}
                <div className="pie-chart">
                  <div className="pie-slice carbs-slice" style={{ 
                    transform: `rotate(0deg) skew(${90 - (recipeData.macros.carbs * 3.6)}deg)` 
                  }}></div>
                  <div className="pie-slice protein-slice" style={{ 
                    transform: `rotate(${recipeData.macros.carbs * 3.6}deg) skew(${90 - (recipeData.macros.protein * 3.6)}deg)` 
                  }}></div>
                  <div className="pie-slice fat-slice" style={{ 
                    transform: `rotate(${(recipeData.macros.carbs + recipeData.macros.protein) * 3.6}deg) skew(${90 - (recipeData.macros.fat * 3.6)}deg)` 
                  }}></div>
                </div>
                <div className="chart-legend">
                  <div className="legend-item">
                    <div className="legend-color carbs"></div>
                    <div className="legend-text">Glucides ({Math.round(recipeData.macros.carbs / (recipeData.macros.carbs + recipeData.macros.protein + recipeData.macros.fat) * 100)}%)</div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color protein"></div>
                    <div className="legend-text">Protéines ({Math.round(recipeData.macros.protein / (recipeData.macros.carbs + recipeData.macros.protein + recipeData.macros.fat) * 100)}%)</div>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color fat"></div>
                    <div className="legend-text">Lipides ({Math.round(recipeData.macros.fat / (recipeData.macros.carbs + recipeData.macros.protein + recipeData.macros.fat) * 100)}%)</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nutrition-benefits">
              <h3>Bénéfices Nutritionnels</h3>
              <ul className="benefits-list">
                {recipeData.nutritionalBenefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        {activeTab === 'cycling' && (
          <div className="tab-content cycling-tab">
            <h2>Utilisation en Cyclisme</h2>
            
            <div className="cycling-usage">
              <div className="usage-icon">
                <BikeIcon fontSize="large" />
              </div>
              <div className="usage-content">
                <h3>Recommandé pour</h3>
                <ul className="usage-list">
                  {recipeData.bestFor.map((usage, index) => (
                    <li key={index}>{usage}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="cycling-timing">
              <h3>Timing Optimal</h3>
              <div className="timing-cards">
                <div className={`timing-card ${recipeData.phase === 'before' ? 'active' : ''}`}>
                  <div className="timing-header">Avant l'effort</div>
                  <div className="timing-content">
                    {recipeData.phase === 'before' ? (
                      <p>Consommez 1-2h avant le départ pour un apport énergétique optimal sans surcharger la digestion.</p>
                    ) : (
                      <p>Cette recette n'est pas spécifiquement conçue pour la phase pré-effort.</p>
                    )}
                  </div>
                </div>
                
                <div className={`timing-card ${recipeData.phase === 'during' ? 'active' : ''}`}>
                  <div className="timing-header">Pendant l'effort</div>
                  <div className="timing-content">
                    {recipeData.phase === 'during' ? (
                      <p>Consommez toutes les 45-60 minutes pendant l'effort pour maintenir vos niveaux d'énergie.</p>
                    ) : (
                      <p>Cette recette n'est pas spécifiquement conçue pour la consommation pendant l'effort.</p>
                    )}
                  </div>
                </div>
                
                <div className={`timing-card ${recipeData.phase === 'after' ? 'active' : ''}`}>
                  <div className="timing-header">Après l'effort</div>
                  <div className="timing-content">
                    {recipeData.phase === 'after' ? (
                      <p>Consommez dans les 30 minutes suivant l'effort pour optimiser la récupération musculaire.</p>
                    ) : (
                      <p>Cette recette n'est pas spécifiquement conçue pour la phase de récupération.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {recipeData.relatedCols && recipeData.relatedCols.length > 0 && (
              <div className="related-cols">
                <h3>Cols recommandés</h3>
                <div className="cols-list">
                  {recipeData.relatedCols.map((col) => (
                    <div key={col.id} className="col-card">
                      <h4>{col.name}</h4>
                      <Button variant="outlined" size="small">Voir le col</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="tab-content reviews-tab">
            <h2>Avis et Commentaires</h2>
            
            <div className="add-review">
              <h3>Partagez votre expérience</h3>
              <form className="review-form" onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label>Votre note:</label>
                  <Rating 
                    value={userRating} 
                    onChange={(event, newValue) => {
                      setUserRating(newValue);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>Votre commentaire:</label>
                  <textarea 
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    placeholder="Partagez votre expérience avec cette recette..."
                    rows={4}
                  ></textarea>
                </div>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary"
                  disabled={userRating === 0}
                >
                  Soumettre
                </Button>
              </form>
            </div>
            
            <div className="reviews-list">
              {recipeData.reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <Avatar>{review.user.charAt(0)}</Avatar>
                      <div className="reviewer-name">{review.user}</div>
                    </div>
                    <div className="review-date">{review.date}</div>
                  </div>
                  <div className="review-rating">
                    <Rating value={review.rating} readOnly />
                  </div>
                  <div className="review-comment">
                    {review.comment}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="recipe-related">
        <h2>Recettes similaires</h2>
        <div className="related-recipes">
          {relatedRecipes.map((recipe) => (
            <div key={recipe.id} className="related-recipe-card">
              <div className="related-recipe-image" style={{ backgroundImage: `url(${recipe.imageUrl})` }}>
                <div className="related-recipe-phase" style={{ backgroundColor: phaseColors[recipe.phase] }}>
                  {phaseLabels[recipe.phase]}
                </div>
              </div>
              <div className="related-recipe-title">{recipe.title}</div>
              <Button variant="outlined" size="small">Voir la recette</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EnhancedRecipeDetail;
