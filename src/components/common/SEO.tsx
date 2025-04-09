import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogType?: string;
  ogImage?: string;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description = 'Découvrez les cols alpins, planifiez vos itinéraires cyclistes et suivez les conditions météorologiques en temps réel avec Velo-Altitude.',
  keywords = ['cyclisme', 'cols', 'alpes', 'itinéraires', 'météo', 'vélo'],
  canonicalUrl,
  ogType = 'website',
  ogImage = '/assets/images/og-image.jpg',
}) => {
  const siteUrl = 'https://velo-altitude.com';
  const fullUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : siteUrl;
  const fullTitle = `${title} | Velo-Altitude`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      {canonicalUrl && <link rel="canonical" href={fullUrl} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
    </Helmet>
  );
};

export default SEO;
