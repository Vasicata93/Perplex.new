import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere } from '@react-three/drei';
import * as THREE from 'three';

export const JanitorCharacter: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const broomRef = useRef<THREE.Group>(null);

  // Simple wandering sweep animation
  useFrame((state) => {
    if (!group.current) return;
    
    const t = state.clock.elapsedTime;
    
    // Slow sweeping wandering
    group.current.position.x = Math.sin(t * 0.3) * 6;
    group.current.position.z = Math.cos(t * 0.2) * 4 + 4; // Stay near the front
    
    // Facing direction
    group.current.rotation.y = Math.atan2(Math.cos(t * 0.3) * 0.3 * 6, -Math.sin(t * 0.2) * 0.2 * 4);

    // Sweeping bob
    group.current.position.y = Math.abs(Math.sin(t * 4)) * 0.1;

    // Broom swing
    if (broomRef.current) {
       broomRef.current.rotation.z = Math.sin(t * 4) * 0.5;
       broomRef.current.rotation.x = -Math.PI / 6;
    }
  });

  return (
    <group ref={group}>
      {/* Humanoid Body */}
      <group position={[0, 0, 0]}>
         {/* Torso */}
         <Box args={[0.5, 0.7, 0.25]} position={[0, 0.95, 0]}  >
           <meshStandardMaterial color="#64748b" roughness={0.5} metalness={0.1} />
         </Box>
         
         {/* Left Leg */}
         <Cylinder args={[0.08, 0.06, 0.6]} position={[-0.15, 0.3, 0]}  >
            <meshStandardMaterial color="#334155" roughness={0.8} />
         </Cylinder>
         
         {/* Right Leg */}
         <Cylinder args={[0.08, 0.06, 0.6]} position={[0.15, 0.3, 0]}  >
            <meshStandardMaterial color="#334155" roughness={0.8} />
         </Cylinder>

         {/* Left Arm */}
         <group position={[-0.3, 1.15, 0]}>
            <Cylinder args={[0.06, 0.05, 0.55]} position={[0, -0.25, 0]} rotation={[0, 0, 0.1]}  >
               <meshStandardMaterial color="#64748b" roughness={0.5} />
            </Cylinder>
         </group>

         {/* Right Arm */}
         <group position={[0.3, 1.15, 0]}>
            <Cylinder args={[0.06, 0.05, 0.55]} position={[0, -0.25, 0]} rotation={[0, 0, -0.1]}  >
               <meshStandardMaterial color="#64748b" roughness={0.5} />
            </Cylinder>
         </group>
      </group>

      {/* Head Group */}
      <group position={[0, 1.5, 0]}>
        {/* Neck */}
        <Cylinder args={[0.05, 0.08, 0.15]} position={[0, -0.1, 0]}  >
           <meshStandardMaterial color="#fcd34d" roughness={0.4} />
        </Cylinder>
        {/* Head */}
        <Sphere args={[0.18, 32, 32]} position={[0, 0.05, 0]}  >
          <meshStandardMaterial color="#fcd34d" roughness={0.3} />
        </Sphere>
        {/* Cap */}
        <Sphere args={[0.19, 16, 16]} position={[0, 0.08, 0]} >
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </Sphere>
        <Box args={[0.15, 0.02, 0.15]} position={[0, 0.1, 0.15]} >
          <meshStandardMaterial color="#1e293b" />
        </Box>
        {/* Eyes */}
        <Box args={[0.04, 0.02, 0.02]} position={[-0.06, 0.05, 0.17]} >
          <meshStandardMaterial color="#1e293b" />
        </Box>
        <Box args={[0.04, 0.02, 0.02]} position={[0.06, 0.05, 0.17]} >
          <meshStandardMaterial color="#1e293b" />
        </Box>
      </group>

      {/* Broom */}
      <group ref={broomRef} position={[0.4, 0.6, 0.3]}>
        {/* Handle */}
        <Cylinder args={[0.02, 0.02, 1.8]} position={[0, 0, 0]} >
           <meshStandardMaterial color="#d97706" />
        </Cylinder>
        {/* Brush */}
        <Box args={[0.4, 0.1, 0.1]} position={[0, -0.9, 0]} >
           <meshStandardMaterial color="#fcd34d" />
        </Box>
      </group>
    </group>
  );
};
