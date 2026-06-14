import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, SoftShadows } from '@react-three/drei';
import { Space } from '../../../types';
import { OfficeEnvironment, AgentDesk, DoubleAgentDesk } from './OfficeEnvironment';
import { AgentCharacter } from './AgentCharacter';
import { JanitorCharacter } from './JanitorCharacter';
import { useHubConnection } from '../../../store/useHubConnection';
import { useHubStore } from '../../../store/useHubStore';
import { ArrowLeft } from 'lucide-react';

interface Office3DModeProps {
  space: Space;
  onBack?: () => void;
}

export const Office3DMode: React.FC<Office3DModeProps> = ({ space, onBack }) => {
  const agents = space.subAgents || [];
  
  return (
    <div className="w-full h-full relative font-mono select-none overflow-hidden text-white/90" style={{ backgroundColor: '#050505' }}>
      
      {/* High-Resolution R3F Canvas */}
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        camera={{ position: [25, 20, 35], fov: 28, zoom: 1.1 }} 
        gl={{ antialias: true, preserveDrawingBuffer: true }}
      >
        <SoftShadows size={35} samples={16} focus={0.5} />
        <color attach="background" args={['#050505']} />
        
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[25, 45, 10]} 
          intensity={1.1}
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0001}
          castShadow
        >
          <orthographicCamera attach="shadow-camera" args={[-40, 40, 40, -40]} />
        </directionalLight>
        <directionalLight position={[-15, 25, -10]} intensity={0.4} />
        
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <OfficeEnvironment />
          
          <AgentCharacter 
            id="orchestrator"
            name="Orchestrator" 
            role={space.orchestratorRole || 'CEO'} 
            position={[-5, 0, -2]} 
            isOrchestrator={true} 
            rotation={[0, 0, 0]}
          />
          <AgentDesk position={[-5, 0, -2.5]} rotation={[0, 0, 0]} />
          
          {agents.map((agent, index) => {
            let pos: [number, number, number] = [0, 0, 0];
            let rot: [number, number, number] = [0, 0, 0];
            
            if (index < 3) {
               const col = index;
               pos = [-5 + col * 4, 0, 4];
               rot = [0, 0, 0];
            } else if (index < 6) {
               const col = index - 3;
               pos = [-5 + col * 4, 0, 8];
               rot = [0, 0, 0];
            } else if (index < 9) {
               const col = index - 6;
               pos = [-5 + col * 4, 0, 12];
               rot = [0, 0, 0];
            } else {
               pos = [7, 0, (index - 9) * 4];
               rot = [0, 0, 0];
            }

            return (
              <group key={agent.id}>
                <DoubleAgentDesk 
                   position={[pos[0], 0, pos[2] - 0.4]} 
                   rotation={rot} 
                />
                <AgentCharacter 
                  id={agent.id}
                  name={agent.name} 
                  role={agent.role}
                  position={pos} 
                  rotation={rot}
                />
              </group>
            );
          })}

          <JanitorCharacter />
        </Suspense>
        
        <OrbitControls makeDefault minDistance={10} maxDistance={200} maxPolarAngle={Math.PI / 2 - 0.05} target={[0, 0, 0]} />
      </Canvas>

      {/* --- REFINED & CLEANED UP UI OVERLAY --- */}
      
      {/* Top Left Menu: Clean Informational Panel */}
      <div className="absolute top-20 left-4 hidden md:flex flex-col gap-2 pointer-events-none z-10 w-64">
        <div className="bg-[#111111]/90 backdrop-blur-md border border-white/10 rounded-2xl p-4 pointer-events-auto mt-2 shadow-2xl">
          <div className="text-[10px] tracking-widest text-[#00ffff] mb-1 font-mono uppercase font-bold">🏢 ACTIVE SPACE</div>
          <div className="text-[16px] font-sans font-medium tracking-wide text-white/95">{space.title || "OpenClaw Floor"}</div>
          <div className="text-[9px] tracking-widest text-[#00ffff] font-mono mt-1">
            AGENTS ACTIVE: <span className="text-[#00ffff] font-bold">{agents.length + 1}</span>
          </div>
        </div>
      </div>

      {/* Top Center: Clean Minimalist Title Tracker */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-1 pointer-events-none z-10">
        <div className="flex items-center gap-3 bg-black/75 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
          <span className="text-xs tracking-[0.2em] font-sans font-semibold text-white/80">3D HEADQUARTERS</span>
          <div className="bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] px-2 py-0.5 rounded text-[8px] font-bold tracking-widest">
            HIGH-FIDELITY
          </div>
        </div>
      </div>

      {/* Bottom Center EXIT Button on Mobile - matching Chat capsule feel perfectly */}
      {onBack && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto z-10 w-[90%] max-w-xs md:hidden">
           <button 
             onClick={onBack}
             className="w-full h-11 bg-[#e8dcc4] text-black hover:bg-white active:scale-95 text-xs font-bold tracking-[0.15em] uppercase rounded-full flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all duration-300 pointer-events-auto cursor-pointer"
           >
             <ArrowLeft size={16} strokeWidth={2.5} />
             <span>EXIT 3D</span>
           </button>
        </div>
      )}



    </div>
  );
};
