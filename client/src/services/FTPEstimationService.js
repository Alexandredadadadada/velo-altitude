/**
 * Service de calcul et d'estimation de la FTP (Functional Threshold Power)
 * Offre diverses méthodes pour estimer la FTP d'un cycliste basées sur
 * différents paramètres physiologiques et tests de performance
 * 
 * Références scientifiques:
 * - Allen, H., & Coggan, A. (2019). Training and Racing with a Power Meter. VeloPress.
 * - Coggan, A. R. (2018). Power Profiling. TrainingPeaks Blog.
 * - Pinot, J., & Grappe, F. (2011). The record power profile to assess performance in elite cyclists.
 */

/**
 * Estime la FTP basée sur le poids et le niveau du cycliste
 * @param {number} weight - Poids en kg
 * @param {string} level - Niveau du cycliste (beginner, intermediate, advanced, elite)
 * @returns {number} FTP estimée en watts
 */
export const estimateFTPFromWeight = (weight, level = 'intermediate') => {
  if (!weight || typeof weight !== 'number' || weight <= 0 || isNaN(weight)) {
    console.warn('Poids invalide pour l\'estimation FTP', { weight });
    return null;
  }

  // Coefficients watts/kg basés sur les données de Coggan & Allen (2019)
  // Ces valeurs sont des moyennes empiriques observées chez des cyclistes de différents niveaux
  const ftpMultipliers = {
    beginner: { min: 1.5, avg: 2.0, max: 2.5 },       // Débutant (< 1 an d'entraînement structuré)
    intermediate: { min: 2.5, avg: 3.0, max: 3.5 },   // Intermédiaire (1-3 ans d'entraînement)
    advanced: { min: 3.5, avg: 4.0, max: 4.5 },       // Avancé (> 3 ans d'entraînement régulier)
    elite: { min: 4.5, avg: 5.2, max: 6.0 }           // Élite (niveau national/international)
  };

  // Utiliser le niveau demandé ou par défaut intermediate
  const multiplier = ftpMultipliers[level] || ftpMultipliers.intermediate;
  
  // Utiliser la valeur moyenne pour le calcul
  return Math.round(weight * multiplier.avg);
};

/**
 * Estime la FTP à partir d'un test de 20 minutes
 * @param {number} power20min - Puissance moyenne sur un test de 20 minutes (watts)
 * @returns {number} FTP estimée en watts
 * 
 * Référence: La FTP est généralement environ 95% de la puissance maximale sur 20 minutes
 * (Allen & Coggan, 2019)
 */
export const estimateFTPFrom20MinTest = (power20min) => {
  if (!power20min || typeof power20min !== 'number' || power20min <= 0 || isNaN(power20min)) {
    console.warn('Puissance 20min invalide pour l\'estimation FTP', { power20min });
    return null;
  }
  
  // Facteur généralement accepté: 95% de la puissance moyenne sur 20min
  return Math.round(power20min * 0.95);
};

/**
 * Estime la FTP à partir d'un test de 8 minutes (avec facteur ajustable)
 * @param {number} power8min - Puissance moyenne sur un test de 8 minutes (watts)
 * @param {number} factor - Facteur d'ajustement (par défaut 0.9)
 * @returns {number} FTP estimée en watts
 * 
 * Référence: La FTP est généralement environ 90% de la puissance maximale sur 8 minutes
 * (Allen & Coggan, 2019)
 */
export const estimateFTPFrom8MinTest = (power8min, factor = 0.9) => {
  if (!power8min || typeof power8min !== 'number' || power8min <= 0 || isNaN(power8min)) {
    console.warn('Puissance 8min invalide pour l\'estimation FTP', { power8min });
    return null;
  }
  
  // Validation du facteur
  if (typeof factor !== 'number' || factor <= 0 || factor >= 1 || isNaN(factor)) {
    console.warn('Facteur invalide pour l\'estimation FTP', { factor });
    factor = 0.9; // Valeur par défaut de sécurité
  }
  
  return Math.round(power8min * factor);
};

/**
 * Estime la FTP à partir d'un test de 5 minutes (avec facteur ajustable)
 * @param {number} power5min - Puissance moyenne sur un test de 5 minutes (watts)
 * @param {number} factor - Facteur d'ajustement (par défaut 0.85)
 * @returns {number} FTP estimée en watts
 * 
 * Référence: La FTP est généralement environ 85% de la puissance maximale sur 5 minutes
 * (Adaptation des recherches d'Allen & Coggan)
 */
