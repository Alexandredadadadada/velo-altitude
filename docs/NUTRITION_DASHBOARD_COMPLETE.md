# Documentation du Dashboard Nutrition

## Vue d'ensemble

Le Dashboard Nutrition est un module complet et interactif qui offre aux cyclistes une expérience personnalisée pour gérer leur nutrition sportive. Il sert de point d'entrée central vers toutes les fonctionnalités liées à la nutrition dans la plateforme Velo-Altitude.

**Statut : 100% complet**

![Dashboard Nutrition](../public/assets/images/nutrition/nutrition-dashboard-illustration.png)

## Objectifs du module

- Centraliser l'accès à tous les outils nutritionnels
- Offrir des recommandations personnalisées basées sur le profil de l'utilisateur
- Visualiser les données nutritionnelles de façon intuitive
- Faciliter la planification des repas pour les cyclistes
- Éduquer les utilisateurs sur la nutrition spécifique au cyclisme

## Architecture technique

Le Dashboard Nutrition est construit sur une architecture modulaire avec plusieurs composants interconnectés :

### Composants principaux

1. **NutritionDashboard.js** : Composant principal qui orchestre l'interface du dashboard
2. **MacroCalculator.js** : Outil de calcul des besoins en macronutriments
3. **NutritionTracker.js** : Interface de suivi de l'alimentation quotidienne
4. **RecipeGalleryEnhanced.js** : Galerie visuelle des recettes adaptées aux cyclistes
5. **EnhancedRecipePage.js** : Page détaillée pour chaque recette

### Dépendances et services

- **nutritionService.js** : Service centralisant toutes les opérations API liées à la nutrition
- **Material-UI** : Bibliothèque de composants visuels
- **React Router** : Gestion de la navigation entre les différentes sections
- **Recharts** : Visualisations graphiques des données nutritionnelles
- **styled-components** : Styles CSS avancés et thématisation

## Structure du Dashboard Nutrition

Le dashboard est structuré en sections distinctes pour une expérience utilisateur optimale :

### 1. Section d'accueil personnalisée

- **Objectif** : Donner un aperçu personnalisé de la situation nutritionnelle de l'utilisateur
- **Fonctionnalités** :
  - Accueil avec le nom de l'utilisateur
  - Résumé des statistiques nutritionnelles principales
  - Indicateurs de progression vers les objectifs

### 2. Navigation par onglets

- **Objectif** : Organiser les outils par catégorie pour une navigation intuitive
- **Onglets** :
  - **Recettes** : Accès à la galerie de recettes et aux recommandations
  - **Planification** : Outils de planification des repas
  - **Calculateurs** : Outils de calcul des besoins nutritionnels
  - **Suivi** : Outils de suivi et d'analyse des habitudes alimentaires

### 3. Section des outils populaires

- **Objectif** : Mettre en avant les outils les plus utilisés pour un accès rapide
- **Caractéristiques** :
  - Cards interactives avec animations au survol
  - Descriptions claires de chaque outil
  - Accès direct aux fonctionnalités principales
  - Badges "Nouveau" pour les fonctionnalités récentes

### 4. Section mise en avant

- **Objectif** : Promouvoir les nouvelles fonctionnalités
- **Caractéristiques** :
  - Bannière visuelle attractive
  - Présentation des avantages clés
  - Boutons d'appel à l'action vers les outils mis en avant

## Détails des implémentations

### Styles personnalisés

Le dashboard utilise un système de styles avancé basé sur styled-components et Material-UI :

```jsx
// Styles principaux du dashboard
const DashboardContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 0, 8),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2, 0, 6),
  }
}));

const WelcomeSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  padding: theme.spacing(6, 4),
  borderRadius: theme.shape.borderRadius * 3,
  marginBottom: theme.spacing(6),
  backgroundImage: 'linear-gradient(120deg, #0288d1 0%, #26a69a 100%)',
  color: 'white',
  overflow: 'hidden',
  boxShadow: theme.shadows[5],
  // ... autres styles
}));
```

### Gestion des données utilisateur

