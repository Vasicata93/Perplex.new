import React from 'react';
import { Box, Plane, Cylinder, Text, Circle, Sphere } from '@react-three/drei';

export const AgentDesk: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation} scale={[0.92, 0.92, 0.92]}>
     {/* Walnut wood desk top */}
     <Box args={[1.7, 0.06, 0.85]} position={[0, 0.75, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color="#4a2c13" roughness={0.15} metalness={0.2} clearcoat={1.0} clearcoatRoughness={0.15} />
     </Box>
     
     {/* Leg assemblies - elegant matte black iron frames */}
     <Box args={[0.08, 0.74, 0.8]} position={[-0.8, 0.37, 0]} castShadow>
        <meshStandardMaterial color="#1a202c" roughness={0.5} />
     </Box>
     <Box args={[0.08, 0.74, 0.8]} position={[0.8, 0.37, 0]} castShadow>
        <meshStandardMaterial color="#1a202c" roughness={0.5} />
     </Box>
     {/* Support cross bar */}
     <Box args={[1.5, 0.05, 0.05]} position={[0, 0.5, -0.25]} castShadow>
        <meshStandardMaterial color="#1a202c" roughness={0.5} />
     </Box>

     {/* Under-desk storage drawer (premium metal accent) */}
     <Box args={[0.35, 0.5, 0.7]} position={[0.55, 0.45, 0]} castShadow>
        <meshStandardMaterial color="#2d3748" metalness={0.5} roughness={0.3} />
     </Box>
     
     {/* Desktop details: Mouse Pad */}
     <Box args={[0.8, 0.01, 0.35]} position={[0, 0.781, 0.05]}>
        <meshStandardMaterial color="#1a202c" roughness={0.8} />
     </Box>

     {/* Keyboards with subtle glow */}
     <Box args={[0.42, 0.015, 0.15]} position={[0, 0.785, 0.08]}>
        <meshStandardMaterial color="#0f172a" emissive="#0ea5e9" emissiveIntensity={0.15} />
     </Box>
     
     {/* Coffee Mug */}
     <group position={[-0.6, 0.78, 0.15]}>
       <Cylinder args={[0.045, 0.045, 0.12]} position={[0, 0.06, 0]} castShadow>
          <meshStandardMaterial color="#ef4444" roughness={0.2} />
       </Cylinder>
       <Box args={[0.02, 0.06, 0.04]} position={[0.05, 0.06, 0]}>
          <meshStandardMaterial color="#ef4444" />
       </Box>
     </group>

     {/* Small Desk Plant */}
     <group position={[0.6, 0.78, -0.25]}>
       <Cylinder args={[0.06, 0.04, 0.08]} position={[0, 0.04, 0]} castShadow>
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
       </Cylinder>
       <Sphere args={[0.08, 8, 8]} position={[0, 0.11, 0]}>
          <meshStandardMaterial color="#22c55e" roughness={0.9} />
       </Sphere>
       <Sphere args={[0.06, 6, 6]} position={[0.04, 0.14, 0.02]}>
          <meshStandardMaterial color="#16a34a" roughness={0.9} />
       </Sphere>
       <Sphere args={[0.05, 6, 6]} position={[-0.03, 0.13, -0.04]}>
          <meshStandardMaterial color="#15803d" roughness={0.9} />
       </Sphere>
     </group>

     {/* Dual glowing monitors */}
     {/* Monitor 1 (Left - Code / Stats) */}
     <group position={[-0.32, 0.78, -0.22]} rotation={[0, 0.15, 0]}>
       <Cylinder args={[0.02, 0.02, 0.25]} position={[0, 0.125, 0]} castShadow><meshStandardMaterial color="#111827" /></Cylinder>
       <Box args={[0.18, 0.01, 0.12]} position={[0, 0.005, 0]}><meshStandardMaterial color="#111827" /></Box>
       <Box args={[0.62, 0.38, 0.03]} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.3} />
       </Box>
       <Box args={[0.59, 0.35, 0.005]} position={[0, 0.28, 0.016]}>
          <meshPhysicalMaterial color="#020617" emissive="#0ea5e9" emissiveIntensity={1.4} roughness={0.02} clearcoat={1.0} clearcoatRoughness={0.0} />
       </Box>
       <Box args={[0.4, 0.01, 0.006]} position={[0, 0.2, 0.017]}>
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.3} />
       </Box>
     </group>

     {/* Monitor 2 (Right - Maps / Network) */}
     <group position={[0.32, 0.78, -0.22]} rotation={[0, -0.15, 0]}>
       <Cylinder args={[0.02, 0.02, 0.25]} position={[0, 0.125, 0]} castShadow><meshStandardMaterial color="#111827" /></Cylinder>
       <Box args={[0.18, 0.01, 0.12]} position={[0, 0.005, 0]}><meshStandardMaterial color="#111827" /></Box>
       <Box args={[0.62, 0.38, 0.03]} position={[0, 0.28, 0]} castShadow>
          <meshStandardMaterial color="#1f2937" roughness={0.3} />
       </Box>
       <Box args={[0.59, 0.35, 0.005]} position={[0, 0.28, 0.016]}>
          <meshPhysicalMaterial color="#020617" emissive="#10b981" emissiveIntensity={1.3} roughness={0.02} clearcoat={1.0} clearcoatRoughness={0.0} />
       </Box>
       <Box args={[0.2, 0.15, 0.006]} position={[0.1, 0.3, 0.017]}>
          <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={1.1} />
       </Box>
     </group>
     
     {/* Chair - highly polished armrest design */}
     <group position={[0, 0, 0.52]} rotation={[0, Math.PI, 0]}>
         <Cylinder args={[0.26, 0.26, 0.03]} position={[0, 0.015, 0]} receiveShadow><meshStandardMaterial color="#111827" /></Cylinder>
         <Cylinder args={[0.035, 0.035, 0.45]} position={[0, 0.225, 0]} castShadow><meshStandardMaterial color="#4b5563" /></Cylinder>
         <Box args={[0.48, 0.06, 0.48]} position={[0, 0.45, 0]} castShadow><meshStandardMaterial color="#1e293b" /></Box>
         <Cylinder args={[0.015, 0.015, 0.25]} position={[-0.25, 0.575, 0]}><meshStandardMaterial color="#4b5563" /></Cylinder>
         <Box args={[0.04, 0.02, 0.3]} position={[-0.25, 0.7, -0.02]}><meshStandardMaterial color="#111827" /></Box>
         <Cylinder args={[0.015, 0.015, 0.25]} position={[0.25, 0.575, 0]}><meshStandardMaterial color="#4b5563" /></Cylinder>
         <Box args={[0.04, 0.02, 0.3]} position={[0.25, 0.7, -0.02]}><meshStandardMaterial color="#111827" /></Box>
         <Box args={[0.44, 0.55, 0.05]} position={[0, 0.725, 0.22]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.8} /></Box>
     </group>
  </group>
);