export const estimateFTPFrom5MinTest = (power5min, factor = 0.85) => {
  if (!power5min || typeof power5min !== 'number' || power5min <= 0 || isNaN(power5min)) {
    console.warn('Puissance 5min invalide pour l\'estimation FTP', { power5min });
    return null;
  }
  
  // Validation du facteur
  if (typeof factor !== 'number' || factor <= 0 || factor >= 1 || isNaN(factor)) {
    console.warn('Facteur invalide pour l\'estimation FTP', { factor });
    factor = 0.85; // Valeur par défaut de sécurité
  }
  
  return Math.round(power5min * factor);
};

/**
 * Calcule la puissance critique (CP) à partir des tests de 5min et 1min
 * @param {number} power5min - Puissance moyenne sur 5 minutes (watts)
 * @param {number} power1min - Puissance moyenne sur 1 minute (watts)
 * @returns {Object} CP et AWC (Anaerobic Work Capacity)
 * 
 * Référence: Modèle à 2 paramètres de Monod & Scherrer (1965)
 * P = AWC/t + CP
 * où P est la puissance maintenue pendant un temps t,
 * AWC est la capacité de travail anaérobie, et CP est la puissance critique
 */
export const calculateCP = (power5min, power1min) => {
  if (!power5min || !power1min || 
      typeof power5min !== 'number' || typeof power1min !== 'number' || 
      power5min <= 0 || power1min <= 0 || 
      isNaN(power5min) || isNaN(power1min)) {
    console.warn('Puissances invalides pour le calcul CP', { power5min, power1min });
    return null;
  }
  
  const t5 = 5 * 60; // 5 minutes en secondes
  const t1 = 60;     // 1 minute en secondes
  
  // Résoudre pour CP (puissance critique)
  const cp = (power5min * t5 - power1min * t1) / (t5 - t1);
  
  // Calculer AWC (capacité de travail anaérobie)
  const awc = (power1min - cp) * t1;
  
  return {
    cp: Math.round(cp),
    awc: Math.round(awc)
  };
};

/**
 * Estime la FTP à partir d'un test de 1 minute (facteur direct)
 * @param {number} power1min - Puissance moyenne sur un test de 1 minute (watts)
 * @param {number} factor - Facteur d'ajustement (par défaut 0.75)
 * @returns {number} FTP estimée en watts
 * 
 * Note: Cette méthode est moins précise que les autres et devrait être utilisée
 * uniquement quand d'autres données ne sont pas disponibles
 */
export const estimateFTPFrom1MinTest = (power1min, factor = 0.75) => {
  if (!power1min || typeof power1min !== 'number' || power1min <= 0 || isNaN(power1min)) {
    console.warn('Puissance 1min invalide pour l\'estimation FTP', { power1min });
    return null;
  }
  
  // Validation du facteur
  if (typeof factor !== 'number' || factor <= 0 || factor >= 1 || isNaN(factor)) {
    console.warn('Facteur invalide pour l\'estimation FTP', { factor });
    factor = 0.75; // Valeur par défaut de sécurité
  }
  
  return Math.round(power1min * factor);
};

/**
 * Estime la FTP à partir de la puissance critique (modèle à 2 paramètres)
 * @param {number} cp - Puissance critique (W)
 * @returns {number} FTP estimée en watts
 * 
 * Référence: La FTP est généralement environ 97% de la CP (Moritani et al., 1981)
 */
export const estimateFTPFromCP = (cp) => {
  if (!cp || typeof cp !== 'number' || cp <= 0 || isNaN(cp)) {
    console.warn('Puissance critique invalide pour l\'estimation FTP', { cp });
    return null;
  }
  
  // FTP est typiquement légèrement inférieure à CP
  return Math.round(cp * 0.97);
};

/**
 * Estime la FTP à partir d'un test Ramp
 * @param {number} maxPower - Puissance maximale atteinte dans le test Ramp (watts)
 * @param {number} factor - Facteur d'ajustement (par défaut 0.75)
 * @returns {number} FTP estimée en watts
 * 
 * Référence: Protocole utilisé par Zwift et TrainerRoad
 */
export const estimateFTPFromRampTest = (maxPower, factor = 0.75) => {
  if (!maxPower || typeof maxPower !== 'number' || maxPower <= 0 || isNaN(maxPower)) {
    console.warn('Puissance maximale du test Ramp invalide', { maxPower });
    return null;
  }
  
  // Validation du facteur
  if (typeof factor !== 'number' || factor <= 0 || factor >= 1 || isNaN(factor)) {
    console.warn('Facteur invalide pour l\'estimation FTP', { factor });
    factor = 0.75; // Valeur par défaut de sécurité
  }
  
  // La FTP est généralement environ 75% de la puissance maximale du test Ramp
  return Math.round(maxPower * factor);
};

/**
 * Estime la FTP à partir de données de fréquence cardiaque
 * @param {Object} params - Paramètres cardiaques et physiologiques
 * @returns {number} FTP estimée en watts
 * 
 * Référence: Adaptation des recherches de Lamberts et al. (2011)
 */
