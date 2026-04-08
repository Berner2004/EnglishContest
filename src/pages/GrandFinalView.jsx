import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Ear, Edit3, Zap, Trophy, Award, EyeOff, ChevronLeft, ChevronRight, Type, ArrowRight
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

const ELITE_WORDS_POOL = [
  "swimming", "breakfast", "bathroom", "crocodile", "mountain", "beautiful", "thursday", "firefighter",
  "playground", "pyjamas", "surprised", "building", "suitcases", "frightened", "milkshake", "strawberry",
  "kitchen", "living room", "bedroom", "bathtub", "expensive", "computer", "mustache", "excellent"
];

const WOW_SENTENCES = [
  "The beautiful crocodile is swimming in the lake.",
  "My father has a big beard and a black mustache.",
  "The expensive computer is in the living room.",
  "She is frightened because the building is very old.",
  "I am eating pancakes and drinking a strawberry milkshake.",
  "The firefighter arrived at the school on Tuesday."
];

const GrandFinalView = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    rapidSpellTime: 20,   // Fase 1: 20 segundos
    wowShowTime: 5,       // Paso 1: 5 segundos visualización
    wowPublicTime: 28,    // Paso 5: ~28 segundos deletreo
    boardsUpTime: 10
  };

  const [currentChildIdx, setCurrentChildIdx] = useState(0);
  const [phase, setPhase] = useState('READY'); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [displayWords, setDisplayWords] = useState([]);
  const [wowSentence, setWowSentence] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0); 

  const currentChild = participants[currentChildIdx];
  const intervalRef = useRef(null);
  const audioRef = useRef(new Audio('/audio/boards-up.mp3'));

  useEffect(() => {
    // Cambiamos bcRef por socket.emit
    socket.emit('sync_state', {
      game: 'GRAND_FINAL',
      round: 'FINAL', 
      phase, 
      timeLeft, 
      displayWords, 
      wowSentence, 
      currentIndex,
      participantNumber: currentChild?.order_number
    });
  }, [phase, timeLeft, displayWords, wowSentence, currentIndex, currentChild]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false); 
      handleAutoTransition(); 
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  const handleAutoTransition = () => {
    if (phase === 'RAPID_SPELL') {
      setPhase('PAUSE_WOW');
    }
    else if (phase === 'WOW_SHOW') {
      // Paso 2 y 3: Se apaga pantalla y estudiante se da la vuelta
      setPhase('WOW_BLIND'); 
    }
    else if (phase === 'WOW_PUBLIC') {
      goToNextStudent();
    }
  };

  const startNextPhase = () => {
    if (phase === 'READY') {
      startFinalTurn();
    }
    else if (phase === 'PAUSE_WOW') {
      // Paso 1: Proyectar oración (5s)
      setPhase('WOW_SHOW');
      setWowSentence(WOW_SENTENCES[Math.floor(Math.random() * WOW_SENTENCES.length)]);
      setTimeLeft(settings.wowShowTime);
      setIsActive(true);
    }
    else if (phase === 'WOW_BLIND') {
      // Paso 4: Se vuelve a proyectar solo para público
      setPhase('WOW_PUBLIC');
      setTimeLeft(settings.wowPublicTime);
      setIsActive(true);
    }
  };

  const startFinalTurn = () => {
    setDisplayWords([...ELITE_WORDS_POOL].sort(() => Math.random() - 0.5).slice(0, 15));
    setPhase('RAPID_SPELL');
    setTimeLeft(settings.rapidSpellTime);
    setIsActive(true);
  };

  const skipPhase = () => {
    setIsActive(false);
    handleAutoTransition();
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    setPhase('READY');
    setWowSentence("");
  };

  const goToNextStudent = () => {
    setIsActive(false);
    setWowSentence("");
    if (currentChildIdx < participants.length - 1) {
      setCurrentChildIdx(prev => prev + 1);
      setPhase('READY');
    } else {
      setPhase('CONTEST_CLOSING');
    }
  };

  const goToPrevStudent = () => {
    setIsActive(false);
    if (currentChildIdx > 0) {
      setCurrentChildIdx(prev => prev - 1);
      setPhase('READY');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 px-8 shadow-xl flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Trophy size={28} className="text-amber-100 animate-bounce" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Amazon English Academy</h1>
        </div>
        <div className="bg-white/20 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
          GRAND FINAL — ELITE CHALLENGE
        </div>
      </header>

      <div className="w-full flex justify-between items-center py-6 px-12 bg-white border-b shadow-sm">
        <div className="space-y-2">
          <p className="text-xl md:text-2xl font-black text-amber-600 uppercase tracking-widest flex items-center gap-3">
            <span className="w-3 h-3 bg-amber-600 rounded-full animate-pulse"></span>
            TOP 5 FINALIST — #{currentChild?.order_number} {currentChild?.name || "Participant"}
          </p>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            {phase.replace(/_/g, ' ')}
          </h2>
        </div>
        <div className={`px-10 py-4 rounded-[2rem] border-4 transition-all shadow-lg ${timeLeft > 0 && timeLeft <= 3 ? 'bg-red-50 border-red-500 scale-110' : 'bg-slate-900 border-slate-700'}`}>
          <span className={`text-5xl md:text-6xl font-mono font-black tabular-nums ${timeLeft > 0 && timeLeft <= 3 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
            {timeLeft}<span className="text-3xl ml-1">s</span>
          </span>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-8 bg-slate-100 relative">
        <div className="w-full h-[65vh] max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
          
          {/* READY / PAUSAS */}
          {(phase === 'READY' || phase.startsWith('PAUSE')) && (
            <div className="text-center animate-in zoom-in duration-300">
              <div className="bg-amber-500/10 p-10 rounded-[3rem] border-2 border-amber-500/20 mb-8">
                 <Trophy size={100} className="text-amber-500 mx-auto mb-6 drop-shadow-lg" />
                 <h2 className="text-5xl font-black text-white uppercase tracking-widest italic">
                   {phase === 'READY' ? 'FINALIST READY' : 'CHALLENGE COMPLETED'}
                 </h2>
                 <p className="text-amber-400 font-black text-xl mt-4 uppercase tracking-[0.3em]">
                   {phase === 'READY' ? 'Waiting for rules review...' : 'Prepare for next part'}
                 </p>
              </div>

              <button 
                onClick={startNextPhase} 
                className="bg-emerald-500 hover:bg-emerald-600 px-24 py-8 rounded-[2.5rem] font-black text-white text-3xl shadow-[0_12px_0_0_#065f46] active:shadow-none active:translate-y-[12px] transition-all flex items-center gap-4 mx-auto"
              >
                <Play size={40} fill="currentColor" />
                {phase === 'READY' ? 'START TURN' : 'CONTINUE TO WOW'}
              </button>
            </div>
          )}

          {/* FASE 1: RAPID SPELL */}
          {phase === 'RAPID_SPELL' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
              <h3 className="text-4xl font-black text-amber-400 uppercase tracking-widest bg-amber-900/30 py-3 px-8 rounded-full border border-amber-500/30">Phase 1: Continuous Spelling</h3>
              <div className="flex flex-wrap justify-center gap-4 w-full max-w-5xl">
                {displayWords.map((word, i) => (
                  <div key={i} className="bg-slate-800 border-4 border-slate-600 rounded-2xl px-8 py-5 text-center shadow-xl">
                    <span className="text-3xl font-black text-white lowercase">{word}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FASE 2: MOMENTO WOW - PASO 1 (MOSTRAR) */}
          {phase === 'WOW_SHOW' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in">
              <h3 className="text-5xl font-black text-amber-400 uppercase tracking-widest text-center">MEMORIZE THE SENTENCE!</h3>
              <div className="w-[95%] max-w-5xl bg-slate-800 px-6 py-16 rounded-[2.5rem] border-8 border-amber-400 shadow-inner flex items-center justify-center">
                <h1 className="text-5xl md:text-6xl font-black text-white text-center leading-relaxed">{wowSentence}</h1>
              </div>
              <p className="text-slate-400 text-xl font-black uppercase tracking-[0.3em]">Closing screen in {timeLeft}s...</p>
            </div>
          )}

          {/* MOMENTO WOW - PASO 2 Y 3 (GIRO) */}
          {phase === 'WOW_BLIND' && (
            <div className="text-center space-y-8 animate-pulse">
              <EyeOff size={150} className="text-rose-500 mx-auto" />
              <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">TURN AROUND!</h2>
              <p className="text-slate-300 text-3xl font-bold uppercase tracking-widest bg-slate-800 py-4 px-10 rounded-full inline-block">The screen is now OFF for the student</p>
              <div className="mt-8">
                 <button onClick={startNextPhase} className="bg-emerald-600 hover:bg-emerald-500 px-12 py-5 rounded-2xl font-black text-white text-2xl shadow-lg transition-all">
                    START BLIND SPELLING (Public View ON)
                 </button>
              </div>
            </div>
          )}

          {/* MOMENTO WOW - PASO 4 Y 5 (DELETREO) */}
          {phase === 'WOW_PUBLIC' && (
            <div className="text-center p-10 space-y-10 animate-in fade-in">
               <Trophy size={120} className="text-amber-500 mx-auto drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]" />
               <h3 className="text-7xl font-black text-white uppercase tracking-tight italic">WOW MOMENT!</h3>
               <div className="bg-amber-400 text-amber-950 px-10 py-5 rounded-full font-black text-3xl uppercase tracking-widest shadow-xl inline-block animate-pulse">
                  Blind Spelling: Include Uppercase, Spaces & Punctuation
               </div>
               <div className="bg-slate-800 p-8 rounded-3xl border-4 border-slate-700 text-slate-300 text-2xl font-black max-w-3xl mx-auto uppercase tracking-tighter">
                 The sentence is now visible for the PUBLIC and JUDGES only.
               </div>
            </div>
          )}

          {/* FINALIZACIÓN */}
          {phase === 'CONTEST_CLOSING' && (
            <div className="text-center animate-in zoom-in duration-1000 p-10">
              <Trophy size={180} className="text-amber-500 mx-auto mb-8 drop-shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-pulse" />
              <h1 className="text-7xl md:text-9xl font-black text-white uppercase tracking-tighter drop-shadow-2xl">WE HAVE A CHAMPION!</h1>
            </div>
          )}
        </div>
      </main>

      {/* BARRA DE CONTROLES PILL-STYLE */}
      <footer className="w-full p-4 flex justify-center sticky bottom-0 z-50">
        <div className="w-full max-w-3xl bg-slate-950 p-4 rounded-[2.5rem] flex justify-center gap-4 items-center border border-slate-800 shadow-2xl">
            <button onClick={goToPrevStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Previous Student">
                <ChevronLeft size={24} />
            </button>
            <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors mx-2">
                <Home size={28} />
            </button>
            <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transform transition-all active:scale-90 ${isActive ? 'bg-red-500 text-white rotate-90' : 'bg-emerald-500 text-white'}`}>
                {isActive ? <Pause size={35} fill="currentColor" /> : <Play size={35} fill="currentColor" className="ml-2"/>}
            </button>
            <button onClick={handleResetTurn} className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all mx-2" title="Reset Turn">
                <RotateCcw size={28} />
            </button>
            <button onClick={skipPhase} className="w-14 h-14 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all" title="Skip Phase">
                <SkipForward size={28} />
            </button>
            <button onClick={goToNextStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Next Student">
                <ChevronRight size={24} />
            </button>
        </div>
      </footer>
    </div>
  );
};

export default GrandFinalView;