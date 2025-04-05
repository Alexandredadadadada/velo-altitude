import { useState, useEffect, useMemo } from 'react';

/**
 * Hook personnalisé pour gérer les zones d'entraînement en fonction du niveau d'expérience
 * 
 * @param {string} experience - Niveau d'expérience (beginner, intermediate, advanced)
 * @returns {Object} Zones d'entraînement
 */
const useTrainingZones = (experience) => {
  // Zones d'entraînement par défaut (niveau intermédiaire)
  const [zones, setZones] = useState({
    z1: { min: 0, max: 55 },
    z2: { min: 56, max: 75 },
    z3: { min: 76, max: 85 },
    z4: { min: 86, max: 95 },
    z5: { min: 96, max: 105 },
    z6: { min: 106, max: 150 }
  });

  // Définition des zones selon le niveau d'expérience
  const zonesByLevel = useMemo(() => ({
    beginner: {
      z1: { min: 0, max: 60 },
      z2: { min: 61, max: 75 },
      z3: { min: 76, max: 85 },
      z4: { min: 86, max: 95 },
      z5: { min: 96, max: 105 },
      z6: { min: 106, max: 120 }
    },
    intermediate: {
      z1: { min: 0, max: 55 },
      z2: { min: 56, max: 75 },
      z3: { min: 76, max: 90 },
      z4: { min: 91, max: 105 },
      z5: { min: 106, max: 120 },
      z6: { min: 121, max: 150 }
    },
    advanced: {
      z1: { min: 0, max: 55 },
      z2: { min: 56, max: 75 },
      z3: { min: 76, max: 90 },
      z4: { min: 91, max: 105 },
      z5: { min: 106, max: 130 },
      z6: { min: 131, max: 170 }
    }
  }), []);

  // Mettre à jour les zones en fonction du niveau d'expérience
  useEffect(() => {
    if (zonesByLevel[experience]) {
      setZones(zonesByLevel[experience]);
    }
  }, [experience, zonesByLevel]);

  return zones;
};

export default useTrainingZones;
