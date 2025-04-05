# Documentation de Déploiement - Contenu Velo-Altitude

**Date :** 6 avril 2025  
**Version :** 1.6  
**Auteur :** Agent Contenu

## Introduction

Ce document référence tous les nouveaux contenus créés pour la plateforme Velo-Altitude, organisés par catégorie. Cette documentation est destinée à l'équipe frontend pour faciliter l'intégration et le déploiement de l'ensemble du contenu en une seule fois, sans perturber la structure existante du site.

## Structure du Package de Déploiement

```
/deployment_package
  /content
    /nutrition
      - nutrition-plans.json (contient le Plan Nutrition Haute Montagne)
      - plan-nutrition-longue-distance.json
      - plan-nutrition-recuperation.json
      - plan-nutrition-competition.json
    /training
      - plan-haute-montagne.json
      - plan-ventoux.json
      - plan-angliru.json
    /routes
      - route-grande-traversee-alpes.json
    /skills
      - techniques-descente.json (à venir)
    /cols
      - alpe-dhuez.json
      - angliru.json
      - aubisque.json
      - croix-de-fer.json
      - galibier.json
      - grand-saint-bernard.json
      - izoard.json
      - lautaret.json
      - mont-ventoux.json
      - mortirolo.json
      - passo-giau.json
      - pordoi.json
      - stelvio.json
      - tourmalet.json
  CONTENT_DEPLOYMENT_DOCUMENTATION.md
```

## 1. Contenu Nutritionnel

### 1.1 Plan Nutrition Haute Montagne

**Fichier :** `content/nutrition/nutrition-plans.json`  
**Description :** Plan nutritionnel spécialement conçu pour les cyclistes qui préparent des ascensions en haute montagne.

**Points clés :**
- Stratégies nutritionnelles pour la préparation avant une ascension
- Alimentation spécifique le jour de l'ascension
- Recommandations pour les séjours prolongés en altitude
- Stratégies d'hydratation adaptées
- Conseils sur les compléments alimentaires bénéfiques en altitude

**Intégration :** Ce contenu est intégré au fichier JSON existant de plans nutritionnels et accessible via le contrôleur `nutrition.controller.js` et le service `nutrition.service.js`.

### 1.2 Plan Nutrition Longue Distance

**Fichier :** `content/nutrition/plan-nutrition-longue-distance.json`  
**Description :** Plan nutritionnel complet pour les cyclistes préparant des événements de longue distance (200km+) ou des cyclosportives sur plusieurs jours.

