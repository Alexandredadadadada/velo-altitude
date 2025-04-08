# Module d'entraînement Velo-Altitude

Ce module gère l'affichage et l'interaction avec les entraînements cyclistes dans l'application Velo-Altitude.

## Architecture des composants

```
workout/
├── index.ts                  # Point d'entrée pour l'export de tous les composants
├── WorkoutTabs.tsx           # Composant d'onglets pour la navigation
├── WorkoutHeader.tsx         # En-tête d'un entraînement avec image et titre
├── WorkoutDetailsTab.tsx     # Onglet détails avec description et métadonnées
├── WorkoutMetricsTab.tsx     # Onglet métriques avec statistiques d'entraînement
├── WorkoutEquipmentTab.tsx   # Onglet équipement nécessaire
├── WorkoutInstructorTab.tsx  # Onglet avec profil de l'instructeur
└── WorkoutCommentsTab.tsx    # Onglet commentaires et interactions
```

## Standards techniques

### Approche de style
- Utilisation des tokens de couleur et d'espacement du système de design
- Import direct des tokens (pas de `tokens.css`)
- Classes CSS conventionnelles en BEM (Block Element Modifier)
- Animations avec Framer Motion pour une expérience utilisateur fluide

### Optimisations React
- `useCallback` utilisé pour les fonctions passées en props ou dépendances d'autres hooks
- `useMemo` pour les calculs coûteux ou les tableaux passés à des composants enfants
- React.memo utilisé uniquement lorsque c'est justifié par des tests de performance

### Accessibilité
- Attributs ARIA pour tous les éléments interactifs
- Focus visible pour les utilisateurs de clavier
- Textes alternatifs pour les images
- Libellés descriptifs pour les boutons d'action

## Tests

Pour tester ces composants:

```bash
# Depuis le répertoire racine du projet
cd client
npm test
```

## Intégration avec le backend

Ces composants interagissent avec les APIs suivantes:
- `/api/workouts` - Récupération des données d'entraînement
- `/api/comments` - Gestion des commentaires
- `/api/instructors` - Informations sur les instructeurs

## Dépendances clés
- React
- Framer Motion
- React Icons
- Design System interne
