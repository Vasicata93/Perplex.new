import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Html, Sphere, Cylinder, Ring, Torus } from '@react-three/drei';
import * as THREE from 'three';
import { useHubStore } from '../../../store/useHubStore';

interface AgentCharacterProps {
  id: string;
  name: string;
  role: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  isOrchestrator?: boolean;
}

const STATES = ['idle', 'working', 'dancing', 'walking', 'playing_ping_pong'];
const WORKING_THOUGHTS = ["Thinking...", "Compiling...", "Researching topic...", "Analyzing data...", "Deploying...", "Reviewing PR", 'Calculating metrics...'];

const TaskVisualizer = ({ thought, isOrchestrator }: { thought: string, isOrchestrator?: boolean }) => {
  const ref = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta;
      ref.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.5;
    }
  });

  const lowerThought = thought.toLowerCase();
  
  if (lowerThought.includes('deploy')) {
    return (
      <group ref={ref} position={[0, 0, 0.6]}>
        <Cylinder args={[0.05, 0.15, 0.3]} position={[0, 0.2, 0]} >
          <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.8} />
        </Cylinder>
        <Cylinder args={[0.08, 0.08, 0.1]} position={[0, 0, 0]} >
          <meshStandardMaterial color="#facc15" />
        </Cylinder>
      </group>
    );
  }

  if (lowerThought.includes('research') || lowerThought.includes('search')) {
    return (
      <group ref={ref} position={[0, 0, 0.6]}>
        <Torus args={[0.1, 0.02, 16, 32]} >
           <meshStandardMaterial color="#38bdf8" emissive="#0ea5e9" emissiveIntensity={0.8} />
        </Torus>
        <Cylinder args={[0.02, 0.02, 0.15]} position={[0.1, -0.1, 0]} rotation={[0, 0, -Math.PI / 4]} >
           <meshStandardMaterial color="#38bdf8" />
        </Cylinder>
      </group>
    );
  }

  if (lowerThought.includes('compil') || lowerThought.includes('code') || lowerThought.includes('pr')) {
    return (
      <group ref={ref} position={[0, 0, 0.6]}>
         <Box args={[0.2, 0.02, 0.2]} position={[0, 0, 0]} >
            <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.5} />
         </Box>
         <Box args={[0.2, 0.02, 0.2]} position={[0, -0.05, 0]} >
            <meshStandardMaterial color="#059669" />
         </Box>
         <Box args={[0.2, 0.02, 0.2]} position={[0, 0.05, 0]} >
            <meshStandardMaterial color="#34d399" />
         </Box>
      </group>
    );
  }
  
  if (lowerThought.includes('analyz') || lowerThought.includes('calculat')) {
    return (
      <group ref={ref} position={[0, 0, 0.6]}>
        <Box args={[0.05, 0.1, 0.05]} position={[-0.1, -0.05, 0]} ><meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8}/></Box>
        <Box args={[0.05, 0.2, 0.05]} position={[0, 0, 0]} ><meshStandardMaterial color="#d946ef" emissive="#d946ef" emissiveIntensity={0.8}/></Box>
        <Box args={[0.05, 0.3, 0.05]} position={[0.1, 0.05, 0]} ><meshStandardMaterial color="#f472b6" emissive="#f472b6" emissiveIntensity={0.8}/></Box>
      </group>
    );
  }

  // Default thinking visualization
  return (
    <group ref={ref} position={[0, 0, 0.6]}>
       <Sphere args={[0.1, 16, 16]} >
          <meshStandardMaterial color={isOrchestrator ? "#fbbf24" : "#60a5fa"} emissive={isOrchestrator ? "#fbbf24" : "#60a5fa"} emissiveIntensity={0.6} />
       </Sphere>
       <Ring args={[0.15, 0.18, 32]} rotation={[Math.PI / 2, 0, 0]}>
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
       </Ring>
    </group>
  );
};

