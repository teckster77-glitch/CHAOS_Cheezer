import React, { useState, useEffect } from 'react';
import { TabView } from './types';
import SigilCrafter from './components/SigilCrafter';
import MagicalChat from './components/MagicalChat';
import KnowledgeBase from './components/KnowledgeBase';
import VisualGnosis from './components/VisualGnosis';
import AstralProjector from './components/AstralProjector';
import TarotReader from './components/TarotReader';
import Starfield from './components/Starfield';
import { Triangle, Hexagon, Circle, Eye, Radio, Activity, Zap, Layers, Compass } from 'lucide-react';

const TAB_STORAGE_KEY = 'chaos-architect-active-tab';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabView>(() => {
    const savedTab = localStorage.getItem(TAB_STORAGE_KEY);
    if (savedTab && Object.values(TabView).includes(savedTab as TabView)) {
      return savedTab as TabView;
    }
    return TabView.EXPLORE;
  });

  const [time, setTime] = useState(new Date());
  const [observatoryMode, setObservatoryMode] = useState(false);

  useEffect(() => {
    localStorage.setItem(TAB_STORAGE_KEY, currentTab);
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e4e4e7] flex font-serif selection:bg-[#d4af37] selection:text-black overflow-hidden relative">
      
      {/* 3D Starfield Background */}
      <Starfield active={observatoryMode} />

      {/* Vignette Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,5,0.8)_100%)]"></div>

      {/* Side Navigation (Desktop) */}
      <aside className="hidden lg:flex w-24 flex-col items-center border-r border-[#d4af37]/20 bg-[#0a0a0a]/80 backdrop-blur-sm z-20 relative">
        <div className="h-24 flex items-center justify-center border-b border-[#d4af37]/20 w-full">
           <Triangle className="w-10 h-10 text-[#d4af37] animate-pulse" strokeWidth={1} />
        </div>
        
        <nav className="flex-1 flex flex-col gap-8 py-10 w-full items-center overflow-y-auto">
          {[
            { id: TabView.EXPLORE, icon: <Hexagon />, label: 'Archive' },
            { id: TabView.SIGIL_CRAFTER, icon: <Zap />, label: 'Sigil' },
            { id: TabView.TAROT_READER, icon: <Layers />, label: 'Thoth' },
            { id: TabView.VISUAL_GNOSIS, icon: <Eye />, label: 'Gnosis' },
            { id: TabView.ASTRAL_PROJECTION, icon: <Radio />, label: 'Astral' },
            { id: TabView.CHAT_ORACLE, icon: <Activity />, label: 'Oracle' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative group flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-500 flex-shrink-0 ${
                currentTab === tab.id
                  ? 'text-[#d4af37]'
                  : 'text-zinc-600 hover:text-[#d4af37]/70'
              }`}
            >
              <div className={`absolute inset-0 border border-[#d4af37]/30 rotate-45 transition-all duration-500 ${currentTab === tab.id ? 'scale-100 opacity-100 bg-[#d4af37]/5' : 'scale-50 opacity-0'}`}></div>
              <div className="z-10 relative transform group-hover:scale-110 transition-transform">
                {React.cloneElement(tab.icon as React.ReactElement<any>, { strokeWidth: 1.5, size: 24 })}
              </div>
              <span className="text-[10px] font-tech mt-2 tracking-widest opacity-0 group-hover:opacity-100 absolute -bottom-6 transition-opacity uppercase w-full text-center pointer-events-none bg-[#0a0a0a] z-20 px-1">{tab.label}</span>
              
              {currentTab === tab.id && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-[#d4af37] shadow-[0_0_10px_#d4af37]"></div>
              )}
            </button>
          ))}
        </nav>

        <div className="h-24 flex flex-col items-center justify-center border-t border-[#d4af37]/20 w-full text-[#d4af37]/40 gap-1">
           <span className="font-tech text-[10px]">SYS.RDY</span>
           <div className="w-2 h-2 bg-green-900 rounded-full shadow-[0_0_5px_#0f0] animate-pulse"></div>
        </div>
      </aside>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-[#d4af37]/20 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-between px-8 flex-shrink-0 transition-all duration-300 hover:bg-[#0a0a0a]/95 z-30">
          <div className="flex items-center gap-4">
             <h1 className="text-2xl font-mystic text-[#e4e4e7] tracking-[0.2em]">
               CHAOS ARCHITECT <span className="text-[#d4af37] text-sm align-top font-tech">v2.5</span>
             </h1>
          </div>
          
          <div className="flex items-center gap-6">
             {/* Observatory Mode Toggle */}
             <button 
                onClick={() => setObservatoryMode(!observatoryMode)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${observatoryMode ? 'border-[#d4af37] bg-[#d4af37]/20 text-[#d4af37]' : 'border-zinc-800 text-zinc-500 hover:text-[#d4af37]'}`}
                title="Toggle 3D Observatory"
             >
                <Compass className={`w-4 h-4 ${observatoryMode ? 'animate-spin' : ''}`} style={{ animationDuration: '5s' }} />
                <span className="font-tech text-[10px] uppercase tracking-widest">Observatory</span>
             </button>

             <div className="hidden md:flex items-center gap-4 font-tech text-xs text-[#d4af37]/60">
                <div className="flex items-center gap-2">
                   <span className="uppercase">Lat: {33.0 + Math.random()}</span>
                </div>
                <div className="h-4 w-px bg-[#d4af37]/20"></div>
                <div className="flex items-center gap-2">
                   <span className="uppercase">{time.toLocaleTimeString([], { hour12: false })} UTC</span>
                </div>
             </div>
             <div className="w-8 h-8 border border-[#d4af37] rounded-full flex items-center justify-center">
                <Circle className="w-2 h-2 text-[#d4af37] fill-[#d4af37] animate-ping" />
             </div>
          </div>
        </header>

        {/* Content Area - Clicking through this is disabled when observatory mode is active unless we control z-index carefully. 
            Actually, observatory mode should probably just be a background thing, but if we click to drag, we need pointer events on the canvas. 
            The canvas has z-0. Content has z-10. 
            If Observatory is active, we might want to hide the main content or allow "pass through" if clicking on empty space, 
            but React event bubbling makes that hard. 
            
            Alternative: When observatory mode is ON, we make the background canvas z-40 (on top) but with opacity, 
            OR we just let the user toggle it to "LOOK UP" mode which might hide the UI. 
            
            For better UX: When Observatory is Active, we make the UI semi-transparent or just keep the canvas at z-0 
            but allow pointer events to pass through the container if not clicking a button.
            
            However, simpler implementation: Toggle puts app in "Observatory Mode" where content is hidden or minimized.
        */}
        
        {observatoryMode ? (
            <div className="absolute inset-0 z-20 flex items-end justify-center pb-12 pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md border border-[#d4af37] p-4 text-center animate-in fade-in slide-in-from-bottom-10">
                    <p className="font-mystic text-[#d4af37] text-xl">OBSERVATORY ACTIVE</p>
                    <p className="font-tech text-xs text-zinc-400">DRAG TO ROTATE CONSTELLATIONS</p>
                </div>
            </div>
        ) : (
            <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth relative z-10 animate-in fade-in">
               {/* Corner Decorations */}
               <div className="absolute top-0 left-0 w-32 h-32 border-t border-l border-[#d4af37]/20 pointer-events-none"></div>
               <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-[#d4af37]/20 pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-[#d4af37]/20 pointer-events-none"></div>
               <div className="absolute bottom-0 right-0 w-32 h-32 border-b border-r border-[#d4af37]/20 pointer-events-none"></div>

               <div className="max-w-7xl mx-auto min-h-full">
                  {currentTab === TabView.EXPLORE && <KnowledgeBase />}
                  {currentTab === TabView.SIGIL_CRAFTER && <SigilCrafter />}
                  {currentTab === TabView.TAROT_READER && <TarotReader />}
                  {currentTab === TabView.VISUAL_GNOSIS && <VisualGnosis />}
                  {currentTab === TabView.ASTRAL_PROJECTION && <AstralProjector />}
                  {currentTab === TabView.CHAT_ORACLE && <MagicalChat />}
               </div>
            </main>
        )}

        {/* Mobile Nav */}
        <nav className="lg:hidden h-16 border-t border-[#d4af37]/20 bg-[#0a0a0a] flex justify-around items-center px-2 flex-shrink-0 z-30">
            {[
              { id: TabView.EXPLORE, icon: <Hexagon /> },
              { id: TabView.SIGIL_CRAFTER, icon: <Zap /> },
              { id: TabView.TAROT_READER, icon: <Layers /> },
              { id: TabView.VISUAL_GNOSIS, icon: <Eye /> },
              { id: TabView.ASTRAL_PROJECTION, icon: <Radio /> },
              { id: TabView.CHAT_ORACLE, icon: <Activity /> },
            ].map((tab) => (
               <button
                 key={tab.id}
                 onClick={() => setCurrentTab(tab.id)}
                 className={`p-3 rounded-lg transition-all ${
                   currentTab === tab.id ? 'text-[#d4af37] bg-[#d4af37]/10' : 'text-zinc-600'
                 }`}
               >
                 {React.cloneElement(tab.icon as React.ReactElement<any>, { size: 20 })}
               </button>
            ))}
        </nav>

      </div>
    </div>
  );
};

export default App;