/**
 * routeConfig.js
 * 
 * Configuration centralisée des routes pour Velo-Altitude
 * Ce fichier définit toutes les routes de l'application en utilisant
 * la structure d'URL optimisée pour le SEO.
 */

import { lazy } from 'react';
import { URL_CONFIG } from '../utils/urlManager';

// Chargement paresseux des composants pour améliorer les performances
const Home = lazy(() => import('../components/home/Home'));
const ColsList = lazy(() => import('../components/cols/ColsList'));
const ColDetail = lazy(() => import('../components/cols/ColDetail'));
const EnhancedColDetail = lazy(() => import('../components/cols/EnhancedColDetail'));
const TrainingModule = lazy(() => import('../components/training/TrainingModule'));
const TrainingProgramDetail = lazy(() => import('../components/training/TrainingProgramDetail'));
const EnhancedTrainingDetail = lazy(() => import('../components/training/EnhancedTrainingDetail'));
const NutritionHub = lazy(() => import('../components/nutrition/NutritionHub'));
const RecipeList = lazy(() => import('../components/nutrition/RecipeList'));
const RecipeDetail = lazy(() => import('../components/nutrition/RecipeDetail'));
const EnhancedRecipeDetail = lazy(() => import('../components/nutrition/EnhancedRecipeDetail'));
const NutritionPlanList = lazy(() => import('../components/nutrition/NutritionPlanList'));
const NutritionPlanDetail = lazy(() => import('../components/nutrition/NutritionPlanDetail'));
const SevenMajorsHub = lazy(() => import('../components/seven-majors/SevenMajorsHub'));
const SevenMajorsDetail = lazy(() => import('../components/seven-majors/SevenMajorsDetail'));
const CommunityHub = lazy(() => import('../components/community/CommunityHub'));
const ChallengesList = lazy(() => import('../components/community/ChallengesList'));
const ChallengeDetail = lazy(() => import('../components/community/ChallengeDetail'));
const EventsList = lazy(() => import('../components/community/EventsList'));
const EventDetail = lazy(() => import('../components/community/EventDetail'));
const ForumHub = lazy(() => import('../components/community/ForumHub'));
const StoriesList = lazy(() => import('../components/community/StoriesList'));
const StoryDetail = lazy(() => import('../components/community/StoryDetail'));
const AboutTeam = lazy(() => import('../components/about/AboutTeam'));
const Contact = lazy(() => import('../components/about/Contact'));
const Privacy = lazy(() => import('../components/about/Privacy'));
const Terms = lazy(() => import('../components/about/Terms'));
const SiteMap = lazy(() => import('../components/common/SiteMap'));
const NotFound = lazy(() => import('../components/common/NotFound'));

/**
 * Configuration des routes principales
 */
