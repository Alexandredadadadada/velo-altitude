import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Polyfills de base
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// Création de la racine React de manière simple et fiable
const root = ReactDOM.createRoot(document.getElementById('root'));

// Rendu de base sans wrapper complexe
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Mesure des performances
reportWebVitals();
