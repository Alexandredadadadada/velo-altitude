/**
 * Velo-Altitude Main Server
 * 
 * Express.js server that handles API routes, authentication, and monitoring
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import middleware
import { securityMiddleware } from './middleware/security';
import { loggingMiddleware } from './middleware/logging';

// Import route handlers
import apiRouter from './api/routes';
import adminRouter from './admin/routes';
import apiDashboard from './admin/api-dashboard';
import monitoringService from './monitoring';

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(loggingMiddleware);
app.use(securityMiddleware);

// Set up EJS for admin views
app.set('view engine', 'ejs');
app.set('views', [
  path.join(__dirname, 'admin/views'),
  path.join(__dirname, 'views')
]);

// Initialize monitoring service
monitoringService.init();

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api', apiRouter);

// Admin routes
app.use('/admin', adminRouter);

// API Dashboard routes
app.use('/admin/api', apiDashboard);

// Default route
app.get('/', (req, res) => {
  res.send('Velo-Altitude API Server');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  monitoringService.trackEvent('server_start', { port: PORT });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  monitoringService.logError('uncaught_exception', error.message, error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  monitoringService.logError('unhandled_rejection', String(reason), { promise, reason });
});

export default app;
