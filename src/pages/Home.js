import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero-section">
        <h1>Bienvenue sur Velo-Altitude</h1>
        <p>Votre compagnon ultime pour explorer les plus beaux cols de France et d'Europe</p>
      </section>
      
      <section className="features-section">
        <div className="feature-card">
          <h2>Explorateur de Cols</h2>
          <p>Découvrez plus de 50 cols européens avec profils d'élévation détaillés et visualisations 3D</p>
        </div>
        
        <div className="feature-card">
          <h2>Planification Nutritionnelle</h2>
          <p>Optimisez votre alimentation avant, pendant et après vos sorties</p>
        </div>
        
        <div className="feature-card">
          <h2>Programmes d'Entraînement</h2>
          <p>Améliorez vos performances avec des plans d'entraînement personnalisés</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