**Points clés :**
- Stratégies de chargement glycogénique avant l'événement
- Nutrition périodisée avec 4 phases distinctes (pré-événement, chargement glycogénique, jour de l'événement, récupération)
- Conseils d'hydratation détaillés selon les conditions climatiques
- Recettes maison pour barres énergétiques et boissons isotoniques
- Adaptation nutritionnelle selon différentes conditions (chaleur, froid, altitude)

**Intégration :** Ce fichier JSON autonome peut être intégré via le contrôleur de nutrition existant pour enrichir l'offre de plans nutritionnels spécialisés.

### 1.3 Plan Nutrition Récupération Optimale

**Fichier :** `content/nutrition/plan-nutrition-recuperation.json`  
**Description :** Plan nutritionnel scientifique détaillant les stratégies alimentaires pour maximiser la récupération après l'effort cycliste.

**Points clés :**
- Stratégies nutritionnelles périodisées pour chaque fenêtre temporelle post-effort (0-30min, 30min-2h, 2h-24h, 24-48h)
- Recommandations précises de macronutriments selon le timing et l'intensité des efforts
- Aliments spécifiques avec leurs propriétés anti-inflammatoires et antioxydantes
- Guide complet de supplémentation ciblée pour la récupération
- Protocole d'hydratation détaillé avec électrolytes
- Stratégies d'adaptation selon l'âge, le niveau, et le type d'effort

**Intégration :** Ce fichier JSON autonome s'intègre parfaitement avec les autres plans nutritionnels et complète l'écosystème d'entraînement en offrant le volet récupération, essentiel à la progression.

### 1.4 Plan Nutritionnel Spécial Compétition

**Fichier :** `content/nutrition/plan-nutrition-competition.json`  
**Description :** Plan nutritionnel scientifique ultra-détaillé pour optimiser les performances lors d'événements compétitifs cyclistes.

**Structure du plan :**
- Phase 1 (J-14 à J-8) : Préparation nutritionnelle fondamentale
- Phase 2 (J-7 à J-4) : Chargement glycogénique progressif
- Phase 3 (J-2 à J-1) : Affinage pré-compétition
- Phase 4 (Jour J) : Stratégie nutritionnelle de compétition détaillée

**Points clés :**
- Protocole complet de 14 jours couvrant l'avant, le pendant et l'immédiat après-compétition
- Stratégies de chargement glycogénique scientifiquement optimisées
- Timing précis des apports nutritionnels le jour de la compétition
- Recommandations détaillées pour chaque type d'effort (courte, moyenne, longue distance)
- Adaptations stratégiques aux conditions environnementales (chaleur, froid, altitude)
- Guide de supplémentation ergogénique basé sur les preuves scientifiques
- Solutions de dépannage pour problèmes digestifs, crampes et déshydratation
- Recommandations d'équipement nutritionnel spécifique

**Particularité :** Ce plan représente l'état de l'art en nutrition de compétition cycliste, combinant la science nutritionnelle la plus récente avec des stratégies pratiques éprouvées au plus haut niveau. Il offre un niveau de détail et de personnalisation inégalé, notamment avec son guide de troubleshooting complet pour gérer les problèmes courants en compétition.

**Intégration :** Ce plan premium complète parfaitement les autres plans nutritionnels et peut être intégré via le même contrôleur. Il est particulièrement pertinent à relier avec les programmes d'entraînement spécifiques et peut être proposé comme complément aux cyclistes préparant une cyclosportive majeure.

## 2. Programmes d'Entraînement

{{ ... }}

## 3. Itinéraires Premium

{{ ... }}

## 4. Compétences Techniques (à venir)

{{ ... }}

## 5. Enrichissement des Cols

{{ ... }}

## 6. Relation et Complémentarité des Contenus

Les contenus développés sont interconnectés pour offrir une expérience complète et intégrée aux utilisateurs :

1. Les **Programmes d'Entraînement** (Haute Montagne, Mont Ventoux et Angliru) préparent physiquement les cyclistes pour des ascensions spécifiques allant des longues montées régulières aux pentes extrêmes
2. Les **Plans Nutrition** (Haute Montagne, Longue Distance, Récupération et Compétition) complètent la préparation avec des stratégies nutritionnelles adaptées à chaque phase d'entraînement et de compétition
3. Les **données enrichies des cols de montagne** (14 cols majeurs) fournissent toutes les informations nécessaires sur les objectifs d'ascension
4. Les **itinéraires premium** offrent des défis d'envergure combinant plusieurs cols avec une logistique complète
5. Les futures **Compétences Techniques** apporteront la dimension sécurité et maîtrise technique

Cette approche holistique fait de Velo-Altitude une plateforme complète, où chaque contenu renforce les autres. Des liens croisés entre contenus sont établis via la propriété `relatedContent` présente dans chaque fichier JSON, permettant une navigation fluide entre :

- Les cols présents dans un itinéraire → fiches détaillées des cols
- Un programme d'entraînement spécifique → col ciblé et plans nutritionnels adaptés
- Un itinéraire premium → programmes d'entraînement et plans nutritionnels recommandés
- Un plan nutritionnel de compétition → programme d'entraînement spécifique et itinéraire premium correspondant

## 7. Instructions pour l'Agent Frontend

Pour déployer ces contenus :

1. **Plans de nutrition** : Intégrer directement les fichiers JSON dans le système existant
2. **Programmes d'entraînement** : Implémenter une solution pour charger ces programmes (voir note d'intégration)
3. **Itinéraires premium** : Développer un nouveau module avec fonctionnalités cartographiques
4. **Données enrichies des cols** : Copier les fichiers JSON dans le dossier `/server/data/enriched-cols/` en respectant la structure existante
5. **Interface utilisateur** : Créer des liens entre ces différents contenus pour mettre en valeur leur complémentarité, en s'appuyant sur les propriétés `relatedContent`
6. **Tester** : Vérifier que les nouveaux contenus s'affichent correctement et sont accessibles via l'API existante

## 8. Prochaines Étapes de Développement de Contenu

Pour faire de Velo-Altitude la référence absolue du cyclisme en Europe, les prochaines étapes planifiées incluent :

- **Module Compétences Techniques** : Finaliser le guide de descente et développer d'autres guides techniques (positionnement, aérodynamisme, etc.)
- **Itinéraires Premium additionnels** : 
  - Tour des Dolomites
  - Grande Traversée des Pyrénées
  - Route des Grands Cols Suisses
- **Plans d'entraînement spécifiques** pour d'autres cols majeurs (Stelvio, Mortirolo, etc.)
- **Expansion de l'écosystème nutritionnel** avec des guides spécifiques :
  - Nutrition cycliste végétarienne et végane
  - Nutrition adaptée aux seniors
  - Stratégies anti-inflammation naturelles
- **Contenus vidéo et interactifs** : Tutoriels techniques et visualisations 3D des ascensions
- **Module Performance** : Tests spécifiques, analyses de données, et conseils personnalisés
- **Calendrier événements** : Base de données exhaustive des cyclosportives et événements européens
- **Communauté** : Outils pour partager expériences, conseils et récits d'ascension

L'objectif est de continuer à enrichir la plateforme avec du contenu premium, faisant de Velo-Altitude une ressource incontournable pour les cyclistes de tous niveaux souhaitant explorer les plus beaux cols d'Europe.
