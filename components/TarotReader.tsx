import React, { useState, useEffect } from 'react';
import { consultThothTarot, playCrowleyVoice, analyzeThothCard } from '../services/gemini';
import { TarotCard, TarotSpread } from '../types';
import { Sparkles, Repeat, Search, X, BookOpen, Volume2, VolumeX, ToggleLeft, ToggleRight, Eye, StopCircle } from 'lucide-react';

// --- DECK DATA CONSTANTS ---
const MAJOR_ARCANA: TarotCard[] = [
  { id: '0', name: 'The Fool', arcana: 'Major' },
  { id: '1', name: 'The Magus', arcana: 'Major' },
  { id: '2', name: 'The Priestess', arcana: 'Major' },
  { id: '3', name: 'The Empress', arcana: 'Major' },
  { id: '4', name: 'The Emperor', arcana: 'Major' },
  { id: '5', name: 'The Hierophant', arcana: 'Major' },
  { id: '6', name: 'The Lovers', arcana: 'Major' },
  { id: '7', name: 'The Chariot', arcana: 'Major' },
  { id: '8', name: 'Adjustment', arcana: 'Major' }, // Thoth naming
  { id: '9', name: 'The Hermit', arcana: 'Major' },
  { id: '10', name: 'Fortune', arcana: 'Major' },
  { id: '11', name: 'Lust', arcana: 'Major' }, // Thoth naming
  { id: '12', name: 'The Hanged Man', arcana: 'Major' },
  { id: '13', name: 'Death', arcana: 'Major' },
  { id: '14', name: 'Art', arcana: 'Major' }, // Thoth naming
  { id: '15', name: 'The Devil', arcana: 'Major' },
  { id: '16', name: 'The Tower', arcana: 'Major' },
  { id: '17', name: 'The Star', arcana: 'Major' },
  { id: '18', name: 'The Moon', arcana: 'Major' },
  { id: '19', name: 'The Sun', arcana: 'Major' },
  { id: '20', name: 'The Aeon', arcana: 'Major' }, // Thoth naming
  { id: '21', name: 'The Universe', arcana: 'Major' },
];

const SUITS = ['Wands', 'Cups', 'Swords', 'Disks'] as const;
const MINOR_TITLES: Record<string, string[]> = {
  Wands: ['Ace', 'Dominion', 'Virtue', 'Completion', 'Strife', 'Victory', 'Valour', 'Swiftness', 'Strength', 'Oppression'],
  Cups: ['Ace', 'Love', 'Abundance', 'Luxury', 'Disappointment', 'Pleasure', 'Debauch', 'Indolence', 'Happiness', 'Satiety'],
  Swords: ['Ace', 'Peace', 'Sorrow', 'Truce', 'Defeat', 'Science', 'Futility', 'Interference', 'Cruelty', 'Ruin'],
  Disks: ['Ace', 'Change', 'Works', 'Power', 'Worry', 'Success', 'Failure', 'Prudence', 'Gain', 'Wealth']
};

const generateDeck = (): TarotCard[] => {
  let deck = [...MAJOR_ARCANA];
  SUITS.forEach(suit => {
    // Number cards
    for (let i = 1; i <= 10; i++) {
      deck.push({
        id: `${suit}-${i}`,
        name: `${i === 1 ? 'Ace' : i} of ${suit}`,
        suit,
        rank: i.toString(),
        arcana: 'Minor',
        thothTitle: MINOR_TITLES[suit][i-1]
      });
    }
    // Court cards (Thoth Specific)
    ['Knight', 'Queen', 'Prince', 'Princess'].forEach(rank => {
      deck.push({
        id: `${suit}-${rank}`,
        name: `${rank} of ${suit}`,
        suit,
        rank,
        arcana: 'Minor'
      });
    });
  });
  return deck;
};

const SPREADS: TarotSpread[] = [
  {
    name: 'Daily Card',
    slots: [{ name: 'The Day', desc: 'The overarching energy of the current moment.' }]
  },
  {
    name: 'Thoth Trinity',
    slots: [
      { name: 'The Thesis', desc: 'The core situation.' },
      { name: 'The Antithesis', desc: 'The challenge or opposing force.' },
      { name: 'The Synthesis', desc: 'The outcome or advice.' }
    ]
  },
  {
    name: 'Celtic Cross (Crowley)',
    slots: [
      { name: 'The Heart', desc: 'The querent\'s position.' },
      { name: 'The Obstacle', desc: 'What crosses the querent.' },
      { name: 'The Crown', desc: 'The best possible outcome.' },
      { name: 'The Root', desc: 'The subconscious basis.' },
      { name: 'The Past', desc: 'Passing influence.' },
      { name: 'The Future', desc: 'Approaching influence.' },
      { name: 'The Self', desc: 'Attitude and relation to the matter.' },
      { name: 'The Environment', desc: 'Influence of others.' },
      { name: 'Hopes & Fears', desc: 'Inner emotions.' },
      { name: 'The Outcome', desc: 'Final result.' }
    ]
  }
];

