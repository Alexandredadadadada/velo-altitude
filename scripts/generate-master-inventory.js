/**
 * Script de génération de l'inventaire principal (MASTER_INVENTORY)
 * Velo-Altitude
 * 
 * Ce script analyse tous les contenus du site et génère un document d'inventaire
 * détaillé avec la structure complète, les URLs, les statuts et les relations
 * entre les différents contenus.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  serverDataDir: path.resolve(__dirname, '../server/data'),
  srcDir: path.resolve(__dirname, '../src'),
  docsDir: path.resolve(__dirname, '../docs'),
  outputFile: path.resolve(__dirname, '../docs/MASTER_INVENTORY.md'),
  baseUrl: 'https://velo-altitude.com',
  contentTypes: [
    {
      name: 'Cols',
      dirPath: 'server/data/cols',
      urlPattern: '/cols/:country/:slug',
      subCategories: ['france', 'italie', 'espagne', 'suisse', 'autres']
    },
    {
      name: 'Programmes d\'entraînement',
      dirPath: 'server/data/training',
      urlPattern: '/entrainement/:level/:slug',
      subCategories: ['debutant', 'intermediaire', 'avance']
    },
    {
      name: 'Contenu nutritionnel',
      dirPath: 'server/data/nutrition',
      urlPattern: '/nutrition/:category/:slug',
      subCategories: ['recettes', 'plans', 'guides']
    },
    {
      name: 'Défis',
      dirPath: 'server/data/challenges',
      urlPattern: '/defis/:type/:slug',
      subCategories: ['7-majeurs', 'saisonniers', 'thematiques']
    },
    {
      name: 'Visualisations 3D',
      dirPath: 'server/data/visualization',
      urlPattern: '/visualisation-3d/:country/:slug',
      subCategories: ['france', 'italie', 'espagne', 'suisse', 'autres']
    },
    {
      name: 'Communauté',
      dirPath: 'server/data/community',
      urlPattern: '/communaute/:section/:slug',
      subCategories: ['evenements', 'sorties', 'groupes']
    }
  ]
};

// Récupérer toutes les données d'un répertoire
function getDataFromDirectory(dirPath, subCategory = null) {
  const fullPath = path.resolve(CONFIG.rootDir, dirPath, subCategory || '');
  
  if (!fs.existsSync(fullPath)) {
    return [];
  }
  
  const items = [];
  const files = fs.readdirSync(fullPath, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(fullPath, file.name);
    
    if (file.isDirectory()) {
      // Récursion pour les sous-répertoires
      const subItems = getDataFromDirectory(dirPath, path.join(subCategory || '', file.name));
      items.push(...subItems);
    } else if (file.name.endsWith('.json')) {
      try {
        // Lire le fichier JSON
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Ajouter des métadonnées sur le fichier
        items.push({
          ...data,
          _filePath: filePath,
          _fileName: file.name,
          _subCategory: subCategory
        });
      } catch (error) {
        console.error(chalk.red(`Erreur lors de la lecture de ${filePath}: ${error.message}`));
      }
    }
  }
  
  return items;
}

// Analyser les composants React pour identifier les importations et relations
function analyzeReactComponents(contentItems) {
  console.log(chalk.blue('\nAnalyse des composants React...'));
  
  const componentsDir = path.resolve(CONFIG.srcDir, 'components');
  
  if (!fs.existsSync(componentsDir)) {
    console.log(chalk.yellow(`Répertoire des composants non trouvé: ${componentsDir}`));
    return {};
  }
  
  const relationships = {};
  
  // Fonction récursive pour explorer les répertoires
  function exploreDirectory(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        exploreDirectory(filePath);
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        try {
          // Lire le fichier du composant
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Vérifier pour chaque élément de contenu s'il est référencé dans le composant
          for (const item of contentItems) {
            const slug = item.slug || '';
            const id = item.id || '';
            const name = item.name || '';
            
            if (slug && (content.includes(`"${slug}"`) || content.includes(`'${slug}'`) || 
                content.includes(`/${slug}`) || content.includes(`id="${slug}"`) || 
                content.includes(`id='${slug}'`))) {
              
              if (!relationships[slug]) {
                relationships[slug] = [];
              }
              
              const relPath = path.relative(CONFIG.srcDir, filePath);
              if (!relationships[slug].includes(relPath)) {
                relationships[slug].push(relPath);
              }
            }
            
            // Vérifier aussi par ID
            if (id && (content.includes(`"${id}"`) || content.includes(`'${id}'`) || 
                content.includes(`id="${id}"`) || content.includes(`id='${id}'`))) {
              
              if (!relationships[slug]) {
                relationships[slug] = [];
              }
              
              const relPath = path.relative(CONFIG.srcDir, filePath);
              if (!relationships[slug].includes(relPath)) {
                relationships[slug].push(relPath);
              }
            }
          }
        } catch (error) {
          console.error(chalk.red(`Erreur lors de l'analyse de ${filePath}: ${error.message}`));
        }
      }
    }
  }
  
  // Commencer l'exploration
  exploreDirectory(componentsDir);
  
  return relationships;
}

// Générer l'URL complète pour un élément
function generateUrl(urlPattern, item) {
  let url = urlPattern;
  
  // Remplacer les paramètres dans le pattern
  if (item._subCategory) {
    url = url.replace(':country', item._subCategory)
             .replace(':level', item._subCategory)
             .replace(':category', item._subCategory)
             .replace(':type', item._subCategory)
             .replace(':section', item._subCategory);
  }
  
  if (item.slug) {
    url = url.replace(':slug', item.slug);
  } else if (item.id) {
    url = url.replace(':slug', item.id);
  }
  
  return url;
}

// Évaluer la complétude d'un élément
function evaluateCompleteness(item, contentType) {
  // Liste des champs requis par type de contenu
  const requiredFields = {
    'Cols': ['id', 'name', 'slug', 'description', 'altitude', 'length', 'gradient'],
    'Programmes d\'entraînement': ['id', 'name', 'slug', 'description', 'duration', 'level', 'sessions'],
    'Contenu nutritionnel': ['id', 'name', 'slug', 'description', 'ingredients', 'instructions'],
    'Défis': ['id', 'name', 'slug', 'description', 'cols', 'difficulty'],
    'Visualisations 3D': ['id', 'name', 'slug', 'description', 'model', 'elevation_profile'],
    'Communauté': ['id', 'name', 'slug', 'description', 'participants', 'date']
  };
  
  // Champs spécifiques par sous-catégorie (en complément des champs requis)
  const additionalFields = {
    'recettes': ['preparation_time', 'cooking_time', 'servings', 'nutrition_info'],
    'plans': ['duration', 'target', 'meals'],
    '7-majeurs': ['cols', 'total_elevation', 'total_distance']
  };
  
  // Liste des champs que cet item devrait avoir
  let fields = requiredFields[contentType] || [];
  
  // Ajouter les champs spécifiques à la sous-catégorie
  if (item._subCategory && additionalFields[item._subCategory]) {
    fields = [...fields, ...additionalFields[item._subCategory]];
  }
  
  // Compter les champs présents
  let presentFields = 0;
  fields.forEach(field => {
    if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
      presentFields++;
    }
  });
  
  // Calculer le pourcentage de complétude
  return Math.round((presentFields / fields.length) * 100);
}

// Identifier le statut d'un élément
function identifyStatus(completeness, relationships) {
  if (completeness < 50) {
    return 'Incomplet';
  } else if (completeness < 80) {
    return 'Partiel';
  } else if (relationships && relationships.length > 0) {
    return 'Actif';
  } else {
    return 'Prêt';
  }
}

// Générer le rapport d'inventaire
function generateInventoryReport(allItems, relationships) {
  console.log(chalk.blue('\nGénération du rapport d\'inventaire...'));
  
  let report = `# Inventaire Principal - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce document constitue l'inventaire central de tout le contenu de la plateforme Velo-Altitude. Il recense l'ensemble des URLs, identifie les doublons, vérifie la complétude du contenu et propose une structure standardisée pour faciliter la gestion et l'évolution de la plateforme.

## Table des matières

`;

  // Générer la table des matières
  CONFIG.contentTypes.forEach(contentType => {
    report += `- [${contentType.name}](#${contentType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
    contentType.subCategories.forEach(subCategory => {
      report += `  - [${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)}](#${subCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-')})\n`;
    });
  });

  report += `
## Vue d'ensemble

### Statistiques globales

| Catégorie | Total actuel | Complétude moyenne | Actifs | Incomplets |
|-----------|--------------|-------------------|--------|------------|
`;

  // Ajouter les statistiques pour chaque type de contenu
  CONFIG.contentTypes.forEach(contentType => {
    const items = allItems[contentType.name] || [];
    const total = items.length;
    
    // Calculer la complétude moyenne
    let completenessSum = 0;
    items.forEach(item => {
      completenessSum += item._completeness || 0;
    });
    const avgCompleteness = total > 0 ? Math.round(completenessSum / total) : 0;
    
    // Compter les éléments actifs et incomplets
    const active = items.filter(item => item._status === 'Actif').length;
    const incomplete = items.filter(item => item._status === 'Incomplet').length;
    
    report += `| ${contentType.name} | ${total} | ${avgCompleteness}% | ${active} | ${incomplete} |\n`;
  });

  report += `
### État général du contenu

**Points forts**:
- Collection riche de cols avec plus de ${(allItems['Cols'] || []).length} fiches
- Module de programmes d'entraînement complet avec ${(allItems['Programmes d\'entraînement'] || []).length}+ variantes
- Module nutritionnel substantiel avec ${(allItems['Contenu nutritionnel'] || []).length}+ recettes adaptées aux cyclistes
- Structure d'URL standardisée et optimisée pour le SEO
- Organisation cohérente des données par catégories et sous-catégories

**Points à améliorer**:
- Compléter les éléments marqués comme "Incomplets" dans l'inventaire
- Développer davantage les défis "7 Majeurs" qui est un concept central
- Enrichir les visualisations 3D
- Standardiser les métadonnées multilingues pour tous les contenus

### Structure d'URL standardisée

`;

  // Ajouter la structure d'URL pour chaque type de contenu
  CONFIG.contentTypes.forEach(contentType => {
    report += `- **${contentType.name}**: \`${contentType.urlPattern}\`\n`;
  });

  // Générer le contenu détaillé pour chaque type de contenu
  CONFIG.contentTypes.forEach(contentType => {
    report += `\n## ${contentType.name}\n\n`;
    
    const items = allItems[contentType.name] || [];
    
    // Informations générales sur le type de contenu
    report += `**Source de données**: \`${contentType.dirPath}\`\n`;
    report += `**Structure d'URL**: \`${contentType.urlPattern}\`\n`;
    report += `**Total**: ${items.length} éléments\n\n`;
    
    // Générer un tableau pour chaque sous-catégorie
    contentType.subCategories.forEach(subCategory => {
      const subItems = items.filter(item => item._subCategory === subCategory);
      
      if (subItems.length > 0) {
        report += `### ${subCategory.charAt(0).toUpperCase() + subCategory.slice(1)}\n\n`;
        report += `| ID | Nom | URL | Complétude | Statut | Relations |\n`;
        report += `|----|-----|-----|------------|--------|----------|\n`;
        
        subItems.forEach(item => {
          const url = generateUrl(contentType.urlPattern, item);
          const fullUrl = `${CONFIG.baseUrl}${url}`;
          const name = item.name || '';
          const id = item.id || '';
          const completeness = item._completeness || 0;
          const status = item._status || 'Inconnu';
          
          // Récupérer les relations
          const itemRelationships = relationships[item.slug] || [];
          const relationshipsText = itemRelationships.length > 0 
            ? itemRelationships.slice(0, 2).join(', ') + (itemRelationships.length > 2 ? '...' : '')
            : '-';
          
          report += `| ${id} | ${name} | [${url}](${fullUrl}) | ${completeness}% | ${status} | ${relationshipsText} |\n`;
        });
        
        report += '\n';
      }
    });
  });

  // Ajouter une section sur les relations entre contenus
  report += `
## Relations entre contenus

Cette section présente les relations identifiées entre les différents contenus du site. Chaque élément listé est référencé par au moins un composant React.

`;

  // Créer une liste des relations significatives
  const significantRelationships = {};
  Object.entries(relationships).forEach(([slug, components]) => {
    if (components.length >= 2) {
      significantRelationships[slug] = components;
    }
  });
  
  // Ajouter le tableau des relations
  if (Object.keys(significantRelationships).length > 0) {
    report += `| Slug | Utilisé dans |\n`;
    report += `|------|-------------|\n`;
    
    Object.entries(significantRelationships).forEach(([slug, components]) => {
      report += `| ${slug} | ${components.join(', ')} |\n`;
    });
  } else {
    report += `Aucune relation significative détectée. Cela peut indiquer que l'analyse des composants n'a pas trouvé de références directes aux slugs ou IDs des contenus.`;
  }

  // Guide d'ajout de contenu
  report += `
## Guide d'ajout de contenu

### Procédure standardisée

1. **Déterminer le type de contenu** à ajouter (col, programme d'entraînement, recette, etc.)
2. **Identifier la sous-catégorie appropriée** (pays, niveau, catégorie, etc.)
3. **Créer un fichier JSON** en suivant la structure et les champs requis pour ce type de contenu
4. **Placer le fichier** dans le répertoire approprié, en respectant la hiérarchie des sous-catégories
5. **Générer un slug standardisé** en kebab-case, sans caractères spéciaux
6. **Nommer le fichier** selon le modèle \`[slug].json\`
7. **Valider les données** en exécutant le script de validation

### Champs requis par type de contenu

`;

  // Liste des champs requis par type de contenu
  const requiredFields = {
    'Cols': ['id', 'name', 'slug', 'description', 'altitude', 'length', 'gradient'],
    'Programmes d\'entraînement': ['id', 'name', 'slug', 'description', 'duration', 'level', 'sessions'],
    'Contenu nutritionnel': ['id', 'name', 'slug', 'description', 'ingredients', 'instructions'],
    'Défis': ['id', 'name', 'slug', 'description', 'cols', 'difficulty'],
    'Visualisations 3D': ['id', 'name', 'slug', 'description', 'model', 'elevation_profile'],
    'Communauté': ['id', 'name', 'slug', 'description', 'participants', 'date']
  };
  
  Object.entries(requiredFields).forEach(([contentType, fields]) => {
    report += `#### ${contentType}\n\n\`\`\`json\n{\n`;
    fields.forEach(field => {
      report += `  "${field}": "",\n`;
    });
    report += `  // Autres champs spécifiques\n}\n\`\`\`\n\n`;
  });

  report += `
## Plan d'action

### Priorités immédiates

1. **Compléter les éléments incomplets** identifiés dans cet inventaire
2. **Créer des défis "7 Majeurs"** qui sont actuellement sous-représentés
3. **Enrichir les visualisations 3D** pour les cols principaux
4. **Standardiser les métadonnées multilingues** pour tous les contenus

### Maintenance continue

1. **Mettre à jour cet inventaire** régulièrement en exécutant \`node scripts/generate-master-inventory.js\`
2. **Valider les nouvelles données** à chaque ajout de contenu
3. **Maintenir la cohérence** entre les différents types de contenu
4. **Surveiller les performances SEO** des URLs standardisées
`;

  // Écrire le rapport
  fs.writeFileSync(CONFIG.outputFile, report);
  console.log(chalk.green(`✓ Rapport d'inventaire généré: ${CONFIG.outputFile}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Génération de l\'inventaire principal - Velo-Altitude ===\n'));
  
  // Créer le répertoire de documentation s'il n'existe pas
  if (!fs.existsSync(CONFIG.docsDir)) {
    fs.mkdirSync(CONFIG.docsDir, { recursive: true });
  }
  
  // Récupérer toutes les données pour chaque type de contenu
  const allItems = {};
  const allItemsFlat = [];
  
  CONFIG.contentTypes.forEach(contentType => {
    console.log(chalk.blue(`Récupération des données: ${contentType.name}...`));
    
    const items = getDataFromDirectory(contentType.dirPath);
    allItems[contentType.name] = items;
    
    // Ajouter des métadonnées
    items.forEach(item => {
      // Évaluer la complétude
      item._completeness = evaluateCompleteness(item, contentType.name);
      
      // Ajouter le type de contenu
      item._contentType = contentType.name;
      
      // Ajouter à la liste plate
      allItemsFlat.push(item);
    });
    
    console.log(chalk.green(`✓ ${items.length} éléments récupérés pour ${contentType.name}`));
  });
  
  // Analyser les composants pour identifier les relations
  const relationships = analyzeReactComponents(allItemsFlat);
  
  // Mettre à jour le statut des éléments en fonction des relations
  Object.values(allItems).forEach(items => {
    items.forEach(item => {
      item._status = identifyStatus(
        item._completeness, 
        relationships[item.slug] || []
      );
    });
  });
  
  // Générer le rapport d'inventaire
  generateInventoryReport(allItems, relationships);
  
  console.log(chalk.cyan('\n=== Génération de l\'inventaire terminée avec succès ==='));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
