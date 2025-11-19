import React, { useState, useRef } from 'react';
import { generateSigil } from '../services/gemini';
import { SigilResult } from '../types';
import { Sparkles, RefreshCw, Copy, ImagePlus, X, PenTool, Maximize2, Minimize2 } from 'lucide-react';

const SigilCrafter: React.FC = () => {
  const [intent, setIntent] = useState('');
  const [style, setStyle] = useState('geometric');
  const [strokeWidth, setStrokeWidth] = useState('medium');
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SigilResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStyleImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setStyleImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateSigil(intent, style, strokeWidth, styleImage || undefined);
      setResult(data);
    } catch (err) {
      setError("The ether is turbulent. Connection lost.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-mystic text-[#d4af37] mb-2 tracking-widest">SIGIL ENGINE</h2>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto mb-4"></div>
        <p className="font-tech text-[#d4af37]/60 text-xs uppercase tracking-[0.2em]">
          Subconscious Programming Interface // A.O. Spare Algorithm
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Panel: Controls */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCraft} className="bg-[#0a0a0a] border border-[#d4af37]/30 p-6 relative group overflow-hidden">
             {/* Corner Accents */}
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4af37]"></div>
             <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#d4af37]"></div>
             <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#d4af37]"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4af37]"></div>

             <label className="block font-tech text-xs text-[#d4af37] mb-2 uppercase">Statement of Intent</label>
             <input
                type="text"
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="I AM..."
                className="w-full bg-[#111] border-b border-[#d4af37]/50 text-[#e4e4e7] p-3 focus:outline-none focus:border-[#d4af37] focus:bg-[#1a1a1a] transition-all font-serif text-xl italic placeholder-zinc-700 mb-8"
                disabled={loading}
             />

             <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label className="block font-tech text-[10px] text-[#d4af37]/70 mb-2 uppercase">Geometry</label>
                    <div className="flex flex-col gap-1">
                        {['geometric', 'organic', 'abstract'].map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStyle(s)}
                                className={`px-3 py-2 text-left text-xs font-tech uppercase border-l-2 transition-all ${style === s ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block font-tech text-[10px] text-[#d4af37]/70 mb-2 uppercase">Line Weight</label>
                    <div className="flex flex-col gap-1">
                        {['thin', 'medium', 'thick'].map(w => (
                            <button
                                key={w}
                                type="button"
                                onClick={() => setStrokeWidth(w)}
                                className={`px-3 py-2 text-left text-xs font-tech uppercase border-l-2 transition-all ${strokeWidth === w ? 'border-[#d4af37] text-[#d4af37] bg-[#d4af37]/10' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'}`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>
             </div>

             <div className="mb-8">
                 <label className="block font-tech text-[10px] text-[#d4af37]/70 mb-2 uppercase">Visual Resonance (Optional)</label>
                 {!styleImage ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-3 border border-dashed border-zinc-700 hover:border-[#d4af37] text-zinc-500 hover:text-[#d4af37] transition-colors flex items-center justify-center gap-2 text-xs font-tech uppercase"
                    >
                        <ImagePlus className="w-4 h-4" /> Load Style Data
                    </button>
                 ) : (
                     <div className="relative w-full h-16 bg-[#111] border border-[#d4af37]/30 flex items-center px-4">
                         <img src={styleImage} className="h-12 w-12 object-cover border border-zinc-700" alt="ref" />
                         <span className="ml-3 font-tech text-xs text-[#d4af37]">REF_IMG_LOADED</span>
                         <button onClick={removeImage} className="absolute right-2 text-red-500 hover:text-red-400"><X className="w-4 h-4"/></button>
                     </div>
                 )}
                 <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
             </div>

             <button
                type="submit"
                disabled={loading || !intent.trim()}
                className="w-full bg-[#d4af37] hover:bg-[#b5952f] text-black font-tech font-bold uppercase py-4 tracking-widest transition-all disabled:opacity-50 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
             >
                 {loading ? "Computing..." : "Execute Ritual"}
             </button>
          </form>
        </div>

        {/* Right Panel: Output */}
        <div className="lg:col-span-7 relative">
           <div className="h-full min-h-[500px] bg-[#080808] border border-[#d4af37]/20 relative flex flex-col items-center justify-center p-8">
              {/* Decorative Overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(45deg,transparent_25%,rgba(212,175,55,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]"></div>
              <div className="absolute top-4 left-4 font-tech text-[10px] text-[#d4af37]/40">OUTPUT_DISPLAY</div>
              
              {!result ? (
                  <div className="text-center text-[#d4af37]/20">
                      <div className="w-32 h-32 border border-[#d4af37]/10 rounded-full mx-auto mb-4 animate-[spin_10s_linear_infinite] flex items-center justify-center">
                          <div className="w-24 h-24 border border-[#d4af37]/10 rotate-45"></div>
                      </div>
                      <p className="font-mystic tracking-widest">Awaiting Input</p>
                  </div>
              ) : (
                  <div className="w-full flex flex-col items-center animate-fade-in relative z-10">
                      <div className="relative group">
                          <div className="absolute inset-0 bg-[#d4af37]/10 blur-3xl rounded-full"></div>
                          <div 
                            className="w-64 h-64 md:w-80 md:h-80 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)] transition-all duration-700"
                            dangerouslySetInnerHTML={{ __html: result.svg.replace('<svg', '<svg class="w-full h-full"') }}
                          />
                      </div>
                      
                      <div className="mt-12 w-full border-t border-[#d4af37]/20 pt-6">
                          <div className="flex justify-between items-end mb-4">
                              <div>
                                  <h3 className="text-2xl font-mystic text-[#d4af37]">{result.mantra}</h3>
                                  <p className="text-xs font-tech text-zinc-500 uppercase">Phonetic Key</p>
                              </div>
                              <button 
                                onClick={() => {
                                    const blob = new Blob([result.svg], { type: 'image/svg+xml' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = 'sigil.svg';
                                    a.click();
                                }}
                                className="text-[#d4af37] hover:text-white font-tech text-xs uppercase flex items-center gap-2"
                              >
                                  <Copy className="w-3 h-3" /> Save Vector
                              </button>
                          </div>
                          <p className="text-zinc-400 font-serif text-lg italic leading-relaxed">
                              "{result.explanation}"
                          </p>
                      </div>
                  </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default SigilCrafter;