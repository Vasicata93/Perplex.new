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
         {/* Pelvis */}
         <Box args={[0.34, 0.12, 0.2]} position={[0, 0.74, 0]} castShadow>
           <meshStandardMaterial color="#111827" roughness={0.4} metalness={0.8} />
         </Box>

         {/* Spine spacer */}
         <Sphere args={[0.08, 12, 12]} position={[0, 0.82, 0]}>
           <meshStandardMaterial color="#475569" roughness={0.2} metalness={0.9} />
         </Sphere>

         {/* Torso / Heavy Work Vest style */}
         <Box args={[0.44, 0.42, 0.24]} position={[0, 1.06, 0]} castShadow>
           <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.6} /> {/* Steel steel-gray base */}
         </Box>
         {/* Hi-Vis Orange / Yellow suspenders safety trims on chest */}
         <Box args={[0.08, 0.44, 0.25]} position={[-0.14, 1.06, 0.01]} castShadow>
           <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.3} />
         </Box>
         <Box args={[0.08, 0.44, 0.25]} position={[0.14, 1.06, 0.01]} castShadow>
           <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={0.3} />
         </Box>
         
         {/* Left Leg Assembly */}
         <group position={[-0.14, 0.7, 0]}>
            {/* Thigh (Mechanized pants structure) */}
            <Cylinder args={[0.055, 0.045, 0.36]} position={[0, -0.18, 0]} castShadow>
               <meshStandardMaterial color="#475569" roughness={0.7} />
            </Cylinder>
            {/* Knee joint */}
            <Sphere args={[0.05, 10, 10]} position={[0, -0.36, 0]}>
              <meshStandardMaterial color="#0f172a" />
            </Sphere>
            {/* Shin */}
            <Cylinder args={[0.042, 0.042, 0.3]} position={[0, -0.51, 0]} castShadow>
               <meshStandardMaterial color="#334155" roughness={0.8} />
            </Cylinder>
            {/* Boot */}
            <Box args={[0.07, 0.06, 0.16]} position={[0, -0.69, 0.04]} castShadow>
               <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </Box>
         </group>
         
         {/* Right Leg Assembly */}
         <group position={[0.14, 0.7, 0]}>
            Thigh
            <Cylinder args={[0.055, 0.045, 0.36]} position={[0, -0.18, 0]} castShadow>
               <meshStandardMaterial color="#475569" roughness={0.7} />
            </Cylinder>
            {/* Knee */}
            <Sphere args={[0.05, 10, 10]} position={[0, -0.36, 0]}>
              <meshStandardMaterial color="#0f172a" />
            </Sphere>
            {/* Shin */}
            <Cylinder args={[0.042, 0.042, 0.3]} position={[0, -0.51, 0]} castShadow>
               <meshStandardMaterial color="#334155" roughness={0.8} />
            </Cylinder>
            {/* Boot */}
            <Box args={[0.07, 0.06, 0.16]} position={[0, -0.69, 0.04]} castShadow>
               <meshStandardMaterial color="#0f172a" roughness={0.6} />
            </Box>
         </group>

         {/* Left Arm (holding broom) */}
         <group position={[-0.26, 1.22, 0]}>
            <Sphere args={[0.06, 10, 10]}>
              <meshStandardMaterial color="#1e293b" />
            </Sphere>
            <Cylinder args={[0.04, 0.035, 0.28]} position={[-0.04, -0.14, 0]} castShadow>
               <meshStandardMaterial color="#64748b" roughness={0.5} />
            </Cylinder>
            <Sphere args={[0.042, 8, 8]} position={[-0.04, -0.28, 0]}>
              <meshStandardMaterial color="#1e293b" />
            </Sphere>
            <Cylinder args={[0.035, 0.032, 0.26]} position={[-0.04, -0.41, 0.04]} castShadow>
               <meshStandardMaterial color="#334155" roughness={0.5} />
            </Cylinder>
            <Box args={[0.045, 0.045, 0.045]} position={[-0.04, -0.54, 0.08]} castShadow>
               <meshStandardMaterial color="#64748b" />
            </Box>
         </group>

         {/* Right Arm (holding broom dynamically) */}
         <group position={[0.26, 1.22, 0]}>
            <Sphere args={[0.06, 10, 10]}>
              <meshStandardMaterial color="#1e293b" />
            </Sphere>
            <Cylinder args={[0.04, 0.035, 0.28]} position={[0.04, -0.14, 0]} castShadow>
               <meshStandardMaterial color="#64748b" roughness={0.5} />
            </Cylinder>
            <Sphere args={[0.042, 8, 8]} position={[0.04, -0.28, 0]}>
              <meshStandardMaterial color="#1e293b" />
            </Sphere>
            <Cylinder args={[0.035, 0.032, 0.26]} position={[0.04, -0.41, 0.04]} castShadow>
               <meshStandardMaterial color="#334155" roughness={0.5} />
            </Cylinder>
            <Box args={[0.045, 0.045, 0.045]} position={[0.04, -0.54, 0.08]} castShadow>
               <meshStandardMaterial color="#64748b" />
            </Box>
         </group>
      </group>

      {/* Head Group with cap overlay */}
      <group position={[0, 1.4, 0]}>
        {/* Neck */}
        <Cylinder args={[0.05, 0.065, 0.1]} position={[0, -0.06, 0]}>
           <meshStandardMaterial color="#334155" roughness={0.4} />
        </Cylinder>
        {/* Head */}
        <Sphere args={[0.15, 32, 32]} position={[0, 0.05, 0]} castShadow>
          <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.7} />
        </Sphere>
        
        {/* Cap visor stylized overlay for Maintenance crew */}
        <group position={[0, 0.1, 0.02]}>
          <Sphere args={[0.16, 16, 16]} position={[0, 0, 0]} >
            <meshStandardMaterial color="#111827" roughness={0.8} />
          </Sphere>
          <Box args={[0.16, 0.018, 0.1]} position={[0, 0, 0.12]} rotation={[0.12, 0, 0]}>
            <meshStandardMaterial color="#ea580c" />
          </Box>
        </group>

        {/* Cyber glowing yellow industrial eye visor screen */}
        <Box args={[0.18, 0.045, 0.11]} position={[0, 0.06, 0.08]} rotation={[0.08, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#020815" roughness={0.05} metalness={0.9} clearcoat={1.0} />
        </Box>
        {/* Emissive stripe for eyes */}
        <Box args={[0.12, 0.01, 0.01]} position={[0, 0.06, 0.136]}>
          <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={3.0} />
        </Box>
      </group>

      {/* Industrial Grade Laser Broom */}
      <group ref={broomRef} position={[0.3, 0.55, 0.24]}>
        {/* Pole handle with matte steel texture */}
        <Cylinder args={[0.016, 0.016, 1.8]} position={[0, 0, 0]} castShadow>
           <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.3} />
        </Cylinder>
        {/* Brush box with sleek copper plating */}
        <Box args={[0.42, 0.08, 0.08]} position={[0, -0.9, 0]} castShadow>
           <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.2} />
         </Box>
         {/* Laser Broom glowing glowing bristles strip under brush */}
         <Box args={[0.4, 0.02, 0.04]} position={[0, -0.95, 0]}>
            <meshStandardMaterial color="#ea580c" emissive="#ea580c" emissiveIntensity={3.5} />
         </Box>
      </group>
    </group>
  );
};
