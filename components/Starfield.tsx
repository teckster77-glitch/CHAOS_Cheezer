import React, { useEffect, useRef, useState } from 'react';

interface Star {
  ra: number;   // Right Ascension (0-24h)
  dec: number;  // Declination (-90 to +90 deg)
  mag: number;  // Magnitude (brightness, lower is brighter)
  color: string;
  name?: string; // Proper name
}

interface ConstellationLine {
  fromIndex: number;
  toIndex: number;
}

interface ConstellationLabel {
  name: string;
  ra: number;
  dec: number;
}

// --- ASTRONOMICAL DATA KERNEL ---

// Major Stars for Constellations
const MAJOR_STARS: Star[] = [
  // Ursa Major (Big Dipper)
  { ra: 11.06, dec: 61.75, mag: 1.8, color: '#ffeeb0', name: 'Dubhe' },
  { ra: 11.03, dec: 56.38, mag: 2.4, color: '#f8f7ff', name: 'Merak' },
  { ra: 11.89, dec: 53.69, mag: 2.4, color: '#f8f7ff', name: 'Phecda' },
  { ra: 12.25, dec: 57.03, mag: 3.3, color: '#ffffff', name: 'Megrez' },
  { ra: 12.90, dec: 55.95, mag: 1.8, color: '#ffffff', name: 'Alioth' },
  { ra: 13.39, dec: 54.92, mag: 2.2, color: '#ffffff', name: 'Mizar' },
  { ra: 13.79, dec: 49.31, mag: 1.9, color: '#9bb0ff', name: 'Alkaid' },

  // Orion
  { ra: 5.92, dec: 7.40, mag: 0.42, color: '#ffcc6f', name: 'Betelgeuse' },
  { ra: 5.24, dec: -8.20, mag: 0.12, color: '#9bb0ff', name: 'Rigel' },
  { ra: 5.41, dec: 6.34, mag: 1.64, color: '#b0cfff', name: 'Bellatrix' },
  { ra: 5.53, dec: -0.30, mag: 2.25, color: '#f8f7ff' }, // Mintaka
  { ra: 5.60, dec: -1.20, mag: 1.69, color: '#f8f7ff', name: 'Alnilam' },
  { ra: 5.67, dec: -1.94, mag: 1.74, color: '#f8f7ff', name: 'Alnitak' },
  { ra: 5.79, dec: -9.66, mag: 2.07, color: '#b0cfff', name: 'Saiph' },

  // Cassiopeia
  { ra: 0.67, dec: 56.53, mag: 2.24, color: '#ffddaa', name: 'Schedar' },
  { ra: 0.15, dec: 59.15, mag: 2.28, color: '#f8f7ff', name: 'Caph' },
  { ra: 0.94, dec: 60.71, mag: 2.15, color: '#9bb0ff', name: 'Navi' },
  { ra: 1.43, dec: 60.23, mag: 2.68, color: '#f8f7ff', name: 'Ruchbah' },
  { ra: 1.90, dec: 63.67, mag: 3.35, color: '#f8f7ff', name: 'Segin' },

  // Cygnus
  { ra: 20.69, dec: 45.28, mag: 1.25, color: '#f8f7ff', name: 'Deneb' },
  { ra: 20.38, dec: 40.25, mag: 2.23, color: '#fbffb0', name: 'Sadr' },
  { ra: 19.51, dec: 27.96, mag: 3.05, color: '#ffddaa', name: 'Albireo' }, // Famous double, visually gold/blue
  { ra: 21.21, dec: 30.22, mag: 3.21, color: '#f8f7ff', name: 'Gienah' },
  { ra: 19.76, dec: 45.13, mag: 2.86, color: '#f8f7ff' },

  // Canis Major
  { ra: 6.75, dec: -16.71, mag: -1.46, color: '#9bb0ff', name: 'Sirius' }, // Brightest star

  // Lyra
  { ra: 18.62, dec: 38.78, mag: 0.03, color: '#b0cfff', name: 'Vega' },

  // Scorpius
  { ra: 16.49, dec: -26.43, mag: 1.06, color: '#ff9e40', name: 'Antares' },

  // Taurus
  { ra: 4.60, dec: 16.50, mag: 0.87, color: '#ffbe7f', name: 'Aldebaran' },
  { ra: 3.79, dec: 24.10, mag: 2.8, color: '#9bb0ff', name: 'Alcyone' }, // Pleiades brightest
];

