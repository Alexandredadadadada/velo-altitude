/**
 * Configuration centralisée pour le branding Velo-Altitude
 * Ce fichier sert de source unique de vérité pour tous les éléments de marque du site
 */

export const brandConfig = {
  // Informations de base
  siteName: "Velo-Altitude",
  previousName: "Grand Est Cyclisme",
  domain: "velo-altitude.com",
  
  // Relations et partenariats
  partnershipText: "en partenariat avec Grand Est Cyclisme",
  partnershipShort: "Partenaire: Grand Est Cyclisme",
  
  // Éléments visuels
  logoPath: "/assets/images/velo-altitude-logo.svg",
  logoAlt: "Logo Velo-Altitude - Le dashboard vélo ultime",
  favicon: "/favicon.ico",
  
  // Textes marketing
  tagline: "Le plus grand dashboard vélo d'Europe",
  taglineShort: "Dashboard vélo ultime",
  description: "Velo-Altitude est la plateforme de référence pour les cyclistes passionnés d'ascension et de cols. Visualisez, planifiez et partagez vos défis cyclistes avec notre technologie de pointe.",
  
  // Réseaux sociaux
  social: {
    twitter: "@VeloAltitude",
    facebook: "VeloAltitude",
    instagram: "velo.altitude",
    strava: "clubs/velo-altitude"
  },
  
  // Couleurs (pour référence)
  colors: {
    primary: "#1976d2",
    secondary: "#ff9800",
    altitude: "#3f51b5",
    mountain: "#4caf50"
  },
  
  // Identité visuelle
  visualIdentity: {
    mountainIcon: true,
    elevationGraphic: true,
    cyclistIcon: true
  },
  
  // SEO et métadonnées
  defaultMetaTags: {
    title: "Velo-Altitude | Le dashboard vélo ultime pour les passionnés de cols",
    description: "Planifiez, visualisez et relevez vos défis cyclistes avec Velo-Altitude, la plateforme de référence pour les cyclistes passionnés d'ascension et de cols.",
    keywords: "vélo, cyclisme, cols, altitude, dashboard, défis, 7 majeurs, visualisation 3D"
  },
  
  // Configuration légale
  legal: {
    companyName: "Velo-Altitude SAS",
    address: "Paris, France",
    contactEmail: "contact@velo-altitude.com",
    copyright: `© ${new Date().getFullYear()} Velo-Altitude. Tous droits réservés.`
  }
};

// Exporter des fonctions d'aide pour le branding
export const getBrandName = () => brandConfig.siteName;
export const getPartnershipText = (short = false) => short ? brandConfig.partnershipShort : brandConfig.partnershipText;
export const getFullBrandName = () => `${brandConfig.siteName} - ${brandConfig.taglineShort}`;
export const getLogo = () => brandConfig.logoPath;
export const getCopyright = () => brandConfig.legal.copyright;

export default brandConfig;
