/**
 * Point d'entrée pour tous les programmes d'entraînement
 * Regroupe et exporte les différents programmes adaptés aux besoins des cyclistes
 */

import raceProgram from './raceProgram';
import granFondoProgram from './granFondoProgram';
import beginnerProgram from './beginnerProgram';

// Collecter tous les programmes dans un tableau unique
const allPrograms = [
  raceProgram,
  granFondoProgram,
  beginnerProgram
];

// Créer des mappages par ID pour faciliter les recherches
const programsById = allPrograms.reduce((acc, program) => {
  acc[program.id] = program;
  return acc;
}, {});

// Métadonnées pour les filtres de l'interface utilisateur
const programLevels = [
  { id: 'all', label: 'Tous niveaux' },
  { id: 'débutant', label: 'Débutant' },
  { id: 'intermédiaire', label: 'Intermédiaire' },
  { id: 'avancé', label: 'Avancé' }
];

const programDurations = [
  { id: 'all', label: 'Toutes durées' },
  { id: 'short', label: 'Court (4-8 semaines)', min: 4, max: 8 },
  { id: 'medium', label: 'Moyen (9-12 semaines)', min: 9, max: 12 },
  { id: 'long', label: 'Long (13+ semaines)', min: 13, max: 52 }
];

const programGoals = [
  { id: 'all', label: 'Tous objectifs' },
  { id: 'endurance', label: 'Endurance fondamentale' },
  { id: 'competition', label: 'Compétition' },
  { id: 'granfondo', label: 'Gran Fondo / Cyclosportive' },
  { id: 'climbing', label: 'Grimper / Montagne' },
  { id: 'technique', label: 'Technique / Habiletés' }
];

// Fonction utilitaire pour rechercher des programmes avec divers filtres
const searchPrograms = ({
  query = '',
  level = 'all',
  duration = 'all',
  goal = 'all'
} = {}) => {
  let filteredPrograms = [...allPrograms];
  
  // Filtrer par niveau
  if (level !== 'all') {
    filteredPrograms = filteredPrograms.filter(program => 
      program.level && program.level.includes(level)
    );
  }
  
  // Filtrer par durée
  if (duration !== 'all') {
    const selectedDuration = programDurations.find(d => d.id === duration);
    if (selectedDuration && selectedDuration.min) {
      filteredPrograms = filteredPrograms.filter(program => 
        program.duration >= selectedDuration.min && 
        program.duration <= (selectedDuration.max || Number.MAX_SAFE_INTEGER)
      );
    }
  }
  
  // Filtrer par objectif (à adapter selon la structure exacte des données)
  if (goal !== 'all') {
    filteredPrograms = filteredPrograms.filter(program => {
      // Logique basée sur l'objectif - adapté à votre structure de données
      if (goal === 'competition' && program.id.includes('race')) {
        return true;
      }
      if (goal === 'granfondo' && program.id.includes('fondo')) {
        return true;
      }
      if (goal === 'endurance' && (program.id.includes('beginner') || program.phases.some(p => p.focus.toLowerCase().includes('endurance')))) {
        return true;
      }
      if (goal === 'climbing' && program.phases.some(p => p.focus.toLowerCase().includes('mont') || p.focus.toLowerCase().includes('grim'))) {
        return true;
      }
      if (goal === 'technique' && program.phases.some(p => p.focus.toLowerCase().includes('technique'))) {
        return true;
      }
      return false;
    });
  }
  
  // Recherche textuelle
  if (query && query.trim() !== '') {
    const searchTerms = query.toLowerCase().trim().split(/\s+/);
    filteredPrograms = filteredPrograms.filter(program => 
      searchTerms.every(term => 
        program.name.toLowerCase().includes(term) || 
        program.description.toLowerCase().includes(term) ||
        (program.goals && program.goals.some(goal => 
          goal.toLowerCase().includes(term)
        ))
      )
    );
  }
  
  return filteredPrograms;
};

// Fonction utilitaire pour calculer les zones d'entraînement basées sur le FTP
const calculateTrainingZones = (ftp) => {
  if (!ftp || isNaN(ftp) || ftp <= 0) {
    return null;
  }
  
  return {
    zone1: { name: 'Zone 1 - Récupération active', min: Math.round(ftp * 0), max: Math.round(ftp * 0.55) },
    zone2: { name: 'Zone 2 - Endurance fondamentale', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
    zone3: { name: 'Zone 3 - Tempo / Allure', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
    zone4: { name: 'Zone 4 - Seuil', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
    zone5: { name: 'Zone 5 - VO2max', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
    zone6: { name: 'Zone 6 - Capacité anaérobie', min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
    zone7: { name: 'Zone 7 - Force neuromusculaire', min: Math.round(ftp * 1.51), max: Math.round(ftp * 2.00) }
  };
};

// Fonction pour générer un programme d'entraînement personnalisé basé sur le profil utilisateur
const generatePersonalizedProgram = (userProfile, programId) => {
  // Vérifier si le programme existe
  const baseProgram = programsById[programId];
  if (!baseProgram) {
    throw new Error(`Programme non trouvé: ${programId}`);
  }
  
  // Vérifier et valider le profil utilisateur
  if (!userProfile || !userProfile.ftp || isNaN(userProfile.ftp)) {
    throw new Error('Profil utilisateur invalide ou FTP non défini');
  }
  
  // Cloner le programme de base
  const personalizedProgram = JSON.parse(JSON.stringify(baseProgram));
  
  // Calculer les zones d'entraînement spécifiques à l'utilisateur
  const userZones = calculateTrainingZones(userProfile.ftp);
  personalizedProgram.userZones = userZones;
  
  // Adapter le programme en fonction du niveau et de l'expérience de l'utilisateur
  if (userProfile.level === 'beginner' && !baseProgram.id.includes('beginner')) {
    // Adapter pour débutant si ce n'est pas déjà un programme débutant
    personalizedProgram.adaptations.beginnerFocus = 'Ce programme a été adapté pour votre niveau débutant. Concentrez-vous sur la technique et réduisez le volume global de 20-30%.';
  }
  
  if (userProfile.age && userProfile.age > 50) {
    // Adapter pour cyclistes plus âgés
    personalizedProgram.adaptations.seniorFocus = 'Ajoutez un jour de récupération supplémentaire entre les séances intenses et privilégiez la récupération active.';
  }
  
  if (userProfile.timeAvailable && userProfile.timeAvailable < 8) {
    // Adapter pour disponibilité limitée
    personalizedProgram.adaptations.timeFocus = 'Ce programme a été adapté pour votre disponibilité limitée. Concentrez-vous sur les séances clés et réduisez les sorties optionnelles.';
  }
  
  return personalizedProgram;
};

export {
  // Collections de programmes
  allPrograms,
  raceProgram,
  granFondoProgram,
  beginnerProgram,
  programsById,
  
  // Métadonnées pour filtres
  programLevels,
  programDurations,
  programGoals,
  
  // Fonctions utilitaires
  searchPrograms,
  calculateTrainingZones,
  generatePersonalizedProgram
};
