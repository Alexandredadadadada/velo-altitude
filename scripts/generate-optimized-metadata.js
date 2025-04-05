/**
 * Optimisation des métadonnées pour Velo-Altitude
 * 
 * Ce script génère des métadonnées optimisées SEO pour chaque page :
 * - Crée des templates de balises title, description et Open Graph
 * - Implémente des données structurées Schema.org
 * - Assure la cohérence des métadonnées sur tout le site
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const CONFIG = {
  rootDir: path.resolve(__dirname, '..'),
  srcDir: path.resolve(__dirname, '../src'),
  templatesDir: path.resolve(__dirname, '../src/templates'),
  docsDir: path.resolve(__dirname, '../docs'),
  outputMetadataDoc: path.resolve(__dirname, '../docs/METADATA_GUIDE.md'),
  contentTypes: [
    {
      name: 'Cols',
      pattern: '/cols/:country/:slug',
      titleTemplate: '{nom} ({altitude}m) - Guide complet du col | Velo-Altitude',
      descriptionTemplate: 'Découvrez le {nom} ({altitude}m), un col {difficulte} situé en {pays}. Profil, histoire, conseils et itinéraires pour cyclistes de tous niveaux.',
      schemaType: 'Place',
      keywords: ['col', 'cyclisme', 'montagne', 'ascension', 'vélo', 'dénivelé'],
      schemaProperties: [
        'name', 'description', 'altitude', 'location', 'images', 'difficulty'
      ]
    },
    {
      name: 'Programmes d\'entraînement',
      pattern: '/entrainement/:level/:slug',
      titleTemplate: 'Programme {nom} - Plan d\'entraînement {niveau} | Velo-Altitude',
      descriptionTemplate: 'Programme d\'entraînement {nom} pour cyclistes de niveau {niveau}. {duree} semaines pour améliorer votre performance en montagne.',
      schemaType: 'Course',
      keywords: ['entraînement', 'programme', 'cyclisme', 'performance', 'col', 'préparation'],
      schemaProperties: [
        'name', 'description', 'provider', 'timeRequired', 'educationalLevel', 'hasCourseInstance'
      ]
    },
    {
      name: 'Recettes',
      pattern: '/nutrition/:category/:slug',
      titleTemplate: '{nom} - Recette nutritionnelle pour cyclistes | Velo-Altitude',
      descriptionTemplate: '{nom}: recette {categorie} pour cyclistes, idéale {moment}. {calories} calories, préparation en {temps_prep} minutes.',
      schemaType: 'Recipe',
      keywords: ['nutrition', 'recette', 'cyclisme', 'alimentation', 'énergie', 'récupération'],
      schemaProperties: [
        'name', 'description', 'recipeIngredient', 'recipeInstructions', 'nutrition', 'prepTime'
      ]
    },
    {
      name: 'Défis',
      pattern: '/defis/:type/:slug',
      titleTemplate: 'Défi {nom} - Challenge cycliste {type} | Velo-Altitude',
      descriptionTemplate: 'Relevez le défi {nom} : {distance}km et {denivele}m de dénivelé cumulé à travers {nombre_cols} cols majeurs. Un challenge {type} inoubliable.',
      schemaType: 'SportsEvent',
      keywords: ['défi', 'challenge', 'cyclisme', 'cols', '7 majeurs', 'performance'],
      schemaProperties: [
        'name', 'description', 'location', 'totalDistance', 'elevation', 'difficulty'
      ]
    },
    {
      name: 'Visualisations 3D',
      pattern: '/visualisation-3d/:country/:slug',
      titleTemplate: 'Visualisation 3D du {nom} - Explorer en immersif | Velo-Altitude',
      descriptionTemplate: 'Explorez le {nom} en 3D ! Visualisation interactive du profil, points clés et panoramas de ce col mythique de {pays}.',
      schemaType: 'MediaObject',
      keywords: ['3D', 'visualisation', 'col', 'profil', 'interactif', 'immersif'],
      schemaProperties: [
        'name', 'description', 'contentUrl', 'encoding', 'height', 'width'
      ]
    }
  ]
};

// Créer les répertoires nécessaires
function createDirectories() {
  if (!fs.existsSync(CONFIG.templatesDir)) {
    fs.mkdirSync(CONFIG.templatesDir, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de templates créé: ${CONFIG.templatesDir}`));
  }
  
  if (!fs.existsSync(CONFIG.docsDir)) {
    fs.mkdirSync(CONFIG.docsDir, { recursive: true });
    console.log(chalk.green(`✓ Répertoire de documentation créé: ${CONFIG.docsDir}`));
  }
}

// Générer les templates de métadonnées
function generateMetadataTemplates() {
  console.log(chalk.blue('\nGénération des templates de métadonnées...'));
  
  CONFIG.contentTypes.forEach(contentType => {
    const templateName = contentType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const templatePath = path.join(CONFIG.templatesDir, `metadata-${templateName}.js`);
    
    // Création du template de métadonnées
    const templateContent = `/**
 * Template de métadonnées pour ${contentType.name}
 * Pattern d'URL: ${contentType.pattern}
 */

