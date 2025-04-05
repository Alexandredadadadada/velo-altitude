import React, { useState, useEffect } from 'react';
import './EnhancedColDetail.css';

const EnhancedColDetail = ({ colId }) => {
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
        // fetch(`/api/cols/${colId}`)
        setTimeout(() => {
          const mockColData = {
            id: colId,
            name: "Col du Galibier",
            location: "Alpes, France",
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
  }, [colId]);
  
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
  
  if (loading) {
    return (
      <div className="enhanced-col-detail loading">
        <div className="loading-spinner"></div>
        <p>Chargement des informations du col...</p>
      </div>
    );
  }
  
  if (!colData) {
    return (
      <div className="enhanced-col-detail error">
        <h2>Erreur</h2>
        <p>Impossible de charger les informations du col. Veuillez réessayer plus tard.</p>
      </div>
    );
  }
  
  return (
    <div className="enhanced-col-detail">
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
                  <img src={colData.elevationProfile} alt="Profil d'élévation" />
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
          <div className="tab-content details-tab">
            <div className="details-section">
              <h2>Informations détaillées</h2>
              
              <div className="details-grid">
                <div className="detail-item">
                  <h3>Localisation</h3>
                  <p>{colData.location}</p>
                </div>
                
                <div className="detail-item">
                  <h3>Point de départ</h3>
                  <p>{colData.startPoint}</p>
                </div>
                
                <div className="detail-item">
                  <h3>Point d'arrivée</h3>
                  <p>{colData.endPoint}</p>
                </div>
                
                <div className="detail-item">
                  <h3>Période d'ouverture</h3>
                  <p>{colData.openingMonths.join(', ')}</p>
                </div>
                
                <div className="detail-item">
                  <h3>Niveau de trafic</h3>
                  <p>{colData.trafficLevel}</p>
                </div>
                
                <div className="detail-item">
                  <h3>Qualité de la route</h3>
                  <p>{colData.surfaceQuality}</p>
                </div>
              </div>
            </div>
            
            <div className="details-section">
              <h2>Analyse technique</h2>
              
              <div className="technical-analysis">
                <div className="gradient-distribution">
                  <h3>Distribution des pentes</h3>
                  <div className="gradient-chart">
                    {/* Ici, on pourrait intégrer un graphique de distribution des pentes */}
                    <div className="gradient-bar" style={{ width: '10%', backgroundColor: '#4CAF50' }}>
                      <span>0-2%</span>
                      <span>10%</span>
                    </div>
                    <div className="gradient-bar" style={{ width: '15%', backgroundColor: '#8BC34A' }}>
                      <span>2-4%</span>
                      <span>15%</span>
                    </div>
                    <div className="gradient-bar" style={{ width: '30%', backgroundColor: '#CDDC39' }}>
                      <span>4-6%</span>
                      <span>30%</span>
                    </div>
                    <div className="gradient-bar" style={{ width: '25%', backgroundColor: '#FFC107' }}>
                      <span>6-8%</span>
                      <span>25%</span>
                    </div>
                    <div className="gradient-bar" style={{ width: '15%', backgroundColor: '#FF9800' }}>
                      <span>8-10%</span>
                      <span>15%</span>
                    </div>
                    <div className="gradient-bar" style={{ width: '5%', backgroundColor: '#F44336' }}>
                      <span>>10%</span>
                      <span>5%</span>
                    </div>
                  </div>
                </div>
                
                <div className="power-estimation">
                  <h3>Estimation de puissance requise</h3>
                  <div className="power-table">
                    <div className="power-row header">
                      <div className="power-cell">Temps estimé</div>
                      <div className="power-cell">Puissance moyenne</div>
                      <div className="power-cell">Difficulté</div>
                    </div>
                    <div className="power-row">
                      <div className="power-cell">1h30</div>
                      <div className="power-cell">280W (4.0 W/kg)</div>
                      <div className="power-cell">Très difficile</div>
                    </div>
                    <div className="power-row">
                      <div className="power-cell">2h00</div>
                      <div className="power-cell">230W (3.3 W/kg)</div>
                      <div className="power-cell">Difficile</div>
                    </div>
                    <div className="power-row">
                      <div className="power-cell">2h30</div>
                      <div className="power-cell">190W (2.7 W/kg)</div>
                      <div className="power-cell">Modéré</div>
                    </div>
                    <div className="power-row">
                      <div className="power-cell">3h00+</div>
                      <div className="power-cell">160W (2.3 W/kg)</div>
                      <div className="power-cell">Accessible</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="details-section">
              <h2>Conseils d'experts</h2>
              
              <div className="expert-tips">
                <div className="expert-tip">
                  <div className="expert-avatar">
                    <img src="/images/expert-avatar-1.jpg" alt="Expert cycliste" />
                  </div>
                  <div className="expert-content">
                    <h3>Gestion de l'effort</h3>
                    <p>"Sur le Galibier, il est crucial de bien gérer son effort dès le début. La première partie jusqu'à Valloire est relativement facile, mais ne vous laissez pas piéger. Gardez des réserves pour la section après Plan Lachat où la pente se raidit considérablement."</p>
                    <span className="expert-name">— Thomas V., ancien professionnel</span>
                  </div>
                </div>
                
                <div className="expert-tip">
                  <div className="expert-avatar">
                    <img src="/images/expert-avatar-2.jpg" alt="Expert cycliste" />
                  </div>
                  <div className="expert-content">
                    <h3>Équipement recommandé</h3>
                    <p>"Même en plein été, prévoyez toujours un coupe-vent pour la descente. La température peut chuter rapidement au sommet, et la descente est longue. Un braquet de 34x28 ou 34x30 est recommandé pour les cyclistes amateurs."</p>
                    <span className="expert-name">— Julie M., guide cycliste local</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'weather' && (
          <div className="tab-content weather-tab">
            {weatherData ? (
              <>
                <div className="current-weather">
                  <h2>Conditions actuelles</h2>
                  <div className="weather-display">
                    <div className="weather-icon">
                      {/* Icône météo basée sur les conditions */}
                      {weatherData.current.conditions === "Ensoleillé" && <span className="sun-icon">☀️</span>}
                      {weatherData.current.conditions === "Partiellement nuageux" && <span className="partly-cloudy-icon">⛅</span>}
                      {weatherData.current.conditions === "Nuageux" && <span className="cloudy-icon">☁️</span>}
                      {weatherData.current.conditions.includes("Pluie") && <span className="rain-icon">🌧️</span>}
                    </div>
                    <div className="weather-details">
                      <div className="temperature">{weatherData.current.temperature}°C</div>
                      <div className="conditions">{weatherData.current.conditions}</div>
                      <div className="wind">
                        <span>Vent: {weatherData.current.windSpeed} km/h {weatherData.current.windDirection}</span>
                      </div>
                      <div className="precipitation">
                        <span>Précipitations: {weatherData.current.precipitation} mm</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="weather-forecast">
                  <h2>Prévisions</h2>
                  <div className="forecast-days">
                    {weatherData.forecast.map((day, index) => (
                      <div key={index} className="forecast-day">
                        <div className="forecast-date">{day.day}</div>
                        <div className="forecast-icon">
                          {day.conditions === "Ensoleillé" && <span>☀️</span>}
                          {day.conditions === "Partiellement nuageux" && <span>⛅</span>}
                          {day.conditions === "Nuageux" && <span>☁️</span>}
                          {day.conditions.includes("Pluie") && <span>🌧️</span>}
                        </div>
                        <div className="forecast-temp">
                          <span className="high">{day.high}°</span>
                          <span className="low">{day.low}°</span>
                        </div>
                        <div className="forecast-conditions">{day.conditions}</div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="weather-analysis">
                  <h2>Analyse des conditions</h2>
                  <div className="weather-recommendation">
                    <h3>Recommandation du jour</h3>
                    <p>
                      {weatherData.current.temperature > 25 ? 
                        "Températures élevées aujourd'hui. Partez tôt le matin et emportez beaucoup d'eau." :
                        weatherData.current.temperature < 10 ?
                          "Températures fraîches aujourd'hui. Habillez-vous en conséquence avec plusieurs couches." :
                          "Conditions idéales pour grimper le col aujourd'hui."
                      }
                      {weatherData.current.windSpeed > 30 ?
                        " Attention au vent fort qui peut rendre la montée et la descente difficiles." : ""
                      }
                      {weatherData.current.precipitation > 0 ?
                        " Risque de précipitations, soyez prudent dans les virages." : ""
                      }
                    </p>
                  </div>
                  
                  <div className="best-time">
                    <h3>Meilleur moment pour grimper</h3>
                    <p>
                      {weatherData.current.temperature > 25 ?
                        "Tôt le matin (6h-10h) pour éviter la chaleur" :
                        weatherData.current.temperature < 10 ?
                          "En milieu de journée (11h-14h) quand les températures sont les plus élevées" :
                          "Toute la journée offre de bonnes conditions"
                      }
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="weather-loading">
                <p>Chargement des données météo...</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'map' && (
          <div className="tab-content map-tab">
            <div className="map-container">
              <h2>Carte interactive</h2>
              <div className="map-placeholder">
                {/* Dans une implémentation réelle, on intégrerait ici une carte interactive */}
                <div className="map-frame">
                  <p>Carte interactive du Col du Galibier</p>
                  <p>Coordonnées: {colData.coordinates.lat}, {colData.coordinates.lng}</p>
                </div>
              </div>
            </div>
            
            <div className="map-options">
              <h3>Options d'affichage</h3>
              <div className="map-layers">
                <button className="layer-button active">Standard</button>
                <button className="layer-button">Satellite</button>
                <button className="layer-button">Terrain</button>
                <button className="layer-button">Heatmap</button>
              </div>
              
              <h3>Points d'intérêt</h3>
              <div className="poi-options">
                <label>
                  <input type="checkbox" checked readOnly /> Points d'eau
                </label>
                <label>
                  <input type="checkbox" checked readOnly /> Parkings
                </label>
                <label>
                  <input type="checkbox" checked readOnly /> Restaurants/Cafés
                </label>
                <label>
                  <input type="checkbox" checked readOnly /> Points de vue
                </label>
              </div>
            </div>
            
            <div className="route-alternatives">
              <h2>Itinéraires alternatifs</h2>
              <div className="route-list">
                <div className="route-item">
                  <h3>Versant Nord (depuis Valloire)</h3>
                  <div className="route-stats">
                    <span>8.5 km</span>
                    <span>8.1% moy.</span>
                    <span>Difficulté: 4/5</span>
                  </div>
                  <button className="route-button">Voir sur la carte</button>
                </div>
                
                <div className="route-item">
                  <h3>Versant Sud (depuis Le Monêtier-les-Bains)</h3>
                  <div className="route-stats">
                    <span>18.1 km</span>
                    <span>6.9% moy.</span>
                    <span>Difficulté: 4/5</span>
                  </div>
                  <button className="route-button">Voir sur la carte</button>
                </div>
                
                <div className="route-item">
                  <h3>Boucle des 3 Cols (Télégraphe, Galibier, Lautaret)</h3>
                  <div className="route-stats">
                    <span>120 km</span>
                    <span>2500m D+</span>
                    <span>Difficulté: 5/5</span>
                  </div>
                  <button className="route-button">Voir sur la carte</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'reviews' && (
          <div className="tab-content reviews-tab">
            <div className="reviews-summary">
              <h2>Avis des cyclistes</h2>
              <div className="rating-summary">
                <div className="average-rating">
                  <span className="rating-value">4.7</span>
                  <div className="rating-stars">
                    {Array(5).fill().map((_, i) => (
                      <span key={i} className={i < 4.7 ? "rating-star filled" : "rating-star"}></span>
                    ))}
                  </div>
                  <span className="rating-count">Basé sur {userReviews.length} avis</span>
                </div>
                
                <div className="rating-distribution">
                  <div className="rating-bar">
                    <span className="rating-label">5 étoiles</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: '70%' }}></div>
                    </div>
                    <span className="rating-percent">70%</span>
                  </div>
                  <div className="rating-bar">
                    <span className="rating-label">4 étoiles</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: '20%' }}></div>
                    </div>
                    <span className="rating-percent">20%</span>
                  </div>
                  <div className="rating-bar">
                    <span className="rating-label">3 étoiles</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: '10%' }}></div>
                    </div>
                    <span className="rating-percent">10%</span>
                  </div>
                  <div className="rating-bar">
                    <span className="rating-label">2 étoiles</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: '0%' }}></div>
                    </div>
                    <span className="rating-percent">0%</span>
                  </div>
                  <div className="rating-bar">
                    <span className="rating-label">1 étoile</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: '0%' }}></div>
                    </div>
                    <span className="rating-percent">0%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="add-review">
              <h3>Partagez votre expérience</h3>
              <form onSubmit={handleReviewSubmit}>
                <div className="rating-input">
                  <span>Votre note:</span>
                  <div className="star-rating">
                    {Array(5).fill().map((_, i) => (
                      <span 
                        key={i} 
                        className={i < userRating ? "rating-star filled" : "rating-star"}
                        onClick={() => handleRatingChange(i + 1)}
                      ></span>
                    ))}
                  </div>
                </div>
                
                <div className="review-input">
                  <textarea 
                    placeholder="Partagez votre expérience sur ce col..." 
                    value={userReview}
                    onChange={(e) => setUserReview(e.target.value)}
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="submit-review">Soumettre l'avis</button>
              </form>
            </div>
            
            <div className="reviews-list">
              <h3>Avis récents</h3>
              {userReviews.map((review) => (
                <div key={review.id} className="review-item">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">{review.user}</span>
                      <span className="review-date">{review.date}</span>
                    </div>
                    <div className="review-rating">
                      {Array(5).fill().map((_, i) => (
                        <span key={i} className={i < review.rating ? "rating-star filled" : "rating-star"}></span>
                      ))}
                    </div>
                  </div>
                  <div className="review-content">
                    <p>{review.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedColDetail;
