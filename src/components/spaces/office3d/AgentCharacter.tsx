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
  const armRef = useRef<THREE.Group>(null);
  
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
      group.current.position.lerp(targetPos, delta * 2);
      
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
         // Avoid spinning around the long way
         let diff = targetRotation - currentRotation;
         while (diff < -Math.PI) diff += Math.PI * 2;
         while (diff > Math.PI) diff -= Math.PI * 2;
         group.current.rotation.y += diff * delta * 5;
         
         // Bobbing walking animation
         group.current.position.y = Math.abs(Math.sin(t * 10)) * 0.2;
      } else {
         if (currentState === 'walking') setSimulatedState('idle');
         group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, 0, delta * 10);
      }
    }

    // Dance animation
    if (currentState === 'dancing') {
      group.current.rotation.y += delta * 2;
      group.current.position.y = Math.abs(Math.sin(t * 8)) * 0.3;
    }

    // Ping Pong Animation
    if (currentState === 'playing_ping_pong') {
       // Bob side to side
       group.current.position.x += Math.sin(t * 5) * 0.02;
       if (armRef.current) {
          // Swing arm
          armRef.current.rotation.x = Math.sin(t * 8) * 0.5 - 0.5;
       }
    } else if (armRef.current) {
       armRef.current.rotation.x = THREE.MathUtils.lerp(armRef.current.rotation.x, 0, delta * 5);
    }

    // Working animation (head nods)
    if (currentState === 'working' && headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 4) * 0.1 + 0.1;
    } else if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, delta * 5);
    }
    
    // Idle gentle float
    if (currentState === 'idle') {
      group.current.position.y = Math.sin(t * 2) * 0.05;
    }
  });

  const primaryColor = isOrchestrator ? '#f59e0b' : '#3b82f6';
  const headColor = isOrchestrator ? '#fbbf24' : '#60a5fa';

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

      {/* Sub Agent Humanoid Body */}
      <group position={[0, 0, 0]}>
         {/* Torso */}
         <Box args={[0.5, 0.7, 0.25]} position={[0, 0.95, 0]}  >
           <meshStandardMaterial color={primaryColor} roughness={0.5} metalness={0.1} />
         </Box>
         
         {/* Left Leg */}
         <Cylinder args={[0.08, 0.06, 0.6]} position={[-0.15, 0.3, 0]}  >
            <meshStandardMaterial color="#334155" roughness={0.8} /> {/* pants */}
         </Cylinder>
         
         {/* Right Leg */}
         <Cylinder args={[0.08, 0.06, 0.6]} position={[0.15, 0.3, 0]}  >
            <meshStandardMaterial color="#334155" roughness={0.8} />
         </Cylinder>

         {/* Left Arm */}
         <group position={[-0.3, 1.15, 0]} ref={armRef}>
            <Cylinder args={[0.06, 0.05, 0.55]} position={[0, -0.25, 0]} rotation={[0, 0, 0.1]}  >
               <meshStandardMaterial color={primaryColor} roughness={0.5} />
            </Cylinder>
         </group>

         {/* Right Arm */}
         <group position={[0.3, 1.15, 0]}>
            <Cylinder args={[0.06, 0.05, 0.55]} position={[0, -0.25, 0]} rotation={[0, 0, -0.1]}  >
               <meshStandardMaterial color={primaryColor} roughness={0.5} />
            </Cylinder>
         </group>
      </group>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.5, 0]}>
        {/* Neck */}
        <Cylinder args={[0.05, 0.08, 0.15]} position={[0, -0.1, 0]}  >
           <meshStandardMaterial color="#fcd34d" roughness={0.4} />
        </Cylinder>
        {/* Head */}
        <Sphere args={[0.18, 32, 32]} position={[0, 0.05, 0]}  >
          <meshStandardMaterial color="#fcd34d" roughness={0.3} />
        </Sphere>
        {/* Hair/Helmet style */}
        <Sphere args={[0.19, 16, 16]} position={[0, 0.1, -0.02]} >
          <meshStandardMaterial color={headColor} roughness={0.7} />
        </Sphere>
        {/* Eyes */}
        <Box args={[0.04, 0.02, 0.02]} position={[-0.06, 0.05, 0.17]} >
          <meshStandardMaterial color="#1e293b" />
        </Box>
        <Box args={[0.04, 0.02, 0.02]} position={[0.06, 0.05, 0.17]} >
          <meshStandardMaterial color="#1e293b" />
        </Box>
      </group>

      {/* Working Task Visualizer prop */}
      {(currentState === 'working' || currentState === 'idle') && thought && (
         <TaskVisualizer thought={thought} isOrchestrator={isOrchestrator} />
      )}

      {/* Status indicator */}
      <Sphere args={[0.1, 8, 8]} position={[0, 2.3, 0]}>
         <meshStandardMaterial 
            color={currentState === 'working' ? '#10b981' : currentState === 'dancing' ? '#a855f7' : currentState === 'walking' ? '#3b82f6' : '#94a3b8'} 
            emissive={currentState === 'working' ? '#10b981' : currentState === 'dancing' ? '#a855f7' : currentState === 'walking' ? '#3b82f6' : '#94a3b8'} 
            emissiveIntensity={0.5}
         />
      </Sphere>

      {/* Nameplate */}
      <group position={[0, 2.5, 0]}>
        <Html transform center style={{ pointerEvents: 'none' }}>
          <div className="flex items-center gap-2 bg-[#2a3028]/80 backdrop-blur-sm rounded-xl px-2 py-1 shadow-[0_0_20px_rgba(0,40,0,0.6)] border border-green-700/40 min-w-max">
             <div className="w-6 h-6 rounded overflow-hidden bg-gray-500 border border-white/20 shrink-0">
               {/* Stand-in for generated avatar */}
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}&backgroundColor=b6e3f4`} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col items-start pr-1 border-l border-white/10 pl-2">
              <div className="flex gap-2 items-center">
                 <span className="text-white text-[9px] font-bold tracking-widest font-sans uppercase">
                   {name.toUpperCase().includes('AGENT') ? name : `AGENT ${name.toUpperCase()}`}
                 </span>
                 <span className="text-emerald-400/80 text-[7px] font-bold tracking-widest font-sans uppercase bg-emerald-900/40 px-1 rounded">
                   {role.length > 0 ? role.substring(0,6) : 'DATA'}
                 </span>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[#a3b19b] text-[7px] uppercase tracking-widest font-mono mt-0.5">COMPAS</span>
                 <div className="w-4 h-0.5 bg-emerald-500/50 rounded-full mt-0.5"></div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </group>
  );
};
