# Documentation du Module d'Entraînement

Ce document détaille les algorithmes, formules et méthodes utilisés dans le module d'entraînement de Dashboard-Velo.com, ainsi que leur implémentation dans le code.

## Table des matières

1. [Calcul et estimation de la FTP (Functional Threshold Power)](#calcul-et-estimation-de-la-ftp)
2. [Zones d'entraînement](#zones-dentraînement)
3. [Plans d'entraînement](#plans-dentraînement)
4. [Intégration avec le calendrier](#intégration-avec-le-calendrier)
5. [Tests et validation](#tests-et-validation)
6. [Formules de calcul pour l'estimation de la FTP](#formules-de-calcul-pour-lestimation-de-la-ftp)
7. [Méthodes de périodisation dans TrainingPlanBuilder](#méthodes-de-périodisation-dans-trainingplanbuilder)
8. [Algorithme d'adaptation dynamique](#algorithme-dadaptation-dynamique)
9. [Optimisations techniques du composant TrainingPlanBuilder](#optimisations-techniques-du-composant-trainingplanbuilder)
10. [Programmes d'entraînement européens](#programmes-dentraînement-européens)
11. [Adaptation aux cols européens](#adaptation-aux-cols-européens)

## Calcul et estimation de la FTP

La FTP (Functional Threshold Power) représente la puissance maximale qu'un cycliste peut maintenir pendant environ une heure. Elle est utilisée comme valeur de référence pour déterminer les zones d'entraînement et suivre la progression.

### Méthodes d'estimation de la FTP

#### Test de 20 minutes

```
FTP = Puissance moyenne sur 20 minutes × 0.95
```

Cette méthode est considérée comme l'une des plus fiables pour estimer la FTP. Le facteur de 0.95 est appliqué car la puissance soutenable pendant 20 minutes est environ 5% supérieure à celle soutenable pendant 60 minutes.

**Référence** : Allen, H., & Coggan, A. (2019). Training and Racing with a Power Meter. VeloPress.

#### Test de 8 minutes

```
FTP = Puissance moyenne sur 8 minutes × 0.9
```

Ce test plus court est moins exigeant et convient mieux aux cyclistes débutants ou intermédiaires. Le facteur de 0.9 est appliqué pour compenser la durée plus courte du test.

#### Modèle Critical Power (CP)

Le modèle Critical Power est basé sur l'équation:

```
P = AWC/t + CP
```

Où:
- P est la puissance maintenue pendant un temps t
- AWC est la capacité de travail anaérobie (en joules)
- CP est la puissance critique (très proche de la FTP)
- t est le temps en secondes

Pour calculer CP à partir de deux tests (généralement 5 minutes et 1 minute):

```
CP = (P5 × t5 - P1 × t1) / (t5 - t1)
AWC = (P1 - CP) × t1
```

Où:
- P5 est la puissance moyenne sur 5 minutes
- P1 est la puissance moyenne sur 1 minute
- t5 est la durée du test de 5 minutes en secondes (300s)
- t1 est la durée du test de 1 minute en secondes (60s)

La FTP est ensuite estimée à partir de CP:

```
FTP = CP × 0.97
```

**Référence** : Monod, H., & Scherrer, J. (1965). The work capacity of a synergic muscular group. Ergonomics.

#### Test Ramp

Le test Ramp consiste à augmenter progressivement la puissance (généralement de 25W par minute) jusqu'à épuisement. La FTP est estimée à partir de la puissance maximale atteinte:

```
FTP = Puissance maximale × 0.75
```

**Référence** : Protocole utilisé par Zwift et TrainerRoad.

#### Estimation basée sur le poids et le niveau

Pour les cyclistes n'ayant pas accès à un capteur de puissance, une estimation peut être faite basée sur le poids et le niveau d'expérience:

| Niveau      | FTP/kg (moyenne) |
|-------------|------------------|
| Débutant    | 2.0 W/kg         |
| Intermédiaire| 3.0 W/kg         |
| Avancé      | 4.0 W/kg         |
| Élite       | 5.2 W/kg         |

```
FTP = Poids (kg) × Ratio W/kg
```

#### Estimation basée sur la fréquence cardiaque

Cette méthode utilise la relation entre la fréquence cardiaque au seuil lactique (LTHR) et la FTP:

1. Si LTHR est connue, le ratio W/kg est estimé en fonction du % de FC max:
   - LTHR > 92% FCmax: ~4.5 W/kg
   - LTHR 89-92% FCmax: ~4.0 W/kg
   - LTHR 85-89% FCmax: ~3.5 W/kg
   - LTHR 82-85% FCmax: ~3.0 W/kg
   - LTHR < 82% FCmax: ~2.5 W/kg

2. Si LTHR n'est pas connue, elle est estimée à 87% de la réserve cardiaque:
   ```
   LTHR estimée = FC repos + 0.87 × (FC max - FC repos)
   ```

3. Si VO2max est connu, la FTP est estimée à:
   ```
   FTP = VO2max × 0.75 × Poids × 0.0123
   ```

**Référence** : Lamberts, R. P., et al. (2011). Measurement error associated with performance testing in well-trained cyclists. International Journal of Sports Medicine.

## Zones d'entraînement

### Zones de puissance

Les zones de puissance sont calculées en pourcentage de la FTP:

| Zone | Nom                  | % de FTP      | Description                                   |
|------|----------------------|---------------|-----------------------------------------------|
| 1    | Récupération Active  | 0-55%         | Très facile, récupération active              |
| 2    | Endurance            | 56-75%        | Effort soutenu, conversation possible         |
| 3    | Tempo                | 76-90%        | Rythme soutenu, respiration plus intense      |
| 4    | Seuil                | 91-105%       | Effort intense, 20-30min max                  |
| 5    | VO2max               | 106-120%      | Effort très intense, 3-8min par intervalle    |
| 6    | Capacité Anaérobie   | 121-150%      | Effort anaérobie maximal, 30s-3min            |
| 7    | Sprint/Neuromuscular | >150%         | Puissance maximale, <30s                      |

**Référence** : Allen, H., & Coggan, A. (2019). Training and Racing with a Power Meter. VeloPress.

### Zones cardiaques

Les zones cardiaques sont basées sur la méthode de Karvonen qui utilise la réserve cardiaque (FCmax-FCrepos):

| Zone | Nom               | % de la réserve cardiaque |
|------|-------------------|-----------------------------|
| 1    | Récupération      | 50-60%                     |
| 2    | Endurance de base | 60-70%                     |
| 3    | Endurance avancée | 70-80%                     |
| 4    | Seuil             | 80-90%                     |
| 5    | VO2max            | 90-100%                    |

## Plans d'entraînement

Les plans d'entraînement sont structurés en fonction des objectifs du cycliste et de sa disponibilité:

### Types de plans

1. **Amélioration de la FTP** - Axé sur l'augmentation de la puissance au seuil
2. **Endurance** - Pour les événements longue distance
3. **Développement du sprint** - Pour les cyclistes orientés critérium/compétition
4. **Récupération** - Périodes de faible intensité pour la supercompensation
5. **Entretien** - Maintien de la forme pendant la saison

### Structure des plans

Chaque plan comprend:
- Une durée (2-12 semaines)
- Une charge hebdomadaire (heures/TSS)
- Des séances spécifiques
- Des objectifs mesurables
- Des périodes de récupération

### Périodisation

La périodisation est organisée selon le modèle classique:
- Phase de base (volume élevé, intensité modérée)
- Phase de construction (volume modéré, intensité croissante)
- Phase spécifique (volume réduit, intensité élevée)
- Phase d'affûtage (volume faible, intensité maintenue)
- Compétition/événement
- Récupération

## Intégration avec le calendrier

L'intégration des plans d'entraînement avec le calendrier permet:

1. **Visualisation des séances** - Les séances programmées apparaissent dans le calendrier
2. **Ajustement automatique** - Le plan s'adapte en fonction des événements du calendrier
3. **Suivi de la progression** - Les séances complétées sont marquées et analysées
4. **Gestion de la charge** - Distribution optimale des séances intensives et récupération

L'intégration utilise:
- La bibliothèque FullCalendar pour l'interface
- Un système de drag-and-drop pour ajuster les séances
- Un code couleur pour différencier les types de séances
- Des notifications pour rappeler les séances programmées

## Tests et validation

Le module inclut des fonctionnalités de test automatisé pour:

1. **Validation des calculs de FTP** - Vérification que les différentes méthodes produisent des résultats cohérents
2. **Progression du plan** - Vérification que la charge d'entraînement progresse de manière appropriée
3. **Interaction avec le calendrier** - Vérification que les événements sont correctement synchronisés

Les tests unitaires couvrent:
- Les services de calcul (FTPEstimationService)
- Les composants d'interface (FTPCalculator, TrainingPlanBuilder)
- L'intégration avec le calendrier

## Formules de calcul pour l'estimation de la FTP

### Calculs à partir des tests de puissance

La FTP (Functional Threshold Power) ou Puissance au Seuil Fonctionnel est estimée selon différentes méthodologies, en fonction des données disponibles :

1. **Test de 20 minutes**
   
   La FTP est estimée à 95% de la puissance moyenne maintenue pendant un test d'effort maximal de 20 minutes.
   
   ```
   FTP = Puissance moyenne sur 20 minutes × 0.95
   ```

2. **Test de 8 minutes**
   
   La FTP est estimée à 90% de la puissance moyenne maintenue pendant un test d'effort maximal de 8 minutes.
   
   ```
   FTP = Puissance moyenne sur 8 minutes × 0.90
   ```

3. **Test de 5 minutes**
   
   La FTP est estimée à 85% de la puissance moyenne maintenue pendant un test d'effort maximal de 5 minutes.
   
   ```
   FTP = Puissance moyenne sur 5 minutes × 0.85
   ```

4. **Modèle à 2 paramètres (Critical Power)**
   
   Ce modèle utilise les résultats de deux tests d'efforts de durées différentes pour calculer la Puissance Critique (CP) et la Capacité de Travail Anaérobie (AWC).
   
   ```
   CP = (P5 × t5 - P1 × t1) / (t5 - t1)
   AWC = (P1 - CP) × t1
   ```
   
   Où :
   - P5 = Puissance moyenne sur le test long (ex: 5 minutes)
   - t5 = Durée du test long en secondes
   - P1 = Puissance moyenne sur le test court (ex: 1 minute)
   - t1 = Durée du test court en secondes
   
   La FTP est ensuite estimée à 97% de la CP :
   
   ```
   FTP = CP × 0.97
   ```

5. **Test Ramp (Puissance Maximale Aérobie)**
   
   La FTP est estimée à 75% de la puissance maximale atteinte lors d'un test Ramp (test à paliers progressifs).
   
   ```
   FTP = Puissance maximale du test Ramp × 0.75
   ```

6. **Estimation basée sur le poids**
   
   Cette méthode utilise un ratio Watts/kg en fonction du niveau du cycliste :
   
   ```
   FTP = Poids (kg) × Coefficient de niveau
   ```
   
   Les coefficients utilisés sont :
   - Débutant : 2.0 W/kg
   - Intermédiaire : 3.0 W/kg
   - Avancé : 4.0 W/kg
   - Elite : 5.2 W/kg

### Calcul des zones d'entraînement

1. **Zones de puissance**
   
   Les zones de puissance sont calculées en pourcentage de la FTP :
   
   - Zone 1 (Récupération Active) : 0-55% FTP
   - Zone 2 (Endurance) : 56-75% FTP
   - Zone 3 (Tempo) : 76-90% FTP
   - Zone 4 (Seuil) : 91-105% FTP
   - Zone 5 (VO2max) : 106-120% FTP
   - Zone 6 (Capacité Anaérobie) : 121-150% FTP
   - Zone 7 (Sprint/Neuromuscular) : >150% FTP

2. **Zones cardiaques**
   
   Les zones cardiaques sont calculées selon la formule de Karvonen, basée sur la réserve cardiaque :
   
   ```
   FCzone = FCrepos + (FCmax - FCrepos) × Coefficient de zone
   ```
   
   Les coefficients utilisés sont :
   - Zone 1 (Récupération) : 50-60%
   - Zone 2 (Endurance de base) : 60-70%
   - Zone 3 (Endurance avancée) : 70-80%
   - Zone 4 (Seuil) : 80-90%
   - Zone 5 (VO2max) : 90-100%

## Méthodes de périodisation dans TrainingPlanBuilder

Le TrainingPlanBuilder utilise un système de périodisation pour structurer les plans d'entraînement en différentes phases progressives :

1. **Périodisation par phases**
   
   Un plan complet est divisé en phases distinctes :
   
   - Phase de préparation (Base) : Développement de l'endurance aérobie
   - Phase de construction : Augmentation du volume et introduction d'intensité
   - Phase de spécialisation : Accent sur l'intensité spécifique à l'objectif
   - Phase d'affûtage : Réduction du volume tout en maintenant l'intensité
   - Phase de compétition : Maintien de la forme optimale
   - Phase de transition : Récupération active

2. **Modèle de charge progressive**
   
   La charge d'entraînement suit un modèle progressif avec des semaines de récupération :
   
   ```
   Semaine 1: Charge = Base + (Progression × 1)
   Semaine 2: Charge = Base + (Progression × 2)
   Semaine 3: Charge = Base + (Progression × 3)
   Semaine 4: Charge = Base + (Progression × 1) × 0.7 (récupération)
   ```

3. **Calcul du TSS (Training Stress Score)**
   
   Le TSS hebdomadaire est calculé pour quantifier la charge d'entraînement :
   
   ```
   TSS = Durée (heures) × Intensité (IF)² × 100
   ```
   
   Où l'Intensité (IF) est calculée en fonction du type de séance :
   
   - Récupération : IF = 0.65
   - Endurance : IF = 0.75
   - Tempo : IF = 0.85
   - Seuil : IF = 0.95
   - VO2max : IF = 1.05
   - Anaérobie : IF = 1.15

4. **Équilibre des types d'entraînement**
   
   La répartition des types d'entraînement varie selon la phase et l'objectif :
   
   ```
   Phase de base:
     - Endurance: 80%
     - Seuil: 10%
     - VO2max: 5%
     - Anaérobie: 5%
   
   Phase de spécialisation (performance):
     - Endurance: 60%
     - Seuil: 15%
     - VO2max: 15%
     - Anaérobie: 10%
   ```

## Algorithme d'adaptation dynamique

Le système adapte les plans d'entraînement en fonction des progrès de l'utilisateur :

1. **Détection de fatigue**
   
   Basée sur le rapport charge aigüe/chronique :
   
   ```
   Ratio = Charge des 7 derniers jours / Charge des 28 derniers jours
   ```
   
   - Ratio < 0.8 : Sous-entraînement potentiel
   - Ratio 0.8-1.3 : Zone optimale
   - Ratio > 1.3 : Risque de surentraînement

2. **Ajustement de FTP**
   
   La FTP est ajustée en fonction des résultats des tests :
   
   ```
   Progression attendue par semaine = FTP × 0.01 × Facteur d'adaptation
   ```
   
   Où le Facteur d'adaptation dépend du niveau :
   - Débutant : 1.5
   - Intermédiaire : 1.0
   - Avancé : 0.7
   - Elite : 0.3

## Optimisations techniques du composant TrainingPlanBuilder

Le composant TrainingPlanBuilder a été entièrement refactorisé pour améliorer ses performances, sa maintenabilité et son respect des bonnes pratiques de développement React modernes.

### Architecture et séparation des préoccupations

La nouvelle architecture suit le principe de séparation des préoccupations (SoC) :

1. **Composants atomiques** : L'UI est désormais décomposée en composants plus petits et spécialisés :
   - `PlanForm.js` : Gère l'interface du formulaire de paramétrage du plan
   - `PlanDisplay.js` : Responsable de l'affichage du plan généré

2. **Hooks personnalisés** : La logique métier a été extraite dans des hooks réutilisables :
   - `useTrainingPlan.js` : Encapsule toute la logique de génération et manipulation des plans
   - `useTrainingZones.js` : Gère le calcul et la mise à jour des zones d'entraînement

3. **Composant principal** : Ne conserve que la coordination entre les composants et les hooks

### Optimisations de performance

1. **Mémoïsation** :
   - Utilisation de `useMemo` pour éviter les recalculs coûteux des zones et structures de périodisation
   - Les données statiques comme les configurations de périodisation sont mémoïsées

2. **Callbacks optimisés** :
   - Utilisation de `useCallback` pour les fonctions de gestion d'événements
   - Dépendances explicites pour éviter les re-rendus inutiles

3. **Évaluation paresseuse** :
   - Les calculs complexes (comme le TSS) ne sont effectués que lorsqu'ils sont nécessaires

### Standardisation UI avec Material-UI

La refactorisation a remplacé tous les composants React Bootstrap par leurs équivalents Material-UI :

1. **Composants de mise en page** :
   - Remplacement de `Container`, `Row`, `Col` par `Container`, `Grid` de Material-UI
   - Utilisation de `Box` pour les conteneurs flexibles

2. **Composants de formulaire** :
   - Remplacement de `Form.Control` par `TextField`
   - Remplacement de `Form.Select` par `Select` avec `MenuItem`

3. **Composants de carte** :
   - Remplacement de `Card`, `Card.Header`, `Card.Body` par leurs équivalents Material-UI
   - Utilisation de `Paper` pour les éléments de résumé

4. **Composants de feedback** :
   - Remplacement de `Alert` par son équivalent Material-UI
   - Utilisation de `Chip` pour les indicateurs de type de semaine

5. **Système de style** :
   - Migration de classes CSS vers le système `sx` de Material-UI
   - Utilisation du système de thème pour la cohérence visuelle

### Documentation du code

Le code a été enrichi avec une documentation extensive :

1. **JSDoc** :
   - Documentation des composants avec leur rôle et responsabilités
   - Documentation des props avec leurs types et descriptions
   - Documentation des hooks et de leurs paramètres/retours

2. **Commentaires explicatifs** :
   - Ajout de commentaires sur les sections de code complexes
   - Explication des formules et calculs

3. **Notation des fonctions** :
   - Chaque fonction est préfixée par un commentaire expliquant son but

Cette refactorisation apporte des améliorations significatives en termes de :
- **Performance** : Moins de rendus inutiles et calculs optimisés
- **Maintenabilité** : Code plus modulaire et mieux documenté
- **Extensibilité** : Facilité d'ajout de nouvelles fonctionnalités
- **Cohérence visuelle** : Interface unifiée avec le reste de l'application
- **Testabilité** : Séparation claire permettant des tests unitaires ciblés

## Programmes d'entraînement européens

Dashboard-Velo.com propose 15 programmes d'entraînement spécifiques adaptés aux différents profils de cyclistes européens:

### Structure des programmes

Chaque programme est structuré selon les paramètres suivants:
- **Niveau**: Débutant, Intermédiaire, Avancé, Expert, Élite
- **Objectif**: Endurance, Performance, Compétition
- **Durée**: 8, 12 ou 16 semaines
- **Adaptation géographique**: Plat, Moyenne montagne, Haute montagne

### Implémentation technique

Les programmes sont implémentés dans les composants suivants:
- `TrainingPlanBuilder.js`: Construction et personnalisation des plans
- `TrainingModule.js`: Composant principal pour l'affichage et l'interaction
- `WorkoutDetail.js`: Détails des séances d'entraînement spécifiques

Le modèle de données utilisé est défini dans `models/EnhancedTrainingPrograms.js` qui structure:
- Les séances individuelles
- Les semaines d'entraînement
- Les phases de progression
- Les objectifs spécifiques

### Algorithmes d'adaptation

Les programmes s'adaptent automatiquement aux paramètres utilisateur grâce à:
1. La détection du niveau basée sur l'historique des performances
2. L'ajustement des intensités selon la FTP calculée
3. La modulation des volumes en fonction de la disponibilité indiquée
4. L'orientation des contenus selon la géographie des entraînements prévus

### Programmes spécialisés

En plus des programmes classiques, Dashboard-Velo.com propose des programmes hautement spécialisés:

#### Programmes géographiques spécifiques
- **Programme Spécial Cols Nordiques**: Adaptation aux conditions spécifiques des cols scandinaves, gestion du vent et des changements météorologiques.
- **Programme Altitude Extrême**: Préparation physiologique pour les cols au-dessus de 2000m avec adaptation à l'hypoxie.
- **Programme Famille Multi-niveaux**: Permettant à des cyclistes de niveaux variés de s'entraîner ensemble avec points de ralliement et système de handicap.

#### Programmes ciblés spécifiques
- **Programme FemmeVelo**: Spécifiquement conçu pour les cyclistes féminines, avec synchronisation au cycle menstruel et ergonomie adaptée.
- **Programme Perte de Poids**: Optimisé pour la combustion des graisses tout en développant les capacités cyclistes.
- **Programme HIIT**: Entraînement par intervalles à haute intensité pour maximiser les gains de performance en temps minimal.

Ces programmes sont intégrés dans le système principal via le fichier `trainingProgramsIndex.js` qui les catégorise et permet leur recherche par objectifs, niveau ou mots-clés.

## Adaptation aux cols européens

Les programmes d'entraînement sont spécifiquement adaptés aux cols majeurs européens:

### Spécificité des cols

Les caractéristiques uniques de chaque région européenne sont prises en compte:
- **Alpes**: Longs cols avec pentes régulières
- **Pyrénées**: Cols plus courts mais plus raides
- **Dolomites**: Variations de pente importantes
- **Sierra Nevada**: Chaleur et altitude
- **Cols du Nord**: Vent et conditions changeantes

### Préparation ciblée

Chaque programme intègre:
- Des séances spécifiques simulant les profils des cols visés
- Des recommandations pour la préparation aux conditions climatiques attendues
- Des exercices de variation de puissance pour les cols irréguliers
- Des séances d'altitude simulée pour les cols de haute montagne

### Méthodologie d'entraînement

Les méthodes implémentées sont basées sur les recherches sportives les plus récentes:
- Polarized Training (distribution 80/20)
- Sweet Spot Training pour l'optimisation du temps
- HIIT adapté aux passages difficiles des cols
- SIT (Sprint Interval Training) pour développer les capacités anaérobies

Cette méthodologie est adaptée aux différentes régions européennes et permet une préparation optimale quelle que soit la destination cycliste visée.

---

Document créé le : 04/2025  
Dernière mise à jour : 04/2025
