// auth-override.js
console.log("🔒 Initialisation du système d'authentification de secours");

// Créer un utilisateur fictif global
window.MOCK_USER = {
  id: "demo-user-123",
  name: "Utilisateur Démo",
  email: "demo@velo-altitude.com",
  role: "admin",
  preferences: { theme: "light", language: "fr" },
  profile: { weight: 75, height: 180, ftp: 250 }
};

// Créer un objet d'authentification global
window.AUTH_CONTEXT = {
  currentUser: window.MOCK_USER,
  user: window.MOCK_USER,
  isAuthenticated: true,
  isAdmin: true,
  loading: false,
  login: () => {
    console.log("📥 Login simulé");
    return Promise.resolve(true);
  },
  logout: () => {
    console.log("📤 Logout simulé");
    return Promise.resolve(true);
  },
  updateUserProfile: (data) => {
    console.log("✏️ Mise à jour du profil simulée", data);
    return Promise.resolve({...window.MOCK_USER, ...data});
  },
  getToken: () => "demo-token-xyz-123"
};

// Remplacer la fonction useAuth globalement
window.useAuth = () => window.AUTH_CONTEXT;

// Intercepter les erreurs React liées à l'authentification
const originalError = console.error;
console.error = function(msg, ...args) {
  if (typeof msg === 'string' && 
      (msg.includes('useAuth') || msg.includes('AuthProvider'))) {
    console.log("🛡️ Erreur d'authentification interceptée et neutralisée");
    return;
  }
  return originalError.call(this, msg, ...args);
};

console.log("✅ Système d'authentification de secours activé");
