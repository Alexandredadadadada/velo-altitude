/**
 * Bridge module to expose the central monitoring singleton under the legacy
 * path `src/services/monitoringService.js`.
 *
 * Older components still import `../../services/monitoringService` and expect
 * helper functions such as `trackUserInteraction` and `trackApiPerformance` on
 * the default export. We therefore re‑export the newer TypeScript‑based
 * monitoring service (located in `src/monitoring/index.ts`) and decorate it
 * with thin backward‑compatibility shims.
 */

import baseMonitoringService from '../monitoring';

// ---------------------------
// Back‑compat helper wrappers
// ---------------------------

/**
 * Track a user interaction (legacy signature).
 * @param {string} componentName – React component / feature name.
 * @param {string} action – Action verb (click, submit …).
 * @param {object} metadata – Additional contextual information.
 */
function trackUserInteraction(componentName, action, metadata = {}) {
  baseMonitoringService.trackEvent(`${componentName}_${action}`, metadata);
}

/**
 * Track an API performance metric (legacy signature).
 * @param {string} endpoint – API endpoint.
 * @param {number} duration – Milliseconds.
 * @param {object} metadata – { success?: boolean, … } Additional data.
 */
function trackApiPerformance(endpoint, duration, metadata = {}) {
  const { success = true, ...rest } = metadata;
  baseMonitoringService.trackApiCall(
    'client',
    endpoint,
    duration,
    success,
    rest
  );
}

// -----------------------------------
// Compose augmented monitoring service
// -----------------------------------
const monitoringService = {
  ...baseMonitoringService,
  trackUserInteraction,
  trackApiPerformance,
};

export default monitoringService;
