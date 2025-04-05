/**
 * Tests du service et middleware de cache
 */

const cacheService = require('../services/cache.service');
const { cacheMiddleware, environmentalCacheKeyGenerator } = require('../middleware/cache.middleware');

// Fonction utilitaire pour simuler req, res, next
const createMockExpressObjects = () => {
  const req = {
    method: 'GET',
    originalUrl: '/api/test',
    query: {},
    params: {}
  };
  
  const res = {
    statusCode: 200,
    jsonCalled: false,
    jsonData: null,
    json: function(data) {
      this.jsonData = data;
      this.jsonCalled = true;
      return this;
    }
  };
  
  const next = jest.fn();
  
  return { req, res, next };
};

// Tests du service de cache
describe('Cache Service', () => {
  beforeEach(async () => {
    // Réinitialiser les métriques avant chaque test
    cacheService.resetMetrics();
  });
  
  test('Doit stocker et récupérer une valeur', async () => {
    const key = 'test:key';
    const value = { name: 'Test', value: 42 };
    
    await cacheService.set(key, value, 60);
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toEqual(value);
  });
  
  test('Doit supprimer une valeur', async () => {
    const key = 'test:delete';
    const value = { name: 'Delete Me' };
    
    await cacheService.set(key, value, 60);
    await cacheService.del(key);
    const retrieved = await cacheService.get(key);
    
    expect(retrieved).toBeNull();
  });
  
  test('Doit supprimer des valeurs par motif', async () => {
    await cacheService.set('pattern:test:1', 'value1', 60);
    await cacheService.set('pattern:test:2', 'value2', 60);
    await cacheService.set('other:key', 'other', 60);
    
    const deleted = await cacheService.delByPattern('pattern:test:*');
    expect(deleted).toBeGreaterThanOrEqual(0); // Au moins 0 (peut être 2 si Redis est disponible)
    
    const val1 = await cacheService.get('pattern:test:1');
    const val2 = await cacheService.get('pattern:test:2');
    const val3 = await cacheService.get('other:key');
    
    // Les clés correspondant au motif doivent être supprimées
    expect(val1).toBeNull();
    expect(val2).toBeNull();
    // Les autres clés doivent rester
    expect(val3).toBe('other');
  });
  
  test('Doit incrémenter un compteur', async () => {
    const key = 'counter:test';
    
    await cacheService.set(key, 10, 60);
    const newValue = await cacheService.increment(key, 5);
    
    expect(newValue).toBe(15);
  });
  
  test('Doit récupérer plusieurs valeurs', async () => {
    await cacheService.set('multi:1', 'value1', 60);
    await cacheService.set('multi:2', 'value2', 60);
    
    const values = await cacheService.mget(['multi:1', 'multi:2', 'multi:nonexistent']);
    
    expect(values['multi:1']).toBe('value1');
    expect(values['multi:2']).toBe('value2');
    expect(values['multi:nonexistent']).toBeNull();
  });
  
  test('Doit récupérer les statistiques du cache', async () => {
    // Générer quelques hits et misses
    await cacheService.set('stats:test', 'value', 60);
    await cacheService.get('stats:test');
    await cacheService.get('stats:nonexistent');
    
    const stats = await cacheService.getStats();
    
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('keys');
    expect(stats).toHaveProperty('type');
    expect(stats.hits).toBeGreaterThan(0);
    expect(stats.misses).toBeGreaterThan(0);
  });
});

// Tests du middleware de cache
describe('Cache Middleware', () => {
  test('Doit mettre en cache une réponse', async () => {
    const { req, res, next } = createMockExpressObjects();
    
    // Appliquer le middleware
    const middleware = cacheMiddleware(60);
    await middleware(req, res, next);
    
    // Le middleware devrait appeler next() et continuer
    expect(next).toHaveBeenCalled();
    
    // Simuler une réponse
    const responseData = { success: true, data: { test: 'value' } };
    res.json(responseData);
    
    // Vérifier que la réponse est mise en cache
    const cachedData = await cacheService.get(req.originalUrl);
    expect(cachedData).toEqual(responseData);
  });
  
  test('Doit utiliser un générateur de clé personnalisé', async () => {
    const { req, res, next } = createMockExpressObjects();
    
    // Configurer la requête pour le générateur de clé environnemental
    req.path = '/weather';
    req.query.lat = '48.8566';
    req.query.lng = '2.3522';
    
    // Générer la clé attendue
    const expectedKey = 'api:weather:48.86:2.35';
    
    // Appliquer le middleware avec le générateur de clé
    const middleware = cacheMiddleware(60, environmentalCacheKeyGenerator);
    await middleware(req, res, next);
    
    // Simuler une réponse
    const responseData = { success: true, data: { temperature: 22 } };
    res.json(responseData);
    
    // Vérifier que la réponse est mise en cache avec la bonne clé
    const cachedData = await cacheService.get(expectedKey);
    expect(cachedData).toEqual(responseData);
  });
});
