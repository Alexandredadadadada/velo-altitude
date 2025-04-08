# Guide de Développement des Itinéraires Cyclistes - Velo-Altitude

**Date :** 5 avril 2025  
**Version :** 1.0

## Introduction

Ce document détaille le format et les exigences pour l'ajout de nouveaux itinéraires cyclistes à la plateforme Velo-Altitude. La structure suit le format JSON existant dans `server/data/cycling-routes.json`.

## Structure des données

Chaque itinéraire cycliste doit être défini en suivant ce modèle JSON :

```json
{
  "id": "route-xyz",
  "name": "Nom de l'itinéraire",
  "region": "Région géographique",
  "country": "Pays",
  "type": "route", // Options: "route", "boucle", "aller-retour"
  "difficulty": 4, // Échelle de 1 à 5
  "statistics": {
    "distance": 120.5, // en kilomètres
    "elevation_gain": 3200, // en mètres
    "estimated_duration": "8-10 heures", // format texte pour flexibilité
    "highest_point": 2115, // en mètres
    "lowest_point": 450 // en mètres
  },
  "points": {
    "start": {
      "name": "Nom du point de départ",
      "coordinates": {"lat": 45.8722, "lng": 6.0033}
    },
    "end": {
      "name": "Nom du point d'arrivée",
      "coordinates": {"lat": 45.9722, "lng": 6.1033}
    }
  },
  "gpx_track": "https://example.com/gpx/route-xyz.gpx", // URL vers le fichier GPX
  "waypoints": [
    {
      "name": "Nom du point de passage",
      "type": "col", // ou "village", "point_vue", "ravitaillement", etc.
      "elevation": 1500, // en mètres si pertinent
      "distance_from_start": 45.2, // en kilomètres
      "coordinates": {"lat": 45.9222, "lng": 6.0533},
      "notes": "Informations spécifiques à ce point"
    }
  ],
  "points_of_interest": [
    {
      "name": "Nom du point d'intérêt",
      "type": "viewpoint", // ou "historical", "natural", "cultural", etc.
      "description": "Description détaillée du point d'intérêt",
      "distance_from_start": 35.2, // en kilomètres
      "coordinates": {"lat": 45.9022, "lng": 6.0333},
      "image": "/images/routes/route-xyz/poi-name.jpg"
    }
  ],
  "services": {
    "water_points": [
      {
        "name": "Fontaine du village",
        "distance_from_start": 20.5,
        "coordinates": {"lat": 45.8822, "lng": 6.0133},
        "notes": "Eau potable disponible toute l'année"
      }
    ],
    "food": [
      {
        "name": "Restaurant du Col",
        "location": "Col du Galibier",
        "distance_from_start": 45.2,
        "type": "restaurant", // ou "café", "boulangerie", "supermarché", etc.
        "price_range": "€€",
        "bike_friendly": true,
        "opening_hours": "10h-18h (mai-octobre)",
        "coordinates": {"lat": 45.9222, "lng": 6.0533}
      }
    ],
    "bike_shops": [
      {
        "name": "Cycles Alpins",
        "location": "Saint-Jean-de-Maurienne",
        "distance_from_start": 10.5,
        "services": ["réparation", "pièces", "location"],
        "phone": "+33 4 79 XX XX XX",
        "coordinates": {"lat": 45.8822, "lng": 6.0133}
      }
    ],
    "accommodations": [
      {
        "name": "Hôtel des Cyclistes",
        "location": "Valloire",
        "type": "hotel", // ou "gîte", "camping", "refuge", etc.
        "bike_friendly": true,
        "price_range": "€€",
        "distance_from_route": 0, // en kilomètres
        "coordinates": {"lat": 45.9022, "lng": 6.0333},
        "booking_link": "https://example.com/hotel-reservation"
      }
    ]
  },
  "narrative": "Description narrative détaillée de l'itinéraire, incluant l'expérience cycliste, les paysages, les défis techniques, etc.",
  "safety_tips": [
    "Conseil de sécurité 1",
    "Conseil de sécurité 2"
  ],
  "best_seasons": ["Printemps", "Été", "Automne"],
  "terrain_types": [
    {
      "type": "route asphaltée",
      "percentage": 90
    },
    {
      "type": "piste",
      "percentage": 10
    }
  ],
  "traffic_levels": [
    {
      "section": "Saint-Jean-de-Maurienne à Valloire",
      "level": "modéré",
      "notes": "Plus fréquenté en haute saison"
    },
    {
      "section": "Valloire au Galibier",
      "level": "faible",
      "notes": "Route parfois fermée en hiver"
    }
  ],
  "difficulty_factors": {
    "physical": 4, // 1-5
    "technical": 2, // 1-5
    "traffic": 2, // 1-5
    "remoteness": 3 // 1-5
  },
  "bike_recommendations": ["vélo de route", "gravel (sections optionnelles)"],
  "profile_image": "/images/routes/route-xyz/profile.svg", // Image du profil d'élévation
  "gallery": [
    "/images/routes/route-xyz/image1.jpg",
    "/images/routes/route-xyz/image2.jpg"
  ],
  "user_ratings": {
    "average": 4.7,
    "count": 45,
    "categories": {
      "scenery": 4.9,
      "road_quality": 4.5,
      "traffic": 4.2,
      "difficulty_accuracy": 4.6
    }
  },
  "alternative_routes": [
    {
      "name": "Variante facile",
      "description": "Contourne le col le plus difficile",
      "stats": {
        "distance": 110.5,
        "elevation_gain": 2500
      },
      "gpx_track": "https://example.com/gpx/route-xyz-easy.gpx"
    }
  ],
  "created_by": "admin", // ou ID utilisateur
  "date_created": "2024-05-15T14:30:00Z",
  "last_updated": "2025-04-01T10:15:00Z",
  "tags": ["col", "alpes", "mythique", "tour-de-france"]
}
```