// Procedural Background Generation (Milky Way Approximation)
// We generate a band of stars. Galactic plane is roughly inclined ~60deg to celestial equator.
const generateBackgroundStars = (count: number): Star[] => {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    // Uniform sphere distribution
    const ra = Math.random() * 24;
    const decRad = Math.asin(2 * Math.random() - 1);
    const dec = decRad * (180 / Math.PI);

    // Galactic Plane Bias (Simplified check)
    // This is a hacky approximation of the Milky Way band for visual effect
    // The Milky Way runs roughly through Cassiopeia, Cygnus, Aquila, Scorpius, Sagittarius, Crux, Orion, Gemini, Auriga.
    // High density around RA 18h, Dec -30 (Galactic Center) and RA 6h, Dec +30.
    
    let densityProb = 0.1; // Base density
    
    // Visual approximation of galactic band in RA/Dec
    // Band 1: RA 17-20, Dec -40 to +40
    if ((ra > 17 && ra < 21)) densityProb += 0.6;
    // Band 2: RA 4-7, Dec -10 to +50
    if ((ra > 4 && ra < 8)) densityProb += 0.4;
    
    // Random culling to create texture
    if (Math.random() > densityProb) {
       // If rejected, we might still keep it as a sparse star elsewhere
       if (Math.random() > 0.05) {
         i--; // Retry
         continue; 
       }
    }

    // Spectral Colors
    const r = Math.random();
    let color = '#ffffff';
    if (r > 0.90) color = '#9bb0ff'; // O/B Class (Blue)
    else if (r > 0.75) color = '#b0cfff'; // A Class (White-Blue)
    else if (r > 0.60) color = '#f8f7ff'; // F Class (White)
    else if (r > 0.45) color = '#fff4ea'; // G Class (Yellow-White)
    else if (r > 0.30) color = '#ffeeb0'; // K Class (Orange)
    else color = '#ffcc6f'; // M Class (Red)

    stars.push({
      ra,
      dec,
      mag: 3.5 + Math.random() * 4.5, // Faint background stars
      color
    });
  }
  return stars;
};

const CONSTELLATIONS: ConstellationLine[] = [
  // Ursa Major
  { fromIndex: 0, toIndex: 1 }, { fromIndex: 1, toIndex: 2 }, { fromIndex: 2, toIndex: 3 },
  { fromIndex: 3, toIndex: 0 }, { fromIndex: 3, toIndex: 4 }, { fromIndex: 4, toIndex: 5 }, { fromIndex: 5, toIndex: 6 },
  // Orion
  { fromIndex: 7, toIndex: 9 }, { fromIndex: 9, toIndex: 10 }, { fromIndex: 10, toIndex: 11 },
  { fromIndex: 11, toIndex: 12 }, { fromIndex: 12, toIndex: 13 }, { fromIndex: 13, toIndex: 8 },
  { fromIndex: 8, toIndex: 12 }, { fromIndex: 7, toIndex: 12 },
  // Cassiopeia
  { fromIndex: 14, toIndex: 15 }, { fromIndex: 15, toIndex: 16 }, { fromIndex: 16, toIndex: 17 }, { fromIndex: 17, toIndex: 18 },
  // Cygnus
  { fromIndex: 19, toIndex: 20 }, { fromIndex: 20, toIndex: 21 }, { fromIndex: 22, toIndex: 20 }, { fromIndex: 20, toIndex: 23 },
];

