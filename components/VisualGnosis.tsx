import React, { useState, useRef } from 'react';
import { generateMysticalImage, transmuteImage, scryImage } from '../services/gemini';
import { Sparkles, Wand2, Eye, Upload, RefreshCcw, AlertCircle, ChevronRight } from 'lucide-react';

type Mode = 'MANIFEST' | 'TRANSMUTE' | 'SCRY';

const VisualGnosis: React.FC = () => {
  const [mode, setMode] = useState<Mode>('MANIFEST');
  const [textInput, setTextInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setSelectedImage(base64String);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAction = async () => {
    setLoading(true);
    setError(null);
    setResultImage(null);
    setAnalysisResult(null);

    try {
      if (mode === 'MANIFEST') {
        if (!textInput.trim()) return;
        const img = await generateMysticalImage(textInput);
        setResultImage(img);
      } else if (mode === 'TRANSMUTE') {
        if (!selectedImage || !textInput.trim()) return;
        const base64Data = selectedImage.split(',')[1];
        const img = await transmuteImage(base64Data, imageMimeType, textInput);
        setResultImage(img);
      } else if (mode === 'SCRY') {
        if (!selectedImage) return;
        const base64Data = selectedImage.split(',')[1];
        const analysis = await scryImage(base64Data, imageMimeType);
        setAnalysisResult(analysis);
      }
    } catch (err) {
      setError("Ritual Failed. The ether was not receptive.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[
          { id: 'MANIFEST', label: 'Manifestation', sub: 'Text to Image', icon: <Sparkles /> },
          { id: 'TRANSMUTE', label: 'Transmutation', sub: 'Image Editing', icon: <Wand2 /> },
          { id: 'SCRY', label: 'Scrying', sub: 'Image Analysis', icon: <Eye /> },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setMode(m.id as Mode);
              setResultImage(null);
              setAnalysisResult(null);
              setError(null);
            }}
            className={`relative p-6 border transition-all duration-300 group overflow-hidden text-left ${
              mode === m.id 
                ? 'border-[#d4af37] bg-[#d4af37]/5' 
                : 'border-[#d4af37]/20 bg-[#0a0a0a] hover:border-[#d4af37]/60'
            }`}
          >
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent transition-transform duration-500 ${mode === m.id ? 'scale-x-100' : 'scale-x-0'}`}></div>
            <div className={`mb-4 ${mode === m.id ? 'text-[#d4af37]' : 'text-zinc-500 group-hover:text-[#d4af37]'}`}>
                {React.cloneElement(m.icon as React.ReactElement<any>, { size: 32, strokeWidth: 1 })}
            </div>
            <h3 className="text-xl font-mystic text-[#e4e4e7] mb-1">{m.label}</h3>
            <p className="text-xs font-tech text-zinc-500 uppercase tracking-wider">{m.sub}</p>
          </button>
        ))}
      </div>

      <div className="bg-[#0a0a0a] border border-[#d4af37]/30 p-8 lg:p-12 relative">
        {/* Decoration Lines */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-4 w-2 h-2 border border-[#d4af37]/40"></div>
            <div className="absolute top-4 right-4 w-2 h-2 border border-[#d4af37]/40"></div>
            <div className="absolute bottom-4 left-4 w-2 h-2 border border-[#d4af37]/40"></div>
            <div className="absolute bottom-4 right-4 w-2 h-2 border border-[#d4af37]/40"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
                <h2 className="text-3xl font-mystic text-[#d4af37]">
                    {mode === 'MANIFEST' && "Conjure Form from Void"}
                    {mode === 'TRANSMUTE' && "Alchemical Alteration"}
                    {mode === 'SCRY' && "Interpret Visual Signs"}
                </h2>
                
                {/* Inputs */}
                <div className="space-y-6">
                    {(mode === 'TRANSMUTE' || mode === 'SCRY') && (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full aspect-video border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group ${selectedImage ? 'border-[#d4af37]' : 'border-zinc-700 hover:border-[#d4af37]/60'}`}
                        >
                            {selectedImage ? (
                                <div className="relative w-full h-full p-2">
                                    <img src={selectedImage} alt="Ritual Object" className="w-full h-full object-contain" />
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-[#d4af37] text-xs font-tech px-2 py-1">OBJ_LOADED</div>
                                </div>
                            ) : (
                                <>
                                    <Upload className="text-zinc-600 group-hover:text-[#d4af37] transition-colors" size={32} />
                                    <span className="font-tech text-xs text-zinc-500 uppercase">Upload Artifact</span>
                                </>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </div>
                    )}

                    {(mode === 'MANIFEST' || mode === 'TRANSMUTE') && (
                        <div>
                            <label className="font-tech text-[10px] text-[#d4af37] uppercase mb-2 block">Invocation Parameters</label>
                            <textarea
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                placeholder={mode === 'MANIFEST' ? "Describe the entity or landscape..." : "Describe the transmutation..."}
                                className="w-full bg-[#050505] border border-[#d4af37]/30 p-4 text-[#e4e4e7] focus:outline-none focus:border-[#d4af37] min-h-[100px] font-serif text-lg resize-none"
                            />
                        </div>
                    )}

                    <button
                        onClick={handleAction}
                        disabled={loading || (mode !== 'MANIFEST' && !selectedImage) || (mode !== 'SCRY' && !textInput.trim())}
                        className="w-full py-4 bg-[#d4af37] text-black font-tech font-bold uppercase tracking-widest hover:bg-[#eac755] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <RefreshCcw className="animate-spin" /> : <Sparkles />}
                        <span>Begin Ritual</span>
                    </button>
                </div>
                
                {error && <p className="text-red-400 font-tech text-xs border border-red-900 p-2">{error}</p>}
            </div>

            {/* Result Area */}
            <div className="min-h-[400px] bg-[#050505] border border-[#d4af37]/10 flex items-center justify-center relative">
                {!resultImage && !analysisResult && (
                    <div className="text-[#d4af37]/20 font-mystic text-6xl opacity-20 select-none">VOID</div>
                )}

                {resultImage && (
                    <div className="w-full h-full p-2 animate-fade-in">
                        <img src={resultImage} alt="Result" className="w-full h-full object-contain shadow-[0_0_30px_rgba(212,175,55,0.1)]" />
                    </div>
                )}

                {analysisResult && (
                    <div className="p-8 animate-fade-in h-full overflow-y-auto custom-scrollbar">
                        <h3 className="font-mystic text-[#d4af37] text-xl mb-4 border-b border-[#d4af37]/20 pb-2">Oracle Interpretation</h3>
                        <p className="font-serif text-lg leading-loose text-zinc-300">{analysisResult}</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VisualGnosis;