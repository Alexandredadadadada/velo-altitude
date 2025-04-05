import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ColVisualization3D from './visualization/ColVisualization3D';
import ColComparison from './visualization/ColComparison';
import AlternativeRoutes from './visualization/AlternativeRoutes';
import WeatherDashboard from './weather/WeatherDashboard';
import TrainingModule from './training/TrainingModule';
import SocialHub from './social/SocialHub';
import WidgetManager from './dashboard/WidgetManager';
import './Dashboard.css';

// Mock API service for fetching cols data
const fetchColsList = async () => {
  try {
    // Simulate API call - replace with actual API call
    return [
      { id: '1', name: 'Col du Galibier', elevation: 2642 },
      { id: '2', name: 'Col de la Planche des Belles Filles', elevation: 1148 },
      { id: '3', name: 'Mont Ventoux', elevation: 1909 },
      { id: '4', name: 'Ballon d\'Alsace', elevation: 1247 }
    ];
  } catch (error) {
    console.error('Error fetching cols list:', error);
    return [];
  }
};

// Mock API service for fetching routes data
const fetchRoutesList = async () => {
  try {
    // Simulate API call - replace with actual API call
    return [
      { id: '1', name: 'Route des Crêtes', mainPass: '1' },
      { id: '2', name: 'Circuit des Ballons', mainPass: '4' },
      { id: '3', name: 'Ascension du Ventoux', mainPass: '3' }
    ];
  } catch (error) {
    console.error('Error fetching routes list:', error);
    return [];
  }
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [loading, setLoading] = useState(true);
  const [cols, setCols] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedCol, setSelectedCol] = useState(null);
  const [selectedCols, setSelectedCols] = useState({ col1: null, col2: null });
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [weatherRouteData, setWeatherRouteData] = useState(null);
  const [socialView, setSocialView] = useState('feed');
  const [userData, setUserData] = useState(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [colsData, routesData] = await Promise.all([
          fetchColsList(),
          fetchRoutesList()
        ]);

        setCols(colsData);
        setRoutes(routesData);

        // Set default selections if data is available
        if (colsData.length > 0) {
          setSelectedCol(colsData[0].id);
          setSelectedCols({ 
            col1: colsData[0].id, 
            col2: colsData.length > 1 ? colsData[1].id : colsData[0].id 
          });
        }

        if (routesData.length > 0) {
          setSelectedRoute(routesData[0].id);
        }

        // Load weather route data
        const fetchWeatherRouteData = async () => {
          try {
            // Mock data - would be replaced by real API call
            const mockData = {
              id: 'route-1',
              name: 'Route des Crêtes',
              mainRoute: {
                coordinates: [
                  [45.0, 6.4],
                  [45.05, 6.42],
                  [45.1, 6.45],
                  [45.15, 6.48],
                  [45.2, 6.5]
                ],
                surfaceType: 'asphalt'
              },
              elevationData: {
                width: 100,
                heights: Array(100).fill().map(() => Array(100).fill().map(() => Math.random() * 100))
              }
            };

            setWeatherRouteData(mockData);
          } catch (error) {
            console.error('Error fetching weather route data:', error);
          }
        };

        fetchWeatherRouteData();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Prepare sample data for the 3D visualization
  const sampleElevationData = {
    width: 10,
    heights: Array(10).fill().map(() => Array(10).fill(100).map(() => Math.random() * 200 + 800))
  };

  const sampleSurfaceTypes = {
    dominant: 'asphalt',
    sections: [
      { start: 0, end: 50, type: 'asphalt' },
      { start: 50, end: 75, type: 'gravel' },
      { start: 75, end: 100, type: 'dirt' }
    ]
  };

  const samplePointsOfInterest = [
    { x: 1, z: 2, elevation: 120, name: 'Viewpoint', type: 'panorama' },
    { x: 5, z: 5, elevation: 140, name: 'Water Source', type: 'water' },
    { x: 8, z: 3, elevation: 110, name: 'Danger Zone', type: 'danger' }
  ];

  // Prepare navigation tabs
  const navigationTabs = [
    { id: 'dashboard', label: t('dashboard') }, 
    { id: 'visualization3D', label: t('3dVisualization') },
    { id: 'comparison', label: t('colsComparison') },
    { id: 'alternativeRoutes', label: t('alternativeRoutes') },
    { id: 'weatherDashboard', label: t('weatherDashboard') },
    { id: 'trainingModule', label: t('training') },
    { id: 'socialHub', label: t('socialHub') }
  ];

  // Handle social sub-navigation
  const handleSocialViewChange = (view) => {
    setSocialView(view);
  };

  if (loading) {
    return <div className="dashboard-loading">{t('loading')}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>{t('cyclingDashboard')}</h1>
        <div className="language-selector">
          {/* Language selector could be added here */}
        </div>
      </div>

      <div className="dashboard-navigation">
        {navigationTabs.map(tab => (
          <button 
            key={tab.id} 
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-tab">
            <WidgetManager />
          </div>
        )}
      
        {activeTab === 'visualization3D' && (
          <div className="visualization-tab">
            <div className="visualization-selector">
              <label htmlFor="col-select">{t('selectCol')}: </label>
              <select 
                id="col-select"
                value={selectedCol || ''}
                onChange={(e) => setSelectedCol(e.target.value)}
              >
                {cols.map(col => (
                  <option key={col.id} value={col.id}>{col.name} ({col.elevation}m)</option>
                ))}
              </select>
            </div>

            <div className="visualization-container">
              {selectedCol && (
                <ColVisualization3D 
                  passId={selectedCol}
                  elevationData={sampleElevationData}
                  surfaceTypes={sampleSurfaceTypes}
                  pointsOfInterest={samplePointsOfInterest}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="comparison-tab">
            <div className="comparison-selector">
              <div>
                <label htmlFor="col1-select">{t('firstCol')}: </label>
                <select 
                  id="col1-select"
                  value={selectedCols.col1 || ''}
                  onChange={(e) => setSelectedCols({...selectedCols, col1: e.target.value})}
                >
                  {cols.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="col2-select">{t('secondCol')}: </label>
                <select 
                  id="col2-select"
                  value={selectedCols.col2 || ''}
                  onChange={(e) => setSelectedCols({...selectedCols, col2: e.target.value})}
                >
                  {cols.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="comparison-container">
              {selectedCols.col1 && selectedCols.col2 && (
                <ColComparison 
                  pass1Id={selectedCols.col1}
                  pass2Id={selectedCols.col2}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'alternativeRoutes' && (
          <div className="alternatives-tab">
            <div className="route-selector">
              <label htmlFor="route-select">{t('selectRoute')}: </label>
              <select 
                id="route-select"
                value={selectedRoute || ''}
                onChange={(e) => setSelectedRoute(e.target.value)}
              >
                {routes.map(route => (
                  <option key={route.id} value={route.id}>{route.name}</option>
                ))}
              </select>
            </div>

            <div className="alternatives-container">
              {selectedRoute && (
                <AlternativeRoutes mainRouteId={selectedRoute} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'weatherDashboard' && weatherRouteData && (
          <div className="weather-dashboard-tab">
            <WeatherDashboard 
              routeId="route-1"
              routeData={weatherRouteData}
            />
          </div>
        )}

        {activeTab === 'trainingModule' && (
          <div className="training-module-tab">
            <TrainingModule />
          </div>
        )}

        {activeTab === 'socialHub' && (
          <div className="social-hub-tab">
            <SocialHub 
              userId="user123" 
              initialView={socialView}
              onViewChange={handleSocialViewChange}
            />
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <p> 2025 Grand Est Cyclisme</p>
      </div>
    </div>
  );
};

export default Dashboard;
