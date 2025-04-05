// Données de fallback pour les actualités
// Utilisé lorsque la connexion à MongoDB échoue dans les fonctions Netlify

module.exports = [
  {
    _id: "news001",
    title: "Grand Prix de Cyclisme de Strasbourg",
    content: "Le Grand Prix de Strasbourg revient pour sa 35ème édition. Cette année, l'événement accueillera plus de 200 coureurs professionnels des quatre coins de l'Europe.",
    image: "/images/news/strasbourg-event.jpg",
    category: "événement",
    author: "Équipe Grand-Est Cyclisme",
    publishedAt: new Date("2025-04-20").toISOString(),
    tags: ["compétition", "strasbourg", "grand-prix"]
  },
  {
    _id: "news002",
    title: "Nouveau parcours cycliste dans les Vosges",
    content: "Un nouveau parcours de moyenne montagne a été inauguré dans le massif des Vosges. Ce tracé de 85km offre des dénivelés variés et des panoramas exceptionnels sur la région.",
    image: "/images/news/vosges-parcours.jpg",
    category: "parcours",
    author: "David Martin",
    publishedAt: new Date("2025-04-15").toISOString(),
    tags: ["vosges", "parcours", "découverte"]
  },
  {
    _id: "news003",
    title: "Formation jeunes cyclistes à Mulhouse",
    content: "Le centre de formation de Mulhouse ouvre ses portes aux jeunes talents du cyclisme. Les inscriptions pour la saison 2025-2026 sont désormais ouvertes.",
    image: "/images/news/formation-mulhouse.jpg",
    category: "formation",
    author: "Centre de Formation Cycliste",
    publishedAt: new Date("2025-04-10").toISOString(),
    tags: ["formation", "jeunes", "mulhouse"]
  },
  {
    _id: "news004",
    title: "Challenge d'Alsace - Résultats",
    content: "Le Challenge d'Alsace s'est conclu ce weekend avec la victoire de Thomas Klein qui confirme sa domination sur le circuit régional cette saison.",
    image: "/images/news/challenge-alsace.jpg",
    category: "résultats",
    author: "Fédération Grand-Est",
    publishedAt: new Date("2025-04-05").toISOString(),
    tags: ["compétition", "résultats", "alsace"]
  }
];