import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * Composant de métadonnées pour les pages de ${contentType.name}
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.data - Les données du contenu
 * @param {string} props.url - L'URL complète de la page
 */
const ${templateName.charAt(0).toUpperCase() + templateName.slice(1)}Metadata = ({ data, url }) => {
  // Valeurs par défaut
  const defaultTitle = "Velo-Altitude | La référence du cyclisme en montagne";
  const defaultDescription = "Velo-Altitude, le plus grand dashboard vélo d'Europe : cols, programmes d'entraînement, nutrition, défis et communauté cycliste.";
  
  // Génération du titre
  const title = data ? \`${contentType.titleTemplate}\`
    .replace('{nom}', data.name || '')
    .replace('{altitude}', data.altitude || '')
    .replace('{niveau}', data.level || '')
    .replace('{duree}', data.duration || '')
    .replace('{categorie}', data.category || '')
    .replace('{moment}', data.timing || 'pour cyclistes')
    .replace('{calories}', data.nutrition?.calories || '')
    .replace('{temps_prep}', data.prepTime || '')
    .replace('{type}', data.type || '')
    .replace('{distance}', data.distance || '')
    .replace('{denivele}', data.elevation || '')
    .replace('{nombre_cols}', (data.cols || []).length || '')
    .replace('{pays}', data.country || '')
    .replace('{difficulte}', data.difficulty || '')
    : defaultTitle;
  
  // Génération de la description
  const description = data ? \`${contentType.descriptionTemplate}\`
    .replace('{nom}', data.name || '')
    .replace('{altitude}', data.altitude || '')
    .replace('{niveau}', data.level || '')
    .replace('{duree}', data.duration || '')
    .replace('{categorie}', data.category || '')
    .replace('{moment}', data.timing || 'pour cyclistes')
    .replace('{calories}', data.nutrition?.calories || '')
    .replace('{temps_prep}', data.prepTime || '')
    .replace('{type}', data.type || '')
    .replace('{distance}', data.distance || '')
    .replace('{denivele}', data.elevation || '')
    .replace('{nombre_cols}', (data.cols || []).length || '')
    .replace('{pays}', data.country || '')
    .replace('{difficulte}', data.difficulty || '')
    : defaultDescription;
  
  // Génération des mots-clés
  const baseKeywords = ${JSON.stringify(contentType.keywords)};
  const dynamicKeywords = data ? [
    data.name,
    data.country,
    ...(data.tags || [])
  ].filter(Boolean) : [];
  
  const allKeywords = [...baseKeywords, ...dynamicKeywords].join(', ');
  
  // Génération des données structurées Schema.org
  const generateSchemaOrgData = () => {
    if (!data) return null;
    
    const schemaData = {
      '@context': 'https://schema.org',
      '@type': '${contentType.schemaType}',
      '@id': url,
      'url': url,
      'name': data.name || '',
      'description': data.description || '',
    };
    
    // Ajouter des propriétés spécifiques selon le type de contenu
    ${generateSchemaPropertiesCode(contentType)}
    
    return JSON.stringify(schemaData);
  };
  
  const schemaOrgData = generateSchemaOrgData();
  
  // Images Open Graph
  const ogImage = data && data.images && data.images.length > 0
    ? data.images[0]
    : '/images/default-${templateName}-og.jpg';
  
  return (
    <Helmet>
      {/* Balises meta de base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      
      {/* Balises meta Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="${contentType.name === 'Recettes' ? 'article' : 'website'}" />
      <meta property="og:site_name" content="Velo-Altitude" />
      
      {/* Balises meta Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Balises meta canoniques */}
      <link rel="canonical" href={url} />
      
      {/* Données structurées Schema.org */}
      {schemaOrgData && (
        <script type="application/ld+json">
          {schemaOrgData}
        </script>
      )}
    </Helmet>
  );
};

export default ${templateName.charAt(0).toUpperCase() + templateName.slice(1)}Metadata;
`;
    
    fs.writeFileSync(templatePath, templateContent);
    console.log(chalk.green(`✓ Template de métadonnées généré: ${templatePath}`));
  });
}

