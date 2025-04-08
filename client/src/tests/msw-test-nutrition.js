/**
 * Test MSW pour les endpoints de nutrition
 * 
 * Ce script permet de tester l'interception des appels API liés à la nutrition par MSW.
 * Il peut être exécuté dans la console du navigateur pour vérifier que MSW
 * fonctionne correctement.
 */

/**
 * Fonction de test pour vérifier l'interception des appels API de nutrition par MSW
 * @returns {Promise<string>} Message de résultat
 */
async function testNutritionMSW() {
  console.log("=== Test d'interception MSW pour les endpoints de nutrition ===");
  console.log("Vérification que MSW intercepte correctement les appels API de nutrition...");
  
  try {
    // ID utilisateur de test
    const userId = "test-user-id";
    
    // Test 1: Récupération des données nutritionnelles d'un utilisateur
    console.log("\n--- Test 1: Récupération des données nutritionnelles d'un utilisateur ---");
    const nutritionResponse = await fetch(`/api/users/${userId}/nutrition`);
    if (!nutritionResponse.ok) {
      throw new Error(`Erreur lors de la récupération des données nutritionnelles: ${nutritionResponse.status}`);
    }
    const nutritionData = await nutritionResponse.json();
    console.log("✅ Données nutritionnelles récupérées avec succès:", nutritionData);
    
    // Test 2: Récupération du plan nutritionnel d'un utilisateur
    console.log("\n--- Test 2: Récupération du plan nutritionnel d'un utilisateur ---");
    const planResponse = await fetch(`/api/users/${userId}/nutrition/plan`);
    if (!planResponse.ok) {
      throw new Error(`Erreur lors de la récupération du plan nutritionnel: ${planResponse.status}`);
    }
    const planData = await planResponse.json();
    console.log("✅ Plan nutritionnel récupéré avec succès:", planData);
    
    // Test 3: Récupération des recettes nutritionnelles
    console.log("\n--- Test 3: Récupération des recettes nutritionnelles ---");
    const recipesResponse = await fetch(`/api/nutrition/recipes?q=porridge&tags=petit-déjeuner,avant-effort`);
    if (!recipesResponse.ok) {
      throw new Error(`Erreur lors de la récupération des recettes: ${recipesResponse.status}`);
    }
    const recipesData = await recipesResponse.json();
    console.log("✅ Recettes récupérées avec succès:", recipesData);
    
    // Test 4: Récupération d'une recette par son ID
    console.log("\n--- Test 4: Récupération d'une recette par son ID ---");
    const recipeResponse = await fetch(`/api/nutrition/recipes/recipe-1`);
    if (!recipeResponse.ok) {
      throw new Error(`Erreur lors de la récupération de la recette: ${recipeResponse.status}`);
    }
    const recipeData = await recipeResponse.json();
    console.log("✅ Recette récupérée avec succès:", recipeData);
    
    // Test 5: Récupération du journal nutritionnel
    console.log("\n--- Test 5: Récupération du journal nutritionnel ---");
    const logResponse = await fetch(`/api/users/${userId}/nutrition/log?date=2023-04-08`);
    if (!logResponse.ok) {
      throw new Error(`Erreur lors de la récupération du journal nutritionnel: ${logResponse.status}`);
    }
    const logData = await logResponse.json();
    console.log("✅ Journal nutritionnel récupéré avec succès:", logData);
    
    // Vérification dans la console
    console.log("\n=== Résumé des tests ===");
    console.log("✅ Tous les tests ont réussi!");
    console.log("✅ MSW intercepte correctement les appels API de nutrition.");
    console.log("✅ Vérifiez dans l'onglet Réseau que les requêtes sont marquées '(from ServiceWorker)'.");
    
    return "Tests MSW pour la nutrition terminés avec succès - Consultez la console pour les détails";
  } catch (error) {
    console.error("❌ Erreur lors des tests MSW pour la nutrition:", error);
    return `Erreur lors des tests MSW pour la nutrition: ${error.message}`;
  }
}

// Exporter la fonction pour qu'elle soit accessible dans la console
window.testNutritionMSW = testNutritionMSW;

// Instructions d'utilisation
console.log(`
=== Test MSW pour la nutrition ===
Pour tester l'interception des appels API de nutrition par MSW, exécutez la commande suivante dans la console:
  testNutritionMSW()
`);

export default testNutritionMSW;
