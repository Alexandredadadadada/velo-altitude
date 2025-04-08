# Module d'Entraînement - Velo-Altitude

## Vue d'ensemble

Le module d'entraînement de Velo-Altitude offre aux cyclistes des outils avancés pour optimiser leurs performances en intégrant des visualisations dynamiques des zones de puissance, des animations d'exercices spécifiques, et une intégration avec Strava pour un suivi en temps réel.

## Fonctionnalités principales

### 1. Visualisation des Zones de Puissance

- **Zones basées sur la FTP** : Affichage dynamique des 7 zones d'entraînement calculées à partir de la FTP de l'utilisateur
- **Distribution du temps** : Graphique interactif montrant la répartition du temps passé dans chaque zone
- **Comparaison avec d'autres cyclistes** : Possibilité de comparer ses zones avec celles de cyclistes de niveau similaire

### 2. Calculateur de FTP

- **Méthodes multiples de calcul** : Tests de 20min, 8min, 5min, et autres méthodes d'estimation
- **Historique de progression** : Suivi de l'évolution de la FTP dans le temps
- **Calcul automatique des zones** : Mise à jour automatique des zones d'entraînement basée sur la FTP

### 3. Animations d'Exercices Spécifiques

- **Visualisations par zone** : Animations adaptées pour chaque type d'effort (cadence, sprint, montée)
- **Guides techniques** : Instructions visuelles pour optimiser la position et l'exécution
- **Programmes personnalisés** : Séquences d'exercices adaptées au niveau et aux objectifs

### 4. Intégration Strava

- **Synchronisation des activités** : Import automatique des sorties et des performances
- **Analyse comparative** : Visualisation des écarts entre les objectifs et les performances réelles
- **Partage de défis** : Publication automatique des performances des défis "7 Majeurs"

## Structure Technique

### Composants Principaux

1. **EnhancedTrainingZones**
   - Visualisation avancée des zones d'entraînement avec graphiques interactifs
   - Interface de navigation entre différentes vues et périodes
   - Affichage détaillé des caractéristiques de chaque zone

2. **FTPCalculator**
   - Interface multi-onglets pour différentes méthodes de calcul
   - Historique de progression avec graphiques
   - Système de validation et de sauvegarde des données

3. **HIITVisualizer**
   - Suivi en temps réel des entraînements fractionnés
   - Visualisation du temps passé dans chaque zone
   - Calcul des métriques de performance (TSS, kilojoules)

4. **ExerciseAnimation**
   - Animations spécifiques pour chaque type d'exercice
   - Guides visuels pour l'exécution technique
   - Personnalisation selon le niveau et le matériel

### Sous-composants et Utilitaires

- **ZoneDistributionChart** : Graphique en secteurs pour la visualisation de la distribution du temps
- **ZonePowerComparisonChart** : Comparaison visuelle des plages de puissance entre zones
- **ZoneGuideCard** : Cartes détaillées pour chaque zone d'entraînement
- **FTPService** : Service de calcul et d'estimation de la FTP

## Intégration avec le Reste de la Plateforme

- **Dashboard** : Widgets de statistiques et d'accès rapide aux fonctionnalités d'entraînement
- **Profil Utilisateur** : Stockage et gestion des données de performance
- **Module 7 Majeurs** : Utilisation des données d'entraînement pour les défis
- **Module Nutrition** : Recommandations nutritionnelles basées sur l'intensité des entraînements

## Prochaines Évolutions

1. **IA Coaching**
   - Suggestions personnalisées basées sur les performances
   - Ajustements automatiques des programmes d'entraînement

2. **Intégration capteurs en temps réel**
   - Compatibilité avec les hometrainers connectés
   - Sessions d'entraînement guidées en direct

3. **Planification avancée**
   - Création de plans d'entraînement sur plusieurs mois
   - Périodisation et optimisation de la charge
   
## Captures d'écran

*Les visuels seront ajoutés une fois les développements terminés*

---

Document créé le 06/04/2025 | Velo-Altitude Platform
