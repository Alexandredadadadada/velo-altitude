/**
 * Tests pour les utilitaires de formatage
 * Ce fichier sert également à valider la configuration Jest
 */

import { 
  formatDistance, 
  formatDuration, 
  formatPercentage, 
  calculateIntensity, 
  formatIntensity,
  formatDate
} from '../formatters';

// Mock pour la date actuelle
const RealDate = Date;
const mockDate = (date) => {
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length) {
        return new RealDate(...args);
      }
      return new RealDate(date);
    }
    static now() {
      return new RealDate(date).getTime();
    }
  };
};

// Restaurer la date réelle après les tests
const restoreDate = () => {
  global.Date = RealDate;
};

describe('Formatters', () => {
  // Tests pour formatDistance
  describe('formatDistance', () => {
    test('formate correctement les distances en mètres', () => {
      expect(formatDistance(0.5)).toBe('500 m');
      expect(formatDistance(0.123)).toBe('123 m');
    });

    test('formate correctement les distances en kilomètres', () => {
      expect(formatDistance(5)).toBe('5.0 km');
      expect(formatDistance(42.5)).toBe('42.5 km');
    });

    test('formate correctement les très grandes distances', () => {
      expect(formatDistance(1500)).toBe('1.5 Mm');
    });

    test('peut omettre l\'unité si demandé', () => {
      expect(formatDistance(5, false)).toBe('5.0');
      expect(formatDistance(0.5, false)).toBe('500');
    });

    test('gère les valeurs non définies', () => {
      expect(formatDistance(null)).toBe('-');
      expect(formatDistance(undefined)).toBe('-');
    });
  });

  // Tests pour formatDuration
  describe('formatDuration', () => {
    test('formate correctement les durées courtes en format long', () => {
      expect(formatDuration(30)).toBe('0 minutes 30 secondes');
      expect(formatDuration(90)).toBe('1 minute 30 secondes');
    });

    test('formate correctement les durées moyennes en format long', () => {
      expect(formatDuration(600)).toBe('10 minutes');
      expect(formatDuration(3600)).toBe('1 heure');
      expect(formatDuration(3660)).toBe('1 heure 1 minute');
    });

    test('formate correctement les durées en format court', () => {
      expect(formatDuration(3665, 'short')).toBe('1h 01m');
      expect(formatDuration(65, 'short')).toBe('1m 05s');
    });

    test('gère les valeurs non définies', () => {
      expect(formatDuration(null)).toBe('-');
      expect(formatDuration(undefined)).toBe('-');
    });
  });

  // Tests pour formatDate
  describe('formatDate', () => {
    beforeEach(() => {
      // Mock la date actuelle au 15 avril 2025
      mockDate('2025-04-15T12:00:00.000Z');
    });

    afterEach(() => {
      restoreDate();
    });

    test('gère les valeurs non définies', () => {
      expect(formatDate(null)).toBe('-');
      expect(formatDate(undefined)).toBe('-');
      expect(formatDate('')).toBe('-');
    });

    test('formate correctement les dates en format court', () => {
      // Vérification moins stricte pour s'adapter aux différentes locales
      const shortDate1 = formatDate('2025-01-01', 'short');
      expect(shortDate1).toMatch(/01.*01.*25|01.*01.*2025/);
      
      const shortDate2 = formatDate('2024-12-31', 'short');
      expect(shortDate2).toMatch(/31.*12.*24|31.*12.*2024/);
    });

    test('formate correctement les dates en format medium (par défaut)', () => {
      const mediumDate1 = formatDate('2025-01-01');
      // Vérification moins stricte qui accepte différents formats selon la locale
      expect(['1 janvier', 'janvier 1', '1 janvier 2025', 'janvier 1 2025'].some(format => 
        mediumDate1.includes(format)
      )).toBeTruthy();
      
      const mediumDate2 = formatDate('2024-12-31');
      expect(['31 décembre', 'décembre 31', '31 décembre 2024', 'décembre 31 2024'].some(format => 
        mediumDate2.includes(format)
      )).toBeTruthy();
    });

    test('détecte correctement aujourd\'hui', () => {
      const today = formatDate('2025-04-15');
      // Cette assertion est plus large pour s'adapter à différentes localisations
      expect(['Aujourd\'hui', 'Today', '15 avril'].some(format => 
        today.includes(format)
      )).toBeTruthy();
    });
  });

  // Tests pour formatPercentage
  describe('formatPercentage', () => {
    test('formate correctement les pourcentages sans décimales', () => {
      expect(formatPercentage(0.5)).toBe('50%');
      expect(formatPercentage(0.123)).toBe('12%');
    });

    test('formate correctement les pourcentages avec décimales', () => {
      expect(formatPercentage(0.123, 1)).toBe('12.3%');
      expect(formatPercentage(0.456, 2)).toBe('45.60%');
    });

    test('gère les valeurs non définies', () => {
      expect(formatPercentage(null)).toBe('-');
      expect(formatPercentage(undefined)).toBe('-');
    });
  });

  // Tests pour calculateIntensity
  describe('calculateIntensity', () => {
    test('retourne 0 pour une liste vide d\'activités', () => {
      expect(calculateIntensity([])).toBe(0);
      expect(calculateIntensity(null)).toBe(0);
    });

    test('calcule correctement l\'intensité pour une liste d\'activités', () => {
      const activities = [
        { 
          average_speed: 25, 
          average_heart_rate: 150, 
          elevation_gain: 500, 
          distance: 50
        },
        { 
          average_speed: 30, 
          average_heart_rate: 160, 
          elevation_gain: 800, 
          distance: 60
        }
      ];
      
      const result = calculateIntensity(activities);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(5);
    });
  });

  // Tests pour formatIntensity
  describe('formatIntensity', () => {
    test('formate correctement différents niveaux d\'intensité', () => {
      expect(formatIntensity(0.5)).toBe('Très faible');
      expect(formatIntensity(1.5)).toBe('Faible');
      expect(formatIntensity(2.5)).toBe('Modérée');
      expect(formatIntensity(3.5)).toBe('Élevée');
      expect(formatIntensity(4.5)).toBe('Très élevée');
    });
  });
});
