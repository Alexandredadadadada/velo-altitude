/**
 * Service de visualisation simple pour les cols
 * Utilise uniquement les données existantes sans dépendance à l'API d'élévation
 */

/**
 * Structure de données pour la visualisation 3D simplifiée d'un col
 */
export interface SimpleCol3DData {
  // Structure simplifiée qui utilise uniquement les données existantes
  elevationProfile: {
    start: number;      // Élévation de départ (calculée)
    summit: number;     // elevation existante
    distance: number;   // length existante
    gradient: number;   // avgGradient existant
  };
  points: Array<{
    distance: number;
    elevation: number;
    gradient: number;
  }>;
}

/**
 * Interface Col qui correspond à la structure existante en base de données
 */
export interface Col {
  name: string;
  coordinates: [number, number];
  elevation: number;
  length: number;
  avgGradient: number;
  maxGradient: number;
  climbs?: Array<any>;
  tags?: Array<string>;
}

/**
 * Service de visualisation simplifié pour les cols
 * Génère des données de visualisation 3D sans appel à des services externes
 */
export class SimpleColVisualization {
  /**
   * Transforme un col en données de visualisation 3D
   * @param col Objet col avec la structure existante
   * @returns Données formatées pour la visualisation
   */
  transformColTo3D(col: Col): SimpleCol3DData {
    // Calcul de l'élévation de départ basé sur les données existantes
    // Formule: sommet - (distance * pente moyenne * 10)
    // Le facteur 10 convertit le pourcentage en décimale et ajuste pour les unités (m/km)
    const startElevation = Math.max(0, col.elevation - (col.length * col.avgGradient * 10));
    
    // Générer points intermédiaires avec les données existantes
    const points = this.generatePoints(
      startElevation,
      col.elevation,
      col.length,
      col.avgGradient,
      col.maxGradient
    );

    return {
      elevationProfile: {
        start: startElevation,
        summit: col.elevation,
        distance: col.length,
        gradient: col.avgGradient
      },
      points: points
    };
  }

  /**
   * Génère des points intermédiaires pour la visualisation
   * @param start Élévation de départ
   * @param end Élévation au sommet
   * @param distance Distance totale du col
   * @param avgGradient Pente moyenne
   * @param maxGradient Pente maximale (pour varier le profil)
   * @returns Tableau de points avec distance, élévation et gradient
   */
  private generatePoints(
    start: number, 
    end: number, 
    distance: number, 
    avgGradient: number,
    maxGradient: number = avgGradient * 1.5
  ): Array<{distance: number; elevation: number; gradient: number}> {
    const points = [];
    const steps = 20; // Nombre de points pour le rendu
    
    // Variation simple pour rendre le profil plus réaliste
    // La section la plus raide est située aux 2/3 de la montée
    const steepSectionStart = Math.floor(steps * 0.4);
    const steepSectionEnd = Math.floor(steps * 0.7);

    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      const distancePoint = distance * fraction;
      
      // Calcul de l'élévation avec une courbe plus réaliste
      // Utilise une fonction sigmoid modifiée pour la transition
      let currentElevation;
      let currentGradient;

      // Appliquer une variation du gradient pour un profil plus réaliste
      if (i >= steepSectionStart && i <= steepSectionEnd) {
        // Section plus raide
        currentGradient = Math.min(maxGradient, avgGradient * 1.3);
      } else {
        // Sections moins raides
        currentGradient = Math.max(avgGradient * 0.7, avgGradient);
      }

      // Calcul simplifié de l'élévation
      currentElevation = start + (end - start) * this.easingFunction(fraction);

      points.push({
        distance: distancePoint,
        elevation: currentElevation,
        gradient: currentGradient
      });
    }

    return points;
  }

  /**
   * Fonction d'assouplissement pour créer un profil plus naturel
   * @param x Valeur entre 0 et 1
   * @returns Valeur transformée entre 0 et 1
   */
  private easingFunction(x: number): number {
    // Fonction d'assouplissement simple (courbe en S)
    // Donne un aspect plus naturel au profil d'élévation
    return x < 0.5
      ? 4 * x * x * x
      : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}

export default new SimpleColVisualization();
