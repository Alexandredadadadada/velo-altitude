const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function measureBuildTime(command) {
  const start = Date.now();
  console.log(`Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    const duration = Date.now() - start;
    console.log(`Build completed in ${duration / 1000} seconds`);
    return duration;
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
    return null;
  }
}

function analyzeBuildSize(buildDir) {
  console.log(`Analyzing build in ${buildDir}`);
  const jsFiles = [];
  const cssFiles = [];
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.js')) {
          jsFiles.push(fullPath);
        } else if (entry.name.endsWith('.css')) {
          cssFiles.push(fullPath);
        }
      }
    }
  }
  scanDirectory(buildDir);
  const totalJsSize = jsFiles.reduce((total, file) => total + fs.statSync(file).size, 0);
  const totalCssSize = cssFiles.reduce((total, file) => total + fs.statSync(file).size, 0);
  const totalSize = totalJsSize + totalCssSize;
  return {
    jsFiles: jsFiles.length,
    cssFiles: cssFiles.length,
    totalJsSize: (totalJsSize / 1024 / 1024).toFixed(2) + ' MB',
    totalCssSize: (totalCssSize / 1024 / 1024).toFixed(2) + ' MB',
    totalSize: (totalSize / 1024 / 1024).toFixed(2) + ' MB'
  };
}

console.log('=== TESTING CREATE REACT APP BUILD ===');
const craBuildTime = measureBuildTime('npm run build:cra');
const craBuildStats = analyzeBuildSize('./build');

console.log('\n=== TESTING VITE BUILD ===');
const viteBuildTime = measureBuildTime('npm run build:vite');
const viteBuildStats = analyzeBuildSize('./dist');

console.log('\n=== BUILD COMPARISON RESULTS ===');
console.log('Build Time:');
console.log(`CRA: ${craBuildTime / 1000} seconds`);
console.log(`Vite: ${viteBuildTime / 1000} seconds`);
console.log(`Improvement: ${((craBuildTime - viteBuildTime) / craBuildTime * 100).toFixed(2)}%`);

console.log('\nBundle Size:');
console.log(`CRA Total: ${craBuildStats.totalSize}`);
console.log(`Vite Total: ${viteBuildStats.totalSize}`);
console.log(`JS Files - CRA: ${craBuildStats.jsFiles}, Vite: ${viteBuildStats.jsFiles}`);
console.log(`CSS Files - CRA: ${craBuildStats.cssFiles}, Vite: ${viteBuildStats.cssFiles}`);
