# Velo-Altitude – Deployment & Maintenance Handbook

## 1. Project Overview
Velo-Altitude is a full-stack web application with a Node.js/Express backend (deployed on Render.com) and a React/JS frontend (deployed on Netlify). The project relies on MongoDB, JWT authentication, and several external APIs (Strava, OpenWeather, etc.).

---

## 2. Repository Structure
```
velo-altitude/
├── client/         # Frontend React app
├── server/         # Backend Node.js/Express app
├── API_DOCUMENTATION.md
├── DEPLOYMENT_HANDBOOK.md  # (this file)
└── ...
```

---

## 3. Environment Variables

### Render (Backend)
All required environment variables are configured in the Render dashboard:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRATION`
- (others: see .env.example or API documentation)

**Port binding**: Render injects the `PORT` variable automatically. The backend must listen on `process.env.PORT`.

### Netlify (Frontend)
All required environment variables are configured in the Netlify dashboard:
- `REACT_APP_API_URL` (must point to the Render backend URL)
- (others: see .env.example or API documentation)

---

## 4. Deployment Process

### A. Backend (Render)
1. **Push your changes to GitHub (main branch):**
   ```sh
   git add .
   git commit -m "feat: my change"
   git push
   ```
2. **Render will auto-deploy** on push.
3. **Check logs** in Render dashboard (look for port binding issues, DB connection, etc.).
4. **If needed, trigger a manual deploy** in Render dashboard.

### B. Frontend (Netlify)
1. **Push your changes to GitHub (main branch):**
   ```sh
   git add .
   git commit -m "fix: frontend change"
   git push
   ```
2. **Netlify will auto-deploy** on push.
3. **Check deploy logs** in Netlify dashboard.
4. **If needed, trigger a manual deploy** in Netlify dashboard.

---

## 5. Build & Deploy Troubleshooting

### Common Issues

#### a. Webpack errors on Netlify
- **Symptom:** `Cannot find module 'webpack'` or `Failed to load 'webpack.config.js'`
- **Root cause:** `webpack` and/or `webpack-cli` are missing from `devDependencies` in `client/package.json`.
- **Solution:**
  1. Install them locally:
     ```sh
     cd client
     npm install --save-dev webpack webpack-cli
     ```
  2. Commit `package.json` and `package-lock.json`.
  3. Push to GitHub and redeploy Netlify.
- **Note:** Netlify installs dependencies from `package.json` (not global `npm install -g`).

#### b. Port binding errors on Render
- **Symptom:** Server exits with status 1, log mentions port binding or no open ports detected.
- **Root cause:** The backend must listen on the port provided by `process.env.PORT` (Render sets this automatically).
- **Solution:**
  - In `server.js` (or your entrypoint):
    ```js
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    ```
  - Add a log to print the PORT just before `app.listen` for debugging.

#### c. Environment variables not found
- **Symptom:** App crashes or misbehaves due to missing env vars.
- **Solution:**
  - Double-check all variables in Render and Netlify dashboards.
  - Never commit secrets in the repo.

---

## 6. How to Onboard a New Developer

1. **Clone the repo:**
   ```sh
   git clone https://github.com/Alexandredadadadada/velo-altitude.git
   ```
2. **Install dependencies:**
   ```sh
   cd client && npm install
   cd ../server && npm install
   ```
3. **Ask for .env files** (if running locally) or check the cloud dashboards for env vars.
4. **To deploy:**
   - Push to main branch: triggers both Netlify and Render deploys.
   - Or use the dashboards to trigger manual deploys.
5. **Check logs:**
   - Render: backend logs (API, DB, port issues)
   - Netlify: build and runtime logs (frontend build, webpack, env issues)

---

## 7. Current Known Issues & History

### Major blockers encountered (2024–2025):
- **Webpack not found on Netlify:**
  - Despite adding `webpack` and `webpack-cli` to `package.json`, Netlify build sometimes fails to find them.
  - Possible causes: cache issues, lockfile mismatch, or global vs local install confusion.
  - Always prefer local devDependencies and commit the lockfile.
- **Port binding on Render:**
  - Server must always use `process.env.PORT`.
  - If still failing, double-check logs for port assignment and errors.
- **Environment variables:**
  - All env vars are set in Render and Netlify dashboards. If the app fails, check for typos or missing values.

### What’s working
- All env vars are in place (Render & Netlify)
- GitHub → Render/Netlify deploy pipeline is functional
- The only recurring issues are around build tools (webpack) and port binding (backend)

---

## 8. Useful Links
- **Render docs:** https://render.com/docs/
- **Netlify docs:** https://docs.netlify.com/
- **Node.js versioning:** Ensure `.node-version` matches supported version on Render
- **Troubleshooting:**
  - [Render troubleshooting](https://render.com/docs/troubleshooting-deploys)
  - [Netlify build errors](https://ntl.fyi/exit-code-2)

---

## 9. Final Checklist for Handover
- [x] All env vars set in Render & Netlify dashboards
- [x] All dependencies (`webpack`, `webpack-cli`, etc.) in `package.json` and installed locally
- [x] `package-lock.json` committed and up-to-date
- [x] Backend listens on `process.env.PORT`
- [x] README/DEPLOYMENT_HANDBOOK up-to-date
- [x] GitHub main branch is the source of truth for deploys

---

## 10. If You Get Stuck
- **Check logs first!** (Render & Netlify dashboards)
- **Check dependencies and lockfiles**
- **Check environment variables**
- **Ask for help:**
  - Provide error logs, build output, and what you’ve tried

---

*This handbook is designed to make onboarding and deployment as smooth as possible. If you follow these steps, you should be able to deploy and maintain Velo-Altitude without surprises. Good luck!*
