import React, { useState, useRef, useEffect } from 'react';
import { projectAstralVideo } from '../services/gemini';
import { Video, Upload, Loader2, Play, Key } from 'lucide-react';

const AstralProjector: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkKey();
  }, []);

  const checkKey = async () => {
    if (window.aistudio && window.aistudio.hasSelectedApiKey) {
      const has = await window.aistudio.hasSelectedApiKey();
      setHasKey(has);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasKey(true); 
    }
  };

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

  const handleProject = async () => {
    if (!selectedImage) return;
    setLoading(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage("OPENING GATEWAY...");

    const messages = [
      "COMPRESSING REALITY MATRIX...",
      "CONSULTING VEO ENGINE...",
      "WEAVING TEMPORAL STRANDS...",
      "STABILIZING PROJECTION..."
    ];
    let msgIdx = 0;
    const timer = setInterval(() => {
        if (msgIdx < messages.length) setStatusMessage(messages[msgIdx++]);
    }, 5000);

    try {
      const base64Data = selectedImage.split(',')[1];
      const url = await projectAstralVideo(base64Data, imageMimeType, prompt || "Bring this image to life");
      setVideoUrl(url);
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
          setHasKey(false);
          setError("KEY_INVALID");
      } else {
          setError("PROJECTION_COLLAPSE");
      }
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  if (!hasKey) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
        <div className="border border-[#d4af37] p-12 bg-[#0a0a0a] relative max-w-lg">
            <div className="absolute inset-0 border-2 border-[#d4af37] translate-x-1 translate-y-1 pointer-events-none opacity-50"></div>
            <Key className="w-12 h-12 text-[#d4af37] mx-auto mb-6" strokeWidth={1} />
            <h2 className="text-2xl font-mystic text-[#e4e4e7] mb-4">Access Restricted</h2>
            <p className="font-serif text-zinc-400 mb-8">The Veo Astral Engine requires specific authentication to open the temporal gateway.</p>
            <button 
                onClick={handleSelectKey}
                className="bg-[#d4af37] text-black font-tech font-bold uppercase px-8 py-3 tracking-widest hover:bg-white transition-colors"
            >
                Insert Key
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="border border-[#d4af37]/30 bg-[#0a0a0a] p-8 lg:p-12 relative">
        {/* Tech decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-32 bg-[#d4af37]/50"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-32 bg-[#d4af37]/50"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6 border-r border-[#d4af37]/10 pr-0 lg:pr-8">
                <h3 className="font-mystic text-[#d4af37] text-xl">Source Material</h3>
                
                <div 
                    onClick={() => !loading && fileInputRef.current?.click()}
                    className={`aspect-square border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center relative ${selectedImage ? 'border-[#d4af37]' : 'border-zinc-800 hover:border-[#d4af37]/50'}`}
                >
                    {selectedImage ? (
                        <img src={selectedImage} className="w-full h-full object-cover opacity-80" />
                    ) : (
                        <div className="text-center">
                            <Upload className="mx-auto text-zinc-600 mb-2" />
                            <span className="font-tech text-[10px] uppercase text-zinc-500">Input Image</span>
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} disabled={loading} />
                </div>

                <div className="space-y-2">
                    <label className="font-tech text-[10px] text-[#d4af37] uppercase">Motion Intent</label>
                    <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full bg-[#111] border border-[#d4af37]/20 p-3 text-sm text-[#e4e4e7] focus:border-[#d4af37] focus:outline-none"
                        placeholder="e.g., Pan upwards..."
                        disabled={loading}
                    />
                </div>

                <button
                    onClick={handleProject}
                    disabled={loading || !selectedImage}
                    className="w-full bg-[#d4af37]/10 border border-[#d4af37] text-[#d4af37] py-3 font-tech font-bold uppercase text-xs hover:bg-[#d4af37] hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Processing..." : "Initiate Projection"}
                </button>
                
                {error && <div className="text-red-500 font-tech text-xs border border-red-900 p-2 bg-red-900/10">{error}</div>}
            </div>

            <div className="lg:col-span-8 flex flex-col">
                <h3 className="font-mystic text-[#d4af37] text-xl mb-6">Astral Plane Viewport</h3>
                
                <div className="flex-1 bg-black border-2 border-[#d4af37]/20 relative flex items-center justify-center overflow-hidden group">
                    {/* Viewport overlay */}
                    <div className="absolute inset-0 pointer-events-none z-20 border-[20px] border-[#0a0a0a]/50"></div>
                    <div className="absolute top-4 left-4 z-30 font-tech text-[10px] text-[#d4af37]/50">REC</div>
                    
                    {videoUrl ? (
                        <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain z-10" />
                    ) : (
                        <div className="text-[#d4af37]/20 text-center z-0">
                             <Play className={`w-16 h-16 mx-auto mb-4 ${loading ? 'animate-pulse opacity-100' : 'opacity-50'}`} strokeWidth={0.5} />
                             <p className="font-tech text-xs tracking-widest uppercase">
                                 {loading ? statusMessage : "Signal Offline"}
                             </p>
                        </div>
                    )}

                    {/* Loading Scanline */}
                    {loading && (
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#d4af37] shadow-[0_0_20px_#d4af37] animate-[scan_2s_linear_infinite] z-30 opacity-50"></div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AstralProjector;