const fs = require('fs');
const path = require('path');

// Données des cols majeurs européens
const colsData = {
  cols: [
    {
      id: "col-tourmalet",
      name: "Col du Tourmalet",
      location: {
        country: "France",
        region: "Hautes-Pyrénées",
        coordinates: {
          lat: 42.8722,
          lng: 0.1775
        }
      },
      statistics: {
        length: 19.0,
        elevation_gain: 1404,
        avg_gradient: 7.4,
        max_gradient: 10.2,
        start_elevation: 850,
        summit_elevation: 2115
      },
      elevation_profile: [
        {"distance": 0, "elevation": 850},
        {"distance": 2, "elevation": 950},
        {"distance": 5, "elevation": 1150},
        {"distance": 10, "elevation": 1500},
        {"distance": 15, "elevation": 1850},
        {"distance": 19, "elevation": 2115}
      ],
      history: {
        tour_appearances: 87,
        first_appearance: 1910,
        notable_events: [
          "Première apparition dans le Tour de France en 1910",
          "Théâtre de la bataille entre Contador et Schleck en 2010",
          "Étape mythique où Eugène Christophe a réparé sa fourche en 1913"
        ],
        records: {
          ascent: "36:46 par Bjarne Riis en 1996"
        }
      },
      difficulty: 5,
      recommended_season: ["juin", "juillet", "août", "septembre"],
      images: [
        "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Col_du_Tourmalet.jpg/1200px-Col_du_Tourmalet.jpg",
        "https://www.climbbybike.com/img/Col_du_Tourmalet.jpg"
      ],
      practical_info: {
        parking: "Parking disponible à La Mongie et Barèges",
        water_points: ["Fontaine à Sainte-Marie-de-Campan", "Fontaine au sommet"],
        hazards: ["Tunnel non éclairé à 3km du sommet", "Vent fort possible au sommet"]
      }
    },
    {
      id: "alpe-dhuez",
      name: "Alpe d'Huez",
      location: {
        country: "France",
        region: "Isère",
        coordinates: {
          lat: 45.0909,
          lng: 6.0706
        }
      },
      statistics: {
        length: 13.8,
        elevation_gain: 1071,
        avg_gradient: 7.9,
        max_gradient: 11.5,
        start_elevation: 741,
        summit_elevation: 1812
      },
      elevation_profile: [
        {"distance": 0, "elevation": 741},
        {"distance": 1, "elevation": 820},
        {"distance": 3, "elevation": 1000},
        {"distance": 6, "elevation": 1200},
        {"distance": 9, "elevation": 1400},
        {"distance": 12, "elevation": 1650},
        {"distance": 13.8, "elevation": 1812}
      ],
      history: {
        tour_appearances: 31,
        first_appearance: 1952,
        notable_events: [
          "Première victoire de Fausto Coppi en 1952",
          "Les 21 virages numérotés sont devenus emblématiques",
          "Victoire mémorable de Marco Pantani en 1997 avec un temps record"
        ],
        records: {
          ascent: "37:35 par Marco Pantani en 1997"
        }
      },
      difficulty: 4,
      recommended_season: ["mai", "juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Alpe_d_Huez.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Alpe_d%27Huez_-_panoramio.jpg/1200px-Alpe_d%27Huez_-_panoramio.jpg"
      ],
      practical_info: {
        parking: "Parking au pied de la montée à Bourg-d'Oisans",
        water_points: ["Fontaines dans plusieurs virages", "Restaurants et cafés en station"],
        hazards: ["Trafic important en haute saison", "Exposition au soleil"]
      }
    },
    {
      id: "stelvio-pass",
      name: "Passo dello Stelvio",
      location: {
        country: "Italie",
        region: "Lombardie",
        coordinates: {
          lat: 46.5266,
          lng: 10.4537
        }
      },
      statistics: {
        length: 24.3,
        elevation_gain: 1808,
        avg_gradient: 7.4,
        max_gradient: 12.0,
        start_elevation: 1270,
        summit_elevation: 2758
      },
      elevation_profile: [
        {"distance": 0, "elevation": 1270},
        {"distance": 5, "elevation": 1600},
        {"distance": 10, "elevation": 1900},
        {"distance": 15, "elevation": 2200},
        {"distance": 20, "elevation": 2500},
        {"distance": 24.3, "elevation": 2758}
      ],
      history: {
        tour_appearances: 4,
        first_appearance: 1953,
        notable_events: [
          "Considéré comme l'une des plus belles routes des Alpes",
          "48 virages en épingle numérotés du côté de Prato",
          "Fausto Coppi a franchi le col en tête lors du Giro 1953"
        ],
        records: {
          ascent: "1h12 par Marco Pantani (non officiel)"
        }
      },
      difficulty: 5,
      recommended_season: ["juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Passo_dello_Stelvio.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Passo_dello_Stelvio.jpg/1200px-Passo_dello_Stelvio.jpg"
      ],
      practical_info: {
        parking: "Parking à Prato allo Stelvio et Bormio",
        water_points: ["Fontaines à Trafoi", "Restaurants au sommet"],
        hazards: ["Neige possible même en été", "Descente technique avec nombreux virages"]
      }
    },
    {
      id: "col-galibier",
      name: "Col du Galibier",
      location: {
        country: "France",
        region: "Savoie/Hautes-Alpes",
        coordinates: {
          lat: 45.0639,
          lng: 6.4072
        }
      },
      statistics: {
        length: 18.1,
        elevation_gain: 1245,
        avg_gradient: 6.9,
        max_gradient: 10.1,
        start_elevation: 1527,
        summit_elevation: 2642
      },
      elevation_profile: [
        {"distance": 0, "elevation": 1527},
        {"distance": 3, "elevation": 1700},
        {"distance": 8, "elevation": 2000},
        {"distance": 13, "elevation": 2300},
        {"distance": 18.1, "elevation": 2642}
      ],
      history: {
        tour_appearances: 60,
        first_appearance: 1911,
        notable_events: [
          "Premier franchissement dans le Tour de France en 1911",
          "Souvent couplé avec le Col du Télégraphe pour former une ascension redoutable",
          "Monument à Henri Desgrange au sommet"
        ],
        records: {
          ascent: "41:30 par Marco Pantani en 1998 (depuis le Col du Télégraphe)"
        }
      },
      difficulty: 5,
      recommended_season: ["juin", "juillet", "août", "début septembre"],
      images: [
        "https://www.climbbybike.com/img/Col_du_Galibier.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Col_du_Galibier_-_2010-07-10.jpg/1200px-Col_du_Galibier_-_2010-07-10.jpg"
      ],
      practical_info: {
        parking: "Parking au Col du Lautaret",
        water_points: ["Fontaine au Col du Lautaret", "Refuge du Galibier"],
        hazards: ["Col fermé l'hiver", "Conditions météo changeantes", "Tunnel à 2556m parfois fermé"]
      }
    },
    {
      id: "col-izoard",
      name: "Col d'Izoard",
      location: {
        country: "France",
        region: "Hautes-Alpes",
        coordinates: {
          lat: 44.8205,
          lng: 6.7347
        }
      },
      statistics: {
        length: 15.9,
        elevation_gain: 1105,
        avg_gradient: 7.0,
        max_gradient: 10.0,
        start_elevation: 1400,
        summit_elevation: 2361
      },
      elevation_profile: [
        {"distance": 0, "elevation": 1400},
        {"distance": 4, "elevation": 1650},
        {"distance": 8, "elevation": 1900},
        {"distance": 12, "elevation": 2150},
        {"distance": 15.9, "elevation": 2361}
      ],
      history: {
        tour_appearances: 35,
        first_appearance: 1922,
        notable_events: [
          "Passage par la Casse Déserte, paysage lunaire emblématique",
          "Théâtre des exploits de Fausto Coppi et Louison Bobet",
          "Monument à Fausto Coppi et Louison Bobet au sommet"
        ],
        records: {
          ascent: "42:20 par Warren Barguil en 2017"
        }
      },
      difficulty: 4,
      recommended_season: ["juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Col_d_Izoard.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Col_d%27Izoard_-_2011-07-18.jpg/1200px-Col_d%27Izoard_-_2011-07-18.jpg"
      ],
      practical_info: {
        parking: "Parking au sommet du col",
        water_points: ["Fontaine à Brunissard", "Refuge Napoléon au sommet"],
        hazards: ["Descente technique vers Briançon", "Vent violent possible"]
      }
    },
    {
      id: "mortirolo-pass",
      name: "Passo del Mortirolo",
      location: {
        country: "Italie",
        region: "Lombardie",
        coordinates: {
          lat: 46.2262,
          lng: 10.3039
        }
      },
      statistics: {
        length: 12.4,
        elevation_gain: 1300,
        avg_gradient: 10.5,
        max_gradient: 18.0,
        start_elevation: 550,
        summit_elevation: 1852
      },
      elevation_profile: [
        {"distance": 0, "elevation": 550},
        {"distance": 3, "elevation": 900},
        {"distance": 6, "elevation": 1200},
        {"distance": 9, "elevation": 1500},
        {"distance": 12.4, "elevation": 1852}
      ],
      history: {
        tour_appearances: 0,
        giro_appearances: 14,
        first_appearance: 1990,
        notable_events: [
          "Considéré comme l'une des ascensions les plus difficiles d'Europe",
          "Pantani y a construit sa légende au Giro d'Italia",
          "Monument à Marco Pantani à mi-ascension"
        ],
        records: {
          ascent: "42:40 par Ivan Gotti en 1999"
        }
      },
      difficulty: 5,
      recommended_season: ["mai", "juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Passo_del_Mortirolo.jpg",
        "https://www.altimetriasdecolombia.com/wp-content/uploads/2019/05/Mortirolo.jpg"
      ],
      practical_info: {
        parking: "Parking à Mazzo di Valtellina",
        water_points: ["Fontaine à Mazzo", "Fontaine à 2/3 de l'ascension"],
        hazards: ["Pente extrêmement raide", "Route étroite", "Peu d'ombre"]
      }
    },
    {
      id: "grossglockner",
      name: "Grossglockner Hochalpenstrasse",
      location: {
        country: "Autriche",
        region: "Tyrol/Carinthie",
        coordinates: {
          lat: 47.0732,
          lng: 12.8302
        }
      },
      statistics: {
        length: 21.1,
        elevation_gain: 1505,
        avg_gradient: 7.1,
        max_gradient: 12.0,
        start_elevation: 812,
        summit_elevation: 2429
      },
      elevation_profile: [
        {"distance": 0, "elevation": 812},
        {"distance": 5, "elevation": 1200},
        {"distance": 10, "elevation": 1650},
        {"distance": 15, "elevation": 2050},
        {"distance": 21.1, "elevation": 2429}
      ],
      history: {
        tour_appearances: 0,
        tour_of_austria_appearances: 8,
        first_appearance: 1971,
        notable_events: [
          "Route à péage construite entre 1930 et 1935",
          "Vue sur le plus haut sommet d'Autriche (Grossglockner, 3798m)",
          "Une des plus belles routes alpines avec 36 virages"
        ],
        records: {
          ascent: "54:05 par Giovanni Visconti en 2012"
        }
      },
      difficulty: 4,
      recommended_season: ["juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Grossglockner.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Grossglockner.jpg/1200px-Grossglockner.jpg"
      ],
      practical_info: {
        parking: "Parking à Heiligenblut et Fusch",
        water_points: ["Points d'eau aux différents parkings", "Restaurants le long de la route"],
        hazards: ["Route à péage (environ 30€)", "Fermée d'octobre à mai", "Trafic touristique important"]
      }
    },
    {
      id: "angliru",
      name: "Alto de l'Angliru",
      location: {
        country: "Espagne",
        region: "Asturies",
        coordinates: {
          lat: 43.2261,
          lng: -5.9736
        }
      },
      statistics: {
        length: 12.5,
        elevation_gain: 1266,
        avg_gradient: 10.13,
        max_gradient: 23.5,
        start_elevation: 380,
        summit_elevation: 1570
      },
      elevation_profile: [
        {"distance": 0, "elevation": 380},
        {"distance": 3, "elevation": 600},
        {"distance": 6, "elevation": 850},
        {"distance": 9, "elevation": 1150},
        {"distance": 12.5, "elevation": 1570}
      ],
      history: {
        tour_appearances: 0,
        vuelta_appearances: 8,
        first_appearance: 1999,
        notable_events: [
          "Considéré comme l'ascension la plus difficile d'Espagne",
          "Le coureur José Maria Jimenez remporte la première ascension en 1999",
          "En 2002, David Millar s'arrête avant la ligne d'arrivée en signe de protestation contre la difficulté"
        ],
        records: {
          ascent: "41:08 par Roberto Heras en 2000"
        }
      },
      difficulty: 5,
      recommended_season: ["mai", "juin", "septembre", "octobre"],
      images: [
        "https://www.climbbybike.com/img/Alto_de_L_Angliru.jpg",
        "https://www.sportbreizh.com/wp-content/uploads/2020/10/Angliru.jpg"
      ],
      practical_info: {
        parking: "Parking limité au pied de l'ascension",
        water_points: ["Fontaine à La Vega", "Pas de point d'eau dans les derniers kilomètres"],
        hazards: ["Pente extrêmement raide", "Conditions météo changeantes", "Brouillard fréquent"]
      }
    },
    {
      id: "passo-gavia",
      name: "Passo di Gavia",
      location: {
        country: "Italie",
        region: "Lombardie",
        coordinates: {
          lat: 46.3562,
          lng: 10.4940
        }
      },
      statistics: {
        length: 16.8,
        elevation_gain: 1363,
        avg_gradient: 8.1,
        max_gradient: 16.0,
        start_elevation: 1400,
        summit_elevation: 2618
      },
      elevation_profile: [
        {"distance": 0, "elevation": 1400},
        {"distance": 4, "elevation": 1700},
        {"distance": 8, "elevation": 2000},
        {"distance": 12, "elevation": 2300},
        {"distance": 16.8, "elevation": 2618}
      ],
      history: {
        tour_appearances: 0,
        giro_appearances: 17,
        first_appearance: 1960,
        notable_events: [
          "Étape mythique du Giro 1988 avec tempête de neige où Andy Hampsten a bâti sa victoire",
          "Route historique construite pendant la Première Guerre mondiale",
          "Un des plus hauts cols routiers des Alpes italiennes"
        ],
        records: {
          ascent: "45:30 par Ivan Gotti en 1999"
        }
      },
      difficulty: 5,
      recommended_season: ["juin", "juillet", "août", "début septembre"],
      images: [
        "https://www.climbbybike.com/img/Passo_di_Gavia.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Passo_di_Gavia_-_2008-09-08.jpg/1200px-Passo_di_Gavia_-_2008-09-08.jpg"
      ],
      practical_info: {
        parking: "Parking à Ponte di Legno et Santa Caterina",
        water_points: ["Refuge au sommet", "Source naturelle à mi-chemin"],
        hazards: ["Route étroite et parfois en mauvais état", "Tunnel non éclairé", "Neige possible toute l'année"]
      }
    },
    {
      id: "col-aubisque",
      name: "Col d'Aubisque",
      location: {
        country: "France",
        region: "Pyrénées-Atlantiques",
        coordinates: {
          lat: 42.9827,
          lng: -0.3360
        }
      },
      statistics: {
        length: 16.6,
        elevation_gain: 1190,
        avg_gradient: 7.2,
        max_gradient: 13.0,
        start_elevation: 705,
        summit_elevation: 1709
      },
      elevation_profile: [
        {"distance": 0, "elevation": 705},
        {"distance": 4, "elevation": 950},
        {"distance": 8, "elevation": 1200},
        {"distance": 12, "elevation": 1450},
        {"distance": 16.6, "elevation": 1709}
      ],
      history: {
        tour_appearances: 73,
        first_appearance: 1910,
        notable_events: [
          "Souvent associé au Col du Soulor dans la même étape",
          "Passage par la 'Corniche des Pyrénées' entre le Soulor et l'Aubisque, route spectaculaire",
          "Adoré par les spectateurs avec une ambiance festive"
        ],
        records: {
          ascent: "43:46 par Thibaut Pinot en 2019"
        }
      },
      difficulty: 4,
      recommended_season: ["juin", "juillet", "août", "septembre"],
      images: [
        "https://www.climbbybike.com/img/Col_d_Aubisque.jpg",
        "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Col_d%27Aubisque_-_2010-07-15.jpg/1200px-Col_d%27Aubisque_-_2010-07-15.jpg"
      ],
      practical_info: {
        parking: "Parking au sommet du col",
        water_points: ["Fontaine à Eaux-Bonnes", "Restaurant au sommet"],
        hazards: ["Brouillard subit possible", "Route parfois en mauvais état", "Tunnels courts sur la Corniche"]
      }
    }
  ]
};

// Générer le fichier JSON
const outputPath = path.join(__dirname, '../data/cols-data.json');
fs.writeFileSync(outputPath, JSON.stringify(colsData, null, 2));
console.log(`Données des cols générées dans ${outputPath}`);

// Version pour être appelé par un autre script
module.exports = colsData;
