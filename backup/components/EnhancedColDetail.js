import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import EnhancedMetaTags from '../common/EnhancedMetaTags';
import StructuredData from '../common/StructuredData';
import BreadcrumbTrail from '../common/BreadcrumbTrail';
import { getColUrl, getCanonicalUrl } from '../../utils/urlManager';
import './EnhancedColDetail.css';

const EnhancedColDetail = () => {
  const { colSlug } = useParams();
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  const [colData, setColData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [weatherData, setWeatherData] = useState(null);
  const [similarCols, setSimilarCols] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  
  useEffect(() => {
    // Simuler le chargement des données du col
    const fetchColData = async () => {
      try {
        setLoading(true);
        // Dans une implémentation réelle, ceci serait un appel API
        // fetch(`/api/cols/${colSlug}`)
        setTimeout(() => {
          const mockColData = {
            id: colSlug,
            name: "Col du Galibier",
            location: "Alpes, France",
            country: "France",
            region: "Alpes",
            altitude: 2642,
            length: 23.7,
            averageGradient: 5.1,
            maxGradient: 10.1,
            difficulty: 4,
            startPoint: "Saint-Michel-de-Maurienne",
            endPoint: "Sommet du Galibier",
            description: "Le col du Galibier est l'un des plus hauts cols routiers des Alpes françaises. Il est souvent inclus dans le Tour de France et est considéré comme l'un des cols les plus difficiles et emblématiques.",
            history: "Le col du Galibier a été franchi pour la première fois par le Tour de France en 1911. Depuis, il a été inclus plus de 60 fois dans le parcours, ce qui en fait l'un des cols les plus visités par la Grande Boucle.",
            images: [
              "/images/cols/galibier1.jpg",
              "/images/cols/galibier2.jpg",
              "/images/cols/galibier3.jpg"
            ],
            elevationProfile: "/images/cols/galibier-profile.svg",
            segments: [
              { name: "Saint-Michel-de-Maurienne - Valloire", length: 17.5, gradient: 4.1 },
              { name: "Valloire - Plan Lachat", length: 4.8, gradient: 6.8 },
              { name: "Plan Lachat - Sommet", length: 1.4, gradient: 8.9 }
            ],
            coordinates: {
              lat: 45.0642,
              lng: 6.4091
            },
            openingMonths: ["juin", "juillet", "août", "septembre", "octobre"],
            trafficLevel: "modéré",
            surfaceQuality: "bon",
            recommendations: "Partez tôt le matin pour éviter le trafic et les fortes chaleurs. Prévoyez des vêtements chauds pour la descente, même en été."
          };
          setColData(mockColData);
          
          // Simuler le chargement des données météo
          const mockWeatherData = {
            current: {
              temperature: 18,
              conditions: "Ensoleillé",
              windSpeed: 15,
              windDirection: "NE",
              precipitation: 0
            },
            forecast: [
              { day: "Aujourd'hui", high: 18, low: 5, conditions: "Ensoleillé" },
              { day: "Demain", high: 16, low: 4, conditions: "Partiellement nuageux" },
              { day: "J+2", high: 14, low: 3, conditions: "Nuageux" },
              { day: "J+3", high: 12, low: 2, conditions: "Pluie légère" },
              { day: "J+4", high: 15, low: 4, conditions: "Ensoleillé" }
            ]
          };
          setWeatherData(mockWeatherData);
          
          // Simuler le chargement des cols similaires
          const mockSimilarCols = [
            { id: "col-iseran", name: "Col de l'Iseran", altitude: 2770, difficulty: 4, region: "Alpes" },
            { id: "col-tourmalet", name: "Col du Tourmalet", altitude: 2115, difficulty: 4, region: "Pyrénées" },
            { id: "col-izoard", name: "Col d'Izoard", altitude: 2360, difficulty: 3, region: "Alpes" }
          ];
          setSimilarCols(mockSimilarCols);
          
          // Simuler le chargement des avis utilisateurs
          const mockUserReviews = [
            { id: 1, user: "Jean D.", rating: 5, date: "15/07/2024", comment: "Une montée magnifique avec des paysages à couper le souffle. La pente est régulière et permet de trouver son rythme." },
            { id: 2, user: "Sophie M.", rating: 4, date: "02/08/2024", comment: "Très belle ascension mais attention au vent qui peut être fort au sommet. Prévoyez un coupe-vent pour la descente." },
            { id: 3, user: "Pierre L.", rating: 5, date: "10/06/2024", comment: "Un col mythique qui mérite sa réputation. J'ai eu la chance de le faire par beau temps, c'était exceptionnel." }
          ];
          setUserReviews(mockUserReviews);
          
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    };
    
    fetchColData();
  }, [colSlug]);
  
  const handleRatingChange = (rating) => {
    setUserRating(rating);
  };
  
  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (userRating === 0) {
      alert("Veuillez attribuer une note avant de soumettre votre avis.");
      return;
    }
    
    const newReview = {
      id: userReviews.length + 1,
      user: "Vous",
      rating: userRating,
      date: new Date().toLocaleDateString('fr-FR'),
      comment: userReview
    };
    
    setUserReviews([newReview, ...userReviews]);
    setUserRating(0);
    setUserReview('');
  };

  // Préparation des données SEO
  const prepareSEOData = () => {
    if (!colData) return null;
    
    // Données pour les balises meta
    const metaTitle = `${colData.name} (${colData.altitude}m) | Guide Complet | Velo-Altitude`;
    const metaDescription = `Découvrez le ${colData.name} : profil d'élévation, difficulté, météo, conseils et photos. Tout ce qu'il faut savoir pour gravir ce col de ${colData.altitude}m dans les ${colData.region}.`;
    
    // Mots-clés pertinents
    const keywords = [
      colData.name,
      'col cyclisme',
      'ascension vélo',
      colData.region,
      'cyclisme montagne',
      `${colData.altitude}m`,
      'profil col',
      'difficulté col',
      'Tour de France'
    ];
    
    // URL canonique
    const canonicalUrl = getCanonicalUrl(getColUrl(colSlug, currentLang));
    
    // Image principale pour Open Graph et Twitter
    const mainImage = colData.images && colData.images.length > 0 
      ? colData.images[0] 
      : 'https://www.velo-altitude.com/images/cols/default-col.jpg';
    
    return {
      title: metaTitle,
      description: metaDescription,
      keywords,
      image: mainImage,
      canonicalUrl,
      type: 'article',
      publishedTime: '2024-01-01T00:00:00Z', // À remplacer par la vraie date
      modifiedTime: '2024-04-01T00:00:00Z',  // À remplacer par la vraie date
    };
  };

  // Génération des éléments du fil d'Ariane
  const generateBreadcrumbItems = () => {
    if (!colData) return [];
    
    return [
      {
        label: t('home'),
        path: '/',
        title: t('home')
      },
      {
        label: t('sections.cols'),
        path: '/cols',
        title: t('sections.cols')
      },
      {
        label: colData.name,
        path: `/cols/${colSlug}`,
        title: colData.name,
        current: true
      }
    ];
  };

  if (loading) {
    return <div className="loading-container">Chargement des données du col...</div>;
  }

  if (!colData) {
    return <div className="error-container">Col introuvable</div>;
  }

  const seoData = prepareSEOData();
  const breadcrumbItems = generateBreadcrumbItems();

  return (
    <div className="enhanced-col-detail">
      {/* SEO Metadata */}
      {seoData && (
        <EnhancedMetaTags
          title={seoData.title}
          description={seoData.description}
          keywords={seoData.keywords}
          image={seoData.image}
          canonicalUrl={seoData.canonicalUrl}
          type={seoData.type}
          publishedTime={seoData.publishedTime}
          modifiedTime={seoData.modifiedTime}
          alternateLanguages={['fr', 'en']}
        />
      )}
      
      {/* Structured Data */}
      {colData && (
        <StructuredData
          type="col"
          data={colData}
          url={seoData.canonicalUrl}
          webPageData={{
            title: seoData.title,
            description: seoData.description,
            datePublished: seoData.publishedTime,
            dateModified: seoData.modifiedTime,
            language: currentLang
          }}
        />
      )}
      
      {/* Breadcrumb Trail */}
      <BreadcrumbTrail items={breadcrumbItems} />
      
      <div className="col-header" style={{ backgroundImage: `url(${colData.images[0]})` }}>
        <div className="col-header-overlay">
          <h1>{colData.name}</h1>
          <div className="col-header-info">
            <div className="col-stat">
              <span className="stat-value">{colData.altitude}m</span>
              <span className="stat-label">Altitude</span>
            </div>
            <div className="col-stat">
              <span className="stat-value">{colData.length}km</span>
              <span className="stat-label">Longueur</span>
            </div>
            <div className="col-stat">
              <span className="stat-value">{colData.averageGradient}%</span>
              <span className="stat-label">Pente moyenne</span>
            </div>
            <div className="col-stat">
              <span className="stat-value">{colData.maxGradient}%</span>
              <span className="stat-label">Pente max</span>
            </div>
            <div className="col-stat">
              <span className="stat-value">
                {Array(5).fill().map((_, i) => (
                  <span key={i} className={i < colData.difficulty ? "difficulty-star active" : "difficulty-star"}></span>
                ))}
              </span>
              <span className="stat-label">Difficulté</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="col-navigation">
        <div className="col-tabs">
          <button 
            className={activeTab === 'overview' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('overview')}
          >
            Aperçu
          </button>
          <button 
            className={activeTab === 'details' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('details')}
          >
            Détails
          </button>
          <button 
            className={activeTab === 'weather' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('weather')}
          >
            Météo
          </button>
          <button 
            className={activeTab === 'map' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('map')}
          >
            Carte
          </button>
          <button 
            className={activeTab === 'reviews' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('reviews')}
          >
            Avis
          </button>
        </div>
      </div>
      
      <div className="col-content">
        {activeTab === 'overview' && (
          <div className="tab-content overview-tab">
            <div className="overview-main">
              <div className="overview-description">
                <h2>Description</h2>
                <p>{colData.description}</p>
                
                <h3>Histoire</h3>
                <p>{colData.history}</p>
                
                <h3>Recommandations</h3>
                <p>{colData.recommendations}</p>
              </div>
              
              <div className="overview-elevation">
                <h2>Profil d'élévation</h2>
                <div className="elevation-chart">
                  <img src={colData.elevationProfile} alt={`Profil d'élévation du ${colData.name}`} />
                </div>
                
                <h3>Segments</h3>
                <div className="segments-list">
                  {colData.segments.map((segment, index) => (
                    <div key={index} className="segment-item">
                      <div className="segment-name">{segment.name}</div>
                      <div className="segment-stats">
                        <span>{segment.length} km</span>
                        <span>{segment.gradient}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="overview-gallery">
              <h2>Galerie</h2>
              <div className="gallery-grid">
                {colData.images.map((image, index) => (
                  <div key={index} className="gallery-item">
                    <img src={image} alt={`${colData.name} - Vue ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="overview-similar">
              <h2>Cols similaires</h2>
              <div className="similar-cols">
                {similarCols.map((col) => (
                  <div key={col.id} className="similar-col-card">
                    <h3>{col.name}</h3>
                    <div className="similar-col-stats">
                      <div className="similar-col-stat">
                        <span className="stat-value">{col.altitude}m</span>
                        <span className="stat-label">Altitude</span>
                      </div>
                      <div className="similar-col-stat">
                        <span className="stat-value">
                          {Array(5).fill().map((_, i) => (
                            <span key={i} className={i < col.difficulty ? "difficulty-star active" : "difficulty-star"}></span>
                          ))}
                        </span>
                        <span className="stat-label">Difficulté</span>
                      </div>
                      <div className="similar-col-stat">
                        <span className="stat-value">{col.region}</span>
                        <span className="stat-label">Région</span>
                      </div>
                    </div>
                    <button className="view-col-button">Voir le détail</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'details' && (
          /* Code de l'onglet details */
          <div>...</div>
        )}
        
        {activeTab === 'weather' && (
          /* Code de l'onglet météo */
          <div>...</div>
        )}
        
        {activeTab === 'map' && (
          /* Code de l'onglet carte */
          <div>...</div>
        )}
        
        {activeTab === 'reviews' && (
          /* Code de l'onglet avis */
          <div>...</div>
        )}
      </div>
    </div>
  );
};

export default EnhancedColDetail;
