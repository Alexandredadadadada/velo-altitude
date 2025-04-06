import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Stepper, 
  Step, 
  StepLabel, 
  Button, 
  Typography, 
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { useRouter } from 'next/router';
import { NutritionPlan, NutritionPreferences } from '../../../types';
import { APIOrchestrator } from '../../../api/orchestration';
import PersonalInfoStep from './steps/PersonalInfoStep';
import GoalsStep from './steps/GoalsStep';
import DietaryPreferencesStep from './steps/DietaryPreferencesStep';
import PlanPreviewStep from './steps/PlanPreviewStep';

// Type pour les données utilisateur du formulaire
export interface PlanFormData {
  // Infos personnelles
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // Objectifs
  targetGoal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing';
  trainingFrequency: number; // Nombre de séances par semaine
  trainingIntensity: 'low' | 'medium' | 'high';
  upcomingEvents: boolean;
  eventType?: 'short_race' | 'long_race' | 'stage_race' | 'gran_fondo' | 'col_challenge';
  eventDate?: Date;
  
  // Préférences alimentaires
  dietType: 'standard' | 'vegetarian' | 'vegan' | 'pescatarian' | 'low_carb' | 'keto' | 'mediterranean';
  allergies: string[];
  intolerances: string[];
  excludedFoods: string[];
  preferredFoods: string[];
  mealFrequency: number; // Nombre de repas par jour
  supplementsUsed: string[];
  
  // Plan généré
  planName: string;
  planDescription: string;
  dailyCalories: number;
  macroRatio: {
    protein: number;
    carbs: number;
    fat: number;
  };
}

// État initial du formulaire
const initialFormData: PlanFormData = {
  // Infos personnelles
  age: 30,
  gender: 'male',
  weight: 70,
  height: 175,
  activityLevel: 'moderate',
  
  // Objectifs
  targetGoal: 'climbing',
  trainingFrequency: 3,
  trainingIntensity: 'medium',
  upcomingEvents: false,
  
  // Préférences alimentaires
  dietType: 'standard',
  allergies: [],
  intolerances: [],
  excludedFoods: [],
  preferredFoods: [],
  mealFrequency: 3,
  supplementsUsed: [],
  
  // Plan généré
  planName: "Plan Nutritionnel Cyclisme",
  planDescription: "Plan nutritionnel personnalisé pour l'ascension de cols",
  dailyCalories: 0,
  macroRatio: {
    protein: 25,
    carbs: 55,
    fat: 20
  }
};

interface PlanFormProps {
  initialTemplate?: string;
}

