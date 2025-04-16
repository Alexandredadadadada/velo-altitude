/**
 * Composant de pied de page pour les pages de catégorie
 * 
 * Ce composant fournit du contenu riche en pied de page avec :
 * - Une section FAQ avec données structurées Schema.org
 * - Du contenu textuel additionnel pour le SEO
 * - Des liens contextuels supplémentaires
 */

import React from 'react';
import { 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Divider,
  Link as MUILink,
  Paper
} from '@material-ui/core';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import HelpOutlineIcon from '@material-ui/icons/HelpOutline';
import { Helmet } from 'react-helmet';

// Configuration des catégories
import { getCategoryConfig } from '../../utils/categoryConfig';

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1),
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  contentSection: {
    marginBottom: theme.spacing(4),
  },
  faqContainer: {
    marginBottom: theme.spacing(4),
  },
  faqItem: {
    marginBottom: theme.spacing(1),
  },
  accordion: {
    '&:before': {
      display: 'none',
    },
  },
  accordionSummary: {
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    '&.Mui-expanded': {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  accordionDetails: {
    display: 'block',
  },
  infoBox: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(3),
  },
}));

/**
 * Composant de pied de page pour les catégories
 */
const CategoryFooter = ({
  category,
  subcategory,
  language = 'fr'
}) => {
  const classes = useStyles();
  const config = getCategoryConfig(category);
  
  // S'il n'y a pas de configuration, ne rien afficher
  if (!config) {
    return null;
  }
  
  // Obtenir les FAQ pour cette catégorie/sous-catégorie
  const getFAQs = () => {
    // FAQ spécifique à la sous-catégorie
    if (subcategory && config.subcategories) {
      const subCat = config.subcategories.find(sub => sub.key === subcategory);
      if (subCat && subCat.faq && subCat.faq[language]) {
        return subCat.faq[language];
      }
    }
    
    // FAQ générale de la catégorie
    if (config.faq && config.faq[language]) {
      return config.faq[language];
    }
    
    // FAQ par défaut selon la catégorie
    const defaultFAQs = {
      cols: [
        {
          question: language === 'fr' 
            ? "Comment les cols sont-ils classés par difficulté ?" 
            : "How are the mountain passes classified by difficulty?",
          answer: language === 'fr'
            ? "Notre classification de difficulté prend en compte plusieurs facteurs : la longueur du col, le dénivelé, la pente moyenne et maximale, l'altitude, et l'exposition. Ces éléments sont combinés pour donner une note de difficulté de 1 à 5, où 5 représente les cols les plus difficiles. Cette notation est indépendante de la classification officielle des courses cyclistes."
            : "Our difficulty classification takes into account several factors: the length of the pass, the elevation gain, the average and maximum slope, the altitude, and exposure. These elements are combined to give a difficulty rating from 1 to 5, where 5 represents the most difficult passes. This rating is independent of the official cycling race classifications."
        },
        {
          question: language === 'fr' 
            ? "Quelle est la meilleure période pour grimper les cols ?" 
            : "What is the best time to climb mountain passes?",
          answer: language === 'fr'
            ? "La période optimale pour la plupart des cols européens se situe entre juin et septembre. Les cols de haute altitude (>2000m) sont généralement ouverts de mi-juin à mi-octobre, selon les conditions météorologiques. Pour les cols de moyenne altitude, la saison s'étend d'avril à novembre. Consultez toujours les informations spécifiques à chaque col et vérifiez les conditions météorologiques avant de planifier votre sortie."
            : "The optimal period for most European passes is between June and September. High-altitude passes (>2000m) are generally open from mid-June to mid-October, depending on weather conditions. For medium-altitude passes, the season extends from April to November. Always check the specific information for each pass and verify weather conditions before planning your ride."
        },
        {
          question: language === 'fr' 
            ? "Comment se préparer efficacement pour grimper un col difficile ?" 
            : "How to effectively prepare for climbing a difficult pass?",
          answer: language === 'fr'
            ? "La préparation pour un col difficile doit être progressive et combiner plusieurs aspects : entraînement spécifique avec travail de puissance et d'endurance, préparation mentale, stratégie de nutrition et d'hydratation adaptée, et choix du matériel approprié. Nous recommandons de suivre un de nos programmes d'entraînement spécifiques au moins 8-12 semaines avant de tenter un col difficile. L'acclimatation à l'altitude est également importante pour les cols au-dessus de 2000m."
            : "Preparation for a difficult pass should be progressive and combine several aspects: specific training with power and endurance work, mental preparation, adapted nutrition and hydration strategy, and choice of appropriate equipment. We recommend following one of our specific training programs at least 8-12 weeks before attempting a difficult pass. Altitude acclimatization is also important for passes above 2000m."
        }
      ],
      programs: [
        {
          question: language === 'fr' 
            ? "Comment choisir le programme d'entraînement adapté à mon niveau ?" 
            : "How to choose the training program suitable for my level?",
          answer: language === 'fr'
            ? "Nos programmes sont classés par niveau de 1 à 5. Le niveau 1 convient aux débutants qui peuvent rouler jusqu'à 1h sans s'arrêter. Le niveau 3 est pour les cyclistes intermédiaires capables de rouler 2-3h et ayant déjà grimpé quelques cols. Le niveau 5 s'adresse aux cyclistes avancés avec une bonne expérience en montagne. Nous recommandons d'être honnête dans votre auto-évaluation et de commencer par un niveau légèrement inférieur à ce que vous pensez pouvoir suivre."
            : "Our programs are classified by level from 1 to 5. Level 1 is suitable for beginners who can ride up to 1h without stopping. Level 3 is for intermediate cyclists capable of riding 2-3h and who have already climbed some passes. Level 5 is for advanced cyclists with good mountain experience. We recommend being honest in your self-assessment and starting with a level slightly lower than what you think you can follow."
        },
        {
          question: language === 'fr' 
            ? "Combien de temps avant un événement dois-je commencer un programme ?" 
            : "How long before an event should I start a program?",
          answer: language === 'fr'
            ? "Pour des résultats optimaux, commencez nos programmes spécifiques 12 à 16 semaines avant votre objectif principal. Pour les programmes d'amélioration générale, comptez 8 à 12 semaines. Si vous avez moins de temps, nous proposons des programmes accélérés de 4 à 6 semaines, mais les gains seront plus limités. L'important est de rester régulier et de respecter les périodes de récupération pour éviter le surentraînement."
            : "For optimal results, start our specific programs 12 to 16 weeks before your main goal. For general improvement programs, allow 8 to 12 weeks. If you have less time, we offer accelerated programs of 4 to 6 weeks, but the gains will be more limited. The important thing is to remain consistent and respect recovery periods to avoid overtraining."
        }
      ],
      nutrition: [
        {
          question: language === 'fr' 
            ? "Quelle est la stratégie nutritionnelle à adopter pour un col long ?" 
            : "What nutritional strategy should be adopted for a long climb?",
          answer: language === 'fr'
            ? "Pour un col long (>1h d'effort), votre stratégie doit se diviser en trois phases. Avant : privilégiez des glucides complexes 3-4h avant, puis des glucides simples 30-60min avant le départ. Pendant : consommez 60-90g de glucides par heure sous forme de boisson énergétique, gels ou barres, et buvez 500-750ml d'eau par heure. Après : dans les 30 minutes suivant l'effort, consommez des protéines et des glucides dans un ratio de 1:3 pour optimiser la récupération."
            : "For a long climb (>1h of effort), your strategy should be divided into three phases. Before: favor complex carbohydrates 3-4h before, then simple carbohydrates 30-60min before departure. During: consume 60-90g of carbohydrates per hour in the form of energy drinks, gels, or bars, and drink 500-750ml of water per hour. After: within 30 minutes following the effort, consume protein and carbohydrates in a 1:3 ratio to optimize recovery."
        },
        {
          question: language === 'fr' 
            ? "Comment adapter son alimentation pour un séjour cycliste en montagne ?" 
            : "How to adapt your diet for a cycling trip in the mountains?",
          answer: language === 'fr'
            ? "Lors d'un séjour cycliste en montagne de plusieurs jours, augmentez votre apport calorique total de 20-30% par rapport à votre alimentation habituelle. Privilégiez les glucides complexes (60-65% de votre apport calorique), les protéines de qualité (15-20%), et les graisses saines (20-25%). Hydratez-vous abondamment même les jours de repos et incluez des aliments riches en électrolytes. La veille d'une grosse journée, pratiquez le 'carb-loading' en augmentant légèrement votre consommation de glucides."
            : "During a multi-day cycling trip in the mountains, increase your total caloric intake by 20-30% compared to your usual diet. Focus on complex carbohydrates (60-65% of your caloric intake), quality proteins (15-20%), and healthy fats (20-25%). Hydrate abundantly even on rest days and include foods rich in electrolytes. The day before a big day, practice 'carb-loading' by slightly increasing your carbohydrate consumption."
        }
      ],
      challenges: [
        {
          question: language === 'fr' 
            ? "Comment se préparer pour le défi des 7 Majeurs ?" 
            : "How to prepare for the 7 Majors challenge?",
          answer: language === 'fr'
            ? "La préparation pour le défi des 7 Majeurs nécessite un entraînement d'au moins 16 semaines pour un cycliste intermédiaire. Votre préparation doit inclure : des sorties longues progressives jusqu'à 6-7h, du travail spécifique de puissance en côte, des blocs d'entraînement en altitude si possible, et des séances de récupération active. Nous recommandons également de tester votre équipement et votre stratégie nutritionnelle sur des sorties similaires avant le défi. Notre programme spécifique '7 Majeurs' détaille semaine par semaine cette préparation."
            : "Preparation for the 7 Majors challenge requires at least 16 weeks of training for an intermediate cyclist. Your preparation should include: progressive long rides up to 6-7h, specific hill power work, altitude training blocks if possible, and active recovery sessions. We also recommend testing your equipment and nutritional strategy on similar outings before the challenge. Our specific '7 Majors' program details this preparation week by week."
        },
        {
          question: language === 'fr' 
            ? "Peut-on personnaliser un défi existant ?" 
            : "Can an existing challenge be customized?",
          answer: language === 'fr'
            ? "Oui, tous nos défis peuvent être personnalisés selon vos préférences et votre niveau. Pour les défis régionaux, vous pouvez modifier les cols inclus tout en conservant la cohérence géographique. Pour le concept des 7 Majeurs, vous pouvez créer votre propre sélection de cols prestigieux. Utilisez notre outil de création de défis pour ajuster la distance, le dénivelé et la difficulté selon vos objectifs. Vos défis personnalisés peuvent être sauvegardés, partagés et exportés au format GPX."
            : "Yes, all our challenges can be customized according to your preferences and level. For regional challenges, you can modify the included passes while maintaining geographical coherence. For the 7 Majors concept, you can create your own selection of prestigious passes. Use our challenge creation tool to adjust the distance, elevation gain, and difficulty according to your objectives. Your customized challenges can be saved, shared, and exported in GPX format."
        }
      ]
    };
    
    return defaultFAQs[category] || [];
  };
  
  // Contenu additionnel pour le SEO
  const getAdditionalContent = () => {
    // Contenu spécifique à la sous-catégorie
    if (subcategory && config.subcategories) {
      const subCat = config.subcategories.find(sub => sub.key === subcategory);
      if (subCat && subCat.additionalContent && subCat.additionalContent[language]) {
        return subCat.additionalContent[language];
      }
    }
    
    // Contenu général de la catégorie
    if (config.additionalContent && config.additionalContent[language]) {
      return config.additionalContent[language];
    }
    
    // Contenu par défaut selon la catégorie
    const defaultContent = {
      cols: {
        fr: `<p>Le cyclisme de montagne représente l'un des défis les plus exigeants et gratifiants pour tout passionné de vélo. Les cols offrent non seulement un défi physique intense, mais aussi des paysages à couper le souffle et un sentiment d'accomplissement incomparable.</p>
        <p>À Velo-Altitude, nous nous sommes spécialisés dans la documentation détaillée des cols à travers l'Europe. Notre base de données comprend des informations précises sur le dénivelé, la longueur, la pente moyenne et maximale, l'altitude, les conditions météorologiques typiques, et bien plus encore. Chaque col est accompagné de conseils pratiques basés sur l'expérience de cyclistes chevronnés.</p>
        <p>Que vous soyez à la recherche des légendaires ascensions du Tour de France comme l'Alpe d'Huez ou le Tourmalet, ou que vous préfériez des joyaux moins connus comme le Col de la Madone ou le Grossglockner, notre catalogue complet vous aidera à planifier vos aventures cyclistes en montagne.</p>`,
        en: `<p>Mountain cycling represents one of the most demanding and rewarding challenges for any cycling enthusiast. Mountain passes not only offer an intense physical challenge, but also breathtaking landscapes and an incomparable sense of accomplishment.</p>
        <p>At Velo-Altitude, we have specialized in detailed documentation of passes across Europe. Our database includes precise information on elevation gain, length, average and maximum gradient, altitude, typical weather conditions, and much more. Each pass is accompanied by practical advice based on the experience of seasoned cyclists.</p>
        <p>Whether you're looking for legendary Tour de France climbs like Alpe d'Huez or Tourmalet, or prefer lesser-known gems like Col de la Madone or Grossglockner, our comprehensive catalog will help you plan your mountain cycling adventures.</p>`
      },
      programs: {
        fr: `<p>L'ascension des cols de montagne requiert une préparation physique spécifique que nos programmes d'entraînement sont conçus pour vous apporter. Contrairement au cyclisme sur terrain plat, le cyclisme de montagne sollicite des qualités particulières : endurance musculaire, gestion de l'effort sur longue durée, adaptation à l'altitude et capacité à maintenir une puissance constante sur des pentes variables.</p>
        <p>Nos programmes ont été développés par des entraîneurs professionnels spécialisés dans le cyclisme de montagne, en collaboration avec des physiologistes du sport. Ils intègrent les dernières avancées scientifiques en matière d'entraînement et sont constamment mis à jour.</p>
        <p>Chaque programme est structuré sur plusieurs semaines et alterne différents types de séances : travail de puissance, endurance fondamentale, répétitions en côte, récupération active, et sorties longues progressives. Cette approche périodisée garantit une progression optimale tout en minimisant les risques de blessure ou de surentraînement.</p>`,
        en: `<p>Climbing mountain passes requires specific physical preparation that our training programs are designed to provide. Unlike cycling on flat terrain, mountain cycling requires particular qualities: muscular endurance, effort management over long duration, adaptation to altitude, and the ability to maintain constant power on variable slopes.</p>
        <p>Our programs have been developed by professional coaches specialized in mountain cycling, in collaboration with sports physiologists. They incorporate the latest scientific advances in training and are constantly updated.</p>
        <p>Each program is structured over several weeks and alternates different types of sessions: power work, fundamental endurance, hill repetitions, active recovery, and progressive long rides. This periodized approach ensures optimal progression while minimizing the risk of injury or overtraining.</p>`
      },
      nutrition: {
        fr: `<p>La nutrition joue un rôle crucial dans la performance cycliste, particulièrement en montagne où les dépenses énergétiques sont considérablement augmentées. Une stratégie nutritionnelle adaptée peut faire la différence entre une ascension réussie et un "coup de pompe" prématuré.</p>
        <p>Nos plans nutritionnels et recettes sont spécifiquement conçus pour répondre aux besoins des cyclistes affrontant des cols. Ils prennent en compte plusieurs facteurs clés : l'apport calorique total nécessaire, la répartition optimale des macronutriments, le timing des prises alimentaires, et les besoins spécifiques en électrolytes et micronutriments.</p>
        <p>Que vous prépariez une sortie ponctuelle sur un col mythique ou un séjour cycliste de plusieurs jours en montagne, nos guides nutritionnels vous aideront à maximiser votre énergie, améliorer votre récupération et maintenir votre hydratation - trois éléments essentiels pour performer en altitude.</p>`,
        en: `<p>Nutrition plays a crucial role in cycling performance, particularly in the mountains where energy expenditure is considerably increased. An adapted nutritional strategy can make the difference between a successful climb and a premature "bonk".</p>
        <p>Our nutritional plans and recipes are specifically designed to meet the needs of cyclists facing mountain passes. They take into account several key factors: the necessary total caloric intake, the optimal distribution of macronutrients, the timing of food intake, and the specific needs for electrolytes and micronutrients.</p>
        <p>Whether you're preparing for a one-time ride on a mythical pass or a multi-day cycling trip in the mountains, our nutritional guides will help you maximize your energy, improve your recovery, and maintain your hydration - three essential elements for performing at altitude.</p>`
      },
      challenges: {
        fr: `<p>Les défis cyclistes représentent une manière passionnante de structurer vos objectifs et de vous pousser au-delà de vos limites habituelles. Notre concept exclusif "Les 7 Majeurs" permet aux cyclistes de tous niveaux de créer un défi personnalisé composé de sept cols prestigieux à conquérir.</p>
        <p>En plus de ce concept phare, nous proposons des défis régionaux (Alpes, Pyrénées, Dolomites, etc.) et thématiques (grands cols du Tour de France, ascensions historiques, etc.). Chaque défi est accompagné d'un parcours détaillé, d'informations pratiques et de suggestions pour l'organisation logistique.</p>
        <p>La dimension communautaire est également importante : partagez vos accomplissements, comparez vos temps, et rejoignez d'autres passionnés lors d'événements organisés autour de ces défis. Notre plateforme vous permet de suivre votre progression et de documenter votre aventure avec photos et récits.</p>`,
        en: `<p>Cycling challenges represent an exciting way to structure your goals and push yourself beyond your usual limits. Our exclusive "The 7 Majors" concept allows cyclists of all levels to create a personalized challenge composed of seven prestigious passes to conquer.</p>
        <p>In addition to this flagship concept, we offer regional challenges (Alps, Pyrenees, Dolomites, etc.) and thematic ones (great Tour de France passes, historical climbs, etc.). Each challenge is accompanied by a detailed route, practical information, and suggestions for logistical organization.</p>
        <p>The community dimension is also important: share your accomplishments, compare your times, and join other enthusiasts during events organized around these challenges. Our platform allows you to track your progress and document your adventure with photos and stories.</p>`
      }
    };
    
    return defaultContent[category]?.[language] || '';
  };
  
  // Générer le schéma JSON pour les FAQ
  const generateFAQSchema = () => {
    const faqs = getFAQs();
    
    if (!faqs || faqs.length === 0) {
      return null;
    }
    
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
    
    return JSON.stringify(faqSchema);
  };
  
  // Obtenir des liens contextuels supplémentaires
  const getContextualLinks = () => {
    // Liens contextuels selon la catégorie
    const contextualLinks = {
      cols: [
        {
          url: "/programs/col-specific",
          label: {
            fr: "Programmes d'entraînement pour cols",
            en: "Training programs for mountain passes"
          }
        },
        {
          url: "/nutrition/cycling-specific",
          label: {
            fr: "Nutrition adaptée pour l'ascension des cols",
            en: "Nutrition tailored for climbing mountain passes"
          }
        },
        {
          url: "/challenges/alps",
          label: {
            fr: "Défis dans les Alpes",
            en: "Challenges in the Alps"
          }
        }
      ],
      programs: [
        {
          url: "/nutrition/training-specific",
          label: {
            fr: "Plans nutritionnels pour accompagner votre entraînement",
            en: "Nutritional plans to support your training"
          }
        },
        {
          url: "/cols/featured",
          label: {
            fr: "Cols mythiques pour mettre en pratique votre entraînement",
            en: "Mythical mountain passes to apply your training"
          }
        },
        {
          url: "/challenges/create",
          label: {
            fr: "Créez votre propre défi",
            en: "Create your own challenge"
          }
        }
      ],
      nutrition: [
        {
          url: "/programs/recovery",
          label: {
            fr: "Programmes de récupération pour compléter votre nutrition",
            en: "Recovery programs to complement your nutrition"
          }
        },
        {
          url: "/cols/difficulty-5",
          label: {
            fr: "Nutrition pour les cols les plus difficiles",
            en: "Nutrition for the most difficult passes"
          }
        },
        {
          url: "/articles/nutrition-science",
          label: {
            fr: "Articles sur la science de la nutrition pour cyclistes",
            en: "Articles on nutrition science for cyclists"
          }
        }
      ],
      challenges: [
        {
          url: "/programs/challenge-specific",
          label: {
            fr: "Programmes d'entraînement pour se préparer aux défis",
            en: "Training programs to prepare for challenges"
          }
        },
        {
          url: "/cols/challenge-included",
          label: {
            fr: "Découvrez en détail les cols inclus dans ce défi",
            en: "Discover in detail the mountain passes included in this challenge"
          }
        },
        {
          url: "/nutrition/long-distance",
          label: {
            fr: "Nutrition pour les défis longue distance",
            en: "Nutrition for long-distance challenges"
          }
        }
      ]
    };
    
    return contextualLinks[category] || [];
  };
  
  // Afficher les FAQ
  const renderFAQs = () => {
    const faqs = getFAQs();
    
    if (!faqs || faqs.length === 0) {
      return null;
    }
    
    return (
      <div className={classes.faqContainer}>
        <Typography variant="h5" component="h2" className={classes.title}>
          <HelpOutlineIcon color="primary" />
          {language === 'fr' ? 'Questions fréquentes' : 'Frequently Asked Questions'}
        </Typography>
        
        {faqs.map((faq, index) => (
          <Accordion 
            key={index} 
            className={classes.faqItem}
            classes={{ root: classes.accordion }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              className={classes.accordionSummary}
              id={`faq-header-${index}`}
              aria-controls={`faq-content-${index}`}
            >
              <Typography variant="subtitle1">
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.accordionDetails}>
              <Typography variant="body1">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  };
  
  return (
    <div className={classes.root}>
      {/* Schéma JSON pour les FAQ */}
      <Helmet>
        {generateFAQSchema() && (
          <script type="application/ld+json">
            {generateFAQSchema()}
          </script>
        )}
      </Helmet>
      
      {/* Contenu additionnel SEO */}
      <div className={classes.contentSection}>
        <Typography 
          variant="body1" 
          component="div"
          dangerouslySetInnerHTML={{ __html: getAdditionalContent() }}
        />
      </div>
      
      {/* Section FAQ */}
      {renderFAQs()}
      
      {/* Liens contextuels */}
      <Paper className={classes.infoBox}>
        <Typography variant="h6" gutterBottom>
          {language === 'fr' ? 'Découvrez également' : 'Also discover'}
        </Typography>
        
        <Box display="flex" flexDirection="column">
          {getContextualLinks().map((link, index) => (
            <MUILink 
              key={index}
              component={Link}
              to={link.url}
              color="primary"
              gutterBottom
            >
              {link.label[language]}
            </MUILink>
          ))}
        </Box>
      </Paper>
      
      {/* Note de bas de page */}
      <Box mt={4} mb={2}>
        <Typography variant="caption" color="textSecondary">
          {language === 'fr'
            ? 'Dernière mise à jour le : ' + new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'Last updated on: ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          }
        </Typography>
      </Box>
    </div>
  );
};

export default CategoryFooter;
