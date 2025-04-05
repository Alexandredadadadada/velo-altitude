# Documentation sur le Support Multilingue - Dashboard-Velo.com

## Introduction

Dashboard-Velo.com est conçu avec un support multilingue complet pour répondre aux besoins des cyclistes dans toute l'Europe. Cette documentation détaille l'architecture de traduction, les processus de maintenance et de vérification, et les procédures pour ajouter de nouvelles langues ou améliorer les traductions existantes.

## Langues Supportées

Le système prend actuellement en charge les langues suivantes :

| Code | Langue   | Niveau de Support | Responsable  |
|------|----------|-------------------|--------------|
| fr   | Français | Référence (100%)  | Équipe principale |
| en   | Anglais  | Complet           | Sarah Martin |
| de   | Allemand | Complet           | Thomas Weber |
| it   | Italien  | Complet           | Marco Bianchi |
| es   | Espagnol | Complet           | Carmen Rodriguez |

## Architecture de Traduction

### Structure des Fichiers

Les fichiers de traduction sont situés dans le répertoire `src/locales/` avec la structure suivante :

```
src/locales/
├── fr/
│   └── translation.json     # Langue de référence (française)
├── en/
│   └── translation.json     # Traductions anglaises
├── de/
│   └── translation.json     # Traductions allemandes
├── it/
│   └── translation.json     # Traductions italiennes
├── es/
│   └── translation.json     # Traductions espagnoles
└── missing_translations/    # Templates des traductions manquantes
    ├── en_missing.json
    ├── de_missing.json
    ├── it_missing.json
    └── es_missing.json
```

### Format des Fichiers de Traduction

Les fichiers de traduction utilisent le format JSON avec une structure hiérarchique. Exemple :

```json
{
  "common": {
    "buttons": {
      "save": "Enregistrer",
      "cancel": "Annuler",
      "delete": "Supprimer"
    },
    "messages": {
      "confirmDelete": "Êtes-vous sûr de vouloir supprimer cet élément ?"
    }
  },
  "training": {
    "ftpCalculator": {
      "title": "Calculateur FTP",
      "description": "Estimez votre Seuil Fonctionnel de Puissance"
    }
  }
}
```

### Implémentation Technique

Le système utilise la bibliothèque i18next pour la gestion des traductions :

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    }
  });

export default i18n;
```

### Utilisation dans les Composants

Exemple d'utilisation des traductions dans les composants React :

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

function TrainingModule() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('training.ftpCalculator.title')}</h1>
      <p>{t('training.ftpCalculator.description')}</p>
      <button>{t('common.buttons.save')}</button>
    </div>
  );
}
```

## Outils de Gestion des Traductions

### Utilitaire de Vérification des Traductions

Le script `checkTranslations.js` situé dans le répertoire `scripts/` permet de :

1. Vérifier l'exhaustivité des traductions pour chaque langue
2. Générer un rapport détaillé des traductions manquantes
3. Créer des templates JSON pour faciliter l'ajout des traductions manquantes

#### Utilisation

```bash
node scripts/checkTranslations.js
```

#### Fonctionnalités

- **Détection des traductions manquantes** : Compare chaque langue avec la langue de référence (français)
- **Génération de rapport Markdown** : Crée un rapport détaillé dans `docs/translation_report.md`
- **Templates de traduction** : Génère des fichiers JSON avec les clés manquantes dans `src/locales/missing_translations/`

### Interface d'Administration des Traductions

Une interface d'administration est disponible pour les utilisateurs autorisés à l'URL `/admin/translations`. Cette interface permet :

1. Visualiser l'état des traductions par langue et par module
2. Éditer directement les traductions manquantes
3. Importer/exporter des fichiers de traduction
4. Valider les nouvelles traductions avant leur mise en production

## Procédures de Maintenance

### Ajout de Nouvelles Chaînes de Caractères

Pour ajouter de nouvelles chaînes à traduire :

1. Ajoutez d'abord la chaîne au fichier de référence (`fr/translation.json`)
2. Exécutez le script de vérification pour identifier les nouvelles chaînes manquantes
3. Complétez les traductions manquantes pour chaque langue
4. Validez les traductions avec l'équipe linguistique si nécessaire

### Modification de Chaînes Existantes

Pour modifier une chaîne existante :

1. Mettez à jour la chaîne dans le fichier de référence
2. Marquez la chaîne comme "à réviser" dans le système de suivi
3. Notifiez les traducteurs des modifications requises
4. Validez les changements dans toutes les langues

### Ajout d'une Nouvelle Langue

Pour ajouter une nouvelle langue supportée :

1. Créez un nouveau répertoire dans `src/locales/` (ex: `nl/` pour le néerlandais)
2. Copiez la structure du fichier de référence (`fr/translation.json`)
3. Traduisez le contenu ou utilisez initialement la traduction automatique comme point de départ
4. Ajoutez la nouvelle langue dans la configuration i18next
5. Mettez à jour la liste des langues dans le sélecteur de langue de l'interface

## Tests et Assurance Qualité

### Méthodologie de Test