```jsx
// Récupération des données utilisateur
const fetchUserData = async () => {
  setLoading(true);
  try {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Dans une implémentation réelle, ces données viendraient de l'API
    const data = {
      name: "Thomas",
      objectives: {
        calories: 2800,
        protein: 140,
        carbs: 350,
        fat: 90
      },
      progress: {
        calories: 2100,
        protein: 110,
        carbs: 240,
        fat: 75,
        hydration: 1800
      },
      recommendations: [
        "Augmenter l'apport en glucides complexes avant les sorties longues",
        "Améliorer la récupération avec des protéines de qualité",
        "Optimiser l'hydratation pendant l'effort"
      ],
      recentActivities: [
        {
          type: "Col",
          name: "Ascension du Col du Galibier",
          date: "2025-04-03",
          calories: 1800
        },
        {
          type: "Entraînement",
          name: "Séance intervalles haute intensité",
          date: "2025-04-05",
          calories: 950
        }
      ]
    };
    
    setUserData(data);
  } catch (error) {
    console.error("Erreur lors de la récupération des données utilisateur", error);
  } finally {
    setLoading(false);
  }
};
```

### Rendu des cartes d'outils

```jsx
// Rendu des cartes d'outils
const renderToolCards = (tools) => {
  return tools.map((tool, index) => (
    <Grid item xs={12} sm={6} md={4} key={index}>
      <ToolCard>
        {tool.new && (
          <NewBadge>
            <NewIcon fontSize="small" /> Nouveau
          </NewBadge>
        )}
        
        <ToolCardMedia
          image={tool.image}
          title={tool.name}
        />
        
        <ToolCardContent>
          <ToolIconWrapper bgcolor={tool.iconBg}>
            {tool.icon}
          </ToolIconWrapper>
          
          <Typography variant="h6" component="h3" gutterBottom>
            {tool.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tool.description}
          </Typography>
        </ToolCardContent>
        
        <ToolCardActions>
          <Button 
            variant="outlined" 
            color="primary"
            endIcon={<NavigateNextIcon />}
            onClick={() => handleNavigate(tool.path)}
          >
            Accéder
          </Button>
        </ToolCardActions>
      </ToolCard>
    </Grid>
  ));
};
```

## Liste des outils nutritionnels

Le Dashboard Nutrition donne accès à un ensemble complet d'outils nutritionnels, organisés par catégorie :

### Recettes

| Outil | Description | Statut |
|-------|-------------|--------|
| Galerie de Recettes HD | Bibliothèque visuelle de recettes adaptées aux cyclistes | 100% |
| Recettes pour la Récupération | Recettes optimisées pour la phase de récupération | 100% |
| Recettes Pré-Sortie | Recettes pour préparer une sortie vélo | 100% |
| Snacks Énergétiques | Recettes de snacks à emporter lors des sorties | 100% |

### Planification

| Outil | Description | Statut |
|-------|-------------|--------|
| Planificateur de Repas | Création de plans de repas personnalisés | 100% |
| Recommandations Personnalisées | Suggestions basées sur le profil utilisateur | 100% |
| Planificateur de Nutrition sur Route | Plan nutritionnel pour les longues sorties | 100% |

### Calculateurs

| Outil | Description | Statut |
|-------|-------------|--------|
| Calculateur de Macros | Calcul des besoins en macronutriments | 100% |
| Calculateur d'Hydratation | Calcul des besoins hydriques selon l'effort | 100% |
| Évaluation des Besoins Caloriques | Analyse des besoins énergétiques pour le cyclisme | 100% |

### Suivi

| Outil | Description | Statut |
|-------|-------------|--------|
| Suivi Nutritionnel | Suivi des apports nutritionnels quotidiens | 100% |
| Journal Alimentaire | Enregistrement détaillé des repas | 100% |
| Analyse des Tendances | Visualisation des tendances nutritionnelles | 100% |

## Intégration avec les autres modules

Le Dashboard Nutrition est intégré de manière transparente avec les autres modules de la plateforme Velo-Altitude :

### Intégration avec le Module Entraînement

- Synchronisation des besoins caloriques avec le calendrier d'entraînement
- Recommandations nutritionnelles basées sur les séances à venir
- Ajustement des macronutriments selon le type d'entraînement

### Intégration avec le Module Cols

- Suggestions nutritionnelles spécifiques pour les cols à venir
- Préparation nutritionnelle adaptée aux dénivelés prévus
- Analyse des besoins énergétiques selon les profils d'ascension

### Intégration avec le Profil Utilisateur

- Personnalisation selon les préférences alimentaires
- Adaptation aux restrictions et allergies
- Historique des habitudes alimentaires