export const estimateFTPFromHR = (params) => {
  const { maxHR, restingHR, ltHR, weight, vo2max } = params;
  
  // Vérifier si nous avons les données minimales requises
  if (!maxHR || !restingHR || !weight || 
      typeof maxHR !== 'number' || typeof restingHR !== 'number' || typeof weight !== 'number' ||
      maxHR <= restingHR || weight <= 0) {
    console.warn('Paramètres cardiaques invalides', params);
    return null;
  }
  
  let estimatedFTP = null;
  
  // Si nous avons la FC au seuil lactique
  if (ltHR && typeof ltHR === 'number' && ltHR > restingHR && ltHR < maxHR) {
    // Calcul du % de FC max
    const percentOfMax = ltHR / maxHR;
    
    // Estimation watts/kg basée sur le niveau de forme (lié au % FC max au seuil)
    let ftpPerKg;
    
    if (percentOfMax > 0.92) ftpPerKg = 4.5;      // Très entraîné
    else if (percentOfMax > 0.89) ftpPerKg = 4.0; // Bien entraîné
    else if (percentOfMax > 0.85) ftpPerKg = 3.5; // Entraîné
    else if (percentOfMax > 0.82) ftpPerKg = 3.0; // Modérément entraîné
    else ftpPerKg = 2.5;                          // Moins entraîné
    
    estimatedFTP = Math.round(ftpPerKg * weight);
  }
  // Si nous avons une estimation du VO2max
  else if (vo2max && typeof vo2max === 'number' && vo2max > 20) {
    // Conversion VO2max en watts/kg (d'après Hawley & Noakes, 1992)
    // FTP correspond généralement à ~70-75% du VO2max
    estimatedFTP = Math.round((vo2max * 0.75) * weight * 0.0123);
  }
  // Sinon, utiliser la réserve cardiaque (approche de Karvonen)
  else {
    const hrReserve = maxHR - restingHR;
    // Estimer LTHR à 85-89% de la réserve cardiaque
    const estimatedLTHR = restingHR + (hrReserve * 0.87);
    const percentOfMax = estimatedLTHR / maxHR;
    
    // Même logique que ci-dessus pour estimer watts/kg
    let ftpPerKg;
    
    if (percentOfMax > 0.92) ftpPerKg = 4.5;      // Très entraîné
    else if (percentOfMax > 0.89) ftpPerKg = 4.0; // Bien entraîné
    else if (percentOfMax > 0.85) ftpPerKg = 3.5; // Entraîné
    else if (percentOfMax > 0.82) ftpPerKg = 3.0; // Modérément entraîné
    else ftpPerKg = 2.5;                          // Moins entraîné
    
    estimatedFTP = Math.round(ftpPerKg * weight);
  }
  
  return estimatedFTP;
};

/**
 * Valide et normalise une valeur FTP
 * @param {number} ftp - La valeur FTP à valider
 * @param {Object} profile - Le profil utilisateur pour l'estimation en cas de valeur invalide
 * @returns {number} FTP validée ou estimée
 */
export const validateFTP = (ftp, profile = {}) => {
  if (ftp && typeof ftp === 'number' && ftp > 0 && !isNaN(ftp)) {
    // FTP valide, vérifier si elle est dans une plage raisonnable
    if (ftp < 50) {
      console.warn('FTP anormalement basse:', ftp);
      // Si le profil a un poids, essayer d'estimer une valeur plus réaliste
      if (profile.weight) {
        return estimateFTPFromWeight(profile.weight, profile.level);
      }
      return 100; // Valeur minimale par défaut
    }
    
    if (ftp > 500) {
      console.warn('FTP potentiellement très élevée:', ftp);
      // Ne pas corriger automatiquement les valeurs élevées, certains cyclistes peuvent avoir des FTP élevées
    }
    
    return ftp; // Valeur valide
  }
  
  // FTP invalide, essayer d'estimer à partir du profil
  console.warn('FTP invalide, tentative d\'estimation à partir du profil', { ftp });
  
  if (profile.weight && typeof profile.weight === 'number' && profile.weight > 0) {
    const estimatedFTP = estimateFTPFromWeight(profile.weight, profile.level);
    console.info(`FTP estimée à partir du poids (${profile.weight}kg): ${estimatedFTP}W`);
    return estimatedFTP;
  }
  
  // Valeurs par défaut basées sur le niveau
  const defaultFTP = {
    beginner: 150,
    intermediate: 200,
    advanced: 250,
    elite: 300
  }[profile.level] || 200;
  
  console.info(`FTP par défaut utilisée: ${defaultFTP}W`);
  return defaultFTP;
};

