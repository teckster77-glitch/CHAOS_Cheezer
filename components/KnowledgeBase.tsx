import React, { useState } from 'react';
import { explainSymbol } from '../services/gemini';
import { SymbolInfo } from '../types';
import { Eye, Hexagon, Triangle, Zap, Globe, Star, X, Gamepad2 } from 'lucide-react';
import ShadowJourney from './ShadowJourney';

const symbols: SymbolInfo[] = [
  { id: 'chaos-star', name: 'The Chaosphere', shortDesc: 'Infinite Possibility', svgIcon: <Star /> },
  { id: 'kia', name: 'Kia / The Void', shortDesc: 'Formless Consciousness', svgIcon: <Eye /> },
  { id: 'servitor', name: 'Servitor', shortDesc: 'Thought Form Construct', svgIcon: <Zap /> },
  { id: 'egregore', name: 'Egregore', shortDesc: 'Collective Mind', svgIcon: <Globe /> },
  { id: 'gnosis', name: 'Gnosis', shortDesc: 'Altered State', svgIcon: <Triangle /> },
  { id: 'paradigm-shift', name: 'Paradigm Shift', shortDesc: 'Belief Fluidity', svgIcon: <Hexagon /> }
];

const KnowledgeBase: React.FC = () => {
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gameMode, setGameMode] = useState(false);

  const handleSelect = async (symbol: SymbolInfo) => {
    setActiveSymbol(symbol.id);
    setExplanation(null);
    setLoading(true);
    try {
      const text = await explainSymbol(symbol.name);
      setExplanation(text);
    } catch (e) {
      setExplanation("Data corrupt. The void is silent.");
    } finally {
      setLoading(false);
    }
  };

  if (gameMode) {
      return <ShadowJourney symbols={symbols} onExit={() => setGameMode(false)} />;
  }

  return (
    <div className="animate-fade-in relative">
      <div className="text-center mb-16">
          <h2 className="text-5xl font-mystic text-[#d4af37] mb-2">ARCHIVE OF SHADOWS</h2>
          <div className="font-tech text-xs text-zinc-500 tracking-[0.3em] uppercase mb-8">Select a glyph to decrypt</div>
          
          {/* Game Toggle */}
          <button 
             onClick={() => setGameMode(true)}
             className="group relative inline-flex items-center gap-3 px-8 py-4 bg-[#0a0a0a] border border-[#d4af37]/50 overflow-hidden hover:border-[#d4af37] transition-colors"
          >
              <div className="absolute inset-0 bg-[#d4af37]/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
              <Gamepad2 className="w-5 h-5 text-[#d4af37]" />
              <span className="font-tech text-xs text-[#d4af37] uppercase tracking-widest font-bold relative z-10">
                  Enter The Path (Interactive)
              </span>
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {symbols.map((s) => (
          <button
            key={s.id}
            onClick={() => handleSelect(s)}
            className={`group relative h-48 bg-[#0a0a0a] border border-[#d4af37]/20 hover:border-[#d4af37] transition-all duration-500 flex flex-col items-center justify-center overflow-hidden ${activeSymbol === s.id ? 'border-[#d4af37] bg-[#d4af37]/10' : ''}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className={`mb-4 text-[#d4af37] transition-transform duration-500 group-hover:scale-110 ${activeSymbol === s.id ? 'scale-110' : ''}`}>
                {React.cloneElement(s.svgIcon as React.ReactElement<any>, { size: 40, strokeWidth: 1 })}
            </div>
            
            <h3 className="font-mystic text-xl text-[#e4e4e7] relative z-10">{s.name}</h3>
            <p className="font-tech text-[10px] text-[#d4af37]/60 uppercase mt-2 tracking-wider opacity-60 group-hover:opacity-100 transition-opacity">
                {s.shortDesc}
            </p>

            {/* Corner decorations */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#d4af37]/30"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#d4af37]/30"></div>
          </button>
        ))}
      </div>

      {/* Modal Overlay for details */}
      {activeSymbol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-[#0f0f0f] border border-[#d4af37] max-w-2xl w-full relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                  <button 
                    onClick={() => setActiveSymbol(null)}
                    className="absolute top-0 right-0 p-4 text-[#d4af37] hover:text-white transition-colors"
                  >
                      <X />
                  </button>

                  <div className="p-12 text-center">
                      <div className="mb-6 text-[#d4af37] flex justify-center">
                         {React.cloneElement(symbols.find(s => s.id === activeSymbol)?.svgIcon as React.ReactElement<any>, { size: 64, strokeWidth: 0.5 })}
                      </div>
                      
                      <h2 className="text-4xl font-mystic text-[#e4e4e7] mb-8">{symbols.find(s => s.id === activeSymbol)?.name}</h2>
                      
                      {loading ? (
                          <div className="font-tech text-[#d4af37] animate-pulse text-sm">DECRYPTING ARCHIVE...</div>
                      ) : (
                          <div className="prose prose-invert prose-lg mx-auto font-serif leading-loose text-zinc-300">
                              {explanation}
                          </div>
                      )}
                  </div>
                  
                  {/* Tech footer on modal */}
                  <div className="bg-[#050505] border-t border-[#d4af37]/20 p-2 flex justify-between items-center px-4">
                      <span className="font-tech text-[10px] text-[#d4af37]/40">REF: {activeSymbol.toUpperCase()}</span>
                      <span className="font-tech text-[10px] text-[#d4af37]/40">SECURE//NO_LOGS</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default KnowledgeBase;