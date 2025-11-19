import React, { useEffect, useRef, useState } from 'react';
import { SymbolInfo } from '../types';
import { explainSymbol, generateLevelData, LevelParams } from '../services/gemini';
import { Shield, Zap, Crosshair, Compass, ArrowUp, AlertTriangle, Send, Wind } from 'lucide-react';

interface ShadowJourneyProps {
  symbols: SymbolInfo[];
  onExit: () => void;
}

// --- ENGINE TYPES ---
interface Vector3 { x: number; y: number; z: number; }
interface Cube { 
    x: number; y: number; z: number; 
    size: number; 
    color: string; 
    type: 'TERRAIN' | 'TARGET' | 'DEBRIS';
    pulseOffset?: number;
}

const BASE_FOV = 800;
const RENDER_DISTANCE = 6000;

const ShadowJourney: React.FC<ShadowJourneyProps> = ({ symbols, onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Game State
  const [level, setLevel] = useState(0);
  const [teaching, setTeaching] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userPhilosophy, setUserPhilosophy] = useState("");
  const [phase, setPhase] = useState<'FLYING' | 'TEACHING' | 'WARPING'>('FLYING');
  const [pointerLocked, setPointerLocked] = useState(false);

  // Level Params
  const [levelParams, setLevelParams] = useState<LevelParams>({
      themeName: "The Primer",
      fogColor: "#050505",
      terrainColor: "#111111",
      targetColor: "#d4af37",
      islandCount: 20,
      islandSize: 60,
      chaosFactor: 0.1,
      geometryStyle: 'CUBE',
      physicsGravity: 0
  });

  // --- PHYSICS ENGINE STATE ---
  const player = useRef({
      pos: { x: 0, y: 300, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
      // Rotation (Euler Angles)
      rot: { yaw: 0, pitch: 0, roll: 0 },
      // Target Rotation for smoothing
      targetRot: { yaw: 0, pitch: 0, roll: 0 },
      boost: false,
      speedFactor: 0
  });

  const world = useRef<{ cubes: Cube[], particles: Vector3[] }>({ cubes: [], particles: [] });
  const targetPos = useRef<Vector3>({ x: 0, y: 0, z: 0 });
  const keys = useRef<{ [key: string]: boolean }>({});
  const frameRef = useRef(0);
  const warpSpeedRef = useRef(0);
  const shakeRef = useRef(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    initLevel();
    
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    
    const handleMouseMove = (e: MouseEvent) => {
        if (!document.pointerLockElement || phase !== 'FLYING') return;
        
        const sens = 0.0015;
        player.current.targetRot.yaw += e.movementX * sens;
        player.current.targetRot.pitch += e.movementY * sens;

        // Clamp Pitch
        const limit = Math.PI / 2 - 0.1;
        player.current.targetRot.pitch = Math.max(-limit, Math.min(limit, player.current.targetRot.pitch));
    };

    const handlePointerLockChange = () => {
        setPointerLocked(!!document.pointerLockElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('pointerlockchange', handlePointerLockChange);
        cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const requestCapture = () => {
      if (canvasRef.current && !document.pointerLockElement && phase === 'FLYING') {
          canvasRef.current.requestPointerLock();
      }
  };

  // Re-init when params change
  useEffect(() => {
      if (level > 0) initLevel();
  }, [levelParams]);

  const initLevel = () => {
      player.current.pos = { x: 0, y: 300, z: 0 };
      player.current.vel = { x: 0, y: 0, z: 0 };
      player.current.rot = { yaw: 0, pitch: 0, roll: 0 };
      player.current.targetRot = { yaw: 0, pitch: 0, roll: 0 };

      const newCubes: Cube[] = [];
      const { islandCount, islandSize, terrainColor, targetColor, chaosFactor } = levelParams;

      // Generate Terrain Clusters
      for(let i=0; i<islandCount; i++) {
          const cx = (Math.random() - 0.5) * 5000 * (1 + chaosFactor);
          const cy = (Math.random() - 0.5) * 3000 * (1 + chaosFactor);
          const cz = (Math.random() * 4000) + 1000; 
          
          const size = islandSize * (0.5 + Math.random());
          const clusterSize = Math.floor(3 + Math.random() * 5);
          
          for(let b=0; b<clusterSize; b++) {
              newCubes.push({
                  x: cx + (Math.random()-0.5)*size*3,
                  y: cy + (Math.random()-0.5)*size*3,
                  z: cz + (Math.random()-0.5)*size*3,
                  size: Math.random() * size + 20,
                  color: terrainColor,
                  type: 'TERRAIN'
              });
          }
      }

      // Monolith Target
      const tx = (Math.random() - 0.5) * 2000;
      const ty = (Math.random() - 0.5) * 1000;
      const tz = 5000 + Math.random() * 1000;
      targetPos.current = { x: tx, y: ty, z: tz };

      for(let y=0; y<20; y++) {
          newCubes.push({
              x: tx,
              y: ty + y * 80 - 600,
              z: tz,
              size: 60,
              color: targetColor,
              type: 'TARGET',
              pulseOffset: y * 0.2
          });
      }

      // Space Dust
      const particles: Vector3[] = [];
      for(let i=0; i<200; i++) {
          particles.push({
              x: (Math.random() - 0.5) * 2000,
              y: (Math.random() - 0.5) * 2000,
              z: (Math.random() - 0.5) * 2000 + 1000
          });
      }

      world.current.cubes = newCubes;
      world.current.particles = particles;
  };

  // --- GAME LOOP ---
  useEffect(() => {
      const canvas = canvasRef.current;
      if(!canvas) return;
      const ctx = canvas.getContext('2d');
      if(!ctx) return;

      const loop = () => {
          updatePhysics();
          if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
              canvas.width = window.innerWidth;
              canvas.height = window.innerHeight;
          }
          renderScene(ctx, canvas.width, canvas.height);
          frameRef.current = requestAnimationFrame(loop);
      };
      frameRef.current = requestAnimationFrame(loop);
  }, [phase, levelParams]); 

  const updatePhysics = () => {
      const p = player.current;
      const k = keys.current;
      
      if (phase === 'WARPING') {
          warpSpeedRef.current = Math.min(warpSpeedRef.current + 5, 300);
          p.pos.z += warpSpeedRef.current;
          shakeRef.current = 10;
          return;
      } else {
          warpSpeedRef.current = 0;
      }

      if (phase !== 'FLYING') return;

      // --- CONTROLS ---
      const boost = k['ShiftLeft'];
      p.boost = boost;
      const thrustPower = boost ? 5.0 : 1.8;
      const friction = 0.94; // Gliding feel

      // Calc Rotation Vectors
      const yaw = p.rot.yaw;
      const pitch = p.rot.pitch;
      const roll = p.rot.roll;

      // Forward Vector (Where nose points)
      const fwd = {
          x: Math.sin(yaw) * Math.cos(pitch),
          y: Math.sin(pitch), 
          z: Math.cos(yaw) * Math.cos(pitch)
      };

      // Right Vector (Relative to nose)
      const right = {
          x: Math.cos(yaw) * Math.cos(roll),
          y: Math.sin(roll),
          z: -Math.sin(yaw) * Math.cos(roll)
      };

      // Up Vector (Approximate for banking)
      const up = { x: 0, y: -1, z: 0 };

      // Acceleration Input
      const acc = { x: 0, y: 0, z: 0 };

      // Thrust (W/S) - Moves in direction of camera
      if (k['KeyW']) { acc.x += fwd.x; acc.y += fwd.y; acc.z += fwd.z; }
      if (k['KeyS']) { acc.x -= fwd.x; acc.y -= fwd.y; acc.z -= fwd.z; }
      
      // Strafe (A/D) - Moves sideways
      if (k['KeyD']) { acc.x += right.x; acc.y += right.y; acc.z += right.z; }
      if (k['KeyA']) { acc.x -= right.x; acc.y -= right.y; acc.z -= right.z; }

      // Heave (Space/Ctrl) - Absolute Vertical
      if (k['Space']) { acc.y -= 1; } 
      if (k['ControlLeft']) { acc.y += 1; }

      // --- BANKING & ROLL LOGIC ---
      // Auto-bank into turns + Manual Roll
      let targetBank = 0;
      
      // Manual Roll (Q/E)
      if (k['KeyE']) targetBank += 1.0;
      if (k['KeyQ']) targetBank -= 1.0;

      // Auto Bank based on turning (Yaw delta) or Strafing
      // We simulate yaw delta by comparing target vs current
      const yawDelta = p.targetRot.yaw - p.rot.yaw;
      targetBank += yawDelta * 20.0; // Bank into turn
      if (k['KeyA']) targetBank += 0.2;
      if (k['KeyD']) targetBank -= 0.2;

      // Interpolate rotations for smooth feel
      p.rot.yaw += (p.targetRot.yaw - p.rot.yaw) * 0.1;
      p.rot.pitch += (p.targetRot.pitch - p.rot.pitch) * 0.1;
      p.rot.roll += (targetBank - p.rot.roll) * 0.05;

      // --- PHYSICS INTEGRATION ---
      p.vel.x += acc.x * thrustPower;
      p.vel.y += acc.y * thrustPower;
      p.vel.z += acc.z * thrustPower;

      // Apply Gravity/Drift
      p.vel.y += levelParams.physicsGravity || 0;

      // Friction
      p.vel.x *= friction;
      p.vel.y *= friction;
      p.vel.z *= friction;

      // Update Pos
      p.pos.x += p.vel.x;
      p.pos.y += p.vel.y;
      p.pos.z += p.vel.z;

      // Calc current speed factor for effects
      const speed = Math.sqrt(p.vel.x**2 + p.vel.y**2 + p.vel.z**2);
      p.speedFactor = speed;
      shakeRef.current = boost ? speed * 0.05 : 0;

      // Space Dust Logic (Recycle particles)
      world.current.particles.forEach(pt => {
          // Relative motion
          if (pt.z < p.pos.z - 100) pt.z += 2000;
          if (pt.z > p.pos.z + 2000) pt.z -= 2000;
      });

      // Target Hit Check
      const dx = p.pos.x - targetPos.current.x;
      const dy = p.pos.y - targetPos.current.y;
      const dz = p.pos.z - targetPos.current.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (dist < 300) handleTargetReached();
  };

  // 3D Projection with Full Rotation Matrix (Yaw -> Pitch -> Roll)
  const project = (v: Vector3, w: number, h: number): { x: number, y: number, scale: number, visible: boolean, zDepth: number } => {
      const p = player.current;
      
      // 1. Translate to Camera Space
      let x = v.x - p.pos.x;
      let y = v.y - p.pos.y;
      let z = v.z - p.pos.z;

      // 2. Rotate Yaw (Y-axis)
      const cy = Math.cos(-p.rot.yaw);
      const sy = Math.sin(-p.rot.yaw);
      let x1 = x * cy - z * sy;
      let z1 = x * sy + z * cy;
      let y1 = y;

      // 3. Rotate Pitch (X-axis)
      const cp = Math.cos(-p.rot.pitch);
      const sp = Math.sin(-p.rot.pitch);
      let y2 = y1 * cp - z1 * sp;
      let z2 = y1 * sp + z1 * cp;
      let x2 = x1;

      // 4. Rotate Roll (Z-axis)
      const cr = Math.cos(-p.rot.roll);
      const sr = Math.sin(-p.rot.roll);
      let x3 = x2 * cr - y2 * sr;
      let y3 = x2 * sr + y2 * cr;
      let z3 = z2;

      // Clip behind camera
      if (z3 <= 10) return { x: 0, y: 0, scale: 0, visible: false, zDepth: z3 };

      // Perspective Projection
      // Dynamic FOV based on speed
      const currentFOV = BASE_FOV + (p.speedFactor * 5);
      const scale = currentFOV / z3;
      
      // Screen Shake
      const shakeX = (Math.random() - 0.5) * shakeRef.current;
      const shakeY = (Math.random() - 0.5) * shakeRef.current;

      const px = w/2 + x3 * scale + shakeX;
      const py = h/2 + y3 * scale + shakeY;

      return { x: px, y: py, scale, visible: true, zDepth: z3 };
  };

  const renderScene = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      // Background & Fog
      ctx.fillStyle = levelParams.fogColor;
      ctx.fillRect(0, 0, w, h);

      // Draw Warp Stars / Space Dust
      ctx.fillStyle = '#fff';
      world.current.particles.forEach(pt => {
          const proj = project(pt, w, h);
          if (proj.visible) {
              // Stretch based on speed
              const size = proj.scale * 2;
              const len = Math.min(player.current.speedFactor * 2, 100) * proj.scale;
              
              // Angle from center to simulate warp tunnel
              const angle = Math.atan2(proj.y - h/2, proj.x - w/2);
              
              ctx.globalAlpha = Math.min(1, proj.scale);
              ctx.beginPath();
              ctx.moveTo(proj.x, proj.y);
              ctx.lineTo(proj.x + Math.cos(angle)*len, proj.y + Math.sin(angle)*len);
              ctx.lineWidth = size;
              ctx.strokeStyle = 'rgba(255,255,255,0.5)';
              ctx.stroke();
          }
      });
      ctx.globalAlpha = 1;

      // Sort Objects (Painter's Algorithm)
      const objects = world.current.cubes
        .map(cube => {
            // Calculate rough distance for sorting
            const d = (cube.x - player.current.pos.x)**2 + (cube.y - player.current.pos.y)**2 + (cube.z - player.current.pos.z)**2;
            return { ...cube, distSq: d };
        })
        .filter(c => c.distSq < RENDER_DISTANCE**2)
        .sort((a, b) => b.distSq - a.distSq);

      // Draw Objects
      objects.forEach(cube => {
          const style = levelParams.geometryStyle;
          if (style === 'PYRAMID') drawWirePyramid(ctx, cube, w, h);
          else if (style === 'OCTAHEDRON') drawWireOctahedron(ctx, cube, w, h);
          else drawWireCube(ctx, cube, w, h);
      });

      if (phase === 'FLYING') renderHUD(ctx, w, h);
  };

  const drawWireCube = (ctx: CanvasRenderingContext2D, cube: Cube, w: number, h: number) => {
      const hs = cube.size / 2;
      const verts = [
          { x: cube.x - hs, y: cube.y - hs, z: cube.z - hs },
          { x: cube.x + hs, y: cube.y - hs, z: cube.z - hs },
          { x: cube.x + hs, y: cube.y + hs, z: cube.z - hs },
          { x: cube.x - hs, y: cube.y + hs, z: cube.z - hs },
          { x: cube.x - hs, y: cube.y - hs, z: cube.z + hs },
          { x: cube.x + hs, y: cube.y - hs, z: cube.z + hs },
          { x: cube.x + hs, y: cube.y + hs, z: cube.z + hs },
          { x: cube.x - hs, y: cube.y + hs, z: cube.z + hs },
      ];
      const proj = verts.map(v => project(v, w, h));
      if (proj.some(p => !p.visible)) return;

      // Chromatic aberration intensity based on boost
      const boost = player.current.boost;
      
      if (boost) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = 'rgba(255,0,0,0.7)';
          ctx.beginPath();
          drawCubePath(ctx, proj.map(p => ({...p, x: p.x - 5})));
          ctx.stroke();

          ctx.strokeStyle = 'rgba(0,255,255,0.7)';
          ctx.beginPath();
          drawCubePath(ctx, proj.map(p => ({...p, x: p.x + 5})));
          ctx.stroke();
      }

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = cube.color;
      ctx.beginPath();
      drawCubePath(ctx, proj);
      ctx.stroke();
  };

  const drawCubePath = (ctx: CanvasRenderingContext2D, proj: {x:number, y:number}[]) => {
      const face = (a:number, b:number, c:number, d:number) => {
          ctx.moveTo(proj[a].x, proj[a].y);
          ctx.lineTo(proj[b].x, proj[b].y);
          ctx.lineTo(proj[c].x, proj[c].y);
          ctx.lineTo(proj[d].x, proj[d].y);
          ctx.lineTo(proj[a].x, proj[a].y);
      };
      face(0,1,2,3);
      face(4,5,6,7);
      ctx.moveTo(proj[0].x, proj[0].y); ctx.lineTo(proj[4].x, proj[4].y);
      ctx.moveTo(proj[1].x, proj[1].y); ctx.lineTo(proj[5].x, proj[5].y);
      ctx.moveTo(proj[2].x, proj[2].y); ctx.lineTo(proj[6].x, proj[6].y);
      ctx.moveTo(proj[3].x, proj[3].y); ctx.lineTo(proj[7].x, proj[7].y);
  };

  const drawWirePyramid = (ctx: CanvasRenderingContext2D, cube: Cube, w: number, h: number) => {
      const hs = cube.size / 2;
      const top = { x: cube.x, y: cube.y - hs, z: cube.z };
      const base = [
          { x: cube.x - hs, y: cube.y + hs, z: cube.z - hs },
          { x: cube.x + hs, y: cube.y + hs, z: cube.z - hs },
          { x: cube.x + hs, y: cube.y + hs, z: cube.z + hs },
          { x: cube.x - hs, y: cube.y + hs, z: cube.z + hs },
      ];
      const pTop = project(top, w, h);
      const pBase = base.map(v => project(v, w, h));
      if (!pTop.visible) return;

      ctx.strokeStyle = cube.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pBase[0].x, pBase[0].y);
      pBase.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pBase[0].x, pBase[0].y);
      pBase.forEach(p => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(pTop.x, pTop.y);
      });
      ctx.stroke();
  };

  const drawWireOctahedron = (ctx: CanvasRenderingContext2D, cube: Cube, w: number, h: number) => {
      const hs = cube.size / 2;
      const top = { x: cube.x, y: cube.y - hs, z: cube.z };
      const bot = { x: cube.x, y: cube.y + hs, z: cube.z };
      const mid = [
          { x: cube.x - hs, y: cube.y, z: cube.z },
          { x: cube.x, y: cube.y, z: cube.z - hs },
          { x: cube.x + hs, y: cube.y, z: cube.z },
          { x: cube.x, y: cube.y, z: cube.z + hs },
      ];
      const pTop = project(top, w, h);
      const pBot = project(bot, w, h);
      const pMid = mid.map(v => project(v, w, h));
      if (!pTop.visible) return;

      ctx.strokeStyle = cube.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pMid[0].x, pMid[0].y);
      pMid.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pMid[0].x, pMid[0].y);
      pMid.forEach(p => {
          ctx.moveTo(p.x, p.y); ctx.lineTo(pTop.x, pTop.y);
          ctx.moveTo(p.x, p.y); ctx.lineTo(pBot.x, pBot.y);
      });
      ctx.stroke();
  };

  const renderHUD = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const cx = w/2;
      const cy = h/2;

      // Artificial Horizon / Center
      ctx.strokeStyle = levelParams.targetColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI*2);
      
      // Bank Indicator (Lines that rotate opposite to player roll to stay level)
      const roll = player.current.rot.roll;
      const r1x = cx + Math.cos(-roll) * 30;
      const r1y = cy + Math.sin(-roll) * 30;
      const r2x = cx + Math.cos(-roll + Math.PI) * 30;
      const r2y = cy + Math.sin(-roll + Math.PI) * 30;
      
      ctx.moveTo(r1x, r1y); ctx.lineTo(r1x + Math.cos(-roll)*10, r1y + Math.sin(-roll)*10);
      ctx.moveTo(r2x, r2y); ctx.lineTo(r2x - Math.cos(-roll)*10, r2y - Math.sin(-roll)*10);
      ctx.stroke();

      // Speed Bar
      const speedPct = Math.min(player.current.speedFactor / 10, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 100, h - 60, 200, 4);
      ctx.fillStyle = player.current.boost ? '#0ff' : '#d4af37';
      ctx.fillRect(cx - 100, h - 60, 200 * speedPct, 4);

      if (!pointerLocked) {
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(0, 0, w, h);
          
          ctx.fillStyle = '#d4af37';
          ctx.font = '30px Cinzel Decorative';
          ctx.textAlign = 'center';
          ctx.fillText("SYSTEM IDLE", cx, cy - 30);
          
          ctx.font = '14px JetBrains Mono';
          ctx.fillStyle = '#fff';
          ctx.fillText("CLICK TO ENGAGE FLIGHT SYSTEMS", cx, cy + 30);
      } else {
          ctx.fillStyle = levelParams.targetColor;
          ctx.font = '14px JetBrains Mono';
          ctx.textAlign = 'left';
          ctx.fillText(`SECTOR: ${levelParams.themeName.toUpperCase()}`, 20, h - 30);
          
          // Controls Hint
          ctx.textAlign = 'right';
          ctx.font = '10px JetBrains Mono';
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          ctx.fillText("Q/E: ROLL | SHIFT: BOOST | WASD: THRUST", w - 20, h - 30);
      }
  };

  const handleTargetReached = () => {
      if (document.pointerLockElement) document.exitPointerLock();
      setPhase('TEACHING');
  };

  const handlePhilosophySubmit = async () => {
      if (!userPhilosophy.trim()) return;
      setLoading(true);
      setPhase('WARPING'); 
      
      try {
          const nextParams = await generateLevelData(userPhilosophy, symbols[level % symbols.length].name);
          setTimeout(() => {
              setLevelParams(nextParams);
              setLevel(l => l + 1);
              setTeaching(null);
              setUserPhilosophy('');
              setPhase('FLYING');
              setLoading(false);
          }, 2500);
      } catch (e) {
          setPhase('FLYING'); 
          setLoading(false);
      }
  };

  return (
    <div className="absolute inset-0 bg-black z-50 flex flex-col overflow-hidden font-tech">
        <canvas 
            ref={canvasRef} 
            className="w-full h-full block bg-black"
            onClick={requestCapture}
        />

        {phase === 'TEACHING' && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in">
                <div className="max-w-2xl w-full bg-[#0a0a0a] border border-[#d4af37] p-12 shadow-[0_0_50px_rgba(212,175,55,0.2)]">
                    <div className="text-center mb-8">
                        <Zap className="w-12 h-12 text-[#d4af37] mx-auto mb-4" />
                        <h2 className="text-3xl font-mystic text-[#e4e4e7]">MONOLITH ACCESSED</h2>
                        <p className="text-[#d4af37] mt-2 font-tech uppercase tracking-widest">
                            Symbol: {symbols[level % symbols.length].name}
                        </p>
                    </div>
                    
                    <div className="mb-8 text-center">
                        <p className="font-serif text-zinc-300 text-lg mb-4 italic">
                            "Define the meaning of this symbol to construct the next sector."
                        </p>
                        
                        <textarea 
                            value={userPhilosophy}
                            onChange={(e) => setUserPhilosophy(e.target.value)}
                            placeholder="e.g. 'The void is not empty, but full of potential...'"
                            className="w-full bg-[#111] border border-[#d4af37]/30 p-4 text-[#e4e4e7] font-serif focus:border-[#d4af37] outline-none min-h-[120px] resize-none"
                        />
                    </div>

                    <button 
                        onClick={handlePhilosophySubmit}
                        disabled={loading || !userPhilosophy.trim()}
                        className="w-full bg-[#d4af37] text-black font-tech font-bold uppercase py-4 hover:bg-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? (
                             <span className="animate-pulse">GENERATING REALITY...</span>
                        ) : (
                            <>INITIATE WARP JUMP <Send size={16}/></>
                        )}
                    </button>
                </div>
            </div>
        )}
        
        <button 
            onClick={onExit}
            className="absolute top-4 left-4 z-50 text-zinc-500 hover:text-white px-4 py-2 text-xs uppercase border border-transparent hover:border-zinc-500 transition-colors"
        >
            Abort Simulation
        </button>
    </div>
  );
};

export default ShadowJourney;