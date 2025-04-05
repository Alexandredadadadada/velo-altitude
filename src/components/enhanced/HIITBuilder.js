import React from 'react';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const HIITBuilder = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/hiitbuilder"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="hiit-builder">
      <div className="builder-header">
        <h2>Générateur de Séances HIIT</h2>
        <p>Créez des séances d'entraînement par intervalles à haute intensité adaptées à vos objectifs</p>
      </div>
      
      <article className="builder-content">
        <div className="hiit-parameters">
          <h3>Paramètres de la Séance</h3>
          
          <div className="form-group">
            <label>Niveau</label>
            <select>
              <option value="beginner">Débutant</option>
              <option value="intermediate">Intermédiaire</option>
              <option value="advanced">Avancé</option>
              <option value="expert">Expert</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Objectif principal</label>
            <select>
              <option value="vo2max">Développement VO2 Max</option>
              <option value="threshold">Amélioration du seuil</option>
              <option value="anaerobic">Capacité anaérobie</option>
              <option value="sprint">Puissance de sprint</option>
              <option value="mixed">Mixte</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Durée totale (minutes)</label>
            <select>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">60 minutes</option>
              <option value="75">75 minutes</option>
              <option value="90">90 minutes</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Équipement disponible</label>
            <div className="checkbox-group">
              <label>
                <input type="checkbox" value="trainer" checked /> Home trainer
              </label>
              <label>
                <input type="checkbox" value="power" checked /> Capteur de puissance
              </label>
              <label>
                <input type="checkbox" value="hr" checked /> Cardiofréquencemètre
              </label>
              <label>
                <input type="checkbox" value="hills" /> Collines/Côtes
              </label>
            </div>
          </div>
          
          <div className="form-group">
            <label>Personnalisation des intervalles</label>
            <div className="interval-settings">
              <div className="interval-setting">
                <span>Durée des efforts</span>
                <select>
                  <option value="short">Courts (15-30s)</option>
                  <option value="medium" selected>Moyens (1-3min)</option>
                  <option value="long">Longs (3-8min)</option>
                  <option value="mixed">Mixtes</option>
                </select>
              </div>
              
              <div className="interval-setting">
                <span>Intensité des efforts</span>
                <select>
                  <option value="moderate">Modérée (90-100% FTP)</option>
                  <option value="high" selected>Élevée (100-120% FTP)</option>
                  <option value="very-high">Très élevée (>120% FTP)</option>
                  <option value="mixed">Mixte</option>
                </select>
              </div>
              
              <div className="interval-setting">
                <span>Ratio effort/récupération</span>
                <select>
                  <option value="1-1">1:1</option>
                  <option value="1-2">1:2</option>
                  <option value="2-1" selected>2:1</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>
            </div>
          </div>
          
          <button className="generate-button">Générer la Séance HIIT</button>
        </div>
        
        <div className="hiit-preview">
          <h3>Aperçu de la Séance</h3>
          
          <div className="workout-structure">
            <div className="structure-phase warmup">
              <div className="phase-label">Échauffement</div>
              <div className="phase-duration">10:00</div>
              <div className="phase-description">Progressif jusqu'à 75% FTP</div>
            </div>
            
            <main className="structure-phase main">
              <div className="phase-label">Bloc principal</div>
              <div className="phase-duration">30:00</div>
              <div className="phase-description">6 x (3:00 @ 110% FTP / 2:00 @ 50% FTP)</div>
            </div>
            
            <div className="structure-phase cooldown">
              <div className="phase-label">Récupération</div>
              <div className="phase-duration">5:00</div>
              <div className="phase-description">Diminution progressive jusqu'à 40% FTP</div>
            </div>
          </div>
          
          <div className="workout-visualization">
            <div className="visualization-placeholder">
              <p>Graphique de la séance d'entraînement</p>
            </div>
          </div>
          
          <div className="workout-actions">
            <button className="action-button">Sauvegarder</button>
            <button className="action-button">Exporter</button>
            <button className="action-button">Partager</button>
          </div>
        </div>
      </div>
      
      <div className="hiit-templates">
        <h3>Séances HIIT Populaires</h3>
        
        <div className="templates-list">
          <div className="template-item">
            <h4>4x4 Norvégien</h4>
            <p>4 intervalles de 4 minutes à 90-95% FCmax avec 3 minutes de récupération</p>
            <button className="template-button">Utiliser</button>
          </div>
          
          <div className="template-item">
            <h4>Tabata</h4>
            <p>8 x (20s effort maximal / 10s récupération)</p>
            <button className="template-button">Utiliser</button>
          </div>
          
          <div className="template-item">
            <h4>Sweet Spot</h4>
            <p>3 x 10 minutes à 88-93% FTP avec 5 minutes de récupération</p>
            <button className="template-button">Utiliser</button>
          </div>
          
          <div className="template-item">
            <h4>30/30</h4>
            <p>10-20 répétitions de 30s à 120% FTP / 30s à 50% FTP</p>
            <button className="template-button">Utiliser</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HIITBuilder;
