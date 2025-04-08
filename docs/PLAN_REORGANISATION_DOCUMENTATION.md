# Plan de Réorganisation de la Documentation Velo-Altitude

## Problématique
La documentation du projet est actuellement dispersée dans de nombreux fichiers Markdown sans structure cohérente, ce qui rend difficile la navigation et la maintenance.

## Objectif
Restructurer la documentation selon la hiérarchie définie dans `STRUCTURE_PROJET.md` en consolidant les fichiers similaires et en organisant la documentation par domaine fonctionnel.

## Plan d'action

### 1. Structure cible

```
docs/
├── equipes/                    # Documentation par équipe
│   ├── architecture/           # Équipe 1
│   ├── visualisation/          # Équipe 2
│   ├── entrainement/           # Équipe 3
│   ├── cols/                  # Équipe 4
│   └── communaute/            # Équipe 5
│
├── technique/                 # Documentation technique
│   ├── API/
│   ├── SECURITE/
│   ├── PERFORMANCE/
│   └── DATABASE/
│
├── deploiement/               # Documentation de déploiement
│   └── solutions/             # Solutions aux problèmes courants
│
└── guides/                    # Guides utilisateurs et développeurs
    ├── utilisateur/
    └── developpeur/
```

### 2. Fichiers à consolider par thématique

#### Documentation d'architecture
- `ARCHITECTURE.md`
- `FRONTEND_ARCHITECTURE.md`
- `API_ARCHITECTURE.md`
- `technique/ARCHITECTURE.md`
- ➔ Consolider dans `technique/ARCHITECTURE_COMPLETE.md`

#### Documentation API
- Fichiers existants dans `technique/API/`
- ➔ Conserver et compléter si nécessaire

#### Documentation de déploiement
- Tous les fichiers `DEPLOYMENT_*.md`
- `PLAN_DEPLOIEMENT.md`
- `NETLIFY_*.md`
- ➔ Consolider dans `deploiement/GUIDE_DEPLOIEMENT.md`

#### Documentation des modules
- Fichiers spécifiques aux modules déjà présents dans `docs/equipes/*/`
- ➔ Conserver la structure existante

#### Documentation d'état du projet
- `ETAT_PROJET.md`
- `DETTE_TECHNIQUE.md`
- `DETTE_TECHNIQUE_RESOLVED.md`
- `CHANGELOG.md`
- `*_STATUS.md`
- ➔ Consolider dans `docs/ETAT_PROJET_COMPLET.md`

### 3. Étapes de mise en œuvre

1. **Créer tous les répertoires** nécessaires selon la structure cible

2. **Pour chaque thématique :**
   - Identifier les fichiers sources
   - Créer un nouveau document consolidé dans le répertoire cible
   - Incorporer le contenu des fichiers sources avec des séparateurs clairs
   - Ajouter une table des matières au début du document

3. **Pour les fichiers isolés :**
   - Identifier le répertoire cible approprié
   - Déplacer le fichier dans ce répertoire

4. **Nettoyer les fichiers redondants**
   - Créer un répertoire `.archive` à la racine du projet
   - Y déplacer les fichiers qui ont été consolidés

### 4. Vérification finale

Une fois la consolidation terminée, vérifier que :
- Les liens internes fonctionnent correctement
- Tous les documents ont été correctement catégorisés
- La structure est conforme au plan dans `STRUCTURE_PROJET.md`

### 5. Mise à jour de la documentation

Mettre à jour les références aux documents dans :
- `README.md` principal
- Documents de référence

## Priorités

1. Documentation des équipes (déjà bien structurée)
2. Documentation technique
3. Documentation de déploiement
4. Documentation d'état du projet
5. Guides utilisateurs et développeurs

## Prochaines étapes

Pour chaque document consolidé, il faudra ensuite :
1. Harmoniser le style et la présentation
2. Éliminer les redondances
3. Mettre à jour les informations obsolètes
4. Compléter les sections manquantes
