import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import styled from 'styled-components';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

// Custom hooks and services
import { useProgressiveImageLoader } from '../../../services/progressiveImageLoader';
import { useBatteryStatus } from '../../../hooks/useBatteryStatus';

const HeroSection = React.forwardRef(({ animationComplexity }, ref) => {
  const containerRef = useRef(null);
  const videoBgRef = useRef(null);
  const threeContainerRef = useRef(null);
  const threeSceneRef = useRef(null);
  const particlesRef = useRef(null);
  
  const [loaded, setLoaded] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [model3DReady, setModel3DReady] = useState(false);
  
  const { isBatteryLow } = useBatteryStatus();
  
  // Particle animation configuration
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };
  
  // Initialize video background
  useEffect(() => {
    if (videoBgRef.current && animationComplexity !== 'low') {
      const videoElement = videoBgRef.current;
      
      // For low battery, we don't autoplay video to save power
      if (!isBatteryLow) {
        // Make video play silently and auto
        videoElement.muted = true;
        videoElement.playsInline = true;
        
        // Load appropriate video quality based on animation complexity
        const videoQuality = animationComplexity === 'high' ? 'high' : 'medium';
        videoElement.src = `/assets/videos/cycling-aerial-${videoQuality}.mp4`;
        
        videoElement.addEventListener('canplaythrough', () => {
          videoElement.play().catch(err => {
            console.warn('Auto-play was prevented:', err);
          });
          setVideoReady(true);
        });
      } else {
        // Just show a static image if battery is low
        setVideoReady(true);
      }
    } else {
      // No video for low animation complexity
      setVideoReady(true);
    }
    
    return () => {
      if (videoBgRef.current) {
        videoBgRef.current.pause();
        videoBgRef.current.src = '';
      }
    };
  }, [animationComplexity, isBatteryLow]);
  
  // Initialize 3D mountain visualization
  useEffect(() => {
    if (threeContainerRef.current && animationComplexity !== 'low') {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      
      // Create renderer with appropriate settings
      const renderer = new THREE.WebGLRenderer({
        antialias: animationComplexity === 'high',
        alpha: true,
        powerPreference: 'high-performance'
      });
      
      renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
      threeContainerRef.current.appendChild(renderer.domElement);
      
      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(10, 10, 5);
      scene.add(directionalLight);
      
      // Camera position
      camera.position.z = 5;
      camera.position.y = 1;
      
      // Initialize controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 3;
      controls.maxDistance = 8;
      controls.maxPolarAngle = Math.PI / 2;
      
      // Set up GLTF loader with Draco compression
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('/assets/draco/');
      
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
      
      // Load 3D model
      const modelDetail = animationComplexity === 'high' ? 'high' : 'medium';
      gltfLoader.load(
        `/assets/models/cols/mont-ventoux-${modelDetail}.glb`,
        (gltf) => {
          const model = gltf.scene;
          
          // Scale and position the model
          model.scale.set(1, 1, 1);
          model.position.y = -1;
          scene.add(model);
          
          // Signal that the model is ready
          setModel3DReady(true);
          
          // Optional: Add an animated highlight to the climbing path
          const pathGeometry = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(-1, -0.5, 0),
              new THREE.Vector3(-0.5, 0, 0.5),
              new THREE.Vector3(0, 0.5, 0),
              new THREE.Vector3(0.5, 1, -0.5),
              new THREE.Vector3(1, 1.5, 0)
            ]),
            20,
            0.02,
            8,
            false
          );
          
          const pathMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498db,
            emissive: 0x3498db,
            emissiveIntensity: 0.5
          });
          
          const path = new THREE.Mesh(pathGeometry, pathMaterial);
          model.add(path);
          
          // Animate the path emission
          const clock = new THREE.Clock();
          const animate = () => {
            const elapsedTime = clock.getElapsedTime();
            pathMaterial.emissiveIntensity = 0.3 + Math.sin(elapsedTime * 2) * 0.2;
            
            controls.update();
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
          };
          
          animate();
        },
        (xhr) => {
          console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
          console.error('An error happened loading the model', error);
          // Fallback: set model ready even on error to continue the UI flow
          setModel3DReady(true);
        }
      );
      
      // Handle window resize
      const handleResize = () => {
        camera.aspect = threeContainerRef.current.clientWidth / threeContainerRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(threeContainerRef.current.clientWidth, threeContainerRef.current.clientHeight);
      };
      
      window.addEventListener('resize', handleResize);
      
      // Store scene reference
      threeSceneRef.current = { scene, camera, renderer, controls };
      
      return () => {
        window.removeEventListener('resize', handleResize);
        
        // Clean up Three.js resources
        if (threeContainerRef.current) {
          threeContainerRef.current.removeChild(renderer.domElement);
        }
        
        renderer.dispose();
        controls.dispose();
        
        // Dispose geometries and materials
        scene.traverse((object) => {
          if (object.geometry) object.geometry.dispose();
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      };
    } else {
      // Skip 3D model for low animation complexity
      setModel3DReady(true);
    }
  }, [animationComplexity]);
  
  // Animate the text reveal
  useEffect(() => {
    if (loaded) {
      // Animate the heading with character reveal
      const headingElement = document.querySelector('.hero-heading');
      if (headingElement) {
        const text = headingElement.innerText;
        headingElement.innerHTML = '';
        
        // Create an element for each character
        [...text].forEach((char, index) => {
          const charSpan = document.createElement('span');
          charSpan.className = 'heading-char';
          charSpan.innerText = char === ' ' ? '\u00A0' : char;
          charSpan.style.opacity = 0;
          charSpan.style.transform = 'translateY(20px)';
          headingElement.appendChild(charSpan);
        });
        
        // Animate each character
        gsap.to('.heading-char', {
          opacity: 1,
          y: 0,
          stagger: 0.05,
          duration: 0.8,
          ease: 'power3.out',
          delay: 0.5
        });
      }
      
      // Animate the CTA button
      gsap.to('.cta-button', {
        scale: [1, 1.05, 1],
        repeat: -1,
        yoyo: true,
        duration: 1.5,
        ease: 'sine.inOut'
      });
    }
  }, [loaded]);
  
  // Set component as loaded when all parts are ready
  useEffect(() => {
    if (videoReady && model3DReady) {
      setLoaded(true);
    }
  }, [videoReady, model3DReady]);
  
  return (
    <HeroContainer ref={ref}>
      {/* Dynamic background */}
      <BackgroundContainer>
        {animationComplexity !== 'low' && (
          <VideoBg
            ref={videoBgRef}
            disableRemotePlayback
            playsInline
            muted
            loop
          />
        )}
        {/* Fallback background for low animation complexity */}
        {animationComplexity === 'low' && (
          <StaticBg />
        )}
        <BackgroundOverlay />
      </BackgroundContainer>
      
      {/* Particles animation */}
      {animationComplexity !== 'low' && (
        <ParticlesContainer>
          <Particles
            id="tsparticles"
            init={particlesInit}
            options={{
              fpsLimit: animationComplexity === 'high' ? 120 : 60,
              particles: {
                number: {
                  value: animationComplexity === 'high' ? 100 : 50,
                  density: {
                    enable: true,
                    value_area: 800
                  }
                },
                color: {
                  value: "#ffffff"
                },
                opacity: {
                  value: 0.3,
                  random: true
                },
                size: {
                  value: 3,
                  random: true
                },
                move: {
                  enable: true,
                  speed: animationComplexity === 'high' ? 1.5 : 0.8,
                  direction: "none",
                  random: true,
                  outMode: "out"
                }
              },
              interactivity: {
                detect_on: "canvas",
                events: {
                  onhover: {
                    enable: true,
                    mode: "repulse"
                  }
                }
              },
              retina_detect: true
            }}
          />
        </ParticlesContainer>
      )}
      
      <ContentContainer ref={containerRef}>
        <HeroContent>
          <LogoContainer>
            {/* Animated logo */}
            <motion.svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ 
                duration: 1.2, 
                ease: "easeOut",
                delay: 0.3
              }}
            >
              <circle cx="40" cy="40" r="35" fill="none" stroke="#ffffff" strokeWidth="2" />
              <path d="M20,60 L40,20 L60,60 Z" fill="#3498db" />
            </motion.svg>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Dashboard-Velo.com
            </motion.h1>
          </LogoContainer>
          
          <TextContent>
            <h2 className="hero-heading">Élevez votre cyclisme. Visualisez votre progression.</h2>
            <p>
              La plateforme ultime pour les cyclistes passionnés. Analysez vos performances, explorez les cols les plus emblématiques d'Europe et suivez vos progrès.
            </p>
            
            <CTAButton className="cta-button">
              Commencer l'aventure
            </CTAButton>
          </TextContent>
          
          <Model3DContainer>
            <Model3DLabel>
              Explorez le Mont Ventoux en 3D
              <motion.div
                className="arrow-indicator"
                animate={{ y: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                ↓
              </motion.div>
            </Model3DLabel>
            <Model3DView ref={threeContainerRef} />
          </Model3DContainer>
        </HeroContent>
        
        <ScrollIndicator>
          <motion.div
            className="scroll-arrow"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            ↓
          </motion.div>
          <span>Découvrir plus</span>
        </ScrollIndicator>
      </ContentContainer>
    </HeroContainer>
  );
});

