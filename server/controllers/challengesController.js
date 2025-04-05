const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const logger = require('../utils/logger');

// Chemins des fichiers de données
const challengesFilePath = path.join(__dirname, '../data/cycling-challenges.json');
const userChallengesProgressFilePath = path.join(__dirname, '../data/user-challenges-progress.json');
const colsFilePath = path.join(__dirname, '../data/european-cols.json');

// Configuration de stockage pour les photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/challenge-photos');
    // Créer le répertoire s'il n'existe pas
    fs.mkdir(dir, { recursive: true })
      .then(() => cb(null, dir))
      .catch(err => cb(err));
  },
  filename: (req, file, cb) => {
    const userId = req.params.userId;
    const challengeId = req.params.challengeId;
    const colId = req.params.colId;
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    cb(null, `${userId}_${challengeId}_${colId}_${timestamp}${extension}`);
  }
});

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Seules les images sont acceptées'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // limite à 5 MB
  }
});

/**
 * Récupérer la liste de tous les défis
 */
exports.getAllChallenges = async (req, res) => {
  try {
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    
    res.status(200).json({ challenges });
  } catch (error) {
    logger.error('Erreur lors de la récupération des défis:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des défis' });
  }
};

/**
 * Récupérer un défi spécifique par son ID
 */
exports.getChallengeById = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Défi non trouvé' });
    }
    
    res.status(200).json(challenge);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du défi ID=${req.params.challengeId}:`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération du défi' });
  }
};

/**
 * Récupérer la progression d'un utilisateur pour un défi spécifique
 */
exports.getUserChallengeProgress = async (req, res) => {
  try {
    const { userId, challengeId } = req.params;
    
    // Vérifier si le fichier de progression existe
    try {
      await fs.access(userChallengesProgressFilePath);
    } catch (error) {
      // Si le fichier n'existe pas, créer un tableau vide
      await fs.writeFile(userChallengesProgressFilePath, JSON.stringify([]));
    }
    
    const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
    const allProgress = JSON.parse(progressData);
    
    const userProgress = allProgress.find(
      p => p.userId === userId && p.challengeId === challengeId
    );
    
    if (!userProgress) {
      // Si l'utilisateur n'a pas encore de progression pour ce défi, renvoyer null
      return res.status(200).json(null);
    }
    
    res.status(200).json(userProgress);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la progression utilisateur (userId=${req.params.userId}, challengeId=${req.params.challengeId}):`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la progression' });
  }
};

/**
 * Récupérer la progression de tous les utilisateurs pour un défi (pour le leaderboard)
 */
exports.getChallengeLeaderboard = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    // Vérifier si le fichier de progression existe
    try {
      await fs.access(userChallengesProgressFilePath);
    } catch (error) {
      // Si le fichier n'existe pas, créer un tableau vide
      await fs.writeFile(userChallengesProgressFilePath, JSON.stringify([]));
      return res.status(200).json({ leaderboard: [] });
    }
    
    const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
    const allProgress = JSON.parse(progressData);
    
    // Filtrer les progressions pour ce défi
    const challengeProgress = allProgress.filter(p => p.challengeId === challengeId);
    
    // Récupérer les informations du défi pour connaître le nombre total de cols
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Défi non trouvé' });
    }
    
    // Créer le classement
    const leaderboard = challengeProgress
      .map(progress => {
        const completionPercent = (progress.completedCols.length / challenge.cols.length) * 100;
        const isCompleted = completionPercent === 100;
        
        return {
          userId: progress.userId,
          username: progress.username || 'Anonyme',
          completedCols: progress.completedCols.length,
          totalCols: challenge.cols.length,
          completionPercent,
          isCompleted,
          startDate: progress.startDate,
          completionDate: progress.completionDate,
          // Calcul approximatif du temps pour compléter le défi en jours
          completionTime: isCompleted && progress.startDate && progress.completionDate 
            ? Math.ceil((new Date(progress.completionDate) - new Date(progress.startDate)) / (1000 * 60 * 60 * 24))
            : null
        };
      })
      // Trier par pourcentage de complétion décroissant, puis par temps de complétion croissant (si complété)
      .sort((a, b) => {
        if (b.completionPercent === a.completionPercent) {
          if (a.isCompleted && b.isCompleted) {
            return a.completionTime - b.completionTime;
          }
          return 0;
        }
        return b.completionPercent - a.completionPercent;
      });
    
    res.status(200).json({ leaderboard });
  } catch (error) {
    logger.error(`Erreur lors de la récupération du classement pour le défi ID=${req.params.challengeId}:`, error);
    res.status(500).json({ message: "Erreur lors de la récupération du classement" });
  }
};

