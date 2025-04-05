import React from 'react';
import './Profile.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

const Profile = () => {
  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/profile"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <main className="profile-container">
      <h1>Profil Utilisateur</h1>
      <p>Gérez vos informations personnelles et préférences</p>
      
      <div className="profile-sections">
        <div className="profile-section">
          <h2>Informations Personnelles</h2>
          <form className="profile-form">
            <div className="form-group">
              <label>Nom</label>
              <input type="text" placeholder="Votre nom" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="Votre email" />
            </div>
            <div className="form-group">
              <label>Niveau cycliste</label>
              <select>
                <option value="beginner">Débutant</option>
                <option value="intermediate">Intermédiaire</option>
                <option value="advanced">Avancé</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <button type="button" className="profile-button">Sauvegarder</button>
          </form>
        </div>
        
        <div className="profile-section">
          <h2>Paramètres</h2>
          <div className="settings-group">
            <h3>Unités</h3>
            <div className="setting-option">
              <label>
                <input type="radio" name="units" value="metric" checked /> Métrique (km, kg)
              </label>
            </div>
            <div className="setting-option">
              <label>
                <input type="radio" name="units" value="imperial" /> Impérial (miles, lbs)
              </label>
            </div>
          </div>
          
          <div className="settings-group">
            <h3>Langue</h3>
            <select>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="de">Deutsch</option>
              <option value="it">Italiano</option>
              <option value="es">Español</option>
            </select>
          </div>
          
          <button className="profile-button">Appliquer</button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
