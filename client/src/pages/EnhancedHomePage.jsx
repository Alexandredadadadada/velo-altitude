import React, { useEffect, useState, useRef, Suspense } from 'react';
import { motion, useAnimation, useScroll, useTransform } from 'framer-motion';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useInView } from 'react-intersection-observer';

// Material UI
import { 
  Box, 
  Button, 
  Card, 
  Container, 
  Grid, 
  Typography, 
  useMediaQuery, 
  useTheme,
  Avatar,
  Chip,
  Divider,
  Rating,
  Tab,
  Tabs
} from '@mui/material';

// Icons
import {
  DirectionsBike,
  Cloud,
  People,
  FitnessCenter,
  Restaurant,
  Terrain,
  ArrowForward,
  StarBorder,
  Check,
  FilterHdr,
  BarChart,
  ThreeDRotation,
  TouchApp,
  WbSunny,
  Public,
  PlayArrow,
  Speed
} from '@mui/icons-material';

// Custom hooks and components
import { useProgressiveImageLoader } from '../hooks/useProgressiveImageLoader';

// Import custom components
import ModulesSection from '../components/home/enhanced/ModulesSection';
import FeaturesShowcase from '../components/home/enhanced/FeaturesShowcase';
import TestimonialsSection from '../components/home/enhanced/TestimonialsSection';
import CTASection from '../components/home/enhanced/CTASection';
import EnhancedFooter from '../components/home/enhanced/EnhancedFooter';

// 3D Col Model Component - Using React Three Fiber
const Col3DModel = ({ modelPath, animationComplexity = 'high' }) => {
  const { camera, gl, scene } = useThree();
  const modelRef = useRef();
  const controlsRef = useRef();
  
  useEffect(() => {
    // Configure camera
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);
    
    // Set up controls
    controlsRef.current = new OrbitControls(camera, gl.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;
    controlsRef.current.enableZoom = true;
    controlsRef.current.minDistance = 3;
    controlsRef.current.maxDistance = 10;
    
    // Draco loader for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/assets/draco/');
    
    // Load the 3D model
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    // Determine model quality based on animation complexity
    const modelQuality = animationComplexity === 'high' ? 'high' : 'medium';
    const modelPathWithQuality = modelPath.replace('.glb', `-${modelQuality}.glb`);
    
    loader.load(
      modelPathWithQuality,
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1, 1, 1);
        model.position.set(0, -1, 0);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        scene.add(model);
        modelRef.current = model;
        
        // Add route path to the model
        const pathGeometry = new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3([
            new THREE.Vector3(-2, 0, 0),
            new THREE.Vector3(-1, 0.3, 0.5),
            new THREE.Vector3(0, 0.8, 0),
            new THREE.Vector3(1, 0.5, -0.5),
            new THREE.Vector3(2, 0.1, 0)
          ]), 
          50, 
          0.05, 
          16, 
          false
        );
        
        const pathMaterial = new THREE.MeshStandardMaterial({ 
          color: 0xf44336,
          emissive: 0xf44336,
          emissiveIntensity: 0.5
        });
        
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        scene.add(path);
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened loading the model:', error);
      }
    );
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    return () => {
      controlsRef.current.dispose();
      dracoLoader.dispose();
      
      if (modelRef.current) {
        scene.remove(modelRef.current);
        modelRef.current.traverse((child) => {
          if (child.isMesh) {
            if (child.material) child.material.dispose();
            if (child.geometry) child.geometry.dispose();
          }
        });
      }
    };
  }, [camera, gl, scene, modelPath, animationComplexity]);
  
  // Animation loop
  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });
  
  return null;
};

// Hero Background Animation
const AnimatedBackground = ({ image, overlayOpacity = 0.6 }) => {
  return (
    <BackgroundContainer>
      <BackgroundImage $backgroundImage={image} />
      <BackgroundOverlay $opacity={overlayOpacity} />
    </BackgroundContainer>
  );
};