/**
 * Mettre à jour la progression d'un utilisateur pour un col spécifique d'un défi
 * Middleware pour gérer l'upload de photo
 */
exports.uploadColPhoto = upload.single('photo');

/**
 * Mettre à jour la progression d'un utilisateur pour un col spécifique d'un défi
 */
exports.updateColProgress = async (req, res) => {
  try {
    const { userId, challengeId, colId } = req.params;
    const { date, time, notes, stravaActivityId } = req.body;
    
    // Vérifier si le défi existe
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      return res.status(404).json({ message: 'Défi non trouvé' });
    }
    
    // Vérifier si le col fait partie du défi
    if (!challenge.cols.includes(colId)) {
      return res.status(404).json({ message: 'Col non trouvé dans ce défi' });
    }
    
    // Vérifier si le fichier de progression existe
    let allProgress = [];
    try {
      const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
      allProgress = JSON.parse(progressData);
    } catch (error) {
      // Si le fichier n'existe pas, créer un tableau vide
      await fs.writeFile(userChallengesProgressFilePath, JSON.stringify([]));
    }
    
    // Trouver la progression de l'utilisateur pour ce défi
    let userProgress = allProgress.find(
      p => p.userId === userId && p.challengeId === challengeId
    );
    
    // Si l'utilisateur n'a pas encore de progression pour ce défi, créer une nouvelle entrée
    if (!userProgress) {
      userProgress = {
        id: uuidv4(),
        userId,
        username: req.user?.username || 'Utilisateur',
        challengeId,
        completedCols: [],
        colsProgress: {},
        startDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      allProgress.push(userProgress);
    }
    
    // Mettre à jour la progression pour ce col
    const photoPath = req.file ? `uploads/challenge-photos/${req.file.filename}` : null;
    
    userProgress.colsProgress[colId] = {
      date: date || new Date().toISOString(),
      time: time || null,
      notes: notes || null,
      photoPath,
      stravaActivityId: stravaActivityId || null,
      validatedAt: new Date().toISOString()
    };
    
    // Mettre à jour la liste des cols complétés
    if (!userProgress.completedCols.includes(colId)) {
      userProgress.completedCols.push(colId);
    }
    
    // Vérifier si tous les cols sont complétés
    if (userProgress.completedCols.length === challenge.cols.length && !userProgress.completionDate) {
      userProgress.completionDate = new Date().toISOString();
    }
    
    userProgress.lastUpdated = new Date().toISOString();
    
    // Sauvegarder les modifications
    await fs.writeFile(userChallengesProgressFilePath, JSON.stringify(allProgress, null, 2));
    
    res.status(200).json(userProgress);
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la progression (userId=${req.params.userId}, challengeId=${req.params.challengeId}, colId=${req.params.colId}):`, error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la progression' });
  }
};

/**
 * Supprimer la progression d'un utilisateur pour un col spécifique d'un défi
 */
exports.deleteColProgress = async (req, res) => {
  try {
    const { userId, challengeId, colId } = req.params;
    
    // Vérifier si le fichier de progression existe
    let allProgress = [];
    try {
      const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
      allProgress = JSON.parse(progressData);
    } catch (error) {
      return res.status(404).json({ message: 'Aucune progression trouvée' });
    }
    
    // Trouver la progression de l'utilisateur pour ce défi
    const userProgressIndex = allProgress.findIndex(
      p => p.userId === userId && p.challengeId === challengeId
    );
    
    if (userProgressIndex === -1) {
      return res.status(404).json({ message: 'Progression non trouvée' });
    }
    
    const userProgress = allProgress[userProgressIndex];
    
    // Supprimer la progression pour ce col
    if (userProgress.colsProgress && userProgress.colsProgress[colId]) {
      // Si une photo a été téléchargée, la supprimer
      if (userProgress.colsProgress[colId].photoPath) {
        try {
          const photoFullPath = path.join(__dirname, '..', userProgress.colsProgress[colId].photoPath);
          await fs.unlink(photoFullPath);
        } catch (unlinkError) {
          logger.warn(`Impossible de supprimer la photo: ${unlinkError.message}`);
        }
      }
      
      delete userProgress.colsProgress[colId];
    }
    
    // Supprimer le col de la liste des cols complétés
    userProgress.completedCols = userProgress.completedCols.filter(id => id !== colId);
    
    // Mettre à jour la date de complétion
    if (userProgress.completionDate && userProgress.completedCols.length < userProgress.totalCols) {
      userProgress.completionDate = null;
    }
    
    userProgress.lastUpdated = new Date().toISOString();
    
    // Sauvegarder les modifications
    await fs.writeFile(userChallengesProgressFilePath, JSON.stringify(allProgress, null, 2));
    
    res.status(200).json(userProgress);
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la progression (userId=${req.params.userId}, challengeId=${req.params.challengeId}, colId=${req.params.colId}):`, error);
    res.status(500).json({ message: 'Erreur lors de la suppression de la progression' });
  }
};

