import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Camera, Award, Type, ChevronLeft, ChevronRight, ArrowRight, Edit3, Zap
} from 'lucide-react';
import { io } from 'socket.io-client';

// Conexión al servidor de WebSockets en Render
const socket = io('https://concursoengllish.onrender.com');

const WORDS_POOL = [
  "swimming", "breakfast", "garden", "paper", "bathroom", "bus stop", "crayon", "crocodile", "chicken", "eating", 
  "mountain", "beautiful", "lorry", "wake up", "helmet", "pirate", "cabinet", "nurse", "classroom", "sheep", 
  "body", "armchair", "cupboard", "donkey", "lizard", "goat", "lake", "hobby", "hockey", "treasure", 
  "leaves", "Thursday", "Wednesday", "Saturday", "Tuesday", "firefighter", "horse", "baseball", "farmer", "eye", 
  "shower", "playground", "pencil case", "eraser", "pool", "face", "towel", "hair", "angry", "listening"
];

const PowerUp1Game = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    idTime: 4,          
    word1Time: 12,      
    word2Time: 18,      
    scrambledView: 3,   
    scrambledWrite: 8,  
    boardsUpTime: 10,
    dictationSent: 40,
    dictationSpell: 50,
    speedReading: 20    
  };

  const [currentChildIdx, setCurrentChildIdx] = useState(0);
  const [round, setRound] = useState(1); 
  const [phase, setPhase] = useState('READY'); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [displayImages, setDisplayImages] = useState([]);
  const [displayWords, setDisplayWords] = useState([]);
  const [originalWords, setOriginalWords] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 

  const [usedWords, setUsedWords] = useState(new Set());

  const currentChild = participants[currentChildIdx];
  const intervalRef = useRef(null);
  
  const audioRefBoardsUp = useRef(new Audio('/audio/boards-up.mp3'));
  const audioRefTimeOut = useRef(new Audio('/sounds/time.mp3'));

  // --- REGLA ORTOGRÁFICA: TODO MINÚSCULA EXCEPTO LA 1RA LETRA DE LOS DÍAS ---
  const formatFinalWord = (word) => {
    if (!word) return "";
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const lowerWord = word.toLowerCase().trim();
    if (days.includes(lowerWord)) {
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    }
    return lowerWord;
  };

  useEffect(() => {
    return () => {
      socket.emit('clear_state');
    };
  }, []);

  useEffect(() => {
    socket.emit('sync_state', {
      game: 'POWER_UP_1',
      round, phase, timeLeft, 
      displayImages, 
      displayWords: displayWords.map(w => w), // Enviar tal cual está formateado
      originalWords: originalWords.map(formatFinalWord),
      currentIndex,
      participantNumber: currentChild?.order_number,
      triggerAudio: phase.includes('BOARDS_UP') && timeLeft === settings.boardsUpTime 
    });
  }, [round, phase, timeLeft, displayImages, displayWords, originalWords, currentIndex, currentChild]);

  // MOTOR DEL RELOJ CON ALARMA AL FINAL (0s)
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false); 
      
      const shouldPlayAlarm = [
        'WORD_1', 'WORD_2_SENTENCE', 
        'SCRAMBLED_WRITE', 'DICTATION_SENTENCE', 'DICTATION_SPELLING',
        'SPEED_READING'
      ].includes(phase);

      if (shouldPlayAlarm) {
        audioRefTimeOut.current.currentTime = 0;
        audioRefTimeOut.current.play().catch(e => console.log("Audio Error:", e));
      }

      handleAutoTransition(); 
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft, phase]);

  const handleAutoTransition = () => {
    if (phase === 'PICTURE_ID') {
      if (currentIndex < 2) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.idTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_BEFORE_WORDS');
      }
    } 
    else if (phase === 'WORD_1') {
      setPhase('PAUSE_BEFORE_WORD2');
    }
    else if (phase === 'WORD_2_SENTENCE') {
      goToNextStudent();
    }
    else if (phase === 'SCRAMBLED_VIEW') {
      setPhase('SCRAMBLED_WRITE'); 
      setTimeLeft(settings.scrambledWrite); 
      setIsActive(true); 
    }
    else if (phase === 'SCRAMBLED_WRITE') {
      if (currentIndex === 0) {
        setCurrentIndex(1);
        setPhase('PAUSE_BEFORE_SCRAMBLE_2');
      } else {
        setPhase('BOARDS_UP_SCRAMBLE'); 
        setTimeLeft(settings.boardsUpTime); 
        audioRefBoardsUp.current.play().catch(e => console.log("Audio error:", e));
        setIsActive(true);
      }
    }
    else if (phase === 'BOARDS_UP_SCRAMBLE') {
      setCurrentIndex(0);
      setPhase('SCRAMBLED_REVEAL');
    }
    else if (phase === 'SCRAMBLED_REVEAL') {
      if (currentIndex === 0) { 
        setCurrentIndex(1);
        setPhase('PAUSE_BEFORE_REVEAL_2');
      } else {
        setPhase('PAUSE_DICTATION_SENTENCE');
      }
    }
    else if (phase === 'DICTATION_SENTENCE') {
      setPhase('BOARDS_UP_SENTENCE');
      setTimeLeft(settings.boardsUpTime);
      audioRefBoardsUp.current.play().catch(e => console.log("Audio error:", e));
      setIsActive(true);
    }
    else if (phase === 'BOARDS_UP_SENTENCE') {
      setPhase('PAUSE_DICTATION_SPELLING');
    }
    else if (phase === 'DICTATION_SPELLING') {
      setPhase('BOARDS_UP_SPELLING');
      setTimeLeft(settings.boardsUpTime);
      audioRefBoardsUp.current.play().catch(e => console.log("Audio error:", e));
      setIsActive(true);
    }
    else if (phase === 'BOARDS_UP_SPELLING') {
      goToNextStudent();
    }
    else if (phase === 'SPEED_READING') {
      goToNextStudent();
    }
  };

  const startNextPhase = () => {
    if (phase === 'READY') {
      if (round === 1) startRound1();
      else if (round === 2) startRound2();
      else if (round === 3) startRound3();
    }
    else if (phase === 'PAUSE_BEFORE_WORDS') {
      setPhase('WORD_1');
      setDisplayWords(getWords(2).map(formatFinalWord));
      setCurrentIndex(0);
      setTimeLeft(settings.word1Time);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_WORD2') {
      setPhase('WORD_2_SENTENCE');
      setCurrentIndex(1);
      setTimeLeft(settings.word2Time);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_TURN_AROUND' || phase === 'PAUSE_BEFORE_SCRAMBLE_2') {
      setPhase('SCRAMBLED_VIEW');
      setTimeLeft(settings.scrambledView);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_REVEAL_2') {
      setPhase('SCRAMBLED_REVEAL');
    }
    else if (phase === 'PAUSE_DICTATION_SENTENCE') {
      setPhase('DICTATION_SENTENCE');
      setTimeLeft(settings.dictationSent);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_DICTATION_SPELLING') {
      setPhase('DICTATION_SPELLING');
      setTimeLeft(settings.dictationSpell);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('SPEED_READING');
      setTimeLeft(settings.speedReading);
      setIsActive(true);
    }
  };

  const skipPhase = () => {
    setIsActive(false);
    handleAutoTransition();
  };

  const goToNextStudent = () => {
    setIsActive(false);
    setUsedWords(new Set());

    if (currentChildIdx < participants.length - 1) {
      setCurrentChildIdx(prev => prev + 1);
      setPhase('READY');
    } else {
      if (round < 3) {
        setRound(prev => prev + 1);
        setCurrentChildIdx(0);
        setPhase('READY');
      } else {
        setPhase('CONTEST_CLOSING');
      }
    }
  };

  const goToPrevStudent = () => {
    setIsActive(false);
    setPhase('READY');
    if (currentChildIdx > 0) {
      setCurrentChildIdx(prev => prev - 1);
    } else {
      if (round > 1) {
        setRound(prev => prev - 1);
        setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
      }
    }
  };

  const getWords = (qty) => {
    const words = new Set();
    const availableWords = WORDS_POOL.filter(w => !usedWords.has(w));
    if (availableWords.length < qty) {
      setUsedWords(new Set());
      availableWords.push(...WORDS_POOL);
    }
    while(words.size < qty) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      words.add(availableWords.splice(randomIndex, 1)[0]);
    }
    const newUsedWords = new Set(usedWords);
    words.forEach(w => newUsedWords.add(w));
    setUsedWords(newUsedWords);
    return [...words];
  };

  // --- LÓGICA SCRAMBLE: MINÚSCULAS CON RESPETO A LOS DÍAS ---
  const scrambleWord = (word) => {
    const isDay = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(word.toLowerCase().trim());
    
    // Forzamos minúscula a la palabra limpia antes de separarla
    const cleanWord = word.toLowerCase().replace(/\s+/g, '');
    let letters = cleanWord.split('');
    
    // Solo capitalizamos si es un día
    if (isDay) {
      letters[0] = letters[0].toUpperCase();
    }

    let scrambled = cleanWord;
    let attempts = 0;
    while (attempts < 50) {
      for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
      }
      scrambled = letters.join('');
      let samePos = 0;
      for (let i = 0; i < cleanWord.length; i++) {
        if (scrambled[i] === cleanWord[i]) samePos++;
      }
      if (scrambled.toLowerCase() !== cleanWord.toLowerCase() && samePos <= Math.ceil(cleanWord.length * 0.3)) break; 
      attempts++;
    }
    return letters.join(' ');
  };

  const startRound1 = () => {
    setUsedWords(new Set());
    setPhase('PICTURE_ID');
    setDisplayImages([...Array(22).keys()].map(i => `/img/PowerUp1/${i+1}.jpg`).sort(() => Math.random() - 0.5).slice(0,3));
    setCurrentIndex(0);
    setTimeLeft(settings.idTime); 
    setIsActive(true);
  };

  const startRound2 = () => {
    setUsedWords(new Set());
    const wordsToScramble = getWords(2);
    setOriginalWords(wordsToScramble); 
    setDisplayWords(wordsToScramble.map(scrambleWord));
    setPhase('PAUSE_TURN_AROUND');
    setCurrentIndex(0);
  };

  const startRound3 = () => {
    setPhase('PAUSE_BEFORE_SPEED');
    setDisplayWords(getWords(40).map(formatFinalWord)); 
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    
    if (phase === 'WORD_1' || phase === 'PAUSE_BEFORE_WORDS') {
      setPhase('PAUSE_BEFORE_WORDS');
    } 
    else if (phase === 'WORD_2_SENTENCE' || phase === 'PAUSE_BEFORE_WORD2') {
      setPhase('PAUSE_BEFORE_WORD2');
    } 
    else if (phase === 'SCRAMBLED_VIEW' || phase === 'SCRAMBLED_WRITE' || phase === 'BOARDS_UP_SCRAMBLE') {
      if (currentIndex === 0) setPhase('PAUSE_TURN_AROUND');
      else setPhase('PAUSE_BEFORE_SCRAMBLE_2');
    } 
    else if (phase === 'SCRAMBLED_REVEAL' || phase === 'PAUSE_BEFORE_REVEAL_2') {
      if (currentIndex === 0) {
        setPhase('PAUSE_TURN_AROUND'); 
        setCurrentIndex(0); 
      } else {
        setPhase('PAUSE_BEFORE_REVEAL_2');
      }
    } 
    else if (phase === 'DICTATION_SENTENCE' || phase === 'PAUSE_DICTATION_SENTENCE' || phase === 'BOARDS_UP_SENTENCE') {
      setPhase('PAUSE_DICTATION_SENTENCE');
    } 
    else if (phase === 'DICTATION_SPELLING' || phase === 'PAUSE_DICTATION_SPELLING' || phase === 'BOARDS_UP_SPELLING') {
      setPhase('PAUSE_DICTATION_SPELLING');
    } 
    else if (phase === 'SPEED_READING' || phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('PAUSE_BEFORE_SPEED');
    } 
    else {
      setCurrentIndex(0);
      setPhase('READY'); 
    }
  };

  const getPhaseDescription = () => {
    if (phase === 'READY') return "Standby: Waiting to start the sequence.";
    
    if (phase === 'PAUSE_BEFORE_WORDS') return "Up Next: Student reads the word out loud.";
    if (phase === 'PAUSE_BEFORE_WORD2') return "Up Next: Student reads the word and makes a sentence.";
    if (phase === 'PAUSE_TURN_AROUND' || phase === 'PAUSE_BEFORE_SCRAMBLE_2') return "Up Next: Students memorize the scrambled word.";
    if (phase === 'PAUSE_BEFORE_REVEAL_2') return "Up Next: Displaying the correct word on screen.";
    if (phase === 'PAUSE_DICTATION_SENTENCE') return "Up Next: Dictate a full sentence. Students write.";
    if (phase === 'PAUSE_DICTATION_SPELLING') return "Up Next: Dictate a word letter by letter. Students write.";
    if (phase === 'PAUSE_BEFORE_SPEED') return "Up Next: Students read the sequence of words quickly.";

    if (phase === 'PICTURE_ID') return "Task: Student identifies the images on screen.";
    if (phase === 'WORD_1') return "Task: Student reads the word out loud.";
    if (phase === 'WORD_2_SENTENCE') return "Task: Student reads the word and makes a sentence.";
    if (phase === 'SCRAMBLED_VIEW') return "Task: Students memorize the scrambled word.";
    if (phase === 'SCRAMBLED_WRITE') return "Task: Students write the unscrambled word on boards.";
    if (phase.includes('BOARDS_UP')) return "Action: Students turn around and show their boards.";
    if (phase === 'SCRAMBLED_REVEAL') return "Action: Displaying the correct word on screen.";
    if (phase === 'DICTATION_SENTENCE') return "Task: Dictate a full sentence. Students write.";
    if (phase === 'DICTATION_SPELLING') return "Task: Dictate a word letter by letter. Students write.";
    if (phase === 'SPEED_READING') return "Task: Students read the sequence of words quickly.";
    
    if (phase === 'CONTEST_CLOSING') return "The contest is completely finished.";
    return "Follow the on-screen instructions.";
  };

  const getRoundDescription = () => {
    if (round === 1) return "Image + Reading + Sentence";
    if (round === 2) return "Scramble + Dictation";
    if (round === 3) return "Speed Reading";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="bg-violet-700 text-white py-4 px-8 shadow-xl flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Award size={28} className="text-violet-200" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Amazon English Academy</h1>
        </div>
        <div className="bg-white/20 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
          Power Up 1 Contest
        </div>
      </header>

      <div className="w-full flex justify-between items-center py-6 px-12 bg-white border-b shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-violet-600 rounded-full animate-pulse"></span>
            Round {round} - {round === 2 ? "Group Activity" : `Student: ${currentChild?.name || "Participant"}`}
          </p>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
            {phase.replace(/_/g, ' ')}
            {round === 1 && phase === 'PICTURE_ID' && <span className="text-violet-600 ml-2 text-xl">Image {currentIndex + 1}/3</span>}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] pt-1">
            {getPhaseDescription()}
          </p>
        </div>
        <div className={`px-10 py-4 rounded-[2rem] border-4 transition-all shadow-lg ${timeLeft > 0 && timeLeft <= 4 && !phase.includes('PAUSE') && !phase.includes('BOARDS_UP') && !phase.includes('REVEAL') && phase !== 'READY' ? 'bg-red-50 border-red-500 scale-110' : 'bg-slate-900 border-slate-700'}`}>
          <span className={`text-5xl font-mono font-black tabular-nums ${timeLeft > 0 && timeLeft <= 4 && !phase.includes('PAUSE') && !phase.includes('BOARDS_UP') && !phase.includes('REVEAL') && phase !== 'READY' ? 'text-red-600 animate-pulse' : 'text-white'}`}>
            {timeLeft}<span className="text-2xl ml-1">s</span>
          </span>
        </div>
      </div>

      <main className="flex-1 flex items-center justify-center p-8 bg-slate-100 relative">
        {phase === 'SPEED_READING' ? (
          <div className="w-full h-full flex flex-col items-center">
            <div className="flex items-center gap-6 bg-slate-900 px-8 py-3 rounded-full border-4 border-amber-400 shadow-xl mb-6 z-10">
              <span className="text-white font-black tracking-widest uppercase text-base leading-none">READING SENSE</span>
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
            </div>
            <div className="flex-1 w-full max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden">
                <div className="w-full h-full grid grid-cols-5 grid-rows-8 gap-2 p-6 bg-white overflow-hidden rounded-[1.5rem]">
                  {displayWords.map((word, i) => (
                    <div key={`speed-${i}`} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-2 flex items-center gap-2 shadow-sm">
                      <span className="bg-violet-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-md shrink-0">
                        {i + 1}
                      </span>
                      {/* SIN CLASES DE MAYUSCULAS */}
                      <span className="text-base font-black text-slate-800 truncate leading-none">{word}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[60vh] max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
              {(phase === 'READY' || phase.startsWith('PAUSE')) && (
                <div className="text-center animate-in zoom-in duration-300 space-y-6">
                  <div className="w-24 h-24 bg-violet-500/10 text-violet-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    {round === 1 ? <Camera size={48} /> : round === 2 ? <Edit3 size={48} /> : <Zap size={48} />}
                  </div>
                  <h2 className="text-5xl font-black text-white uppercase tracking-widest italic drop-shadow-lg">
                    {phase === 'READY' ? 'SYSTEM READY' : 'STANDBY'}
                  </h2>
                  <p className="text-amber-400 font-bold uppercase text-lg bg-amber-900/40 py-2 px-6 rounded-full border border-amber-500/30 inline-block mt-4">
                     {phase === 'READY' && getRoundDescription()}
                     {phase === 'PAUSE_BEFORE_WORDS' && "Prepare for Word 1"}
                     {phase === 'PAUSE_BEFORE_WORD2' && "Prepare for Word 2 & Sentence"}
                     {phase === 'PAUSE_TURN_AROUND' && "Turn Around & Prepare for Scramble 1"}
                     {phase === 'PAUSE_BEFORE_SCRAMBLE_2' && "Prepare for Scramble 2"}
                     {phase === 'PAUSE_BEFORE_REVEAL_2' && "Reveal Word 2"}
                     {phase === 'PAUSE_DICTATION_SENTENCE' && "Turn Around for Dictation (Sentence)"}
                     {phase === 'PAUSE_DICTATION_SPELLING' && "Turn Around for Dictation (Spelling)"}
                     {phase === 'PAUSE_BEFORE_SPEED' && "Prepare for Speed Reading Challenge"}
                  </p>
                  <br/>
                  <button onClick={startNextPhase} className="mt-4 bg-violet-600 hover:bg-violet-500 px-24 py-8 rounded-[2.5rem] font-black text-white text-3xl shadow-[0_10px_0_0_#4c1d95] active:shadow-none active:translate-y-[15px] transition-all">
                    {phase === 'READY' ? `START ${round === 2 ? 'GROUP ACTIVITY' : 'TURN'}` : 'CONTINUE'}
                  </button>
                </div>
              )}
              {phase === 'PICTURE_ID' && (
                <div className="w-full h-full flex flex-col items-center justify-center p-12">
                  <img src={displayImages[currentIndex]} className="max-h-full rounded-3xl border-8 border-white shadow-2xl animate-in zoom-in" alt="Recognition" />
                </div>
              )}
              
              {(phase === 'WORD_1' || phase === 'WORD_2_SENTENCE') && (
                <div className="flex items-center justify-center w-full px-8">
                  {/* SIN CLASES DE MAYUSCULAS */}
                  <h1 className="text-[10vw] font-black text-white tracking-[0.05em] drop-shadow-2xl text-center leading-tight break-words">{displayWords[currentIndex]}</h1>
                </div>
              )}
              {phase === 'SCRAMBLED_VIEW' && (
                <div className="text-center animate-in zoom-in w-full px-8">
                  <p className="text-violet-400 font-black text-3xl tracking-[0.4em] mb-10 animate-pulse">MEMORIZE SCRAMBLE!</p>
                  {/* SIN CLASES DE MAYUSCULAS */}
                  <h1 className="text-[8vw] font-black text-white tracking-[0.3em] drop-shadow-2xl break-words leading-tight">{displayWords[currentIndex]}</h1>
                </div>
              )}

              {(phase === 'SCRAMBLED_WRITE' || phase.includes('DICTATION')) && !phase.includes('PAUSE') && !phase.includes('BOARDS_UP') && (
                <div className="text-center space-y-8 animate-pulse">
                  <Type size={120} className="text-amber-400 mx-auto drop-shadow-lg" />
                  <h1 className="text-8xl font-black text-amber-400 uppercase italic tracking-tighter">WRITE FAST!</h1>
                </div>
              )}
              {phase.includes('BOARDS_UP') && (
                <div className="text-center animate-in zoom-in duration-300 p-10 space-y-6">
                  <h3 className="text-7xl md:text-8xl font-black text-violet-400 uppercase tracking-tight italic drop-shadow-2xl animate-bounce">BOARDS UP!</h3>
                  <p className="text-white font-black tracking-[0.2em] uppercase text-4xl bg-slate-800 py-4 px-10 rounded-full border border-slate-700 inline-block shadow-xl">TURN AROUND!</p>
                </div>
              )}

              {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
                <div className="bg-emerald-500 px-12 md:px-32 py-16 md:py-20 rounded-[4rem] border-[16px] border-white shadow-2xl animate-in zoom-in max-w-[90%]">
                  <p className="text-emerald-100 font-black text-2xl md:text-3xl tracking-[0.3em] uppercase mb-6 text-center">CORRECT WORD</p>
                  {/* SIN CLASES DE MAYUSCULAS */}
                  <h1 className="text-7xl md:text-9xl font-black text-white tracking-widest text-center break-words leading-tight">{originalWords[currentIndex]}</h1>
                </div>
              )}
              {phase === 'CONTEST_CLOSING' && (
                <div className="text-center animate-in zoom-in duration-1000 space-y-8">
                  <Award size={150} className="text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.6)] animate-pulse" />
                  <h1 className="text-[5vw] font-black text-white uppercase tracking-widest leading-none drop-shadow-2xl">CONTEST COMPLETED</h1>
                </div>
              )}
          </div>
        )}
      </main>

      <footer className="w-full p-4 flex justify-center sticky bottom-0 z-50">
        <div className="w-full max-w-3xl bg-slate-950 p-4 rounded-[2.5rem] flex justify-center gap-4 items-center border border-slate-800 shadow-2xl">
            <button onClick={goToPrevStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Previous Student/Round"><ChevronLeft size={24} /></button>
            <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors mx-2"><Home size={28} /></button>
            <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transform transition-all active:scale-90 ${isActive ? 'bg-red-50 text-white rotate-90' : 'bg-emerald-500 text-white'}`}>
                {isActive ? <Pause size={35} fill="currentColor" /> : <Play size={35} fill="currentColor" className="ml-2"/>}
            </button>
            <button onClick={handleResetTurn} className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all mx-2" title="Reset Phase"><RotateCcw size={28} /></button>
            <button onClick={skipPhase} className="w-14 h-14 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center border border-violet-500/30 hover:bg-violet-500 hover:text-white transition-all" title="Skip to next phase/image"><SkipForward size={28} /></button>
            <button onClick={goToNextStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Next Student/Round"><ChevronRight size={24} /></button>
        </div>
      </footer>
    </div>
  );
};

export default PowerUp1Game;