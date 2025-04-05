/**
 * Service de gestion des utilisateurs
 * Fournit des méthodes pour récupérer et mettre à jour les profils utilisateurs
 */
class UserService {
  /**
   * Récupère le profil de l'utilisateur connecté
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getCurrentUserProfile() {
    try {
      // Dans une application réelle, ceci serait un appel API
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Profil utilisateur mocké
      const mockProfile = {
        id: 'u123',
        name: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        age: 35,
        weight: 75,
        height: 182,
        ftp: 240,
        level: 'intermediate',
        cyclist_type: 'all-rounder',
        preferred_terrain: 'mixed',
        weekly_hours: 8,
        hrmax: 185,
        hrrest: 52,
        region: 'Grand Est',
        following: 24,
        followers: 18,
        achievementCount: 12,
        created_at: '2024-07-15',
        avatar: '/assets/avatars/default.jpg'
      };
      
      return mockProfile;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil utilisateur:', error);
      throw new Error('Impossible de récupérer le profil utilisateur');
    }
  }
  
  /**
   * Récupère le profil d'un utilisateur spécifique par son ID
   * @param {string} userId - Identifiant de l'utilisateur
   * @returns {Promise<Object>} Profil utilisateur
   */
  async getUserProfile(userId) {
    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Profils utilisateurs mockés
      const mockProfiles = {
        'u123': {
          id: 'u123',
          name: 'Jean Dupont',
          age: 35,
          weight: 75,
          height: 182,
          ftp: 240,
          level: 'intermediate',
          cyclist_type: 'all-rounder',
          preferred_terrain: 'mixed',
          weekly_hours: 8,
          hrmax: 185,
          hrrest: 52,
          region: 'Grand Est',
          following: 24,
          followers: 18,
          achievementCount: 12,
          created_at: '2024-07-15',
          avatar: '/assets/avatars/default.jpg'
        },
        'u456': {
          id: 'u456',
          name: 'Marie Martin',
          age: 29,
          weight: 62,
          height: 168,
          ftp: 205,
          level: 'beginner',
          cyclist_type: 'climber',
          preferred_terrain: 'hills',
          weekly_hours: 5,
          hrmax: 192,
          hrrest: 56,
          region: 'Grand Est',
          following: 32,
          followers: 15,
          achievementCount: 8,
          created_at: '2024-09-10',
          avatar: '/assets/avatars/default2.jpg'
        },
        'u789': {
          id: 'u789',
          name: 'Pierre Lambert',
          age: 42,
          weight: 82,
          height: 188,
          ftp: 280,
          level: 'advanced',
          cyclist_type: 'sprinter',
          preferred_terrain: 'flat',
          weekly_hours: 12,
          hrmax: 178,
          hrrest: 48,
          region: 'Grand Est',
          following: 56,
          followers: 124,
          achievementCount: 28,
          created_at: '2024-05-22',
          avatar: '/assets/avatars/default3.jpg'
        }
      };
      
      const profile = mockProfiles[userId];
      
      if (!profile) {
        throw new Error('Utilisateur non trouvé');
      }
      
      return profile;
    } catch (error) {
      console.error(`Erreur lors de la récupération du profil utilisateur (ID: ${userId}):`, error);
      throw new Error('Impossible de récupérer le profil utilisateur');
    }
  }
  
  /**
   * Met à jour le profil utilisateur
   * @param {Object} profileData - Données du profil à mettre à jour
   * @returns {Promise<Object>} Profil utilisateur mis à jour
   */
  async updateUserProfile(profileData) {
    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Validation des données
      if (!profileData.id) {
        throw new Error('ID utilisateur manquant');
      }
      
      // Dans une application réelle, ceci serait un appel API PUT
      console.log('Mise à jour du profil utilisateur:', profileData);
      
      // Simuler une réponse de succès avec les données mises à jour
      return {
        ...profileData,
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
      throw new Error('Impossible de mettre à jour le profil utilisateur');
    }
  }
  
  /**
   * Récupère l'historique d'entraînement de l'utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {number} limit - Nombre maximum d'entrées à récupérer
   * @returns {Promise<Array>} Historique d'entraînement
   */
  async getUserWorkoutHistory(userId, limit = 10) {
    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Dans une application réelle, ceci serait un appel API
      // Historique d'entraînement mocké
      const mockHistory = [
        {
          id: 'h1',
          workoutId: 'threshold-classic',
          workoutName: 'Seuil Classique',
          date: '2025-03-20',
          completed: true,
          duration: 60,
          avgPower: 210,
          normalizedPower: 230,
          tss: 85,
          ifactor: 0.92,
          heartRate: {
            avg: 145,
            max: 172
          },
          zones: {
            z1: 12, // % du temps passé en zone 1
            z2: 18,
            z3: 10,
            z4: 52,
            z5: 8,
            z6: 0,
            z7: 0
          }
        },
        {
          id: 'h2',
          workoutId: 'threshold-classic',
          workoutName: 'Seuil Classique',
          date: '2025-02-25',
          completed: true,
          duration: 62,
          avgPower: 205,
          normalizedPower: 225,
          tss: 83,
          ifactor: 0.90,
          heartRate: {
            avg: 148,
            max: 175
          },
          zones: {
            z1: 14,
            z2: 20,
            z3: 12,
            z4: 47,
            z5: 7,
            z6: 0,
            z7: 0
          }
        },
        {
          id: 'h3',
          workoutId: 'hiit-vo2max',
          workoutName: 'HIIT VO2max',
          date: '2025-02-18',
          completed: true,
          duration: 60,
          avgPower: 228,
          normalizedPower: 251,
          tss: 92,
          ifactor: 0.98,
          heartRate: {
            avg: 158,
            max: 182
          },
          zones: {
            z1: 10,
            z2: 14,
            z3: 12,
            z4: 25,
            z5: 35,
            z6: 4,
            z7: 0
          }
        },
        {
          id: 'h4',
          workoutId: 'endurance-foundation',
          workoutName: 'Fondation d\'Endurance',
          date: '2025-02-12',
          completed: true,
          duration: 90,
          avgPower: 172,
          normalizedPower: 178,
          tss: 78,
          ifactor: 0.70,
          heartRate: {
            avg: 132,
            max: 145
          },
          zones: {
            z1: 5,
            z2: 85,
            z3: 10,
            z4: 0,
            z5: 0,
            z6: 0,
            z7: 0
          }
        },
        {
          id: 'h5',
          workoutId: 'threshold-classic',
          workoutName: 'Seuil Classique',
          date: '2025-01-30',
          completed: false, // Entraînement non terminé
          duration: 45, // Sur 60 prévus
          avgPower: 208,
          normalizedPower: 220,
          tss: 62,
          ifactor: 0.88,
          heartRate: {
            avg: 146,
            max: 168
          },
          zones: {
            z1: 15,
            z2: 22,
            z3: 15,
            z4: 42,
            z5: 6,
            z6: 0,
            z7: 0
          }
        }
      ];
      
      return mockHistory.slice(0, limit);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'historique d'entraînement (ID: ${userId}):`, error);
      throw new Error('Impossible de récupérer l\'historique d\'entraînement');
    }
  }
  
  /**
   * Récupère les statistiques d'entraînement de l'utilisateur
   * @param {string} userId - Identifiant de l'utilisateur
   * @param {string} period - Période pour les statistiques (week, month, year, all)
   * @returns {Promise<Object>} Statistiques d'entraînement
   */
  async getUserTrainingStats(userId, period = 'month') {
    try {
      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Dans une application réelle, ceci serait un appel API
      // Statistiques d'entraînement mockées
      const mockStats = {
        workoutCount: 14,
        totalDuration: 842, // minutes
        totalTSS: 1248,
        avgWeeklyTSS: 312,
        completionRate: 0.89, // 89% des entraînements terminés
        ftpHistory: [
          { date: '2025-01-05', value: 225 },
          { date: '2025-02-10', value: 232 },
          { date: '2025-03-15', value: 240 }
        ],
        powerDistribution: {
          z1: 12, // % du temps passé en zone 1
          z2: 35,
          z3: 18,
          z4: 25,
          z5: 8,
          z6: 2,
          z7: 0
        },
        workoutTypes: {
          RECOVERY: 2,
          ENDURANCE: 5,
          THRESHOLD: 4,
          HIIT: 3
        }
      };
      
      return mockStats;
    } catch (error) {
      console.error(`Erreur lors de la récupération des statistiques d'entraînement (ID: ${userId}):`, error);
      throw new Error('Impossible de récupérer les statistiques d\'entraînement');
    }
  }
}

// Export une instance singleton du service
export default new UserService();
