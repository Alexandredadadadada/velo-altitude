// CommonJS stub for Netlify / Node environments where TypeScript+React
// components are not required. This prevents "Cannot find module
// './ProtectedRoute'" during Netlify Functions bundling.

/* eslint-disable @typescript-eslint/no-empty-function */

function ProtectedRoute({ children }) {
  // Simply render children (no auth checks in serverless context)
  return children || null;
}

module.exports = ProtectedRoute;
module.exports.default = ProtectedRoute;
