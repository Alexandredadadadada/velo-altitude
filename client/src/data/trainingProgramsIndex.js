/**
 * Fichier d'index centralisé pour tous les programmes d'entraînement
 * Dashboard-Velo.com
 * 
 * Ce fichier rassemble tous les programmes d'entraînement disponibles dans l'application
 * et les organise en catégories cohérentes pour faciliter leur utilisation dans
 * les différents composants du module d'entraînement.
 */

// Import des différents ensembles de programmes
import { classicPrograms } from './classicPrograms';
import { endurancePrograms } from './endurancePrograms';
import { remainingTrainingPrograms } from './remainingTrainingPrograms';
import { remainingTrainingPrograms2 } from './remainingTrainingPrograms2';
import { remainingTrainingPrograms3 } from './remainingTrainingPrograms3';
import { specialTrainingPrograms } from './specialTrainingPrograms';
import { specialTrainingPrograms2 } from './specialTrainingPrograms2';
import { specialTrainingPrograms3 } from './specialTrainingPrograms3';

/**
 * Organisation des programmes par catégories principales
 */
export const trainingProgramCategories = {
  classic: {
    id: 'classic',
    name: 'Programmes Classiques',
    nameEn: 'Classic Programs',
    nameDe: 'Klassische Programme',
    description: 'Programmes d\'entraînement traditionnels adaptés à différents niveaux et objectifs',
    programs: classicPrograms
  },
  
  endurance: {
    id: 'endurance',
    name: 'Programmes d\'Endurance',
    nameEn: 'Endurance Programs',
    nameDe: 'Ausdauerprogramme',
    description: 'Programmes spécialisés pour développer l\'endurance et préparer les longues distances',
    programs: endurancePrograms
  },
  
  europeanCols: {
    id: 'europeanCols',
    name: 'Programmes Spécial Cols Européens',
    nameEn: 'European Mountain Pass Programs',
    nameDe: 'Europäische Bergpassprogramme',
    description: 'Programmes spécifiquement conçus pour préparer aux défis des cols européens',
    programs: [
      ...remainingTrainingPrograms,
      ...remainingTrainingPrograms2,
      ...remainingTrainingPrograms3
    ]
  },
  
  specialized: {
    id: 'specialized',
    name: 'Programmes Spécialisés',
    nameEn: 'Specialized Programs',
    nameDe: 'Spezialisierte Programme',
    description: 'Programmes répondant à des besoins et objectifs spécifiques',
    programs: [
      ...specialTrainingPrograms,  // FemmeVelo
      ...specialTrainingPrograms2, // Perte de poids
      ...specialTrainingPrograms3  // HIIT
    ]
  }
};

/**
 * Organisation des programmes par objectifs
 */
export const trainingProgramObjectives = {
  performance: {
    id: 'performance',
    name: 'Performance',
    description: 'Programmes axés sur l\'amélioration des performances cyclistes',
    programs: getAllProgramsByTag('performance')
  },
  endurance: {
    id: 'endurance',
    name: 'Endurance',
    description: 'Programmes axés sur le développement de l\'endurance',
    programs: getAllProgramsByTag('endurance')
  },
  weightLoss: {
    id: 'weightLoss',
    name: 'Perte de Poids',
    nameEn: 'Weight Loss',
    nameDe: 'Gewichtsverlust',
    description: 'Programmes optimisés pour la perte de poids et l\'amélioration de la composition corporelle',
    programs: getAllProgramsByTag('weight-loss')
  },
  mountain: {
    id: 'mountain',
    name: 'Montagne',
    nameEn: 'Mountain',
    nameDe: 'Berg',
    description: 'Programmes spécifiques pour les défis de montagne',
    programs: getAllProgramsByTag('mountain')
  },
  timeEfficient: {
    id: 'timeEfficient',
    name: 'Efficacité Temporelle',
    nameEn: 'Time Efficient',
    nameDe: 'Zeiteffizient',
    description: 'Programmes conçus pour maximiser les gains en temps minimal',
    programs: getAllProgramsByTag('time-efficient')
  },
  beginner: {
    id: 'beginner',
    name: 'Débutants',
    nameEn: 'Beginners',
    nameDe: 'Anfänger',
    description: 'Programmes adaptés aux cyclistes débutants',
    programs: getAllProgramsByTag('beginner')
  }
};