const routes = [
  // Page d'accueil
  {
    path: '/',
    component: Home,
    exact: true,
    seo: {
      title: 'Velo-Altitude | Le Dashboard Vélo pour les Cols d\'Europe',
      description: 'Plateforme complète pour les cyclistes de montagne: cols, entraînements, nutrition et défis pour conquérir les plus beaux sommets d\'Europe.'
    }
  },
  
  // ===== COLS =====
  {
    path: `/${URL_CONFIG.SECTIONS.COLS}`,
    component: ColsList,
    exact: true,
    seo: {
      title: 'Catalogue de Cols | Velo-Altitude',
      description: 'Découvrez plus de 50 cols cyclistes à travers l\'Europe: profils, difficultés, conseils et visualisations 3D pour préparer vos ascensions.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COLS}/:colSlug`,
    component: EnhancedColDetail,
    exact: true,
    seo: {
      // Les métadonnées seront générées dynamiquement en fonction du col
      dynamicSeo: true
    }
  },
  
  // ===== TRAINING =====
  {
    path: `/${URL_CONFIG.SECTIONS.TRAINING}`,
    component: TrainingModule,
    exact: true,
    seo: {
      title: 'Programmes d\'Entraînement Cyclisme | Velo-Altitude',
      description: 'Programmes d\'entraînement spécifiques pour la montagne, séances HIIT et plans personnalisés pour améliorer vos performances en col.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.TRAINING}/:programSlug`,
    component: EnhancedTrainingDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.TRAINING}/${URL_CONFIG.SUBSECTIONS.TRAINING.HIIT}`,
    component: TrainingModule,
    exact: true,
    seo: {
      title: 'Entraînements HIIT pour Cyclistes | Velo-Altitude',
      description: 'Séances d\'entraînement par intervalles à haute intensité spécialement conçues pour les cyclistes de montagne.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.TRAINING}/${URL_CONFIG.SUBSECTIONS.TRAINING.PERFORMANCE}`,
    component: TrainingModule,
    exact: true,
    seo: {
      title: 'Suivi de Performance Cycliste | Velo-Altitude',
      description: 'Outils de suivi et d\'analyse de vos performances cyclistes pour progresser en montagne.'
    }
  },
  
  // ===== NUTRITION =====
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}`,
    component: NutritionHub,
    exact: true,
    seo: {
      title: 'Nutrition pour Cyclistes | Velo-Altitude',
      description: 'Conseils nutritionnels, recettes et plans alimentaires adaptés aux cyclistes de montagne pour optimiser vos performances.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}/${URL_CONFIG.SUBSECTIONS.NUTRITION.RECIPES}`,
    component: RecipeList,
    exact: true,
    seo: {
      title: 'Recettes pour Cyclistes | Velo-Altitude',
      description: 'Recettes énergétiques, barres maison et repas de récupération spécialement conçus pour les cyclistes de montagne.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}/${URL_CONFIG.SUBSECTIONS.NUTRITION.RECIPES}/:recipeSlug`,
    component: EnhancedRecipeDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}/${URL_CONFIG.SUBSECTIONS.NUTRITION.PLANS}`,
    component: NutritionPlanList,
    exact: true,
    seo: {
      title: 'Plans Nutritionnels pour Cyclistes | Velo-Altitude',
      description: 'Plans alimentaires adaptés aux cyclistes de montagne: préparation, pendant l\'effort et récupération.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}/${URL_CONFIG.SUBSECTIONS.NUTRITION.PLANS}/:planSlug`,
    component: NutritionPlanDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.NUTRITION}/${URL_CONFIG.SUBSECTIONS.NUTRITION.HYDRATION}`,
    component: NutritionHub,
    exact: true,
    seo: {
      title: 'Hydratation pour Cyclistes | Velo-Altitude',
      description: 'Stratégies d\'hydratation pour cyclistes en montagne: calcul des besoins, recettes de boissons énergétiques et conseils.'
    }
  },
  
  // ===== SEVEN MAJORS =====
  {
    path: `/${URL_CONFIG.SECTIONS.SEVEN_MAJORS}`,
    component: SevenMajorsHub,
    exact: true,
    seo: {
      title: 'Les 7 Majeurs | Défis Cyclistes | Velo-Altitude',
      description: 'Créez votre défi personnel en sélectionnant 7 cols prestigieux à conquérir. Planifiez, partagez et suivez votre progression.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.SEVEN_MAJORS}/:challengeSlug`,
    component: SevenMajorsDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  
  // ===== COMMUNITY =====
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}`,
    component: CommunityHub,
    exact: true,
    seo: {
      title: 'Communauté Cycliste | Velo-Altitude',
      description: 'Rejoignez la communauté Velo-Altitude: challenges, événements, forum et histoires de cyclistes passionnés de montagne.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.CHALLENGES}`,
    component: ChallengesList,
    exact: true,
    seo: {
      title: 'Challenges Cyclistes | Velo-Altitude',
      description: 'Participez à des challenges cyclistes en montagne et mesurez-vous à d\'autres passionnés de cols.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.CHALLENGES}/:challengeSlug`,
    component: ChallengeDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.EVENTS}`,
    component: EventsList,
    exact: true,
    seo: {
      title: 'Événements Cyclistes | Velo-Altitude',
      description: 'Calendrier des événements cyclistes en montagne: cyclosportives, randonnées et rassemblements.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.EVENTS}/:eventSlug`,
    component: EventDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.FORUM}`,
    component: ForumHub,
    exact: true,
    seo: {
      title: 'Forum Cyclisme de Montagne | Velo-Altitude',
      description: 'Échangez avec d\'autres cyclistes passionnés de montagne: conseils, expériences et discussions.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.STORIES}`,
    component: StoriesList,
    exact: true,
    seo: {
      title: 'Histoires de Cyclistes | Velo-Altitude',
      description: 'Récits d\'aventures cyclistes en montagne: défis, exploits et expériences partagés par la communauté.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.COMMUNITY}/${URL_CONFIG.SUBSECTIONS.COMMUNITY.STORIES}/:storySlug`,
    component: StoryDetail,
    exact: true,
    seo: {
      dynamicSeo: true
    }
  },
  
  // ===== ABOUT =====
  {
    path: `/${URL_CONFIG.SECTIONS.ABOUT}/${URL_CONFIG.SUBSECTIONS.ABOUT.TEAM}`,
    component: AboutTeam,
    exact: true,
    seo: {
      title: 'Notre Équipe | Velo-Altitude',
      description: 'Découvrez l\'équipe de passionnés derrière Velo-Altitude, la plateforme de référence pour le cyclisme de montagne.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.ABOUT}/${URL_CONFIG.SUBSECTIONS.ABOUT.CONTACT}`,
    component: Contact,
    exact: true,
    seo: {
      title: 'Contact | Velo-Altitude',
      description: 'Contactez l\'équipe Velo-Altitude pour toute question, suggestion ou partenariat.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.ABOUT}/${URL_CONFIG.SUBSECTIONS.ABOUT.PRIVACY}`,
    component: Privacy,
    exact: true,
    seo: {
      title: 'Politique de Confidentialité | Velo-Altitude',
      description: 'Découvrez comment Velo-Altitude protège vos données personnelles et respecte votre vie privée.'
    }
  },
  {
    path: `/${URL_CONFIG.SECTIONS.ABOUT}/${URL_CONFIG.SUBSECTIONS.ABOUT.TERMS}`,
    component: Terms,
    exact: true,
    seo: {
      title: 'Conditions d\'Utilisation | Velo-Altitude',
      description: 'Conditions générales d\'utilisation de la plateforme Velo-Altitude.'
    }
  },
  
  // ===== SITEMAP =====
  {
    path: `/${URL_CONFIG.SECTIONS.SITEMAP}`,
    component: SiteMap,
    exact: true,
    seo: {
      title: 'Plan du Site | Velo-Altitude',
      description: 'Plan du site Velo-Altitude: trouvez facilement toutes les sections et pages de notre plateforme.'
    }
  },
  
  // Page 404
  {
    path: '*',
    component: NotFound,
    seo: {
      title: 'Page Non Trouvée | Velo-Altitude',
      description: 'La page que vous recherchez n\'existe pas ou a été déplacée.'
    }
  }
];

/**
 * Versions internationalisées des routes
 * Crée des routes avec préfixe de langue pour les langues autres que le français
 */
const createInternationalRoutes = () => {
  const languages = ['en']; // Langues supportées autres que le français (langue par défaut)
  const internationalRoutes = [];
  
  languages.forEach(lang => {
    routes.forEach(route => {
      if (route.path === '/') {
        // Page d'accueil avec préfixe de langue
        internationalRoutes.push({
          ...route,
          path: `/${lang}`,
          seo: {
            ...route.seo,
            lang
          }
        });
      } else if (route.path !== '*') {
        // Autres pages avec préfixe de langue
        internationalRoutes.push({
          ...route,
          path: `/${lang}${route.path}`,
          seo: {
            ...route.seo,
            lang
          }
        });
      }
    });
  });
  
  return [...routes, ...internationalRoutes];
};

// Exporte toutes les routes, y compris les versions internationalisées
export const allRoutes = createInternationalRoutes();

export default routes;
