# Guide de Test d'Interface Multilingue

## Introduction

Ce document décrit les procédures et méthodologies pour tester l'interface Dashboard-Velo dans toutes les langues supportées (français, anglais, allemand, italien et espagnol). Ces tests sont essentiels pour garantir une expérience utilisateur cohérente et de haute qualité quelle que soit la langue choisie.

## Objectifs des Tests

1. Vérifier que toutes les chaînes de texte sont correctement traduites
2. S'assurer que l'interface s'adapte aux différentes longueurs de texte
3. Tester les fonctionnalités spécifiques aux langues (formats de date, nombres, etc.)
4. Vérifier la cohérence des unités de mesure
5. Identifier et corriger les problèmes d'affichage ou de fonctionnalité liés aux langues

## Méthodologie de Test

### 1. Tests de Base de l'Interface

Pour chaque langue, effectuer les vérifications suivantes :

| Test | Description | Points de contrôle |
|------|-------------|-------------------|
| Navigation | Vérifier tous les éléments de navigation | Menu principal, sous-menus, fil d'Ariane |
| Pages principales | Vérifier chaque page principale | Titres, descriptions, boutons d'action |
| Formulaires | Tester tous les formulaires | Labels, placeholders, messages d'erreur, boutons |
| Messages système | Vérifier les messages système | Notifications, confirmations, erreurs |
| Aide et tooltips | Contrôler les textes d'aide | Infobulles, pages d'aide, FAQ |

### 2. Tests d'Adaptation du Design

| Test | Description | Point de contrôle |
|------|-------------|-------------------|
| Troncatures | Vérifier l'absence de texte tronqué | Boutons, en-têtes, menus déroulants |
| Débordements | Identifier les débordements de texte | Cartes, tableaux, listes |
| Mise en page | Contrôler la mise en page globale | Alignement, espacement, proportions |
| Responsive | Tester sur différentes tailles d'écran | Mobile, tablette, desktop |
| Polices | Vérifier le rendu des caractères spéciaux | Accents, caractères spécifiques (ß, ñ, etc.) |

### 3. Tests Fonctionnels Spécifiques aux Langues

| Test | Description | Point de contrôle |
|------|-------------|-------------------|
| Formats de date | Vérifier les formats de date | Calendriers, planificateurs, historiques |
| Formats numériques | Contrôler l'affichage des nombres | Séparateurs décimaux (,/.), milliers |
| Unités de mesure | Vérifier la cohérence des unités | Métrique vs Impérial selon préférences |
| Tri alphabétique | Tester les fonctions de tri | Respect des règles alphabétiques de la langue |
| Recherche | Vérifier la fonctionnalité de recherche | Accents, sensibilité à la casse |

## Liste de Contrôle par Module

### Module Général

- [ ] Page d'accueil et navigation principale
- [ ] Inscription et connexion
- [ ] Paramètres du compte
- [ ] Notifications et messages système
- [ ] Aide et support

### Module Cols

- [ ] Liste des cols et filtres
- [ ] Fiches détaillées des cols
- [ ] Cartes et visualisations
- [ ] Téléchargement des tracés GPX
- [ ] Commentaires et avis

### Module Entraînement

- [ ] Calculateur FTP
- [ ] Programmes d'entraînement
- [ ] Planificateur de séances
- [ ] Suivi de progression
- [ ] Intégration Strava

### Module Nutrition

- [ ] Recettes par catégorie
- [ ] Détails des recettes
- [ ] Plan nutritionnel
- [ ] Calculateur de besoins caloriques
- [ ] Recommandations personnalisées

### Module Profil

- [ ] Informations personnelles
- [ ] Statistiques et performances
- [ ] Historique d'activités
- [ ] Objectifs et badges
- [ ] Connexions aux services externes

## Procédure de Test pour Chaque Langue

1. **Préparation**
   - Changer la langue de l'application
   - Effacer le cache du navigateur
   - Se connecter avec un compte de test

2. **Exécution**
   - Suivre les scénarios de test définis pour chaque module
   - Prendre des captures d'écran des problèmes
   - Noter les observations dans le formulaire de rapport

3. **Vérification**
   - Comparer les résultats avec les comportements attendus
   - Vérifier la cohérence avec la langue de référence (français)
   - Consulter les glossaires techniques pour la terminologie

4. **Rapport**
   - Compléter le formulaire de rapport standardisé
   - Classer les problèmes par priorité (critique, majeur, mineur)
   - Ajouter des captures d'écran et des étapes de reproduction

## Scénarios de Test Clés

### Scénario 1: Parcours Utilisateur Complet

1. Inscription/Connexion
2. Configuration du profil
3. Recherche d'un col
4. Consultation des détails
5. Ajout aux favoris
6. Planification d'un entraînement
7. Recherche de recettes
8. Personnalisation du plan

### Scénario 2: Utilisation des Fonctionnalités de Date

1. Planification d'une sortie
2. Consultation du calendrier
3. Programmation d'un événement
4. Visualisation de l'historique
5. Filtrage par période

### Scénario 3: Test des Unités et Formats

1. Changement des unités (métrique/impérial)
2. Vérification des distances, élévations, poids
3. Saisie de valeurs numériques dans les formulaires
4. Validation des calculs (calories, watts, etc.)
5. Exportation de données