// Fonction utilitaire pour extraire les programmes par tag
function getAllProgramsByTag(tag) {
  // La liste complète de tous les programmes
  const allPrograms = [
    ...classicPrograms,
    ...endurancePrograms,
    ...remainingTrainingPrograms,
    ...remainingTrainingPrograms2,
    ...remainingTrainingPrograms3,
    ...specialTrainingPrograms,
    ...specialTrainingPrograms2,
    ...specialTrainingPrograms3
  ];
  
  // Attribution des tags aux programmes qui n'en ont pas explicitement
  const taggedPrograms = allPrograms.map(program => {
    // Si le programme a déjà des tags, on les utilise
    if (program.tags) return program;
    
    // Sinon, on attribue des tags automatiquement basés sur le contenu
    const autoTags = [];
    
    // Tags basés sur le niveau
    if (program.level) {
      const levelLower = program.level.toLowerCase();
      if (levelLower.includes('débutant')) autoTags.push('beginner');
      if (levelLower.includes('avancé') || levelLower.includes('expert')) autoTags.push('advanced');
    }
    
    // Tags basés sur le titre et la description
    const titleAndDesc = (program.title + ' ' + program.description).toLowerCase();
    
    if (titleAndDesc.includes('endurance') || titleAndDesc.includes('longue distance')) autoTags.push('endurance');
    if (titleAndDesc.includes('ftp') || titleAndDesc.includes('performance') || titleAndDesc.includes('puissance')) autoTags.push('performance');
    if (titleAndDesc.includes('perte de poids') || titleAndDesc.includes('weight loss')) autoTags.push('weight-loss');
    if (titleAndDesc.includes('col') || titleAndDesc.includes('montagne') || titleAndDesc.includes('montée')) autoTags.push('mountain');
    if (titleAndDesc.includes('hiit') || titleAndDesc.includes('court') || titleAndDesc.includes('intense')) autoTags.push('time-efficient');
    if (titleAndDesc.includes('femme') || titleAndDesc.includes('women')) autoTags.push('women');
    
    return {
      ...program,
      tags: autoTags
    };
  });
  
  // Filtrer les programmes qui ont le tag demandé
  return taggedPrograms.filter(program => 
    program.tags && program.tags.includes(tag)
  );
}

/**
 * Liste complète de tous les programmes d'entraînement
 */
export const allTrainingPrograms = [
  ...classicPrograms,
  ...endurancePrograms,
  ...remainingTrainingPrograms,
  ...remainingTrainingPrograms2,
  ...remainingTrainingPrograms3,
  ...specialTrainingPrograms,
  ...specialTrainingPrograms2,
  ...specialTrainingPrograms3
];

/**
 * Fonction pour rechercher un programme par ID
 */
export function findProgramById(programId) {
  return allTrainingPrograms.find(program => program.id === programId);
}

/**
 * Fonction pour rechercher des programmes par mot-clé
 */
export function searchPrograms(keyword) {
  if (!keyword || keyword.trim() === '') return allTrainingPrograms;
  
  const searchTerm = keyword.toLowerCase().trim();
  
  return allTrainingPrograms.filter(program => {
    const title = (program.title || '').toLowerCase();
    const titleEn = (program.titleEn || '').toLowerCase();
    const titleDe = (program.titleDe || '').toLowerCase();
    const description = (program.description || '').toLowerCase();
    const level = (program.level || '').toLowerCase();
    
    return (
      title.includes(searchTerm) ||
      titleEn.includes(searchTerm) ||
      titleDe.includes(searchTerm) ||
      description.includes(searchTerm) ||
      level.includes(searchTerm) ||
      (program.tags && program.tags.some(tag => tag.includes(searchTerm)))
    );
  });
}

/**
 * Fonction pour obtenir des programmes recommandés basés sur le profil utilisateur
 */
export function getRecommendedPrograms(userProfile, count = 3) {
  // Ici, une logique de recommandation complexe pourrait être implémentée
  // Pour l'instant, une logique simple basée sur le niveau et les objectifs
  
  // Convertir le niveau utilisateur en tag
  let levelTag = 'intermediate'; // Par défaut
  if (userProfile.level === 'beginner') levelTag = 'beginner';
  if (userProfile.level === 'advanced' || userProfile.level === 'expert') levelTag = 'advanced';
  
  // Filtrer par niveau et objectifs
  const filteredPrograms = allTrainingPrograms.filter(program => {
    // Si le programme a des tags explicites
    if (program.tags) {
      return (
        program.tags.includes(levelTag) || 
        (userProfile.objectives && userProfile.objectives.some(obj => program.tags.includes(obj)))
      );
    }
    
    // Sinon, utiliser le niveau déclaré
    const programLevel = (program.level || '').toLowerCase();
    const matchesLevel = 
      (levelTag === 'beginner' && programLevel.includes('débutant')) ||
      (levelTag === 'intermediate' && programLevel.includes('intermédiaire')) ||
      (levelTag === 'advanced' && (programLevel.includes('avancé') || programLevel.includes('expert')));
    
    return matchesLevel;
  });
  
  // Trier par pertinence (simple pour l'instant, à améliorer)
  // et retourner le nombre demandé
  return filteredPrograms
    .sort(() => 0.5 - Math.random()) // Tri aléatoire pour l'instant
    .slice(0, count);
}

export default {
  categories: trainingProgramCategories,
  objectives: trainingProgramObjectives,
  allPrograms: allTrainingPrograms,
  findById: findProgramById,
  search: searchPrograms,
  recommend: getRecommendedPrograms
};
