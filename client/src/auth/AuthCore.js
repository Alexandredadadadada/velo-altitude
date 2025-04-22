// CommonJS stub for serverless/Node environments (Netlify Functions).
// Provides minimal re‑exports so that modules requiring './AuthCore' resolve
// without pulling in the heavy TS/React implementation which is browser‑only.

/* eslint-disable @typescript-eslint/no-empty-function */

// Basic no‑op hooks/components so serverless code doesn’t crash if invoked.
function AuthProvider({ children }) {
  return children || null;
}

const dummyAuthContext = {
  currentUser: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
  error: null,
  login: () => {},
  logout: () => {},
  updateUserProfile: async () => {},
  getToken: async () => null,
};

function useAuth() {
  return dummyAuthContext;
}

function useSafeAuth() {
  return dummyAuthContext;
}

// Utility fallbacks
async function getAccessToken() {
  return null;
}
function getUserId() {
  return null;
}
function hasRole() {
  return false;
}

// Dummy context placeholder
const AuthContext = {};

module.exports = {
  AuthProvider,
  useAuth,
  useSafeAuth,
  AuthContext,
  getAccessToken,
  getUserId,
  hasRole,
  default: {
    AuthProvider,
    useAuth,
    useSafeAuth,
    AuthContext,
    getAccessToken,
    getUserId,
    hasRole,
  },
};
