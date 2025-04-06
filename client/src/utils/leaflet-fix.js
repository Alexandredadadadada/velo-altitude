/**
 * Modification des chemins d'accès aux images Leaflet
 * Cette correction permet de résoudre le problème des images manquantes dans Leaflet
 */

import L from 'leaflet';

// Correction des chemins d'accès aux images Leaflet
// Solution pour résoudre l'erreur "Module not found: Error: Can't resolve 'images/layers.png'"
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default L;
