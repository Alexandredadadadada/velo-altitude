# Analyse d'inventaire - Velo-Altitude

*Date : 6 avril 2025*

## Statistiques globales

| Type de contenu | Nombre | Emplacement principal | Format |
|-----------------|--------|----------------------|--------|
| Cols | 52+ | /server/data/cols/enriched/ | JSON |
| Programmes d'entraînement | 6+ | /server/data/training/ | JSON |
| Nutrition | 0 | /server/data/nutrition/ | - |

## Cols

### Analyse des doublons potentiels

Après analyse des 52 fichiers JSON de cols, les doublons potentiels suivants ont été identifiés :

- **Stelvio** : "passo-dello-stelvio.json" et "stelvio-pass.json" (même col, noms différents)
- **Veleta** : "pico-de-veleta.json" et "pico-veleta.json" (même col, variations de nom)
- **Mortirolo** : "passo-del-mortirolo.json" et "passo-dello-mortirolo.json" (même col, erreur d'orthographe)
- **Finestre** : "colle-del-finestre.json" et "colle-delle-finestre.json" (même col, erreur d'orthographe)
- **Gavia** : "passo-di-gavia.json" et "passo-gavia.json" (même col, variations de nom)

### Recommandations pour les cols

1. **Fusionner les doublons** en gardant la fiche la plus complète et en adoptant le nom le plus couramment utilisé
2. **Standardiser les noms** en utilisant la convention la plus reconnue (ex: "passo-dello-stelvio" pour Stelvio)
3. **Compléter les fiches** pour atteindre 100% d'information pour chaque col

## Programmes d'entraînement

Les 6 programmes d'entraînement existants ("route-001.json" à "route-005.json" + index.json) utilisent une convention de nommage technique plutôt que descriptive.

### Recommandations pour les programmes d'entraînement

1. **Renommer les fichiers** avec des noms descriptifs (ex: "debutant-4-semaines.json" au lieu de "route-001.json")
2. **Enrichir le contenu** avec des descriptions plus détaillées, des variations et des liens vers les cols correspondants
3. **Standardiser la structure** pour faciliter l'affichage et le filtrage dans l'interface

## Nutrition

Le dossier nutrition est actuellement vide, alors que le site devrait proposer plus de 100 recettes selon les objectifs.

### Recommandations pour la nutrition

1. **Créer la structure de dossiers** : /nutrition/recipes/ et /nutrition/plans/
2. **Migrer les recettes** depuis leur emplacement actuel (probablement dans client/src/data/)
3. **Standardiser chaque recette** selon le modèle défini dans nos scripts

## Structure d'URL recommandée

Pour assurer une navigation claire et intuitive, nous recommandons la structure d'URL suivante :

```
/cols/{slug}                 # ex: /cols/passo-dello-stelvio
/entrainement/{slug}         # ex: /entrainement/haute-montagne-8-semaines
/nutrition/recettes/{slug}   # ex: /nutrition/recettes/energy-bars-avoine-miel
/nutrition/plans/{slug}      # ex: /nutrition/plans/preparation-haute-montagne
/7-majeurs/{slug}            # ex: /7-majeurs/tour-des-alpes
```

## Prochaines étapes

1. Mettre à jour la structure React Router avec ces nouvelles routes
2. Exécuter les scripts de standardisation pour chaque type de contenu
3. Résoudre les doublons identifiés dans les cols
4. Créer un système d'indexation global pour faciliter les recherches
