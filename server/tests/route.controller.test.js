/**
 * Tests pour le contrôleur d'itinéraires
 */
const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const mongoose = require('mongoose');
const { expect } = chai;

// Configuration de Chai
chai.use(chaiHttp);

// Modules à mocker
const openRouteService = require('../services/openroute.service');
const errorService = require('../services/error.service').getInstance();
const cacheService = require('../services/cache.service').getInstance();

// Contrôleur à tester
const routeController = require('../controllers/route.controller');

// Modèles
const Route = require('../models/route.model');
const User = require('../models/user.model');

describe('Route Controller', () => {
  let req, res, next;
  let openRouteServiceStub, errorServiceStub, cacheServiceStub;
  let routeModelStub, userModelStub;
  
  beforeEach(() => {
    // Réinitialiser les stubs pour chaque test
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'user123', userId: 'user123' },
      pagination: { skip: 0, limit: 10 }
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis(),
      send: sinon.stub().returnsThis()
    };
    
    next = sinon.stub();
    
    // Créer des stubs pour les services
    openRouteServiceStub = sinon.stub(openRouteService);
    errorServiceStub = sinon.stub(errorService, 'sendErrorResponse');
    cacheServiceStub = {
      get: sinon.stub(),
      set: sinon.stub()
    };
    
    // Stubs pour les modèles
    routeModelStub = sinon.stub(Route);
    userModelStub = sinon.stub(User);
  });
  
  afterEach(() => {
    // Restaurer les stubs après chaque test
    sinon.restore();
  });
  
  describe('calculateRoute', () => {
    it('devrait calculer un itinéraire avec succès', async () => {
      // Données de test
      const routeData = {
        type: 'FeatureCollection',
        features: [{ /* ... */ }],
        metadata: { /* ... */ }
      };
      
      // Configuration des stubs
      req.body = {
        start: [5.5, 48.7],
        end: [5.6, 48.8],
        waypoints: [[5.55, 48.75]],
        profile: 'cycling-road'
      };
      
      openRouteServiceStub.getRoute.resolves(routeData);
      
      // Appel de la méthode
      await routeController.calculateRoute(req, res);
      
      // Vérifications
      expect(openRouteServiceStub.getRoute.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('data', routeData);
    });
    
    it('devrait gérer les erreurs lors du calcul d\'itinéraire', async () => {
      // Configuration des stubs
      req.body = {
        start: [5.5, 48.7],
        end: [5.6, 48.8]
      };
      
      const error = new Error('API error');
      openRouteServiceStub.getRoute.rejects(error);
      
      // Appel de la méthode
      await routeController.calculateRoute(req, res);
      
      // Vérifications
      expect(openRouteServiceStub.getRoute.calledOnce).to.be.true;
      expect(errorServiceStub.sendErrorResponse.calledOnce).to.be.true;
    });
  });
  
  describe('calculateIsochrone', () => {
    it('devrait calculer une isochrone avec succès', async () => {
      // Données de test
      const isochroneData = {
        type: 'FeatureCollection',
        features: [{ /* ... */ }]
      };
      
      // Configuration des stubs
      req.body = {
        center: [5.5, 48.7],
        range: 30,
        rangeType: 'time',
        profile: 'cycling-road'
      };
      
      openRouteServiceStub.getIsochrone.resolves(isochroneData);
      
      // Appel de la méthode
      await routeController.calculateIsochrone(req, res);
      
      // Vérifications
      expect(openRouteServiceStub.getIsochrone.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('data', isochroneData);
    });
  });
  
  describe('getElevation', () => {
    it('devrait récupérer les données d\'élévation avec succès', async () => {
      // Données de test
      const elevationData = {
        elevation: [100, 120, 150, 130, 110]
      };
      
      // Configuration des stubs
      req.body = {
        points: [[5.5, 48.7], [5.6, 48.8], [5.7, 48.9]]
      };
      
      openRouteServiceStub.getElevation.resolves(elevationData);
      
      // Appel de la méthode
      await routeController.getElevation(req, res);
      
      // Vérifications
      expect(openRouteServiceStub.getElevation.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
      expect(res.json.firstCall.args[0]).to.have.property('data', elevationData);
    });
  });
  
  describe('getSavedRoutes', () => {
    it('devrait récupérer les itinéraires enregistrés avec succès', async () => {
      // Données de test
      const routes = [
        { _id: 'route1', name: 'Route 1', distance: 10 },
        { _id: 'route2', name: 'Route 2', distance: 20 }
      ];
      
      // Configuration des stubs
      const findStub = {
        sort: sinon.stub().returnsThis(),
        skip: sinon.stub().returnsThis(),
        limit: sinon.stub().returnsThis(),
        select: sinon.stub().resolves(routes)
      };
      
      Route.find = sinon.stub().returns(findStub);
      Route.countDocuments = sinon.stub().resolves(2);
      
      // Appel de la méthode
      await routeController.getSavedRoutes(req, res);
      
      // Vérifications
      expect(Route.find.calledOnce).to.be.true;
      expect(Route.countDocuments.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('success', true);
      expect(response.data).to.deep.equal(routes);
      expect(response.pagination).to.have.property('total', 2);
    });
  });
  
  describe('getRouteById', () => {
    it('devrait récupérer un itinéraire par ID avec succès', async () => {
      // Données de test
      const route = {
        _id: 'route123',
        name: 'Test Route',
        distance: 15,
        user: 'user123',
        views: 5,
        save: sinon.stub().resolves()
      };
      
      // Configuration des stubs
      req.params.id = 'route123';
      Route.findById = sinon.stub().resolves(route);
      
      // Appel de la méthode
      await routeController.getRouteById(req, res);
      
      // Vérifications
      expect(Route.findById.calledOnce).to.be.true;
      expect(route.save.calledOnce).to.be.true; // Pour incrémenter les vues
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('success', true);
      expect(response.data).to.deep.equal(route);
    });
    
    it('devrait retourner une erreur si l\'itinéraire n\'existe pas', async () => {
      // Configuration des stubs
      req.params.id = 'nonexistent';
      Route.findById = sinon.stub().resolves(null);
      
      // Appel de la méthode
      await routeController.getRouteById(req, res);
      
      // Vérifications
      expect(Route.findById.calledOnce).to.be.true;
      expect(errorServiceStub.sendErrorResponse.calledOnce).to.be.true;
    });
  });
  
  describe('saveRoute', () => {
    it('devrait enregistrer un nouvel itinéraire avec succès', async () => {
      // Données de test
      const routeData = {
        name: 'Nouvelle Route',
        description: 'Description de test',
        start: [5.5, 48.7],
        end: [5.6, 48.8],
        distance: 15,
        duration: 3600,
        route: { type: 'FeatureCollection', features: [] }
      };
      
      const savedRoute = {
        _id: 'newroute123',
        ...routeData,
        user: 'user123'
      };
      
      // Configuration des stubs
      req.body = routeData;
      
      const saveStub = sinon.stub().resolves(savedRoute);
      Route.prototype.save = saveStub;
      
      // Appel de la méthode
      await routeController.saveRoute(req, res);
      
      // Vérifications
      expect(saveStub.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('success', true);
      expect(response.data).to.have.property('_id', 'newroute123');
    });
  });
  
  describe('deleteRoute', () => {
    it('devrait supprimer un itinéraire avec succès', async () => {
      // Données de test
      const route = {
        _id: 'route123',
        name: 'Route à supprimer',
        user: 'user123'
      };
      
      // Configuration des stubs
      req.params.id = 'route123';
      Route.findById = sinon.stub().resolves(route);
      Route.findByIdAndDelete = sinon.stub().resolves(route);
      
      // Appel de la méthode
      await routeController.deleteRoute(req, res);
      
      // Vérifications
      expect(Route.findById.calledOnce).to.be.true;
      expect(Route.findByIdAndDelete.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('success', true);
      expect(response).to.have.property('message').that.includes('supprimé');
    });
    
    it('devrait retourner une erreur si l\'utilisateur n\'est pas autorisé', async () => {
      // Données de test
      const route = {
        _id: 'route123',
        name: 'Route d\'un autre utilisateur',
        user: 'anotheruser'
      };
      
      // Configuration des stubs
      req.params.id = 'route123';
      Route.findById = sinon.stub().resolves(route);
      
      // Appel de la méthode
      await routeController.deleteRoute(req, res);
      
      // Vérifications
      expect(Route.findById.calledOnce).to.be.true;
      expect(Route.findByIdAndDelete.called).to.be.false;
      expect(errorServiceStub.sendErrorResponse.calledOnce).to.be.true;
    });
  });
  
  describe('shareRoute', () => {
    it('devrait partager un itinéraire avec succès', async () => {
      // Données de test
      const route = {
        _id: 'route123',
        name: 'Route à partager',
        user: 'user123',
        shares: 0,
        save: sinon.stub().resolves()
      };
      
      const recipients = [
        { _id: 'user1', email: 'user1@example.com' },
        { _id: 'user2', email: 'user2@example.com' }
      ];
      
      // Configuration des stubs
      req.params.id = 'route123';
      req.body = {
        recipients: ['user1@example.com', 'user2@example.com'],
        message: 'Voici un super itinéraire !'
      };
      
      Route.findOne = sinon.stub().resolves(route);
      User.find = sinon.stub().resolves(recipients);
      
      // Mock pour le modèle Notification
      mongoose.models = {
        Notification: {
          insertMany: sinon.stub().resolves()
        }
      };
      
      // Appel de la méthode
      await routeController.shareRoute(req, res);
      
      // Vérifications
      expect(Route.findOne.calledOnce).to.be.true;
      expect(User.find.calledOnce).to.be.true;
      expect(mongoose.models.Notification.insertMany.calledOnce).to.be.true;
      expect(route.save.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response).to.have.property('success', true);
      expect(response).to.have.property('message').that.includes('partagé');
      expect(response.data.recipients).to.have.lengthOf(2);
    });
  });
});