const PlanForm: React.FC<PlanFormProps> = ({ initialTemplate }) => {
  const theme = useTheme();
  const router = useRouter();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<NutritionPlan | null>(null);
  const apiOrchestrator = new APIOrchestrator();

  // Étapes du formulaire
  const steps = [
    'Informations personnelles',
    'Objectifs cyclistes',
    'Préférences alimentaires',
    'Aperçu du plan'
  ];

  // Appliquer un template prédéfini si spécifié
  useEffect(() => {
    if (initialTemplate) {
      applyTemplate(initialTemplate);
    }
  }, [initialTemplate]);

  // Fonction pour appliquer un template prédéfini
  const applyTemplate = (templateId: string) => {
    let template = { ...formData };
    
    switch (templateId) {
      case 'climbing':
        template = {
          ...formData,
          targetGoal: 'climbing',
          trainingIntensity: 'high',
          planName: "Plan Ascension de Cols",
          planDescription: "Optimisé pour les cyclistes qui se préparent à gravir des cols difficiles",
          macroRatio: { protein: 25, carbs: 55, fat: 20 }
        };
        break;
      case 'endurance':
        template = {
          ...formData,
          targetGoal: 'endurance',
          trainingIntensity: 'medium',
          planName: "Plan Endurance",
          planDescription: "Adapté aux longues sorties et aux événements d'endurance",
          macroRatio: { protein: 20, carbs: 60, fat: 20 }
        };
        break;
      case 'performance':
        template = {
          ...formData,
          targetGoal: 'performance',
          trainingIntensity: 'high',
          planName: "Plan Performance",
          planDescription: "Maximisez votre puissance et votre vitesse",
          macroRatio: { protein: 30, carbs: 50, fat: 20 }
        };
        break;
      case 'weight_loss':
        template = {
          ...formData,
          targetGoal: 'weight_loss',
          trainingIntensity: 'medium',
          planName: "Plan Perte de Poids",
          planDescription: "Conçu pour les cyclistes cherchant à optimiser leur poids",
          macroRatio: { protein: 35, carbs: 40, fat: 25 }
        };
        break;
    }
    
    setFormData(template);
  };

  // Fonction pour mettre à jour les données du formulaire
  const updateFormData = (data: Partial<PlanFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  // Calcul des calories et macros basé sur les données utilisateur
  const calculateNutrition = () => {
    // Calcul du métabolisme de base (BMR) avec l'équation de Mifflin-St Jeor
    let bmr = 0;
    if (formData.gender === 'male') {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age + 5;
    } else {
      bmr = 10 * formData.weight + 6.25 * formData.height - 5 * formData.age - 161;
    }
    
    // Facteur d'activité
    const activityFactors = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    
    // Ajustement pour l'entraînement cycliste
    const trainingIntensityFactors = {
      low: 1.1,
      medium: 1.2,
      high: 1.3
    };
    
    // Calculer les calories quotidiennes (TDEE)
    let dailyCalories = bmr * activityFactors[formData.activityLevel] * trainingIntensityFactors[formData.trainingIntensity];
    
    // Ajustements basés sur l'objectif
    switch (formData.targetGoal) {
      case 'weight_loss':
        dailyCalories *= 0.85; // Déficit calorique de 15%
        break;
      case 'performance':
      case 'endurance':
      case 'climbing':
        dailyCalories *= 1.1; // Surplus léger pour la performance
        break;
    }
    
    // Arrondir à l'entier le plus proche
    dailyCalories = Math.round(dailyCalories);
    
    return dailyCalories;
  };

  // Génération du plan nutritionnel
  const generatePlan = () => {
    const dailyCalories = calculateNutrition();
    
    // Mise à jour des calories calculées
    updateFormData({ dailyCalories });
    
    // Construction du plan
    const plan: NutritionPlan = {
      id: `plan_${Date.now()}`, // ID temporaire
      userId: "user123", // Serait normalement l'ID de l'utilisateur authentifié
      name: formData.planName,
      description: formData.planDescription,
      targetGoal: formData.targetGoal,
      dailyCalories: dailyCalories,
      macroRatio: formData.macroRatio,
      meals: [
        {
          name: "Petit-déjeuner",
          time: "07:30",
          calories: Math.round(dailyCalories * 0.25),
          macros: {
            protein: Math.round(dailyCalories * 0.25 * formData.macroRatio.protein / 100 / 4), // 4 cal/g pour les protéines
            carbs: Math.round(dailyCalories * 0.25 * formData.macroRatio.carbs / 100 / 4), // 4 cal/g pour les glucides
            fat: Math.round(dailyCalories * 0.25 * formData.macroRatio.fat / 100 / 9) // 9 cal/g pour les lipides
          },
          suggestedFoods: []
        },
        {
          name: "Déjeuner",
          time: "12:30",
          calories: Math.round(dailyCalories * 0.35),
          macros: {
            protein: Math.round(dailyCalories * 0.35 * formData.macroRatio.protein / 100 / 4),
            carbs: Math.round(dailyCalories * 0.35 * formData.macroRatio.carbs / 100 / 4),
            fat: Math.round(dailyCalories * 0.35 * formData.macroRatio.fat / 100 / 9)
          },
          suggestedFoods: []
        },
        {
          name: "Dîner",
          time: "19:30",
          calories: Math.round(dailyCalories * 0.3),
          macros: {
            protein: Math.round(dailyCalories * 0.3 * formData.macroRatio.protein / 100 / 4),
            carbs: Math.round(dailyCalories * 0.3 * formData.macroRatio.carbs / 100 / 4),
            fat: Math.round(dailyCalories * 0.3 * formData.macroRatio.fat / 100 / 9)
          },
          suggestedFoods: []
        },
        {
          name: "Collation",
          time: "16:00",
          calories: Math.round(dailyCalories * 0.1),
          macros: {
            protein: Math.round(dailyCalories * 0.1 * formData.macroRatio.protein / 100 / 4),
            carbs: Math.round(dailyCalories * 0.1 * formData.macroRatio.carbs / 100 / 4),
            fat: Math.round(dailyCalories * 0.1 * formData.macroRatio.fat / 100 / 9)
          },
          suggestedFoods: []
        }
      ],
      createdAt: new Date().toISOString(),
      dietaryRestrictions: {
        allergies: formData.allergies,
        intolerances: formData.intolerances,
        excludedFoods: formData.excludedFoods,
        dietType: formData.dietType
      }
    };
    
    return plan;
  };

  // Enregistrement du plan
  const savePlan = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const plan = generatePlan();
      setGeneratedPlan(plan);
      
      // Appel API pour sauvegarder le plan
      const savedPlan = await apiOrchestrator.createNutritionPlan(plan);
      
      // Redirection vers la page du plan créé
      router.push(`/nutrition/plans/${savedPlan.id}`);
    } catch (err) {
      console.error("Erreur lors de la création du plan:", err);
      setError("Une erreur est survenue lors de la création de votre plan nutritionnel. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation entre les étapes
  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      savePlan();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
      
      // Générer le plan à l'étape finale pour l'aperçu
      if (activeStep === steps.length - 2) {
        const plan = generatePlan();
        setGeneratedPlan(plan);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleCancel = () => {
    router.push('/nutrition/plans');
  };

  // Rendu des étapes du formulaire
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <PersonalInfoStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 1:
        return (
          <GoalsStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 2:
        return (
          <DietaryPreferencesStep 
            formData={formData} 
            updateFormData={updateFormData} 
          />
        );
      case 3:
        return (
          <PlanPreviewStep 
            formData={formData} 
            updateFormData={updateFormData}
            plan={generatedPlan}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Créer un plan nutritionnel personnalisé
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complétez les informations ci-dessous pour obtenir un plan nutritionnel adapté à vos objectifs cyclistes.
        </Typography>
      </Box>
      
      <Stepper 
        activeStep={activeStep} 
        alternativeLabel={!isMobile}
        orientation={isMobile ? "vertical" : "horizontal"}
        sx={{ mb: 4 }}
      >
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Box>
        {renderStepContent(activeStep)}
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          color="secondary"
          disabled={loading}
          onClick={handleCancel}
        >
          Annuler
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            color="primary"
            disabled={activeStep === 0 || loading}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Précédent
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {activeStep === steps.length - 1 ? 'Créer mon plan' : 'Suivant'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default PlanForm;
