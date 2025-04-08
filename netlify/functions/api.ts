import express, { Router, Request, Response } from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import helmet from 'helmet';
import { checkJwt, checkTokenBlacklist } from './middleware/auth';

// Import des routes
import userRoutes from './routes/user';

// Création de l'application Express
const app = express();

// Middleware de base
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de surveillance des performances
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Route principale pour vérifier si l'API est en ligne
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Velo-Altitude API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Middleware d'authentification global pour vérifier si les tokens sont blacklistés
app.use(checkTokenBlacklist);

// Routes protégées par authentification
const apiRouter = Router();
apiRouter.use(checkJwt);

// Enregistrement des routes
apiRouter.use('/user', userRoutes);

// Ajout du router protégé à l'application
app.use('/api', apiRouter);

// Gestion des erreurs
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err);
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'invalid_token',
      error_description: 'Invalid or expired token'
    });
  }
  
  res.status(500).json({
    error: 'server_error',
    error_description: 'Internal server error'
  });
});

// Handler pour Netlify Functions
const handler = serverless(app);
export { handler };
