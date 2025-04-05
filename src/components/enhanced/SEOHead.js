import React from 'react';
import { Helmet } from 'react-helmet';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { generateMetaTags, generateAlternateLanguageTags } from '../../utils/seoMetadata';

/**
 * SEOHead - Composant réutilisable pour gérer les métadonnées SEO
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.title - Le titre de la page
 * @param {string} props.description - La description de la page
 * @param {string} props.canonicalUrl - L'URL canonique de la page
 * @param {string} props.ogImage - L'image Open Graph pour les partages sociaux
 * @param {Array} props.keywords - Les mots-clés pour la balise meta keywords
 * @param {Object} props.schema - Les données structurées Schema.org (JSON-LD)
 * @param {Object} props.hreflangLinks - Les liens hreflang pour l'internationalisation
 * @param {string} props.ogType - Le type Open Graph (default: website)
 * @param {Object} props.metadata - Objet de métadonnées complet (remplace les propriétés individuelles)
 */
const SEOHead = ({ 
  title, 
  description, 
  canonicalUrl, 
  ogImage, 
  keywords, 
  schema, 
  hreflangLinks,
  ogType = 'website',
  metadata = null
}) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'fr';
  
  // Si un objet metadata complet est fourni, l'utiliser en priorité
  const metaTitle = metadata ? metadata.title : title;
  const metaDescription = metadata ? metadata.description : description;
  const metaCanonicalUrl = metadata && metadata.canonical ? metadata.canonical : canonicalUrl;
  const metaOgImage = metadata ? metadata.ogImage : ogImage;
  const metaKeywords = metadata ? metadata.keywords : (keywords ? keywords.join(', ') : '');
  const metaOgType = metadata && metadata.ogType ? metadata.ogType : ogType;
  const metaAlternateLanguages = metadata && metadata.alternateLanguages ? metadata.alternateLanguages : null;
  
  // Génération des balises hreflang
  const generateHreflangTags = () => {
    if (metaAlternateLanguages) {
      return generateAlternateLanguageTags(metaAlternateLanguages);
    } else if (hreflangLinks) {
      return Object.entries(hreflangLinks).map(([lang, url]) => (
        <link key={lang} rel="alternate" hreflang={lang} href={url} />
      ));
    }
    return null;
  };

  // Conversion du schéma en chaîne JSON
  const schemaString = schema ? JSON.stringify(schema) : null;

  // Génération des balises meta à partir de l'objet metadata si disponible
  const metaTags = metadata ? generateMetaTags(metadata) : null;

  return (
    <Helmet>
      {/* Balises de base */}
      <html lang={currentLang} />
      <title>{metaTitle}</title>
      
      {/* Si nous avons un objet metadata complet, utiliser les balises générées */}
      {metaTags ? (
        metaTags.map((tag, index) => (
          <meta key={`${tag.name || tag.property}-${index}`} {...tag} />
        ))
      ) : (
        <>
          <meta name="description" content={metaDescription} />
          {metaKeywords && <meta name="keywords" content={metaKeywords} />}
          
          {/* Balises Open Graph */}
          <meta property="og:title" content={metaTitle} />
          <meta property="og:description" content={metaDescription} />
          <meta property="og:type" content={metaOgType} />
          {metaCanonicalUrl && <meta property="og:url" content={metaCanonicalUrl} />}
          {metaOgImage && <meta property="og:image" content={metaOgImage} />}
          <meta property="og:locale" content={currentLang} />
          
          {/* Balises Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={metaTitle} />
          <meta name="twitter:description" content={metaDescription} />
          {metaOgImage && <meta name="twitter:image" content={metaOgImage} />}
        </>
      )}
      
      {/* Balise canonique */}
      {metaCanonicalUrl && <link rel="canonical" href={metaCanonicalUrl} />}
      
      {/* Balises hreflang pour l'internationalisation */}
      {generateHreflangTags()}
      
      {/* Données structurées Schema.org (JSON-LD) */}
      {schema && <script type="application/ld+json">{schemaString}</script>}
    </Helmet>
  );
};

SEOHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonicalUrl: PropTypes.string,
  ogImage: PropTypes.string,
  keywords: PropTypes.arrayOf(PropTypes.string),
  schema: PropTypes.object,
  hreflangLinks: PropTypes.object,
  ogType: PropTypes.string,
  metadata: PropTypes.object
};

export default SEOHead;