// Fonction pour générer le code des propriétés Schema.org
function generateSchemaPropertiesCode(contentType) {
  let code = '';
  
  switch (contentType.name) {
    case 'Cols':
      code = `
    // Propriétés spécifiques pour les cols
    if (data.altitude) {
      schemaData.elevation = {
        '@type': 'QuantitativeValue',
        'value': data.altitude,
        'unitCode': 'MTR'
      };
    }
      
    if (data.country) {
      schemaData.address = {
        '@type': 'PostalAddress',
        'addressCountry': data.country
      };
    }
      
    if (data.coordinates) {
      schemaData.geo = {
        '@type': 'GeoCoordinates',
        'latitude': data.coordinates.lat,
        'longitude': data.coordinates.lng
      };
    }
      
    if (data.images && data.images.length > 0) {
      schemaData.image = data.images.map(img => ({
        '@type': 'ImageObject',
        'url': img
      }));
    }`;
      break;
      
    case 'Programmes d\'entraînement':
      code = `
    // Propriétés spécifiques pour les programmes d'entraînement
    schemaData.provider = {
      '@type': 'Organization',
      'name': 'Velo-Altitude',
      'url': 'https://velo-altitude.com'
    };
      
    if (data.duration) {
      schemaData.timeRequired = \`P\${data.duration}W\`; // Format ISO 8601 pour les durées
    }
      
    if (data.level) {
      schemaData.educationalLevel = data.level;
    }
      
    if (data.sessions && data.sessions.length > 0) {
      schemaData.hasCourseInstance = data.sessions.map((session, index) => ({
        '@type': 'CourseInstance',
        'name': session.title,
        'description': session.description,
        'courseWorkload': \`PT\${session.duration}M\` // Format ISO 8601 pour les durées
      }));
    }`;
      break;
      
    case 'Recettes':
      code = `
    // Propriétés spécifiques pour les recettes
    if (data.ingredients && data.ingredients.length > 0) {
      schemaData.recipeIngredient = data.ingredients;
    }
      
    if (data.instructions && data.instructions.length > 0) {
      schemaData.recipeInstructions = data.instructions.map(step => ({
        '@type': 'HowToStep',
        'text': step
      }));
    }
      
    if (data.prepTime) {
      schemaData.prepTime = \`PT\${data.prepTime}M\`; // Format ISO 8601 pour les durées
    }
      
    if (data.cookTime) {
      schemaData.cookTime = \`PT\${data.cookTime}M\`;
    }
      
    if (data.nutrition) {
      schemaData.nutrition = {
        '@type': 'NutritionInformation',
        'calories': \`\${data.nutrition.calories} calories\`,
        'proteinContent': \`\${data.nutrition.protein}g\`,
        'carbohydrateContent': \`\${data.nutrition.carbs}g\`,
        'fatContent': \`\${data.nutrition.fat}g\`
      };
    }`;
      break;
      
    case 'Défis':
      code = `
    // Propriétés spécifiques pour les défis
    schemaData['@type'] = 'SportsEvent';
    
    if (data.type) {
      schemaData.eventStatus = 'EventScheduled';
    }
      
    if (data.distance) {
      schemaData.totalDistance = {
        '@type': 'QuantitativeValue',
        'value': data.distance,
        'unitCode': 'KMT'
      };
    }
      
    if (data.elevation) {
      schemaData.additionalProperty = {
        '@type': 'PropertyValue',
        'name': 'Dénivelé',
        'value': data.elevation,
        'unitCode': 'MTR'
      };
    }
      
    if (data.cols && data.cols.length > 0) {
      schemaData.location = data.cols.map(col => ({
        '@type': 'Place',
        'name': col.name,
        'address': {
          '@type': 'PostalAddress',
          'addressCountry': col.country
        }
      }));
    }`;
      break;
      
    case 'Visualisations 3D':
      code = `
    // Propriétés spécifiques pour les visualisations 3D
    schemaData['@type'] = 'MediaObject';
    
    if (data.model) {
      schemaData.contentUrl = data.model;
    }
      
    schemaData.encodingFormat = 'text/html';
    
    if (data.dimensions) {
      schemaData.height = data.dimensions.height;
      schemaData.width = data.dimensions.width;
    }
      
    schemaData.author = {
      '@type': 'Organization',
      'name': 'Velo-Altitude',
      'url': 'https://velo-altitude.com'
    };`;
      break;
      
    default:
      code = '// Pas de propriétés spécifiques pour ce type de contenu';
  }
  
  return code;
}

