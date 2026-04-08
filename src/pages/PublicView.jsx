import { useState, useEffect, useRef } from 'react';
import { Award, Type, Monitor, Star, ArrowRight, Trophy, EyeOff, Brain, Camera, Users, Zap, Edit3 } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

// OBJETO MAESTRO DE REGLAS (ESTRUCTURA DETALLADA POR FASES)
const ALL_GAME_RULES = {
  "LITTLE_STEPS": {
    name: "Little Steps Challenge",
    rounds: {
      1: { title: "Recognition & Speed", phases: [
        { name: "Phase 1: Picture ID", desc: "Identify the object shown in the image clearly." },
        { name: "Phase 2: Speed Images", desc: "Name the sequence of images as fast as possible." }
      ]},
      2: { title: "Memory", phases: [
        { name: "Phase 1: Visual Retention", desc: "Memorize the set of images and name them after they disappear." }
      ]},
      3: { title: "Teamwork", phases: [
        { name: "Phase 1: Parent & Child", desc: "Students follow the judge's physical or verbal instructions." }
      ]}
    }
  },
  "KIDS_BOX": {
    name: "Kids Box Contest",
    rounds: {
      1: { title: "Recognition", phases: [
        { name: "Phase 1: Image ID", desc: "Identify the image clearly." },
        { name: "Phase 2: Spelling", desc: "Read the word, spell it, and read it again." }
      ]},
      2: { title: "Speed & Memory", phases: [
        { name: "Phase 1: Speed Images", desc: "Name the sequence of images rapidly." },
        { name: "Phase 2: Speed Words", desc: "Read the list of words as fast as possible." },
        { name: "Phase 3: Memory Recall", desc: "Memorize images and name them when they disappear." }
      ]},
      3: { title: "Interaction", phases: [
        { name: "Phase 1: Parent & Child", desc: "Listening comprehension activity involving both student and parent." }
      ]}
    }
  },
  "POWER_UP_1": {
    name: "Power Up 1 Tournament",
    rounds: {
      1: { title: "Formation", phases: [
        { name: "Phase 1: Image Recognition", desc: "Identify the object shown on screen." },
        { name: "Phase 2: Spell & Sentence", desc: "Read the word, spell it, and create a 5+ word sentence." }
      ]},
      2: { title: "Board Challenge", phases: [
        { name: "Phase 1: Scramble", desc: "Unscramble words and write them correctly." },
        { name: "Phase 2: Dictation", desc: "Write dictated sentences and letter-by-letter words on the board." }
      ]},
      3: { title: "Speed", phases: [
        { name: "Phase 1: Speed Reading", desc: "Execute a high-speed reading of the vocabulary pool." }
      ]}
    }
  },
  "POWER_UP_3": {
    name: "Power Up 3 Championship",
    rounds: {
      1: { title: "Reading & Auditory", phases: [
        { name: "Phase 1: Reading", desc: "Read 3 words clearly and accurately." },
        { name: "Phase 2: Listen & Spell", desc: "Listen, repeat, spell, repeat, and create a 6+ word sentence." }
      ]},
      2: { title: "Board Challenge", phases: [
        { name: "Phase 1: Group Scramble", desc: "Collaborative unscrambling on the board." },
        { name: "Phase 2: Dictation Mastery", desc: "Sentence dictation and letter-by-letter spelling with strict punctuation." }
      ]},
      3: { title: "Speed & Recall", phases: [
        { name: "Phase 1: Speed Reading", desc: "Read words sequentially as fast as possible." },
        { name: "Phase 2: Last Word Recall", desc: "Remember the last word, spell it, and make a sentence." }
      ]}
    }
  },
  "AMERICAN_THINK_STARTER": {
    name: "American Think Challenge",
    rounds: {
      1: { title: "Listening", phases: [
        { name: "Phase 1: Spelling", desc: "Listen carefully to the judge and spell the hidden word." },
        { name: "Phase 2: Sentence", desc: "Create a detailed sentence using the provided vocabulary." }
      ]},
      2: { title: "Board Mastery", phases: [
        { name: "Phase 1: Scramble", desc: "Solve scrambled words as a group." },
        { name: "Phase 2: Dictation", desc: "Sentence dictation focusing on punctuation and spelling." }
      ]},
      3: { title: "WOW Moment", phases: [
        { name: "Phase 1: Speed Reading", desc: "High-speed continuous reading." },
        { name: "Phase 2: Blind Recall", desc: "Blind recall of complex sentences after a brief visualization." }
      ]}
    }
  },
  "GRAND_FINAL": {
    name: "The Grand Final (Elite)",
    rounds: {
      4: { title: "Elite Challenge", phases: [
        { name: "Phase 1: Rapid Spell", desc: "Continuous rapid fire spelling without pauses. Every letter counts." },
        { name: "Phase 2: WOW Moment", desc: "Memorization and blind recall of complex long sentences." }
      ]}
    }
  }
};

