/**
 * Service pour la gestion des défis "Les 7 Majeurs"
 * 
 * Ce service gère la création, validation et soumission des défis "Les 7 Majeurs"
 * avec une gestion d'erreur robuste et des validations de données.
 */

import apiClient from '../../api/apiClient';
import { Challenge, SevenMajorsChallenge } from '../../types/challenges';

/**
 * Valide les données d'un défi avant soumission
 * @param challenge Les données du défi à valider
 * @returns boolean indiquant si les données sont valides
 */
export const validateChallengeData = (challenge: SevenMajorsChallenge): boolean => {
  // Vérification des propriétés obligatoires
  if (!challenge.name || typeof challenge.name !== 'string' || challenge.name.trim() === '') {
    console.error('Validation: Nom du défi invalide');
    return false;
  }

  // Vérification de la présence des cols (doit en avoir exactement 7)
  if (!challenge.cols || !Array.isArray(challenge.cols) || challenge.cols.length !== 7) {
    console.error('Validation: Un défi "Les 7 Majeurs" doit contenir exactement 7 cols');
    return false;
  }

  // Vérification que les cols ont des ID valides
  const hasInvalidCol = challenge.cols.some(col => !col.id || typeof col.id !== 'string');
  if (hasInvalidCol) {
    console.error('Validation: ID de col invalide détecté');
    return false;
  }

  // Vérification de l'unicité des cols
  const colIds = challenge.cols.map(col => col.id);
  const uniqueColIds = new Set(colIds);
  if (uniqueColIds.size !== colIds.length) {
    console.error('Validation: Des cols dupliqués ont été détectés');
    return false;
  }

  // Vérification optionnelle des champs supplémentaires
  if (challenge.description && typeof challenge.description !== 'string') {
    console.error('Validation: Description de défi invalide');
    return false;
  }

  return true;
};

/**
 * Crée un nouveau défi "Les 7 Majeurs"
 * @param challenge Les données du défi à créer
 * @returns Les données du défi créé incluant l'ID
 */
export const createChallenge = async (challenge: SevenMajorsChallenge) => {
  try {
    // Valider les données du défi avant soumission
    if (!validateChallengeData(challenge)) {
      throw new Error('Invalid challenge data');
    }
    
    // Utilisation du chemin d'API correct
    const response = await apiClient.post('/challenges/create', challenge);
    
    // Gestion appropriée des erreurs
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create challenge');
    }
    
    return response.data;
  } catch (error) {
    console.error('Challenge creation failed:', error);
    throw error;
  }
};

/**
 * Récupère un défi "Les 7 Majeurs" par son ID
 * @param challengeId L'ID du défi à récupérer
 * @returns Les données du défi
 */
export const getChallengeById = async (challengeId: string) => {
  try {
    const response = await apiClient.get(`/challenges/${challengeId}`);
    return response.data;
  } catch (error) {
    console.error(`Error retrieving challenge ${challengeId}:`, error);
    throw error;
  }
};

/**
 * Met à jour un défi "Les 7 Majeurs" existant
 * @param challengeId L'ID du défi à mettre à jour
 * @param challengeData Les nouvelles données du défi
 * @returns Les données du défi mises à jour
 */
export const updateChallenge = async (challengeId: string, challengeData: Partial<SevenMajorsChallenge>) => {
  try {
    // Récupérer d'abord le défi existant
    const currentChallenge = await getChallengeById(challengeId);
    
    // Fusionner avec les nouvelles données
    const updatedChallenge = {
      ...currentChallenge,
      ...challengeData
    };
    
    // Valider les données fusionnées
    if (!validateChallengeData(updatedChallenge)) {
      throw new Error('Invalid updated challenge data');
    }
    
    // Envoyer la mise à jour
    const response = await apiClient.put(`/challenges/${challengeId}`, updatedChallenge);
    
    return response.data;
  } catch (error) {
    console.error(`Error updating challenge ${challengeId}:`, error);
    throw error;
  }
};

export default {
  validateChallengeData,
  createChallenge,
  getChallengeById,
  updateChallenge
};
