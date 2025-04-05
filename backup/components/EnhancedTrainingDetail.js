import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SEOHead from '../common/SEOHead';
import { generateTrainingProgramSchema, generateBreadcrumbSchema } from '../../utils/schemaTemplates';
import { Container, Grid, Paper, Box, Typography, Divider, Tabs, Tab, Button } from '@mui/material';
import { 
  FitnessCenter, 
  DirectionsBike,
  ShowChart,
  CalendarToday,
  AccessTime,
  Speed,
  BarChart
} from '@mui/icons-material';
import './EnhancedTrainingDetail.css';

/**
 * EnhancedTrainingDetail component displays detailed information about a training program
 * with SEO optimization and structured data
 */
const EnhancedTrainingDetail = () => {
  const { id } = useParams();
  const [programData, setProgramData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userFTP, setUserFTP] = useState(250); // Default FTP value
  
  useEffect(() => {
    // Fetch training program data
    const fetchProgramData = async () => {
      try {
        setLoading(true);
        // In a real implementation, this would be an API call
        // fetch(`/api/training-programs/${id}`)
        setTimeout(() => {
          const mockProgramData = {
            id: id,
            name: "Programme Haute Montagne",
            level: "intermédiaire",
            duration: 8, // weeks
            sessionsPerWeek: 4,
            targetAudience: "Cyclistes souhaitant améliorer leurs performances en montagne",
            description: "Ce programme de 8 semaines est conçu pour les cyclistes qui souhaitent améliorer leur capacité à grimper les cols. Il combine des séances d'endurance, des intervalles à haute intensité et des sorties spécifiques en montagne pour développer la puissance et l'endurance nécessaires pour affronter les longues ascensions.",
            objectives: [
              "Améliorer la puissance en montée",
              "Développer l'endurance spécifique pour les longues ascensions",
              "Optimiser le rapport poids/puissance",
              "Perfectionner la technique de pédalage en montée"
            ],
            prerequisites: "Ce programme nécessite une base d'endurance d'au moins 6 mois de pratique régulière du vélo avec 3 sorties hebdomadaires minimum.",
            recommendedCols: [
              { id: "col-galibier", name: "Col du Galibier", difficulty: 4 },
              { id: "col-izoard", name: "Col d'Izoard", difficulty: 3 },
              { id: "col-madeleine", name: "Col de la Madeleine", difficulty: 4 }
            ],
            complementaryNutrition: [
              { id: "nutrition-1", name: "Plan Nutrition Haute Montagne", type: "plan" },
              { id: "recipe-energy-bars", name: "Barres Énergétiques Maison", type: "recipe" }
            ],
            weeks: [
              {
                weekNumber: 1,
                theme: "Adaptation et Base",
                sessions: [
                  {
                    day: 1,
                    title: "Endurance Fondamentale",
                    type: "endurance",
                    duration: 90,
                    description: "Sortie longue à intensité modérée (zone 2) sur terrain vallonné.",
                    intensityFactor: 0.75
                  },
                  {
                    day: 3,
                    title: "Intervalles Sweet Spot",
                    type: "intervals",
                    duration: 75,
                    description: "5 x 5 minutes à 88-94% de FTP avec 3 minutes de récupération.",
                    intervals: [
                      { power: 0.91, duration: 300, rest: 180 },
                      { power: 0.91, duration: 300, rest: 180 },
                      { power: 0.91, duration: 300, rest: 180 },
                      { power: 0.91, duration: 300, rest: 180 },
                      { power: 0.91, duration: 300, rest: 180 }
                    ],
                    intensityFactor: 0.85
                  },
                  {
                    day: 5,
                    title: "Force-Endurance",
                    type: "strength",
                    duration: 60,
                    description: "Travail de force à basse cadence (50-60 rpm) sur des montées courtes.",
                    intensityFactor: 0.82
                  },
                  {
                    day: 7,
                    title: "Sortie Longue",
                    type: "endurance",
                    duration: 180,
                    description: "Sortie longue avec 2-3 ascensions de 15-20 minutes à intensité modérée.",
                    intensityFactor: 0.70
                  }
                ]
              },
              // Additional weeks would be included here
            ],
            testimonials: [
              {
                id: 1,
                user: "Sophie M.",
                rating: 5,
                date: "15/03/2025",
                comment: "J'ai suivi ce programme avant de partir dans les Alpes et j'ai pu enchaîner 3 cols mythiques en une journée sans difficulté. La progression est bien pensée."
              },
              {
                id: 2,
                user: "Thomas L.",
                rating: 4,
                date: "02/04/2025",
                comment: "Programme exigeant mais très efficace. J'ai gagné 15% de puissance en montée après les 8 semaines."
              }
            ],
            images: [
              "/images/training/mountain-program1.jpg",
              "/images/training/mountain-program2.jpg"
            ],
            coach: {
              name: "Marc Dupont",
              credentials: "Entraîneur FFC niveau 3, ex-coureur professionnel",
              speciality: "Préparation montagne"
            }
          };
          setProgramData(mockProgramData);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    };
    
    fetchProgramData();
  }, [id]);
  
  // Prepare SEO data
  const prepareSEOData = () => {
    if (!programData) return null;

    // SEO optimized title
    const seoTitle = `${programData.name} | Programme d'Entraînement ${programData.duration} Semaines | Velo-Altitude`;
    
    // SEO optimized description
    const seoDescription = `Améliorez vos performances en montagne avec notre programme "${programData.name}" sur ${programData.duration} semaines. ${programData.sessionsPerWeek} séances hebdomadaires adaptées au niveau ${programData.level}. Développez puissance et endurance pour les cols.`;
    
    // Canonical URL
    const canonicalUrl = `https://www.velo-altitude.com/entrainement/programmes/${programData.id}`;
    
    // Open Graph image
    const ogImage = programData.images && programData.images.length > 0 
      ? `https://www.velo-altitude.com${programData.images[0]}` 
      : 'https://www.velo-altitude.com/images/default-training.jpg';
    
    // Keywords
    const keywords = [
      `entraînement cyclisme montagne`,
      `programme vélo ${programData.name}`,
      `entraînement cols`,
      `préparation cyclisme montagne`,
      `programme ${programData.duration} semaines vélo`,
      `entraînement niveau ${programData.level}`,
      `puissance cyclisme montée`,
      `programme cycliste cols`,
      `préparation physique vélo`,
      `entraînement cyclisme haute altitude`
    ];
    
    // Hreflang links for internationalization
    const hreflangLinks = {
      'fr': canonicalUrl,
      'en': `https://www.velo-altitude.com/en/training/programs/${programData.id}`,
      'x-default': canonicalUrl
    };
    
    // Structured data schema for the training program
    const programSchema = generateTrainingProgramSchema(programData);
    
    // Breadcrumb schema
    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Accueil', url: 'https://www.velo-altitude.com/' },
      { name: 'Entraînement', url: 'https://www.velo-altitude.com/entrainement' },
      { name: 'Programmes', url: 'https://www.velo-altitude.com/entrainement/programmes' },
      { name: programData.name, url: canonicalUrl }
    ]);
    
    // Combined schemas
    const combinedSchema = [programSchema, breadcrumbSchema];
    
    return {
      title: seoTitle,
      description: seoDescription,
      canonicalUrl,
      ogImage,
      keywords,
      schema: combinedSchema,
      hreflangLinks,
      ogType: 'article'
    };
  };
  
  // Calculate personalized power targets based on user FTP
  const calculatePowerTargets = (session) => {
    if (!session.intervals) return null;
    
    return session.intervals.map(interval => ({
      ...interval,
      targetPower: Math.round(interval.power * userFTP)
    }));
  };
  
  if (loading) {
    return (
      <div className="enhanced-training-detail loading">
        <div className="loading-spinner"></div>
        <p>Chargement du programme d'entraînement...</p>
      </div>
    );
  }
  
  if (!programData) {
    return (
      <div className="enhanced-training-detail error">
        <h2>Erreur</h2>
        <p>Impossible de charger les informations du programme. Veuillez réessayer plus tard.</p>
      </div>
    );
  }

  const seoData = prepareSEOData();
  
  return (
    <div className="enhanced-training-detail">
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
      
      <div className="training-header" style={{ backgroundImage: `url(${programData.images[0]})` }}>
        <div className="training-header-overlay">
          <h1>{programData.name}</h1>
          <div className="training-header-info">
            <div className="training-stat">
              <span className="stat-value">{programData.duration}</span>
              <span className="stat-label">Semaines</span>
            </div>
            <div className="training-stat">
              <span className="stat-value">{programData.sessionsPerWeek}</span>
              <span className="stat-label">Séances/semaine</span>
            </div>
            <div className="training-stat">
              <span className="stat-value">{programData.level}</span>
              <span className="stat-label">Niveau</span>
            </div>
            <div className="training-stat">
              <span className="stat-value">
                {programData.coach.name}
              </span>
              <span className="stat-label">Coach</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="training-navigation">
        <div className="training-tabs">
          <button 
            className={activeTab === 'overview' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('overview')}
          >
            Aperçu
          </button>
          <button 
            className={activeTab === 'schedule' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('schedule')}
          >
            Planning
          </button>
          <button 
            className={activeTab === 'sessions' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('sessions')}
          >
            Séances
          </button>
          <button 
            className={activeTab === 'personalize' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('personalize')}
          >
            Personnaliser
          </button>
          <button 
            className={activeTab === 'testimonials' ? 'tab-button active' : 'tab-button'}
            onClick={() => setActiveTab('testimonials')}
          >
            Témoignages
          </button>
        </div>
      </div>
      
      <div className="training-content">
        {activeTab === 'overview' && (
          <div className="tab-content overview-tab">
            <div className="overview-main">
              <div className="overview-description">
                <h2>Description</h2>
                <p>{programData.description}</p>
                
                <h3>Objectifs</h3>
                <ul className="objectives-list">
                  {programData.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
                
                <h3>Prérequis</h3>
                <p>{programData.prerequisites}</p>
                
                <h3>Public cible</h3>
                <p>{programData.targetAudience}</p>
              </div>
              
              <div className="overview-coach">
                <h2>Coach</h2>
                <div className="coach-info">
                  <div className="coach-avatar">
                    {/* Coach avatar would go here */}
                    <div className="avatar-placeholder"></div>
                  </div>
                  <div className="coach-details">
                    <h3>{programData.coach.name}</h3>
                    <p className="coach-credentials">{programData.coach.credentials}</p>
                    <p className="coach-speciality">Spécialité: {programData.coach.speciality}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overview-complementary">
              <h2>Cols recommandés</h2>
              <div className="recommended-cols">
                {programData.recommendedCols.map((col) => (
                  <div key={col.id} className="recommended-col">
                    <h3>{col.name}</h3>
                    <div className="col-difficulty">
                      {Array(col.difficulty).fill().map((_, i) => (
                        <span key={i} className="difficulty-star active">★</span>
                      ))}
                      {Array(5 - col.difficulty).fill().map((_, i) => (
                        <span key={i} className="difficulty-star">☆</span>
                      ))}
                    </div>
                    <button className="view-col-button">Voir le détail</button>
                  </div>
                ))}
              </div>
              
              <h2>Nutrition complémentaire</h2>
              <div className="complementary-nutrition">
                {programData.complementaryNutrition.map((item) => (
                  <div key={item.id} className="nutrition-item">
                    <h3>{item.name}</h3>
                    <span className="nutrition-type">{item.type === 'plan' ? 'Plan nutritionnel' : 'Recette'}</span>
                    <button className="view-nutrition-button">Voir le détail</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div className="tab-content schedule-tab">
            <h2>Planning sur {programData.duration} semaines</h2>
            <div className="program-schedule">
              {programData.weeks.map((week) => (
                <div key={week.weekNumber} className="week-card">
                  <div className="week-header">
                    <h3>Semaine {week.weekNumber}</h3>
                    <div className="week-theme">{week.theme}</div>
                  </div>
                  <div className="week-sessions">
                    {week.sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-day">Jour {session.day}</div>
                        <div className="session-title">{session.title}</div>
                        <div className="session-details">
                          <span className="session-duration">
                            <AccessTime fontSize="small" />
                            {session.duration} min
                          </span>
                          <span className="session-type">
                            {session.type === 'endurance' && <DirectionsBike fontSize="small" />}
                            {session.type === 'intervals' && <BarChart fontSize="small" />}
                            {session.type === 'strength' && <FitnessCenter fontSize="small" />}
                            {session.type}
                          </span>
                          <span className="session-intensity">
                            <Speed fontSize="small" />
                            IF: {session.intensityFactor}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'sessions' && (
          <div className="tab-content sessions-tab">
            <h2>Détail des séances</h2>
            <div className="ftp-input">
              <label htmlFor="user-ftp">Votre FTP (W):</label>
              <input 
                type="number" 
                id="user-ftp" 
                value={userFTP} 
                onChange={(e) => setUserFTP(parseInt(e.target.value) || 0)}
                min="100"
                max="500"
              />
              <span className="ftp-help">Entrez votre FTP pour personnaliser les zones de puissance</span>
            </div>
            
            <div className="sessions-list">
              {programData.weeks.flatMap(week => 
                week.sessions.map((session, sessionIndex) => (
                  <div key={`${week.weekNumber}-${sessionIndex}`} className="session-detail">
                    <div className="session-detail-header">
                      <h3>{session.title}</h3>
                      <div className="session-meta">
                        <span>Semaine {week.weekNumber}, Jour {session.day}</span>
                        <span>{session.duration} minutes</span>
                        <span>Type: {session.type}</span>
                      </div>
                    </div>
                    
                    <div className="session-description">
                      <p>{session.description}</p>
                    </div>
                    
                    {session.intervals && (
                      <div className="session-intervals">
                        <h4>Intervalles</h4>
                        <table className="intervals-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Puissance (%FTP)</th>
                              <th>Puissance (W)</th>
                              <th>Durée</th>
                              <th>Récupération</th>
                            </tr>
                          </thead>
                          <tbody>
                            {calculatePowerTargets(session).map((interval, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>{Math.round(interval.power * 100)}%</td>
                                <td>{interval.targetPower} W</td>
                                <td>{Math.floor(interval.duration / 60)}:{(interval.duration % 60).toString().padStart(2, '0')}</td>
                                <td>{Math.floor(interval.rest / 60)}:{(interval.rest % 60).toString().padStart(2, '0')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    <div className="session-zones">
                      <h4>Zones de puissance</h4>
                      <div className="zones-table">
                        <div className="zone-row">
                          <div className="zone-name">Zone 1 (Récupération)</div>
                          <div className="zone-range">&lt; {Math.round(userFTP * 0.55)} W</div>
                        </div>
                        <div className="zone-row">
                          <div className="zone-name">Zone 2 (Endurance)</div>
                          <div className="zone-range">{Math.round(userFTP * 0.56)} - {Math.round(userFTP * 0.75)} W</div>
                        </div>
                        <div className="zone-row">
                          <div className="zone-name">Zone 3 (Tempo)</div>
                          <div className="zone-range">{Math.round(userFTP * 0.76)} - {Math.round(userFTP * 0.90)} W</div>
                        </div>
                        <div className="zone-row">
                          <div className="zone-name">Zone 4 (Seuil)</div>
                          <div className="zone-range">{Math.round(userFTP * 0.91)} - {Math.round(userFTP * 1.05)} W</div>
                        </div>
                        <div className="zone-row">
                          <div className="zone-name">Zone 5 (VO2max)</div>
                          <div className="zone-range">{Math.round(userFTP * 1.06)} - {Math.round(userFTP * 1.20)} W</div>
                        </div>
                        <div className="zone-row">
                          <div className="zone-name">Zone 6 (Anaérobie)</div>
                          <div className="zone-range">&gt; {Math.round(userFTP * 1.20)} W</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'personalize' && (
          <div className="tab-content personalize-tab">
            <h2>Personnalisation du programme</h2>
            <p>Cette section vous permet d'adapter le programme à vos besoins spécifiques.</p>
            
            <div className="personalization-options">
              {/* Placeholder for personalization options */}
              <div className="personalization-option">
                <h3>Adapter à votre disponibilité</h3>
                <p>Modifiez le nombre de séances par semaine en fonction de votre emploi du temps.</p>
                <div className="option-controls">
                  <label>Séances par semaine:</label>
                  <select defaultValue={programData.sessionsPerWeek}>
                    <option value="2">2 séances</option>
                    <option value="3">3 séances</option>
                    <option value="4">4 séances</option>
                    <option value="5">5 séances</option>
                  </select>
                </div>
              </div>
              
              <div className="personalization-option">
                <h3>Ajuster la difficulté</h3>
                <p>Adaptez l'intensité globale du programme selon votre niveau.</p>
                <div className="option-controls">
                  <label>Niveau de difficulté:</label>
                  <select defaultValue="100">
                    <option value="90">Légèrement plus facile (-10%)</option>
                    <option value="100">Standard (recommandé)</option>
                    <option value="110">Légèrement plus difficile (+10%)</option>
                    <option value="120">Beaucoup plus difficile (+20%)</option>
                  </select>
                </div>
              </div>
              
              <div className="personalization-option">
                <h3>Objectifs spécifiques</h3>
                <p>Mettez l'accent sur des aspects particuliers de votre préparation.</p>
                <div className="option-controls option-checkboxes">
                  <label>
                    <input type="checkbox" /> Plus d'endurance
                  </label>
                  <label>
                    <input type="checkbox" /> Plus de puissance
                  </label>
                  <label>
                    <input type="checkbox" /> Amélioration technique
                  </label>
                  <label>
                    <input type="checkbox" /> Perte de poids
                  </label>
                </div>
              </div>
            </div>
            
            <div className="personalization-actions">
              <button className="personalize-apply-button">Appliquer les modifications</button>
              <button className="personalize-reset-button">Réinitialiser</button>
            </div>
          </div>
        )}
        
        {activeTab === 'testimonials' && (
          <div className="tab-content testimonials-tab">
            <h2>Témoignages</h2>
            <div className="testimonials-list">
              {programData.testimonials.map((testimonial) => (
                <div key={testimonial.id} className="testimonial-card">
                  <div className="testimonial-header">
                    <div className="testimonial-user">{testimonial.user}</div>
                    <div className="testimonial-date">{testimonial.date}</div>
                  </div>
                  <div className="testimonial-rating">
                    {Array(testimonial.rating).fill().map((_, i) => (
                      <span key={i} className="rating-star">★</span>
                    ))}
                    {Array(5 - testimonial.rating).fill().map((_, i) => (
                      <span key={i} className="rating-star empty">☆</span>
                    ))}
                  </div>
                  <div className="testimonial-comment">{testimonial.comment}</div>
                </div>
              ))}
            </div>
            
            <div className="add-testimonial">
              <h3>Partagez votre expérience</h3>
              <form className="testimonial-form">
                <div className="form-group">
                  <label htmlFor="rating">Votre note:</label>
                  <div className="rating-input">
                    {Array(5).fill().map((_, i) => (
                      <span key={i} className="rating-star-input">☆</span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="comment">Votre commentaire:</label>
                  <textarea id="comment" rows="4" placeholder="Partagez votre expérience avec ce programme..."></textarea>
                </div>
                <button type="submit" className="submit-testimonial-button">Envoyer</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTrainingDetail;
