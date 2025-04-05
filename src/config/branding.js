/**
 * Velo-Altitude - Configuration de marque centralisée
 * Ce fichier contient toutes les informations de marque utilisées dans l'application
 */

const branding = {
  // Informations générales de la marque
  name: 'Velo-Altitude',
  shortName: 'Velo-Altitude',
  tagline: 'La référence du cyclisme de montagne en Europe',
  description: 'Plateforme complète dédiée au cyclisme de montagne et aux cols cyclistes européens',
  
  // URLs et endpoints
  baseUrl: process.env.REACT_APP_BASE_URL || 'https://velo-altitude.com',
  apiUrl: process.env.REACT_APP_API_URL || 'https://api.velo-altitude.com',
  
  // Informations de contact
  email: 'contact@velo-altitude.com',
  supportEmail: 'support@velo-altitude.com',
  
  // Médias sociaux
  social: {
    twitter: 'VeloAltitude',
    facebook: 'VeloAltitude',
    instagram: 'velo_altitude',
    strava: 'clubs/velo-altitude',
  },
  
  // Couleurs principales (palette)
  colors: {
    primary: '#0066CC',     // Bleu montagne
    secondary: '#FF6B00',   // Orange dynamique
    accent: '#8BC34A',      // Vert nature
    background: '#F5F7FA',  // Gris clair fond
    text: '#333333',        // Gris foncé texte
    light: '#FFFFFF',       // Blanc
    dark: '#1A1A1A',        // Noir
    success: '#4CAF50',     // Vert succès
    warning: '#FFC107',     // Jaune avertissement
    error: '#F44336',       // Rouge erreur
  },
  
  // Informations légales
  legal: {
    copyright: `© ${new Date().getFullYear()} Velo-Altitude`,
    privacyPolicyUrl: '/privacy',
    termsOfServiceUrl: '/terms',
  },
  
  // Configuration des modules
  modules: {
    cols: {
      title: 'Catalogue de Cols',
      description: 'Découvrez plus de 50 cols mythiques à travers l\'Europe',
    },
    sevenMajors: {
      title: 'Les 7 Majeurs',
      description: 'Créez votre défi personnalisé de 7 cols',
    },
    nutrition: {
      title: 'Nutrition',
      description: 'Optimisez votre alimentation pour vos sorties en montagne',
    },
    training: {
      title: 'Entraînement',
      description: 'Programmes spécifiques pour la montagne et modules HIIT',
    },
    community: {
      title: 'Communauté',
      description: 'Rejoignez d\'autres cyclistes passionnés de montagne',
    },
  },
};

export default branding;