// Main Component
const EnhancedHomePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  // Animation complexity based on device
  const [animationComplexity, setAnimationComplexity] = useState('high');
  
  useEffect(() => {
    if (isMobile) {
      setAnimationComplexity('low');
    } else if (isTablet) {
      setAnimationComplexity('medium');
    } else {
      setAnimationComplexity('high');
    }
  }, [isMobile, isTablet]);
  
  // Scroll animations
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  
  // Define main sections
  const sections = [
    { id: 'hero', label: 'Accueil' },
    { id: 'modules', label: 'Modules' },
    { id: 'features', label: 'Fonctionnalités' },
    { id: 'testimonials', label: 'Témoignages' },
  ];
  
  return (
    <>
      <Helmet>
        <title>Velo-Altitude | Votre compagnon de cyclisme</title>
        <meta name="description" content="Découvrez Velo-Altitude, la plateforme complète pour les cyclistes avec information sur les cols, météo, entraînement, et une communauté passionnée." />
      </Helmet>
      
      {/* Hero Section */}
      <HeroSection>
        <AnimatedBackground 
          image="/assets/backgrounds/alpe-dhuez.jpg" 
          overlayOpacity={0.5}
        />
        
        <motion.div 
          style={{ opacity, y }}
          className="hero-content"
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Typography 
                    variant="h1" 
                    component="h1" 
                    sx={{ 
                      fontSize: { xs: '2.5rem', md: '4rem' },
                      fontWeight: 700,
                      color: 'white',
                      textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                      mb: 2
                    }}
                  >
                    Explorez. Grimpez.<br />Dépassez-vous.
                  </Typography>
                  
                  <Typography 
                    variant="h2" 
                    sx={{ 
                      fontSize: { xs: '1.2rem', md: '1.8rem' },
                      fontWeight: 400,
                      color: 'rgba(255,255,255,0.9)',
                      mb: 4,
                      maxWidth: '90%'
                    }}
                  >
                    La plateforme ultime pour les passionnés de cols cyclabes.
                    Informations, entraînement, météo et communauté.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      color="primary"
                      onClick={() => navigate('/signup')}
                      startIcon={<PlayArrow />}
                      sx={{ 
                        borderRadius: '50px',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)'
                      }}
                    >
                      Commencer
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      size="large"
                      onClick={() => navigate('/cols')}
                      sx={{ 
                        borderRadius: '50px',
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        color: 'white',
                        borderColor: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)'
                        }
                      }}
                    >
                      Explorer les cols
                    </Button>
                  </Box>
                  
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      mt: 3,
                      color: 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Check sx={{ fontSize: '1rem' }} /> 100% Gratuit • Mises à jour régulières • Communauté active
                  </Typography>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Model3DCard>
                  <Typography variant="h6" sx={{ mb: 1, color: 'white', textAlign: 'center' }}>
                    Col du Tourmalet - Visualisation 3D
                  </Typography>
                  
                  <Canvas 
                    shadows 
                    gl={{ antialias: animationComplexity !== 'low' }}
                    style={{ width: '100%', height: 350, borderRadius: '8px', marginBottom: '10px' }}
                  >
                    <Suspense fallback={null}>
                      <Col3DModel 
                        modelPath="/assets/models/cols/tourmalet.glb"
                        animationComplexity={animationComplexity}
                      />
                    </Suspense>
                  </Canvas>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'center', 
                      color: 'rgba(255,255,255,0.7)',
                      padding: '0 10px'
                    }}
                  >
                    Faites glisser pour explorer le col en 3D • Dénivelé: 1404m • Longueur: 19km
                  </Typography>
                </Model3DCard>
              </Grid>
            </Grid>
          </Container>
        </motion.div>
        
        <ScrollIndicator>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowForward style={{ transform: 'rotate(90deg)' }} />
          </motion.div>
          <Typography variant="body2">Découvrir plus</Typography>
        </ScrollIndicator>
      </HeroSection>
      
      {/* Modules Section */}
      <ModulesSection animationComplexity={animationComplexity} />
      
      {/* Features Showcase */}
      <FeaturesShowcase animationComplexity={animationComplexity} />
      
      {/* Testimonials Section */}
      <TestimonialsSection animationComplexity={animationComplexity} />
      
      {/* Call to Action Section */}
      <CTASection />
      
      {/* Footer */}
      <EnhancedFooter />
    </>
  );
};

// Styled Components
const HeroSection = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 700px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  
  .hero-content {
    width: 100%;
    z-index: 2;
    padding: 0 20px;
  }
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
`;

const BackgroundImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$backgroundImage});
  background-size: cover;
  background-position: center;
  transition: transform 0.3s ease;
`;

const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, ${props => props.$opacity}) 0%,
    rgba(25, 118, 210, ${props => props.$opacity - 0.1}) 100%
  );
`;

const Model3DCard = styled.div`
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  transform: perspective(1000px) rotateY(-5deg);
  transition: transform 0.3s ease;
  
  &:hover {
    transform: perspective(1000px) rotateY(0deg);
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  z-index: 2;
`;

export default EnhancedHomePage;
