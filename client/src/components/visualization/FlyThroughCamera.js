import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';

/**
 * FlyThroughCamera
 * - Anime la caméra pour le mode fly-through
 * - À compléter avec une vraie logique de parcours
 */
const FlyThroughCamera = () => {
  const { camera } = useThree();
  const requestRef = useRef();

  useEffect(() => {
    // TODO: Implement fly-through animation logic
    // For now, just a placeholder effect
    let frame = 0;
    const animate = () => {
      camera.position.x = Math.sin(frame / 60) * 1000;
      camera.position.z = Math.cos(frame / 60) * 1000;
      frame++;
      requestRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(requestRef.current);
  }, [camera]);

  return null;
};

export default FlyThroughCamera;
