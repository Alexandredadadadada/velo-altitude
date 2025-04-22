// Bridge file to allow CommonJS/JS consumers (e.g., Netlify Functions bundler)
// to resolve "../auth" even though the real implementation is in TypeScript.
// It simply re-exports everything from the TypeScript entry point.
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */

const tsModule = require('./index.ts');

module.exports = tsModule;

// In case some consumers expect ES module default export as object
module.exports.default = tsModule;
