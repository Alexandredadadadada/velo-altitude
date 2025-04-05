// Données de fallback pour les événements à venir
// Ces données servent de sauvegarde lorsque la base de données n'est pas disponible

const fallbackEvents = [
  {
    _id: "event001",
    title: "Grand Challenge des 7 Majeurs",
    type: "Défi communautaire",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString(),
    location: {
      name: "Alpes françaises",
      region: "Rhône-Alpes",
      country: "France",
      coordinates: {
        lat: 45.9163,
        lng: 6.8663
      }
    },
    description: "Défiez-vous sur les 7 cols majeurs des Alpes françaises en une semaine. Parcours emblématique pour cyclistes confirmés.",
    distance: 520,
    elevation: 12500,
    difficulty: "Expert",
    imageUrl: "/images/events/sept-majeurs.jpg",
    organizer: "Velo-Altitude",
    registrationUrl: "/events/register/grand-challenge-7-majeurs",
    participants: 124
  },
  {
    _id: "event002",
    title: "Week-end Nutrition & Entraînement",
    type: "Formation",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 5).toISOString(),
    location: {
      name: "Annecy",
      region: "Rhône-Alpes",
      country: "France",
      coordinates: {
        lat: 45.899247,
        lng: 6.129384
      }
    },
    description: "Un week-end complet dédié à l'optimisation de votre nutrition et de votre entraînement pour les cols. Animé par des experts et des cyclistes professionnels.",
    difficulty: "Tous niveaux",
    imageUrl: "/images/events/nutrition-entrainement.jpg",
    organizer: "Velo-Altitude & Centre Sportif d'Annecy",
    registrationUrl: "/events/register/weekend-nutrition-entrainement",
    participants: 45
  },
  {
    _id: "event003",
    title: "La Pyrénéenne",
    type: "Course cycliste",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 3, 20).toISOString(),
    location: {
      name: "Pyrénées",
      region: "Occitanie",
      country: "France",
      coordinates: {
        lat: 42.9372,
        lng: 0.1444
      }
    },
    description: "Course cycliste traversant les plus beaux cols des Pyrénées, avec trois parcours adaptés à tous les niveaux.",
    distance: [80, 120, 180],
    elevation: [1800, 2900, 4500],
    difficulty: "Intermédiaire à Expert",
    imageUrl: "/images/events/la-pyreneenne.jpg",
    organizer: "Association Cycliste Pyrénéenne",
    registrationUrl: "/events/register/la-pyreneenne",
    participants: 350
  },
  {
    _id: "event004",
    title: "Atelier Technique : Préparation aux longs cols",
    type: "Atelier",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 25).toISOString(),
    location: {
      name: "Lyon",
      region: "Rhône-Alpes",
      country: "France",
      coordinates: {
        lat: 45.7640,
        lng: 4.8357
      }
    },
    description: "Apprenez les techniques et astuces pour aborder les longs cols avec confiance. Gestion de l'effort, positionnement, respiration et stratégie globale.",
    difficulty: "Tous niveaux",
    imageUrl: "/images/events/atelier-technique.jpg",
    organizer: "Velo-Altitude",
    registrationUrl: "/events/register/atelier-technique-longs-cols",
    participants: 30
  },
  {
    _id: "event005",
    title: "Challenge des 3 Versants du Ventoux",
    type: "Défi communautaire",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 4, 10).toISOString(),
    location: {
      name: "Mont Ventoux",
      region: "Provence",
      country: "France",
      coordinates: {
        lat: 44.1740,
        lng: 5.2786
      }
    },
    description: "Gravissez les trois versants du mythique Mont Ventoux en une journée. Un défi légendaire pour cyclistes aguerris.",
    distance: 120,
    elevation: 4500,
    difficulty: "Expert",
    imageUrl: "/images/events/ventoux-3-versants.jpg",
    organizer: "Club Cycliste de Provence",
    registrationUrl: "/events/register/3-versants-ventoux",
    participants: 80
  },
  {
    _id: "event006",
    title: "Séjour Découverte des Carpates",
    type: "Voyage cycliste",
    date: new Date(new Date().getFullYear(), new Date().getMonth() + 5, 1).toISOString(),
    location: {
      name: "Carpates",
      region: "Transylvanie",
      country: "Roumanie",
      coordinates: {
        lat: 45.5152,
        lng: 25.3672
      }
    },
    description: "Une semaine pour découvrir les cols méconnus mais spectaculaires des Carpates roumaines. Logement, support technique et transfert des bagages inclus.",
    distance: 400,
    elevation: 8000,
    difficulty: "Intermédiaire",
    imageUrl: "/images/events/carpates-discovery.jpg",
    organizer: "Velo-Altitude & Romania Cycling Tours",
    registrationUrl: "/events/register/sejour-carpates",
    participants: 18
  }
];

module.exports = fallbackEvents;
