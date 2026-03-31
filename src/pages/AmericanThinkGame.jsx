import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Ear, Edit3, Zap, Trophy, Award, ChevronLeft, ChevronRight, Type, ArrowRight
} from 'lucide-react';
import { io } from 'socket.io-client';

// Conexión al servidor de WebSockets en Render
const socket = io('https://concursoengllish.onrender.com');

const WORDS_POOL = [
  "kitchen", "living room", "bedroom", "garage", "bathroom", 
  "bathtub", "spring", "beard", "listen", "play", "shopping", 
  "glasses", "smile", "short", "long", "slow", "cheap", 
  "expensive", "fast", "between", "going", "computer", 
  "camera", "goodbye", "later", "cold", "tired", "great", 
  "hungry", "bored", "excited", "winter", "excellent", "funny", 
  "wavy", "sofa", "stove", "armchair", "fridge", "shower", 
  "old", "behind", "across", "corner", "big", "mustache", 
  "blond", "green", "fall"
];

const AmericanThinkGame = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    listenTime1: 10,      
    listenTime2: 18,      
    scrambledView: 3,     
    scrambledWrite: 8,    
    boardsUpTime: 10,    
    dictationSent: 40,    
    dictationSpell: 50,   
    speedRead: 10,        
    recallTime: 18        
  };

  const [currentChildIdx, setCurrentChildIdx] = useState(0);
  const [round, setRound] = useState(1); 
  const [phase, setPhase] = useState('READY'); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [displayWords, setDisplayWords] = useState([]);
  const [originalWords, setOriginalWords] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [usedWords, setUsedWords] = useState(new Set());

  const currentChild = participants[currentChildIdx];
  const intervalRef = useRef(null);
  
  const audioRefBoardsUp = useRef(new Audio('/audio/boards-up.mp3'));
  const audioRefTimeOut = useRef(new Audio('/sounds/time.mp3'));

  useEffect(() => {
    return () => {
      socket.emit('clear_state');
    };
  }, []);

  useEffect(() => {
    socket.emit('sync_state', {
      game: 'AMERICAN_THINK',
      round, phase, timeLeft, 
      displayWords, originalWords, currentIndex,
      participantNumber: currentChild?.order_number,
      triggerAudio: phase.includes('BOARDS_UP') && timeLeft === settings.boardsUpTime
    });
  }, [round, phase, timeLeft, displayWords, originalWords, currentIndex, currentChild]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false); 
      
      const shouldPlayAlarm = [
        'LISTENING_1', 'LISTENING_2', 
        'SCRAMBLED_WRITE', 'DICTATION_SENTENCE', 'DICTATION_SPELLING',
        'SPEED_READING', 'STOP_RECALL'
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
    if (phase === 'LISTENING_1') {
      setPhase('PAUSE_LISTEN_2');
      setCurrentIndex(1);
    }
    else if (phase === 'LISTENING_2') {
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
        audioRefBoardsUp.current.play().catch(e => console.log(e));
        setIsActive(true);
      }
    }
    else if (phase === 'BOARDS_UP_SCRAMBLE') {
      setCurrentIndex(0); 
      setPhase('PAUSE_BEFORE_REVEAL');
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
      audioRefBoardsUp.current.play().catch(e => console.log(e));
      setIsActive(true);
    }
    else if (phase === 'BOARDS_UP_SENTENCE') {
      setPhase('PAUSE_DICTATION_SPELLING');
    }
    else if (phase === 'DICTATION_SPELLING') {
      setPhase('BOARDS_UP_SPELLING');
      setTimeLeft(settings.boardsUpTime);
      audioRefBoardsUp.current.play().catch(e => console.log(e));
      setIsActive(true);
    }
    else if (phase === 'BOARDS_UP_SPELLING') {
      goToNextStudent(); 
    }
    else if (phase === 'SPEED_READING') {
      setPhase('STOP_RECALL');
      setTimeLeft(settings.recallTime);
      setIsActive(true);
    }
    else if (phase === 'STOP_RECALL') {
      goToNextStudent();
    }
  };

  const startNextPhase = () => {
    if (phase === 'READY') {
      if (round === 1) startRound1();
      else if (round === 2) startRound2();
      else if (round === 3) startRound3();
    }
    else if (phase === 'PAUSE_LISTEN_1') {
      setPhase('LISTENING_1');
      setTimeLeft(settings.listenTime1);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_LISTEN_2') {
      setPhase('LISTENING_2');
      setTimeLeft(settings.listenTime2);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_SCRAMBLE' || phase === 'PAUSE_BEFORE_SCRAMBLE_2') {
      setPhase('SCRAMBLED_VIEW');
      setTimeLeft(settings.scrambledView);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_REVEAL' || phase === 'PAUSE_BEFORE_REVEAL_2') {
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
      setTimeLeft(settings.speedRead);
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
    setOriginalWords([]);
    if (round === 2) {
      setRound(3);
      setCurrentChildIdx(0);
      setPhase('READY');
      return;
    }
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
    if (round === 2) {
      setRound(1);
      setCurrentChildIdx(participants.length - 1);
    } else if (round > 1 && currentChildIdx === 0) {
      setRound(prev => prev - 1);
      setCurrentChildIdx(participants.length - 1);
    } else if (currentChildIdx > 0) {
      setCurrentChildIdx(prev => prev - 1);
    }
  };

  const getWords = (qty) => {
    const words = new Set();
    const availableWords = WORDS_POOL.filter(w => !usedWords.has(w));
    const limit = Math.min(qty, WORDS_POOL.length);
    if (availableWords.length < limit) {
      setUsedWords(new Set());
      availableWords.length = 0;
      availableWords.push(...WORDS_POOL);
    }
    while(words.size < limit) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      words.add(availableWords.splice(randomIndex, 1)[0]);
    }
    const newUsedWords = new Set(usedWords);
    words.forEach(w => newUsedWords.add(w));
    setUsedWords(newUsedWords);
    return [...words];
  };

  const scrambleWord = (word) => {
    const cleanWord = word.replace(/\s+/g, '');
    let letters = cleanWord.split('');
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
      if (scrambled !== cleanWord && samePos <= Math.ceil(cleanWord.length * 0.3)) break; 
      attempts++;
    }
    return letters.join(' ');
  };

  const startRound1 = () => {
    setUsedWords(new Set());
    setDisplayWords(getWords(2));
    setCurrentIndex(0);
    setPhase('PAUSE_LISTEN_1');
  };

  const startRound2 = () => {
    setUsedWords(new Set());
    const words = getWords(2);
    setOriginalWords(words); 
    setDisplayWords(words.map(scrambleWord));
    setPhase('PAUSE_BEFORE_SCRAMBLE');
    setCurrentIndex(0);
  };

  const startRound3 = () => {
    setPhase('PAUSE_BEFORE_SPEED');
    setDisplayWords(getWords(40)); 
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    
    if (phase === 'LISTENING_1' || phase === 'PAUSE_LISTEN_1') {
      setPhase('PAUSE_LISTEN_1');
    } 
    else if (phase === 'LISTENING_2' || phase === 'PAUSE_LISTEN_2') {
      setPhase('PAUSE_LISTEN_2');
    } 
    else if (phase === 'SCRAMBLED_VIEW' || phase === 'SCRAMBLED_WRITE' || phase === 'BOARDS_UP_SCRAMBLE') {
      if (currentIndex === 0) setPhase('PAUSE_BEFORE_SCRAMBLE');
      else setPhase('PAUSE_BEFORE_SCRAMBLE_2');
    } 
    else if (phase === 'SCRAMBLED_REVEAL' || phase === 'PAUSE_BEFORE_REVEAL' || phase === 'PAUSE_BEFORE_REVEAL_2') {
      if (currentIndex === 0) setPhase('PAUSE_BEFORE_REVEAL'); 
      else setPhase('PAUSE_BEFORE_REVEAL_2');
    } 
    else if (phase === 'DICTATION_SENTENCE' || phase === 'PAUSE_DICTATION_SENTENCE' || phase === 'BOARDS_UP_SENTENCE') {
      setPhase('PAUSE_DICTATION_SENTENCE');
    } 
    else if (phase === 'DICTATION_SPELLING' || phase === 'PAUSE_DICTATION_SPELLING' || phase === 'BOARDS_UP_SPELLING') {
      setPhase('PAUSE_DICTATION_SPELLING');
    } 
    else if (phase === 'SPEED_READING' || phase === 'STOP_RECALL' || phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('PAUSE_BEFORE_SPEED');
    } 
    else {
      setCurrentIndex(0);
      setPhase('READY'); 
    }
  };

  // --- FUNCIONES AÑADIDAS PARA LAS DESCRIPCIONES ---
  const getPhaseDescription = () => {
    if (phase === 'READY') return "Standby: Waiting to start the sequence.";
    
    if (phase === 'PAUSE_LISTEN_1') return "Up Next: Student listens to word 1 and repeats/spells.";
    if (phase === 'PAUSE_LISTEN_2') return "Up Next: Student listens to word 2.";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE') return "Up Next: Students memorize scrambled word 1.";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE_2') return "Up Next: Students memorize scrambled word 2.";
    if (phase === 'PAUSE_BEFORE_REVEAL') return "Up Next: Reveal correct word 1.";
    if (phase === 'PAUSE_BEFORE_REVEAL_2') return "Up Next: Reveal correct word 2.";
    if (phase === 'PAUSE_DICTATION_SENTENCE') return "Up Next: Dictate a full sentence. Students write.";
    if (phase === 'PAUSE_DICTATION_SPELLING') return "Up Next: Dictate a word letter by letter. Students write.";
    if (phase === 'PAUSE_BEFORE_SPEED') return "Up Next: Speed Reading Challenge.";

    if (phase === 'LISTENING_1' || phase === 'LISTENING_2') return "Task: Student repeats, spells, repeats, and makes a sentence.";
    if (phase === 'SCRAMBLED_VIEW') return "Task: Students memorize the scrambled word.";
    if (phase === 'SCRAMBLED_WRITE') return "Task: Students write the unscrambled word on boards.";
    if (phase.includes('BOARDS_UP')) return "Action: Students turn around and show their boards.";
    if (phase === 'SCRAMBLED_REVEAL') return "Action: Displaying the correct word on screen.";
    if (phase === 'DICTATION_SENTENCE') return "Task: Dictate a full sentence. Students write.";
    if (phase === 'DICTATION_SPELLING') return "Task: Dictate a word letter by letter. Students write.";
    if (phase === 'SPEED_READING') return "Task: Students read the sequence of words quickly.";
    if (phase === 'STOP_RECALL') return "Task: Student spells the LAST word they read.";
    
    if (phase === 'CONTEST_CLOSING') return "The contest is completely finished.";
    return "Follow the on-screen instructions.";
  };

  const getRoundDescription = () => {
    if (round === 1) return "Listening Comprehension & Spelling";
    if (round === 2) return "Scramble & Dictation (Group Activity)";
    if (round === 3) return "Speed Reading & Recall";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="bg-orange-500 text-white py-4 px-8 shadow-xl flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <Award size={28} className="text-orange-200" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Amazon English Academy</h1>
        </div>
        <div className="bg-white/20 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
          American Think Starters
        </div>
      </header>

      {/* INFO BAR CON DESCRIPCIONES */}
      <div className="w-full flex justify-between items-center py-6 px-12 bg-white border-b shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-600 rounded-full animate-pulse"></span>
            Round {round} - {round === 2 ? "Group Activity" : `Participant #${currentChild?.order_number || "..."}`}
          </p>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            {phase.replace(/_/g, ' ')}
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
                      <span className="bg-orange-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-base font-black text-slate-800 truncate leading-none lowercase">{word}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[60vh] max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
            {(phase === 'READY' || phase.startsWith('PAUSE')) && (
              <div className="text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg mb-6">
                  {round === 1 ? <Ear size={48} /> : round === 2 ? <Edit3 size={48} /> : <Zap size={48} />}
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-widest italic drop-shadow-lg">
                  {phase === 'READY' ? 'SYSTEM READY' : 'STANDBY'}
                </h2>
                
                <p className="text-amber-400 font-bold uppercase text-lg bg-amber-900/40 py-2 px-6 rounded-full border border-amber-500/30 inline-block mt-4">
                  {phase === 'READY' && getRoundDescription()}
                  {phase === 'PAUSE_LISTEN_1' && "Turn Around & Listen to Word 1"}
                  {phase === 'PAUSE_LISTEN_2' && "Turn Around & Listen to Word 2"}
                  {phase === 'PAUSE_BEFORE_SCRAMBLE' && "Look at the Screen! Word 1"}
                  {phase === 'PAUSE_BEFORE_SCRAMBLE_2' && "Look at the Screen! Word 2"}
                  {phase === 'PAUSE_BEFORE_REVEAL' && "Reveal Word 1"}
                  {phase === 'PAUSE_BEFORE_REVEAL_2' && "Reveal Word 2"}
                  {phase === 'PAUSE_DICTATION_SENTENCE' && "Turn Around for Dictation (Sentence)"}
                  {phase === 'PAUSE_DICTATION_SPELLING' && "Turn Around for Dictation (Spelling)"}
                  {phase === 'PAUSE_BEFORE_SPEED' && "Prepare for Speed Reading Challenge"}
                </p>
                
                <br/>
                <button onClick={startNextPhase} className="mt-8 bg-orange-500 hover:bg-orange-600 px-24 py-10 rounded-[2.5rem] font-black text-white text-3xl shadow-[0_15px_0_0_#c2410c] active:shadow-none active:translate-y-[15px] transition-all">
                  {phase === 'READY' ? `START ${round === 2 ? 'GROUP ACTIVITY' : 'TURN'}` : 'CONTINUE'}
                </button>
              </div>
            )}
            
            {(phase === 'LISTENING_1' || phase === 'LISTENING_2') && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in">
                <div className="w-[95%] max-w-5xl bg-slate-800 px-6 py-12 rounded-[2rem] border-4 border-amber-400 shadow-inner flex items-center justify-center">
                  <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black text-white tracking-[0.05em] text-center leading-tight break-words lowercase">{displayWords[currentIndex]}</h1>
                </div>
                <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest shadow-lg text-center">
                  Say ➜ Spell ➜ Say {phase === 'LISTENING_2' && '➜ Sentence'}
                </div>
              </div>
            )}

            {phase === 'SCRAMBLED_VIEW' && (
              <div className="text-center animate-in zoom-in duration-200">
                <p className="text-orange-400 font-black text-3xl tracking-[0.4em] mb-10 animate-pulse">MEMORIZE SCRAMBLE!</p>
                <h1 className="text-[10vw] font-black text-white tracking-[0.4em] drop-shadow-2xl leading-none lowercase">{displayWords[currentIndex]}</h1>
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
                <h3 className="text-7xl md:text-8xl font-black text-orange-400 uppercase tracking-tight italic drop-shadow-2xl animate-bounce">BOARDS UP!</h3>
                <p className="text-white font-black tracking-[0.2em] uppercase text-4xl bg-slate-800 py-4 px-10 rounded-full border border-slate-700 inline-block shadow-xl">TURN AROUND!</p>
              </div>
            )}

            {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
              <div className="bg-emerald-500 px-32 py-20 rounded-[4rem] border-[16px] border-white shadow-2xl animate-in zoom-in">
                <p className="text-emerald-100 font-black text-3xl tracking-[0.3em] uppercase mb-6 text-center">CORRECT WORD</p>
                <h1 className="text-9xl font-black text-white tracking-widest text-center lowercase">{originalWords[currentIndex]}</h1>
              </div>
            )}

            {phase === 'STOP_RECALL' && (
              <div className="text-center animate-in zoom-in duration-300 p-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-[8rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]">STOP!</h3>
                <p className="text-white mt-12 font-black tracking-widest uppercase text-5xl bg-slate-800 py-4 px-10 rounded-full inline-block border border-slate-700 shadow-xl">Recall LAST word ➜ Say, Spell, Say, Sentence</p>
              </div>
            )}

            {phase === 'CONTEST_CLOSING' && (
              <div className="text-center animate-in zoom-in duration-1000 space-y-8">
                <Trophy size={150} className="text-amber-400 mx-auto drop-shadow-lg animate-pulse" />
                <h1 className="text-[5vw] font-black text-white uppercase tracking-widest leading-none drop-shadow-2xl">CONTEST COMPLETED</h1>
                <p className="text-orange-400 font-black text-4xl tracking-[0.3em] uppercase">Amazon English Academy</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full p-4 flex justify-center sticky bottom-0 z-50">
        <div className="w-full max-w-3xl bg-slate-950 p-4 rounded-[2.5rem] flex justify-center gap-4 items-center border border-slate-800 shadow-2xl">
            <button onClick={goToPrevStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700">
                <ChevronLeft size={24} />
            </button>
            <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors mx-2">
                <Home size={28} />
            </button>
            <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transform transition-all active:scale-90 ${isActive ? 'bg-red-50 text-white rotate-90' : 'bg-emerald-500 text-white'}`}>
                {isActive ? <Pause size={35} fill="currentColor" /> : <Play size={35} fill="currentColor" className="ml-2"/>}
            </button>
            <button onClick={handleResetTurn} className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all mx-2">
                <RotateCcw size={28} />
            </button>
            <button onClick={skipPhase} className="w-14 h-14 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                <SkipForward size={28} />
            </button>
            <button onClick={goToNextStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700">
                <ChevronRight size={24} />
            </button>
        </div>
      </footer>
    </div>
  );
};

export default AmericanThinkGame;