// Styled Components
const HeroContainer = styled.section`
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 700px;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  z-index: 1;
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
`;

const VideoBg = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`;

const StaticBg = styled.div`
  width: 100%;
  height: 100%;
  background-image: url('/assets/images/mountain-bg-compressed.jpg');
  background-size: cover;
  background-position: center;
  position: absolute;
  top: 0;
  left: 0;
`;

const BackgroundOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.3) 50%,
    rgba(0, 0, 0, 0.7) 100%
  );
`;

const ParticlesContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
`;

const ContentContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 0 20px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  z-index: 1;
`;

const HeroContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 40px;
  align-items: center;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0;
    
    @media (max-width: 768px) {
      font-size: 2rem;
    }
  }
`;

const TextContent = styled.div`
  grid-column: 1;
  
  h2 {
    font-size: 3.5rem;
    color: white;
    margin-bottom: 20px;
    line-height: 1.2;
    
    @media (max-width: 1024px) {
      font-size: 2.8rem;
    }
    
    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }
  
  p {
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 40px;
    max-width: 80%;
    
    @media (max-width: 768px) {
      max-width: 100%;
      font-size: 1rem;
    }
  }
`;

const CTAButton = styled.button`
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
    background: linear-gradient(45deg, #2980b9, #3498db);
  }
  
  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 12px 24px;
  }
`;

const Model3DContainer = styled.div`
  grid-column: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  @media (max-width: 1024px) {
    grid-column: 1;
    margin-top: 40px;
  }
`;

const Model3DLabel = styled.div`
  color: white;
  font-size: 1.2rem;
  margin-bottom: 15px;
  text-align: center;
  opacity: 0.9;
  
  .arrow-indicator {
    font-size: 1.5rem;
    margin-top: 5px;
  }
`;

const Model3DView = styled.div`
  width: 100%;
  height: 400px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    height: 300px;
  }
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: white;
  font-size: 1rem;
  opacity: 0.7;
  
  .scroll-arrow {
    font-size: 2rem;
    margin-bottom: 5px;
  }
`;

export default HeroSection;
