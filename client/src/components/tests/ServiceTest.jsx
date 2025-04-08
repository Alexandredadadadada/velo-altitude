import React, { useState, useEffect } from 'react';
import nutritionService from '../../services/nutritionService';
import optimizedDataService from '../../services/optimizedDataService';

/**
 * Composant de test pour vérifier le fonctionnement des services refactorisés
 */
const ServiceTest = () => {
  const [nutritionData, setNutritionData] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [cols, setCols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = 'test-user-id'; // ID utilisateur de test

  useEffect(() => {
    const testServices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Test du service de nutrition
        console.log('Testing nutrition service...');
        const nutritionResult = await nutritionService.getUserNutritionData(userId);
        setNutritionData(nutritionResult);
        
        const recipesResult = await nutritionService.getRecipes();
        setRecipes(recipesResult);
        
        // Test du service de données optimisées
        console.log('Testing optimized data service...');
        const colsResult = await optimizedDataService.getColData(null);
        setCols(colsResult);
        
        console.log('All services tested successfully!');
      } catch (err) {
        console.error('Error testing services:', err);
        setError(err.message || 'Une erreur est survenue lors du test des services');
      } finally {
        setLoading(false);
      }
    };
    
    testServices();
  }, []);

  return (
    <div className="service-test container mt-5">
      <h1>Test des Services Refactorisés</h1>
      
      {loading && <p className="alert alert-info">Chargement des données...</p>}
      
      {error && (
        <div className="alert alert-danger">
          <h3>Erreur</h3>
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && (
        <div className="results">
          <div className="card mb-4">
            <div className="card-header">
              <h2>Données de Nutrition</h2>
            </div>
            <div className="card-body">
              <pre>{JSON.stringify(nutritionData, null, 2)}</pre>
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h2>Recettes ({recipes.length})</h2>
            </div>
            <div className="card-body">
              {recipes.length > 0 ? (
                <ul className="list-group">
                  {recipes.slice(0, 5).map((recipe, index) => (
                    <li key={index} className="list-group-item">
                      {recipe.name || recipe.title}
                    </li>
                  ))}
                  {recipes.length > 5 && <li className="list-group-item text-muted">...et {recipes.length - 5} autres</li>}
                </ul>
              ) : (
                <p>Aucune recette trouvée</p>
              )}
            </div>
          </div>
          
          <div className="card mb-4">
            <div className="card-header">
              <h2>Cols ({cols.length})</h2>
            </div>
            <div className="card-body">
              {cols.length > 0 ? (
                <ul className="list-group">
                  {cols.slice(0, 5).map((col, index) => (
                    <li key={index} className="list-group-item">
                      {col.name} ({col.elevation}m)
                    </li>
                  ))}
                  {cols.length > 5 && <li className="list-group-item text-muted">...et {cols.length - 5} autres</li>}
                </ul>
              ) : (
                <p>Aucun col trouvé</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4">
        <h3>Console</h3>
        <p className="text-muted">Vérifiez la console du navigateur pour les détails des tests et les éventuelles erreurs</p>
      </div>
    </div>
  );
};

export default ServiceTest;
