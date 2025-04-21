// API wrapper pour nutritionService.js
// Ce fichier doit fournir les méthodes HTTP de base utilisées dans nutritionService.js
import axios from 'axios';

const api = {
  get: (url, config) => axios.get(url, config),
  post: (url, data, config) => axios.post(url, data, config),
  put: (url, data, config) => axios.put(url, data, config),
  delete: (url, config) => axios.delete(url, config),
};

export default api;
