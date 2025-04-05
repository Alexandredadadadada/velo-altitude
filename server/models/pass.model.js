// models/pass.model.js - Modèle pour les cols cyclistes du Grand Est
const fs = require('fs');
const path = require('path');

/**
 * Classe représentant le modèle de données pour les cols cyclistes
 */
class PassModel {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/passes.json');
    this.passes = this._loadPasses();
  }

  /**
   * Charge les données des cols depuis le fichier JSON
   * @returns {Array} Liste des cols
   * @private
   */
  _loadPasses() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        return JSON.parse(data);
      }
      // Retourne un tableau vide si le fichier n'existe pas encore
      return [];
    } catch (error) {
      console.error('Erreur lors du chargement des données des cols:', error);
      return [];
    }
  }

  /**
   * Enregistre les données des cols dans le fichier JSON
   * @private
   */
  _savePasses() {
    try {
      // Crée le répertoire s'il n'existe pas
      const dir = path.dirname(this.dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dataPath, JSON.stringify(this.passes, null, 2), 'utf8');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des données des cols:', error);
    }
  }

  /**
   * Récupère tous les cols
   * @returns {Array} Liste de tous les cols
   */
  getAllPasses() {
    return this.passes;
  }

  /**
   * Récupère un col par son ID
   * @param {string} id ID du col
   * @returns {Object|null} Détails du col ou null si non trouvé
   */
  getPassById(id) {
    return this.passes.find(pass => pass.id === id) || null;
  }

  /**
   * Ajoute un nouveau col
   * @param {Object} passData Données du col
   * @returns {Object} Le col ajouté
   */
  addPass(passData) {
    // Génération d'un ID unique si non fourni
    const newPass = {
      id: passData.id || Date.now().toString(),
      ...passData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.passes.push(newPass);
    this._savePasses();
    return newPass;
  }

  /**
   * Met à jour un col existant
   * @param {string} id ID du col à mettre à jour
   * @param {Object} passData Nouvelles données du col
   * @returns {Object|null} Le col mis à jour ou null si non trouvé
   */
  updatePass(id, passData) {
    const index = this.passes.findIndex(pass => pass.id === id);
    if (index === -1) return null;

    const updatedPass = {
      ...this.passes[index],
      ...passData,
      updatedAt: new Date().toISOString()
    };
    
    this.passes[index] = updatedPass;
    this._savePasses();
    return updatedPass;
  }

  /**
   * Supprime un col
   * @param {string} id ID du col à supprimer
   * @returns {boolean} Succès de la suppression
   */
  deletePass(id) {
    const initialLength = this.passes.length;
    this.passes = this.passes.filter(pass => pass.id !== id);
    
    if (initialLength !== this.passes.length) {
      this._savePasses();
      return true;
    }
    return false;
  }
}

module.exports = new PassModel();
