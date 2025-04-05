const { expect } = require('chai');
const sinon = require('sinon');
const redis = require('redis');
const NodeCache = require('node-cache');
const zlib = require('zlib');
const { DistributedCache } = require('../../utils/distributed-cache');

describe('DistributedCache', () => {
  let distributedCache;
  let redisClientStub;
  let nodeCacheStub;
  let zlibStub;
  let clock;

  beforeEach(() => {
    // Stub Redis client
    redisClientStub = {
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub(),
      on: sinon.stub(),
      connect: sinon.stub().resolves(),
      quit: sinon.stub().resolves()
    };
    sinon.stub(redis, 'createClient').returns(redisClientStub);

    // Stub NodeCache
    nodeCacheStub = {
      get: sinon.stub(),
      set: sinon.stub(),
      del: sinon.stub(),
      flushAll: sinon.stub(),
      getStats: sinon.stub().returns({ hits: 10, misses: 5 })
    };
    sinon.stub(NodeCache.prototype, 'get').callsFake(nodeCacheStub.get);
    sinon.stub(NodeCache.prototype, 'set').callsFake(nodeCacheStub.set);
    sinon.stub(NodeCache.prototype, 'del').callsFake(nodeCacheStub.del);
    sinon.stub(NodeCache.prototype, 'flushAll').callsFake(nodeCacheStub.flushAll);
    sinon.stub(NodeCache.prototype, 'getStats').callsFake(nodeCacheStub.getStats);

    // Stub zlib
    zlibStub = {
      gzipSync: sinon.stub(zlib, 'gzipSync').callsFake(data => Buffer.from(`compressed-${data}`)),
      gunzipSync: sinon.stub(zlib, 'gunzipSync').callsFake(data => data.toString().replace('compressed-', ''))
    };

    // Use fake timers
    clock = sinon.useFakeTimers();

    // Create instance with test configuration
    distributedCache = new DistributedCache({
      redisUrl: 'redis://localhost:6379',
      keyPrefix: 'test:',
      defaultTTL: 3600,
      compression: true,
      logLevel: 'error'
    });
  });

  afterEach(() => {
    sinon.restore();
    clock.restore();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const cache = new DistributedCache();
      expect(cache.options.keyPrefix).to.equal('dashboardvelo:');
      expect(cache.options.defaultTTL).to.equal(3600);
      expect(cache.options.compression).to.be.true;
    });

    it('should initialize with custom options', () => {
      const cache = new DistributedCache({
        keyPrefix: 'custom:',
        defaultTTL: 7200,
        compression: false
      });
      expect(cache.options.keyPrefix).to.equal('custom:');
      expect(cache.options.defaultTTL).to.equal(7200);
      expect(cache.options.compression).to.be.false;
    });

    it('should handle Redis connection errors', async () => {
      redisClientStub.connect.rejects(new Error('Connection failed'));
      
      const cache = new DistributedCache();
      await cache.connect();
      
      expect(cache.redisAvailable).to.be.false;
      expect(cache.metrics.redisConnectionErrors).to.equal(1);
    });
  });

  describe('get', () => {
    it('should get data from Redis when available', async () => {
      const testData = { id: 1, name: 'Test' };
      const compressedData = Buffer.from(`compressed-${JSON.stringify(testData)}`);
      
      redisClientStub.get.resolves(compressedData);
      
      const result = await distributedCache.get('test-key');
      
      expect(redisClientStub.get.calledWith('test:test-key')).to.be.true;
      expect(zlibStub.gunzipSync.called).to.be.true;
      expect(result).to.deep.equal(testData);
      expect(distributedCache.metrics.redisHits).to.equal(1);
    });

    it('should fall back to local cache when Redis fails', async () => {
      const testData = { id: 1, name: 'Test' };
      
      redisClientStub.get.rejects(new Error('Redis error'));
      nodeCacheStub.get.returns(testData);
      
      const result = await distributedCache.get('test-key');
      
      expect(redisClientStub.get.calledWith('test:test-key')).to.be.true;
      expect(nodeCacheStub.get.calledWith('test-key')).to.be.true;
      expect(result).to.deep.equal(testData);
      expect(distributedCache.metrics.redisErrors).to.equal(1);
      expect(distributedCache.metrics.localHits).to.equal(1);
    });

    it('should return null when key is not found in either cache', async () => {
      redisClientStub.get.resolves(null);
      nodeCacheStub.get.returns(undefined);
      
      const result = await distributedCache.get('test-key');
      
      expect(result).to.be.null;
      expect(distributedCache.metrics.redisMisses).to.equal(1);
      expect(distributedCache.metrics.localMisses).to.equal(1);
    });

    it('should handle decompression errors gracefully', async () => {
      redisClientStub.get.resolves(Buffer.from('invalid-compressed-data'));
      zlibStub.gunzipSync.throws(new Error('Decompression failed'));
      nodeCacheStub.get.returns(null);
      
      const result = await distributedCache.get('test-key');
      
      expect(result).to.be.null;
      expect(distributedCache.metrics.decompressionErrors).to.equal(1);
    });
  });

  describe('set', () => {
    it('should set data in both Redis and local cache', async () => {
      const testData = { id: 1, name: 'Test' };
      const ttl = 7200;
      
      redisClientStub.set.resolves('OK');
      
      await distributedCache.set('test-key', testData, ttl);
      
      expect(zlibStub.gzipSync.calledWith(JSON.stringify(testData))).to.be.true;
      expect(redisClientStub.set.calledWith(
        'test:test-key',
        sinon.match.any,
        sinon.match.has('EX', ttl)
      )).to.be.true;
      expect(nodeCacheStub.set.calledWith('test-key', testData, ttl)).to.be.true;
    });

    it('should handle Redis errors when setting data', async () => {
      const testData = { id: 1, name: 'Test' };
      
      redisClientStub.set.rejects(new Error('Redis error'));
      
      await distributedCache.set('test-key', testData);
      
      expect(nodeCacheStub.set.calledWith('test-key', testData, 3600)).to.be.true;
      expect(distributedCache.metrics.redisErrors).to.equal(1);
    });

    it('should use default TTL when not specified', async () => {
      const testData = { id: 1, name: 'Test' };
      
      await distributedCache.set('test-key', testData);
      
      expect(redisClientStub.set.calledWith(
        'test:test-key',
        sinon.match.any,
        sinon.match.has('EX', 3600)
      )).to.be.true;
      expect(nodeCacheStub.set.calledWith('test-key', testData, 3600)).to.be.true;
    });

    it('should skip compression when disabled', async () => {
      distributedCache.options.compression = false;
      const testData = { id: 1, name: 'Test' };
      
      await distributedCache.set('test-key', testData);
      
      expect(zlibStub.gzipSync.called).to.be.false;
      expect(redisClientStub.set.calledWith(
        'test:test-key',
        JSON.stringify(testData),
        sinon.match.any
      )).to.be.true;
    });
  });

  describe('del', () => {
    it('should delete data from both Redis and local cache', async () => {
      redisClientStub.del.resolves(1);
      
      await distributedCache.del('test-key');
      
      expect(redisClientStub.del.calledWith('test:test-key')).to.be.true;
      expect(nodeCacheStub.del.calledWith('test-key')).to.be.true;
    });

    it('should handle Redis errors when deleting data', async () => {
      redisClientStub.del.rejects(new Error('Redis error'));
      
      await distributedCache.del('test-key');
      
      expect(nodeCacheStub.del.calledWith('test-key')).to.be.true;
      expect(distributedCache.metrics.redisErrors).to.equal(1);
    });
  });

  describe('getTTL', () => {
    it('should calculate TTL based on region', () => {
      const ttl = distributedCache.getTTL('cols', 'eastern-europe');
      expect(ttl).to.be.greaterThan(distributedCache.options.defaultTTL);
    });

    it('should calculate TTL based on data type', () => {
      const ttl1 = distributedCache.getTTL('cols', 'western-europe');
      const ttl2 = distributedCache.getTTL('routes', 'western-europe');
      expect(ttl1).to.not.equal(ttl2);
    });

    it('should return default TTL for unknown data types', () => {
      const ttl = distributedCache.getTTL('unknown', 'western-europe');
      expect(ttl).to.equal(distributedCache.options.defaultTTL);
    });
  });

  describe('getMetrics', () => {
    it('should return current metrics', () => {
      distributedCache.metrics.redisHits = 10;
      distributedCache.metrics.redisMisses = 5;
      
      const metrics = distributedCache.getMetrics();
      
      expect(metrics.redisHits).to.equal(10);
      expect(metrics.redisMisses).to.equal(5);
      expect(metrics.hitRate).to.equal(10 / (10 + 5));
    });
  });

  describe('clear', () => {
    it('should clear both Redis and local cache', async () => {
      await distributedCache.clear();
      
      expect(redisClientStub.del.called).to.be.true;
      expect(nodeCacheStub.flushAll.called).to.be.true;
    });

    it('should handle Redis errors when clearing cache', async () => {
      redisClientStub.del.rejects(new Error('Redis error'));
      
      await distributedCache.clear();
      
      expect(nodeCacheStub.flushAll.called).to.be.true;
      expect(distributedCache.metrics.redisErrors).to.equal(1);
    });
  });

  describe('adaptiveCompression', () => {
    it('should compress large data', () => {
      const largeData = { data: 'x'.repeat(10000) };
      
      distributedCache._adaptiveCompression(JSON.stringify(largeData));
      
      expect(zlibStub.gzipSync.called).to.be.true;
    });

    it('should not compress small data when adaptive compression is enabled', () => {
      distributedCache.options.adaptiveCompression = true;
      const smallData = { data: 'small' };
      
      const result = distributedCache._adaptiveCompression(JSON.stringify(smallData));
      
      expect(zlibStub.gzipSync.called).to.be.false;
      expect(result).to.equal(JSON.stringify(smallData));
    });
  });

  describe('reconnection handling', () => {
    it('should attempt to reconnect when Redis connection is lost', async () => {
      // Simulate Redis connection event
      const connectionCallback = redisClientStub.on.withArgs('error').getCall(0).args[1];
      
      // Trigger connection error
      connectionCallback(new Error('Connection lost'));
      
      // Fast-forward reconnection delay
      clock.tick(5000);
      
      expect(redisClientStub.connect.callCount).to.be.at.least(2);
      expect(distributedCache.metrics.reconnectionAttempts).to.equal(1);
    });
  });
});
