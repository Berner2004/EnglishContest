import { useState, useEffect, useRef } from 'react';
import { Award, Type, Monitor, Star, ArrowRight, Trophy, EyeOff, Brain, Camera, Users, Zap, Edit3 } from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('https://concursoengllish.onrender.com');

const PublicView = () => {
  const [gameState, setGameState] = useState(null);

  const audioRefBoardsUp = useRef(null);
  const audioRefTimeUp = useRef(null);

  useEffect(() => {
    socket.on('sync_state', (payload) => {
      setGameState(payload);

      if (payload.triggerAudio && audioRefBoardsUp.current) {
        audioRefBoardsUp.current.play().catch(err => console.error("Audio block:", err));
      }

      if (payload.timeLeft === 0 &&
        (payload.phase.includes('WRITE') ||
          payload.phase.includes('DICTATION'))) {
        if (audioRefTimeUp.current) {
          audioRefTimeUp.current.play().catch(err => console.error("Audio block:", err));
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

  const formatWord = (word) => {
    if (!word) return "";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const lowerWord = word.toLowerCase().trim();

    if (days.includes(lowerWord)) {
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    }

    if (word.includes(" ") && /[A-Z]/.test(word)) {
      return word;
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
        return {
          primary: 'bg-sky-500', headerText: 'text-sky-100', badgeBg: 'bg-sky-400/30', badgeBorder: 'border-sky-300/30', textMain: 'text-sky-600', textLight: 'text-sky-400', bgLight: 'bg-sky-900/40', borderLight: 'border-sky-500/30', iconColor: 'text-sky-500'
        };
      case 'POWER_UP_1':
      case 'POWER_UP_3':
        return {
          primary: game === 'POWER_UP_3' ? 'bg-rose-600' : 'bg-violet-700', headerText: 'text-white', badgeBg: 'bg-white/20', badgeBorder: 'border-white/30', textMain: game === 'POWER_UP_3' ? 'text-rose-600' : 'text-violet-600', textLight: game === 'POWER_UP_3' ? 'text-rose-400' : 'text-violet-400', bgLight: game === 'POWER_UP_3' ? 'bg-rose-900/40' : 'bg-violet-900/40', borderLight: game === 'POWER_UP_3' ? 'border-rose-500/30' : 'border-violet-500/30', iconColor: 'text-white'
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

  const isListeningOrDictationPause = phase.includes('TURN_AROUND') || phase.includes('LISTEN') || phase.startsWith('PAUSE_DICTATION') || phase === 'WOW_BLIND';
  const isAnySpeedReading = phase.includes('SPEED_READING') || phase === 'RAPID_SPELL';

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">

      <audio ref={audioRefBoardsUp} src="/sounds/boards-up.mp3" preload="auto" />
      <audio ref={audioRefTimeUp} src="/sounds/time-up.mp3" preload="auto" />

      {/* HEADER */}
      {/* HEADER */}
      <header className={`${theme.primary} text-white py-2 px-6 shadow-xl flex justify-between items-center z-50 shrink-0 transition-colors duration-500`}>
        
        {/* CAMBIO 1: Reducimos gap-3 a gap-0 para quitar el espacio forzado */}
        <div className="flex items-center gap-0">
          
          <img 
            src="/img/waiting_img/AmazonStar.png" 
            alt="Amazon Star" 
            /* CAMBIO 2: Añadimos -mr-3 (margen derecho negativo) para acercar el texto */
            className="w-20 h-20 md:w-20 md:h-30 object-contain drop-shadow-sm -mr-3 scale-[1.80]" 
          />
          
          <h1 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter">
            Amazon English Academy
          </h1>
          
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
              <span className="text-white font-black tracking-widest uppercase text-sm leading-none">{phase === 'RAPID_SPELL' ? 'RAPID SPELL' : 'READING SENSE'}</span>
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

            {/* ENVOLTURA CLAVE PARA LA ANIMACIÓN DE SLIDE:
                  Al usar key={phase}, React reconstruye este div cada vez que la fase cambia,
                  activando automáticamente la animación 'slide-in-from-right-12' y 'fade-in' */}
            <div key={`${phase}-${activeWordIdx}-${activeImgIdx}`} className="w-full h-full flex flex-col items-center justify-center animate-in slide-in-from-right-12 fade-in duration-300">

              {/* READY Y PAUSAS (Con Animaciones y Mensajes de Ánimo) */}
              {(phase === 'READY' || phase.startsWith('PAUSE')) && (
                <div className="text-center space-y-6 flex flex-col items-center w-full px-4">

                  {/* IMPLEMENTACIÓN DEL LOGO CON BRILLO EN LUGAR DEL ICONO 'T' */}
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
                      <h2 className={`text-2xl md:text-3xl lg:text-4xl ${theme.textLight} font-black uppercase tracking-widest animate-pulse bg-slate-800/80 px-8 py-4 rounded-full border border-slate-700 text-center leading-tight`}>
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

                  {/* MENSAJE DE ÁNIMO DINÁMICO DEBAJO */}
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
                <div className="text-center space-y-8">
                  <EyeOff size={150} className="text-rose-500 mx-auto animate-pulse" />
                  <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic">TURN AROUND!</h2>
                  <p className="text-slate-300 text-3xl font-bold uppercase tracking-widest bg-slate-800 py-4 px-10 rounded-full inline-block">The screen is now OFF for you</p>
                </div>
              )}

              {/* MOMENTO WOW - DELETREO PÚBLICO (PROYECTAR SOLO PÚBLICO) */}
              {phase === 'WOW_PUBLIC' && wowSentence && (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8">
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
                    key={`img-${activeImgIdx}`}
                    src={phase.includes('SPEED') ? displayImages[0] : displayImages[activeImgIdx]}
                    className="max-h-full rounded-2xl border-8 border-white shadow-xl object-contain animate-in slide-in-from-right-8 fade-in duration-300"
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
                    <h1 key={`word-${activeWordIdx}`} className="text-[10vw] font-black text-white tracking-[0.05em] drop-shadow-2xl text-center leading-none animate-in slide-in-from-right-8 fade-in duration-300">
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
                    <div className={`w-full max-w-3xl ${theme.bgLight} border ${theme.borderLight} py-4 rounded-2xl backdrop-blur-md`}>
                      <p className={`${theme.textLight} text-2xl font-black text-center uppercase tracking-[0.15em] italic`}>Read Aloud!</p>
                    </div>
                  )}
                  {['LISTENING_1', 'LISTENING_2'].includes(phase) && (
                    <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest shadow-lg text-center animate-bounce">
                      {game === 'POWER_UP_3' ? "Repeat ➜ Spell ➜ Repeat ➜ Sentence (6+ words)" :
                        `Repeat ➜ Spell ➜ Repeat ${phase === 'LISTENING_2' ? "➜ Sentence" : ""}`}
                    </div>
                  )}
                </div>
              )}

              {/* DICTADO / ESCRITURA DINÁMICA */}
              {(phase.includes('WRITE') || phase.includes('DICTATION')) && !phase.includes('BOARDS') && !phase.includes('PAUSE') && (
                <div className="text-center space-y-8 animate-pulse flex flex-col items-center w-full px-4">
                  <Edit3 size={150} className="text-amber-400 mx-auto drop-shadow-lg" />
                  <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-amber-400 uppercase italic tracking-tighter text-center leading-tight drop-shadow-2xl">
                    {phase.includes('SCRAMBLED') ? 'WRITE FAST!' :
                      phase === 'DICTATION_SENTENCE' ? 'SENTENCE DICTATION!' :
                        phase === 'DICTATION_SPELLING' ? 'LETTER BY LETTER!' : 'LISTEN & WRITE!'}
                  </h1>
                  <p className="text-white text-2xl md:text-3xl font-bold uppercase tracking-widest bg-slate-800 py-3 px-8 rounded-full border border-slate-700 inline-block shadow-xl">Keep boards down</p>
                </div>
              )}

              {/* MEMORIA (KIDBOX/LITTLE) */}
              {phase === 'MEMORY_SHOW' && displayImages?.length > 0 && (
                <div className="w-full h-full flex flex-wrap items-center justify-center gap-4 p-6 content-center">
                  {displayImages.map((src, i) => {
                    const maxW = displayImages.length <= 4 ? 'max-w-[40%]' : 'max-w-[28%]';
                    return (
                      <img key={i} src={src} className={`${maxW} max-h-[40%] bg-white p-2 rounded-xl border-4 border-slate-700 shadow-lg object-contain`} alt="Memory Card" />
                    );
                  })}
                  <div className="absolute bottom-10 bg-rose-600 text-white px-10 py-4 rounded-full font-black text-2xl uppercase animate-pulse shadow-2xl">Memorize Everything!</div>
                </div>
              )}

              {phase === 'MEMORY_SPEAK' && (
                <div className="text-center space-y-6">
                  <Brain size={150} className="text-sky-400 mx-auto animate-pulse" />
                  <h1 className="text-8xl font-black text-white uppercase tracking-tighter italic">SPEAK NOW!</h1>
                  <p className="text-sky-300 text-3xl font-bold uppercase tracking-widest">What was on the screen?</p>
                </div>
              )}

              {/* BOARDS UP UNIVERSAL (GIGANTE) */}
              {phase.includes('BOARDS_UP') && (
                <div className="text-center p-8 space-y-10">
                  <h3 className="text-[10rem] font-black text-amber-400 uppercase tracking-tighter italic animate-bounce leading-none drop-shadow-2xl">
                    BOARDS UP!
                  </h3>
                  <div className="bg-white text-slate-900 px-16 py-6 rounded-full font-black text-5xl uppercase shadow-2xl">
                    TURN AROUND!
                  </div>
                </div>
              )}

              {/* SCRAMBLE VIEW */}
              {['SCRAMBLED', 'SCRAMBLED_VIEW'].includes(phase) && displayWords?.length > 0 && (
                <div className="text-center">
                  <p className={`${theme.textLight} font-black text-2xl tracking-[0.4em] mb-6 animate-pulse ${theme.bgLight} py-2 px-6 rounded-full border ${theme.borderLight} inline-block`}>
                    MEMORIZE SCRAMBLE!
                  </p>
                  <h1 key={`scramble-${activeWordIdx}`} className="text-[10vw] font-black text-white tracking-[0.4em] drop-shadow-2xl leading-none animate-in slide-in-from-right-8 fade-in duration-300">
                    {formatWord(displayWords[activeWordIdx])}
                  </h1>
                </div>
              )}

              {/* SCRAMBLE REVEAL */}
              {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
                <div className="bg-emerald-500 px-20 py-12 rounded-[3rem] border-[12px] border-white shadow-[0_15px_40px_rgba(16,185,129,0.5)] flex flex-col items-center">
                  <p className="text-emerald-100 font-black text-2xl tracking-[0.3em] uppercase mb-4 bg-emerald-600/50 py-2 px-6 rounded-full">CORRECT WORD</p>
                  <h1 className="text-8xl font-black text-white tracking-widest">{formatWord(originalWords[activeWordIdx])}</h1>
                </div>
              )}

              {/* SPELL LAST WORD / STOP (DISEÑO EXACTO A LA IMAGEN SOLICITADA) */}
              {['SPELL_LAST_WORD_1', 'SPELL_LAST_WORD_2', 'STOP_RECALL'].includes(phase) && (
                <div className="text-center p-10 flex flex-col items-center justify-center h-full w-full">
                  <h3 className="text-[10rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_40px_rgba(239,68,68,0.8)] leading-none">STOP!</h3>

                  <div className="bg-slate-800/90 px-12 py-8 rounded-[3rem] border border-slate-700 shadow-2xl mt-12 w-11/12 max-w-5xl">
                    <p className="text-white font-black tracking-widest uppercase text-4xl md:text-5xl drop-shadow-md">
                      Recall LAST word ➔ Say, Spell, Say, Sentence
                    </p>
                  </div>

                  <div className="mt-8 bg-[#0f172a] py-3 px-10 rounded-[2rem] border border-rose-500/30 shadow-lg">
                    <p className="text-rose-400 font-black text-2xl md:text-3xl uppercase tracking-widest drop-shadow-md">
                      (Sentence must be 6+ words)
                    </p>
                  </div>
                </div>
              )}

              {/* FINAL / CIERRE */}
              {['CONTEST_CLOSING', 'FINISHED'].includes(phase) && (
                <div className="text-center space-y-6">
                  <Trophy size={140} className="text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-pulse" />
                  <h1 className="text-[5vw] font-black text-white uppercase tracking-tighter leading-none drop-shadow-2xl">
                    {game === 'GRAND_FINAL' ? 'GRAND CHAMPION DECLARED!' : 'CONTEST COMPLETED'}
                  </h1>
                  <p className={`${theme.textLight} font-black text-3xl tracking-[0.3em] uppercase mt-8`}>Amazon English Academy</p>
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