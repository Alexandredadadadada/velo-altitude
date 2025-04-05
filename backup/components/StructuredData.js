/**
 * StructuredData.js
 * 
 * Composant React pour injecter des données structurées (Schema.org) dans les pages
 * Ce composant utilise le générateur de schémas pour créer et insérer
 * des balises JSON-LD optimisées pour le SEO.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import * as schemaGenerator from '../../utils/schemaGenerator';

/**
 * Composant StructuredData pour injecter des données structurées dans une page
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.type - Type de schéma à générer
 * @param {Object} props.data - Données pour générer le schéma
 * @param {string} props.url - URL complète de la page
 * @param {boolean} props.includeOrganization - Inclure le schéma de l'organisation (par défaut: true)
 * @param {boolean} props.includeWebPage - Inclure le schéma de page web (par défaut: true)
 * @param {Object} props.webPageData - Données pour le schéma de page web (si includeWebPage=true)
 */
const StructuredData = ({
  type,
  data,
  url,
  includeOrganization = true,
  includeWebPage = true,
  webPageData = {}
}) => {
  // Génère le schéma principal en fonction du type
  const generateMainSchema = () => {
    switch (type) {
      case 'col':
        return schemaGenerator.generateColSchema(data, url);
      case 'training':
        return schemaGenerator.generateTrainingProgramSchema(data, url);
      case 'recipe':
        return schemaGenerator.generateRecipeSchema(data, url);
      case 'seven-majors':
        return schemaGenerator.generateSevenMajorsSchema(data, url);
      case 'event':
        return schemaGenerator.generateEventSchema(data, url);
      case 'article':
        return schemaGenerator.generateArticleSchema(data, url);
      case 'faq':
        return schemaGenerator.generateFAQSchema(data, url);
      case 'sitemap':
        return schemaGenerator.generateSiteMapSchema(data, url);
      case 'profile':
        return schemaGenerator.generateProfileSchema(data, url);
      default:
        return null;
    }
  };

  // Génère les schémas additionnels
  const generateAdditionalSchemas = () => {
    const schemas = [];
    
    // Ajoute le schéma de l'organisation si demandé
    if (includeOrganization) {
      schemas.push(schemaGenerator.generateOrganizationSchema());
    }
    
    // Ajoute le schéma de page web si demandé
    if (includeWebPage) {
      schemas.push(schemaGenerator.generateWebPageSchema({
        url,
        title: webPageData.title,
        description: webPageData.description,
        type: webPageData.type || 'WebPage',
        language: webPageData.language || 'fr',
        datePublished: webPageData.datePublished || new Date().toISOString(),
        dateModified: webPageData.dateModified
      }));
    }
    
    return schemas;
  };

  // Combine tous les schémas
  const mainSchema = generateMainSchema();
  const additionalSchemas = generateAdditionalSchemas();
  const combinedSchemas = schemaGenerator.combineSchemas(mainSchema, ...additionalSchemas);
  
  // Convertit les schémas en JSON
  const jsonLdString = JSON.stringify(combinedSchemas);

  return (
    <Helmet>
      <script type="application/ld+json">{jsonLdString}</script>
    </Helmet>
  );
};

StructuredData.propTypes = {
  type: PropTypes.oneOf([
    'col',
    'training',
    'recipe',
    'seven-majors',
    'event',
    'article',
    'faq',
    'sitemap',
    'profile'
  ]).isRequired,
  data: PropTypes.object.isRequired,
  url: PropTypes.string.isRequired,
  includeOrganization: PropTypes.bool,
  includeWebPage: PropTypes.bool,
  webPageData: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    type: PropTypes.string,
    language: PropTypes.string,
    datePublished: PropTypes.string,
    dateModified: PropTypes.string
  })
};

export default StructuredData;
