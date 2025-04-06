import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Breadcrumbs,
  Link, 
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme,
  Alert,
  Snackbar
} from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NextLink from 'next/link';
import { APIOrchestrator } from '../../../api/orchestration';
import { NutritionPlan, Recipe } from '../../../types';
import PlanHeader from '../../../components/nutrition/plans/PlanHeader';
import PlanMeals from '../../../components/nutrition/plans/PlanMeals';
import PlanRecommendations from '../../../components/nutrition/plans/PlanRecommendations';

const NutritionPlanDetailPage: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [notification, setNotification] = useState<{show: boolean, message: string, severity: 'success' | 'error' | 'info'}>({
    show: false,
    message: '',
    severity: 'info'
  });

  // Récupération du plan et des recettes recommandées
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const api = new APIOrchestrator();
        
        // Récupération du plan nutritionnel
        const planData = await api.getNutritionPlanById(id as string);
        setPlan(planData);
        
        // Récupération des recettes recommandées
        const recipesData = await api.getRecommendedRecipes({
          dietType: planData.dietaryRestrictions?.dietType || 'standard',
          allergies: planData.dietaryRestrictions?.allergies || [],
          goal: planData.targetGoal
        });
        setRecommendedRecipes(recipesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError('Impossible de charger le plan nutritionnel. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  // Gestion des actions sur le plan
  const handleEdit = () => {
    router.push(`/nutrition/plans/modifier/${id}`);
  };
  
  const handleDeleteConfirm = async () => {
    if (!id) return;
    
    try {
      const api = new APIOrchestrator();
      await api.deleteNutritionPlan(id as string);
      
      setShowDeleteDialog(false);
      setNotification({
        show: true,
        message: 'Plan nutritionnel supprimé avec succès',
        severity: 'success'
      });
      
      // Redirection après la suppression
      setTimeout(() => {
        router.push('/nutrition/plans');
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de la suppression du plan:', err);
      setNotification({
        show: true,
        message: 'Erreur lors de la suppression du plan',
        severity: 'error'
      });
      setShowDeleteDialog(false);
    }
  };
  
  const handleShare = () => {
    if (!id) return;
    
    // Création de l'URL à partager
    const shareUrl = `${window.location.origin}/nutrition/plans/${id}`;
    
    // Utilisation de l'API Web Share si disponible
    if (navigator.share) {
      navigator.share({
        title: `Plan nutritionnel: ${plan?.name || 'Velo-Altitude'}`,
        text: `Découvrez ce plan nutritionnel pour cycliste sur Velo-Altitude: ${plan?.name}`,
        url: shareUrl
      }).catch((error) => {
        console.log('Erreur lors du partage', error);
        // Fallback: copier dans le presse-papier
        copyToClipboard(shareUrl);
      });
    } else {
      // Fallback: copier dans le presse-papier
      copyToClipboard(shareUrl);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setNotification({
        show: true,
        message: 'Lien copié dans le presse-papier',
        severity: 'success'
      });
    }, (err) => {
      console.error('Erreur lors de la copie:', err);
      setNotification({
        show: true,
        message: 'Impossible de copier le lien',
        severity: 'error'
      });
    });
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExport = async () => {
    if (!plan) return;
    
    try {
      const api = new APIOrchestrator();
      const pdfBlob = await api.exportNutritionPlanAsPdf(plan.id);
      
      // Création d'un lien de téléchargement
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan-nutritionnel-${plan.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setNotification({
        show: true,
        message: 'Plan nutritionnel exporté avec succès',
        severity: 'success'
      });
    } catch (err) {
      console.error('Erreur lors de l\'export du plan:', err);
      setNotification({
        show: true,
        message: 'Erreur lors de l\'export du plan',
        severity: 'error'
      });
    }
  };
  
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      show: false
    });
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Chargement du plan nutritionnel...
        </Typography>
      </Container>
    );
  }

  if (error || !plan) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || "Ce plan nutritionnel n'existe pas ou a été supprimé."}
        </Alert>
        <Button 
          variant="contained" 
          component={NextLink} 
          href="/nutrition/plans"
        >
          Retour aux plans nutritionnels
        </Button>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>{plan.name} | Plan Nutritionnel | Velo-Altitude</title>
        <meta name="description" content={`Plan nutritionnel personnalisé: ${plan.description}`} />
      </Head>

      {/* Notification */}
      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Dialog de confirmation de suppression */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirmer la suppression
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Êtes-vous sûr de vouloir supprimer ce plan nutritionnel ? Cette action est irréversible.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Fil d'Ariane */}
        <Breadcrumbs 
          separator={<NavigateNextIcon fontSize="small" />} 
          aria-label="breadcrumb"
          sx={{ mb: 4 }}
        >
          <Link component={NextLink} href="/" underline="hover" color="inherit">
            Accueil
          </Link>
          <Link component={NextLink} href="/nutrition" underline="hover" color="inherit">
            Nutrition
          </Link>
          <Link component={NextLink} href="/nutrition/plans" underline="hover" color="inherit">
            Plans Nutritionnels
          </Link>
          <Typography color="text.primary">{plan.name}</Typography>
        </Breadcrumbs>

        {/* En-tête du plan */}
        <PlanHeader 
          plan={plan} 
          onEdit={handleEdit}
          onDelete={() => setShowDeleteDialog(true)}
          onShare={handleShare}
          onPrint={handlePrint}
          onExport={handleExport}
        />

        {/* Repas du plan */}
        <PlanMeals 
          plan={plan} 
          recommendedRecipes={recommendedRecipes}
        />

        {/* Recommandations et suivi */}
        <PlanRecommendations plan={plan} />

        {/* Boutons d'action */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            mt: 4
          }}
        >
          <Button 
            variant="outlined" 
            component={NextLink} 
            href="/nutrition/plans"
          >
            Retour à la liste
          </Button>
          
          <Button 
            variant="contained" 
            component={NextLink} 
            href="/nutrition/journal"
          >
            Accéder au journal alimentaire
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default NutritionPlanDetailPage;