## Types d'itinéraires à développer

### 1. Itinéraires par région

Développer des itinéraires couvrant les principales régions cyclables d'Europe.

**Priorités :**
- Alpes françaises (Savoie, Haute-Savoie, Isère)
- Pyrénées (versants français et espagnol)
- Alpes italiennes (Dolomites, Piémont, Lombardie)
- Alpes suisses
- Massif Central
- Vosges et Jura
- Provence et Côte d'Azur
- Ardennes (Belgique et France)
- Sierra Nevada (Espagne)

### 2. Itinéraires thématiques

**Développer les itinéraires suivants :**
- Routes des Cols Légendaires du Tour de France
- Parcours des Grandes Classiques (Liège-Bastogne-Liège, Milan-San Remo, etc.)
- Itinéraires des Plus Beaux Villages
- Itinéraires Œnotouristiques (régions viticoles)
- Routes Panoramiques
- Itinéraires Historiques
- Voies Vertes et Véloroutes
- Traversées de Parcs Nationaux

### 3. Itinéraires par difficulté

- Itinéraires Découverte (faciles, adaptés aux débutants)
- Itinéraires Intermédiaires (cyclotouristes réguliers)
- Itinéraires Sportifs (cyclistes entraînés)
- Itinéraires Expert (cyclistes très expérimentés)
- Itinéraires Extrêmes (défis majeurs)

### 4. Itinéraires spécifiques

- Boucles d'une journée
- Week-ends cyclistes (2-3 jours)
- Semaines cyclistes (5-7 jours)
- Grandes traversées (multi-semaines)
- Itinéraires avec transport en commun (accessibles en train)
- Itinéraires familiaux

## Qualité des données géographiques

### Exigences pour les fichiers GPX
- Précision GPS de haute qualité (points tous les 10-50m selon le terrain)
- Élévation corrigée et lissée
- Vérification des intersections et carrefours
- Métadonnées complètes (titre, description, auteur, date)
- Format GPX 1.1 standard
- Taille optimisée (< 1MB pour performance web)

### Waypoints
- Inclure tous les cols et points de passage significatifs
- Ajouter des waypoints pour tous les services essentiels
- Marquer clairement les dangers potentiels
- Identifier les points de décision (bifurcations importantes)
- Nommer selon convention standardisée

## Critères de qualité des itinéraires

### Sécurité
- Éviter les routes à fort trafic
- Privilégier les routes avec accotements ou pistes cyclables
- Identifier clairement les sections potentiellement dangereuses
- Proposer des alternatives pour les sections à risque
- Vérifier la qualité du revêtement

### Expérience cycliste
- Équilibre entre difficulté et intérêt paysager
- Variété de terrain et d'environnement
- Points d'intérêt régulièrement espacés
- Services disponibles à intervalles raisonnables
- Considération pour l'exposition au vent et au soleil

### Logistique
- Accessibilité du point de départ en transport en commun
- Options d'hébergement adaptées aux cyclistes
- Possibilités de ravitaillement régulières
- Solutions d'urgence et points d'évacuation
- Connexion GSM/téléphone sur la majorité du parcours

## Médias requis pour chaque itinéraire

### Images
- **Photo principale** : 1920x1080px, format paysage, représentative
- **Galerie** : minimum 8 photos de haute qualité montrant:
  - Points de vue panoramiques
  - Cols et passages clés
  - Points d'intérêt culturels/naturels
  - Revêtement typique
  - Signalisation
  - Services et infrastructures cyclistes

### Profil d'élévation
- Profil SVG haute résolution
- Échelle verticale et horizontale cohérente
- Indications des pourcentages de pente
- Marquage des cols et points clés
- Version simplifiée pour mobile

### Cartographie
- Tracé GPX précis et corrigé
- Carte interactive avec points d'intérêt
- Variantes et alternatives
- Points de service (eau, nourriture, mécanique)
- Options de secours et d'évacuation

## Narrative et contenu textuel

### Structure narrative
- Introduction captivante
- Description séquentielle du parcours
- Points forts et moments clés
- Défis techniques et conseils
- Aspects culturels et historiques
- Conclusion et recommandations

### Éléments à inclure
- Histoire de la région et des cols
- Anecdotes cyclistes (faits marquants des courses)
- Description sensorielle (paysages, ambiances)
- Conseils techniques sur les sections difficiles
- Recommandations saisonnières
- Variantes et alternatives

## Liste de contrôle pour la validation

- [ ] Tracé GPX testé et parcouru physiquement
- [ ] Points d'intérêt vérifiés et géolocalisés avec précision
- [ ] Services et infrastructures vérifiés (horaires, disponibilité)
- [ ] Estimation réaliste de la durée et de la difficulté
- [ ] Photos récentes et représentatives
- [ ] Conseils de sécurité spécifiques à l'itinéraire
- [ ] Informations saisonnières à jour
- [ ] Description narrative complète et engageante
- [ ] Variantes et alternatives documentées
- [ ] Métadonnées complètes pour le référencement