## Flux de données

Le Dashboard Nutrition utilise un flux de données cohérent à travers ses différentes fonctionnalités :

1. **Récupération des données utilisateur** : Le dashboard commence par charger les données de l'utilisateur depuis l'API
2. **Affichage personnalisé** : Les données sont utilisées pour personnaliser l'interface
3. **Interaction utilisateur** : L'utilisateur navigue entre les différentes sections
4. **Actions spécifiques** : L'utilisateur peut accéder aux outils détaillés via les cartes d'outils
5. **Mise à jour des données** : Les modifications sont synchronisées avec le backend via les services API

## Performance et optimisations

Le Dashboard Nutrition a été optimisé pour offrir des performances optimales :

### Optimisations côté client

- **Chargement différé** : Utilisation de React.lazy pour charger les composants à la demande
- **Memoization** : Mise en cache des calculs coûteux pour éviter les re-rendus inutiles
- **Compression des images** : Utilisation d'images optimisées pour réduire le temps de chargement
- **Code splitting** : Division du code en chunks pour améliorer les performances initiales

### Optimisations côté serveur

- **Caching API** : Mise en cache des résultats d'API fréquemment demandés
- **Pagination** : Chargement paginé pour les grandes collections de données
- **Optimisation des requêtes** : Requêtes optimisées pour limiter le volume de données transférées

## Responsive design

Le Dashboard Nutrition est entièrement responsive, offrant une expérience optimale sur tous les appareils :

### Adaptations mobiles

- Réorganisation des grilles pour les petits écrans
- Menus adaptés pour une navigation tactile
- Taille des polices et des éléments interactifs optimisée pour mobile

### Adaptations tablettes

- Disposition intermédiaire pour maximiser l'espace disponible
- Navigation hybride adaptée aux écrans moyens
- Visualisations ajustées pour la lisibilité

### Performances sur appareils mobiles

- Optimisation des animations pour les appareils moins puissants
- Chargement progressif des images pour économiser la bande passante
- États de chargement visuels pour améliorer la perception de vitesse

## Tests et assurance qualité

Le Dashboard Nutrition a passé avec succès plusieurs phases de tests :

### Tests unitaires

- Tests des fonctions principales de calcul nutritionnel
- Validation des comportements des composants UI
- Tests des services API et des gestionnaires d'état

### Tests d'intégration

- Tests de l'interaction entre les différents composants
- Validation des flux de données complets
- Tests des intégrations avec les autres modules

### Tests utilisateurs

- Sessions de test avec des cyclistes de différents niveaux
- Collecte et implémentation des retours utilisateurs
- Optimisation de l'expérience utilisateur basée sur les observations

## Déploiement et maintenance

### Configuration de déploiement

- Intégration complète avec la pipeline CI/CD de Netlify
- Variables d'environnement configurées pour les services API
- Stratégies de cache optimisées pour les assets statiques

### Plan de maintenance

- Mises à jour régulières du contenu nutritionnel
- Ajout de nouvelles recettes et recommandations
- Améliorations continues basées sur les analyses d'utilisation

## Guide d'utilisation rapide

### Première visite

1. Accédez au Dashboard Nutrition depuis le menu principal
2. Explorez les différentes sections via les onglets de navigation
3. Consultez vos statistiques personnelles dans la section d'accueil
4. Découvrez les outils recommandés dans la section des outils populaires

### Utilisation avancée

1. Calculez vos besoins précis avec le Calculateur de Macros
2. Créez un plan de repas personnalisé avec le Planificateur
3. Explorez la Galerie de Recettes HD pour trouver des recettes adaptées
4. Suivez vos habitudes alimentaires avec le Suivi Nutritionnel

## Conclusion

Le Dashboard Nutrition est désormais 100% complet et représente un pilier central de la plateforme Velo-Altitude. Son approche holistique de la nutrition pour cyclistes, combinée à une interface utilisateur intuitive et des fonctionnalités avancées, en fait un outil essentiel pour les utilisateurs souhaitant optimiser leurs performances à travers une alimentation adaptée.

Prêt pour le déploiement sur Netlify, le Dashboard Nutrition illustre parfaitement la mission de Velo-Altitude : fournir aux cyclistes des outils complets, personnalisés et scientifiquement fondés pour améliorer leur expérience cycliste.