/**
 * Calcule les zones de puissance basées sur la FTP
 * @param {number} ftp - Valeur FTP en watts
 * @returns {Object} Zones de puissance
 * 
 * Référence: Zones d'entraînement définies par Allen & Coggan (2019)
 */
export const calculatePowerZones = (ftp) => {
  if (!ftp || typeof ftp !== 'number' || ftp <= 0 || isNaN(ftp)) {
    console.warn('FTP invalide pour le calcul des zones', { ftp });
    ftp = 200; // Valeur par défaut sécurisée
  }
  
  return {
    zone1: {
      name: 'Récupération Active',
      description: 'Très facile, récupération active',
      min: Math.round(ftp * 0.0),
      max: Math.round(ftp * 0.55),
      percentFtp: '0-55%'
    },
    zone2: {
      name: 'Endurance',
      description: 'Effort soutenu longue durée, conversation possible',
      min: Math.round(ftp * 0.56),
      max: Math.round(ftp * 0.75),
      percentFtp: '56-75%'
    },
    zone3: {
      name: 'Tempo',
      description: 'Rythme soutenu mais confortable, respiration plus intense',
      min: Math.round(ftp * 0.76),
      max: Math.round(ftp * 0.9),
      percentFtp: '76-90%'
    },
    zone4: {
      name: 'Seuil',
      description: 'Effort intense au niveau du seuil lactique, 20-30min max',
      min: Math.round(ftp * 0.91),
      max: Math.round(ftp * 1.05),
      percentFtp: '91-105%'
    },
    zone5: {
      name: 'VO2max',
      description: 'Effort très intense, 3-8min par intervalle',
      min: Math.round(ftp * 1.06),
      max: Math.round(ftp * 1.2),
      percentFtp: '106-120%'
    },
    zone6: {
      name: 'Capacité Anaérobie',
      description: 'Effort anaérobie maximal, 30s-3min par intervalle',
      min: Math.round(ftp * 1.21),
      max: Math.round(ftp * 1.5),
      percentFtp: '121-150%'
    },
    zone7: {
      name: 'Sprint/Neuromuscular',
      description: 'Puissance maximale, efforts <30s',
      min: Math.round(ftp * 1.51),
      max: Infinity,
      percentFtp: '>150%'
    }
  };
};

/**
 * Calculer les zones cardiaques basées sur la fréquence cardiaque maximale
 * @param {number} maxHR - Fréquence cardiaque maximale (bpm)
 * @param {number} restingHR - Fréquence cardiaque au repos (bpm)
 * @returns {Object} Zones cardiaques
 * 
 * Référence: Zones de Karvonen basées sur la réserve cardiaque (FCmax-FCrepos)
 */
export const calculateHeartRateZones = (maxHR, restingHR) => {
  if (!maxHR || !restingHR || 
      typeof maxHR !== 'number' || typeof restingHR !== 'number' || 
      maxHR <= restingHR || 
      isNaN(maxHR) || isNaN(restingHR)) {
    console.warn('Fréquences cardiaques invalides', { maxHR, restingHR });
    return null;
  }
  
  const hrReserve = maxHR - restingHR;
  
  return {
    zone1: {
      name: 'Récupération',
      min: Math.round(restingHR + (hrReserve * 0.5)),
      max: Math.round(restingHR + (hrReserve * 0.6)),
      percentHRR: '50-60%'
    },
    zone2: {
      name: 'Endurance de base',
      min: Math.round(restingHR + (hrReserve * 0.6) + 1),
      max: Math.round(restingHR + (hrReserve * 0.7)),
      percentHRR: '60-70%'
    },
    zone3: {
      name: 'Endurance avancée',
      min: Math.round(restingHR + (hrReserve * 0.7) + 1),
      max: Math.round(restingHR + (hrReserve * 0.8)),
      percentHRR: '70-80%'
    },
    zone4: {
      name: 'Seuil',
      min: Math.round(restingHR + (hrReserve * 0.8) + 1),
      max: Math.round(restingHR + (hrReserve * 0.9)),
      percentHRR: '80-90%'
    },
    zone5: {
      name: 'VO2max',
      min: Math.round(restingHR + (hrReserve * 0.9) + 1),
      max: maxHR,
      percentHRR: '90-100%'
    }
  };
};

export default {
  estimateFTPFromWeight,
  estimateFTPFrom20MinTest,
  estimateFTPFrom8MinTest,
  estimateFTPFrom5MinTest,
  estimateFTPFrom1MinTest,
  calculateCP,
  estimateFTPFromCP,
  estimateFTPFromRampTest,
  estimateFTPFromHR,
  validateFTP,
  calculatePowerZones,
  calculateHeartRateZones
};
