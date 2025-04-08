# Les 7 Majeurs - Concept et Implémentation

## Vue d'Ensemble
- **Objectif** : Documentation du concept "Les 7 Majeurs" et son implémentation technique
- **Contexte** : Fonctionnalité phare permettant aux cyclistes de créer leurs propres défis personnalisés
- **Portée** : Interface utilisateur, logique de défi, partage et export

## Contenu Principal
- **Concept "Les 7 Majeurs"**
  - Philosophie et objectif
  - Sélection de 7 cols prestigieux
  - Personnalisation du parcours
  - Gamification de l'expérience cycliste

- **Interface Utilisateur**
  - Onglets de navigation
  - Recherche et filtrage de cols
  - Visualisation des défis
  - Challenges prédéfinis

- **Fonctionnalités**
  - Création de défis personnalisés
  - Sauvegarde des défis
  - Partage des défis
  - Export GPX
  - Tracking de progression

- **Intégration**
  - Avec visualisation 3D
  - Avec module entraînement
  - Avec module nutrition
  - Avec communauté

## Points Techniques
```javascript
// Structure d'un défi "7 Majeurs"
const sevenMajeursChallenge = {
  id: 'user123_alpine_dream',
  name: 'Rêve Alpin',
  creator: {
    id: 'user123',
    username: 'AlpineRider',
    level: 'advanced'
  },
  created: '2023-04-15T14:30:22Z',
  isPublic: true,
  cols: [
    {
      id: 'col_galibier',
      name: 'Col du Galibier',
      elevation: 2642,
      length: 23.7,
      gradient: 5.1,
      difficulty: 'difficult',
      region: 'Alpes',
      country: 'France',
      order: 1,
      status: 'completed',
      userNotes: 'Commencer tôt pour éviter la chaleur',
      completionDate: '2023-06-12'
    },
    {
      id: 'col_tourmalet',
      name: 'Col du Tourmalet',
      elevation: 2115,
      length: 19.0,
      gradient: 7.4,
      difficulty: 'difficult',
      region: 'Pyrénées',
      country: 'France',
      order: 2,
      status: 'planned',
      userNotes: 'Prévoir vêtements chauds pour la descente',
      plannedDate: '2023-07-20'
    },
    // 5 autres cols...
  ],
  stats: {
    totalElevation: 17250,
    totalDistance: 152.3,
    averageGradient: 6.8,
    difficultyScore: 85,
    estimatedTime: '42:30:00'
  },
  requirements: {
    fitness: 'advanced',
    suggestedFTP: 280,
    preparationWeeks: 16
  },
  shareURL: 'https://velo-altitude.com/7majeurs/a1b2c3d4',
  gpxURL: 'https://velo-altitude.com/export/7majeurs/a1b2c3d4.gpx'
};

// Interface pour la création d'un défi
interface ChallengeBuilderProps {
  availableCols: Col[];
  userProfile: UserProfile;
  onSave: (challenge: Challenge) => Promise<void>;
  onShare: (challengeId: string) => void;
  onExportGPX: (challengeId: string) => void;
}

// Composant de création de défi
const SevenMajeursBuilder: React.FC<ChallengeBuilderProps> = ({ 
  availableCols,
  userProfile,
  onSave,
  onShare,
  onExportGPX
}) => {
  const [selectedCols, setSelectedCols] = useState<Col[]>([]);
  const [challengeName, setChallengeName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  // Logique du composant...
  
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <ColSearchPanel 
          cols={availableCols} 
          onSelect={handleColSelect} 
          userRegion={userProfile.preferredRegion}
        />
      </Grid>
      <Grid item xs={12} md={8}>
        <SelectedColsPanel 
          cols={selectedCols}
          onRemove={handleColRemove}
          onReorder={handleColReorder}
        />
        <ChallengeStats cols={selectedCols} userFTP={userProfile.ftp} />
        <ChallengeActions
          canSave={selectedCols.length > 0 && challengeName !== ''}
          onSave={() => handleSave()}
          onShare={() => handleShare()}
          onExportGPX={() => handleExportGPX()}
        />
      </Grid>
    </Grid>
  );
};
```

## Algorithmes Clés
- **Calcul du Score de Difficulté**
```javascript
const calculateDifficultyScore = (cols) => {
  // Facteurs: dénivelé, distance, pente moyenne, altitude max, enchainement
  const totalElevation = cols.reduce((sum, col) => sum + col.elevation, 0);
  const totalDistance = cols.reduce((sum, col) => sum + col.length, 0);
  const avgGradient = cols.reduce((sum, col) => sum + col.gradient, 0) / cols.length;
  const maxElevation = Math.max(...cols.map(col => col.elevation));
  
  // Coefficient d'enchainement (cols rapprochés = plus difficile)
  const sequenceCoefficient = calculateSequenceCoefficient(cols);
  
  // Formule de difficulté pondérée
  const score = (
    totalElevation * 0.5 + 
    totalDistance * 0.2 + 
    avgGradient * 15 + 
    maxElevation * 0.1
  ) * sequenceCoefficient;
  
  // Normalisation sur 100
  return Math.min(100, Math.max(1, Math.round(score / 250)));
};
```

- **Estimation du Temps**
```javascript
const estimateCompletionTime = (cols, userFTP) => {
  // Basé sur les données historiques et la puissance de l'utilisateur
  let totalTimeMinutes = 0;
  
  cols.forEach(col => {
    // Vitesse estimée en fonction du FTP et de la pente
    const estimatedSpeedKmh = calculateEstimatedSpeed(col.gradient, userFTP);
    const timeHours = col.length / estimatedSpeedKmh;
    totalTimeMinutes += timeHours * 60;
    
    // Ajout temps de repos entre cols si nécessaire
    if (col.order < cols.length) {
      totalTimeMinutes += 30; // 30min de repos entre cols
    }
  });
  
  // Formatage HH:MM:SS
  return formatDuration(totalTimeMinutes);
};
```

## Métriques et KPIs
- **Objectifs**
  - Utilisation de la fonctionnalité > 60% des utilisateurs actifs
  - Nombre moyen de défis créés par utilisateur > 2.5
  - Taux de partage des défis > 40%
  - Taux de complétion des défis > 50%
  
- **Mesures actuelles**
  - Utilisation: 58%
  - Défis par utilisateur: 2.2
  - Taux de partage: 35%
  - Taux de complétion: 47%

## Contraintes Techniques
- Limite de 7 cols par défi (concept)
- Temps de calcul pour statistiques < 1s
- Taille maximale export GPX: 5MB
- Compatibilité avec formats standards (TCX, FIT)

## Dépendances
- Mapbox pour cartographie
- GPXParser pour import/export
- LocalStorage/IndexedDB pour sauvegarde locale
- API interne de statistiques

## Maintenance
- **Responsable** : Chef d'équipe Cols & Défis
- **Fréquence** : Mise à jour mensuelle de la base de cols
- **Procédures** :
  1. Vérification de la base de données de cols
  2. Ajustement des algorithmes d'estimation
  3. Maintien de la compatibilité des exports
  4. Ajout de nouveaux cols et défis prédéfinis

## Références
- [Documentation Mapbox](https://docs.mapbox.com/)
- [Spécification GPX](https://www.topografix.com/gpx.asp)
- [Research: Mountainous Cycling Performance Models](https://www.researchgate.net/)
- [Strava Route Builder API](https://developers.strava.com/docs/reference/#api-Routes)
