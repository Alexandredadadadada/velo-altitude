/**
 * Test simple pour valider la configuration Jest
 */

describe('Configuration Jest', () => {
  test('les opérations mathématiques de base fonctionnent', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect(10 - 5).toBe(5);
  });

  test('les fonctionnalités d\'array fonctionnent', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('les fonctionnalités d\'objet fonctionnent', () => {
    const obj = { a: 1, b: 2 };
    expect(obj).toHaveProperty('a');
    expect(obj.b).toBe(2);
  });

  test('les tests asynchrones fonctionnent', async () => {
    const result = await Promise.resolve('test');
    expect(result).toBe('test');
  });

  test('les mocks fonctionnent', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });
});