const TarotReader: React.FC = () => {
  const [deck, setDeck] = useState<TarotCard[]>([]);
  const [selectedSpread, setSelectedSpread] = useState<TarotSpread>(SPREADS[0]);
  const [drawnCards, setDrawnCards] = useState<TarotCard[]>([]);
  const [query, setQuery] = useState('');
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [revealed, setRevealed] = useState<boolean[]>([]);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [stopAudio, setStopAudio] = useState<(() => void) | null>(null);
  const [autoVocalize, setAutoVocalize] = useState(false);
  
  // Analysis Modal State
  const [activeCard, setActiveCard] = useState<TarotCard | null>(null);
  const [cardAnalysis, setCardAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Shuffle logic
  const handleShuffle = () => {
    if (!query.trim()) return;
    setIsShuffling(true);
    setDrawnCards([]);
    setReading(null);
    setRevealed([]);
    setActiveCard(null);
    if (stopAudio) stopAudio();

    setTimeout(() => {
      const newDeck = generateDeck().sort(() => Math.random() - 0.5);
      const draw = newDeck.slice(0, selectedSpread.slots.length);
      setDeck(newDeck);
      setDrawnCards(draw);
      setRevealed(new Array(draw.length).fill(false));
      setIsShuffling(false);
    }, 2000); // 2s shuffle animation
  };

  const handleReveal = async (index: number) => {
    if (revealed[index]) return;
    
    const newRevealed = [...revealed];
    newRevealed[index] = true;
    setRevealed(newRevealed);

    // If all cards revealed, trigger reading
    if (newRevealed.every(r => r)) {
      setLoading(true);
      const cardData = drawnCards.map((card, i) => ({
        name: card.thothTitle ? `${card.name} ("${card.thothTitle}")` : card.name,
        position: selectedSpread.slots[i].name
      }));
      
      try {
        const interpretation = await consultThothTarot(cardData, query);
        setReading(interpretation);
        
        // Auto Vocalization Trigger
        if (autoVocalize) {
            setTimeout(() => {
                 triggerAudio(interpretation);
            }, 1000);
        }
      } catch (e) {
        setReading("Communication with the Aether interrupted.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleInspect = async (card: TarotCard) => {
      setActiveCard(card);
      setCardAnalysis(null);
      setAnalyzing(true);
      try {
          const analysis = await analyzeThothCard(card);
          setCardAnalysis(analysis);
      } catch (e) {
          setCardAnalysis("Details obscured.");
      } finally {
          setAnalyzing(false);
      }
  };

  const triggerAudio = async (text: string) => {
    if (playingAudio && stopAudio) {
        stopAudio(); // Stop current if playing
    }
    
    setPlayingAudio(true);
    try {
        const cleanText = text.replace(/[*_#]/g, '');
        const stopFn = await playCrowleyVoice(cleanText, () => {
            setPlayingAudio(false);
            setStopAudio(null);
        });
        setStopAudio(() => stopFn);
    } catch (e) {
        console.error("Speech failed", e);
        setPlayingAudio(false);
    }
  };

  const handleToggleAudio = async () => {
    if (playingAudio) {
        if (stopAudio) stopAudio();
        setStopAudio(null);
        setPlayingAudio(false);
    } else if (reading) {
        await triggerAudio(reading);
    }
  };

  const getCardColor = (suit?: string) => {
    switch(suit) {
      case 'Wands': return 'text-red-500 border-red-900/30';
      case 'Cups': return 'text-blue-400 border-blue-900/30';
      case 'Swords': return 'text-yellow-200 border-yellow-900/30';
      case 'Disks': return 'text-green-400 border-green-900/30';
      default: return 'text-[#d4af37] border-[#d4af37]/30'; // Major Arcana
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-mystic text-[#d4af37] mb-2 tracking-widest">LIBER THOTH</h2>
        <p className="font-tech text-[#d4af37]/60 text-xs uppercase tracking-[0.2em]">
          Automated Tarot Divination // Aleister Crowley Protocol
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0a0a0a] border border-[#d4af37]/30 p-6 relative">
             <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#d4af37]"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#d4af37]"></div>

             <div className="flex items-center justify-between mb-4">
                 <label className="block font-tech text-[10px] text-[#d4af37] uppercase">Spread Configuration</label>
                 
                 {/* Auto Vocalize Toggle */}
                 <button 
                    onClick={() => setAutoVocalize(!autoVocalize)}
                    className="flex items-center gap-2 font-tech text-[10px] text-[#d4af37]/80 hover:text-[#d4af37]"
                    title="Automatically speak interpretation when complete"
                 >
                    <span>AUTO-VOCALIZE</span>
                    {autoVocalize ? <ToggleRight className="text-[#d4af37]" /> : <ToggleLeft className="text-zinc-600" />}
                 </button>
             </div>

             <div className="flex flex-col gap-2 mb-6">
               {SPREADS.map(s => (
                 <button
                   key={s.name}
                   onClick={() => {
                     setSelectedSpread(s);
                     setDrawnCards([]);
                     setReading(null);
                   }}
                   disabled={isShuffling || drawnCards.length > 0}
                   className={`p-3 text-left font-serif text-sm border transition-all ${selectedSpread.name === s.name ? 'border-[#d4af37] bg-[#d4af37]/10 text-[#e4e4e7]' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 disabled:opacity-30'}`}
                 >
                   {s.name}
                 </button>
               ))}
             </div>

             <label className="block font-tech text-[10px] text-[#d4af37] mb-2 uppercase">Querent's Inquiry</label>
             <textarea
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               placeholder="Focus your will..."
               className="w-full bg-[#050505] border border-[#d4af37]/30 p-3 text-[#e4e4e7] font-serif italic h-24 resize-none focus:outline-none focus:border-[#d4af37] mb-6"
             />

             <button
               onClick={handleShuffle}
               disabled={!query || isShuffling || (drawnCards.length > 0 && !reading)}
               className="w-full bg-[#d4af37] text-black font-tech font-bold uppercase py-4 tracking-widest hover:bg-[#b5952f] disabled:opacity-50 transition-all relative overflow-hidden group"
             >
               {isShuffling ? (
                 <span className="animate-pulse">Shuffling Fate...</span>
               ) : drawnCards.length > 0 ? (
                 "Reset Deck"
               ) : (
                 "Consult Thoth"
               )}
               <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
             </button>
          </div>
        </div>

        {/* Right Display Area */}
        <div className="lg:col-span-8">
          <div className="min-h-[600px] bg-[#080808] border border-[#d4af37]/20 p-8 relative flex flex-col items-center">
            
            {/* Card Grid */}
            {drawnCards.length > 0 ? (
               <div className="flex flex-wrap justify-center gap-4 mb-12 w-full">
                 {drawnCards.map((card, idx) => (
                   <div key={idx} className="flex flex-col items-center">
                      <span className="font-tech text-[10px] text-[#d4af37]/50 mb-2 uppercase tracking-widest">{selectedSpread.slots[idx].name}</span>
                      
                      <button
                        onClick={() => revealed[idx] ? handleInspect(card) : handleReveal(idx)}
                        disabled={isShuffling}
                        className={`relative w-32 h-52 transition-all duration-700 transform perspective-1000 ${revealed[idx] ? 'rotate-y-0 cursor-pointer hover:ring-2 ring-[#d4af37] hover:scale-105' : 'cursor-pointer hover:scale-105'}`}
                      >
                        {revealed[idx] ? (
                          // REVEALED CARD FACE
                          <div className={`absolute inset-0 bg-[#111] border-2 flex flex-col items-center justify-between p-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-fade-in ${getCardColor(card.suit)}`}>
                             <div className="w-full flex justify-between items-start">
                                <span className="font-tech text-xs opacity-50">{card.rank || 'VI'}</span>
                                {card.suit === 'Wands' && <span className="text-lg">🔥</span>}
                                {card.suit === 'Cups' && <span className="text-lg">🏆</span>}
                                {card.suit === 'Swords' && <span className="text-lg">⚔️</span>}
                                {card.suit === 'Disks' && <span className="text-lg">🪙</span>}
                                {card.arcana === 'Major' && <span className="text-lg">✡️</span>}
                             </div>
                             
                             <div className="text-center">
                               <h4 className="font-mystic text-sm leading-tight mb-1">{card.name.replace(' of ', '\n of ')}</h4>
                               {card.thothTitle && <p className="font-serif text-xs italic opacity-70">"{card.thothTitle}"</p>}
                             </div>

                             <div className="w-full border-t border-current opacity-20"></div>
                             
                             <div className="absolute bottom-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                                 <Eye className="w-4 h-4 text-[#d4af37]" />
                             </div>
                          </div>
                        ) : (
                          // CARD BACK
                          <div className="absolute inset-0 bg-[#1a1a1a] border border-[#d4af37]/40 flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                             <div className="w-24 h-40 border border-[#d4af37]/20 flex items-center justify-center">
                                <div className="w-16 h-16 border border-[#d4af37]/40 rotate-45 flex items-center justify-center">
                                   <div className="w-10 h-10 border border-[#d4af37]/60 rotate-45"></div>
                                </div>
                             </div>
                          </div>
                        )}
                      </button>
                   </div>
                 ))}
               </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#d4af37]/20">
                 <BookOpen size={64} strokeWidth={0.5} />
                 <p className="font-mystic mt-4 tracking-widest">DECK IS SEALED</p>
              </div>
            )}

            {/* Reading Output */}
            {loading && (
              <div className="text-[#d4af37] font-tech animate-pulse flex items-center gap-2">
                 <Sparkles className="w-4 h-4" />
                 <span>INVOKING CROWLEY'S GHOST...</span>
              </div>
            )}

            {reading && (
               <div className="w-full border-t border-[#d4af37]/20 pt-8 animate-slide-up relative">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-[#d4af37]"></div>
                        <h3 className="font-mystic text-xl text-[#e4e4e7]">INTERPRETATION</h3>
                     </div>
                     
                     <button 
                        onClick={handleToggleAudio}
                        className={`flex items-center gap-2 font-tech text-sm font-bold border px-6 py-2 transition-all shadow-lg ${playingAudio ? 'bg-red-900/20 text-red-400 border-red-900 hover:bg-red-900/40' : 'text-[#d4af37] border-[#d4af37] hover:bg-[#d4af37] hover:text-black'}`}
                     >
                        {playingAudio ? <StopCircle className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                        {playingAudio ? "SILENCE VOICE" : "INVOKE CROWLEY'S VOICE"}
                     </button>
                  </div>
                  <div className="prose prose-invert prose-p:font-serif prose-p:text-lg prose-p:leading-loose prose-headings:font-mystic prose-headings:text-[#d4af37] max-w-none">
                     <div dangerouslySetInnerHTML={{ __html: reading.replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#d4af37] font-normal">$1</strong>').replace(/\n/g, '<br/>') }} />
                  </div>
               </div>
            )}

          </div>
        </div>
      </div>

      {/* CARD INSPECTION MODAL */}
      {activeCard && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
             <div className="bg-[#0f0f0f] border border-[#d4af37] max-w-3xl w-full relative shadow-[0_0_50px_rgba(212,175,55,0.1)] max-h-[80vh] overflow-y-auto custom-scrollbar">
                 <button 
                    onClick={() => setActiveCard(null)}
                    className="absolute top-0 right-0 p-4 text-[#d4af37] hover:text-white transition-colors z-20"
                 >
                     <X className="w-6 h-6" />
                 </button>
                 
                 <div className="p-8 lg:p-12">
                     <div className="flex flex-col items-center mb-8 border-b border-[#d4af37]/20 pb-8">
                         <div className="font-tech text-[#d4af37] text-xs uppercase tracking-widest mb-2">Arcanum Analysis</div>
                         <h2 className="text-4xl font-mystic text-[#e4e4e7] text-center">{activeCard.name}</h2>
                         {activeCard.thothTitle && (
                             <p className="font-serif text-2xl italic text-[#d4af37] mt-2">"{activeCard.thothTitle}"</p>
                         )}
                     </div>

                     {analyzing ? (
                         <div className="flex flex-col items-center justify-center py-12">
                             <div className="w-12 h-12 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin mb-4"></div>
                             <p className="font-tech text-[#d4af37] animate-pulse">RETRIEVING ARCHIVE...</p>
                         </div>
                     ) : (
                         <div className="prose prose-invert prose-lg max-w-none font-serif">
                             <div dangerouslySetInnerHTML={{ __html: cardAnalysis || '' }} />
                         </div>
                     )}
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default TarotReader;