const LABELS: ConstellationLabel[] = [
  { name: 'URSA MAJOR', ra: 12.5, dec: 55 },
  { name: 'ORION', ra: 5.5, dec: 0 },
  { name: 'CASSIOPEIA', ra: 1.0, dec: 60 },
  { name: 'CYGNUS', ra: 20.5, dec: 42 },
  { name: 'LYRA', ra: 18.6, dec: 36 },
  { name: 'SCORPIUS', ra: 16.5, dec: -26 },
  { name: 'TAURUS', ra: 4.5, dec: 18 },
  { name: 'CANIS MAJOR', ra: 6.8, dec: -20 },
];

// Combine Data
const FULL_CATALOG = [...MAJOR_STARS, ...generateBackgroundStars(3500)];

interface Star3D {
  x: number; y: number; z: number;
  baseX: number; baseY: number; baseZ: number;
  mag: number;
  color: string;
  name?: string;
  index: number;
}

interface StarfieldProps {
  active: boolean;
}

const Starfield: React.FC<StarfieldProps> = ({ active }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star3D[]>([]);
  
  // Physics State
  const rotationRef = useRef({ x: -0.2, y: 0 }); // Current rotation
  const velocityRef = useRef({ x: 0, y: 0.0001 }); // Rotational velocity
  const zoomRef = useRef(1000); // FOV / Zoom level
  
  // Interaction State
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);

  // --- INITIALIZATION ---
  useEffect(() => {
    const radius = 2000; // Large celestial sphere
    
    // Sidereal Time Offset (Simulated)
    const now = new Date();
    const timeOffset = (now.getHours() * 15 + now.getMinutes() * 0.25) * (Math.PI / 180);

    starsRef.current = FULL_CATALOG.map((star, i) => {
      const alpha = (star.ra / 24) * Math.PI * 2 + timeOffset;
      const delta = (star.dec / 180) * Math.PI;

      const x = radius * Math.cos(delta) * Math.cos(alpha);
      const z = radius * Math.cos(delta) * Math.sin(alpha);
      const y = radius * Math.sin(delta);

      return {
        x, y, z,
        baseX: x, baseY: y, baseZ: z,
        mag: star.mag,
        color: star.color,
        name: star.name,
        index: i
      };
    });
  }, []);

  // --- INTERACTION HANDLERS ---
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!active) return;
      isDragging.current = true;
      lastMouse.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = { x: 0, y: 0 }; // Stop auto-rotation on grab
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!active || !isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      
      // Direct manipulation
      rotationRef.current.y += dx * 0.003;
      rotationRef.current.x += dy * 0.003;

      // Store velocity for inertia throw
      velocityRef.current = { x: dy * 0.003, y: dx * 0.003 };
      
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      if (!active) return;
      e.preventDefault();
      // Zoom Logic
      const zoomSpeed = 1.5;
      const delta = e.deltaY * -zoomSpeed;
      zoomRef.current = Math.max(400, Math.min(4000, zoomRef.current + delta));
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [active]);

  // --- RENDER LOOP ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false }); // Optimize
    if (!ctx) return;

    let animationId: number;

    const render = (time: number) => {
      // Delta time for smooth physics
      const dt = lastTime.current ? Math.min((time - lastTime.current) / 16.67, 2) : 1;
      lastTime.current = time;

      // Resize
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
      }
      
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Clear Background (Deep Space)
      ctx.fillStyle = '#030303';
      ctx.fillRect(0, 0, w, h);

      // Physics & Rotation
      if (!isDragging.current) {
          // Apply Inertia Friction
          if (active) {
              velocityRef.current.x *= 0.95;
              velocityRef.current.y *= 0.95;
              // Minimum drift
              if (Math.abs(velocityRef.current.x) < 0.00001 && Math.abs(velocityRef.current.y) < 0.00001) {
                   // Subtle drift when idle
                   velocityRef.current.y = 0.0001; 
              }
          } else {
               // Auto rotate when background
               velocityRef.current.y = 0.0002; 
               velocityRef.current.x = 0;
               
               // Auto reset zoom
               zoomRef.current += (1000 - zoomRef.current) * 0.05;
          }
          rotationRef.current.x += velocityRef.current.x * dt;
          rotationRef.current.y += velocityRef.current.y * dt;
      }

      // Clamp vertical rotation (Pitch) to avoid flipping completely
      // rotationRef.current.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationRef.current.x));

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);

      // Pre-calculate Projection
      const fov = zoomRef.current;
      
      interface ProjectedPoint { x: number; y: number; z: number; scale: number; visible: boolean; }
      
      // Project a 3D point function
      const project = (x: number, y: number, z: number): ProjectedPoint => {
         // Rotate Y
         let x1 = x * cosY - z * sinY;
         let z1 = x * sinY + z * cosY;
         // Rotate X
         let y2 = y * cosX - z1 * sinX;
         let z2 = y * sinX + z1 * cosX;
         
         if (z2 > -fov + 50) {
             const scale = fov / (fov + z2);
             return { x: cx + x1 * scale, y: cy + y2 * scale, z: z2, scale, visible: true };
         }
         return { x: 0, y: 0, z: 0, scale: 0, visible: false };
      };

      // --- DRAW CELESTIAL GRID (If Active) ---
      if (active) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          
          // Latitude Lines (Declination)
          for(let lat = -80; lat <= 80; lat += 20) {
             const r = 2000 * Math.cos(lat * Math.PI/180);
             const y = 2000 * Math.sin(lat * Math.PI/180);
             let first = true;
             for(let lon = 0; lon <= 360; lon += 10) {
                 const rad = lon * Math.PI/180;
                 const x = r * Math.cos(rad);
                 const z = r * Math.sin(rad);
                 const p = project(x, y, z);
                 if (p.visible) {
                     if (first) { ctx.moveTo(p.x, p.y); first = false; }
                     else ctx.lineTo(p.x, p.y);
                 } else {
                     first = true;
                 }
             }
          }
          // Longitude Lines (RA) - Simplified
          for(let lon = 0; lon < 360; lon += 30) {
             const rad = lon * Math.PI/180;
             let first = true;
             for(let lat = -90; lat <= 90; lat += 10) {
                 const latRad = lat * Math.PI/180;
                 const r = 2000 * Math.cos(latRad);
                 const y = 2000 * Math.sin(latRad);
                 const x = r * Math.cos(rad);
                 const z = r * Math.sin(rad);
                 const p = project(x, y, z);
                 if (p.visible) {
                     if(first) { ctx.moveTo(p.x, p.y); first = false; }
                     else ctx.lineTo(p.x, p.y);
                 } else {
                     first = true;
                 }
             }
          }
          ctx.stroke();
      }

      // --- DRAW CONSTELLATION LINES ---
      // We only project stars needed for lines first? No, we need all stars projected for sorting ideally.
      // Optimization: Project all stars first.
      const pStars = starsRef.current.map(s => {
          const p = project(s.baseX, s.baseY, s.baseZ);
          return { ...s, px: p.x, py: p.y, scale: p.scale, visible: p.visible, z: p.z };
      });

      if (active) {
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          CONSTELLATIONS.forEach(line => {
              const s1 = pStars[line.fromIndex];
              const s2 = pStars[line.toIndex];
              if (s1.visible && s2.visible) {
                  ctx.moveTo(s1.px, s1.py);
                  ctx.lineTo(s2.px, s2.py);
              }
          });
          ctx.stroke();

          // Draw Labels
          ctx.fillStyle = 'rgba(212, 175, 55, 0.8)';
          ctx.font = '12px JetBrains Mono';
          ctx.textAlign = 'center';
          
          const radius = 2000;
          // Time offset must match star gen
          const now = new Date();
          const timeOffset = (now.getHours() * 15 + now.getMinutes() * 0.25) * (Math.PI / 180);

          LABELS.forEach(lbl => {
              const alpha = (lbl.ra / 24) * Math.PI * 2 + timeOffset;
              const delta = (lbl.dec / 180) * Math.PI;
              const x = radius * Math.cos(delta) * Math.cos(alpha);
              const z = radius * Math.cos(delta) * Math.sin(alpha);
              const y = radius * Math.sin(delta);
              const p = project(x, y, z);
              if (p.visible) {
                  ctx.fillText(lbl.name, p.x, p.y - 10);
              }
          });
      }

      // --- DRAW STARS ---
      // No z-sort needed for simple points usually, but for glow effect drawing brightest last helps?
      // Actually, largest stars should be drawn on top.
      // Let's just iterate.

      for(let i = 0; i < pStars.length; i++) {
          const s = pStars[i];
          if (!s.visible) continue;

          // Brightness calculation
          const twinkle = 0.8 + Math.sin(time * 0.005 + s.index) * 0.2;
          // Mag -1 (Sirius) -> Scale huge. Mag 6 -> Scale tiny.
          // Invert Magnitude: Brighter stars have lower mag.
          // Base size
          let size = (3 - s.mag * 0.4) * s.scale * twinkle;
          if (s.mag < 1) size *= 2; // Boost bright stars
          if (size < 0.5) size = 0.5;

          // Draw Glow for bright stars
          if (s.mag < 2.5) {
              const glowSize = size * 4;
              const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, glowSize);
              grad.addColorStop(0, s.color);
              grad.addColorStop(1, 'transparent');
              ctx.fillStyle = grad;
              ctx.globalAlpha = 0.4 * twinkle;
              ctx.beginPath();
              ctx.arc(s.px, s.py, glowSize, 0, Math.PI*2);
              ctx.fill();
          }

          // Draw Core
          ctx.fillStyle = s.color;
          ctx.globalAlpha = active ? 1 : Math.min(1, (1 / (1 + s.mag * 0.5)) * twinkle); 
          
          ctx.beginPath();
          ctx.arc(s.px, s.py, size, 0, Math.PI*2);
          ctx.fill();
          
          // Draw Name if active and very bright
          if (active && s.name && s.mag < 2.0) {
              ctx.fillStyle = '#ffffff';
              ctx.globalAlpha = 0.7;
              ctx.font = '10px Sans-Serif';
              ctx.fillText(s.name, s.px + 8, s.py + 3);
          }
      }
      ctx.globalAlpha = 1;

      // --- HUD ---
      if (active) {
          // Reticle
          ctx.strokeStyle = '#d4af37';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
          ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
          ctx.stroke();
          ctx.setLineDash([]);

          // Data Block
          ctx.fillStyle = 'rgba(10, 10, 10, 0.8)';
          ctx.strokeStyle = '#d4af37';
          ctx.fillRect(20, h - 100, 200, 80);
          ctx.strokeRect(20, h - 100, 200, 80);
          
          ctx.fillStyle = '#d4af37';
          ctx.font = '12px JetBrains Mono';
          ctx.textAlign = 'left';
          
          // Normalize angles for display
          let raDisp = (ry % (Math.PI*2));
          if (raDisp < 0) raDisp += Math.PI*2;
          const raHours = (raDisp / (Math.PI*2)) * 24;
          
          const decDeg = (rx / Math.PI) * 180;

          ctx.fillText(`RA:  ${Math.floor(raHours)}h ${Math.floor((raHours%1)*60)}m`, 35, h - 75);
          ctx.fillText(`DEC: ${decDeg.toFixed(2)}°`, 35, h - 55);
          ctx.fillText(`FOV: ${(fov/10).toFixed(1)}mm`, 35, h - 35);
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [active]);

  return (
    <canvas 
        ref={canvasRef} 
        className={`fixed inset-0 z-0 transition-all duration-700 ${active ? 'cursor-move brightness-100 scale-100' : 'cursor-default pointer-events-none brightness-75 scale-105'}`}
    />
  );
};

export default Starfield;
