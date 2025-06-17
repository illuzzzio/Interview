'use client';

import React, { useState, useRef, Suspense, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';
import { inSphere } from 'maath/random';

const StarBackground = (props: React.ComponentProps<any>) => {
  const ref = useRef<THREE.Group>(null!);
  const [radius, setRadius] = useState(0.5); // ✅ Start small
  const [sphere, setSphere] = useState<Float32Array>(
    () => inSphere(new Float32Array(5000 * 3), { radius: 0.5 }) as Float32Array
  );

  const expanding = useRef(false);
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  // const soundRef = useRef<HTMLAudioElement | null>(null);

  // ✅ Play sound once on mount
//  
// useEffect(() => {
// setTimeout(() => {
// const sound = new Audio('/sounds/expand.mp3');
//     sound.addEventListener("canplaythrough", () => {
//       console.log('Audio is ready to play');
//   /* the audio is now playable; play it if permissions allow */
//   sound.play();
// });
//     sound.loop = false; // ✅ Play only once
//     sound.volume = 1;
//     soundRef.current = sound;
//
//     sound.play().catch((e) => {
//       console.warn('Audio not working', e);
//     });
// }, 0)
//   }, []);

  // ✅ Start expansion after delay
  useEffect(() => {
    const timeout = setTimeout(() => {
      expanding.current = true;
    }, 10); // wait before expanding
    return () => clearTimeout(timeout);
  }, []);

  // Radius animation logic
  useEffect(() => {
    let frameId: number;

    const animate = () => {
      setRadius(prev => {
        let newRadius = prev;

        if (expanding.current) {
          newRadius = Math.min(prev + 0.065, 2.5);
          if (newRadius >= 2.5) {
            expanding.current = false;
          }
        } else {
          const qAndUp = keysPressed.current['q'] && keysPressed.current['ArrowUp'];
          const oneAndDown = keysPressed.current['q'] && keysPressed.current['ArrowDown'];

          if (qAndUp) newRadius = Math.min(prev + 0.03, 5);
          if (oneAndDown) newRadius = Math.max(prev - 0.03, 0.5);
        }

        return newRadius;
      });

      frameId = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Update stars when radius changes
  useEffect(() => {
    const newSphere = inSphere(new Float32Array(5000 * 3), { radius }) as Float32Array;
    setSphere(newSphere);
  }, [radius]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Rotate stars
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <>
     {/* <audio autoPlay controls src="/sounds/expand.mp3"></audio> */}
     {React.createElement('group' as any, { ref, rotation: [0, 0, Math.PI / 4], ...props },
      <Points positions={sphere} stride={3} frustumCulled>
        <PointMaterial
          transparent
          color="#39FF14"
          size={0.004}
          sizeAttenuation
          depthWrite={false}
        />
      </Points>
    )}
    </>
    
    
  );
};

const StarsCanvas = () => (
  <div className="fixed inset-0 w-screen h-screen z-[-1]">
    <Canvas camera={{ position: [0, 0, 1] }}>
      <Suspense fallback={null}>
        <StarBackground />
      </Suspense>
    </Canvas>
  </div>
);

export default StarsCanvas;
