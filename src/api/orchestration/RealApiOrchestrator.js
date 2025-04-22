// Bridge module for Netlify Functions
// Provides serverless functions with access to the existing RealApiOrchestrator
// implementation that lives in the client services directory.
//
// Having this thin wrapper avoids duplicating large amounts of logic and fixes
// "Cannot find module '../../src/api/orchestration/RealApiOrchestrator'" build
// errors on Netlify.
//
// Any call that the Netlify Functions make (e.g. getCols, getColById, etc.) is
// now transparently delegated to the existing orchestrator implementation.
//
// NOTE: The original orchestrator is written as an ES module that exports a
// default instance. When importing it via `require`, the implementation is
// available under the `.default` property. We therefore check both the direct
// import and the `.default` fallback to cater for different bundling modes.

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */

// Resolve path to the definitive orchestrator implementation
// Path from this file (src/api/orchestration) -> ../../../client/src/services/api/RealApiOrchestrator.js
const orchestratorModule = require('../../../client/src/services/api/RealApiOrchestrator');

// Retrieve the class (not the singleton instance) so that Netlify Functions can
// instantiate it with options (e.g. a MongoDB connection).
const RealApiOrchestrator = orchestratorModule.RealApiOrchestrator || orchestratorModule.default || orchestratorModule;

module.exports = {
  RealApiOrchestrator,
};
