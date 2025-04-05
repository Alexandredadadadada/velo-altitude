import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { gsap } from 'gsap';
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import { useInView } from 'react-intersection-observer';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Custom components
import ProgressiveImage from '../../common/ProgressiveImage';
import { LOAD_PRIORITIES } from '../../../services/progressiveImageLoader';
import Button from '../../common/Button';
import { useNavigate } from 'react-router-dom';

const FeaturesSection = ({ animationComplexity, scrollProgress, className }) => {
  const [ref, inView] = useInView({
    threshold: 0.2,
    triggerOnce: true
  });
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const statsRef = useRef(null);
  const colsRef = useRef(null);
  const flyThroughRef = useRef(null);
  const navigate = useNavigate();
  const controls = useAnimation();
  
  // Sample cols for the showcase
  const showcaseCol = {
    id: 'col-du-tourmalet',
    name: 'Col du Tourmalet',
    elevation: 2115,
    length: 19,
    gradient: 7.4,
    region: 'Pyrénées',
    difficulty: 9.2
  };
  
  // 3D visualization state
  const [is3DReady, setIs3DReady] = useState(false);
  const [showFlyThrough, setShowFlyThrough] = useState(false);
  
  // Stats counters
  const [stats, setStats] = useState({
    cols: 0,
    kilometers: 0,
    users: 0
  });
  
  const statsTargets = {
    cols: 257,
    kilometers: 12500,
    users: 8750
  };
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
      
      // Start the stats counter animation
      const incrementStats = () => {
        setStats(prev => ({
          cols: prev.cols < statsTargets.cols ? prev.cols + 2 : statsTargets.cols,
          kilometers: prev.kilometers < statsTargets.kilometers ? prev.kilometers + 150 : statsTargets.kilometers,
          users: prev.users < statsTargets.users ? prev.users + 85 : statsTargets.users
        }));
      };
      
      // Update stats every 50ms until they reach target values
      const interval = setInterval(() => {
        incrementStats();
        
        if (stats.cols >= statsTargets.cols && 
            stats.kilometers >= statsTargets.kilometers && 
            stats.users >= statsTargets.users) {
          clearInterval(interval);
        }
      }, 50);
      
      return () => clearInterval(interval);
    }
  }, [inView, controls, stats, statsTargets]);
  
  // Initialize Mapbox
  useEffect(() => {
    if (inView && mapContainerRef.current && !mapRef.current && animationComplexity !== 'low') {
      mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.sample_token';
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/outdoors-v11',
        center: [7.734375, 46.07323],  // Center on the Alps
        zoom: 6,
        interactive: true,
        attributionControl: false
      });
      
      // Add famous cycling routes
      map.on('load', () => {
        // Add route data source
        map.addSource('routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              // Tour de France Alpe d'Huez route
              {
                type: 'Feature',
                properties: {
                  name: "Alpe d'Huez",
                  difficulty: 9
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [6.0701, 45.2002],
                    [6.0758, 45.2154],
                    [6.0803, 45.2256],
                    [6.0899, 45.2301]
                    // Simplified for this example
                  ]
                }
              },
              // Stelvio Pass route
              {
                type: 'Feature',
                properties: {
                  name: "Stelvio Pass",
                  difficulty: 10
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [10.4123, 46.5345],
                    [10.4210, 46.5401],
                    [10.4298, 46.5467],
                    [10.4356, 46.5532]
                    // Simplified for this example
                  ]
                }
              },
              // Mont Ventoux route
              {
                type: 'Feature',
                properties: {
                  name: "Mont Ventoux",
                  difficulty: 8
                },
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [5.2781, 44.1023],
                    [5.2840, 44.1134],
                    [5.2899, 44.1256],
                    [5.2947, 44.1345]
                    // Simplified for this example
                  ]
                }
              }
            ]
          }
        });
        
        // Add line layer for the routes
        map.addLayer({
          id: 'routes-line',
          type: 'line',
          source: 'routes',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': [
              'interpolate',
              ['linear'],
              ['get', 'difficulty'],
              5, '#3498db',
              7, '#f39c12',
              10, '#e74c3c'
            ],
            'line-width': 4,
            'line-opacity': 0.7
          }
        });
        
        // Add points for the mountain peaks
        map.addSource('peaks', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  name: "Alpe d'Huez",
                  elevation: 1860
                },
                geometry: {
                  type: 'Point',
                  coordinates: [6.0899, 45.2301]
                }
              },
              {
                type: 'Feature',
                properties: {
                  name: "Stelvio Pass",
                  elevation: 2758
                },
                geometry: {
                  type: 'Point',
                  coordinates: [10.4356, 46.5532]
                }
              },
              {
                type: 'Feature',
                properties: {
                  name: "Mont Ventoux",
                  elevation: 1909
                },
                geometry: {
                  type: 'Point',
                  coordinates: [5.2947, 44.1345]
                }
              }
            ]
          }
        });
        
        // Add circle layer for the peaks
        map.addLayer({
          id: 'peaks-circle',
          type: 'circle',
          source: 'peaks',
          paint: {
            'circle-radius': 8,
            'circle-color': '#e74c3c',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff'
          }
        });
        
        // Add labels for the peaks
        map.addLayer({
          id: 'peaks-label',
          type: 'symbol',
          source: 'peaks',
          layout: {
            'text-field': ['format',
              ['get', 'name'], { 'font-scale': 1 },
              '\n', {},
              ['concat', ['to-string', ['get', 'elevation']], 'm'], { 'font-scale': 0.8 }
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, -1.5],
            'text-anchor': 'bottom'
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(0, 0, 0, 0.7)',
            'text-halo-width': 2
          }
        });
        
        // Add hover effect for routes
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });
        
        map.on('mouseenter', 'routes-line', (e) => {
          map.getCanvas().style.cursor = 'pointer';
          
          const coordinates = e.lngLat;
          const name = e.features[0].properties.name;
          const difficulty = e.features[0].properties.difficulty;
          
          const html = `
            <strong>${name}</strong><br>
            Difficulté: ${difficulty}/10
          `;
          
          popup.setLngLat(coordinates)
            .setHTML(html)
            .addTo(map);
        });
        
        map.on('mouseleave', 'routes-line', () => {
          map.getCanvas().style.cursor = '';
          popup.remove();
        });
        
        // Custom animations for the routes to make them glow
        if (animationComplexity === 'high') {
          let phase = 0;
          const animateRoutes = () => {
            phase += 0.01;
            const pulseOpacity = 0.5 + Math.sin(phase) * 0.25;
            const pulseWidth = 4 + Math.sin(phase) * 1.5;
            
            map.setPaintProperty('routes-line', 'line-opacity', pulseOpacity);
            map.setPaintProperty('routes-line', 'line-width', pulseWidth);
            
            requestAnimationFrame(animateRoutes);
          };
          
          animateRoutes();
        }
      });
      
      mapRef.current = map;
      
      return () => {
        map.remove();
        mapRef.current = null;
      };
    }
  }, [inView, animationComplexity]);
  
  // Set up 3D col cards with Three.js
  useEffect(() => {
    if (colsRef.current && inView && animationComplexity !== 'low') {
      const colCards = colsRef.current.querySelectorAll('.col-card');
      
      colCards.forEach((card, index) => {
        // Only create 3D model viewers for the first 3 cards to save resources
        if (index < 3) {
          const container = card.querySelector('.col-3d-view');
          
          if (container) {
            // Set up Three.js
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            
            const renderer = new THREE.WebGLRenderer({
              antialias: animationComplexity === 'high',
              alpha: true
            });
            
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setClearColor(0x000000, 0);
            container.appendChild(renderer.domElement);
            
            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);
            
            // Camera position
            camera.position.z = 5;
            camera.position.y = 1;
            
            // Create a simplified mountain model
            const createMountain = () => {
              const mountainGeometry = new THREE.BufferGeometry();
              const vertices = [];
              const cols = [
                { name: "Mont Ventoux", vertices: [[-2, 0, -2], [0, 2, 0], [2, 0, 2]] },
                { name: "Alpe d'Huez", vertices: [[-2, 0, -2], [0, 1.5, 0], [2, 0.5, 2]] },
                { name: "Col du Galibier", vertices: [[-2, 0, -2], [-1, 1, 0], [0, 2, 0], [1, 1, 0], [2, 0, 2]] }
              ];
              
              // Use the appropriate vertices based on card index
              const colVertices = cols[Math.min(index, cols.length - 1)].vertices;
              
              // Create triangles from the vertices
              for (let i = 0; i < colVertices.length - 2; i++) {
                vertices.push(
                  ...colVertices[0],
                  ...colVertices[i + 1],
                  ...colVertices[i + 2]
                );
              }
              
              mountainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
              mountainGeometry.computeVertexNormals();
              
              const mountainMaterial = new THREE.MeshStandardMaterial({
                color: 0x3498db,
                side: THREE.DoubleSide,
                flatShading: true
              });
              
              return new THREE.Mesh(mountainGeometry, mountainMaterial);
            };
            
            const mountain = createMountain();
            scene.add(mountain);
            
            // Add a path line along the mountain
            const drawPath = () => {
              const pathMaterial = new THREE.LineBasicMaterial({
                color: 0xe74c3c,
                linewidth: 2
              });
              
              const pathPoints = [
                new THREE.Vector3(-2, 0, -2),
                new THREE.Vector3(-1.5, 0.5, -1.5),
                new THREE.Vector3(-1, 1, -1),
                new THREE.Vector3(-0.5, 1.5, -0.5),
                new THREE.Vector3(0, 2, 0),
                new THREE.Vector3(0.5, 1.5, 0.5),
                new THREE.Vector3(1, 1, 1),
                new THREE.Vector3(1.5, 0.5, 1.5),
                new THREE.Vector3(2, 0, 2)
              ];
              
              const pathGeometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
              return new THREE.Line(pathGeometry, pathMaterial);
            };
            
            const path = drawPath();
            scene.add(path);
            
            // Add animation
            const animate = () => {
              requestAnimationFrame(animate);
              
              mountain.rotation.y += 0.005;
              path.rotation.y += 0.005;
              
              renderer.render(scene, camera);
            };
            
            animate();
            
            // Add event listeners for hover interaction
            container.addEventListener('mousemove', (event) => {
              const rect = container.getBoundingClientRect();
              const x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
              const y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;
              
              gsap.to(camera.position, {
                x: x * 0.5,
                y: 1 + y * 0.5,
                duration: 0.5
              });
            });
            
            // Clean up function
            return () => {
              if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
              }
              
              // Dispose of Three.js resources
              mountain.geometry.dispose();
              mountain.material.dispose();
              path.geometry.dispose();
              path.material.dispose();
              renderer.dispose();
            };
          }
        }
      });
    }
  }, [inView, animationComplexity]);
  
  // Fly-through 3D visualization
  useEffect(() => {
    if (inView && flyThroughRef.current && !is3DReady && animationComplexity !== 'low') {
      // Initialize the Three.js scene for the Fly-through preview
      const container = flyThroughRef.current;
      const width = container.clientWidth;
      const height = 400; // Fixed height for the demo
      
      // Create the scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f2f5);
      scene.fog = new THREE.FogExp2(0xf0f2f5, 0.002);
      
      // Create the camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(5, 5, 10);
      
      // Create the renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);
      
      // Add OrbitControls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 5;
      controls.maxDistance = 50;
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
      scene.add(directionalLight);
      
      // Create terrain based on elevation data of the col
      const createTerrain = () => {
        // Terrain dimensions
        const width = 40;
        const height = 40;
        const segmentsX = 100;
        const segmentsY = 100;
        
        // Generate elevation data (simulated for this example)
        const generateElevationData = () => {
          const data = [];
          const scale = 10; // Elevation scale
          
          for (let i = 0; i <= segmentsY; i++) {
            for (let j = 0; j <= segmentsX; j++) {
              // Normalized coordinates between 0 and 1
              const x = j / segmentsX;
              const y = i / segmentsY;
              
              // Simulate a col with a winding road
              // Mathematical function to simulate terrain elevation
              let elevation = Math.sin(x * Math.PI) * scale * 0.5;
              elevation += Math.sin(y * Math.PI) * scale * 0.3;
              
              // Add hills and valleys with noise functions
              elevation += Math.sin(x * 5 * Math.PI) * Math.cos(y * 4 * Math.PI) * scale * 0.15;
              
              // Simulate the road of the col
              const roadX = Math.sin(y * 4 * Math.PI) * 0.2 + 0.5;
              const distanceToRoad = Math.abs(x - roadX);
              if (distanceToRoad < 0.02) {
                // Slightly flatten the road
                elevation *= 0.9;
              }
              
              data.push(elevation);
            }
          }
          
          return data;
        };
        
        // Create terrain geometry
        const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
        const elevationData = generateElevationData();
        
        // Apply elevation data to geometry
        const vertices = geometry.attributes.position.array;
        for (let i = 0, j = 0; i < vertices.length; i += 3, j++) {
          vertices[i + 2] = elevationData[j]; // Modify Z coordinate
        }
        
        // Recalculate normals for correct lighting
        geometry.computeVertexNormals();
        
        // Create material
        const terrainMaterial = new THREE.MeshStandardMaterial({
          color: 0x5D8233,
          roughness: 0.8,
          metalness: 0.1,
          flatShading: animationComplexity === 'low',
        });
        
        // Create mesh
        const terrain = new THREE.Mesh(geometry, terrainMaterial);
        terrain.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        terrain.receiveShadow = true;
        scene.add(terrain);
        
        // Add road
        const addRoad = () => {
          const roadGeometry = new THREE.BufferGeometry();
          const roadCurve = new THREE.CurvePath();
          
          // Road points
          const points = [];
          for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const x = Math.sin(t * 4 * Math.PI) * 8 + 0;
            const y = t * 40 - 20;
            const z = elevationData[Math.floor(t * segmentsY) * (segmentsX + 1) + Math.floor((x/width + 0.5) * segmentsX)] + 0.1;
            points.push(new THREE.Vector3(x, y, z));
          }
          
          // Create road curve
          for (let i = 0; i < points.length - 1; i++) {
            const curve = new THREE.LineCurve3(points[i], points[i+1]);
            roadCurve.add(curve);
          }
          
          // Generate geometry from curve
          const roadPoints = roadCurve.getPoints(200);
          
          // Road material
          const roadMaterial = new THREE.LineBasicMaterial({
            color: 0x333333,
            linewidth: 2
          });
          
          roadGeometry.setFromPoints(roadPoints);
          const road = new THREE.Line(roadGeometry, roadMaterial);
          road.position.y = 0.1; // Slightly above terrain
          scene.add(road);
          
          return { roadCurve, road };
        };
        
        const { roadCurve, road } = addRoad();
        
        // Add bike that moves along the road
        const addBike = () => {
          // Create a simple object to represent the bike
          const bikeGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.6);
          const bikeMaterial = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
          const bike = new THREE.Mesh(bikeGeometry, bikeMaterial);
          bike.castShadow = true;
          scene.add(bike);
          
          return bike;
        };
        
        const bike = addBike();
        let bikePosition = 0;
        
        // Animate bike along the road
        const animateBike = () => {
          bikePosition = (bikePosition + 0.0005) % 1;
          const point = roadCurve.getPoint(bikePosition);
          if (point) {
            bike.position.set(point.x, point.y + 0.3, point.z + 0.3);
            
            // Orient bike in the direction of the road
            if (bikePosition < 0.99) {
              const nextPoint = roadCurve.getPoint(bikePosition + 0.01);
              if (nextPoint) {
                const direction = new THREE.Vector3().subVectors(nextPoint, point).normalize();
                bike.lookAt(nextPoint);
              }
            }
          }
        };
        
        // Animate camera to simulate Fly-through
        let flyThroughActive = false;
        let flyThroughPosition = 0;
        
        const startFlyThrough = () => {
          flyThroughActive = true;
          flyThroughPosition = 0;
          controls.enabled = false;
        };
        
        const stopFlyThrough = () => {
          flyThroughActive = false;
          controls.enabled = true;
        };
        
        // Add demo button for Fly-through
        const addFlyThroughControls = () => {
          const button = document.createElement('button');
          button.innerText = 'Démo Fly-through';
          button.style.position = 'absolute';
          button.style.bottom = '10px';
          button.style.left = '50%';
          button.style.transform = 'translateX(-50%)';
          button.style.zIndex = '100';
          button.style.padding = '8px 16px';
          button.style.background = '#3498db';
          button.style.color = 'white';
          button.style.border = 'none';
          button.style.borderRadius = '4px';
          button.style.cursor = 'pointer';
          
          button.addEventListener('click', () => {
            if (flyThroughActive) {
              stopFlyThrough();
              button.innerText = 'Démo Fly-through';
            } else {
              startFlyThrough();
              button.innerText = 'Arrêter la démo';
            }
          });
          
          container.appendChild(button);
        };
        
        addFlyThroughControls();
        
        const animateFlyThrough = () => {
          if (flyThroughActive) {
            flyThroughPosition = (flyThroughPosition + 0.001) % 1;
            const point = roadCurve.getPoint(flyThroughPosition);
            if (point) {
              // Position slightly above the road
              camera.position.set(point.x, point.y + 2, point.z + 2);
              
              // Look towards the next point on the path
              if (flyThroughPosition < 0.97) {
                const lookPoint = roadCurve.getPoint(flyThroughPosition + 0.03);
                if (lookPoint) {
                  camera.lookAt(lookPoint);
                }
              }
            }
            
            // End Fly-through after a complete cycle
            if (flyThroughPosition > 0.99) {
              stopFlyThrough();
              const buttons = container.querySelectorAll('button');
              if (buttons.length > 0) {
                buttons[0].innerText = 'Démo Fly-through';
              }
            }
          }
        };
        
        return { animateBike, animateFlyThrough };
      };
      
      const { animateBike, animateFlyThrough } = createTerrain();
      
      // Animation function
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        animateBike();
        animateFlyThrough();
        renderer.render(scene, camera);
      };
      
      animate();
      
      // Resize scene if window size changes
      const handleResize = () => {
        const width = container.clientWidth;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };
      
      window.addEventListener('resize', handleResize);
      
      setIs3DReady(true);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
        if (container && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        
        // Clean up added buttons
        const buttons = container.querySelectorAll('button');
        buttons.forEach(button => container.removeChild(button));
      };
    }
  }, [inView, is3DReady, animationComplexity]);

  // Card animation variants
  const cardVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      rotateY: -10
    },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      rotateY: 0,
      transition: {
        delay: 0.2 + index * 0.1,
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1.000]
      }
    })
  };
  
  // Data for feature cards
  const featureCards = [
    {
      title: "Explorer les cols emblématiques",
      description: "Visualisez et analysez plus de 250 cols européens avec cartes interactives et profils d'élévation détaillés.",
      image: "/assets/images/cols/ventoux.jpg",
      icon: "🏔️",
      col: "Mont Ventoux",
      stats: {
        elevation: "1,909m",
        difficulty: "8/10",
        distance: "21.5km"
      }
    },
    {
      title: "Planifier vos entraînements",
      description: "Créez et suivez des plans d'entraînement personnalisés adaptés à vos objectifs et aux cols que vous souhaitez conquérir.",
      image: "/assets/images/cols/alpe_dhuez.jpg",
      icon: "📈",
      col: "Alpe d'Huez",
      stats: {
        elevation: "1,860m",
        difficulty: "9/10",
        distance: "13.8km"
      }
    },
    {
      title: "Analyser vos performances",
      description: "Suivez vos progrès et analysez vos performances avec des visualisations dynamiques et des statistiques détaillées.",
      image: "/assets/images/cols/galibier.jpg",
      icon: "📊",
      col: "Col du Galibier",
      stats: {
        elevation: "2,642m",
        difficulty: "9/10",
        distance: "17.7km"
      }
    },
    {
      title: "Rejoindre la communauté",
      description: "Partagez vos expériences, relevez des défis communautaires et découvrez de nouveaux itinéraires grâce à notre communauté active.",
      image: "/assets/images/cols/stelvio.jpg",
      icon: "👥",
      col: "Passo dello Stelvio",
      stats: {
        elevation: "2,758m",
        difficulty: "10/10",
        distance: "24.3km"
      }
    }
  ];
  
  return (
    <SectionContainer 
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.3 } }
      }}
    >
      <SectionHeader variants={{ hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } }}>
        <h2>Découvrez nos fonctionnalités avancées</h2>
        <p>Tout ce dont vous avez besoin pour améliorer votre expérience cycliste en un seul endroit</p>
      </SectionHeader>
      
      <StatsContainer 
        ref={statsRef}
        variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
      >
        <StatCard>
          <StatValue>{stats.cols}</StatValue>
          <StatLabel>Cols européens</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.kilometers.toLocaleString()}</StatValue>
          <StatLabel>Kilomètres de parcours</StatLabel>
        </StatCard>
        <StatCard>
          <StatValue>{stats.users.toLocaleString()}</StatValue>
          <StatLabel>Cyclistes actifs</StatLabel>
        </StatCard>
      </StatsContainer>
      
      <FeatureCardsContainer className="features-cards" ref={colsRef}>
        {featureCards.map((card, index) => (
          <FeatureCard 
            key={index}
            className="feature-card col-card"
            custom={index}
            variants={cardVariants}
            whileHover={{ 
              scale: 1.05, 
              rotateY: 5, 
              transition: { duration: 0.3 } 
            }}
          >
            <CardHeader>
              <CardIcon>{card.icon}</CardIcon>
              <CardTitle>{card.title}</CardTitle>
            </CardHeader>
            
            <CardContent>
              <CardDescription>{card.description}</CardDescription>
              
              <Col3DContainer className="col-3d-view" />
              
              <ColInfoCard>
                <ColName>{card.col}</ColName>
                <ColStats>
                  <ColStat>
                    <span>Altitude:</span> {card.stats.elevation}
                  </ColStat>
                  <ColStat>
                    <span>Difficulté:</span> {card.stats.difficulty}
                  </ColStat>
                  <ColStat>
                    <span>Distance:</span> {card.stats.distance}
                  </ColStat>
                </ColStats>
              </ColInfoCard>
            </CardContent>
          </FeatureCard>
        ))}
      </FeatureCardsContainer>
      
      <MapSection variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}>
        <MapTitle>Explorez les routes cyclistes emblématiques d'Europe</MapTitle>
        <MapContainer ref={mapContainerRef} />
        {animationComplexity === 'low' && (
          <MapFallback>
            <ProgressiveImage
              src="/assets/images/map-fallback.jpg"
              alt="Carte des routes cyclistes en Europe"
              priority={LOAD_PRIORITIES.HIGH}
              size="large"
              objectFit="cover"
            />
          </MapFallback>
        )}
      </MapSection>
      
      <FlyThroughSection ref={flyThroughRef}>
        <FlyThroughTitle>Vivez l'expérience Fly-through</FlyThroughTitle>
        <FlyThroughDescription>
          Notre nouvelle fonctionnalité vous permet de survoler virtuellement les cols cyclistes en 3D. 
          Découvrez chaque virage, montée et descente comme si vous y étiez !
        </FlyThroughDescription>
        
        <FlyThroughVisualization>
          <FlyThroughInfo>
            <ColName>{showcaseCol.name}</ColName>
            <ColStats>
              <ColStat>Altitude: <span>{showcaseCol.elevation}m</span></ColStat>
              <ColStat>Distance: <span>{showcaseCol.length}km</span></ColStat>
              <ColStat>Pente moyenne: <span>{showcaseCol.gradient}%</span></ColStat>
              <ColStat>Difficulté: <span>{showcaseCol.difficulty}/10</span></ColStat>
            </ColStats>
            <FlyThroughButton 
              onClick={() => navigate(`/cols/${showcaseCol.id}/visualization`)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Explorer ce col en 3D
            </FlyThroughButton>
          </FlyThroughInfo>
          <FlyThrough3DContainer />
        </FlyThroughVisualization>
        
        <ModuleNavigation>
          <ModuleHeader>Explorez nos modules complets</ModuleHeader>
          <ModulesGrid>
            <ModuleCard 
              onClick={() => navigate('/cols')}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
            >
              <ModuleIcon>🏔️</ModuleIcon>
              <ModuleTitle>Cols</ModuleTitle>
              <ModuleDescription>
                Découvrez notre base de données complète de cols cyclistes avec notre nouvelle fonctionnalité <strong>ColFlyThrough</strong> pour des visualisations 3D immersives et des analyses détaillées.
              </ModuleDescription>
            </ModuleCard>
            <ModuleCard 
              onClick={() => navigate('/training')}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
            >
              <ModuleIcon>⏱️</ModuleIcon>
              <ModuleTitle>Entraînement</ModuleTitle>
              <ModuleDescription>
                Plans d'entraînement personnalisés et outils d'analyse avancés avec notre nouvel outil <strong>TrainingVisualizer3D</strong> pour visualiser vos séances en temps réel.
              </ModuleDescription>
            </ModuleCard>
            <ModuleCard 
              onClick={() => navigate('/nutrition')}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
            >
              <ModuleIcon>🍎</ModuleIcon>
              <ModuleTitle>Nutrition</ModuleTitle>
              <ModuleDescription>
                Conseils nutritionnels adaptés et plans alimentaires avec notre <strong>NutritionRecipeVisualizer</strong> interactif pour optimiser vos performances.
              </ModuleDescription>
            </ModuleCard>
            <ModuleCard 
              onClick={() => navigate('/community')}
              whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)' }}
            >
              <ModuleIcon>👥</ModuleIcon>
              <ModuleTitle>Communauté</ModuleTitle>
              <ModuleDescription>
                Rejoignez d'autres cyclistes, suivez leurs activités avec notre nouveau <strong>CommunityActivityFeed</strong> et participez à des défis communs.
              </ModuleDescription>
            </ModuleCard>
          </ModulesGrid>
        </ModuleNavigation>
        
        {/* Nouvelles fonctionnalités avancées */}
        <AdvancedFeaturesSection
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: 0.2 }
            }
          }}
          initial="hidden"
          animate={controls}
        >
          <AdvancedFeaturesTitle>Nos nouvelles fonctionnalités avancées</AdvancedFeaturesTitle>
          <AdvancedFeaturesDescription>
            Dashboard-Velo s'enrichit de fonctionnalités de pointe pour une expérience cycliste inégalée
          </AdvancedFeaturesDescription>
          
          <AdvancedFeaturesGrid>
            <AdvancedFeatureCard
              variants={cardVariants}
              custom={0}
              whileHover={{ scale: 1.03 }}
            >
              <AdvancedFeatureIcon>🏔️</AdvancedFeatureIcon>
              <AdvancedFeatureContent>
                <AdvancedFeatureTitle>ColFlyThrough</AdvancedFeatureTitle>
                <AdvancedFeatureDescription>
                  Survolez virtuellement les cols en 3D avec une simulation réaliste du terrain, de la météo et des conditions de route. Analysez chaque portion avant de les aborder en réel.
                </AdvancedFeatureDescription>
                <AdvancedFeatureButton
                  onClick={() => navigate('/cols')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Essayer maintenant
                </AdvancedFeatureButton>
              </AdvancedFeatureContent>
            </AdvancedFeatureCard>
            
            <AdvancedFeatureCard
              variants={cardVariants}
              custom={1}
              whileHover={{ scale: 1.03 }}
            >
              <AdvancedFeatureIcon>🚴</AdvancedFeatureIcon>
              <AdvancedFeatureContent>
                <AdvancedFeatureTitle>TrainingVisualizer3D</AdvancedFeatureTitle>
                <AdvancedFeatureDescription>
                  Visualisez vos entraînements en 3D avec des métriques en temps réel. Suivez votre cadence, puissance, fréquence cardiaque et plus encore dans un environnement immersif.
                </AdvancedFeatureDescription>
                <AdvancedFeatureButton
                  onClick={() => navigate('/training')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Découvrir
                </AdvancedFeatureButton>
              </AdvancedFeatureContent>
            </AdvancedFeatureCard>
            
            <AdvancedFeatureCard
              variants={cardVariants}
              custom={2}
              whileHover={{ scale: 1.03 }}
            >
              <AdvancedFeatureIcon>🍲</AdvancedFeatureIcon>
              <AdvancedFeatureContent>
                <AdvancedFeatureTitle>NutritionRecipeVisualizer</AdvancedFeatureTitle>
                <AdvancedFeatureDescription>
                  Explorez des recettes adaptées aux cyclistes avec notre visualiseur interactif. Ajustez les portions, suivez la préparation avec un minuteur intégré et analysez les apports nutritionnels.
                </AdvancedFeatureDescription>
                <AdvancedFeatureButton
                  onClick={() => navigate('/nutrition')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Explorer
                </AdvancedFeatureButton>
              </AdvancedFeatureContent>
            </AdvancedFeatureCard>
            
            <AdvancedFeatureCard
              variants={cardVariants}
              custom={3}
              whileHover={{ scale: 1.03 }}
            >
              <AdvancedFeatureIcon>🔔</AdvancedFeatureIcon>
              <AdvancedFeatureContent>
                <AdvancedFeatureTitle>CommunityActivityFeed</AdvancedFeatureTitle>
                <AdvancedFeatureDescription>
                  Restez connecté avec la communauté grâce à notre fil d'activité en temps réel. Suivez les sorties, les défis relevés et les accomplissements des autres cyclistes.
                </AdvancedFeatureDescription>
                <AdvancedFeatureButton
                  onClick={() => navigate('/community')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Se connecter
                </AdvancedFeatureButton>
              </AdvancedFeatureContent>
            </AdvancedFeatureCard>
          </AdvancedFeaturesGrid>
        </AdvancedFeaturesSection>
      </FlyThroughSection>
    </SectionContainer>
  );
};

// Styled Components
const SectionContainer = styled(motion.section)`
  padding: 100px 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;
`;

const SectionHeader = styled(motion.div)`
  text-align: center;
  margin-bottom: 60px;
  
  h2 {
    font-size: 3rem;
    margin-bottom: 20px;
    background: linear-gradient(45deg, #2c3e50, #4a69bd);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    
    @media (max-width: 768px) {
      font-size: 2.2rem;
    }
  }
  
  p {
    font-size: 1.2rem;
    color: #34495e;
    max-width: 700px;
    margin: 0 auto;
    
    @media (max-width: 768px) {
      font-size: 1rem;
    }
  }
`;

const StatsContainer = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 80px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 20px;
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  padding: 30px 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  min-width: 200px;
  
  @media (max-width: 768px) {
    padding: 20px;
    min-width: 140px;
  }
`;

const StatValue = styled.div`
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 10px;
  background: linear-gradient(45deg, #3498db, #2980b9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #34495e;
  font-weight: 500;
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const FeatureCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
  margin-bottom: 80px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  
  &:hover {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }
`;

const CardHeader = styled.div`
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const CardIcon = styled.div`
  font-size: 2rem;
  line-height: 1;
`;

const CardTitle = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
`;

const CardContent = styled.div`
  padding: 25px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const CardDescription = styled.p`
  color: #34495e;
  font-size: 1rem;
  line-height: 1.6;
  margin: 0;
`;

const Col3DContainer = styled.div`
  width: 100%;
  height: 200px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
`;

const ColInfoCard = styled.div`
  background: linear-gradient(135deg, #3498db, #2980b9);
  border-radius: 10px;
  padding: 20px;
  color: white;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
`;

const ColName = styled.h4`
  font-size: 1.3rem;
  margin: 0 0 15px 0;
  font-weight: 600;
`;

const ColStats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const ColStat = styled.div`
  font-size: 0.9rem;
  display: flex;
  justify-content: space-between;
  
  span {
    font-weight: 600;
    opacity: 0.8;
  }
`;

const MapSection = styled(motion.div)`
  position: relative;
  margin-top: 40px;
`;

const MapTitle = styled.h3`
  font-size: 2rem;
  text-align: center;
  margin-bottom: 30px;
  color: #2c3e50;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const MapContainer = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    height: 350px;
  }
`;

const MapFallback = styled.div`
  width: 100%;
  height: 500px;
  border-radius: 20px;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  @media (max-width: 768px) {
    height: 350px;
  }
`;

const FlyThroughSection = styled(motion.div)`
  margin-top: 80px;
  text-align: center;
  padding-bottom: 60px;
`;

const FlyThroughTitle = styled.h3`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #2c3e50;
  background: linear-gradient(45deg, #3498db, #2980b9);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const FlyThroughDescription = styled.p`
  font-size: 1.2rem;
  color: #34495e;
  margin-bottom: 40px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0 20px;
  }
`;

const FlyThroughVisualization = styled.div`
  display: flex;
  flex-direction: row;
  gap: 30px;
  margin-bottom: 50px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
  }
`;

const FlyThroughInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  text-align: left;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 1024px) {
    order: 2;
  }
`;

const FlyThrough3DContainer = styled.div`
  flex: 2;
  height: 400px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  position: relative;
  
  @media (max-width: 1024px) {
    order: 1;
  }
`;

const FlyThroughButton = styled(motion.button)`
  background: linear-gradient(45deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 20px;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(52, 152, 219, 0.5);
  }
`;

const ModuleNavigation = styled.div`
  margin-top: 80px;
`;

const ModuleHeader = styled.h3`
  font-size: 2rem;
  margin-bottom: 40px;
  color: #2c3e50;
`;

const ModulesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
`;

const ModuleIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 20px;
`;

const ModuleTitle = styled.h4`
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #2c3e50;
`;

const ModuleDescription = styled.p`
  font-size: 1rem;
  color: #34495e;
  line-height: 1.6;
`;

// Styles pour les nouvelles fonctionnalités avancées
const AdvancedFeaturesSection = styled(motion.div)`
  margin-top: 120px;
  text-align: center;
`;

const AdvancedFeaturesTitle = styled.h3`
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #3498db, #1abc9c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const AdvancedFeaturesDescription = styled.p`
  font-size: 1.2rem;
  color: #34495e;
  margin-bottom: 50px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 1rem;
    padding: 0 20px;
  }
`;

const AdvancedFeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AdvancedFeatureCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  padding: 30px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
`;

const AdvancedFeatureIcon = styled.div`
  font-size: 3.5rem;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #3498db, #1abc9c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const AdvancedFeatureContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  align-items: center;
  text-align: center;
`;

const AdvancedFeatureTitle = styled.h4`
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
`;

const AdvancedFeatureDescription = styled.p`
  font-size: 1.1rem;
  color: #34495e;
  line-height: 1.6;
`;

const AdvancedFeatureButton = styled(motion.button)`
  background: linear-gradient(45deg, #3498db, #1abc9c);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 15px;
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 8px 20px rgba(52, 152, 219, 0.5);
  }
`;

export default FeaturesSection;
