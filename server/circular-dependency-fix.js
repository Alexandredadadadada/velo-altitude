/**
 * Fichier de correctif pour les dépendances circulaires
 * À importer au début des fichiers concernés pour éviter les erreurs
 * lors de l'initialisation des modules.
 */

// Ce module sert de proxy pour éviter les dépendances circulaires
// entre les différents services de l'application.

const serviceRegistry = {
  // Services enregistrés dynamiquement
  _services: {},
  
  // Enregistre un service dans le registre
  register(name, service) {
    this._services[name] = service;
    return service;
  },
  
  // Récupère un service enregistré
  get(name) {
    return this._services[name];
  },
  
  // Vérifie si un service est enregistré
  has(name) {
    return name in this._services;
  }
};

module.exports = serviceRegistry;
