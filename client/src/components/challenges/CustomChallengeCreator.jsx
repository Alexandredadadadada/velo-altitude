import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckIcon from '@mui/icons-material/Check';
import { useBatteryStatus } from '../../hooks/useBatteryStatus';
import { motion, AnimatePresence } from 'framer-motion';

// Import des composants créés
import ColsGallery from './ColsGallery';
import CompareView from './CompareView';
import SelectedColsView from './SelectedColsView';

/**
 * Créateur de défis personnalisés pour le challenge "7 Majeurs"
 * Intègre la sélection de cols, la visualisation comparative et la gestion de la sélection
 */
const CustomChallengeCreator = ({ cols = [], userChallenges = [], onSaveChallenge }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { batteryStatus } = useBatteryStatus();
  
  // Références pour le défilement
  const compareRef = useRef(null);
  const colsGalleryRef = useRef(null);
  
  // États
  const [selectedCols, setSelectedCols] = useState([]);
  const [challengeName, setChallengeName] = useState('Mon Défi 7 Majeurs');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  
  // Effet pour générer l'URL de partage lorsque la sélection change
  useEffect(() => {
    if (selectedCols.length > 0) {
      // Créer une URL avec les IDs des cols sélectionnés dans l'ordre
      const colsParam = selectedCols.map(col => col.id).join(',');
      const baseUrl = window.location.origin;
      const url = `${baseUrl}/challenge?cols=${colsParam}&name=${encodeURIComponent(challengeName)}`;
      setShareUrl(url);
    } else {
      setShareUrl('');
    }
  }, [selectedCols, challengeName]);
  
  // Gestionnaire pour la sélection/déselection d'un col
  const handleColSelect = (col) => {
    const isAlreadySelected = selectedCols.some(c => c.id === col.id);
    
    if (isAlreadySelected) {
      // Retirer le col de la sélection
      setSelectedCols(selectedCols.filter(c => c.id !== col.id));
    } else {
      // Ajouter le col à la sélection si moins de 7 cols sont déjà sélectionnés
      if (selectedCols.length < 7) {
        setSelectedCols([...selectedCols, col]);
        
        // Montrer le comparateur après sélection de plusieurs cols
        if (selectedCols.length >= 1 && compareRef.current) {
          setTimeout(() => {
            compareRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        }
      } else {
        // Afficher un message si la limite est atteinte
        setSnackbar({
          open: true,
          message: 'Vous avez atteint la limite de 7 cols pour ce défi',
          severity: 'warning'
        });
      }
    }
  };
  
  // Gestionnaire pour la réorganisation des cols
  const handleColsReorder = (reorderedCols) => {
    setSelectedCols(reorderedCols);
  };
  
  // Gestionnaire pour le partage du défi
  const handleShareChallenge = () => {
    setShareDialogOpen(true);
  };
  
  // Gestionnaire pour la modification du nom du défi
  const handleChallengeEdit = () => {
    setNameDialogOpen(true);
  };
  
  // Gestionnaire pour l'exportation du défi en GPX
  const handleChallengeExport = () => {
    // En réalité, cela déclencherait une demande au serveur pour générer un fichier GPX
    // Pour cet exemple, nous simulons juste une alerte de succès
    setSnackbar({
      open: true,
      message: 'Exportation GPX démarrée. Le téléchargement commencera bientôt.',
      severity: 'info'
    });
    
    // Simuler un téléchargement après un court délai
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Exportation GPX terminée avec succès!',
        severity: 'success'
      });
    }, 2000);
  };
  
  // Gestionnaire pour la sauvegarde du défi
  const handleSaveChallenge = () => {
    if (selectedCols.length === 0) {
      setSnackbar({
        open: true,
        message: 'Veuillez sélectionner au moins un col pour créer votre défi',
        severity: 'error'
      });
      return;
    }
    
    // Créer l'objet défi à partir des sélections
    const challenge = {
      name: challengeName,
      cols: selectedCols.map(col => col.id),
      totalDistance: selectedCols.reduce((sum, col) => sum + col.length, 0).toFixed(1),
      totalElevation: Math.round(selectedCols.reduce((sum, col) => sum + (col.length * col.averageGradient * 10), 0))
    };
    
    // Appeler la fonction de sauvegarde du parent
    onSaveChallenge(challenge);
    
    // Afficher un message de succès
    setSnackbar({
      open: true,
      message: 'Votre défi a été sauvegardé avec succès!',
      severity: 'success'
    });
  };
  
  // Copier l'URL de partage dans le presse-papier
  const copyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
      
      setSnackbar({
        open: true,
        message: 'Lien copié dans le presse-papier!',
        severity: 'success'
      });
    });
  };

  // Variants pour les animations Framer Motion
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.6,
        ease: "easeOut" 
      }
    }
  };

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 200, damping: 10 }
    }
  };

  const buttonVariants = {
    hover: { 
      scale: 1.05,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: { type: "spring", stiffness: 400, damping: 10 }
    },
    tap: { scale: 0.95 }
  };

  // Étapes du processus de création
  const steps = [
    'Sélection des cols',
    'Comparaison des profils',
    'Finalisation du défi'
  ];

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
      if (step === 1 && compareRef.current) {
        setTimeout(() => {
          compareRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <Container maxWidth="xl">
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: 3,
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid',
            borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)'
          }}
        >
          {/* Decoration elements */}
          <Box
            component={motion.div}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              opacity: [0.5, 0.7, 0.5]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'mirror'
            }}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, rgba(37,99,235,0) 70%)',
              zIndex: 0,
              transform: 'translate(100px, -150px)',
              filter: 'blur(40px)'
            }}
          />
          
          <Box
            component={motion.div}
            animate={{
              x: [0, -30, 0],
              y: [0, 50, 0],
              opacity: [0.4, 0.6, 0.4]
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              repeatType: 'mirror'
            }}
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, rgba(249,115,22,0) 70%)',
              zIndex: 0,
              transform: 'translate(-200px, 200px)',
              filter: 'blur(40px)'
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <motion.div variants={sectionVariants}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h4"
                  component="h1"
                  fontWeight={700}
                  sx={{
                    mb: 2,
                    background: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textAlign: 'center'
                  }}
                >
                  Créez votre défi "7 Majeurs"
                </Typography>
                
                <Typography 
                  variant="subtitle1" 
                  paragraph
                  sx={{
                    textAlign: 'center',
                    maxWidth: '800px',
                    mx: 'auto',
                    opacity: 0.8
                  }}
                >
                  Sélectionnez jusqu'à 7 cols pour créer votre propre défi. Organisez-les dans l'ordre que vous souhaitez parcourir, 
                  comparez leurs profils d'élévation et leurs statistiques, puis partagez votre défi avec la communauté.
                </Typography>
                
                {/* Stepper for the creation process */}
                <Stepper 
                  activeStep={step - 1} 
                  sx={{ 
                    mt: 4, 
                    mb: 4,
                    '.MuiStepConnector-line': {
                      borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                    },
                    '.MuiStepLabel-iconContainer': {
                      '& .MuiStepIcon-root': {
                        fontSize: '2rem',
                        transition: 'all 0.3s ease',
                        '&.Mui-active': {
                          color: '#2563EB',
                          filter: 'drop-shadow(0 0 8px rgba(37,99,235,0.5))'
                        },
                        '&.Mui-completed': {
                          color: '#10B981'
                        }
                      }
                    }
                  }}
                >
                  {steps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel>
                        <motion.div
                          animate={step === index + 1 ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.5, repeat: 0 }}
                        >
                          <Typography 
                            variant="body2" 
                            fontWeight={step === index + 1 ? 700 : 400}
                            sx={{ 
                              opacity: step === index + 1 ? 1 : 0.7,
                              color: step === index + 1 ? 'primary.main' : 'inherit',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {label}
                          </Typography>
                        </motion.div>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Section 1: Sélection actuelle */}
                <Box sx={{ mb: 6 }}>
                  <motion.div variants={sectionVariants}>
                    <SelectedColsView 
                      selectedCols={selectedCols}
                      onColRemove={handleColSelect}
                      onColsReorder={handleColsReorder}
                      onChallengeEdit={handleChallengeEdit}
                      onChallengeShare={handleShareChallenge}
                      onChallengeExport={handleChallengeExport}
                      challengeName={challengeName}
                    />
                  </motion.div>
                  
                  {selectedCols.length > 0 && (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        mt: 3,
                        mb: 1
                      }}
                    >
                      {step === 1 && (
                        <motion.div
                          animate={{
                            y: [0, 10, 0],
                            opacity: [1, 0.8, 1]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                          onClick={handleNextStep}
                          style={{ cursor: 'pointer' }}
                        >
                          <Tooltip title="Passer à la comparaison">
                            <ArrowDownwardIcon color="primary" fontSize="large" />
                          </Tooltip>
                        </motion.div>
                      )}
                    </Box>
                  )}
                </Box>
              </motion.div>
            </AnimatePresence>
            
            {/* Section 2: Comparaison des cols (si au moins 2 cols sélectionnés) */}
            {selectedCols.length >= 2 && (step >= 2) && (
              <Box sx={{ mb: 6 }} ref={compareRef}>
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      display: 'inline-block'
                    }}
                  >
                    Comparer les cols sélectionnés
                  </Typography>
                  
                  <CompareView cols={selectedCols} batteryStatus={batteryStatus} />
                  
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button 
                        variant="outlined" 
                        onClick={handlePrevStep}
                        startIcon={<ArrowDownwardIcon sx={{ transform: 'rotate(180deg)' }} />}
                      >
                        Retour à la sélection
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleNextStep}
                        endIcon={<ArrowDownwardIcon />}
                      >
                        Finaliser le défi
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              </Box>
            )}
            
            {/* Section 3: Catalogue des cols disponibles */}
            {(step === 1 || step === 3) && (
              <Box id="cols-gallery-section" ref={colsGalleryRef}>
                <motion.div
                  variants={sectionVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      display: 'inline-block'
                    }}
                  >
                    {step === 1 ? 'Catalogue des cols disponibles' : 'Finaliser et sauvegarder'}
                  </Typography>
                  
                  {step === 1 ? (
                    <ColsGallery 
                      cols={cols} 
                      selectedCols={selectedCols} 
                      onColSelect={handleColSelect}
                    />
                  ) : (
                    <Box sx={{ mt: 4, p: 4, bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        Votre défi est prêt !
                      </Typography>
                      
                      <Typography variant="body1" paragraph>
                        Vous avez sélectionné {selectedCols.length} cols pour un total de {selectedCols.reduce((sum, col) => sum + col.length, 0).toFixed(1)} km
                        et {Math.round(selectedCols.reduce((sum, col) => sum + (col.length * col.averageGradient * 10), 0))} mètres de dénivelé.
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 2, mt: 4 }}>
                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          style={{ flex: 1 }}
                        >
                          <Button 
                            variant="contained"
                            color="primary"
                            fullWidth
                            size="large"
                            startIcon={<SaveIcon />}
                            onClick={handleSaveChallenge}
                            sx={{
                              py: 1.5,
                              background: 'linear-gradient(45deg, #2563EB 30%, #60A5FA 90%)',
                              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                            }}
                          >
                            Sauvegarder mon défi
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          style={{ flex: 1 }}
                        >
                          <Button 
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            size="large"
                            startIcon={<ShareIcon />}
                            onClick={handleShareChallenge}
                            sx={{ py: 1.5 }}
                          >
                            Partager mon défi
                          </Button>
                        </motion.div>
                        
                        <motion.div
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          style={{ flex: 1 }}
                        >
                          <Button 
                            variant="outlined"
                            fullWidth
                            size="large"
                            startIcon={<FileDownloadIcon />}
                            onClick={handleChallengeExport}
                            sx={{ py: 1.5 }}
                          >
                            Exporter en GPX
                          </Button>
                        </motion.div>
                      </Box>
                    </Box>
                  )}
                  
                  {step === 1 && selectedCols.length >= 2 && (
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                      <motion.div
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                      >
                        <Button
                          onClick={handleNextStep}
                          variant="contained"
                          endIcon={<ArrowDownwardIcon />}
                          component={motion.button}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          sx={{
                            minWidth: '200px',
                            borderRadius: '30px',
                            background: 'linear-gradient(45deg, #2563EB, #60A5FA)',
                            boxShadow: '0 10px 20px rgba(37, 99, 235, 0.2)',
                            py: 1.5,
                            '&:hover': {
                              boxShadow: '0 10px 25px rgba(37, 99, 235, 0.4)',
                            }
                          }}
                        >
                          Comparer les cols
                        </Button>
                      </motion.div>
                    </Box>
                  )}
                </motion.div>
              </Box>
            )}
          </Box>
        </Paper>
      </motion.div>
      
      {/* Dialogue de partage */}
      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        aria-labelledby="share-dialog-title"
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundImage: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(249,115,22,0.03) 100%)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.2)',
            maxWidth: '500px',
            width: '100%'
          }
        }}
      >
        <DialogTitle 
          id="share-dialog-title"
          sx={{
            pb: 1,
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '1.5rem',
            background: 'linear-gradient(90deg, #2563EB 0%, #60A5FA 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Partagez votre défi
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', opacity: 0.8 }}>
            Utilisez ce lien pour partager votre défi "{challengeName}" avec vos amis ou la communauté.
          </Typography>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                mb: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
              }}
            >
              <TextField
                fullWidth
                value={shareUrl}
                variant="standard"
                InputProps={{
                  readOnly: true,
                  disableUnderline: true,
                  sx: { 
                    fontSize: '0.9rem', 
                    fontFamily: 'monospace',
                    '&::selection': {
                      backgroundColor: 'primary.light',
                      color: 'white'
                    }
                  }
                }}
              />
              
              <IconButton 
                onClick={copyShareUrl}
                color="primary"
                size="small"
                sx={{ ml: 1 }}
              >
                {copied ? <CheckIcon color="success" /> : <ContentCopyIcon />}
              </IconButton>
            </Paper>
          </motion.div>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="outlined"
                startIcon={<ContentCopyIcon />}
                onClick={copyShareUrl}
                sx={{
                  borderRadius: '30px',
                  px: 3,
                  borderColor: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'rgba(37, 99, 235, 0.05)'
                  }
                }}
              >
                {copied ? 'Lien copié!' : 'Copier le lien'}
              </Button>
            </motion.div>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setShareDialogOpen(false)}
            variant="text"
            sx={{ 
              borderRadius: '30px',
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogue de modification du nom */}
      <Dialog
        open={nameDialogOpen}
        onClose={() => setNameDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: theme => theme.palette.mode === 'dark' ? 'rgba(30,40,60,0.9)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>Modifier le nom du défi</Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nom du défi"
            fullWidth
            variant="outlined"
            value={challengeName}
            onChange={(e) => setChallengeName(e.target.value)}
            InputProps={{
              sx: { 
                borderRadius: 2,
                bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setNameDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 6 }}
          >
            Annuler
          </Button>
          <Button 
            onClick={() => setNameDialogOpen(false)} 
            color="primary"
            variant="contained"
            sx={{
              borderRadius: 6,
              background: 'linear-gradient(45deg, #2563EB 30%, #60A5FA 90%)',
            }}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar pour les notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CustomChallengeCreator;