const VisualRoulette = ({ participants, spinning, winnerName }) => {
    const [rotation, setRotation] = useState(0);
    const prevWinner = useRef("");

    useEffect(() => {
        if (spinning && winnerName && winnerName !== prevWinner.current && participants.length > 0) {
            const winIndex = participants.indexOf(winnerName);
            if (winIndex !== -1) {
                const total = participants.length;
                const sliceAngle = 360 / total;
                const targetCenter = (winIndex * sliceAngle) + (sliceAngle / 2);
                const offset = (360 - targetCenter) + 270; 
                const currentMod = rotation % 360;
                const nextRotation = rotation - currentMod + 2160 + offset;

                setRotation(nextRotation);
                prevWinner.current = winnerName;
            }
        }
    }, [spinning, winnerName, participants, rotation]);

    const colors = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1"];

    return (
        <div className="relative w-[380px] h-[380px] md:w-[750px] md:h-[750px] flex items-center justify-center animate-in zoom-in duration-500">
            <div className="absolute left-[-45px] z-50 flex items-center">
                <div className="w-0 h-0 border-t-[30px] border-b-[30px] border-l-[50px] border-t-transparent border-b-transparent border-l-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.8)]"></div>
                <div className="w-3 h-20 bg-rose-500 rounded-full blur-[2px] -ml-1"></div>
            </div>

            <svg viewBox="0 0 500 500" 
                className="w-full h-full rounded-full shadow-[0_0_80px_rgba(0,0,0,0.6)] border-[15px] border-slate-800 bg-slate-900"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 6s cubic-bezier(0.1, 0.8, 0.2, 1)' : 'none'
                }}>
                {participants.map((name, i) => {
                    const total = participants.length;
                    const sliceAngle = 360 / total;
                    const startAngle = i * sliceAngle;
                    const midAngle = startAngle + sliceAngle / 2;

                    const startRad = (startAngle - 90) * Math.PI / 180;
                    const endRad = ((i + 1) * sliceAngle - 90) * Math.PI / 180;

                    const x1 = 250 + 240 * Math.cos(startRad);
                    const y1 = 250 + 240 * Math.sin(startRad);
                    const x2 = 250 + 240 * Math.cos(endRad);
                    const y2 = 250 + 240 * Math.sin(endRad);

                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const d = `M 250 250 L ${x1} ${y1} A 240 240 0 ${largeArc} 1 ${x2} ${y2} Z`;

                    return (
                        <g key={i}>
                            <path d={d} fill={colors[i % colors.length]} stroke="#1e293b" strokeWidth="1" />
                            <g transform={`translate(250, 250) rotate(${midAngle - 90}) translate(140, 0)`}>
                                <text
                                    fill="#ffffff"
                                    fontWeight="900"
                                    alignmentBaseline="middle"
                                    textAnchor="middle"
                                    style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.8)" }}
                                    fontSize={total > 40 ? "6" : total > 25 ? "8" : total > 15 ? "12" : "16"}
                                >
                                    {total > 30 && name.length > 10 ? name.substring(0, 8) + ".." : name}
                                </text>
                            </g>
                        </g>
                    );
                })}
                <circle cx="250" cy="250" r="40" fill="#1e293b" stroke="#f59e0b" strokeWidth="8" />
            </svg>

            {!spinning && winnerName && rotation > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-700 pointer-events-none">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></div>
                    <div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 border-[10px] border-white rounded-[3rem] shadow-[0_0_80px_rgba(16,185,129,0.6)] flex flex-col items-center justify-center text-center p-8 md:p-14 w-full max-w-3xl transform scale-100 pointer-events-auto">
                        <Trophy size={80} className="text-white mb-4 animate-bounce" />
                        <span className="text-emerald-100 font-black uppercase tracking-[0.4em] text-lg md:text-xl">WINNER SELECTED!</span>
                        <h2 className="text-4xl md:text-7xl font-black text-white uppercase leading-tight mt-2 mb-6">{winnerName}</h2>
                        <div className="bg-white/20 px-8 py-3 rounded-full border border-white/30 text-white text-lg font-bold uppercase tracking-widest">
                            Congratulations! 🌟
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const PublicView = () => {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on('sync_state', (payload) => {
      if (payload.game === 'SHOW_RULES') {
        setGameState({
          game: payload.category,
          phase: 'SHOW_RULES', 
          branch: payload.branch
        });
      } else {
        setGameState(payload);
      }
    });

    const bc = new BroadcastChannel('amazon_game_channel');
    bc.onmessage = (event) => {
      if (event.data.payload) {
        setGameState(event.data.payload);
      }
    };

    socket.on('clear_state', () => {
      setGameState(null); 
    });

    return () => {
      socket.off('sync_state');
      socket.off('clear_state');
      bc.close(); 
    };
  }, []);

  const getRules = (gameName) => {
    if (!gameName) return null;
    if (ALL_GAME_RULES[gameName]) return ALL_GAME_RULES[gameName];
    
    const normalized = gameName.toString().replace(/\s+/g, '_').toUpperCase();
    if (ALL_GAME_RULES[normalized]) return ALL_GAME_RULES[normalized];
    
    const foundKey = Object.keys(ALL_GAME_RULES).find(key => key.includes(normalized) || normalized.includes(key));
    if (foundKey) return ALL_GAME_RULES[foundKey];
    
    return null;
  };

  const formatWord = (word) => {
    if (!word) return "";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const cleanLower = word.replace(/\s+/g, '').toLowerCase();

    if (days.includes(cleanLower)) {
      return word.toLowerCase().replace(/[a-z]/, match => match.toUpperCase());
    }

    if (word.includes(" ") && /[A-Z]/.test(word)) {
      return word;
    }

    return word.toLowerCase();
  };

  const isRoulette = gameState?.game === 'ROULETTE_MODE';
  const hasActiveGame = !!gameState?.game && (!!gameState?.phase || isRoulette);
  const isShowingRules = hasActiveGame && gameState?.phase === 'SHOW_RULES';

  if (isRoulette) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden relative">
        <main className="flex-1 flex items-center justify-center p-10 z-10">
          <VisualRoulette 
            participants={gameState.participants || []}
            spinning={gameState.spinning}
            winnerName={gameState.winnerName}
          />
        </main>
        <SponsorsBanner />
      </div>
    );
  }

  // PANTALLA DE ESPERA ESTRICTA
  if (!hasActiveGame) {
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0"></div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="w-64 h-64 md:w-96 md:h-96 bg-white rounded-full border-4 border-white/20 flex items-center justify-center mb-6 shadow-[0_0_100px_rgba(255,255,255,0.15)] animate-pulse p-8">
            <img src="/img/waiting_img/AmazonIcon.png" alt="Logo" className="w-full h-full object-contain scale-115" />
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

  // PANTALLA DE REGLAS (AJUSTADA: MEDIANAMENTE GRANDE, ELEGANTE)
  if (isShowingRules) {
    const rules = getRules(gameState.game);
    const roundCount = rules ? Object.keys(rules.rounds).length : 0;
    
    return (
      <div className="h-screen w-screen bg-slate-900 flex flex-col font-sans overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 z-0"></div>
        <main className="flex-1 flex items-center justify-center p-4 md:p-12 relative z-10">
          {rules ? (
            // AJUSTE: w-[90vw] y max-w-[1400px] para que no ocupe todo el espacio
            <div className="relative bg-white border-[10px] md:border-[12px] border-amber-500 rounded-[3rem] shadow-[0_0_150px_rgba(245,158,11,0.5)] w-[90vw] max-w-[1400px] p-6 md:p-8 flex flex-col items-center animate-in zoom-in duration-500">
              {/* AJUSTE: text-2xl md:text-4xl (un poco más pequeño) */}
              <div className="bg-slate-900 text-white px-8 md:px-12 py-3 md:py-4 rounded-t-[2rem] md:rounded-t-[2.5rem] font-black uppercase tracking-widest text-2xl md:text-4xl -mt-16 md:-mt-20 mb-8 shadow-2xl border-x-4 border-t-4 border-amber-500 text-center">
                {rules.name}
              </div>
              
              {/* DISEÑO EN COLUMNAS (Se autoajusta al contenedor más pequeño) */}
              <div className={`w-full grid gap-4 md:gap-6 mt-2 ${roundCount >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-3xl mx-auto'}`}>
                {Object.entries(rules.rounds).map(([num, data], i) => (
                  <div key={num} className="flex flex-col items-start animate-in slide-in-from-bottom duration-500 h-full w-full" style={{ transitionDelay: `${i * 150}ms` }}>
                    {/* AJUSTE: text-lg md:text-2xl y px/py reducidos */}
                    <div className="bg-amber-500 text-amber-950 px-6 py-2 rounded-t-xl font-black uppercase text-lg md:text-2xl border-2 border-b-0 border-slate-900 z-10">
                      ROUND {num}: {data.title}
                    </div>
                    {/* AJUSTE: p-4 md:p-6 (más compacto) */}
                    <div className="w-full bg-slate-50 border-4 border-slate-900 rounded-[1.5rem] rounded-tl-none p-4 md:p-6 shadow-lg flex flex-col gap-3 h-full justify-start -mt-2">
                      {data.phases.map((ph, j) => (
                         // AJUSTE: p-4 y gap reducidos
                         <div key={j} className="flex flex-col gap-2 items-center w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                            {/* AJUSTE: text-sm md:text-lg */}
                            <div className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg font-black text-sm md:text-lg uppercase tracking-widest shrink-0 text-center">
                              {ph.name}
                            </div>
                            {/* AJUSTE: text-lg md:text-xl lg:text-2xl (fuente mediana grande, legible) */}
                            <p className="text-slate-700 text-lg md:text-xl lg:text-2xl font-bold leading-tight">
                              {ph.desc}
                            </p>
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center animate-pulse">
                <p className="text-amber-400 text-4xl font-black uppercase tracking-widest">Rules format mismatch</p>
                <p className="text-slate-400 mt-2">Cannot find rules for category: "{gameState.game}"</p>
            </div>
          )}
        </main>
        <SponsorsBanner />
      </div>
    );
  }

  const getThemeBackground = () => {
    const normalizedGame = gameState.game?.replace(/\s+/g, '_').toUpperCase();
    switch (normalizedGame) {
      case 'KIDS_BOX': return 'bg-gradient-to-br from-teal-900 via-emerald-900 to-slate-900';
      case 'POWER_UP_1': return 'bg-gradient-to-br from-violet-900 via-purple-900 to-slate-900';
      case 'POWER_UP_3': return 'bg-gradient-to-br from-rose-900 via-pink-900 to-slate-900';
      case 'AMERICAN_THINK':
      case 'AMERICAN_THINK_STARTER': return 'bg-gradient-to-br from-orange-900 via-amber-900 to-slate-900';
      case 'GRAND_FINAL': return 'bg-gradient-to-br from-amber-900 via-yellow-900 to-slate-900';
      default: return 'bg-slate-900';
    }
  };

  const {
    game, round, phase, timeLeft, displayImages, displayWords,
    originalWords, wowSentence, currentIndex, participantNumber, memLevel, imageIndex
  } = gameState || {};

  const formattedGameName = (game || '').replace(/_/g, ' ');
  const activeImgIdx = imageIndex !== undefined ? imageIndex : (currentIndex !== undefined ? currentIndex : 0);
  const activeWordIdx = currentIndex !== undefined ? currentIndex : 0;

  const getThemeColors = () => {
    const normalizedGame = game?.replace(/\s+/g, '_').toUpperCase();
    switch (normalizedGame) {
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
    const normalizedGame = game?.replace(/\s+/g, '_').toUpperCase();
    
    if (normalizedGame === 'GRAND_FINAL') return "Elite Skills: Rapid Continuous Spell & Blind Memory Recall";
    
    if (normalizedGame === 'LITTLE_STEPS') {
      if (round === 1) return "Skills: Visual Recognition & Image Identification";
      if (round === 2) return "Skills: Visual Memory & Short-term Retention";
      if (round === 3) return "Skills: Teamwork, Listening & Fast Recall";
    }
    if (normalizedGame === 'KIDS_BOX') {
      if (round === 1) return "Skills: Image Recognition, Reading & Spelling";
      if (round === 2) return "Skills: Image Recognition Speed & Visual Memory";
      if (round === 3) return "Skills: Parent & Child Teamwork, Listening & Accuracy";
    }
    if (normalizedGame === 'POWER_UP_1') {
      if (round === 1) return "Skills: Pronunciation, Spelling & Sentence Formation";
      if (round === 2) return "Skills: Unscrambling, Grammar & Dictation Accuracy";
      if (round === 3) return "Skills: Speed Reading & Fluency";
    }
    if (normalizedGame === 'POWER_UP_3') {
      if (round === 1) return "Skills: Reading & Listening Comprehension";
      if (round === 2) return "Skills: Scramble & Dictation Precision";
      if (round === 3) return "Skills: Speed Reading, Word Recall & Sentence Formation";
    }
    if (normalizedGame?.includes('AMERICAN_THINK')) {
      if (round === 1) return "Skills: Listening Comprehension & Spelling";
      if (round === 2) return "Skills: Word Unscrambling & Sentence Dictation";
      if (round === 3) return "Skills: Speed Reading & Memory Recall";
      if (round === 4) return "Skills: Rapid Spelling & Blind Sentence Recall";
    }
    return "English Skills Assessment";
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
    const normalizedGame = game?.replace(/\s+/g, '_').toUpperCase();
    if (normalizedGame === 'GRAND_FINAL') return `GRAND FINALIST #${participantNumber || "..."}`;
    if (participantNumber === 'GROUP ACTIVITY') {
       return `GROUP ACTIVITY`; 
    }
    return `Participant #${participantNumber || "..."}`;
  };

  const isAnySpeedReading = phase.includes('SPEED_READING');

  const getPhaseInstruction = () => {
      const normalizedGame = game?.replace(/\s+/g, '_').toUpperCase();

      if (phase === 'READY') return "Waiting for the administrator to initiate the official turn sequence.";
      if (normalizedGame === 'GRAND_FINAL' && phase.includes('RAPID')) return "Elite Level: Continuous spelling. Every letter counts, no mistakes allowed!";
      if (normalizedGame === 'GRAND_FINAL' && phase.includes('WOW')) return "The ultimate test: Memorize the sentence and recall it perfectly with your eyes closed.";

      if (phase.includes('PICTURE_ID') || phase.includes('SPEED_IMAGES')) return "Look at the screen. Identify the object or action shown in the image and say it aloud clearly and fast.";
      if (phase.includes('MEMORY')) return "Look at the images, memorize them, and name them all when they disappear.";
      if (phase.includes('WORDS')) return "The student must read the words appearing on the screen clearly and fast.";
      if (phase.includes('LISTEN')) return "Listen to the word, repeat it, spell it, and create a complete sentence.";
      if (phase.includes('SCRAMBLE')) return "A scrambled word will appear. Memorize the letters and write it correctly on your board.";
      if (phase.includes('DICTATION')) return "The judge will dictate a sentence or letters. Listen carefully and write it down on your board.";
      
      if (phase.includes('SPEED')) {
          if (normalizedGame === 'POWER_UP_3') return "Read the sequence of words as fast as you can. Then, recall the LAST word, spell it, and create a sentence!";
          return "Read the sequence of words as fast as you can. Focus on fluency!";
      }

      return "Follow the judge's instructions for this specific challenge.";
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">

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

        {/* VISTA DE TABLA DE SPEED READING (NORMAL) QUE SE AUTOAJUSTA SIN SCROLL */}
        {isAnySpeedReading && displayWords?.length > 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-500">
            <div className="flex items-center gap-4 bg-slate-900/90 backdrop-blur-sm px-6 py-2 rounded-full border-4 border-amber-400 shadow-[0_10px_30px_rgba(0,0,0,0.5)] mb-4 z-10 shrink-0">
              <span className="text-white font-black tracking-widest uppercase text-sm leading-none">{phase === 'RAPID_SPELL' ? 'RAPID SPELL' : 'READING SENSE'}</span>
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
            </div>

            <div className="flex-1 w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-[2rem] border-[12px] border-slate-800/90 flex flex-col items-center justify-center shadow-2xl overflow-hidden min-h-0 p-4">
              <div className="flex flex-wrap justify-center content-center gap-1.5 md:gap-2 w-full h-full">
                {displayWords.map((word, i) => (
                  <div key={`speed-${i}`} className="bg-slate-50 border-2 border-slate-200 rounded-lg p-1.5 md:p-2 flex items-center gap-2 shadow-sm">
                    <span className={`${theme.primary} text-white w-6 h-6 md:w-8 md:h-8 rounded-md flex items-center justify-center font-black text-xs md:text-sm shadow-md shrink-0`}>
                      {i + 1}
                    </span>
                    <span className="text-xs md:text-lg font-black text-slate-800 truncate leading-none tracking-tight">
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

              {(phase === 'READY' || phase.startsWith('PAUSE')) && (
                <div className="text-center space-y-8 flex flex-col items-center w-full px-6 animate-in zoom-in duration-500">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 blur-3xl opacity-20 ${theme.primary}`}></div>
                    <img
                      src="/img/waiting_img/AmazonStar.png"
                      alt="Star"
                      className="w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 animate-slow-pulse"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-white font-black text-5xl md:text-7xl uppercase tracking-tighter italic drop-shadow-2xl">
                      {phase === 'READY' ? 'Get Ready!' : 'Standby'}
                    </h3>
                    <div className="flex items-center justify-center gap-4">
                      <span className={`${theme.primary} text-white px-6 py-2 rounded-full font-black text-xl shadow-lg`}>
                        ROUND {round}
                      </span>
                      <span className="bg-slate-700 text-slate-200 px-6 py-2 rounded-full font-black text-xl shadow-lg uppercase tracking-widest">
                        {phase.includes('1') || phase.includes('WORDS') || phase.includes('ID') ? 'Part 1' : 
                         phase.includes('2') || phase.includes('SENTENCE') || phase.includes('SCRAMBLE') ? 'Part 2' : 
                         phase.includes('3') || phase.includes('SPELLING') || phase.includes('SPEED') ? 'Part 3' : 'Intro'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md border-2 border-white/20 p-8 rounded-[3rem] max-w-4xl w-full shadow-2xl">
                    <p className={`${theme.textMain} text-sm font-black uppercase tracking-[0.4em] mb-4`}>
                      Current Challenge
                    </p>
                    <h4 className="text-white text-4xl md:text-5xl font-black uppercase mb-6 tracking-tight">
                      {phase.replace(/_/g, ' ').replace('PAUSE BEFORE ', '')}
                    </h4>
                    
                    <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10">
                      <p className="text-slate-200 text-xl md:text-2xl font-medium leading-relaxed italic">
                        {getPhaseInstruction()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-white to-rose-400 font-black text-2xl uppercase tracking-[0.2em] animate-pulse">
                      {getEncouragingMessage()}
                    </span>
                  </div>
                </div>
              )}

              {/* === GRAND FINAL: RAPID SPELL (CUADRÍCULA OSCURA ÉLITE AUTOAJUSTABLE) === */}
              {game?.includes('GRAND_FINAL') && phase === 'RAPID_SPELL' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 md:p-8 animate-in zoom-in duration-500">
                  <div className="bg-amber-500/20 border-2 border-amber-500/40 px-8 py-2 rounded-full mb-6 shadow-lg shadow-amber-500/10">
                    <p className="text-amber-400 font-black uppercase tracking-[0.4em] text-sm md:text-xl animate-pulse">
                      Phase 1: Continuous Spelling
                    </p>
                  </div>
                  <div className="flex-1 w-full bg-slate-900/50 rounded-[2.5rem] border-4 border-white/10 p-4 flex items-center justify-center overflow-hidden">
                    <div className="flex flex-wrap justify-center content-center gap-2 md:gap-3 w-full h-full">
                      {displayWords?.map((word, idx) => (
                        <div 
                          key={idx} 
                          className="bg-slate-800/80 border-2 border-slate-700 px-4 py-2 md:py-3 rounded-xl flex items-center shadow-xl"
                        >
                          <span className="text-white font-black text-xl md:text-2xl lowercase truncate tracking-tight">
                            {word}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === FASE 2: MOMENTO WOW - PASO 1 (MOSTRAR A AMBOS) === */}
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
                <div className="text-center space-y-10 animate-in zoom-in">
                  <EyeOff size={200} className="text-red-500 mx-auto animate-pulse drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]" />
                  <h2 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none">TURN AROUND!</h2>
                  <p className="text-slate-300 text-4xl font-bold uppercase tracking-[0.4em] bg-slate-800/80 px-12 py-6 rounded-full border border-slate-700 shadow-2xl">THE SCREEN IS NOW OFF</p>
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

              {/* IMÁGENES (PANTALLAS QUE SÓLO DEBEN MOSTRAR IMÁGENES) */}
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

              {/* --- VISTA: MEMORY GAME --- */}
              {phase === 'MEMORY_SHOW' && displayImages?.length > 0 && (
                <div className="w-full h-full flex flex-wrap items-center justify-center gap-6 md:gap-10 p-4 md:p-8 content-center animate-in zoom-in duration-500">
                  {displayImages.map((src, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white p-1 rounded-[1.5rem] md:rounded-[2.5rem] border-[10px] border-slate-700 shadow-2xl flex items-center justify-center overflow-hidden"
                      style={{
                        width: displayImages.length <= 4 ? '45%' : '31%', 
                        height: displayImages.length <= 4 ? '45%' : '42%',
                        maxWidth: '480px', 
                        maxHeight: '420px' 
                      }}
                    >
                      <img 
                        src={src} 
                        alt={`Memory ${idx}`} 
                        className="w-full h-full object-contain pointer-events-none rounded-[1rem] md:rounded-[2rem]" 
                        style={{ transform: 'scale(1.02)' }} 
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* --- ESTADO: SPEAK NOW! --- */}
              {phase === 'MEMORY_SPEAK' && (
                <div className="text-center space-y-8 animate-in zoom-in duration-500">
                  <div className="relative">
                    <Brain size={160} className={`${theme.textMain} mx-auto animate-pulse opacity-20 absolute inset-0 blur-xl`} />
                    <Brain size={160} className={`${theme.textMain} mx-auto animate-pulse relative z-10`} />
                  </div>
                  <h1 className="text-7xl md:text-[9rem] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">
                    SPEAK NOW!
                  </h1>
                  <div className={`${theme.bgLight} border ${theme.borderLight} px-10 py-4 rounded-full inline-block`}>
                    <p className="text-white text-3xl font-bold uppercase tracking-widest">
                      What images were on the screen?
                    </p>
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
                      {game?.includes('POWER_UP_3') ? "Repeat ➜ Spell ➜ Repeat ➜ Sentence (6+ words)" :
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

              {/* SCRAMBLE VIEW */}
              {['SCRAMBLED', 'SCRAMBLED_VIEW'].includes(phase) && displayWords?.length > 0 && (
                <div className="flex flex-col items-center justify-center h-full w-full gap-4 md:gap-6 px-4">
                  <p className={`${theme.textLight} font-black text-xl md:text-2xl tracking-[0.4em] animate-pulse ${theme.bgLight} py-2 px-6 rounded-full border ${theme.borderLight} shadow-lg inline-block mb-2 shrink-0`}>
                    MEMORIZE SCRAMBLE!
                  </p>
                  <div className="flex flex-col items-center justify-center gap-4 md:gap-8 w-full flex-1 min-h-0 pb-10">
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

              {/* === SPELL LAST WORD / STOP (Diseño Corregido) === */}
              {(phase.startsWith('SPELL_LAST_WORD') || phase === 'STOP_RECALL') && (
                <div className="text-center p-10 flex flex-col items-center justify-center h-full w-full animate-in zoom-in duration-500">
                  <h3 className="text-[10rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_60px_rgba(239,68,68,0.8)] leading-none">
                    STOP!
                  </h3>
                  <div className="bg-slate-800/90 px-12 py-8 rounded-[3rem] border border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-12 w-11/12 max-w-5xl">
                    <p className="text-white font-black tracking-widest uppercase text-4xl md:text-5xl drop-shadow-lg leading-tight">
                      SPELL THE LAST WORD<br/>YOU READ!
                    </p>
                  </div>
                  <div className="mt-8 bg-slate-900 py-3 px-10 rounded-[2rem] border border-rose-500/30 shadow-xl">
                    <p className="text-rose-400 font-black text-xl md:text-2xl uppercase tracking-widest drop-shadow-md">
                      (And make a sentence of 6+ words)
                    </p>
                  </div>
                </div>
              )}

              {/* FINAL / CIERRE */}
              {['CONTEST_CLOSING', 'FINISHED'].includes(phase) && (
                <div className="text-center space-y-6">
                  <Trophy size={140} className="text-amber-400 mx-auto drop-shadow-[0_0_80px_rgba(251,191,36,0.8)] animate-pulse" />
                  <h1 className="text-[5vw] font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                    {game?.includes('GRAND_FINAL') ? 'GRAND CHAMPION DECLARED!' : 'CONTEST COMPLETED'}
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

const SponsorsBanner = () => {
  const specialThanks = [
  "ALEX GAONA", "SLENDY ALVAREZ", "JAVIER OTERO", "ESTEFANIA GIRALDO", "IRENE CALVA",
  "MARÍA CÓRDOVA", "MARIA VERA", "MAYRA TANDALLA", "DIOSELINA MORA", "EDWIN GUALLO",
  "ESTEFANIA GIRALDO", "CARMEN CAIZA", "CARMITA CRIOLLO", "CARMEN MONTAÑO", "ANA ARANGUNDI",
  "MAYRA ALVAREZ", "SOFIA GARCIA", "SOFIA CÓRDOVA", "SHIRLEY SANTANA", "PATRICIA VALENZUELA",
  "SANTIAGO DIAZ", "DORIS ATIENCIA", "IVAN VALFRE", "ESPERANZA MERCHAN", "MARILU TENEMAZA",
  "DARWIN ALBIÑO", "FLORENTINO PERDOMO", "ENMA COBOS", "IRALDA CHANTI", "RICARDO GONZALES",
  "SR AGUIRRE", "MELANIA VARGAS", "RICKY MAYORGA", "CARMEN MONTAÑO", "VIVIANA OLAYA", "MARIBEL REYES"
  ];

  return (
    <footer className="w-full bg-slate-950 border-t-4 border-slate-800/50 py-1.5 px-6 flex items-center gap-6 overflow-hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0 relative">
      <style>{`@keyframes scroll-marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } } .animate-marquee { display: flex; width: max-content; animation: scroll-marquee 70s linear infinite; }`}</style>
      <div className="flex items-center gap-4 z-20 shrink-0 border-r-2 border-slate-800 pr-4">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-500 animate-pulse" />
          <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-[10px] md:text-xs">Proud Sponsors:</p>
        </div>
        <div className="flex items-center gap-6 pl-2">
          <img src="/img/sponsors/RicurasMalecon.png" alt="Ricuras del Malecon" className="h-8 md:h-12 w-auto object-contain scale-[2.9]" />
          <img src="/img/sponsors/MaelysPizza.png" alt="Maely's Pizza" className="h-8 md:h-12 w-auto object-contain scale-[1.4]" />
          <img src="/img/sponsors/ElContainer2.png" alt="El Container" className="h-8 md:h-12 w-auto object-contain scale-[1.6]" />
          <img src="/img/sponsors/Bolos.png" alt="Bolos" className="h-8 md:h-12 w-auto object-contain scale-[2.9]" />
          <img src="/img/sponsors/Books.png" alt="Books" className="h-8 md:h-12 w-auto object-contain scale-[2.9]" />
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-slate-950 to-transparent z-10"></div>
        <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-slate-950 to-transparent z-10"></div>
        <div className="animate-marquee items-center">
          <div className="flex items-center pr-16">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-sm whitespace-nowrap"><span className="text-amber-500">SPECIAL THANKS TO:</span> {specialThanks.join(" • ")}</p>
          </div>
          <div className="flex items-center pr-16">
            <p className="text-slate-300 font-bold uppercase tracking-widest text-sm whitespace-nowrap"><span className="text-amber-500">SPECIAL THANKS TO:</span> {specialThanks.join(" • ")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};