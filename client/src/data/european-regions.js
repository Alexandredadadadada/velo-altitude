/**
 * Données des pays et régions européens pour le calculateur nutritionnel
 * Contient les informations géographiques et les spécificités nutritionnelles régionales
 */

// Pays européens 
const europeanCountries = [
  'Allemagne', 'Autriche', 'Belgique', 'Bulgarie', 'Chypre', 'Croatie', 
  'Danemark', 'Espagne', 'Estonie', 'Finlande', 'France', 'Grèce', 
  'Hongrie', 'Irlande', 'Italie', 'Lettonie', 'Lituanie', 'Luxembourg', 
  'Malte', 'Pays-Bas', 'Pologne', 'Portugal', 'République tchèque', 
  'Roumanie', 'Royaume-Uni', 'Slovaquie', 'Slovénie', 'Suède', 'Suisse', 'Norvège'
];

// Régions par pays
const regionsByCountry = {
  'France': [
    { value: 'auvergne_rhone_alpes', label: 'Auvergne-Rhône-Alpes' },
    { value: 'bourgogne_franche_comte', label: 'Bourgogne-Franche-Comté' },
    { value: 'bretagne', label: 'Bretagne' },
    { value: 'centre_val_de_loire', label: 'Centre-Val de Loire' },
    { value: 'corse', label: 'Corse' },
    { value: 'grand_est', label: 'Grand Est' },
    { value: 'hauts_de_france', label: 'Hauts-de-France' },
    { value: 'ile_de_france', label: 'Île-de-France' },
    { value: 'normandie', label: 'Normandie' },
    { value: 'nouvelle_aquitaine', label: 'Nouvelle-Aquitaine' },
    { value: 'occitanie', label: 'Occitanie' },
    { value: 'pays_de_la_loire', label: 'Pays de la Loire' },
    { value: 'provence_alpes_cote_d_azur', label: 'Provence-Alpes-Côte d\'Azur' }
  ],
  'Italie': [
    { value: 'abruzzo', label: 'Abruzzes' },
    { value: 'valle_d_aosta', label: 'Vallée d\'Aoste' },
    { value: 'puglia', label: 'Pouilles' },
    { value: 'basilicata', label: 'Basilicate' },
    { value: 'calabria', label: 'Calabre' },
    { value: 'campania', label: 'Campanie' },
    { value: 'emilia_romagna', label: 'Émilie-Romagne' },
    { value: 'friuli_venezia_giulia', label: 'Frioul-Vénétie Julienne' },
    { value: 'lazio', label: 'Latium' },
    { value: 'liguria', label: 'Ligurie' },
    { value: 'lombardia', label: 'Lombardie' },
    { value: 'marche', label: 'Marches' },
    { value: 'molise', label: 'Molise' },
    { value: 'piemonte', label: 'Piémont' },
    { value: 'sardegna', label: 'Sardaigne' },
    { value: 'sicilia', label: 'Sicile' },
    { value: 'toscana', label: 'Toscane' },
    { value: 'trentino_alto_adige', label: 'Trentin-Haut-Adige' },
    { value: 'umbria', label: 'Ombrie' },
    { value: 'veneto', label: 'Vénétie' }
  ],
  'Espagne': [
    { value: 'andalucia', label: 'Andalousie' },
    { value: 'aragon', label: 'Aragon' },
    { value: 'asturias', label: 'Asturies' },
    { value: 'baleares', label: 'Îles Baléares' },
    { value: 'canarias', label: 'Îles Canaries' },
    { value: 'cantabria', label: 'Cantabrie' },
    { value: 'castilla_la_mancha', label: 'Castille-La Manche' },
    { value: 'castilla_y_leon', label: 'Castille-et-León' },
    { value: 'cataluna', label: 'Catalogne' },
    { value: 'extremadura', label: 'Estrémadure' },
    { value: 'galicia', label: 'Galice' },
    { value: 'madrid', label: 'Madrid' },
    { value: 'murcia', label: 'Murcie' },
    { value: 'navarra', label: 'Navarre' },
    { value: 'pais_vasco', label: 'Pays basque' },
    { value: 'la_rioja', label: 'La Rioja' },
    { value: 'valencia', label: 'Communauté valencienne' }
  ],
  'Allemagne': [
    { value: 'baden_wurttemberg', label: 'Bade-Wurtemberg' },
    { value: 'bayern', label: 'Bavière' },
    { value: 'berlin', label: 'Berlin' },
    { value: 'brandenburg', label: 'Brandebourg' },
    { value: 'bremen', label: 'Brême' },
    { value: 'hamburg', label: 'Hambourg' },
    { value: 'hessen', label: 'Hesse' },
    { value: 'mecklenburg_vorpommern', label: 'Mecklembourg-Poméranie-Occidentale' },
    { value: 'niedersachsen', label: 'Basse-Saxe' },
    { value: 'nordrhein_westfalen', label: 'Rhénanie-du-Nord-Westphalie' },
    { value: 'rheinland_pfalz', label: 'Rhénanie-Palatinat' },
    { value: 'saarland', label: 'Sarre' },
    { value: 'sachsen', label: 'Saxe' },
    { value: 'sachsen_anhalt', label: 'Saxe-Anhalt' },
    { value: 'schleswig_holstein', label: 'Schleswig-Holstein' },
    { value: 'thuringen', label: 'Thuringe' }
  ],
  // Données pour d'autres pays à ajouter
};

