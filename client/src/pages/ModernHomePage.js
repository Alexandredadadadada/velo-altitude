import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import styled from 'styled-components';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useDeviceDetection } from '../hooks/useDeviceDetection';
import { Helmet } from 'react-helmet';

// Import components
import HeroSection from '../components/home/modern/HeroSection';
import FeaturesSection from '../components/home/modern/FeaturesSection';
import TestimonialsSection from '../components/home/modern/TestimonialsSection';
import Footer from '../components/common/Footer';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Background images for dynamic background
const backgroundImages = [
  '/assets/backgrounds/alpe-dhuez.jpg',
  '/assets/backgrounds/col-du-tourmalet.jpg',
  '/assets/backgrounds/col-du-galibier.jpg',
  '/assets/backgrounds/mont-ventoux.jpg',
  '/assets/backgrounds/stelvio-pass.jpg'
];

const ModernHomePage = () => {
  // Device & battery detection for performance optimizations
  const { isMobile, isTablet, isLowEndDevice } = useDeviceDetection();
  
  // State to manage animation complexity
  const [animationComplexity, setAnimationComplexity] = useState('high');
  const [currentBackground, setCurrentBackground] = useState(0);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [logoAnimationComplete, setLogoAnimationComplete] = useState(false);
  
  // Refs
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const logoRef = useRef(null);
  const backgroundRef = useRef(null);
  
  // Animation progress
  const [scrollProgress, setScrollProgress] = useState(0);

  // Preload background images
  useEffect(() => {
    const preloadImages = async () => {
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = src;
          img.onload = () => resolve(src);
          img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        });
      };
      
      try {
        await Promise.all(backgroundImages.map(img => loadImage(img)));
        setBackgroundLoaded(true);
      } catch (error) {
        console.error("Error preloading images:", error);
        // Still set as loaded to prevent blocking UI
        setBackgroundLoaded(true);
      }
    };
    
    preloadImages();
  }, []);
  
  // Set animation complexity based on device
  useEffect(() => {
    if (isMobile || isLowEndDevice) {
      setAnimationComplexity('low');
    } else if (isTablet) {
      setAnimationComplexity('medium');
    } else {
      setAnimationComplexity('high');
    }
  }, [isMobile, isTablet, isLowEndDevice]);
  
  // Handle scroll events and animation triggers
  useEffect(() => {
    if (!logoAnimationComplete) return;
    
    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const progress = scrollTop / windowHeight;
      setScrollProgress(progress);
    };
    
    // Set up GSAP animations
    const setupAnimations = () => {
      // Only setup complex animations if the device can handle them
      if (animationComplexity !== 'low') {
        // Background parallax effect
        gsap.to(backgroundRef.current, {
          backgroundPositionY: '30%',
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
        
        // Dynamic background change on scroll
        const sections = [heroRef.current, featuresRef.current];
        sections.forEach((section, index) => {
          ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            onEnter: () => {
              if (index < backgroundImages.length) {
                setCurrentBackground(index);
              }
            },
            onEnterBack: () => {
              if (index < backgroundImages.length) {
                setCurrentBackground(index);
              }
            }
          });
        });
      }
    };
    
    // Initialize scroll events
    window.addEventListener('scroll', updateScrollProgress);
    setupAnimations();
    
    // Animate logo on mount
    if (logoRef.current && animationComplexity !== 'low') {
      const logoTimeline = gsap.timeline();
      logoTimeline.fromTo(
        logoRef.current,
        { 
          scale: 0,
          opacity: 0,
          rotation: -10
        },
        { 
          scale: 1,
          opacity: 1,
          rotation: 0,
          duration: 1.2,
          ease: 'elastic.out(1, 0.5)'
        }
      );
    }
    
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [animationComplexity, logoAnimationComplete]);

  // Initial logo animation
  useEffect(() => {
    if (logoRef.current && !logoAnimationComplete) {
      const logoTimeline = gsap.timeline({
        onComplete: () => setLogoAnimationComplete(true)
      });
      
      logoTimeline
        .fromTo(
          logoRef.current,
          { 
            y: -50,
            opacity: 0,
            scale: 0.8
          },
          { 
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1.5,
            ease: 'elastic.out(1, 0.5)'
          }
        )
        .to(
          logoRef.current.querySelector('.logo-text'),
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1,
            ease: 'power2.out'
          },
          '-=1'
        );
    }
  }, [logoAnimationComplete]);
  
  return (
    <>
      <Helmet>
        <title>Dashboard-Velo | Votre compagnon de cyclisme</title>
        <meta name="description" content="Dashboard-Velo vous aide à explorer les cols cyclistes, suivre vos entrainements, optimiser votre nutrition et rejoindre une communauté de passionnés." />
      </Helmet>
      
      <PageContainer>
        {/* Dynamic background */}
        <DynamicBackground 
          ref={backgroundRef}
          $currentImage={backgroundImages[currentBackground]}
          $loaded={backgroundLoaded}
          $reduced={animationComplexity === 'low'}
        >
          {/* Overlay with branded gradient */}
          <BackgroundOverlay $animationComplexity={animationComplexity} />
        </DynamicBackground>
        
        {/* Logo Animation */}
        <LogoContainer ref={logoRef}>
          <LogoImage src="/assets/logo/dashboard-velo-logo.svg" alt="Dashboard-Velo Logo" />
          <LogoText className="logo-text">Dashboard-Velo.com</LogoText>
        </LogoContainer>
        
        {/* Hero section */}
        <SectionWrapper ref={heroRef}>
          <HeroSection animationComplexity={animationComplexity} />
        </SectionWrapper>
        
        {/* Features section */}
        <SectionWrapper ref={featuresRef}>
          <FeaturesSection animationComplexity={animationComplexity} scrollProgress={scrollProgress} />
        </SectionWrapper>
        
        {/* Testimonials */}
        <SectionWrapper>
          <TestimonialsSection animationComplexity={animationComplexity} />
        </SectionWrapper>
        
        {/* Footer */}
        <Footer />
      </PageContainer>
    </>
  );
};

// Styled components
const PageContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
`;

const SectionWrapper = styled.section`
  padding: 100px 20px;
  position: relative;
  z-index: 2;
  
  @media (max-width: 768px) {
    padding: 60px 15px;
  }
`;

const DynamicBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$currentImage});
  background-size: cover;
  background-position: center center;
  transition: background-image 1.5s ease-in-out;
  opacity: ${props => props.$loaded ? 1 : 0};
  filter: ${props => props.$reduced ? 'blur(0px)' : 'blur(2px)'};
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
  }
`;

const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${props => 
    props.$animationComplexity === 'low' 
      ? 'rgba(25, 42, 86, 0.7)'
      : 'linear-gradient(to bottom, rgba(25, 42, 86, 0.7), rgba(42, 82, 152, 0.5))'
  };
  z-index: 1;
`;

const LogoContainer = styled.div`
  position: fixed;
  top: 20px;
  left: 30px;
  z-index: 10;
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const LogoImage = styled.img`
  height: 50px;
  width: auto;
  
  @media (max-width: 768px) {
    height: 40px;
  }
`;

const LogoText = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  margin-left: 15px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  clip-path: inset(0 100% 0 0);
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
    margin-left: 0;
    margin-top: 5px;
  }
`;

export default ModernHomePage;
