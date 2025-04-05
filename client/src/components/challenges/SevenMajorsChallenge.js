import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { useChallenge } from '../../contexts/ChallengeContext';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  CircularProgress,
  Snackbar,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  Public as GlobeIcon,
  Person as PersonIcon
} from '@mui/icons-material';

// Import des sous-composants
import ColSearchTab from './components/ColSearchTab';
import MyChallenge from './components/MyChallenge';
import PredefinedChallenges from './components/PredefinedChallenges';
import UserChallenges from './components/UserChallenges';
import ColDetailsDialog from './components/ColDetailsDialog';
import ScheduleDialog from './components/ScheduleDialog';

/**
 * Composant pour le défi "Les 7 Majeurs" permettant aux cyclistes de sélectionner
 * et suivre 7 grands cols à conquérir dans l'année
 */
const SevenMajorsChallenge = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  
  // Utiliser le contexte ChallengeContext pour toute la gestion d'état
  const { 
    // États
    loading, error, allCols, totalItems, filters, page, rowsPerPage,
    selectedCols, challengeName, isPublic, activeTab, predefinedChallenges,
    userChallenges, selectedCol, showColDetails, weatherData, showScheduleDialog,
    scheduleColId, scheduleColName, userCompletedCols, scheduledAscents,
    exportFormat, notification,
    
    // Actions
    setActiveTab, setPage, setFilters, selectCol, removeCol, setChallengeName,
    setIsPublic, viewColDetails, closeColDetails, saveChallenge, markColAsCompleted,
    scheduleAscent, openScheduleDialog, closeScheduleDialog,
    deleteChallenge, likeChallenge, loadChallenge, clearNotification, exportTrack,
    setExportFormat
  } = useChallenge();
  
  // Gestionnaires d'événements simplifiés
  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };
  
  const handlePageChange = (_, newPage) => {
    setPage(newPage);
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  const handleSelectCol = (col) => {
    selectCol(col);
  };
  
  const handleRemoveCol = (colId) => {
    removeCol(colId);
  };
  
  const handleChallengeTitleChange = (newTitle) => {
    setChallengeName(newTitle);
  };
  
  const handleTogglePublic = () => {
    setIsPublic(!isPublic);
  };
  
  const handleViewColDetails = (col) => {
    viewColDetails(col);
  };
  
  const handleCloseColDetails = () => {
    closeColDetails();
  };
  
  const handleSaveChallenge = () => {
    saveChallenge();
  };
  
  const handleMarkAsCompleted = (colId) => {
    markColAsCompleted(colId);
  };
  
  const handleScheduleAscent = (date) => {
    scheduleAscent(date);
  };
  
  const handleOpenScheduleDialog = (colId, colName) => {
    openScheduleDialog(colId, colName);
  };
  
  const handleDeleteChallenge = (challengeId) => {
    deleteChallenge(challengeId);
  };
  
  const handleLikeChallenge = (challengeId) => {
    likeChallenge(challengeId);
  };
  
  const handleLoadPredefinedChallenge = (challenge) => {
    loadChallenge(challenge);
  };
  
  const handleLoadUserChallenge = (challenge) => {
    loadChallenge(challenge);
  };
  
  const handleCloseNotification = () => {
    clearNotification();
  };
  
  const handleExportTrack = (colId) => {
    exportTrack(colId, exportFormat);
  };
  
  const handleExportFormatChange = (format) => {
    setExportFormat(format);
  };
  
  const handleShareChallenge = () => {
    // La fonctionnalité de partage serait implémentée ici
  };
  
  return (
    <Box sx={{ 
      width: '100%', 
      backgroundColor: 'background.paper',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: 3
    }}>
      <Paper elevation={0}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Challenge tabs"
          variant="fullWidth"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            mb: 2
          }}
        >
          <Tab 
            icon={<SearchIcon />} 
            label={t('challenge.search_cols')} 
            id="tab-0" 
            aria-controls="tabpanel-0" 
          />
          <Tab 
            icon={<TrophyIcon />} 
            label={t('challenge.my_challenge')} 
            id="tab-1" 
            aria-controls="tabpanel-1" 
          />
          <Tab 
            icon={<GlobeIcon />} 
            label={t('challenge.predefined')} 
            id="tab-2" 
            aria-controls="tabpanel-2" 
          />
          <Tab 
            icon={<PersonIcon />} 
            label={t('challenge.community')} 
            id="tab-3" 
            aria-controls="tabpanel-3" 
            disabled={!isAuthenticated}
          />
        </Tabs>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ p: 2 }}>
        <Box role="tabpanel" hidden={activeTab !== 0} id="tabpanel-0" aria-labelledby="tab-0">
          {activeTab === 0 && (
            <ColSearchTab
              cols={allCols}
              loading={loading}
              filters={filters}
              onFilterChange={handleFilterChange}
              onSelectCol={handleSelectCol}
              onViewDetails={handleViewColDetails}
              selectedColIds={selectedCols.map(col => col.id)}
              maxColsReached={selectedCols.length >= 7}
            />
          )}
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          )}
          
          {!loading && allCols.length === 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('challenge.no_cols_found')}
            </Alert>
          )}
          
          {!loading && allCols.length > 0 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Pagination
                  count={Math.ceil(totalItems / rowsPerPage)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  showFirstButton
                  showLastButton
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" align="center">
                {t('common.showing_items', { 
                  start: Math.min((page - 1) * rowsPerPage + 1, totalItems), 
                  end: Math.min(page * rowsPerPage, totalItems), 
                  total: totalItems 
                })}
              </Typography>
            </>
          )}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 1} id="tabpanel-1" aria-labelledby="tab-1">
          {activeTab === 1 && (
            <MyChallenge 
              selectedCols={selectedCols}
              challengeName={challengeName}
              onChallengeTitleChange={handleChallengeTitleChange}
              onRemoveCol={handleRemoveCol}
              onViewCol={handleViewColDetails}
              onSaveChallenge={handleSaveChallenge}
              onMarkAsCompleted={handleMarkAsCompleted}
              onScheduleAscent={handleOpenScheduleDialog}
              onShareChallenge={handleShareChallenge}
              isPublic={isPublic}
              onTogglePublic={handleTogglePublic}
              isAuthenticated={isAuthenticated}
              completedCols={userCompletedCols}
              scheduledAscents={scheduledAscents}
            />
          )}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 2} id="tabpanel-2" aria-labelledby="tab-2">
          {activeTab === 2 && (
            <PredefinedChallenges 
              challenges={predefinedChallenges}
              loading={loading}
              error={error}
              onLoadChallenge={handleLoadPredefinedChallenge}
              onViewColDetails={handleViewColDetails}
            />
          )}
        </Box>
        
        <Box role="tabpanel" hidden={activeTab !== 3} id="tabpanel-3" aria-labelledby="tab-3">
          {activeTab === 3 && isAuthenticated && (
            <UserChallenges 
              challenges={userChallenges}
              loading={loading}
              onLoadChallenge={handleLoadUserChallenge}
              onDeleteChallenge={handleDeleteChallenge}
              onLikeChallenge={handleLikeChallenge}
              onViewColDetails={handleViewColDetails}
              onShareChallenge={handleShareChallenge}
              userLikes={likeChallenge}
            />
          )}
        </Box>
        
        {/* Boîte de dialogue des détails du col */}
        <ColDetailsDialog 
          open={showColDetails}
          col={selectedCol}
          onClose={handleCloseColDetails}
          onExportTrack={handleExportTrack}
          onMarkAsCompleted={handleMarkAsCompleted}
          onAddToChallenge={handleSelectCol}
          isSelected={selectedCol ? selectedCols.findIndex(col => col.id === selectedCol.id) !== -1 : false}
          isCompleted={selectedCol ? userCompletedCols.includes(selectedCol.id) : false}
          maxColsReached={selectedCols.length >= 7}
          exportFormat={exportFormat}
          onExportFormatChange={handleExportFormatChange}
          weatherData={selectedCol ? weatherData[selectedCol.id] : null}
        />
        
        {/* Boîte de dialogue pour planifier une ascension */}
        <ScheduleDialog 
          open={showScheduleDialog}
          onClose={closeScheduleDialog}
          onSchedule={handleScheduleAscent}
          selectedColId={scheduleColId}
          selectedColName={scheduleColName}
        />
        
        {/* Notifications */}
        <Snackbar
          open={Boolean(notification)}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          message={notification?.message}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {notification && (
            <Alert 
              onClose={handleCloseNotification} 
              severity={notification.severity || 'info'} 
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </Box>
    </Box>
  );
};

export default SevenMajorsChallenge;
