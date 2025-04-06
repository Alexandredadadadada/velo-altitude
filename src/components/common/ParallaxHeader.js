import React from 'react';
import './ParallaxHeader.css';

const ParallaxHeader = () => {
  return (
    <div className="parallax-header">
      <div className="parallax-layer parallax-layer-back">
        <div className="mountains"></div>
      </div>
      <div className="parallax-layer parallax-layer-base">
        <div className="header-content">
          <div className="logo">
            <img src="/images/logo.svg" alt="Velo-Altitude" />
          </div>
          <h1>Velo-Altitude</h1>
          <p>Explorez les plus beaux cols d'Europe</p>
        </div>
      </div>
    </div>
  );
};

export default ParallaxHeader;
