import React, { useState, useRef, useEffect } from 'react';
import { chatWithOracle } from '../services/gemini';
import { ChatMessage } from '../types';
import { Send, BrainCircuit, Sparkles } from 'lucide-react';

const MagicalChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "The channel is open. I speak for the void. What is your query?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deepGnosis, setDeepGnosis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    try {
      const responseText = await chatWithOracle(history, userMsg, deepGnosis);
      setMessages(prev => [...prev, { role: 'model', text: responseText || "Silence." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "The link is severed.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[80vh] flex flex-col">
      <div className="bg-[#0a0a0a] border border-[#d4af37]/30 flex-1 flex flex-col relative overflow-hidden">
         {/* Header UI */}
         <div className="h-12 border-b border-[#d4af37]/20 flex items-center justify-between px-4 bg-[#0f0f0f]">
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${deepGnosis ? 'bg-purple-500 shadow-[0_0_5px_#a855f7]' : 'bg-[#d4af37] shadow-[0_0_5px_#d4af37]'}`}></div>
                <span className="font-tech text-xs text-[#d4af37] tracking-widest uppercase">
                    {deepGnosis ? 'GNOSIS: DEEP' : 'GNOSIS: STANDARD'}
                </span>
            </div>
            <button 
                onClick={() => setDeepGnosis(!deepGnosis)}
                className={`font-tech text-[10px] uppercase px-2 py-1 border transition-all ${deepGnosis ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-[#d4af37]/30 text-[#d4af37]/60 hover:border-[#d4af37]'}`}
            >
                Toggle Depth
            </button>
         </div>

         {/* Chat Area */}
         <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10">
             {/* Scrying Mirror Effect */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none fixed"></div>
             
             {messages.map((msg, idx) => (
                 <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                         <div className={`font-tech text-[10px] mb-1 uppercase tracking-wider ${msg.role === 'user' ? 'text-purple-400' : 'text-[#d4af37]'}`}>
                             {msg.role === 'user' ? 'ADEPT' : 'ORACLE'}
                         </div>
                         <div className={`p-4 border ${
                             msg.role === 'user' 
                             ? 'border-purple-900/50 bg-purple-900/10 text-purple-100' 
                             : msg.isError 
                                ? 'border-red-900 bg-red-900/10 text-red-200'
                                : 'border-[#d4af37]/20 bg-[#d4af37]/5 text-[#e4e4e7]'
                         }`}>
                             <p className="font-serif text-lg leading-relaxed">{msg.text}</p>
                         </div>
                     </div>
                 </div>
             ))}

             {loading && (
                 <div className="flex justify-start">
                     <div className="max-w-[80%]">
                         <div className="font-tech text-[10px] text-[#d4af37] mb-1 uppercase">ORACLE</div>
                         <div className="flex gap-1 items-center h-8">
                             <div className="w-1 h-1 bg-[#d4af37] animate-ping"></div>
                             <div className="w-1 h-1 bg-[#d4af37] animate-ping delay-75"></div>
                             <div className="w-1 h-1 bg-[#d4af37] animate-ping delay-150"></div>
                         </div>
                     </div>
                 </div>
             )}
         </div>

         {/* Input Area */}
         <div className="p-4 bg-[#0a0a0a] border-t border-[#d4af37]/20 relative z-20">
             <form onSubmit={handleSend} className="flex gap-0 border border-[#d4af37]/30">
                 <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter query into the terminal..."
                    className="flex-1 bg-transparent text-[#d4af37] font-tech p-4 focus:outline-none placeholder-[#d4af37]/30"
                 />
                 <button type="submit" disabled={loading || !input.trim()} className="px-6 text-[#d4af37] hover:bg-[#d4af37]/10 border-l border-[#d4af37]/30 transition-colors disabled:opacity-50">
                     <Send size={18} />
                 </button>
             </form>
         </div>
      </div>
    </div>
  );
};

export default MagicalChat;