export const AgentCharacter: React.FC<AgentCharacterProps> = ({ id, name, role, position, rotation = [0, 0, 0], isOrchestrator }) => {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(...position));
  const [simulatedState, setSimulatedState] = useState(STATES[0]);
  const [simulatedThought, setSimulatedThought] = useState('');

  // Get real state from hub store
  const isConnected = useHubStore(state => state.isConnected);
  const agentRealtimeState = useHubStore(state => state.agentsState[id]);

  const currentState = isConnected && agentRealtimeState ? agentRealtimeState.state : simulatedState;
  const thought = isConnected && agentRealtimeState ? agentRealtimeState.thought : simulatedThought;

  // Periodic random target assignments for sub agents (Simulation Fallback)
  useEffect(() => {
    if (isConnected) return; // Disable simulation if connected to real hub

    if (isOrchestrator) {
       // Orchestrator occassionally "works"
       const interval = setInterval(() => {
          const rand = Math.random();
          if (rand > 0.6) {
             setSimulatedState('working');
             setSimulatedThought(WORKING_THOUGHTS[Math.floor(Math.random() * WORKING_THOUGHTS.length)]);
          } else if (rand > 0.4) {
             setSimulatedState('playing_ping_pong');
             setTargetPos(new THREE.Vector3(-4, 0, 5)); // move to ping pong table
             setSimulatedThought('Game on!');
          } else {
             setSimulatedState('idle');
             setTargetPos(new THREE.Vector3(...position));
             setSimulatedThought('');
          }
       }, 5000);
       return () => clearInterval(interval);
    }

    const interval = setInterval(() => {
      // 30% chance to pick a new spot and move
      if (Math.random() > 0.7) {
        setTargetPos(new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          0,
          (Math.random() - 0.5) * 6
        ));
        setSimulatedState('walking');
        setSimulatedThought('');
      } else {
        const nextState = STATES[Math.floor(Math.random() * STATES.length)];
        setSimulatedState(nextState);
        
        if (nextState === 'working') {
           setSimulatedThought(WORKING_THOUGHTS[Math.floor(Math.random() * WORKING_THOUGHTS.length)]);
        } else if (nextState === 'playing_ping_pong') {
           setTargetPos(new THREE.Vector3(-6, 0, 5)); // Go to second side of ping pong
           setSimulatedThought('Nice shot!');
        } else {
           setSimulatedThought('');
           if (nextState === 'idle') setTargetPos(new THREE.Vector3(...position));
        }
      }
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [isOrchestrator, isConnected, position]);

  // Handle external target position override from backend
  useEffect(() => {
    if (isConnected && agentRealtimeState?.targetPos) {
      setTargetPos(new THREE.Vector3(...agentRealtimeState.targetPos));
    }
  }, [isConnected, agentRealtimeState?.targetPos]);

  useFrame((state, delta) => {
    if (!group.current) return;

    const t = state.clock.elapsedTime;

    // Movement logic (lerp to target)
    if (currentState === 'walking' || currentState === 'playing_ping_pong' || !group.current.position.equals(targetPos)) {
      group.current.position.lerp(targetPos, delta * 2.5);
      
      // Face direction of movement (unless playing ping pong where they should face the table)
      if (currentState === 'playing_ping_pong') {
         // Face the table (center at -5, 0, 5)
         const targetRotation = Math.atan2(group.current.position.x - (-5), group.current.position.z - 5);
         const currentRotation = group.current.rotation.y;
         let diff = targetRotation - currentRotation;
         while (diff < -Math.PI) diff += Math.PI * 2;
         while (diff > Math.PI) diff -= Math.PI * 2;
         group.current.rotation.y += diff * delta * 5;
      } else if (group.current.position.distanceTo(targetPos) > 0.1) {
         const targetRotation = Math.atan2(
           group.current.position.x - targetPos.x, 
           group.current.position.z - targetPos.z
         );
         
         const currentRotation = group.current.rotation.y;
         let diff = targetRotation - currentRotation;
         while (diff < -Math.PI) diff += Math.PI * 2;
         while (diff > Math.PI) diff -= Math.PI * 2;
         group.current.rotation.y += diff * delta * 6;
         
         // Bobbing walking animation (natural humanoid bounce)
         group.current.position.y = Math.abs(Math.sin(t * 10)) * 0.15;
         
         // Human-like asymmetric arm/leg swinging during walking
         if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 10) * 0.5;
         if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(t * 10) * 0.5;
         if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(t * 10) * 0.45;
         if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * 10) * 0.45;
         if (headRef.current) headRef.current.rotation.y = Math.sin(t * 5) * 0.05;
      } else {
         if (currentState === 'walking') setSimulatedState('idle');
         group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0, delta * 10);
      }
    }

    // Dance animation
    if (currentState === 'dancing') {
      group.current.rotation.y += delta * 2;
      group.current.position.y = Math.abs(Math.sin(t * 8)) * 0.3;
      
      if (leftArmRef.current) {
        leftArmRef.current.rotation.z = Math.PI/3 + Math.sin(t * 8) * 0.4;
        leftArmRef.current.rotation.x = Math.sin(t * 4) * 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -Math.PI/3 - Math.sin(t * 8) * 0.4;
        rightArmRef.current.rotation.x = -Math.sin(t * 4) * 0.2;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.z = Math.sin(t * 8) * 0.1;
      if (rightLegRef.current) rightLegRef.current.rotation.z = -Math.sin(t * 8) * 0.1;
    }

    // Ping Pong Animation
    if (currentState === 'playing_ping_pong') {
       group.current.position.x += Math.sin(t * 5) * 0.02;
       if (rightArmRef.current) {
          // Swing right arm dynamically matching action
          rightArmRef.current.rotation.x = -Math.PI / 4 + Math.sin(t * 12) * 0.6;
       }
       if (leftArmRef.current) {
          leftArmRef.current.rotation.x = -0.2;
       }
    }

    // Working animation (interactive typing on keyboard)
    if (currentState === 'working') {
      if (headRef.current) {
        // Head looks slightly down towards keyboard, nodding periodically as if debugging
        headRef.current.rotation.x = 0.15 + Math.sin(t * 4) * 0.05;
        headRef.current.rotation.y = Math.sin(t * 2) * 0.04;
      }
      // Lifelike typing kinematics (left and right hands bob independently!)
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.65 + Math.sin(t * 18) * 0.08;
        leftArmRef.current.rotation.y = -0.15;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.65 + Math.sin(t * 18 + Math.PI) * 0.08;
        rightArmRef.current.rotation.y = 0.15;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    } 

    // Idle gentle float (breathing mechanics)
    if (currentState === 'idle') {
      group.current.position.y = Math.sin(t * 2.5) * 0.03;
      
      // Smoothly relax limbs back
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, 0.08, delta * 5);
        leftArmRef.current.rotation.y = THREE.MathUtils.lerp(leftArmRef.current.rotation.y, 0, delta * 5);
        leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, 0.05, delta * 5);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, 0.08, delta * 5);
        rightArmRef.current.rotation.y = THREE.MathUtils.lerp(rightArmRef.current.rotation.y, 0, delta * 5);
        rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.05, delta * 5);
      }
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, delta * 5);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, delta * 5);
      }
      if (headRef.current) {
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, delta * 5);
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, delta * 5);
      }
    }
  });

  // Role-specific premium paint armor themes for realistic humanoid styling
  const getThemeMaterials = () => {
    const roleLower = role.toLowerCase();
    if (isOrchestrator) {
      return {
        armorColor: '#e0981b', // Luxurious gold plate
        jointColor: '#0a0d14', // Carbon fibers joint
        glowingVisor: '#e0981b', // Warm amber
        roughness: 0.12,
        metalness: 0.95
      };
    } else if (roleLower.includes('code') || roleLower.includes('dev')) {
      return {
        armorColor: '#f1f5f9', // Polished arctic white ceramic
        jointColor: '#1e293b',
        glowingVisor: '#01fdfd', // Electric cyber-cyan
        roughness: 0.16,
        metalness: 0.2
      };
    } else if (roleLower.includes('search') || roleLower.includes('research')) {
      return {
        armorColor: '#0c241a', // Glossy racing emerald
        jointColor: '#000000',
        glowingVisor: '#10b981', // Vivid green
        roughness: 0.08,
        metalness: 0.8
      };
    } else {
      return {
        armorColor: '#34384c', // Matte dark obsidian navy
        jointColor: '#212529',
        glowingVisor: '#c084fc', // Quantum purple
        roughness: 0.25,
        metalness: 0.7
      };
    }
  };

  const mat = getThemeMaterials();

  return (
    <group ref={group} position={position} rotation={rotation}>
      {/* Thought/Speech Bubble */}
      {thought && (
         <group position={[0, 3.2, 0]}>
           <Html transform center style={{ pointerEvents: 'none' }}>
             <div className="relative bg-white text-gray-900 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-gray-200 whitespace-nowrap">
               {thought}
               <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
             </div>
           </Html>
         </group>
      )}

      {/* --- RECONSTRUCTED HUMANOID ROBOT BODY (HUMAN-LIKE SHAPE & KINEMATIC SEGMENTS) --- */}
      <group position={[0, 0, 0]}>
         {/* 1. Pelvis / Hip Block */}
         <Box args={[0.36, 0.14, 0.2]} position={[0, 0.76, 0]} castShadow>
           <meshStandardMaterial color={mat.jointColor} roughness={0.4} metalness={0.8} />
         </Box>

         {/* Spine spacer joint */}
         <Sphere args={[0.08, 16, 16]} position={[0, 0.84, 0]}>
           <meshStandardMaterial color={mat.armorColor} roughness={0.2} metalness={0.9} />
         </Sphere>

         {/* 2. Sleek Segmented Chest Ribcage */}
         <Box args={[0.45, 0.44, 0.24]} position={[0, 1.08, 0]} castShadow>
           <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
         </Box>

         {/* Glowing power core center (Dynamic Status Arc Reactor) */}
         <Cylinder args={[0.065, 0.065, 0.05]} position={[0, 1.15, 0.122]} rotation={[Math.PI / 2, 0, 0]}>
           <meshStandardMaterial color={mat.glowingVisor} emissive={mat.glowingVisor} emissiveIntensity={2.5} />
         </Cylinder>
         
         {/* 3. Left Leg assembly */}
         <group position={[-0.14, 0.7, 0]} ref={leftLegRef}>
            {/* Thigh (Upper limb) */}
            <Cylinder args={[0.06, 0.05, 0.36]} position={[0, -0.18, 0]} castShadow>
               <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
            </Cylinder>
            {/* Knee joint */}
            <Sphere args={[0.055, 12, 12]} position={[0, -0.36, 0]}>
              <meshStandardMaterial color={mat.jointColor} metalness={0.9} />
            </Sphere>
            {/* Shin (Lower limb) */}
            <Cylinder args={[0.045, 0.045, 0.32]} position={[0, -0.52, 0]} castShadow>
               <meshStandardMaterial color={mat.jointColor} roughness={0.6} />
            </Cylinder>
            {/* Ankle joint + Shoe */}
            <Box args={[0.07, 0.06, 0.16]} position={[0, -0.71, 0.04]} castShadow>
               <meshStandardMaterial color="#0b0f19" roughness={0.5} />
            </Box>
         </group>
         
         {/* 4. Right Leg assembly */}
         <group position={[0.14, 0.7, 0]} ref={rightLegRef}>
            {/* Thigh */}
            <Cylinder args={[0.06, 0.05, 0.36]} position={[0, -0.18, 0]} castShadow>
               <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
            </Cylinder>
            {/* Knee */}
            <Sphere args={[0.055, 12, 12]} position={[0, -0.36, 0]}>
              <meshStandardMaterial color={mat.jointColor} metalness={0.9} />
            </Sphere>
            {/* Shin */}
            <Cylinder args={[0.045, 0.045, 0.32]} position={[0, -0.52, 0]} castShadow>
               <meshStandardMaterial color={mat.jointColor} roughness={0.6} />
            </Cylinder>
            {/* Shoe */}
            <Box args={[0.07, 0.06, 0.16]} position={[0, -0.71, 0.04]} castShadow>
               <meshStandardMaterial color="#0b0f19" roughness={0.5} />
            </Box>
         </group>

         {/* 5. Left Arm Assembly */}
         <group position={[-0.26, 1.25, 0]} ref={leftArmRef}>
            {/* Shoulder Ball joint */}
            <Sphere args={[0.065, 12, 12]} position={[0, 0, 0]}>
              <meshStandardMaterial color={mat.jointColor} metalness={0.8} />
            </Sphere>
            {/* Upper arm cylinder */}
            <Cylinder args={[0.045, 0.04, 0.3]} position={[-0.04, -0.15, 0]} rotation={[0, 0, 0.08]} castShadow>
               <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
            </Cylinder>
            {/* Elbow assembly */}
            <Sphere args={[0.045, 12, 12]} position={[-0.04, -0.3, 0]}>
              <meshStandardMaterial color={mat.jointColor} />
            </Sphere>
            {/* Lower arm cylinder */}
            <Cylinder args={[0.038, 0.035, 0.28]} position={[-0.04, -0.44, 0.05]} rotation={[0.15, 0, 0]} castShadow>
               <meshStandardMaterial color={mat.jointColor} roughness={0.5} />
            </Cylinder>
            {/* Wrist joint and hand */}
            <Box args={[0.05, 0.05, 0.05]} position={[-0.04, -0.58, 0.1]} castShadow>
               <meshStandardMaterial color={mat.armorColor} />
            </Box>
         </group>

         {/* 6. Right Arm Assembly */}
         <group position={[0.26, 1.25, 0]} ref={rightArmRef}>
            {/* Shoulder */}
            <Sphere args={[0.065, 12, 12]} position={[0, 0, 0]}>
              <meshStandardMaterial color={mat.jointColor} metalness={0.8} />
            </Sphere>
            {/* Upper arm */}
            <Cylinder args={[0.045, 0.04, 0.3]} position={[0.04, -0.15, 0]} rotation={[0, 0, -0.08]} castShadow>
               <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
            </Cylinder>
            {/* Elbow */}
            <Sphere args={[0.045, 12, 12]} position={[0.04, -0.3, 0]}>
              <meshStandardMaterial color={mat.jointColor} />
            </Sphere>
            {/* Lower arm */}
            <Cylinder args={[0.038, 0.035, 0.28]} position={[0.04, -0.44, 0.05]} rotation={[0.15, 0, 0]} castShadow>
               <meshStandardMaterial color={mat.jointColor} roughness={0.5} />
            </Cylinder>
            {/* Wrist and Hand */}
            <Box args={[0.05, 0.05, 0.05]} position={[0.04, -0.58, 0.1]} castShadow>
               <meshStandardMaterial color={mat.armorColor} />
            </Box>
         </group>
      </group>

      {/* 7. Head Group */}
      <group ref={headRef} position={[0, 1.42, 0]}>
        {/* Sleek metallic neck collar */}
        <Cylinder args={[0.055, 0.07, 0.12]} position={[0, -0.08, 0]}>
           <meshStandardMaterial color={mat.jointColor} roughness={0.3} metalness={0.9} />
        </Cylinder>
        {/* Futuristic premium Android Helm / Face */}
        <Sphere args={[0.16, 32, 32]} position={[0, 0.06, 0]} castShadow>
          <meshStandardMaterial color={mat.armorColor} roughness={mat.roughness} metalness={mat.metalness} />
        </Sphere>
        {/* Glow neon-wrapped headset rings (ear cylinders for micro detailing) */}
        <Cylinder args={[0.08, 0.08, 0.04]} position={[-0.154, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color={mat.jointColor} roughness={0.1} />
        </Cylinder>
        <mesh position={[-0.176, 0.06, 0]} rotation={[0, -Math.PI/2, 0]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={mat.glowingVisor} />
        </mesh>
        <Cylinder args={[0.08, 0.08, 0.04]} position={[0.154, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color={mat.jointColor} roughness={0.1} />
        </Cylinder>
        <mesh position={[0.176, 0.06, 0]} rotation={[0, Math.PI/2, 0]}>
          <circleGeometry args={[0.04, 16]} />
          <meshBasicMaterial color={mat.glowingVisor} />
        </mesh>
        
        {/* OLED Visor Screen (Glowing curved glass visor instead of block eyes) */}
        <Box args={[0.22, 0.06, 0.12]} position={[0, 0.08, 0.1]} rotation={[0.1, 0, 0]} castShadow>
          <meshPhysicalMaterial color="#020815" roughness={0.05} metalness={0.9} clearcoat={1.0} />
        </Box>
        {/* Emissive cyber-neon glowing eye stream */}
        <Box args={[0.17, 0.015, 0.012]} position={[0, 0.08, 0.16]}>
          <meshStandardMaterial color={mat.glowingVisor} emissive={mat.glowingVisor} emissiveIntensity={3.0} />
        </Box>
      </group>

      {/* Task Visualizer prop */}
      {(currentState === 'working' || currentState === 'idle') && thought && (
         <TaskVisualizer thought={thought} isOrchestrator={isOrchestrator} />
      )}

      {/* Glow Status Floating Beacon Orb */}
      <Sphere args={[0.06, 12, 12]} position={[0, 2.15, 0]}>
         <meshStandardMaterial 
            color={currentState === 'working' ? '#10b981' : currentState === 'dancing' ? '#a855f7' : currentState === 'walking' ? '#3b82f6' : '#94a3b8'} 
            emissive={currentState === 'working' ? '#10b981' : currentState === 'dancing' ? '#a855f7' : currentState === 'walking' ? '#3b82f6' : '#94a3b8'} 
            emissiveIntensity={2.0}
         />
      </Sphere>

      {/* Beautiful High-contrast Nameplate */}
      <group position={[0, 2.38, 0]}>
        <Html transform center style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-2 bg-[#0d1117]/95 backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-[0_4px_30px_rgba(0,0,0,0.8)] border border-emerald-500/20 min-w-max scale-95 hover:scale-100 transition-all duration-300">
             <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-gray-500 border border-emerald-500/40 shrink-0">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start pr-1 border-l border-white/10 pl-2">
              <div className="flex gap-2 items-center">
                 <span className="text-white text-[9px] font-extrabold tracking-wider font-sans uppercase">
                   {name.toUpperCase().includes('AGENT') ? name : `AGENT ${name.toUpperCase()}`}
                 </span>
                 <span className="text-emerald-400 text-[7px] font-bold tracking-widest font-sans uppercase bg-emerald-950/80 border border-emerald-800/40 px-1 py-0.5 rounded">
                   {role.length > 0 ? role.substring(0,8) : 'DATA'}
                 </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="text-[#8b949e] text-[7px] uppercase tracking-widest font-mono">LIVE // {currentState.toUpperCase().replace('_', ' ')}</span>
                 <div className={`w-1.5 h-1.5 rounded-full ${currentState === 'working' ? 'bg-emerald-500 animate-pulse' : currentState === 'dancing' ? 'bg-purple-500 animate-pulse' : 'bg-blue-500'}`}></div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
