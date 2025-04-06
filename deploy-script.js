/**
 * Velo-Altitude Authentication Fix Deployment Script
 * 
 * This script facilitates building and testing the Velo-Altitude platform
 * with the authentication fixes implemented according to the plan.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const clientDir = path.join(__dirname, 'client');
const buildDir = path.join(clientDir, 'build');

// Color formatting for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Helper function to execute commands and log output
function runCommand(command, directory, options = {}) {
  const { silent = false } = options;
  
  if (!silent) {
    console.log(`\n${colors.cyan}> ${command}${colors.reset}`);
  }
  
  try {
    const output = execSync(command, { 
      cwd: directory || process.cwd(),
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output ? output.toString() : '';
  } catch (error) {
    if (!silent) {
      console.error(`${colors.red}Command failed: ${command}${colors.reset}`);
      console.error(error.message);
    }
    return false;
  }
}

// Check if a file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Main deployment function
async function deploy() {
  console.log(`\n${colors.green}=== VELO-ALTITUDE AUTHENTICATION FIX DEPLOYMENT ===${colors.reset}`);
  console.log('This script will build and prepare your project for deployment with authentication fixes');
  
  // Step 1: Verify required files
  console.log(`\n${colors.yellow}1. Verifying authentication files...${colors.reset}`);
  
  const requiredFiles = [
    { path: path.join(clientDir, 'public', 'auth-override.js'), name: 'Authentication Override Script' },
    { path: path.join(clientDir, 'src', 'contexts', 'AuthContext.js'), name: 'Auth Context' },
    { path: path.join(clientDir, 'src', 'hooks', 'useAuthCentral.js'), name: 'Auth Central Hook' },
    { path: path.join(clientDir, 'public', 'index.html'), name: 'Index HTML' },
    { path: path.join(clientDir, 'public', '_redirects'), name: 'Netlify Redirects' },
  ];
  
  let allFilesExist = true;
  
  for (const file of requiredFiles) {
    if (fileExists(file.path)) {
      console.log(`${colors.green}✓ ${file.name} found${colors.reset}`);
    } else {
      console.error(`${colors.red}✗ ${file.name} not found at: ${file.path}${colors.reset}`);
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.error(`${colors.red}Some required files are missing. Please fix the issues before continuing.${colors.reset}`);
    process.exit(1);
  }
  
  // Step 2: Clean up any previous builds
  console.log(`\n${colors.yellow}2. Cleaning up previous builds...${colors.reset}`);
  
  if (fileExists(buildDir)) {
    try {
      fs.rmSync(buildDir, { recursive: true, force: true });
      console.log(`${colors.green}✓ Previous build directory removed${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}Error removing previous build directory: ${error.message}${colors.reset}`);
    }
  } else {
    console.log(`${colors.blue}No previous build directory found${colors.reset}`);
  }
  
  // Step 3: Install dependencies
  console.log(`\n${colors.yellow}3. Installing dependencies...${colors.reset}`);
  
  if (!runCommand('npm install', clientDir)) {
    console.error(`${colors.red}Failed to install dependencies${colors.reset}`);
    process.exit(1);
  }
  
  // Step 4: Build the project
  console.log(`\n${colors.yellow}4. Building the React application...${colors.reset}`);
  console.log(`${colors.blue}This may take a few minutes...${colors.reset}`);
  
  // Set environment variables for the build
  process.env.CI = 'false';
  process.env.DISABLE_ESLINT_PLUGIN = 'true';
  
  if (!runCommand('npm run build', clientDir)) {
    console.error(`${colors.red}Build failed${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Build completed successfully${colors.reset}`);
  
  // Step 5: Test the build locally (optional)
  console.log(`\n${colors.yellow}5. Testing the build locally...${colors.reset}`);
  
  const isServeInstalled = runCommand('npx serve --version', clientDir, { silent: true });
  
  if (!isServeInstalled) {
    console.log(`${colors.blue}Installing serve package for local testing...${colors.reset}`);
    runCommand('npm install -g serve', clientDir);
  }
  
  console.log(`${colors.green}✓ You can test the build locally with: ${colors.cyan}cd client && npx serve -s build${colors.reset}`);
  
  // Step 6: Deployment instructions
  console.log(`\n${colors.yellow}6. Deployment instructions:${colors.reset}`);
  console.log(`
${colors.blue}Option 1: Deploy using Netlify CLI:${colors.reset}
  1. Install Netlify CLI if not installed: ${colors.cyan}npm install -g netlify-cli${colors.reset}
  2. Log in to Netlify: ${colors.cyan}netlify login${colors.reset}
  3. Initialize project (if needed): ${colors.cyan}netlify init${colors.reset}
  4. Deploy: ${colors.cyan}netlify deploy --prod${colors.reset}

${colors.blue}Option 2: Manual deploy:${colors.reset}
  1. Go to Netlify dashboard: https://app.netlify.com/
  2. Drag and drop the ${colors.cyan}client/build${colors.reset} folder to the Netlify dashboard
  3. Configure domain settings as needed
  
${colors.blue}Option 3: Deploy from Git repository:${colors.reset}
  1. Commit all changes: ${colors.cyan}git add . && git commit -m "Authentication fixes"${colors.reset}
  2. Push to your repository: ${colors.cyan}git push${colors.reset}
  3. In Netlify dashboard, trigger a deploy with "Clear cache and deploy site"
`);
  
  // Step 7: Post-deployment testing checklist
  console.log(`\n${colors.yellow}7. Post-deployment testing checklist:${colors.reset}`);
  console.log(`After deployment, verify the following:
${colors.green}□ Authentication flow${colors.reset} (login/logout)
${colors.green}□ Navigation${colors.reset} between all modules
${colors.green}□ 3D visualization${colors.reset} of mountain passes
${colors.green}□ Les 7 Majeurs${colors.reset} challenge creation
${colors.green}□ Training module${colors.reset} with FTP calculations
${colors.green}□ Nutrition module${colors.reset} with recommendations
${colors.green}□ Weather dashboard${colors.reset} with mountain pass forecasts
${colors.green}□ Community section${colors.reset} with forums and rankings
${colors.green}□ Responsive design${colors.reset} on mobile devices
`);
  
  console.log(`\n${colors.green}=== AUTHENTICATION FIX DEPLOYMENT PREPARATION COMPLETE ===${colors.reset}`);
}

// Execute the deployment function
deploy().catch(err => {
  console.error(`\n${colors.red}Deployment failed:${colors.reset}`, err);
  process.exit(1);
});
