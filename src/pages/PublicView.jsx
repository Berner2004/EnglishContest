import { useState, useEffect, useRef } from 'react';
import { Award, Type, Monitor, Star, ArrowRight, Trophy, EyeOff, Brain, Camera, Users, Zap, Edit3 } from 'lucide-react';
import { io } from 'socket.io-client'; // Importamos Socket.io

// Conectamos directamente a tu servidor en Render
const socket = io('https://concursoengllish.onrender.com');

const PublicView = () => {
  const [gameState, setGameState] = useState(null);
  
  // Referencias para los audios duales
  const audioRefBoardsUp = useRef(null); 
  const audioRefTimeUp = useRef(null); 

  useEffect(() => {
    // Escuchar el evento 'sync_state' que viene del servidor (emitido por el Admin/Juegos)
    socket.on('sync_state', (payload) => {
      setGameState(payload);
      
      // 1. Audio de "Boards Up" manual (lanzado desde el admin)
      if (payload.triggerAudio && audioRefBoardsUp.current) {
          audioRefBoardsUp.current.play().catch(err => console.error("Audio block:", err));
      }
      
      // 2. Audio de "Time Up" automático cuando el tiempo llega a 0 en fases de escritura
      if (payload.timeLeft === 0 && 
          (payload.phase === 'SCRAMBLED_WRITE' || 
           payload.phase === 'DICTATION_SENTENCE' || 
           payload.phase === 'DICTATION_SPELLING')) {
        if (audioRefTimeUp.current) {
          audioRefTimeUp.current.play().catch(err => console.error("Audio block:", err));
        }
      }
    });

    // Escuchar evento para limpiar la pantalla
    socket.on('clear_state', () => {
      setGameState(null);
    });

    // Limpieza al desmontar el componente
    return () => {
      socket.off('sync_state');
      socket.off('clear_state');
    };
  }, []);

  // --- LÓGICA DE FORMATO DE TEXTO (DÍAS CON MAYÚSCULA, RESTO MINÚSCULA) ---
  const formatWord = (word) => {
    if (!word) return "";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const lowerWord = word.toLowerCase().trim();
    
    if (days.includes(lowerWord)) {
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    }
    return lowerWord;
  };

  const SponsorsBanner = () => (
    <footer className="w-full bg-slate-950 border-t-4 border-slate-800/50 py-2 px-6 flex items-center justify-center gap-6 overflow-hidden z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] shrink-0">
      <div className="flex items-center gap-2">
        <Star size={14} className="text-amber-500 animate-pulse" />
        <p className="text-slate-400 font-black tracking-[0.2em] uppercase text-[10px] md:text-xs">Proud Sponsors:</p>
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
          <div className="w-48 h-48 md:w-64 md:h-64 bg-white/5 rounded-full border-4 border-white/10 flex items-center justify-center mb-6 shadow-[0_0_100px_rgba(255,255,255,0.05)] animate-pulse">
            <Monitor size={80} className="text-slate-500" />
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

  const { 
    game, round, phase, timeLeft, displayImages, displayWords, 
    originalWords, wowSentence, currentIndex, participantNumber, memLevel, imageIndex
  } = gameState;

  const formattedGameName = game.replace(/_/g, ' ');
  const activeImgIdx = imageIndex !== undefined ? imageIndex : (currentIndex !== undefined ? currentIndex : 0);
  const activeWordIdx = currentIndex !== undefined ? currentIndex : 0;

  // Lógica de colores dinámicos por nivel
  const getThemeColors = () => {
    switch (game) {
      case 'LITTLE_STEPS':
      case 'KIDS_BOX':
        return {
          primary: 'bg-sky-500', headerText: 'text-sky-100', badgeBg: 'bg-sky-400/30', badgeBorder: 'border-sky-300/30', textMain: 'text-sky-600', textLight: 'text-sky-400', bgLight: 'bg-sky-900/40', borderLight: 'border-sky-500/30', iconColor: 'text-sky-500'
        };
      case 'POWER_UP_1':
      case 'POWER_UP_3':
        return {
          primary: 'bg-violet-700', headerText: 'text-violet-200', badgeBg: 'bg-white/20', badgeBorder: 'border-white/30', textMain: 'text-violet-600', textLight: 'text-violet-400', bgLight: 'bg-violet-900/40', borderLight: 'border-violet-500/30', iconColor: 'text-violet-500'
        };
      case 'AMERICAN_THINK':
        return {
          primary: 'bg-orange-500', headerText: 'text-orange-100', badgeBg: 'bg-orange-400/30', badgeBorder: 'border-orange-300/30', textMain: 'text-orange-600', textLight: 'text-orange-400', bgLight: 'bg-orange-900/30', borderLight: 'border-orange-500/30', iconColor: 'text-orange-500'
        };
      case 'GRAND_FINAL':
        return {
          primary: 'bg-amber-500', headerText: 'text-amber-100', badgeBg: 'bg-amber-400/30', badgeBorder: 'border-amber-300/30', textMain: 'text-amber-600', textLight: 'text-amber-400', bgLight: 'bg-amber-900/40', borderLight: 'border-amber-500/30', iconColor: 'text-amber-500'
        };
      default:
        return {
          primary: 'bg-slate-700', headerText: 'text-slate-200', badgeBg: 'bg-white/20', badgeBorder: 'border-white/30', textMain: 'text-slate-600', textLight: 'text-slate-400', bgLight: 'bg-slate-800/50', borderLight: 'border-slate-700/50', iconColor: 'text-slate-500'
        };
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
    if (game === 'AMERICAN_THINK') {
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
    if (phase === 'PAUSE_BEFORE_SCRAMBLE') return "Look at the Screen! Memorize the Word!";
    if (phase === 'PAUSE_BEFORE_SPEED_WORDS') return "Get Ready for Speed Words!";
    if (phase.includes('PAUSE_BEFORE_MEMORY')) return `Get Ready for Memory Level ${memLevel}!`;
    if (phase === 'PAUSE_WOW') return "Prepare for the WOW Moment!";
    return "Waiting for judge's cue...";
  };

  const getStandbyIcon = () => {
    if (game === 'GRAND_FINAL') return <Trophy size={80} className={`${theme.iconColor} mx-auto animate-bounce drop-shadow-lg opacity-80`} />;
    if (phase.includes('MEMORY') || round === 2 && game === 'LITTLE_STEPS') return <Brain size={80} className={`${theme.iconColor} mx-auto animate-pulse drop-shadow-lg opacity-50`} />;
    if (phase.includes('SPEED') || phase.includes('SCRAMBLE')) return <Zap size={80} className={`${theme.iconColor} mx-auto animate-pulse drop-shadow-lg opacity-50`} />;
    if (phase.includes('PARENT') || round === 3 && game === 'LITTLE_STEPS') return <Users size={80} className={`${theme.iconColor} mx-auto animate-pulse drop-shadow-lg opacity-50`} />;
    if (phase.includes('DICTATION') || phase.includes('WORD') || phase.includes('LISTEN') || round === 1 && game !== 'LITTLE_STEPS') return <Type size={80} className={`${theme.iconColor} mx-auto animate-pulse drop-shadow-lg opacity-50`} />;
    return <Award size={80} className={`${theme.iconColor} mx-auto animate-pulse drop-shadow-lg opacity-50`} />;
  };

  const getParticipantText = () => {
    if (game === 'GRAND_FINAL') return `GRAND FINALIST #${participantNumber || "..."}`;
    if (game === 'LITTLE_STEPS' && round === 3) return "Group Activity";
    if (game === 'KIDS_BOX' && round === 3) return "Group Activity";
    if (game === 'POWER_UP_1' && round === 2) return "Group Activity";
    if (game === 'POWER_UP_3' && round === 2) return "Group Activity";
    if (game === 'AMERICAN_THINK') {
      if (round === 2) return "Group Activity";
      if (round === 4) return `TOP 5 FINALIST #${participantNumber || "..."}`;
    }
    return `Participant #${participantNumber || "..."}`;
  };

  const isListeningOrDictationPause = phase.includes('TURN_AROUND') || phase.includes('LISTEN') || phase.includes('DICTATION') || phase === 'WOW_BLIND';

  const isAnySpeedReading = phase === 'SPEED_READING' || phase === 'SPEED_READING_1' || phase === 'SPEED_READING_2' || phase === 'RAPID_SPELL';

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      
      <audio ref={audioRefBoardsUp} src="/sounds/boards-up.mp3" preload="auto" />
      <audio ref={audioRefTimeUp} src="/sounds/time-up.mp3" preload="auto" />

      {/* HEADER */}
      <header className={`${theme.primary} text-white py-2 px-6 shadow-xl flex justify-between items-center z-50 shrink-0 transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          <Award size={24} className={theme.headerText} />
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">Amazon English Academy</h1>
        </div>
        <div className={`${theme.badgeBg} px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest border ${theme.badgeBorder}`}>
          {formattedGameName}
        </div>
      </header>

      {/* INFO BAR */}
      <div className="w-full flex justify-between items-center py-3 px-8 bg-white border-b shadow-sm shrink-0">
        <div className="space-y-1">
          <p className={`text-lg md:text-xl font-black ${theme.textMain} uppercase tracking-widest flex items-center gap-2`}>
            <span className={`w-2 h-2 ${theme.primary} rounded-full animate-pulse`}></span>
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
        
        <div className={`px-6 py-2 rounded-[1.5rem] border-4 transition-all shadow-lg ${timeLeft > 0 && timeLeft <= 3 ? 'bg-red-50 border-red-500 scale-105' : 'bg-slate-900 border-slate-700'}`}>
          <span className={`text-4xl md:text-5xl font-mono font-black tabular-nums ${timeLeft > 0 && timeLeft <= 3 ? 'text-red-600 animate-pulse' : 'text-white'}`}>
            {timeLeft}<span className="text-2xl ml-1">s</span>
          </span>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-4 md:p-6 min-h-0 relative">
        
        {/* VISTA DE TABLA DE SPEED READING */}
        {isAnySpeedReading && displayWords?.length > 0 ? (
          <div className="w-full h-full flex flex-col items-center">
            <div className="flex items-center gap-4 bg-slate-900 px-6 py-2 rounded-full border-4 border-amber-400 shadow-lg mb-4 z-10 shrink-0">
              <span className="text-white font-black tracking-widest uppercase text-sm leading-none">READING SENSE</span>
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
              <ArrowRight size={24} className="text-amber-400 animate-pulse" />
            </div>

            <div className="flex-1 w-full max-w-7xl bg-white rounded-[2rem] border-[12px] border-slate-800 flex flex-col shadow-2xl overflow-hidden min-h-0 p-4 md:p-6">
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
          <div className="w-full h-full max-w-7xl bg-slate-900 rounded-[2rem] border-[12px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
              
              {/* READY Y PAUSAS */}
              {(phase === 'READY' || phase.startsWith('PAUSE')) && (
                <div className="text-center animate-in zoom-in duration-300 space-y-4">
                  {getStandbyIcon()}
                  <h3 className="text-white font-black text-4xl md:text-5xl uppercase tracking-[0.3em] drop-shadow-xl">
                    {phase === 'READY' ? 'SYSTEM READY' : 'STANDBY'}
                  </h3>
                  
                  {isListeningOrDictationPause && (
                    <h2 className={`text-3xl ${theme.textLight} font-black mt-4 uppercase tracking-widest animate-pulse`}>
                      "Turn Around & Listen to the Judge"
                    </h2>
                  )}
                  
                  {!isListeningOrDictationPause && (
                    <p className={`${theme.textLight} font-bold tracking-widest uppercase text-xl ${theme.bgLight} py-2 px-6 rounded-full border ${theme.borderLight} inline-block mt-4 shadow-lg`}>
                      {getStandbyMessage()}
                    </p>
                  )}
                </div>
              )}

              {/* FASE 2: MOMENTO WOW - PASO 1 (MOSTRAR A AMBOS) */}
              {phase === 'WOW_SHOW' && wowSentence && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in">
                  <h3 className="text-5xl font-black text-amber-400 uppercase tracking-widest text-center">MEMORIZE THE SENTENCE!</h3>
                  <div className="w-[95%] max-w-5xl bg-slate-800 px-6 py-12 rounded-[2rem] border-8 border-amber-400 shadow-inner flex items-center justify-center">
                    <h1 className="text-5xl md:text-6xl font-black text-white text-center leading-relaxed break-words">
                      {wowSentence}
                    </h1>
                  </div>
                  <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest animate-pulse">
                    You have {timeLeft}s to look
                  </div>
                </div>
              )}

              {/* GIRO DE ESTUDIANTE (PANTALLA "OFF") */}
              {phase === 'WOW_BLIND' && (
                <div className="text-center space-y-8 animate-in zoom-in">
                  <EyeOff size={150} className="text-rose-500 mx-auto animate-pulse" />
                  <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">TURN AROUND!</h2>
                  <p className="text-slate-300 text-3xl font-bold uppercase tracking-widest bg-slate-800 py-4 px-10 rounded-full inline-block">The screen is now OFF for you</p>
                </div>
              )}

              {/* MOMENTO WOW - DELETREO PÚBLICO (PROYECTAR SOLO PÚBLICO) */}
              {phase === 'WOW_PUBLIC' && wowSentence && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in">
                  <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Trophy size={50} className="animate-pulse" />
                    <h3 className="text-4xl font-black uppercase tracking-[0.2em] text-center">WOW MOMENT</h3>
                  </div>
                  <div className="w-[95%] max-w-5xl px-6 py-12 rounded-[2.5rem] border-8 shadow-inner bg-slate-950 border-amber-400 flex items-center justify-center">
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
                    src={['SPEED_CHALLENGE', 'SPEED_IMAGES'].includes(phase) ? displayImages[0] : displayImages[activeImgIdx]} 
                    className="max-h-full rounded-2xl border-8 border-white shadow-xl animate-in zoom-in object-contain" 
                    alt="Recognition" 
                  />
                  <div className={`absolute top-6 right-6 ${theme.primary} text-white px-5 py-2 rounded-full font-black shadow-lg`}>
                    IMAGE {(['SPEED_CHALLENGE', 'SPEED_IMAGES'].includes(phase) ? 0 : activeImgIdx) + 1}
                  </div>
                </div>
              )}

              {/* PALABRAS ÚNICAS */}
              {['WORD_1', 'WORD_2_SENTENCE', 'READ_SPELL', 'SPEED_WORDS', 'READING_WORDS', 'LISTENING_1', 'LISTENING_2'].includes(phase) && displayWords?.length > 0 && (
                 <div className="w-full h-full flex flex-col items-center justify-between py-10 px-8">
                   <div className="flex-1 flex items-center justify-center">
                      <h1 className="text-[10vw] font-black text-white tracking-[0.05em] drop-shadow-2xl text-center leading-none animate-in fade-in">
                        {formatWord(['SPEED_WORDS'].includes(phase) ? displayWords[0] : displayWords[activeWordIdx])}
                      </h1>
                   </div>
                   {['WORD_1', 'WORD_2_SENTENCE', 'READ_SPELL'].includes(phase) && (
                     <div className={`w-full max-w-3xl ${theme.bgLight} border ${theme.borderLight} py-4 rounded-2xl backdrop-blur-md`}>
                        <p className={`${theme.textLight} text-2xl font-black text-center uppercase tracking-[0.15em] italic`}>
                          Read → Spell → Read {phase === 'WORD_2_SENTENCE' && '→ Sentence'} 
                        </p>
                     </div>
                   )}
                   {phase === 'READING_WORDS' && (
                     <div className={`w-full max-w-3xl ${theme.bgLight} border ${theme.borderLight} py-4 rounded-2xl backdrop-blur-md`}>
                        <p className={`${theme.textLight} text-2xl font-black text-center uppercase tracking-[0.15em] italic`}>Read Aloud!</p>
                     </div>
                   )}
                   {['LISTENING_1', 'LISTENING_2'].includes(phase) && (
                     <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest shadow-lg text-center">
                        Repeat ➜ Spell ➜ Repeat ➜ Sentence
                     </div>
                   )}
                 </div>
              )}

              {/* DICTADO */}
              {(phase === 'DICTATION_SENTENCE' || phase === 'DICTATION_SPELLING') && (
                <div className="text-center animate-pulse p-8 flex flex-col items-center justify-center h-full">
                  <h3 className="text-5xl md:text-6xl font-black text-amber-400 uppercase tracking-tight italic drop-shadow-2xl leading-tight">
                    {phase === 'DICTATION_SENTENCE' ? 'SENTENCE DICTATION' : 'LETTER-BY-LETTER DICTATION'}
                  </h3>
                  <p className="text-slate-300 mt-6 font-black tracking-widest uppercase text-2xl">Listen & Write!</p>
                </div>
              )}

              {/* MEMORIA (KIDBOX/LITTLE) */}
              {phase === 'MEMORY_SHOW' && displayImages?.length > 0 && (
                <div className="w-full h-full flex flex-wrap items-center justify-center gap-4 p-6 content-center">
                  {displayImages.map((src, i) => {
                    const maxW = displayImages.length <= 4 ? 'max-w-[40%]' : 'max-w-[28%]';
                    return (
                      <img key={i} src={src} className={`${maxW} max-h-[40%] bg-white p-2 rounded-xl border-4 border-slate-700 shadow-lg object-contain animate-in fade-in duration-300`} alt="Memory Card" />
                    );
                  })}
                </div>
              )}

              {/* BOARDS UP UNIVERSAL */}
              {phase.includes('BOARDS_UP') && (
                <div className="text-center animate-in zoom-in duration-300 p-8 space-y-6">
                  <h3 className="text-[5rem] md:text-[7rem] font-black text-amber-400 uppercase tracking-tighter italic animate-bounce">
                    BOARDS UP!
                  </h3>
                  <p className="text-white font-black tracking-[0.2em] uppercase text-4xl bg-slate-800 py-3 px-8 rounded-full border border-slate-700 inline-block shadow-xl">
                    TURN AROUND!
                  </p>
                </div>
              )}

              {/* SCRAMBLE VIEW */}
              {['SCRAMBLED', 'SCRAMBLED_VIEW'].includes(phase) && displayWords?.length > 0 && (
                <div className="text-center">
                  <p className={`${theme.textLight} font-black text-2xl tracking-[0.4em] mb-6 animate-pulse ${theme.bgLight} py-2 px-6 rounded-full border ${theme.borderLight} inline-block`}>
                    MEMORIZE SCRAMBLE!
                  </p>
                  <h1 className="text-[10vw] font-black text-white tracking-[0.4em] drop-shadow-2xl leading-none">{formatWord(displayWords[activeWordIdx])}</h1>
                </div>
              )}

              {/* SCRAMBLE REVEAL */}
              {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
                <div className="bg-emerald-500 px-20 py-12 rounded-[3rem] border-[12px] border-white shadow-[0_15px_40px_rgba(16,185,129,0.5)] animate-in zoom-in flex flex-col items-center">
                  <p className="text-emerald-100 font-black text-2xl tracking-[0.3em] uppercase mb-4 bg-emerald-600/50 py-2 px-6 rounded-full">CORRECT WORD</p>
                  <h1 className="text-8xl font-black text-white tracking-widest">{formatWord(originalWords[activeWordIdx])}</h1>
                </div>
              )}

              {/* SPELL LAST WORD / STOP */}
              {['SPELL_LAST_WORD_1', 'SPELL_LAST_WORD_2', 'STOP_RECALL'].includes(phase) && (
                <div className="text-center animate-in zoom-in duration-300 p-8 flex flex-col items-center justify-center h-full">
                  <h3 className="text-[6rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]">STOP!</h3>
                  <p className="text-white mt-8 font-black tracking-widest uppercase text-3xl bg-slate-800 py-3 px-8 rounded-full inline-block border border-slate-700 shadow-xl">
                    {phase === 'STOP_RECALL' ? 'Recall word ➜ Say, Spell, Say, Sentence' : 'Spell the LAST word you read!'}
                  </p>
                </div>
              )}

              {/* FINAL / CIERRE */}
              {['CONTEST_CLOSING', 'FINISHED'].includes(phase) && (
                <div className="text-center animate-in zoom-in duration-1000 space-y-6">
                  <Trophy size={140} className="text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-pulse" />
                  <h1 className="text-[5vw] font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                    {game === 'GRAND_FINAL' ? 'GRAND CHAMPION DECLARED!' : 'CONTEST COMPLETED'}
                  </h1>
                  <p className={`${theme.textLight} font-black text-3xl tracking-[0.3em] uppercase mt-8`}>Amazon English Academy</p>
                </div>
              )}
          </div>
        )}
      </main>

      <SponsorsBanner />
      
    </div>
  );
};

export default PublicView;