/**
 * Récupérer toutes les progressions d'un utilisateur
 */
exports.getUserAllChallengesProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si le fichier de progression existe
    try {
      await fs.access(userChallengesProgressFilePath);
    } catch (error) {
      // Si le fichier n'existe pas, créer un tableau vide
      await fs.writeFile(userChallengesProgressFilePath, JSON.stringify([]));
      return res.status(200).json({ progress: [] });
    }
    
    const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
    const allProgress = JSON.parse(progressData);
    
    // Filtrer les progressions pour cet utilisateur
    const userProgress = allProgress.filter(p => p.userId === userId);
    
    // Récupérer les informations de tous les défis
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    
    // Ajouter les informations des défis à la progression
    const progressWithChallengeInfo = userProgress.map(progress => {
      const challenge = challenges.find(c => c.id === progress.challengeId);
      if (!challenge) return progress;
      
      const completionPercent = (progress.completedCols.length / challenge.cols.length) * 100;
      
      return {
        ...progress,
        challengeName: challenge.name,
        challengeDifficulty: challenge.difficulty,
        challengeCategory: challenge.category,
        totalCols: challenge.cols.length,
        completionPercent
      };
    });
    
    res.status(200).json({ progress: progressWithChallengeInfo });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des progressions de l'utilisateur userId=${req.params.userId}:`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération des progressions' });
  }
};

/**
 * Récupérer les statistiques globales d'un utilisateur
 */
exports.getUserChallengeStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier si le fichier de progression existe
    try {
      await fs.access(userChallengesProgressFilePath);
    } catch (error) {
      // Si le fichier n'existe pas, renvoyer des statistiques vides
      return res.status(200).json({ 
        stats: {
          totalChallenges: 0,
          completedChallenges: 0,
          totalPoints: 0,
          totalCols: 0,
          completedCols: 0
        }
      });
    }
    
    const progressData = await fs.readFile(userChallengesProgressFilePath, 'utf8');
    const allProgress = JSON.parse(progressData);
    
    // Filtrer les progressions pour cet utilisateur
    const userProgress = allProgress.filter(p => p.userId === userId);
    
    // Récupérer les informations de tous les défis
    const challengesData = await fs.readFile(challengesFilePath, 'utf8');
    const challenges = JSON.parse(challengesData);
    
    // Calculer les statistiques
    let totalChallenges = userProgress.length;
    let completedChallenges = 0;
    let totalPoints = 0;
    let totalCols = 0;
    let completedCols = 0;
    
    userProgress.forEach(progress => {
      const challenge = challenges.find(c => c.id === progress.challengeId);
      if (!challenge) return;
      
      totalCols += challenge.cols.length;
      completedCols += progress.completedCols.length;
      
      // Un défi est considéré comme complété si tous les cols ont été gravis
      const isCompleted = progress.completedCols.length === challenge.cols.length;
      if (isCompleted) {
        completedChallenges++;
        totalPoints += challenge.rewards.points;
      } else {
        // Points partiels basés sur le pourcentage de complétion
        const completionPercent = (progress.completedCols.length / challenge.cols.length);
        totalPoints += Math.floor(challenge.rewards.points * completionPercent);
      }
    });
    
    res.status(200).json({
      stats: {
        totalChallenges,
        completedChallenges,
        totalPoints,
        totalCols,
        completedCols
      }
    });
  } catch (error) {
    logger.error(`Erreur lors de la récupération des statistiques de l'utilisateur userId=${req.params.userId}:`, error);
    res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
  }
};
