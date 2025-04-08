/**
 * API Validation Script
 * 
 * This script validates all RealApiOrchestrator endpoints against the real backend.
 * It tests both public and protected endpoints and documents any discrepancies.
 */

import RealApiOrchestrator from '../services/api/RealApiOrchestrator';
import { getAccessToken } from '../auth';

// Helper to format validation results
const formatResult = (endpoint, success, response, error) => ({
  endpoint,
  success,
  timestamp: new Date().toISOString(),
  response: success ? response : null,
  error: !success ? (error?.response?.data || error?.message || String(error)) : null,
  statusCode: error?.response?.status,
});

// Helper to log results
const logResult = (result) => {
  const status = result.success ? '✅ PASSED' : '❌ FAILED';
  console.log(`[${status}] ${result.endpoint}`);
  
  if (result.success) {
    console.log('  Response:', typeof result.response === 'object' ? 'Object with keys: ' + Object.keys(result.response).join(', ') : result.response);
  } else {
    console.log('  Error:', result.error);
    if (result.statusCode) console.log('  Status:', result.statusCode);
  }
  console.log('\n');
};

// Main validation function
const validateApiEndpoints = async () => {
  const results = [];
  
  // Obtenir le token de manière asynchrone
  let token = null;
  try {
    token = await getAccessToken();
  } catch (error) {
    console.error('Failed to get authentication token:', error);
  }
  
  console.log('API Validation Started');
  console.log('Authentication token available:', !!token);
  console.log('-----------------------------------\n');
  
  // Test Public Endpoints (No Auth Required)
  console.log('TESTING PUBLIC ENDPOINTS\n');
  
  // Testing cols endpoints
  try {
    console.log('Testing getAllCols()...');
    const cols = await RealApiOrchestrator.getAllCols();
    results.push(formatResult('getAllCols', true, cols));
    logResult(results[results.length - 1]);
    
    if (cols && cols.length > 0) {
      // Test single col endpoint with real ID
      try {
        const colId = cols[0].id;
        console.log(`Testing getColById('${colId}')...`);
        const col = await RealApiOrchestrator.getColById(colId);
        results.push(formatResult(`getColById('${colId}')`, true, col));
        logResult(results[results.length - 1]);
      } catch (error) {
        results.push(formatResult(`getColById with ID from getAllCols`, false, null, error));
        logResult(results[results.length - 1]);
      }
      
      // Test search cols with a term from a real col
      if (cols[0].name) {
        try {
          const searchTerm = cols[0].name.split(' ')[0]; // Use first word of col name
          console.log(`Testing searchCols('${searchTerm}')...`);
          const searchResults = await RealApiOrchestrator.searchCols(searchTerm);
          results.push(formatResult(`searchCols('${searchTerm}')`, true, searchResults));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`searchCols with term from real col`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
      
      // Test region filtering if region data is available
      if (cols[0].region) {
        try {
          const region = cols[0].region;
          console.log(`Testing getColsByRegion('${region}')...`);
          const regionCols = await RealApiOrchestrator.getColsByRegion(region);
          results.push(formatResult(`getColsByRegion('${region}')`, true, regionCols));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`getColsByRegion with region from real col`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
      
      // Test difficulty filtering if difficulty data is available
      if (cols[0].difficulty) {
        try {
          const difficulty = cols[0].difficulty;
          console.log(`Testing getColsByDifficulty('${difficulty}')...`);
          const difficultyCols = await RealApiOrchestrator.getColsByDifficulty(difficulty);
          results.push(formatResult(`getColsByDifficulty('${difficulty}')`, true, difficultyCols));
          logResult(results[results.length - 1]);
        } catch (error) {
          results.push(formatResult(`getColsByDifficulty with difficulty from real col`, false, null, error));
          logResult(results[results.length - 1]);
        }
      }
    }
  } catch (error) {
    results.push(formatResult('Public Col Endpoints', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Testing weather endpoints
  try {
    // Get a valid colId first (if available from previous tests)
    let colId = null;
    const colsResult = results.find(r => r.endpoint === 'getAllCols' && r.success);
    if (colsResult && colsResult.response && colsResult.response.length > 0) {
      colId = colsResult.response[0].id;
    }
    
    if (colId) {
      console.log(`Testing getColWeather('${colId}')...`);
      const weather = await RealApiOrchestrator.getColWeather(colId);
      results.push(formatResult(`getColWeather('${colId}')`, true, weather));
      logResult(results[results.length - 1]);
      
      console.log(`Testing getWeatherForecast('${colId}')...`);
      const forecast = await RealApiOrchestrator.getWeatherForecast(colId);
      results.push(formatResult(`getWeatherForecast('${colId}')`, true, forecast));
      logResult(results[results.length - 1]);
    } else {
      console.log('Skipping weather tests - no valid colId available');
    }
    
    // Test location weather with fixed coordinates
    console.log(`Testing getLocationWeather(45.5, 6.5)...`);
    const locationWeather = await RealApiOrchestrator.getLocationWeather(45.5, 6.5);
    results.push(formatResult(`getLocationWeather(45.5, 6.5)`, true, locationWeather));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('Weather Endpoints', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Test Majeurs7 challenges (public list)
  try {
    console.log('Testing getAllMajeurs7Challenges()...');
    const challenges = await RealApiOrchestrator.getAllMajeurs7Challenges();
    results.push(formatResult('getAllMajeurs7Challenges', true, challenges));
    logResult(results[results.length - 1]);
    
    if (challenges && challenges.length > 0) {
      const challengeId = challenges[0].id;
      console.log(`Testing getMajeurs7Challenge('${challengeId}')...`);
      const challenge = await RealApiOrchestrator.getMajeurs7Challenge(challengeId);
      results.push(formatResult(`getMajeurs7Challenge('${challengeId}')`, true, challenge));
      logResult(results[results.length - 1]);
    }
  } catch (error) {
    results.push(formatResult('Majeurs7 Endpoints', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // Test global search
  try {
    console.log('Testing searchGlobal("col")...');
    const searchResults = await RealApiOrchestrator.searchGlobal('col');
    results.push(formatResult('searchGlobal("col")', true, searchResults));
    logResult(results[results.length - 1]);
  } catch (error) {
    results.push(formatResult('searchGlobal', false, null, error));
    logResult(results[results.length - 1]);
  }
  
  // 🔐 PROTECTED ENDPOINTS (Require Authentication)
  console.log('\n\nTESTING PROTECTED ENDPOINTS\n');
  
  if (!token) {
    console.log('⚠️ No authentication token available. Skipping protected endpoints.');
  } else {
    // Testing user profile endpoints
    try {
      // Note: This assumes you have a way to get the current user's ID
      // In a real implementation, you might need to extract this from the token
      // or have it stored somewhere else
      const userId = 'current-user-id';  // Replace with actual user ID if available
      
      console.log(`Testing getUserProfile('${userId}')...`);
      const profile = await RealApiOrchestrator.getUserProfile(userId);
      results.push(formatResult(`getUserProfile('${userId}')`, true, profile));
      logResult(results[results.length - 1]);
      
      // Don't actually update the profile in this test
      /*
      console.log(`Testing updateUserProfile('${userId}', {...})...`);
      const updatedProfile = await RealApiOrchestrator.updateUserProfile(userId, { 
        preferredTheme: profile.preferredTheme === 'dark' ? 'light' : 'dark' 
      });
      results.push(formatResult(`updateUserProfile('${userId}')`, true, updatedProfile));
      logResult(results[results.length - 1]);
      */
      
      console.log(`Testing getUserActivities('${userId}')...`);
      const activities = await RealApiOrchestrator.getUserActivities(userId);
      results.push(formatResult(`getUserActivities('${userId}')`, true, activities));
      logResult(results[results.length - 1]);
    } catch (error) {
      results.push(formatResult('User Profile Endpoints', false, null, error));
      logResult(results[results.length - 1]);
    }
    
    // Testing training endpoints
    try {
      const userId = 'current-user-id';  // Replace with actual user ID if available
      
      console.log(`Testing getUserTrainingPlans('${userId}')...`);
      const plans = await RealApiOrchestrator.getUserTrainingPlans(userId);
      results.push(formatResult(`getUserTrainingPlans('${userId}')`, true, plans));
      logResult(results[results.length - 1]);
      
      console.log(`Testing getFTPHistory('${userId}')...`);
      const ftpHistory = await RealApiOrchestrator.getFTPHistory(userId);
      results.push(formatResult(`getFTPHistory('${userId}')`, true, ftpHistory));
      logResult(results[results.length - 1]);
    } catch (error) {
      results.push(formatResult('Training Endpoints', false, null, error));
      logResult(results[results.length - 1]);
    }
    
    // Testing nutrition endpoints
    try {
      const userId = 'current-user-id';  // Replace with actual user ID if available
      
      console.log(`Testing getUserNutritionPlan('${userId}')...`);
      const nutritionPlan = await RealApiOrchestrator.getUserNutritionPlan(userId);
      results.push(formatResult(`getUserNutritionPlan('${userId}')`, true, nutritionPlan));
      logResult(results[results.length - 1]);
      
      // Get today's date for nutrition log in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];
      console.log(`Testing getNutritionLog('${userId}', '${today}')...`);
      const nutritionLog = await RealApiOrchestrator.getNutritionLog(userId, today);
      results.push(formatResult(`getNutritionLog('${userId}', '${today}')`, true, nutritionLog));
      logResult(results[results.length - 1]);
    } catch (error) {
      results.push(formatResult('Nutrition Endpoints', false, null, error));
      logResult(results[results.length - 1]);
    }
  }
  
  // Generate summary
  console.log('\n\n-----------------------------------');
  console.log('API VALIDATION SUMMARY');
  console.log('-----------------------------------');
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} (${Math.round(passedTests/totalTests*100)}%)`);
  console.log(`Failed: ${failedTests} (${Math.round(failedTests/totalTests*100)}%)`);
  
  if (failedTests > 0) {
    console.log('\nFailed Endpoints:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`- ${result.endpoint}: ${result.error} (Status: ${result.statusCode || 'N/A'})`);
    });
  }
  
  return {
    results,
    summary: {
      totalTests,
      passedTests,
      failedTests,
      date: new Date().toISOString(),
    }
  };
};

// Run the validation if this script is executed directly
if (typeof window !== 'undefined' && window.document) {
  console.log('Run this script in a Node.js environment for best results');
  
  // Add a button to the DOM to run the validation
  const button = document.createElement('button');
  button.innerText = 'Run API Validation';
  button.style.padding = '10px';
  button.style.margin = '20px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.onclick = async () => {
    const resultsContainer = document.createElement('pre');
    resultsContainer.style.padding = '20px';
    resultsContainer.style.backgroundColor = '#f5f5f5';
    resultsContainer.style.border = '1px solid #ddd';
    resultsContainer.style.borderRadius = '4px';
    resultsContainer.style.overflow = 'auto';
    resultsContainer.style.maxHeight = '80vh';
    
    document.body.appendChild(resultsContainer);
    
    resultsContainer.innerText = 'Running API validation...\n\n';
    
    try {
      const oldLog = console.log;
      console.log = (...args) => {
        oldLog(...args);
        resultsContainer.innerText += args.join(' ') + '\n';
      };
      
      await validateApiEndpoints();
      
      console.log = oldLog;
    } catch (error) {
      resultsContainer.innerText += `\n\nError running validation: ${error.message}`;
    }
  };
  
  document.body.appendChild(button);
}

export default validateApiEndpoints;
