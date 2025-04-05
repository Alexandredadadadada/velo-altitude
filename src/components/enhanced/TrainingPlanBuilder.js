import React from 'react';
import './TrainingPlanBuilder.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const TrainingPlanBuilder = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ExercisePlan",
          "name": "Programme d'Entraînement Cycliste",
          "description": "Plans d'entraînement spécifiques pour préparer les ascensions de cols.",
          "url": "https://velo-altitude.com/trainingplanbuilder"
        }
      </script>
      <EnhancedMetaTags
        title="Programmes d'Entraînement | Velo-Altitude"
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="article"
        imageUrl="/images/og-image.jpg"
      />
    <div className="training-plan-builder">
      <div className="builder-header">
        <h1>Générateur de Plan d'Entraînement</h1>
        <p>Créez un plan d'entraînement personnalisé adapté à vos objectifs</p>
      </div>
      
      <article className="builder-content">
        <div className="builder-form">
          <h2>Paramètres du Plan</h2>
          
          <div className="form-section">
            <h3>Informations Personnelles</h3>
            <div className="form-group">
              <label>Niveau actuel</label>
              <select>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>FTP actuel (W)</label>
              <input type="number" placeholder="250" min="100" max="500" />
            </div>
            
            <div className="form-group">
              <label>Temps disponible par semaine (heures)</label>
              <input type="number" placeholder="8" min="3" max="20" />
            </div>
          </div>
          
          <div className="form-section">
            <h3>Objectif</h3>
            <div className="form-group">
              <label>Type d'objectif</label>
              <select>
                <option value="event">Événement spécifique</option>
                <option value="ftp">Amélioration du FTP</option>
                <option value="endurance">Développement de l'endurance</option>
                <option value="climbing">Amélioration en montagne</option>
                <option value="sprint">Développement du sprint</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Date de l'objectif</label>
              <input type="date" />
            </div>
            
            <div className="form-group">
              <label>Priorité</label>
              <select>
                <option value="A">A - Objectif principal</option>
                <option value="B">B - Objectif secondaire</option>
                <option value="C">C - Objectif tertiaire</option>
              </select>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Préférences</h3>
            <div className="form-group">
              <label>Méthode de périodisation</label>
              <select>
                <option value="traditional">Traditionnelle</option>
                <option value="block">Par blocs</option>
                <option value="polarized">Polarisée</option>
                <option value="sweet-spot">Sweet Spot</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Jours de repos préférés</label>
              <div className="checkbox-group">
                <label>
                  <input type="checkbox" value="monday" /> Lundi
                </label>
                <label>
                  <input type="checkbox" value="tuesday" /> Mardi
                </label>
                <label>
                  <input type="checkbox" value="wednesday" /> Mercredi
                </label>
                <label>
                  <input type="checkbox" value="thursday" /> Jeudi
                </label>
                <label>
                  <input type="checkbox" value="friday" /> Vendredi
                </label>
                <label>
                  <input type="checkbox" value="saturday" /> Samedi
                </label>
                <label>
                  <input type="checkbox" value="sunday" /> Dimanche
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label>Inclure des séances de force</label>
              <div className="radio-group">
                <label>
                  <input type="radio" name="strength" value="yes" /> Oui
                </label>
                <label>
                  <input type="radio" name="strength" value="no" checked /> Non
                </label>
              </div>
            </div>
          </div>
          
          <button className="generate-button">Générer le Plan</button>
        </div>
        
        <div className="plan-preview">
          <h2>Aperçu du Plan</h2>
          <article className="preview-content">
            <p className="preview-placeholder">Remplissez le formulaire et cliquez sur "Générer le Plan" pour voir un aperçu de votre plan d'entraînement personnalisé.</p>
          </div>
        </div>
      </div>
      
      <div className="training-templates">
        <h2>Templates Populaires</h2>
        <div className="templates-grid">
          <div className="template-card">
            <h3>Préparation Grand Fond</h3>
            <p>Plan de 12 semaines pour préparer une cyclosportive ou un grand fond.</p>
            <button className="template-button">Utiliser ce template</button>
          </div>
          
          <div className="template-card">
            <h3>Amélioration FTP</h3>
            <p>Plan de 8 semaines focalisé sur l'amélioration de votre puissance au seuil.</p>
            <button className="template-button">Utiliser ce template</button>
          </div>
          
          <div className="template-card">
            <h3>Spécial Grimpeur</h3>
            <p>Plan de 10 semaines pour développer vos capacités en montagne.</p>
            <button className="template-button">Utiliser ce template</button>
          </div>
          
          <div className="template-card">
            <h3>Remise en Forme</h3>
            <p>Plan de 6 semaines pour retrouver une bonne condition après une pause.</p>
            <button className="template-button">Utiliser ce template</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPlanBuilder;
