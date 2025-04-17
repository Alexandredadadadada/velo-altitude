const logger = require('../logger');
const intrusionDetector = require('../security/intrusion-detector');

class AuthErrorHandler {
  constructor() {
    this.errorMap = {
      'TokenExpiredError': {
        code: 'TOKEN_EXPIRED',
        message: 'Your session has expired. Please log in again.',
        status: 401,
        severity: 'info'
      },
      'JsonWebTokenError': {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token. Please log in again.',
        status: 401,
        severity: 'warn'
      },
      'NotBeforeError': {
        code: 'TOKEN_NOT_ACTIVE',
        message: 'This token is not yet active. Please try again later.',
        status: 401,
        severity: 'warn'
      },
      'RefreshTokenError': {
        code: 'REFRESH_TOKEN_ERROR',
        message: 'Unable to refresh your session. Please log in again.',
        status: 401,
        severity: 'warn'
      },
      'InvalidCredentialsError': {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please try again.',
        status: 401,
        severity: 'warn'
      },
      'AccountLockedError': {
        code: 'ACCOUNT_LOCKED',
        message: 'Your account has been temporarily locked due to multiple failed attempts. Please try again later.',
        status: 423,
        severity: 'error'
      }
    };
  }
  
  async handleAuthError(error, req, res) {
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id;
    
    // Map the error
    const errorType = error.name || 'AuthenticationError';
    const errorInfo = this.errorMap[errorType] || {
      code: 'AUTH_ERROR',
      message: 'An authentication error occurred. Please try again.',
      status: 401,
      severity: 'warn'
    };
    
    // Track the failure and get recommended action
    const securityAction = await intrusionDetector.trackFailedAttempt(
      ip, userId, errorType
    );
    
    // Log the error with context
    logger[errorInfo.severity](errorInfo.code, {
      message: error.message,
      errorType,
      ip,
      userId,
      userAgent: req.headers['user-agent'],
      path: req.originalUrl,
      securityAction: securityAction.status
    });
    
    // Apply action based on security recommendation
    if (securityAction.action === 'delay') {
      await new Promise(resolve => setTimeout(resolve, securityAction.delayMs));
    }
    
    // Return standardized error response
    return {
      success: false,
      error: {
        code: errorInfo.code,
        message: errorInfo.message
      },
      status: errorInfo.status
    };
  }
}

module.exports = new AuthErrorHandler();