export const DoubleAgentDesk: React.FC<{ position: [number, number, number], rotation?: [number, number, number] }> = ({ position, rotation = [0, 0, 0] }) => (
  <group position={position} rotation={rotation}>
     <AgentDesk position={[0, 0, -0.42]} rotation={[0, 0, 0]} />
     <AgentDesk position={[0, 0, 0.42]} rotation={[0, Math.PI, 0]} />
     {/* Privacy Divider Panel with frosted glass / soundproofing texture */}
     <Box args={[1.65, 0.5, 0.04]} position={[0, 1.0, 0]} castShadow>
        <meshPhysicalMaterial color="#334155" transmission={0.4} opacity={0.95} roughness={0.3} />
     </Box>
  </group>
);


export const OfficeEnvironment: React.FC = () => {
  return (
    <group>
      {/* Wooden Floor - premium rich dark wood */}
      <Plane args={[45, 35]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <meshPhysicalMaterial color="#301e11" roughness={0.16} metalness={0.25} clearcoat={1.0} clearcoatRoughness={0.08} />
      </Plane>
      {/* Dark Floor for left wing */}
      <Plane args={[13, 35]} rotation={[-Math.PI / 2, 0, 0]} position={[-29, 0.01, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </Plane>

      {/* Main Back Wall */}
      <Box args={[45, 8, 1]} position={[0, 4, -17.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#0e131b" roughness={0.6} metalness={0.45} />
      </Box>
      {/* Left Outer Wall */}
      <Box args={[1, 8, 35]} position={[-22.5, 4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0e131b" roughness={0.6} metalness={0.45} />
      </Box>
      {/* Right Outer Wall */}
      <Box args={[1, 8, 35]} position={[22.5, 4, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0e131b" roughness={0.6} metalness={0.45} />
      </Box>

      {/* Left Wing Walls (Server Room & Kitchen structure) */}
      <Box args={[11, 4.5, 0.2]} position={[-17, 2.25, -5.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" />
      </Box>
      <Box args={[0.2, 4.5, 12]} position={[-11.5, 2.25, -11.5]} castShadow receiveShadow>
        <meshStandardMaterial color="#0f172a" />
      </Box>
      
      {/* Glass Walls for Server Room */}
      <Box args={[11, 3.5, 0.1]} position={[-17, 2.25, -10]} castShadow receiveShadow>
         <meshPhysicalMaterial color="#c7d2fe" transmission={0.95} opacity={0.15} thickness={1.2} roughness={0.05} ior={1.5} clearcoat={1.0} />
      </Box>
      <Box args={[0.1, 3.5, 7.5]} position={[-11.5, 2.25, -13.75]} castShadow receiveShadow>
         <meshPhysicalMaterial color="#c7d2fe" transmission={0.95} opacity={0.15} thickness={1.2} roughness={0.05} ior={1.5} clearcoat={1.0} />
      </Box>

      {/* Brown Door */}
      <Box args={[2, 3.5, 0.25]} position={[-9.5, 1.75, -5.5]} castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.8} />
      </Box>

      {/* SERVER ROOM (-17, 0, -14) */}
      <group position={[-17, 0, -14]}>
        {/* Large Black Racks */}
        {[-3, -1, 1, 3].map((x) => (
          <group position={[x, 0, 0]} key={x}>
            <Box args={[1.5, 4.2, 2.5]} position={[0, 2.1, 0]} castShadow><meshStandardMaterial color="#020617" roughness={0.4} metalness={0.8} /></Box>
            {/* Blinking lights */}
            <Box args={[1.35, 4, 0.05]} position={[0, 2.1, 1.25]}>
              <meshStandardMaterial color="#010409" emissive="#3b82f6" emissiveIntensity={0.6} roughness={0.4} />
            </Box>
            <Box args={[0.1, 0.1, 0.05]} position={[-0.5, 3.2, 1.26]}>
              <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.5} />
            </Box>
            <Box args={[0.1, 0.1, 0.05]} position={[0.5, 2.5, 1.26]}>
              <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} />
            </Box>
            {/* Server room internal point light */}
            <pointLight position={[0, 3, 2]} intensity={0.4} distance={6} color="#818cf8" />
          </group>
        ))}
      </group>

      {/* KITCHEN (-17, 0, 7) */}
      <group position={[-17, 0, 7]}>
        <Box args={[8, 3.5, 0.2]} position={[0, 1.75, 4]} castShadow receiveShadow>
          <meshStandardMaterial color="#1e293b" />
        </Box>
        {/* Cabinets */}
        <Box args={[5, 1.5, 1.5]} position={[-1.5, 0.75, 3]} castShadow><meshStandardMaterial color="#475569" roughness={0.5} /></Box>
        <Box args={[5, 1, 0.8]} position={[-1.5, 3, 3.5]} castShadow><meshStandardMaterial color="#334155" roughness={0.5} /></Box>
        {/* Fridge */}
        <Box args={[1.5, 3.5, 1.5]} position={[2.5, 1.75, 3]} castShadow><meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.3} /></Box>
        {/* Coffee Machine */}
        <Box args={[0.6, 0.8, 0.6]} position={[-1.5, 1.9, 3]} castShadow><meshStandardMaterial color="#090d16" roughness={0.4} /></Box>
      </group>

      {/* Round Tables & Break Areas */}
      <group position={[-8, 0, 10]}>
         <Cylinder args={[2, 2, 0.06]} position={[0, 1.1, 0]} castShadow><meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.2} /></Cylinder>
         <Circle args={[3, 32]} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
           <meshStandardMaterial color="#0f172a" />
         </Circle>
         <Cylinder args={[0.15, 0.15, 1.05]} position={[0, 0.55, 0]} castShadow><meshStandardMaterial color="#111827" metalness={0.9} /></Cylinder>
         <Cylinder args={[0.8, 0.8, 0.05]} position={[0, 0.03, 0]} castShadow><meshStandardMaterial color="#111827" metalness={0.9} /></Cylinder>
         
         {/* Seats & People */}
         {[0, 1, 2, 3].map(i => (
           <group key={i} position={[Math.cos(i*(Math.PI/2))*2.2, 0, Math.sin(i*(Math.PI/2))*2.2]} rotation={[0, -i*(Math.PI/2) + Math.PI/2, 0]}>
              <Box args={[0.55, 0.06, 0.55]} position={[0, 0.55, 0]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.6} /></Box>
              <Box args={[0.55, 0.55, 0.06]} position={[0, 0.85, -0.25]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.6} /></Box>
              <Cylinder args={[0.04, 0.04, 0.5]} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#4b5563" /></Cylinder>
              <Cylinder args={[0.3, 0.3, 0.03]} position={[0, 0.015, 0]}><meshStandardMaterial color="#111827" /></Cylinder>
              {/* Person sitting */}
              <group position={[0, 0.6, 0]}>
                <Box args={[0.38, 0.48, 0.22]} position={[0, 0.24, 0]}><meshStandardMaterial color={`hsl(${i*90 + 20}, 60%, 45%)`} /></Box>
                <Sphere args={[0.14, 16, 16]} position={[0, 0.62, 0]}><meshStandardMaterial color="#fed7aa" /></Sphere>
              </group>
           </group>
         ))}
      </group>

      <group position={[3, 0, 8]}>
         <Cylinder args={[1.5, 1.5, 0.06]} position={[0, 1.1, 0]} castShadow><meshStandardMaterial color="#ffffff" roughness={0.3} metalness={0.2} /></Cylinder>
         <Cylinder args={[0.15, 0.15, 1.05]} position={[0, 0.55, 0]} castShadow><meshStandardMaterial color="#111827" metalness={0.9} /></Cylinder>
         <Cylinder args={[0.6, 0.6, 0.05]} position={[0, 0.03, 0]} castShadow><meshStandardMaterial color="#111827" metalness={0.9} /></Cylinder>
         
         {/* Seats & People */}
         {[0, 1, 2, 3].map(i => (
           <group key={i} position={[Math.cos(i*(Math.PI/2))*1.9, 0, Math.sin(i*(Math.PI/2))*1.9]} rotation={[0, -i*(Math.PI/2) + Math.PI/2, 0]}>
              <Box args={[0.5, 0.06, 0.5]} position={[0, 0.55, 0]} castShadow><meshStandardMaterial color="#334155" /></Box>
              <Box args={[0.5, 0.5, 0.06]} position={[0, 0.82, -0.22]} castShadow><meshStandardMaterial color="#334155" /></Box>
              <Cylinder args={[0.04, 0.04, 0.5]} position={[0, 0.25, 0]} castShadow><meshStandardMaterial color="#4b5563" /></Cylinder>
              <Cylinder args={[0.3, 0.3, 0.03]} position={[0, 0.015, 0]}><meshStandardMaterial color="#111827" /></Cylinder>
              {/* Person sitting loosely */}
              {i % 2 === 0 && (
                <group position={[0, 0.6, 0]}>
                  <Box args={[0.38, 0.48, 0.22]} position={[0, 0.24, 0]}><meshStandardMaterial color={`hsl(${i*120}, 50%, 40%)`} /></Box>
                  <Sphere args={[0.14, 16, 16]} position={[0, 0.62, 0]}><meshStandardMaterial color="#fed7aa" /></Sphere>
                </group>
              )}
           </group>
         ))}
      </group>

      {/* MAIN HALLWAY HYPER-PROFESSIONAL BIG SCREEN */}
      <group position={[6, 4.2, -16.9]}>
        {/* Heavy sleek metal bracket */}
        <Box args={[32, 5.5, 0.25]} castShadow>
          <meshStandardMaterial color="#030712" roughness={0.15} metalness={0.95} />
        </Box>
        {/* Emissive border bezel */}
        <Box args={[32.1, 5.6, 0.02]} position={[0, 0, -0.01]}>
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2.5} />
        </Box>
        <Box args={[31.5, 5, 0.02]} position={[0, 0, 0.14]}>
          <meshPhysicalMaterial color="#010409" roughness={0.01} metalness={0.9} clearcoat={1.0} clearcoatRoughness={0.0} />
        </Box>
        
        {/* Dynamic Glowing Sci-Fi Content Sections on Wall Screen */}
        {/* Section 1: Blue Radar circle glow */}
        <group position={[-10.5, 0, 0.15]}>
          <Box args={[9.5, 4.6, 0.01]}>
            <meshStandardMaterial color="#030712" emissive="#1d4ed8" emissiveIntensity={0.2} />
          </Box>
          <Cylinder args={[1.5, 1.5, 0.015]} rotation={[Math.PI/2, 0, 0]} position={[-1.5, 0, 0.01]}>
            <meshStandardMaterial color="#1e1b4b" emissive="#3b82f6" emissiveIntensity={1.5} roughness={0.1} />
          </Cylinder>
          <Cylinder args={[1.4, 1.4, 0.016]} rotation={[Math.PI/2, 0, 0]} position={[-1.5, 0, 0.01]}>
            <meshStandardMaterial color="#030712" />
          </Cylinder>
          <Cylinder args={[0.4, 0.4, 0.017]} rotation={[Math.PI/2, 0, 0]} position={[-1.5, 0, 0.011]}>
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2.0} />
          </Cylinder>
          <Box args={[2.5, 0.08, 0.015]} position={[2, 1.2, 0.01]}><meshStandardMaterial color="#60a5fa" emissive="#60a5fa" emissiveIntensity={0.8}/></Box>
          <Box args={[3.2, 0.08, 0.015]} position={[2.3, 0.8, 0.01]}><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8}/></Box>
          <Box args={[1.8, 0.08, 0.015]} position={[1.6, 0.4, 0.01]}><meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8}/></Box>
        </group>

        {/* Section 2: Emerald map network matrix */}
        <group position={[0, 0, 0.15]}>
          <Box args={[11, 4.6, 0.01]}>
            <meshStandardMaterial color="#030712" emissive="#047857" emissiveIntensity={0.2} />
          </Box>
          {/* Node graph matrices */}
          {[-4, -2, 0, 2, 4].map((vx, vi) => (
             <Sphere key={vi} args={[0.15, 12, 12]} position={[vx, Math.sin(vi)*1.2, 0.02]}>
               <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
             </Sphere>
          ))}
          {/* Connector paths */}
          <Box args={[9.5, 0.04, 0.01]} position={[0, -0.2, 0.011]}><meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={0.5}/></Box>
          <Box args={[0.04, 2.8, 0.01]} position={[-2, 0, 0.011]}><meshStandardMaterial color="#059669" emissive="#10b981" emissiveIntensity={0.5}/></Box>
        </group>

        {/* Section 3: Amber telemetry graph and alerts */}
        <group position={[10.5, 0, 0.15]}>
          <Box args={[9.5, 4.6, 0.01]}>
            <meshStandardMaterial color="#030712" emissive="#b45309" emissiveIntensity={0.2} />
          </Box>
          {/* Bars */}
          {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
             <Box key={idx} args={[0.4, (idx + 1) * 0.5, 0.015]} position={[-3 + idx*0.9, -1.5 + (idx+1)*0.25, 0.01]}>
                <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={1.2} />
             </Box>
          ))}
          <Box args={[3.5, 0.3, 0.015]} position={[2.2, 1.2, 0.011]}><meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1.5} /></Box>
        </group>

        {/* Casting glowing colors down onto the general workspace */}
        <pointLight position={[0, -1, 3]} intensity={1.8} distance={18} color="#3b82f6" />
        <pointLight position={[-10, 0, 3]} intensity={1.2} distance={15} color="#10b981" />
        <pointLight position={[10, 0, 3]} intensity={1.2} distance={15} color="#f59e0b" />
      </group>

      {/* LOUNGE AREA */}
      <group position={[-5, 0, -5]}>
        {/* Purple Couch - luxurious deep velvet */}
        <Box args={[3.8, 0.85, 1.1]} position={[-2, 0.425, -2]} castShadow>
           <meshStandardMaterial color="#4c1d95" roughness={0.6} />
        </Box>
        <Box args={[3.8, 1.25, 0.45]} position={[-2, 0.625, -2.5]} castShadow>
           <meshStandardMaterial color="#4c1d95" roughness={0.6} />
        </Box>
        {/* Blue Couches */}
        <Box args={[1.1, 0.85, 2.6]} position={[-5.2, 0.425, 0]} castShadow>
           <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
        </Box>
        <Box args={[0.45, 1.25, 2.6]} position={[-5.5, 0.625, 0]} castShadow>
           <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
        </Box>
        <Box args={[1.1, 0.85, 2.6]} position={[1.2, 0.425, 0]} castShadow>
           <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
        </Box>
        <Box args={[0.45, 1.25, 2.6]} position={[1.5, 0.625, 0]} castShadow>
           <meshStandardMaterial color="#1d4ed8" roughness={0.6} />
        </Box>
        {/* Marble Coffee Table */}
        <Box args={[2.2, 0.15, 1.1]} position={[-2, 0.35, 0]} castShadow>
           <meshStandardMaterial color="#f8fafc" roughness={0.1} metalness={0.1} />
        </Box>
        <Box args={[1.8, 0.2, 0.8]} position={[-2, 0.1, 0]} castShadow>
           <meshStandardMaterial color="#0f172a" />
        </Box>

        {/* People lounging */}
        <group position={[-2.6, 0.65, -1.8]}>
            <Box args={[0.38, 0.48, 0.22]} position={[0, 0.24, 0]}><meshStandardMaterial color={`hsl(145, 50%, 35%)`} /></Box>
            <Sphere args={[0.14, 16, 16]} position={[0, 0.62, 0]}><meshStandardMaterial color="#fed7aa" /></Sphere>
        </group>
        <group position={[-1.4, 0.65, -1.8]}>
            <Box args={[0.38, 0.48, 0.22]} position={[0, 0.24, 0]}><meshStandardMaterial color={`hsl(15, 55%, 40%)`} /></Box>
            <Sphere args={[0.14, 16, 16]} position={[0, 0.62, 0]}><meshStandardMaterial color="#fed7aa" /></Sphere>
        </group>
      </group>

      {/* Modern Pendant Ceiling Lamps casting gorgeous shadows */}
      {/* Lamp 1 over first desk cluster */}
      <group position={[0, 7.8, 2]}>
         <Cylinder args={[0.015, 0.015, 2]} position={[0, 1, 0]}><meshStandardMaterial color="#111827" /></Cylinder>
         <Cylinder args={[0.4, 0.4, 0.2]} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#10b981" metalness={0.8} /></Cylinder>
         <Sphere args={[0.15, 12, 12]} position={[0, -0.15, 0]}>
           <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.0} />
         </Sphere>
         <pointLight intensity={1.8} distance={15} color="#60a5fa" castShadow shadow-bias={-0.005} />
      </group>

      {/* Lamp 2 over break table area */}
      <group position={[-8, 7.8, 10]}>
         <Cylinder args={[0.015, 0.015, 2]} position={[0, 1, 0]}><meshStandardMaterial color="#111827" /></Cylinder>
         <Cylinder args={[0.4, 0.4, 0.2]} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#f59e0b" metalness={0.8} /></Cylinder>
         <Sphere args={[0.15, 12, 12]} position={[0, -0.15, 0]}>
           <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.0} />
         </Sphere>
         <pointLight intensity={1.6} distance={15} color="#ffd8a8" castShadow shadow-bias={-0.005} />
      </group>

      {/* Lamp 3 over second break area group */}
      <group position={[3, 7.8, 8]}>
         <Cylinder args={[0.015, 0.015, 2]} position={[0, 1, 0]}><meshStandardMaterial color="#111827" /></Cylinder>
         <Cylinder args={[0.4, 0.4, 0.2]} position={[0, 0, 0]} castShadow><meshStandardMaterial color="#3b82f6" metalness={0.8} /></Cylinder>
         <Sphere args={[0.15, 12, 12]} position={[0, -0.15, 0]}>
           <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.0} />
         </Sphere>
         <pointLight intensity={1.6} distance={15} color="#ffd8a8" castShadow shadow-bias={-0.005} />
      </group>

      {/* Decorative Plants & Shelves */}
      <group position={[20, 0, -15]}>
         <Cylinder args={[0.55, 0.45, 1]} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.4} /></Cylinder>
         <Box args={[1.5, 2.5, 1.5]} position={[0, 2, 0]} castShadow><meshStandardMaterial color="#047857" /></Box>
      </group>
      <group position={[20, 0, 10]}>
         <Cylinder args={[0.55, 0.45, 1]} position={[0, 0.5, 0]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.4} /></Cylinder>
         <Box args={[1.5, 2.5, 1.5]} position={[0, 2, 0]} castShadow><meshStandardMaterial color="#047857" /></Box>
      </group>
      <group position={[12, 0, 8]}>
         <Cylinder args={[0.45, 0.35, 0.8]} position={[0, 0.4, 0]} castShadow><meshStandardMaterial color="#1e293b" roughness={0.4} /></Cylinder>
         <Box args={[1.2, 2, 1.2]} position={[0, 1.5, 0]} castShadow><meshStandardMaterial color="#065f46" /></Box>
      </group>
      
      {/* Floating glowing neon accent trim line at the base of back wall for cyber glow */}
      <Box args={[45, 0.08, 0.08]} position={[0, 0.04, -16.9]} receiveShadow>
         <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
      </Box>
      <Box args={[0.08, 0.08, 35]} position={[-21.9, 0.04, 0]} receiveShadow>
         <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
      </Box>
      <Box args={[0.08, 0.08, 35]} position={[21.9, 0.04, 0]} receiveShadow>
         <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={1.5} />
      </Box>

      {/* Storage and Shelving Units */}
      <Box args={[2, 3, 0.8]} position={[14, 1.5, -16.5]} castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </Box>
      <Box args={[2, 2, 0.8]} position={[18, 1, -8]} castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </Box>
      <Cylinder args={[0.8, 0.8, 2]} position={[16, 1, -11]} castShadow>
        <meshStandardMaterial color="#1e293b" roughness={0.5} />
      </Cylinder>
      <Box args={[2, 2, 0.8]} position={[-10, 1, -2]} castShadow>
        <meshStandardMaterial color="#451a03" roughness={0.7} />
      </Box>

      {/* Dynamic 3D Floating Specification Labels (High-Resolution Technical Labels) */}
      <group>
        {/* Main Central Screen */}
        <group position={[6, 7.5, -16.5]}>
          <Text
            color="#00ffff"
            fontSize={0.28}
            anchorX="center"
            anchorY="middle"
            rotation={[0, -Math.PI / 12, 0]}
          >
            MAIN TELEMETRY SCREEN [8K RESOLUTION]
          </Text>
          <Text
            color="#94a3b8"
            fontSize={0.16}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.28, 0]}
            rotation={[0, -Math.PI / 12, 0]}
          >
            RESOLUTION: 7680 x 4320PX Ultra-HD // DEPTH: 10-BIT OLED RGB
          </Text>
        </group>

        {/* Server clusters */}
        <group position={[-17, 4.6, -12.5]}>
          <Text
            color="#22c55e"
            fontSize={0.24}
            anchorX="center"
            anchorY="middle"
            rotation={[0, Math.PI / 6, 0]}
          >
            MAIN CORE SERVER FARM
          </Text>
          <Text
            color="#94a3b8"
            fontSize={0.14}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.24, 0]}
            rotation={[0, Math.PI / 6, 0]}
          >
            CLUSTER CAPACITY: 512 Cores // LINK RESOLUTION: 100Gbps Fibre-Op
          </Text>
        </group>

        {/* Lead Workspace */}
        <group position={[-5, 2.4, -2.5]}>
          <Text
            color="#6366f1"
            fontSize={0.22}
            anchorX="center"
            anchorY="middle"
            rotation={[0, -Math.PI / 6, 0]}
          >
            ORCHESTRATOR HEADSTATION
          </Text>
          <Text
            color="#94a3b8"
            fontSize={0.12}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.22, 0]}
            rotation={[0, -Math.PI / 6, 0]}
          >
            DEV HOST: Dual RTX 4090 GPU Array // OUTPUT RESOLUTION: 120Hz 32:9 HUD
          </Text>
        </group>

        {/* Developer Desk clusters */}
        <group position={[5, 2.2, 4]}>
          <Text
            color="#38bdf8"
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            rotation={[0, -Math.PI / 6, 0]}
          >
            CO-WORKSPACE BENCHES
          </Text>
          <Text
            color="#94a3b8"
            fontSize={0.11}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.2, 0]}
            rotation={[0, -Math.PI / 6, 0]}
          >
            INTEGRATED DUAL SCREEN: 4K IPS HDR (3840 x 2160PX)
          </Text>
        </group>

        {/* Lounge espresso machinery */}
        <group position={[-17, 2.5, 7.5]}>
          <Text
            color="#f43f5e"
            fontSize={0.2}
            anchorX="center"
            anchorY="middle"
            rotation={[0, Math.PI / 4, 0]}
          >
            COFFEE RECOVERY UNIT
          </Text>
          <Text
            color="#94a3b8"
            fontSize={0.11}
            anchorX="center"
            anchorY="middle"
            position={[0, -0.2, 0]}
            rotation={[0, Math.PI / 4, 0]}
          >
            SPECIFICATION: Rotary Pump Dual-Boiler // TEMP: 93.5 C FIXED
          </Text>
        </group>
      </group>

    </group>
  );
};