## Problèmes Fréquents et Solutions

| Problème | Cause Possible | Solution |
|----------|----------------|----------|
| Texte tronqué | Traduction plus longue que l'original | Ajuster l'espace du conteneur ou abréger la traduction |
| Caractères incorrects | Problème d'encodage | Vérifier l'encodage UTF-8 dans les fichiers de traduction |
| Dates incorrectes | Format non adapté à la locale | Utiliser les fonctions de formatage basées sur la locale |
| Alignement cassé | Textes de longueurs très différentes | Implémenter un design flexible ou des ellipses |
| Unités incohérentes | Mélange des systèmes | Standardiser selon les préférences utilisateur |

## Résultats des Tests et Corrections

### Français (Référence)

Aucun problème majeur identifié, la langue de référence sert de base de comparaison.

### Anglais

| Problème | Statut | Correction |
|----------|--------|------------|
| Incohérence dans les termes d'entraînement | Corrigé | Standardisation du glossaire technique |
| Format de date dans le planificateur | En cours | Implémentation du format MM/DD/YYYY |
| Bouton "Enregistrer" tronqué sur mobile | Corrigé | Augmentation de la largeur du bouton |

### Allemand

| Problème | Statut | Correction |
|----------|--------|------------|
| Textes de menu débordants | Corrigé | Design adaptatif et abréviations pour le mobile |
| Caractère "ß" mal affiché dans certaines polices | Corrigé | Mise à jour des polices avec meilleur support Unicode |
| Termes techniques incohérents | En cours | Révision par locuteur natif |

### Italien

| Problème | Statut | Correction |
|----------|--------|------------|
| Problèmes d'alignement dans les tableaux | Corrigé | Refonte du design des tableaux |
| Certaines traductions manquantes dans les recettes | En cours | Ajout des traductions manquantes |
| Format des nombres dans les calculs | Corrigé | Adaptation au format 1.000,00 |

### Espagnol

| Problème | Statut | Correction |
|----------|--------|------------|
| Textes trop longs dans la navigation | Corrigé | Raccourcissement des termes ou design adaptatif |
| Accent dans les recherches non pris en compte | Corrigé | Amélioration de l'algorithme de recherche |
| Labels de formulaire mal alignés | En cours | Refonte du design des formulaires |

## Recommandations Générales

1. **Design Adaptatif**
   - Prévoir des conteneurs flexibles pour les textes de longueurs variables
   - Utiliser des ellipses pour les textes très longs
   - Implémenter des versions courtes/longues des libellés selon l'espace disponible

2. **Gestion des Formats**
   - Utiliser les API natives de formatage (Intl.DateTimeFormat, Intl.NumberFormat)
   - Permettre à l'utilisateur de choisir un format indépendamment de la langue
   - Documenter clairement les formats utilisés dans chaque langue

3. **Traductions**
   - Maintenir un glossaire technique multilingue pour assurer la cohérence
   - Privilégier des phrases courtes et claires
   - Éviter l'argot et les expressions idiomatiques difficiles à traduire

4. **Tests Automatisés**
   - Mettre en place des tests automatisés pour détecter les chaînes non traduites
   - Créer des tests de charge visuelle pour identifier les problèmes d'UI
   - Implémenter des vérifications de cohérence des formats

## Annexes

### Outils de Test

- **Capture d'écran automatisée**: Puppeteer/Playwright
- **Vérification de traduction**: Script de vérification d'exhaustivité
- **Test visuel de régression**: Percy/Applitools
- **Validation des formats**: Tests unitaires avec Jest

### Glossaire Technique Multilingue

Un extrait du glossaire technique utilisé pour assurer la cohérence terminologique:

| Français | Anglais | Allemand | Italien | Espagnol |
|----------|---------|----------|---------|----------|
| Seuil | Threshold | Schwelle | Soglia | Umbral |
| Puissance | Power | Leistung | Potenza | Potencia |
| Cadence | Cadence | Trittfrequenz | Cadenza | Cadencia |
| Dénivelé | Elevation | Höhenunterschied | Dislivello | Desnivel |
| Récupération | Recovery | Erholung | Recupero | Recuperación |

### Formats Régionaux

| Langue | Format de Date | Format Numérique | Unités Par Défaut |
|--------|---------------|------------------|-------------------|
| Français | JJ/MM/AAAA | 1 234,56 | Métrique |
| Anglais (UK) | DD/MM/YYYY | 1,234.56 | Métrique |
| Anglais (US) | MM/DD/YYYY | 1,234.56 | Impérial |
| Allemand | TT.MM.JJJJ | 1.234,56 | Métrique |
| Italien | GG/MM/AAAA | 1.234,56 | Métrique |
| Espagnol | DD/MM/AAAA | 1.234,56 | Métrique |

## Conclusion

Les tests d'interface multilingue sont une étape cruciale pour garantir une expérience utilisateur de qualité dans toutes les langues supportées. En suivant cette méthodologie rigoureuse, nous pouvons identifier et résoudre les problèmes spécifiques à chaque langue avant le déploiement en production, assurant ainsi une application véritablement internationale et professionnelle.