// Générer un composant de métadonnées principal
function generateMainMetadataComponent() {
  console.log(chalk.blue('\nGénération du composant de métadonnées principal...'));
  
  const mainComponentPath = path.join(CONFIG.templatesDir, 'MetadataManager.js');
  
  // Imports dynamiques pour tous les templates
  const importStatements = CONFIG.contentTypes.map(contentType => {
    const templateName = contentType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const componentName = `${templateName.charAt(0).toUpperCase() + templateName.slice(1)}Metadata`;
    return `import ${componentName} from './metadata-${templateName}';`;
  }).join('\n');
  
  // Switch case pour sélectionner le bon template selon le chemin
  const switchCases = CONFIG.contentTypes.map(contentType => {
    const templateName = contentType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const componentName = `${templateName.charAt(0).toUpperCase() + templateName.slice(1)}Metadata`;
    
    // Convertir le pattern d'URL en regex pour le matching
    const patternRegex = contentType.pattern
      .replace(/:[a-zA-Z]+/g, '[^/]+')
      .replace(/\//g, '\\/');
    
    return `    // Pour les pages de ${contentType.name}
    if (pathname.match(/^${patternRegex}$/)) {
      return <${componentName} data={data} url={url} />;
    }`;
  }).join('\n\n');
  
  const componentContent = `/**
 * Gestionnaire central de métadonnées pour Velo-Altitude
 * Sélectionne et applique automatiquement le template approprié selon l'URL
 */

import React from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';

// Import des templates de métadonnées
${importStatements}

/**
 * Composant principal de gestion des métadonnées
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.data - Les données du contenu actuel
 */
const MetadataManager = ({ data }) => {
  const location = useLocation();
  const { pathname } = location;
  
  // Construire l'URL complète
  const url = \`https://velo-altitude.com\${pathname}\`;
  
  // Valeurs par défaut pour les pages génériques
  const defaultTitle = "Velo-Altitude | La référence du cyclisme en montagne";
  const defaultDescription = "Velo-Altitude, le plus grand dashboard vélo d'Europe : cols, programmes d'entraînement, nutrition, défis et communauté cycliste.";
  
  // Sélectionner le template approprié selon le chemin de l'URL
${switchCases}
  
  // Template par défaut pour les autres pages
  return (
    <Helmet>
      <title>{data?.title || defaultTitle}</title>
      <meta name="description" content={data?.description || defaultDescription} />
      <meta name="keywords" content="cyclisme, cols, vélo, montagne, entraînement, nutrition" />
      
      <meta property="og:title" content={data?.title || defaultTitle} />
      <meta property="og:description" content={data?.description || defaultDescription} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content="/images/default-og.jpg" />
      <meta property="og:type" content="website" />
      
      <link rel="canonical" href={url} />
    </Helmet>
  );
};

export default MetadataManager;
`;
  
  fs.writeFileSync(mainComponentPath, componentContent);
  console.log(chalk.green(`✓ Composant principal de métadonnées généré: ${mainComponentPath}`));
}

// Générer un guide d'utilisation des métadonnées
function generateMetadataGuide() {
  console.log(chalk.blue('\nGénération du guide des métadonnées...'));
  
  let guide = `# Guide des Métadonnées SEO - Velo-Altitude

*Généré le ${new Date().toISOString().split('T')[0]}*

Ce document détaille le système de métadonnées optimisées pour le référencement (SEO) mis en place pour Velo-Altitude, couvrant les balises titres, descriptions, Open Graph, Twitter Cards et données structurées Schema.org.

## Structure générale

Le système de métadonnées utilise une approche modulaire basée sur des templates spécifiques à chaque type de contenu, coordonnés par un gestionnaire central. Cette architecture permet d'assurer la cohérence tout en personnalisant les métadonnées de manière précise.

## Templates de métadonnées

Chaque type de contenu dispose d'un template dédié qui génère des balises optimisées en fonction des données spécifiques :

`;
  
  // Ajouter les détails pour chaque template
  CONFIG.contentTypes.forEach(contentType => {
    const templateName = contentType.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    guide += `### ${contentType.name}
**Fichier**: \`src/templates/metadata-${templateName}.js\`
**Pattern d'URL**: \`${contentType.pattern}\`

#### Format du titre
\`\`\`
${contentType.titleTemplate}
\`\`\`

#### Format de la description
\`\`\`
${contentType.descriptionTemplate}
\`\`\`

#### Mots-clés de base
${contentType.keywords.map(kw => `- ${kw}`).join('\n')}

#### Données structurées Schema.org
- Type: \`${contentType.schemaType}\`
- Propriétés principales: ${contentType.schemaProperties.join(', ')}

#### Exemple
Pour une page ${contentType.name.toLowerCase()} avec les données suivantes :
\`\`\`json
{
  "name": "Exemple",
  "description": "Description d'exemple",
  // Autres propriétés pertinentes
}
\`\`\`

Le système générera un ensemble complet de balises incluant:
- Titre optimisé selon le template
- Description basée sur les données du contenu
- Mots-clés combinant les termes génériques et spécifiques
- Balises Open Graph pour le partage social
- Balises Twitter Card
- Données structurées Schema.org pour les rich snippets

`;
  });
  
  guide += `
## Implémentation dans l'application

### Composant principal
Le composant \`MetadataManager\` (\`src/templates/MetadataManager.js\`) gère la sélection et l'application automatique du template approprié selon l'URL actuelle. Pour l'utiliser :

\`\`\`jsx
// Dans le composant de mise en page principal (Layout.js)
import MetadataManager from './templates/MetadataManager';

const Layout = ({ children, pageData }) => {
  return (
    <>
      <MetadataManager data={pageData} />
      {/* Reste du composant */}
    </>
  );
};
\`\`\`

### Intégration avec les pages dynamiques
Pour les pages qui chargent des données dynamiquement:

\`\`\`jsx
// Exemple pour une page de détail de col
const ColDetail = () => {
  const { slug } = useParams();
  const [colData, setColData] = useState(null);
  
  useEffect(() => {
    // Charger les données du col...
  }, [slug]);
  
  return (
    <Layout pageData={colData}>
      {/* Contenu de la page */}
    </Layout>
  );
};
\`\`\`

## Recommandations SEO générales

1. **Titres**: Limiter à 60-70 caractères pour éviter la troncature dans les SERP
2. **Descriptions**: 150-160 caractères maximum, incluant un appel à l'action
3. **Images OG**: Dimensions recommandées de 1200x630px pour un affichage optimal
4. **Mots-clés**: Intégrer naturellement dans le contenu, ne pas suroptimiser
5. **Canoniques**: Toujours inclure pour éviter les problèmes de contenu dupliqué
6. **Mobile**: Tester l'affichage des métadonnées sur les appareils mobiles

## Validation des métadonnées

Pour valider les métadonnées générées, utilisez ces outils:

- [Rich Results Test](https://search.google.com/test/rich-results) - Pour les données structurées
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) - Pour les tags Open Graph
- [Twitter Card Validator](https://cards-dev.twitter.com/validator) - Pour les Twitter Cards
- [Meta Tags](https://metatags.io/) - Pour une prévisualisation générale

## Maintenance et évolution

- **Actualisation**: Révisez régulièrement les templates pour refléter les meilleures pratiques SEO
- **Expansion**: Ajoutez de nouveaux templates pour les types de contenu additionnels
- **Tests**: Effectuez des tests A/B sur différentes formulations de titres et descriptions
- **Analyse**: Surveillez les performances dans Search Console pour ajuster si nécessaire
`;
  
  fs.writeFileSync(CONFIG.outputMetadataDoc, guide);
  console.log(chalk.green(`✓ Guide des métadonnées généré: ${CONFIG.outputMetadataDoc}`));
}

// Fonction principale
async function main() {
  console.log(chalk.cyan('=== Optimisation des métadonnées SEO - Velo-Altitude ===\n'));
  
  // Créer les répertoires nécessaires
  createDirectories();
  
  // Générer les templates de métadonnées
  generateMetadataTemplates();
  
  // Générer le composant principal
  generateMainMetadataComponent();
  
  // Générer le guide des métadonnées
  generateMetadataGuide();
  
  // Exemple d'intégration dans App.js
  const appJsPath = path.join(CONFIG.srcDir, 'App.js');
  if (fs.existsSync(appJsPath)) {
    try {
      console.log(chalk.blue('\nMise à jour de App.js pour intégrer le gestionnaire de métadonnées...'));
      
      let appContent = fs.readFileSync(appJsPath, 'utf8');
      
      // Vérifier si l'import de MetadataManager existe déjà
      if (!appContent.includes('import MetadataManager')) {
        // Ajouter l'import
        appContent = appContent.replace(
          /import React[^;]*;/,
          `import React from 'react';\nimport MetadataManager from './templates/MetadataManager';`
        );
        
        // Ajouter le composant dans le rendu
        appContent = appContent.replace(
          /<BrowserRouter[^>]*>/,
          `<BrowserRouter>\n      <MetadataManager data={{}} />`
        );
        
        fs.writeFileSync(appJsPath, appContent);
        console.log(chalk.green(`✓ App.js mis à jour avec l'intégration du gestionnaire de métadonnées`));
      } else {
        console.log(chalk.yellow(`! App.js contient déjà une référence à MetadataManager, aucune modification effectuée`));
      }
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la mise à jour de App.js: ${error.message}`));
    }
  }
  
  console.log(chalk.cyan('\n=== Optimisation des métadonnées terminée avec succès ==='));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
});
