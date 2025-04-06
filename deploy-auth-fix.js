/**
 * Deployment script to test authentication fix
 * 
 * This script facilitates the deployment of the Velo-Altitude application
 * with the authentication fixes we've implemented.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Helper function to execute commands and log output
function runCommand(command, directory) {
  console.log(`\n\x1b[36m> ${command}\x1b[0m`);
  try {
    const output = execSync(command, { 
      cwd: directory || process.cwd(),
      stdio: 'inherit' 
    });
    return true;
  } catch (error) {
    console.error(`\x1b[31mCommand failed: ${command}\x1b[0m`);
    console.error(error.message);
    return false;
  }
}

// Main deployment function
async function deploy() {
  console.log('\n\x1b[32m=== AUTHENTICATION FIX DEPLOYMENT ===\x1b[0m');
  console.log('This script will build and prepare your project for deployment to Netlify');
  
  const clientDir = path.join(__dirname, 'client');
  
  // Verify auth files exist
  console.log('\n\x1b[33m1. Verifying authentication files...\x1b[0m');
  
  const authUnifiedPath = path.join(clientDir, 'src', 'auth', 'AuthUnified.js');
  const authOverridePath = path.join(clientDir, 'public', 'auth-override.js');
  
  if (!fs.existsSync(authUnifiedPath)) {
    console.error(`\x1b[31mERROR: AuthUnified.js not found at ${authUnifiedPath}\x1b[0m`);
    process.exit(1);
  }
  
  if (!fs.existsSync(authOverridePath)) {
    console.error(`\x1b[31mERROR: auth-override.js not found at ${authOverridePath}\x1b[0m`);
    process.exit(1);
  }
  
  console.log('\x1b[32m✓ Authentication files verified successfully\x1b[0m');
  
  // Install dependencies if needed
  console.log('\n\x1b[33m2. Installing dependencies...\x1b[0m');
  if (!runCommand('npm install', clientDir)) {
    process.exit(1);
  }
  
  // Build the client app
  console.log('\n\x1b[33m3. Building React application...\x1b[0m');
  if (!runCommand('npm run build', clientDir)) {
    process.exit(1);
  }
  
  // Copy Netlify configuration
  console.log('\n\x1b[33m4. Configuring Netlify deployment...\x1b[0m');
  const netlifyTomlPath = path.join(__dirname, 'netlify.toml');
  if (!fs.existsSync(netlifyTomlPath)) {
    console.log('Creating netlify.toml configuration...');
    fs.writeFileSync(netlifyTomlPath, `[build]
  base = "client"
  publish = "build"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = true
`);
  }
  
  // Preparing for deployment
  console.log('\n\x1b[32m✓ Build completed successfully!\x1b[0m');
  console.log('\n\x1b[33mNext steps for deploying to Netlify:\x1b[0m');
  console.log('1. Deploy using the Netlify CLI: \x1b[36mnpx netlify deploy\x1b[0m');
  console.log('2. OR deploy manually by uploading the build folder to Netlify');
  console.log('\n\x1b[32m=== DEPLOYMENT PREPARATION COMPLETED ===\x1b[0m');
}

// Execute the deployment function
deploy().catch(err => {
  console.error('\n\x1b[31mDeployment failed:\x1b[0m', err);
  process.exit(1);
});