// Spécificités nutritionnelles régionales pour cyclistes
const regionalNutrition = {
  // France
  'grand_est': {
    foods: [
      { name: 'Quiche lorraine', nutrients: { calories: 350, carbs: 25, protein: 15, fat: 20 } },
      { name: 'Mirabelles', nutrients: { calories: 60, carbs: 14, protein: 0.5, fat: 0.2 } },
      { name: 'Munster', nutrients: { calories: 330, carbs: 0, protein: 20, fat: 28 } }
    ],
    hydration: {
      recommendations: 'Prévoir plus d\'eau lors des sorties en Alsace et dans les Vosges, particulièrement en été.',
      localWaters: ['Vittel', 'Contrex', 'Hépar']
    },
    specialties: [
      { name: 'Barre énergétique aux mirabelles', description: 'Source d\'énergie rapide et de potassium' },
      { name: 'Bretzel protéiné', description: 'Collation salée idéale pour les longues sorties' }
    ]
  },
  'auvergne_rhone_alpes': {
    foods: [
      { name: 'Saint-Nectaire', nutrients: { calories: 320, carbs: 0, protein: 21, fat: 26 } },
      { name: 'Lentilles du Puy', nutrients: { calories: 116, carbs: 20, protein: 9, fat: 0.4 } },
      { name: 'Noix de Grenoble', nutrients: { calories: 650, carbs: 14, protein: 15, fat: 65 } }
    ],
    hydration: {
      recommendations: 'Hydratation importante pour les cols alpins, prévoir 1L/h minimum en été.',
      localWaters: ['Volvic', 'Badoit', 'Mont Blanc']
    },
    specialties: [
      { name: 'Barres aux noix et miel', description: 'Énergie longue durée pour les cols' },
      { name: 'Cake aux lentilles', description: 'Source de protéines et glucides complexes' }
    ]
  },
  // Italie
  'lombardia': {
    foods: [
      { name: 'Risotto', nutrients: { calories: 350, carbs: 70, protein: 10, fat: 5 } },
      { name: 'Bresaola', nutrients: { calories: 150, carbs: 0, protein: 32, fat: 2 } },
      { name: 'Grana Padano', nutrients: { calories: 400, carbs: 0, protein: 33, fat: 29 } }
    ],
    hydration: {
      recommendations: 'Prévoir une hydratation renforcée pour les ascensions des lacs lombards.',
      localWaters: ['San Pellegrino', 'Levissima']
    },
    specialties: [
      { name: 'Panino alla Bresaola', description: 'Sandwich protéiné idéal pour la récupération' },
      { name: 'Barretta energetica al riso', description: 'Barre énergétique à base de riz, idéale avant l\'effort' }
    ]
  },
  // Espagne
  'cataluna': {
    foods: [
      { name: 'Pan con tomate', nutrients: { calories: 180, carbs: 30, protein: 5, fat: 5 } },
      { name: 'Fruits secs', nutrients: { calories: 520, carbs: 40, protein: 15, fat: 35 } },
      { name: 'Jamón ibérico', nutrients: { calories: 250, carbs: 0, protein: 43, fat: 8 } }
    ],
    hydration: {
      recommendations: 'Climat méditerranéen chaud, prévoir 20% d\'hydratation supplémentaire et des électrolytes.',
      localWaters: ['Font Vella', 'Viladrau']
    },
    specialties: [
      { name: 'Bocadillo con jamón', description: 'Sandwich énergétique pour les longues sorties' },
      { name: 'Mélange de fruits secs catalans', description: 'Source d\'énergie et d\'antioxydants' }
    ]
  },
  // Autres régions à compléter
};

// Types de terrain européens significatifs pour le cyclisme
const terrainTypes = [
  { value: 'flat', label: 'Plat', energyFactor: 1.0 },
  { value: 'rolling', label: 'Vallonné', energyFactor: 1.2 },
  { value: 'hilly', label: 'Collines', energyFactor: 1.4 },
  { value: 'mountainous', label: 'Montagneux', energyFactor: 1.6 },
  { value: 'alpine', label: 'Haute montagne', energyFactor: 1.8 }
];

// Niveaux de vent et leurs effets sur les besoins énergétiques
const windLevels = [
  { value: 'low', label: 'Faible (0-15 km/h)', energyFactor: 1.0 },
  { value: 'moderate', label: 'Modéré (15-30 km/h)', energyFactor: 1.15 },
  { value: 'high', label: 'Fort (30-50 km/h)', energyFactor: 1.3 },
  { value: 'very_high', label: 'Très fort (>50 km/h)', energyFactor: 1.5 }
];

// Recommandations générales d'hydratation basées sur les conditions
const hydrationRecommendations = {
  // Température en °C
  temperature: {
    cold: { range: [-10, 5], baseFactor: 0.8, description: 'Ne pas négliger l\'hydratation malgré le froid' },
    cool: { range: [5, 15], baseFactor: 0.9, description: 'Hydratation régulière toutes les 20 minutes' },
    moderate: { range: [15, 25], baseFactor: 1.0, description: 'Hydratation standard toutes les 15-20 minutes' },
    warm: { range: [25, 32], baseFactor: 1.2, description: 'Augmenter l\'apport hydrique de 20%' },
    hot: { range: [32, 40], baseFactor: 1.5, description: 'Doubler l\'apport hydrique, ajouter des électrolytes' }
  },
  // Humidité en %
  humidity: {
    low: { range: [0, 30], factor: 0.9 },
    moderate: { range: [30, 60], factor: 1.0 },
    high: { range: [60, 80], factor: 1.1 },
    very_high: { range: [80, 100], factor: 1.2 }
  },
  // Altitude en mètres
  altitude: {
    low: { range: [0, 500], factor: 1.0 },
    moderate: { range: [500, 1500], factor: 1.1 },
    high: { range: [1500, 2500], factor: 1.2 },
    very_high: { range: [2500, 3500], factor: 1.3 }
  }
};

// Exporter toutes les données
export {
  europeanCountries,
  regionsByCountry,
  regionalNutrition,
  terrainTypes,
  windLevels,
  hydrationRecommendations
};
