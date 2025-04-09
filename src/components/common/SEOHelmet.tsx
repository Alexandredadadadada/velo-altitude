import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOHelmetProps {
  title: string;
  description?: string;
  keywords?: string[];
  author?: string;
  lang?: string;
  meta?: Array<{
    name: string;
    content: string;
  }>;
}

const SEOHelmet: React.FC<SEOHelmetProps> = ({
  title,
  description = 'Velo-Altitude - La plateforme complète pour le cyclisme de montagne en Europe',
  keywords = ['velo', 'alpes', 'cyclisme', 'cols', 'montagne', 'itinéraires', 'météo'],
  author = 'Velo-Altitude Team',
  lang = 'fr',
  meta = [],
}) => {
  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | Velo-Altitude`}
      meta={[
        {
          name: `description`,
          content: description,
        },
        {
          name: `keywords`,
          content: keywords.join(', '),
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: description,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:creator`,
          content: author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: description,
        },
      ].concat(meta)}
    />
  );
};

export default SEOHelmet;
