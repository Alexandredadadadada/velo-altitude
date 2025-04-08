/**
 * Tests pour les fonctions utilitaires testUtils
 * Cet exemple valide notre configuration Jest avec TypeScript
 */
import { formatNumber, isEmptyObject, truncateText, filterArrayByProperty } from '../../utils/testUtils';

// Test suite pour formatNumber
describe('formatNumber', () => {
  it('ajoute des séparateurs de milliers au nombre', () => {
    // Arrange & Act
    const result = formatNumber(1234567.89);
    
    // Assert - vérifie uniquement que le format a changé, sans dépendre de la locale spécifique
    expect(result).not.toBe('1234567.89');
    expect(result.length).toBeGreaterThan(String(1234567.89).length);
  });

  it('utilise la locale spécifiée pour le formatage', () => {
    // Arrange & Act
    const resultUS = formatNumber(1234.56, 'en-US');
    const resultFR = formatNumber(1234.56, 'fr-FR');
    
    // Assert - vérifie que les résultats sont différents selon la locale
    expect(resultUS).not.toBe(resultFR);
  });
});

// Test suite pour isEmptyObject
describe('isEmptyObject', () => {
  it('retourne true pour un objet vide', () => {
    // Arrange
    const emptyObj = {};
    
    // Act
    const result = isEmptyObject(emptyObj);
    
    // Assert
    expect(result).toBe(true);
  });

  it('retourne false pour un objet non vide', () => {
    // Arrange
    const nonEmptyObj = { key: 'value' };
    
    // Act
    const result = isEmptyObject(nonEmptyObj);
    
    // Assert
    expect(result).toBe(false);
  });
});

// Test suite pour truncateText
describe('truncateText', () => {
  it('tronque correctement un texte trop long', () => {
    // Arrange
    const longText = 'Ceci est un texte très long qui dépasse la limite';
    
    // Act
    const result = truncateText(longText, 20);
    
    // Assert
    expect(result).toBe('Ceci est un texte t...');
    expect(result.length).toBe(23); // 20 caractères + '...'
  });

  it('ne tronque pas un texte assez court', () => {
    // Arrange
    const shortText = 'Texte court';
    
    // Act
    const result = truncateText(shortText, 20);
    
    // Assert
    expect(result).toBe(shortText);
  });

  it('utilise le suffixe personnalisé', () => {
    // Arrange
    const longText = 'Texte à tronquer avec un suffixe personnalisé';
    
    // Act
    const result = truncateText(longText, 15, ' (suite)');
    
    // Assert
    expect(result).toBe('Texte à tronque (suite)');
  });

  it('gère les cas limites (undefined, null, vide)', () => {
    // Act & Assert
    expect(truncateText('', 10)).toBe('');
    expect(truncateText(undefined as any, 10)).toBe(undefined);
    expect(truncateText(null as any, 10)).toBe(null);
  });
});

// Test suite pour filterArrayByProperty
describe('filterArrayByProperty', () => {
  // Type d'exemple pour les tests
  interface TestItem {
    id: number;
    category: string;
    active: boolean;
  }

  // Données de test
  const testData: TestItem[] = [
    { id: 1, category: 'A', active: true },
    { id: 2, category: 'B', active: false },
    { id: 3, category: 'A', active: true },
    { id: 4, category: 'C', active: false },
    { id: 5, category: 'B', active: true },
  ];

  it('filtre correctement un tableau par une propriété string', () => {
    // Act
    const result = filterArrayByProperty(testData, 'category', 'A');
    
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  it('filtre correctement un tableau par une propriété boolean', () => {
    // Act
    const result = filterArrayByProperty(testData, 'active', true);
    
    // Assert
    expect(result).toHaveLength(3);
    expect(result.map(item => item.id)).toEqual([1, 3, 5]);
  });

  it('retourne un tableau vide si aucun élément ne correspond', () => {
    // Act
    const result = filterArrayByProperty(testData, 'category', 'Z');
    
    // Assert
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });
});
