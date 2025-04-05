import React from 'react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <h1>404 - Page Non Trouvée</h1>
      <p>Désolé, la page que vous recherchez n'existe pas.</p>
      <div className="not-found-image">
        <img src="/images/404-cyclist.svg" alt="Cycliste perdu" />
      </div>
      <p>Peut-être avez-vous pris le mauvais col ?</p>
      <a href="/" className="return-home-button">Retourner à l'accueil</a>
    </div>
  );
};

export default NotFound;
