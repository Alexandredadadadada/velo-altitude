const { expect } = require('chai');
const sinon = require('sinon');
const { Col3DService } = require('../../services/col3d.service');
const { DistributedCache } = require('../../utils/distributed-cache');
const ColService = require('../../services/col.service');

describe('Col3DService', () => {
  let col3DService;
  let cacheStub;
  let colServiceStub;
  let deviceDetectorStub;

  beforeEach(() => {
    // Stub cache
    cacheStub = {
      get: sinon.stub(),
      set: sinon.stub(),
      getTTL: sinon.stub().returns(3600)
    };
    
    // Stub ColService
    colServiceStub = {
      getColById: sinon.stub(),
      getPopularCols: sinon.stub(),
      getColsByRegion: sinon.stub()
    };
    
    // Stub device detector
    deviceDetectorStub = {
      detectDevice: sinon.stub().returns({ type: 'desktop', performance: 'high' })
    };
    
    // Create instance with stubs
    col3DService = new Col3DService({
      cache: cacheStub,
      colService: colServiceStub,
      deviceDetector: deviceDetectorStub
    });
    
    // Stub internal methods
    sinon.stub(col3DService, '_generateMesh');
    sinon.stub(col3DService, '_optimizeMesh');
    sinon.stub(col3DService, '_preloadPopularCols');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('getCol3DVisualization', () => {
    it('should return cached 3D data when available', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      const device = { type: 'desktop', performance: 'high' };
      const cachedData = { mesh: { vertices: [], faces: [] }, metadata: {} };
      
      cacheStub.get.resolves(cachedData);
      
      const result = await col3DService.getCol3DVisualization(colId, region, device);
      
      expect(cacheStub.get.calledWith(`col3d:${colId}:${device.type}:${device.performance}`)).to.be.true;
      expect(result).to.deep.equal(cachedData);
      expect(col3DService._generateMesh.called).to.be.false;
    });

    it('should generate new 3D data when cache misses', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      const device = { type: 'desktop', performance: 'high' };
      const colData = { 
        id: colId, 
        name: 'Test Col', 
        elevation: 1200, 
        coordinates: [45.5, 6.5],
        elevationProfile: [/* ... */]
      };
      const meshData = { vertices: [0, 0, 0], faces: [0, 1, 2] };
      
      cacheStub.get.resolves(null);
      colServiceStub.getColById.resolves(colData);
      col3DService._generateMesh.returns(meshData);
      col3DService._optimizeMesh.returns(meshData);
      
      const result = await col3DService.getCol3DVisualization(colId, region, device);
      
      expect(colServiceStub.getColById.calledWith(colId, region)).to.be.true;
      expect(col3DService._generateMesh.calledWith(colData)).to.be.true;
      expect(col3DService._optimizeMesh.calledWith(meshData, device)).to.be.true;
      expect(cacheStub.set.called).to.be.true;
      expect(result.mesh).to.deep.equal(meshData);
      expect(result.metadata.colId).to.equal(colId);
    });

    it('should handle errors and return fallback data', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      const device = { type: 'desktop', performance: 'high' };
      
      cacheStub.get.resolves(null);
      colServiceStub.getColById.rejects(new Error('Col not found'));
      
      const result = await col3DService.getCol3DVisualization(colId, region, device);
      
      expect(result).to.have.property('error');
      expect(result.error).to.include('Failed to generate 3D visualization');
      expect(result).to.have.property('fallbackVisualization');
    });

    it('should detect device type when not provided', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      const userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X)';
      const cachedData = { mesh: { vertices: [], faces: [] }, metadata: {} };
      
      cacheStub.get.resolves(cachedData);
      deviceDetectorStub.detectDevice.returns({ type: 'mobile', performance: 'medium' });
      
      await col3DService.getCol3DVisualization(colId, region, null, userAgent);
      
      expect(deviceDetectorStub.detectDevice.calledWith(userAgent)).to.be.true;
      expect(cacheStub.get.calledWith(`col3d:${colId}:mobile:medium`)).to.be.true;
    });
  });

  describe('getComparisonVisualization', () => {
    it('should return comparison of multiple cols', async () => {
      const colIds = ['col-123', 'col-456'];
      const region = 'western-europe';
      const device = { type: 'desktop', performance: 'high' };
      
      const col1Data = { mesh: { vertices: [0, 0, 0], faces: [0, 1, 2] }, metadata: { colId: 'col-123' } };
      const col2Data = { mesh: { vertices: [1, 1, 1], faces: [3, 4, 5] }, metadata: { colId: 'col-456' } };
      
      sinon.stub(col3DService, 'getCol3DVisualization')
        .withArgs('col-123', region, device).resolves(col1Data)
        .withArgs('col-456', region, device).resolves(col2Data);
      
      const result = await col3DService.getComparisonVisualization(colIds, region, device);
      
      expect(col3DService.getCol3DVisualization.callCount).to.equal(2);
      expect(result.cols).to.have.lengthOf(2);
      expect(result.cols[0].metadata.colId).to.equal('col-123');
      expect(result.cols[1].metadata.colId).to.equal('col-456');
    });

    it('should handle errors for individual cols in comparison', async () => {
      const colIds = ['col-123', 'col-456'];
      const region = 'western-europe';
      const device = { type: 'desktop', performance: 'high' };
      
      const col1Data = { mesh: { vertices: [0, 0, 0], faces: [0, 1, 2] }, metadata: { colId: 'col-123' } };
      const col2Error = { error: 'Failed to generate', fallbackVisualization: {} };
      
      sinon.stub(col3DService, 'getCol3DVisualization')
        .withArgs('col-123', region, device).resolves(col1Data)
        .withArgs('col-456', region, device).resolves(col2Error);
      
      const result = await col3DService.getComparisonVisualization(colIds, region, device);
      
      expect(result.cols).to.have.lengthOf(2);
      expect(result.cols[0].metadata.colId).to.equal('col-123');
      expect(result.cols[1].error).to.equal('Failed to generate');
      expect(result.hasErrors).to.be.true;
    });
  });

  describe('preloadPopularCols', () => {
    it('should preload popular cols for all device types', async () => {
      const region = 'western-europe';
      const popularCols = [
        { id: 'col-123', name: 'Popular Col 1' },
        { id: 'col-456', name: 'Popular Col 2' }
      ];
      
      colServiceStub.getPopularCols.resolves(popularCols);
      
      await col3DService.preloadPopularCols(region);
      
      expect(colServiceStub.getPopularCols.calledWith(region, 10)).to.be.true;
      expect(col3DService._preloadPopularCols.called).to.be.true;
    });
  });

  describe('_generateMesh', () => {
    beforeEach(() => {
      // Restore the stub to test the actual implementation
      col3DService._generateMesh.restore();
    });

    it('should generate mesh from col data with elevation profile', () => {
      const colData = {
        id: 'col-123',
        name: 'Test Col',
        elevationProfile: [
          { distance: 0, elevation: 800 },
          { distance: 1, elevation: 900 },
          { distance: 2, elevation: 1000 },
          { distance: 3, elevation: 1100 },
          { distance: 4, elevation: 1200 }
        ],
        length: 4,
        startElevation: 800,
        maxElevation: 1200
      };
      
      const result = col3DService._generateMesh(colData);
      
      expect(result).to.have.property('vertices');
      expect(result).to.have.property('faces');
      expect(result.vertices.length).to.be.greaterThan(0);
      expect(result.faces.length).to.be.greaterThan(0);
    });

    it('should handle cols without elevation profile', () => {
      const colData = {
        id: 'col-123',
        name: 'Test Col',
        elevation: 1200,
        length: 4,
        startElevation: 800,
        maxElevation: 1200
      };
      
      const result = col3DService._generateMesh(colData);
      
      expect(result).to.have.property('vertices');
      expect(result).to.have.property('faces');
    });
  });

  describe('_optimizeMesh', () => {
    beforeEach(() => {
      // Restore the stub to test the actual implementation
      col3DService._optimizeMesh.restore();
    });

    it('should optimize mesh based on device performance', () => {
      const mesh = {
        vertices: new Array(3000).fill(0),
        faces: new Array(1000).fill(0)
      };
      const device = { type: 'mobile', performance: 'low' };
      
      const result = col3DService._optimizeMesh(mesh, device);
      
      expect(result.vertices.length).to.be.lessThan(mesh.vertices.length);
      expect(result.faces.length).to.be.lessThan(mesh.faces.length);
    });

    it('should not optimize mesh for high performance devices', () => {
      const mesh = {
        vertices: new Array(3000).fill(0),
        faces: new Array(1000).fill(0)
      };
      const device = { type: 'desktop', performance: 'high' };
      
      const result = col3DService._optimizeMesh(mesh, device);
      
      expect(result.vertices.length).to.equal(mesh.vertices.length);
      expect(result.faces.length).to.equal(mesh.faces.length);
    });
  });

  describe('getFlythrough', () => {
    it('should generate flythrough animation data', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      const options = { duration: 60, quality: 'high' };
      
      const colData = {
        id: colId,
        name: 'Test Col',
        elevationProfile: Array(100).fill().map((_, i) => ({ 
          distance: i / 10, 
          elevation: 800 + i * 4,
          coordinates: [45.5 + i/1000, 6.5 + i/1000]
        })),
        length: 10,
        startElevation: 800,
        maxElevation: 1200
      };
      
      const visualization = {
        mesh: { vertices: [], faces: [] },
        metadata: { colId }
      };
      
      colServiceStub.getColById.resolves(colData);
      sinon.stub(col3DService, 'getCol3DVisualization').resolves(visualization);
      
      const result = await col3DService.getFlythrough(colId, region, options);
      
      expect(colServiceStub.getColById.calledWith(colId, region)).to.be.true;
      expect(col3DService.getCol3DVisualization.calledWith(colId, region)).to.be.true;
      expect(result).to.have.property('keyframes');
      expect(result).to.have.property('duration');
      expect(result).to.have.property('visualization');
      expect(result.keyframes.length).to.be.greaterThan(0);
      expect(result.duration).to.equal(options.duration);
    });

    it('should handle errors and return appropriate message', async () => {
      const colId = 'col-123';
      const region = 'western-europe';
      
      colServiceStub.getColById.rejects(new Error('Col not found'));
      
      const result = await col3DService.getFlythrough(colId, region);
      
      expect(result).to.have.property('error');
      expect(result.error).to.include('Failed to generate flythrough');
    });
  });
});
