import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { APIOrchestrator } from '../../api/orchestration/APIOrchestrator';
import PersonalInformation from './PersonalInformation';
import DataExportManager from './DataExportManager';
import DeviceSyncManager from './DeviceSyncManager';
import ExternalServicesManager from './ExternalServicesManager';
import ActivityHistory from './ActivityHistory';
import PreferencesManager from './PreferencesManager';
import NotificationManager from './NotificationManager';
import PrivacyManager from './PrivacyManager';
import { User } from '../../types';

const apiOrchestrator = new APIOrchestrator();

interface UserProfileProps {
  userId?: string; // Optional, if viewing another user's profile
  initialTab?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const UserProfile: React.FC<UserProfileProps> = ({ userId, initialTab = 0 }) => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState(initialTab);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const currentUserId = userId || (authUser ? authUser.id : '');
  const isOwnProfile = !userId || (authUser && userId === authUser.id);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const userData = await apiOrchestrator.getUserById(currentUserId);
        setProfileUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [currentUserId, authLoading]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser && !loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h6" color="error" align="center">
          Profil utilisateur introuvable
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, py: 4, px: 2 }}>
      <Paper sx={{ mb: 4, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={2}>
            <Box 
              component="img"
              src={profileUser?.avatarUrl || '/assets/default-avatar.png'}
              alt={profileUser?.displayName || 'User'}
              sx={{ 
                width: '100%', 
                maxWidth: 120, 
                height: 'auto', 
                borderRadius: '50%',
                border: `2px solid ${theme.palette.primary.main}`
              }}
            />
          </Grid>
          <Grid item xs={12} sm={10}>
            <Typography variant="h4" component="h1" gutterBottom>
              {profileUser?.displayName || 'Utilisateur'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {profileUser?.bio || 'Aucune biographie disponible'}
            </Typography>
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {profileUser?.location && (
                <Typography variant="body2" color="text.secondary">
                  <strong>Localisation:</strong> {profileUser.location}
                </Typography>
              )}
              {profileUser?.memberSince && (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  <strong>Membre depuis:</strong> {new Date(profileUser.memberSince).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons={isMobile ? "auto" : undefined}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Informations" />
          {isOwnProfile && <Tab label="Activités" />}
          {isOwnProfile && <Tab label="Préférences" />}
          {isOwnProfile && <Tab label="Services connectés" />}
          {isOwnProfile && <Tab label="Notifications" />}
          {isOwnProfile && <Tab label="Synchronisation" />}
          {isOwnProfile && <Tab label="Export de données" />}
          {isOwnProfile && <Tab label="Confidentialité" />}
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <PersonalInformation 
            user={profileUser} 
            isEditable={isOwnProfile} 
            onProfileUpdate={(updatedUser) => setProfileUser(updatedUser)} 
          />
        </TabPanel>

        {isOwnProfile && (
          <>
            <TabPanel value={tabValue} index={1}>
              <ActivityHistory userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <PreferencesManager userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <ExternalServicesManager userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <NotificationManager userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={5}>
              <DeviceSyncManager userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={6}>
              <DataExportManager userId={currentUserId} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={7}>
              <PrivacyManager userId={currentUserId} />
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default UserProfile;
