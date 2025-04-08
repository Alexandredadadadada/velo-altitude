import { Router, Request, Response } from 'express';
import axios from 'axios';
import { checkPermissions, checkRole } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/user/profile
 * @desc Récupère le profil de l'utilisateur actuellement authentifié
 * @access Privé - Nécessite un JWT valide
 */
router.get('/profile', async (req: Request, res: Response) => {
  try {
    // L'utilisateur est déjà authentifié grâce au middleware checkJwt
    // Les informations de l'utilisateur se trouvent dans req.auth
    const auth = req.auth as any;
    
    if (!auth || !auth.sub) {
      return res.status(401).json({ 
        error: 'invalid_token',
        error_description: 'Invalid or missing user information'
      });
    }

    // Construction de la réponse avec les informations disponibles dans le token
    const userProfile = {
      sub: auth.sub,
      nickname: auth.nickname || '',
      name: auth.name || '',
      picture: auth.picture || '',
      email: auth.email || '',
      email_verified: auth.email_verified || false,
      updated_at: auth.updated_at || new Date().toISOString(),
      roles: auth['https://velo-altitude.com/roles'] || [],
      permissions: auth.permissions || []
    };
    
    return res.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ 
      error: 'server_error',
      error_description: 'Error fetching user profile'
    });
  }
});

/**
 * @route GET /api/user/:userId/roles
 * @desc Récupère les rôles d'un utilisateur spécifique
 * @access Privé - Nécessite un JWT valide et la permission 'read:roles'
 */
router.get('/:userId/roles', checkPermissions('read:roles'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur demande ses propres rôles, sauf s'il est administrateur
    const auth = req.auth as any;
    const isAdmin = auth['https://velo-altitude.com/roles']?.includes('admin');
    const isOwnProfile = auth.sub === userId;
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        error_description: 'You can only retrieve your own roles'
      });
    }
    
    // Si en production, appeler l'API Auth0 Management pour récupérer les rôles
    // Pour cet exemple, on retourne les rôles du token
    const userRoles = auth['https://velo-altitude.com/roles'] || [];
    
    return res.json(userRoles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return res.status(500).json({ 
      error: 'server_error',
      error_description: 'Error fetching user roles'
    });
  }
});

/**
 * @route GET /api/user/:userId/permissions
 * @desc Récupère les permissions d'un utilisateur spécifique
 * @access Privé - Nécessite un JWT valide et la permission 'read:permissions'
 */
router.get('/:userId/permissions', checkPermissions('read:permissions'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Vérifier que l'utilisateur demande ses propres permissions, sauf s'il est administrateur
    const auth = req.auth as any;
    const isAdmin = auth['https://velo-altitude.com/roles']?.includes('admin');
    const isOwnProfile = auth.sub === userId;
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        error_description: 'You can only retrieve your own permissions'
      });
    }
    
    // Si en production, appeler l'API Auth0 Management pour récupérer les permissions
    // Pour cet exemple, on retourne les permissions du token
    const userPermissions = auth.permissions || [];
    
    return res.json(userPermissions);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return res.status(500).json({ 
      error: 'server_error',
      error_description: 'Error fetching user permissions'
    });
  }
});

/**
 * @route PATCH /api/user/:userId/metadata
 * @desc Met à jour les métadonnées d'un utilisateur spécifique
 * @access Privé - Nécessite un JWT valide et le rôle 'admin' ou être l'utilisateur concerné
 */
router.patch('/:userId/metadata', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const metadata = req.body;
    
    // Vérifier que l'utilisateur modifie ses propres métadonnées, sauf s'il est administrateur
    const auth = req.auth as any;
    const isAdmin = auth['https://velo-altitude.com/roles']?.includes('admin');
    const isOwnProfile = auth.sub === userId;
    
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({
        error: 'insufficient_permissions',
        error_description: 'You can only update your own metadata'
      });
    }
    
    // Pour une véritable implémentation, il faudrait appeler l'API Management d'Auth0
    // Pour cet exemple, on simule un succès
    
    return res.json({
      ...auth,
      user_metadata: {
        ...auth.user_metadata,
        ...metadata
      },
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return res.status(500).json({ 
      error: 'server_error',
      error_description: 'Error updating user metadata'
    });
  }
});

/**
 * @route POST /api/user/logout
 * @desc Ajoute le token actuel à la blacklist pour le déconnecter
 * @access Privé - Nécessite un JWT valide
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Cette fonction est un exemple de la façon dont on pourrait implémenter
    // un endpoint de déconnexion qui blackliste le token
    // Dans une véritable implémentation, il faudrait appeler la fonction blacklistToken
    
    return res.json({ success: true, message: 'Successfully logged out' });
  } catch (error) {
    console.error('Error logging out:', error);
    return res.status(500).json({ 
      error: 'server_error',
      error_description: 'Error during logout process'
    });
  }
});

export default router;
