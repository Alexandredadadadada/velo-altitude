// Stub component for Node/serverless environments.
// The real implementation is in AuthenticationWrapper.tsx for the browser.
// We export a minimal pass‑through component so that Netlify Functions bundling
// can resolve the module without TypeScript/React runtime requirements.

function AuthenticationWrapper({ children }) {
  return children || null;
}

module.exports = AuthenticationWrapper;
module.exports.default = AuthenticationWrapper;
