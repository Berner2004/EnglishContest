import { useState, useEffect, useRef } from 'react';
import { Award, Type, Monitor, Star, ArrowRight, Trophy, EyeOff, Brain, Camera, Users, Zap, Edit3 } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

// COMPONENTE DE RULETA VISUAL (SVG DINÁMICO)
const VisualRoulette = ({ participants, spinning, winnerName }) => {
    const [rotation, setRotation] = useState(0);
    const prevWinner = useRef("");

    useEffect(() => {
        if (spinning && winnerName && winnerName !== prevWinner.current && participants.length > 0) {
            const winIndex = participants.indexOf(winnerName);
            if (winIndex !== -1) {
                const total = participants.length;
                const sliceAngle = 360 / total;
                // Ajuste matemático para que el nombre quede arriba (-90 grados SVG = Norte)
                const targetCenter = (winIndex * sliceAngle) + (sliceAngle / 2);
                const offset = (360 - targetCenter) - 90;
                
                const currentMod = rotation % 360;
                // 5 vueltas completas de suspenso (1800 grados) + el offset para caer en el ganador
                const nextRotation = rotation - currentMod + 1800 + offset;

                setRotation(nextRotation);
                prevWinner.current = winnerName;
            }
        }
    }, [spinning, winnerName, participants, rotation]);

    const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1"];

    return (
        <div className="relative w-[350px] h-[350px] md:w-[650px] md:h-[650px] flex items-center justify-center animate-in zoom-in duration-500">
            {/* Punteros de la ruleta */}
            <div className="absolute top-[-30px] md:top-[-45px] z-20 w-0 h-0 border-l-[30px] border-r-[30px] border-t-[60px] border-l-transparent border-r-transparent border-t-red-600 drop-shadow-[0_5px_10px_rgba(0,0,0,0.5)]"></div>
            <div className="absolute top-[-25px] md:top-[-40px] z-21 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[40px] border-l-transparent border-r-transparent border-t-amber-400"></div>

            {/* Gráfico SVG de la Ruleta */}
            <svg
                viewBox="0 0 500 500"
                className="w-full h-full rounded-full shadow-[0_0_80px_rgba(0,0,0,0.6)] border-[16px] border-slate-800 bg-slate-900"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                }}
            >
                {participants.length > 0 && participants.map((name, i) => {
                    const total = participants.length;
                    const sliceAngle = 360 / total;
                    const startAngle = i * sliceAngle;
                    const endAngle = (i + 1) * sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;

                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = (endAngle - 90) * Math.PI / 180;

                    const x1 = 250 + 240 * Math.cos(startRad);
                    const y1 = 250 + 240 * Math.sin(startRad);
                    const x2 = 250 + 240 * Math.cos(endRad);
                    const y2 = 250 + 240 * Math.sin(endRad);

                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const d = `M 250 250 L ${x1} ${y1} A 240 240 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    const fillColor = colors[i % colors.length];

                    return (
                        <g key={i}>
                            <path d={d} fill={fillColor} stroke="#1e293b" strokeWidth="2" />
                            <g transform={`translate(250, 250) rotate(${midAngle - 90}) translate(130, 0)`}>
                                <text
                                    fill="#ffffff"
                                    fontSize={total > 25 ? "8" : total > 15 ? "11" : "16"}
                                    fontWeight="900"
                                    alignmentBaseline="middle"
                                    textAnchor="middle"
                                    style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.7)" }}
                                >
                                    {name.length > 14 ? name.substring(0, 12) + "..." : name}
                                </text>
                            </g>
                        </g>
                    );
                })}
                <circle cx="250" cy="250" r="40" fill="#1e293b" stroke="#f59e0b" strokeWidth="8" />
                <polygon points="250,225 258,245 278,245 262,258 268,278 250,265 232,278 238,258 222,245 242,245" fill="#f59e0b" />
            </svg>

            {/* MODAL DE GANADOR GIGANTE */}
            {!spinning && winnerName && rotation > 0 && (
                <div className="absolute inset-0 z-30 flex items-center justify-center animate-in zoom-in fade-in duration-500">
                    <div className="absolute inset-0 bg-slate-950/85 rounded-full backdrop-blur-md"></div>
                    <div className="bg-emerald-500 border-[12px] border-white px-10 py-10 md:px-20 md:py-14 rounded-[3rem] shadow-[0_0_150px_rgba(16,185,129,1)] z-40 transform scale-110 flex flex-col items-center w-[120%] text-center">
                        <span className="text-emerald-100 font-black uppercase tracking-[0.4em] text-sm md:text-xl mb-4">WINNER SELECTED!</span>
                        <h2 className="text-5xl md:text-8xl lg:text-[8rem] leading-none font-black text-white uppercase drop-shadow-2xl">{winnerName}</h2>
                    </div>
                </div>
            )}
        </div>
    );
};

const PublicView = () => {
  const [gameState, setGameState] = useState(null);

  const audioRefBoardsUp = useRef(null);
  const audioRefTimeUp = useRef(null);

  const audioRefRouletteTick = useRef(null);
  const audioRefRouletteWin = useRef(null);

  useEffect(() => {
    if (!audioRefRouletteTick.current) audioRefRouletteTick.current = new Audio('/sounds/tick.mp3');
    if (!audioRefRouletteWin.current) audioRefRouletteWin.current = new Audio('/sounds/win.mp3');

    socket.on('sync_state', (payload) => {
      setGameState(payload);

      if (payload.triggerAudio && audioRefBoardsUp.current) {
        audioRefBoardsUp.current.play().catch(err => console.error("Audio block:", err));
      }

      if (payload.timeLeft === 0 && (payload.phase?.includes('WRITE') || payload.phase?.includes('DICTATION'))) {
        if (audioRefTimeUp.current) {
          audioRefTimeUp.current.play().catch(err => console.error("Audio block:", err));
        }
      }

      if (payload.game === 'ROULETTE_MODE') {
          if (payload.spinning) {
              if(audioRefRouletteTick.current) audioRefRouletteTick.current.play().catch(e=>console.log(e));
          } else if (payload.winnerName && payload.winnerName !== "") {
              if(audioRefRouletteTick.current) {
                  audioRefRouletteTick.current.pause();
                  audioRefRouletteTick.current.currentTime = 0;
              }
              if(audioRefRouletteWin.current) audioRefRouletteWin.current.play().catch(e=>console.log(e));
          }
      }
    });

    socket.on('clear_state', () => {
      setGameState(null);
    });

    return () => {
      socket.off('sync_state');
      socket.off('clear_state');
    };
  }, []);

  // --- FUNCIÓN DE FORMATO MEJORADA (REGLA DE DÍAS DE LA SEMANA) ---
  const formatWord = (word) => {
    if (!word) return "";
    
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    // Quita espacios para validar si la palabra subyacente es un día (ej. si entra "m o n d a y")
    const cleanLower = word.replace(/\s+/g, '').toLowerCase();

    // Regla 1: Si es un día de la semana (normal o revelado)
    if (days.includes(cleanLower)) {
      // Pone en minúscula y capitaliza solo la primera letra real
      return word.toLowerCase().replace(/[a-z]/, match => match.toUpperCase());
    }

    // Regla 2: Si es una palabra revuelta (scramble) enviada por el Admin, 
    // el Admin ya envía la 1ra letra en mayúscula (Ej: "O m n a y d"). La respetamos.
    if (word.includes(" ") && /[A-Z]/.test(word)) {
      return word;
    }

    // Regla 3: Si no es un día y no es un scramble capitalizado, todo a minúsculas
    return word.toLowerCase();
  };

  const SponsorsBanner = () => (
    <footer className="w-full bg-slate-950 border-t-4 border-slate-800/50 py-3 px-6 flex items-center justify-center gap-6 overflow-hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
      <div className="flex items-center gap-2">
        <Star size={16} className="text-amber-500 animate-pulse" />
        <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-xs md:text-sm">Proud Sponsors:</p>
      </div>

      <div className="flex items-center gap-8 md:gap-12 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="text-white font-black text-sm md:text-lg tracking-widest uppercase font-serif">Sponsor 1</span>
        <span className="text-white font-black text-sm md:text-lg tracking-widest uppercase italic">Empresa 2</span>
        <span className="text-white font-black text-xl tracking-widest uppercase">Marca 3</span>
        <span className="text-white font-black text-sm md:text-lg tracking-widest uppercase font-mono">Local 4</span>
      </div>
    </footer>
  );

  if (!gameState || !gameState.game) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0"></div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 min-h-0">
          <div className="w-64 h-64 md:w-96 md:h-96 bg-white rounded-full border-4 border-white/20 flex items-center justify-center mb-6 shadow-[0_0_100px_rgba(255,255,255,0.15)] animate-pulse p-8">
            <img
              src="/img/waiting_img/AmazonIcon.png"
              alt="Amazon English Academy Logo"
              className="w-full h-full object-contain drop-shadow-md scale-115"
              style={{
                filter: "drop-shadow(0px 0px 2px rgba(15,23,42,0.4)) drop-shadow(0px 0px 20px rgba(139,92,246,0.6))"
              }}
            />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white uppercase tracking-[0.3em] text-center drop-shadow-2xl">
            Amazon English Academy
          </h1>
          <p className="text-slate-400 tracking-widest uppercase mt-6 font-black text-lg bg-slate-800/50 px-8 py-2 rounded-full border border-slate-700/50">
            Waiting for broadcast...
          </p>
        </div>
        <SponsorsBanner />
      </div>
    );
  }

  // --- MODO RULETA PÚBLICA ---
  if (gameState.game === 'ROULETTE_MODE') {
      return (
          <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            
            <header className="bg-amber-500 text-amber-950 py-4 px-8 shadow-2xl flex justify-between items-center z-50 shrink-0 border-b-[8px] border-amber-600">
                <div className="flex items-center gap-3">
                <Trophy size={40} className="animate-bounce" />
                <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
                    Amazon English Roulette
                </h1>
                </div>
                <div className="bg-amber-950 text-amber-400 px-6 py-2 rounded-full text-lg font-black uppercase tracking-widest border border-amber-800 shadow-inner">
                  {gameState.rouletteCategory}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-10 relative z-10 w-full overflow-hidden">
                <VisualRoulette 
                    participants={gameState.participants || []} 
                    spinning={gameState.spinning} 
                    winnerName={gameState.winnerName} 
                />
            </main>
            <SponsorsBanner />
          </div>
      )
  }

  // --- MODO JUEGO NORMAL CON COLORES DINÁMICOS Y ELEGANTES ---
  const getThemeBackground = () => {
    switch (gameState.game) {
      case 'KIDS_BOX':
        return 'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900';
      case 'POWER_UP_1':
        return 'bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900';
      case 'POWER_UP_3':
        return 'bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900';
      case 'AMERICAN_THINK':
      case 'AMERICAN_THINK_STARTER':
        return 'bg-gradient-to-br from-orange-900 via-amber-900 to-slate-900';
      case 'GRAND_FINAL':
        return 'bg-gradient-to-br from-amber-900 via-yellow-900 to-slate-900';
      default:
        return 'bg-slate-900';
    }
  };

  const {
    game, round, phase, timeLeft, displayImages, displayWords,
    originalWords, wowSentence, currentIndex, participantNumber, memLevel, imageIndex
  } = gameState;

  const formattedGameName = game.replace(/_/g, ' ');
  const activeImgIdx = imageIndex !== undefined ? imageIndex : (currentIndex !== undefined ? currentIndex : 0);
  const activeWordIdx = currentIndex !== undefined ? currentIndex : 0;

  const getThemeColors = () => {
    switch (game) {
      case 'LITTLE_STEPS':
      case 'KIDS_BOX':
        return { primary: 'bg-emerald-500', headerText: 'text-emerald-100', badgeBg: 'bg-emerald-400/30', badgeBorder: 'border-emerald-300/30', textMain: 'text-emerald-400', textLight: 'text-emerald-200', bgLight: 'bg-emerald-900/40', borderLight: 'border-emerald-500/30', iconColor: 'text-emerald-500' };
      case 'POWER_UP_1':
        return { primary: 'bg-violet-600', headerText: 'text-violet-100', badgeBg: 'bg-violet-400/30', badgeBorder: 'border-violet-300/30', textMain: 'text-violet-400', textLight: 'text-violet-200', bgLight: 'bg-violet-900/40', borderLight: 'border-violet-500/30', iconColor: 'text-violet-500' };
      case 'POWER_UP_3':
        return { primary: 'bg-rose-600', headerText: 'text-rose-100', badgeBg: 'bg-rose-400/30', badgeBorder: 'border-rose-300/30', textMain: 'text-rose-400', textLight: 'text-rose-200', bgLight: 'bg-rose-900/40', borderLight: 'border-rose-500/30', iconColor: 'text-rose-500' };
      case 'AMERICAN_THINK':
      case 'AMERICAN_THINK_STARTER':
        return { primary: 'bg-orange-500', headerText: 'text-orange-100', badgeBg: 'bg-orange-400/30', badgeBorder: 'border-orange-300/30', textMain: 'text-orange-400', textLight: 'text-orange-200', bgLight: 'bg-orange-900/30', borderLight: 'border-orange-500/30', iconColor: 'text-orange-500' };
      case 'GRAND_FINAL':
        return { primary: 'bg-amber-500', headerText: 'text-amber-100', badgeBg: 'bg-amber-400/30', badgeBorder: 'border-amber-300/30', textMain: 'text-amber-400', textLight: 'text-amber-200', bgLight: 'bg-amber-900/40', borderLight: 'border-amber-500/30', iconColor: 'text-amber-500' };
      default:
        return { primary: 'bg-slate-700', headerText: 'text-slate-200', badgeBg: 'bg-white/20', badgeBorder: 'border-white/30', textMain: 'text-slate-400', textLight: 'text-slate-200', bgLight: 'bg-slate-800/50', borderLight: 'border-slate-700/50', iconColor: 'text-slate-500' };
    }
  };

  const theme = getThemeColors();

  const getSkillsDescription = () => {
    if (game === 'GRAND_FINAL') return "Elite Skills: Rapid Continuous Spell & Blind Memory Recall";
    if (game === 'LITTLE_STEPS') {
      if (round === 1) return "Skills: Vocabulary Recognition & Speed Response";
      if (round === 2) return "Skills: Visual Memory & Short-term Retention";
      if (round === 3) return "Skills: Teamwork, Listening & Fast Recall";
    }
    if (game === 'KIDS_BOX') {
      if (round === 1) return "Skills: Image Recognition, Reading & Spelling";
      if (round === 2) return "Skills: Reading Speed & Visual Memory";
      if (round === 3) return "Skills: Parent & Child Teamwork, Listening & Accuracy";
    }
    if (game === 'POWER_UP_1') {
      if (round === 1) return "Skills: Pronunciation, Spelling & Sentence Formation";
      if (round === 2) return "Skills: Unscrambling, Grammar & Dictation Accuracy";
      if (round === 3) return "Skills: Speed Reading & Fluency";
    }
    if (game === 'POWER_UP_3') {
      if (round === 1) return "Skills: Reading & Listening Comprehension";
      if (round === 2) return "Skills: Scramble & Dictation Precision";
      if (round === 3) return "Skills: Speed Reading & Memory Recall";
    }
    if (game.includes('AMERICAN_THINK')) {
      if (round === 1) return "Skills: Listening Comprehension & Spelling";
      if (round === 2) return "Skills: Word Unscrambling & Sentence Dictation";
      if (round === 3) return "Skills: Speed Reading & Memory Recall";
      if (round === 4) return "Skills: Rapid Spelling & Blind Sentence Recall";
    }
    return "English Skills Assessment";
  };

  const getStandbyMessage = () => {
    if (phase === 'READY') return "Get Ready for the Next Challenge!";
    if (phase === 'PAUSE_BEFORE_SPEED') return "Prepare for Speed Challenge! Be Fast!";
    if (phase === 'PAUSE_BEFORE_WORDS') return "Get Ready to Read & Spell!";
    if (phase === 'PAUSE_BEFORE_WORD2') return "Next Word: Read, Spell & Sentence!";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE' || phase.startsWith('PAUSE_BEFORE_SCRAMBLE')) return "Look at the Screen! Memorize the Word!";
    if (phase === 'PAUSE_BEFORE_SPEED_WORDS') return "Get Ready for Speed Words!";
    if (phase.includes('PAUSE_BEFORE_MEMORY')) return `Get Ready for Memory Level ${memLevel}!`;
    if (phase.includes('PAUSE_WOW')) return "Prepare for the WOW Moment!";
    if (phase.includes('REVEAL')) return "Revealing the correct word...";
    return "Waiting for judge's cue...";
  };

  const getEncouragingMessage = () => {
    if (phase.includes('SPEED')) return "Stay calm and focus! You are fast! ⚡";
    if (phase.includes('DICTATION') || phase.includes('LISTEN')) return "Listen carefully! You can do it! 🎧";
    if (phase.includes('SCRAMBLE')) return "Look closely! Mind power activated! 🧠";
    if (phase.includes('MEMORY')) return "Photographic memory ready! 📸";
    if (phase.includes('WOW')) return "This is your moment to shine! ⭐";
    return "Believe in yourself! You got this! 🌟";
  };

  const getParticipantText = () => {
    if (game === 'GRAND_FINAL') return `GRAND FINALIST #${participantNumber || "..."}`;
    if (participantNumber === 'GROUP ACTIVITY') {
       return `GROUP ACTIVITY`; 
    }
    return `Participant #${participantNumber || "..."}`;
  };

  const isListeningOrDictationPause = phase.includes('TURN_AROUND') || phase.includes('LISTEN') || phase.startsWith('PAUSE_DICTATION') || phase === 'WOW_BLIND';
  const isAnySpeedReading = phase.includes('SPEED_READING') || phase === 'RAPID_SPELL';

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">

      {/* HEADER */}
      <header className={`${theme.primary} text-white py-2 px-6 shadow-xl flex justify-between items-center z-50 shrink-0 transition-colors duration-500`}>
        
        <div className="flex items-center gap-0">
          <img 
            src="/img/waiting_img/AmazonStar.png" 
            alt="Amazon Star" 
            className="w-20 h-20 md:w-20 md:h-30 object-contain drop-shadow-sm -mr-3 scale-[1.80]" 
          />
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter drop-shadow-md">
            Amazon English Academy
          </h1>
        </div>
        
        <div className={`${theme.badgeBg} px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border ${theme.badgeBorder} shadow-sm`}>
          {formattedGameName}
        </div>
      </header>

      {/* INFO BAR */}
      <div className="w-full flex justify-between items-center py-3 px-8 bg-white border-b shadow-md shrink-0">
        <div className="space-y-1">
          <p className={`text-lg md:text-xl font-black ${theme.textMain} uppercase tracking-widest flex items-center gap-2 drop-shadow-sm`}>
            <span className={`w-2 h-2 ${theme.primary} rounded-full animate-pulse shadow-lg`}></span>
            Round {round} — {getParticipantText()}
          </p>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">
            {phase.replace(/_/g, ' ')}
            {memLevel && phase !== 'READY' && !phase.includes('PAUSE') && <span className={`${theme.textMain} ml-3`}>Level {memLevel}</span>}
          </h2>
          <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest">
            {getSkillsDescription()}
          </p>
        </div>

        <div className={`px-6 py-2 rounded-[1.5rem] border-4 transition-all shadow-xl ${timeLeft > 0 && timeLeft <= 3 ? 'bg-red-50 border-red-500 scale-105' : 'bg-slate-900 border-slate-700'}`}>
          <span className={`text-4xl md:text-5xl font-mono font-black tabular-nums ${timeLeft > 0 && timeLeft <= 3 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
            {timeLeft}<span className="text-2xl ml-1">s</span>
          </span>
        </div>
      </div>

      <main className={`flex-1 flex items-center justify-center p-4 md:p-6 min-h-0 relative ${getThemeBackground()} transition-colors duration-1000`}>

        {/* VISTA DE TABLA DE SPEED READING */}
        {isAnySpeedReading && displayWords?.length > 0 ? (
          <div className="w-full h-full flex flex-col items-center animate-in zoom-in duration-500">
            <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-sm px-6 py-2 rounded-full border-4 border-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-4 z-10 shrink-0">
              <span className="text-white font-black tracking-widest uppercase text-sm leading-none">{phase === 'RAPID_SPELL' ? 'RAPID SPELL' : 'READING SENSE'}</span>
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
            </div>

            <div className="flex-1 w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-[2rem] border-[12px] border-slate-800/90 flex flex-col shadow-2xl overflow-hidden min-h-0 p-4 md:p-6">
              <div className={`w-full h-full grid grid-cols-5 ${displayWords.length > 40 ? 'grid-rows-10 gap-1 md:gap-2' : 'grid-rows-8 gap-2 md:gap-3'}`}>
                {displayWords.map((word, i) => (
                  <div key={`speed-${i}`} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-1 md:p-2 flex items-center gap-2 md:gap-3 shadow-sm hover:border-slate-300 transition-colors">
                    <span className={`${theme.primary} text-white w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center font-black text-sm md:text-lg shadow-md shrink-0`}>
                      {i + 1}
                    </span>
                    <span className="text-xs md:text-xl font-black text-slate-800 truncate leading-none tracking-tight">
                      {formatWord(word)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (

          /* MARCO OSCURO PRINCIPAL PARA EL RESTO DE FASES */
          <div className="w-full h-full max-w-7xl bg-slate-900/90 backdrop-blur-md rounded-[2rem] border-[12px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">

            <div key={`${phase}-${activeWordIdx}-${activeImgIdx}`} className="w-full h-full flex flex-col items-center justify-center animate-in slide-in-from-right-12 fade-in duration-300">

              {/* READY Y PAUSAS */}
              {(phase === 'READY' || phase.startsWith('PAUSE')) && (
                <div className="text-center space-y-6 flex flex-col items-center w-full px-4">

                  <div className="flex items-center justify-center mx-auto relative mb-4 w-full animate-slow-pulse">
                    <div className="absolute inset-0 scale-[3] rounded-full blur-3xl bg-purple/5 opacity-60"></div>
                    <img
                      src="/img/waiting_img/AmazonStar.png"
                      alt="Amazon English Academy Star"
                      className="w-24 h-24 md:w-40 md:h-40 object-contain relative z-10 scale-[1.3]"
                      style={{
                        filter: "drop-shadow(0px 2px 8px rgba(220, 222, 238, 0.67)) drop-shadow(0px 0px 18px rgba(214, 31, 199, 0.86))"
                      }}
                    />
                  </div>

                  <h3 className="text-white font-black text-4xl md:text-5xl uppercase tracking-[0.3em] drop-shadow-xl text-center">
                    {phase === 'READY' ? 'SYSTEM READY' : 'STANDBY'}
                  </h3>

                  {isListeningOrDictationPause && (
                    <div className="space-y-4 flex flex-col items-center w-full max-w-3xl">
                      <h2 className={`text-2xl md:text-3xl lg:text-4xl ${theme.textLight} font-black uppercase tracking-widest animate-pulse bg-slate-800/80 px-8 py-4 rounded-full border border-slate-700 text-center leading-tight drop-shadow-md`}>
                        {phase === 'PAUSE_DICTATION_SENTENCE' ? '"Turn Around & Listen to the Sentence"' :
                          phase === 'PAUSE_DICTATION_SPELLING' ? '"Turn Around & Listen Letter by Letter"' :
                            '"Turn Around & Listen to the Judge"'}
                      </h2>
                    </div>
                  )}

                  {!isListeningOrDictationPause && (
                    <div className="flex flex-col items-center space-y-4">
                      <p className={`${theme.textLight} font-bold tracking-widest uppercase text-xl ${theme.bgLight} py-3 px-8 rounded-full border ${theme.borderLight} shadow-lg animate-pulse`}>
                        {getStandbyMessage()}
                      </p>
                    </div>
                  )}

                  {phase !== 'READY' && (
                    <div className="mt-8">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-400 font-black text-xl md:text-2xl uppercase tracking-[0.2em] drop-shadow-lg text-center px-4">
                        {getEncouragingMessage()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* FASE 2: MOMENTO WOW - PASO 1 (MOSTRAR A AMBOS) */}
              {phase === 'WOW_SHOW' && wowSentence && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
                  <h3 className="text-5xl font-black text-amber-400 uppercase tracking-widest text-center drop-shadow-md">MEMORIZE THE SENTENCE!</h3>
                  <div className="w-[95%] max-w-5xl bg-slate-800 px-6 py-12 rounded-[2rem] border-8 border-amber-400 shadow-inner flex items-center justify-center">
                    <h1 className="text-5xl md:text-6xl font-black text-white text-center leading-relaxed break-words">
                      {wowSentence}
                    </h1>
                  </div>
                  <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest animate-pulse shadow-lg">
                    You have {timeLeft}s to look
                  </div>
                </div>
              )}

              {/* GIRO DE ESTUDIANTE (PANTALLA "OFF") */}
              {phase === 'WOW_BLIND' && (
                <div className="text-center space-y-8">
                  <EyeOff size={150} className="text-rose-500 mx-auto animate-pulse drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
                  <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic drop-shadow-xl">TURN AROUND!</h2>
                  <p className="text-slate-300 text-3xl font-bold uppercase tracking-widest bg-slate-800 py-4 px-10 rounded-full inline-block border border-slate-700 shadow-lg">The screen is now OFF for you</p>
                </div>
              )}

              {/* MOMENTO WOW - DELETREO PÚBLICO (PROYECTAR SOLO PÚBLICO) */}
              {phase === 'WOW_PUBLIC' && wowSentence && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
                  <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Trophy size={50} className="animate-pulse" />
                    <h3 className="text-4xl font-black uppercase tracking-[0.2em] text-center drop-shadow-md">WOW MOMENT</h3>
                  </div>
                  <div className="w-[95%] max-w-5xl px-6 py-12 rounded-[2.5rem] border-8 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-slate-950 border-amber-400 flex items-center justify-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white text-center leading-relaxed break-words">
                      {wowSentence}
                    </h1>
                  </div>
                  <div className="bg-amber-400 text-amber-950 px-10 py-5 rounded-full font-black text-2xl uppercase tracking-widest shadow-xl animate-pulse">
                    Validate: Uppercase, Spaces & Punctuation
                  </div>
                </div>
              )}

              {/* IMÁGENES */}
              {['PICTURE_ID', 'SPEED_CHALLENGE', 'SPEED_IMAGES', 'PARENT_CHILD'].includes(phase) && displayImages?.length > 0 && (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
                  <img
                    key={`img-${activeImgIdx}`}
                    src={phase.includes('SPEED') ? displayImages[0] : displayImages[activeImgIdx]}
                    className="max-h-full rounded-2xl border-8 border-white shadow-2xl object-contain animate-in slide-in-from-right-8 fade-in duration-300"
                    alt="Recognition"
                  />
                  <div className={`absolute top-6 right-6 ${theme.primary} text-white px-5 py-2 rounded-full font-black shadow-lg`}>
                    IMAGE {(['SPEED_CHALLENGE', 'SPEED_IMAGES'].includes(phase) ? 0 : activeImgIdx) + 1}
                  </div>
                </div>
              )}

              {/* PALABRAS ÚNICAS */}
              {['WORD_1', 'WORD_2_SENTENCE', 'READ_SPELL', 'SPEED_WORDS', 'READING_WORDS', 'LISTENING_1', 'LISTENING_2', 'LISTEN_SPELL'].includes(phase) && displayWords?.length > 0 && (
                <div className="w-full h-full flex flex-col items-center justify-between py-10 px-8">
                  <div className="flex-1 flex items-center justify-center">
                    <h1 key={`word-${activeWordIdx}`} className="text-[10vw] font-black text-white tracking-[0.05em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] text-center leading-none animate-in slide-in-from-right-8 fade-in duration-300">
                      {formatWord(['SPEED_WORDS'].includes(phase) ? displayWords[0] : displayWords[activeWordIdx])}
                    </h1>
                  </div>
                  {['WORD_1', 'WORD_2_SENTENCE', 'READ_SPELL', 'LISTEN_SPELL'].includes(phase) && (
                    <div className={`w-full max-w-3xl ${theme.bgLight} border ${theme.borderLight} py-4 rounded-2xl backdrop-blur-md shadow-xl animate-bounce`}>
                      <p className={`${theme.textLight} text-2xl font-black text-center uppercase tracking-[0.15em] italic`}>
                        {(phase === 'WORD_1' || phase === 'LISTEN_SPELL') ? "Repeat ➜ Spell ➜ Repeat" :
                          (phase === 'WORD_2_SENTENCE') ? "Repeat ➜ Spell ➜ Repeat ➜ Sentence" : "Read → Spell → Read"}
                      </p>
                    </div>
                  )}
                  {phase === 'READING_WORDS' && (
                    <div className={`w-full max-w-3xl ${theme.bgLight} border ${theme.borderLight} py-4 rounded-2xl backdrop-blur-md shadow-xl`}>
                      <p className={`${theme.textLight} text-2xl font-black text-center uppercase tracking-[0.15em] italic`}>Read Aloud!</p>
                    </div>
                  )}
                  {['LISTENING_1', 'LISTENING_2'].includes(phase) && (
                    <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest shadow-xl text-center animate-bounce">
                      {game === 'POWER_UP_3' ? "Repeat ➜ Spell ➜ Repeat ➜ Sentence (6+ words)" :
                        `Repeat ➜ Spell ➜ Repeat ${phase === 'LISTENING_2' ? "➜ Sentence" : ""}`}
                    </div>
                  )}
                </div>
              )}

              {/* DICTADO / ESCRITURA DINÁMICA */}
              {(phase.includes('WRITE') || phase.includes('DICTATION')) && !phase.includes('BOARDS') && !phase.includes('PAUSE') && (
                <div className="text-center space-y-8 animate-pulse flex flex-col items-center w-full px-4">
                  <Edit3 size={150} className="text-amber-400 mx-auto drop-shadow-xl" />
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-amber-400 uppercase italic tracking-tighter text-center leading-tight drop-shadow-[0_10px_30px_rgba(245,158,11,0.4)]">
                    {phase.includes('SCRAMBLED') ? 'WRITE FAST!' :
                      phase === 'DICTATION_SENTENCE' ? 'SENTENCE DICTATION!' :
                        phase === 'DICTATION_SPELLING' ? 'LETTER BY LETTER!' : 'LISTEN & WRITE!'}
                  </h1>
                  <p className="text-white text-2xl md:text-3xl font-bold uppercase tracking-widest bg-slate-800 py-3 px-8 rounded-full border border-slate-700 inline-block shadow-2xl">Keep boards down</p>
                </div>
              )}

              {/* BOARDS UP UNIVERSAL (GIGANTE) */}
              {phase.includes('BOARDS_UP') && (
                <div className="text-center p-8 space-y-10">
                  <h3 className="text-[10rem] font-black text-amber-400 uppercase tracking-tighter italic animate-bounce leading-none drop-shadow-[0_20px_40px_rgba(245,158,11,0.5)]">
                    BOARDS UP!
                  </h3>
                  <div className="bg-white text-slate-900 px-16 py-6 rounded-full font-black text-5xl uppercase shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                    TURN AROUND!
                  </div>
                </div>
              )}

              {/* SCRAMBLE VIEW (MUESTRA LA PALABRA REVUELTA 1 POR 1) */}
              {/* SE QUITÓ LA LÓGICA QUE MOSTRABA VARIAS PALABRAS A LA VEZ */}
              {['SCRAMBLED', 'SCRAMBLED_VIEW'].includes(phase) && displayWords?.length > 0 && (
                <div className="flex flex-col items-center justify-center h-full w-full gap-4 md:gap-6 px-4">
                  <p className={`${theme.textLight} font-black text-xl md:text-2xl tracking-[0.4em] animate-pulse ${theme.bgLight} py-2 px-6 rounded-full border ${theme.borderLight} shadow-lg inline-block mb-2 shrink-0`}>
                    MEMORIZE SCRAMBLE!
                  </p>
                  <div className="flex flex-col items-center justify-center gap-4 md:gap-8 w-full flex-1 min-h-0 pb-10">
                      {/* AHORA SIEMPRE MUESTRA SOLO LA PALABRA DEL TURNO ACTUAL */}
                      <h1 key={`scramble-${activeWordIdx}`} className="text-[10vw] leading-none font-black text-white tracking-[0.4em] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] text-center animate-in slide-in-from-right-8 fade-in duration-300">
                          {formatWord(displayWords[activeWordIdx])}
                      </h1>
                  </div>
                </div>
              )}

              {/* SCRAMBLE REVEAL */}
              {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
                <div className="flex flex-col items-center justify-center h-full w-full gap-4 md:gap-8 animate-in zoom-in duration-500 px-4 py-6">
                  <div className="bg-emerald-500/20 px-8 py-2 md:py-3 rounded-full border border-emerald-500/30 shrink-0 shadow-lg mb-2">
                    <p className="text-emerald-400 font-black text-xl md:text-2xl lg:text-3xl tracking-[0.4em] uppercase text-center drop-shadow-sm">
                      {originalWords.length > 1 ? 'CORRECT WORDS' : 'CORRECT WORD'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full flex-1 min-h-0 pb-6">
                    {/* EN LA VISTA PÚBLICA SE DEBEN VER TODAS LAS ORIGINALES EN EL REVEAL JUNTAS */}
                    {originalWords.map((word, idx) => {
                       const textSizeClass = originalWords.length > 2 
                          ? 'text-5xl md:text-7xl lg:text-[5vw]' 
                          : 'text-6xl md:text-8xl lg:text-[7vw]';
                       return (
                          <h1 key={idx} className={`${textSizeClass} leading-none font-black text-white tracking-[0.1em] text-center drop-shadow-[0_10px_40px_rgba(16,185,129,0.6)]`}>
                            {formatWord(word)}
                          </h1>
                       );
                    })}
                  </div>
                </div>
              )}

              {/* SPELL LAST WORD / STOP */}
              {['SPELL_LAST_WORD_1', 'SPELL_LAST_WORD_2', 'STOP_RECALL'].includes(phase) && (
                <div className="text-center p-10 flex flex-col items-center justify-center h-full w-full">
                  <h3 className="text-[10rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_60px_rgba(239,68,68,0.8)] leading-none">STOP!</h3>

                  <div className="bg-slate-800/90 px-12 py-8 rounded-[3rem] border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-12 w-11/12 max-w-5xl">
                    <p className="text-white font-black tracking-widest uppercase text-4xl md:text-5xl drop-shadow-lg">
                      Recall LAST word ➔ Say, Spell, Say, Sentence
                    </p>
                  </div>

                  <div className="mt-8 bg-slate-900 py-3 px-10 rounded-[2rem] border border-rose-500/30 shadow-xl">
                    <p className="text-rose-400 font-black text-2xl md:text-3xl uppercase tracking-widest drop-shadow-md">
                      (Sentence must be 6+ words)
                    </p>
                  </div>
                </div>
              )}

              {/* FINAL / CIERRE */}
              {['CONTEST_CLOSING', 'FINISHED'].includes(phase) && (
                <div className="text-center space-y-6">
                  <Trophy size={140} className="text-amber-400 mx-auto drop-shadow-[0_0_80px_rgba(251,191,36,0.8)] animate-pulse" />
                  <h1 className="text-[5vw] font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                    {game === 'GRAND_FINAL' ? 'GRAND CHAMPION DECLARED!' : 'CONTEST COMPLETED'}
                  </h1>
                  <p className={`${theme.textLight} font-black text-3xl tracking-[0.3em] uppercase mt-8 drop-shadow-lg`}>Amazon English Academy</p>
                </div>
              )}

            </div>
          </div>
        )}
      </main>

      <SponsorsBanner />

    </div>
  );
};

export default PublicView;