Les traductions sont testées selon la méthodologie suivante :

1. **Tests automatisés** : Vérification de la présence de toutes les clés
2. **Tests visuels** : Vérification que les traductions s'affichent correctement dans l'interface
3. **Tests de débordement** : Vérification que les textes longs n'altèrent pas la mise en page
4. **Tests linguistiques** : Révision par des locuteurs natifs

### Scénarios de Test

Pour tester efficacement les traductions, nous utilisons les scénarios suivants :

1. **Changement de langue en cours de session** : Vérifier que l'interface se met à jour correctement
2. **Navigation complète** : Parcourir toutes les pages dans chaque langue
3. **Formulaires et validation** : Tester les messages d'erreur et de succès
4. **Contenu dynamique** : Vérifier les données générées dynamiquement (dates, nombres, etc.)

### Checklist de Vérification

Pour chaque module, la checklist suivante doit être validée :

- [ ] Toutes les chaînes statiques sont traduites
- [ ] Les contenus dynamiques (messages d'erreur, notifications) s'affichent correctement
- [ ] Les pluriels et les formes grammaticales particulières sont correctement gérés
- [ ] Les caractères spéciaux et accents s'affichent correctement
- [ ] La traduction maintient la cohérence terminologique avec le reste de l'application
- [ ] La longueur des textes ne cause pas de problèmes d'affichage

## Guide des Bonnes Pratiques

### Conventions de Nommage des Clés

- Utilisez le format camelCase pour les clés
- Structurez hiérarchiquement les clés par module et sous-module
- Limitez la profondeur à 3-4 niveaux maximum
- Utilisez des noms descriptifs et évitez les abréviations

### Gestion des Variables

Utilisez le format suivant pour les variables dans les traductions :

```json
{
  "welcome": "Bonjour, {{name}} !",
  "rideStats": "Vous avez parcouru {{distance}} km à {{speed}} km/h."
}
```

### Pluralisation

Utilisez le format suivant pour gérer les pluriels :

```json
{
  "col_count": "{{count}} col",
  "col_count_plural": "{{count}} cols"
}
```

### Terminologie Spécifique

Maintenez un glossaire de termes techniques à conserver identiques ou à adapter selon la langue. Par exemple :

| Terme (FR) | EN | DE | IT | ES |
|------------|----|----|----|----|
| FTP | FTP | FTP | FTP | FTP |
| Col | Mountain Pass | Pass | Colle | Puerto |
| Puissance normalisée | Normalized Power | Normalisierte Leistung | Potenza normalizzata | Potencia normalizada |

## Statut Actuel et Améliorations Prévues

### Statut des Traductions

Selon le dernier rapport de vérification (mise à jour : avril 2025) :

- Français : 100% (référence)
- Anglais : 99.8% complet
- Allemand : 98.2% complet
- Italien : 97.5% complet
- Espagnol : 96.9% complet

### Améliorations Prévues

Les améliorations suivantes sont planifiées pour les prochaines versions :

1. **Support RTL** : Préparation pour les langues écrites de droite à gauche
2. **Ajout du néerlandais** : Extension du support aux Pays-Bas et à la Flandre
3. **Régionalisation** : Support des variantes régionales (français canadien, espagnol latino-américain, etc.)
4. **Traduction du contenu dynamique** : Mise en place d'un système pour traduire le contenu généré par les utilisateurs
5. **Interface de traduction collaborative** : Permettre aux utilisateurs avancés de proposer des améliorations

## Résolution des Problèmes Courants

### Traductions Manquantes

Si une traduction est manquante :

1. Vérifiez que la clé existe dans le fichier de référence
2. Exécutez le script de vérification pour identifier les clés manquantes
3. Ajoutez la traduction manquante dans le fichier approprié
4. Redémarrez l'application ou videz le cache des traductions

### Problèmes d'Affichage

Si une traduction s'affiche incorrectement :

1. Vérifiez l'encodage du fichier (UTF-8 requis)
2. Assurez-vous que les caractères spéciaux sont correctement échappés
3. Vérifiez la longueur du texte (possibilité de débordement)
4. Inspectez les variables et leur substitution

### Incohérences Terminologiques

Si vous remarquez des incohérences terminologiques :

1. Consultez le glossaire des termes techniques
2. Signalez l'incohérence via le système de suivi
3. Proposez une correction uniforme pour toutes les occurrences
4. Mettez à jour le glossaire si nécessaire

## Annexes

### Glossaire Complet

Un glossaire complet de la terminologie technique est disponible dans le fichier `docs/TERMINOLOGY_GLOSSARY.md`.

### Rapports de Vérification

Les rapports de vérification des traductions sont générés mensuellement et archivés dans `docs/translation_reports/`.

### Contacts des Responsables Linguistiques

Pour toute question concernant les traductions, contactez le responsable de la langue concernée :

- Français : team@dashboard-velo.com
- Anglais : sarah.martin@dashboard-velo.com
- Allemand : thomas.weber@dashboard-velo.com
- Italien : marco.bianchi@dashboard-velo.com
- Espagnol : carmen.rodriguez@dashboard-velo.com
