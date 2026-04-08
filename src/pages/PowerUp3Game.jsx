import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Eye, Edit3, Zap, Award, ChevronLeft, ChevronRight, Type, ArrowRight 
} from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('https://concursoengllish.onrender.com');

const WORDS_POOL = [
  "pyjamas", "surprised", "building", "clothes", "tired", 
  "worried", "suitcases", "frightened", "parrot", "milkshake", 
  "pancakes", "strawberry", "yogurt", "noodles", "crayon", 
  "sheep", "bookcase", "helmet", "breakfast", "playground", 
  "crocodile", "shower", "kicking", "skating", "farmer", 
  "hockey", "face", "cupboard", "angry", "bathroom", 
  "giraffe", "lizard", "skates", "swimming", "beautiful", 
  "catching", "motorbike", "baseball", "flower", "toothbrush", 
  "horse", "firefighter", "goat", "arrive", "cage", 
  "smile", "hotel", "coffee", "write"
];

const PowerUp3Game = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    readTime: 2,          
    listenTime: 20,       
    scrambledView: 5,     
    scrambledWrite: 10,  
    boardsUpTime: 10,     
    dictationTime: 20,    
    speedTime: 10 // Ahora solo hay un tiempo de velocidad
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
      game: 'POWER_UP_3',
      round, phase, timeLeft, 
      displayWords: displayWords.map(w => w), 
      originalWords: originalWords.map(formatFinalWord),
      currentIndex,
      participantNumber: currentChild?.order_number,
      triggerAudio: phase.includes('BOARDS_UP') && timeLeft === settings.boardsUpTime 
    });
  }, [round, phase, timeLeft, displayWords, originalWords, currentIndex, currentChild]);

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setIsActive(false); 
      
      const shouldPlayAlarm = [
        'LISTENING_1', 'LISTENING_2', 
        'SCRAMBLED_WRITE', 'DICTATION_SENTENCE', 'DICTATION_SPELLING',
        'SPEED_READING', 'SPELL_LAST_WORD'
      ].includes(phase);

      if (shouldPlayAlarm) {
        audioRefTimeOut.current.currentTime = 0;
        audioRefTimeOut.current.play().catch(e => console.log("Audio Error:", e));
      }

      handleAutoTransition(); 
    }
  }, [isActive, timeLeft, phase]);

  const handleAutoTransition = () => {
    if (phase === 'READING_WORDS') {
      if (currentIndex < 2) { 
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.readTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_LISTEN_1'); 
        setCurrentIndex(3); 
      }
    } 
    else if (phase === 'LISTENING_1') {
      setPhase('PAUSE_LISTEN_2');
      setCurrentIndex(4); 
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
      if (currentIndex < 2) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setPhase(`PAUSE_BEFORE_SCRAMBLE_${nextIdx + 1}`);
      } else {
        setPhase('BOARDS_UP_SCRAMBLE');
        setTimeLeft(settings.boardsUpTime); 
        audioRefBoardsUp.current.play().catch(e => console.log(e));
        setIsActive(true);
      }
    }
    else if (phase === 'BOARDS_UP_SCRAMBLE') {
      setPhase('PAUSE_BEFORE_REVEAL'); 
    }
    else if (phase === 'SCRAMBLED_REVEAL') {
      setPhase('PAUSE_DICTATION_SENTENCE'); 
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
      setPhase('SPELL_LAST_WORD');
      setTimeLeft(10);
      setIsActive(true);
    }
    else if (phase === 'SPELL_LAST_WORD') {
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
      setTimeLeft(settings.listenTime);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_LISTEN_2') {
      setPhase('LISTENING_2');
      setTimeLeft(settings.listenTime);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_SCRAMBLE' || phase === 'PAUSE_BEFORE_SCRAMBLE_2' || phase === 'PAUSE_BEFORE_SCRAMBLE_3') {
      setPhase('SCRAMBLED_VIEW');
      setTimeLeft(settings.scrambledView);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_REVEAL') {
      setPhase('SCRAMBLED_REVEAL');
    }
    else if (phase === 'PAUSE_DICTATION_SENTENCE') {
      setPhase('DICTATION_SENTENCE');
      setTimeLeft(settings.dictationTime);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_DICTATION_SPELLING') {
      setPhase('DICTATION_SPELLING');
      setTimeLeft(settings.dictationTime + 10);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('SPEED_READING');
      setTimeLeft(settings.speedTime); 
      setIsActive(true);
    }
  };

  const skipPhase = () => {
    setIsActive(false);
    if (phase === 'READING_WORDS') {
      if (currentIndex < 2) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.readTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_LISTEN_1');
        setCurrentIndex(3);
        setTimeLeft(0);
      }
    } else {
      handleAutoTransition();
    }
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
      if (round === 1) {
        setRound(2);
        setCurrentChildIdx(0);
        setPhase('READY');
      } else if (round === 3) {
        setPhase('CONTEST_CLOSING');
      }
    }
  };

  const goToPrevStudent = () => {
    setIsActive(false);
    setPhase('READY');
    
    if (round === 2) {
      setRound(1);
      setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
    } 
    else if (round === 3 && currentChildIdx === 0) {
      setRound(2);
      setCurrentChildIdx(0);
    } 
    else if (currentChildIdx > 0) {
      setCurrentChildIdx(prev => prev - 1);
    }
  };

  const getWords = (qty) => {
    const words = new Set();
    const availableWords = WORDS_POOL.filter(w => !usedWords.has(w));
    const maxQty = Math.min(qty, WORDS_POOL.length);
    
    if (availableWords.length < maxQty) {
      setUsedWords(new Set());
      availableWords.length = 0;
      availableWords.push(...WORDS_POOL);
    }
    while(words.size < maxQty) {
      const randomIndex = Math.floor(Math.random() * availableWords.length);
      words.add(availableWords.splice(randomIndex, 1)[0]);
    }
    const newUsedWords = new Set(usedWords);
    words.forEach(w => newUsedWords.add(w));
    setUsedWords(newUsedWords);
    return [...words];
  };

  const scrambleWord = (word) => {
    const isDay = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(word.toLowerCase().trim());
    const cleanWord = word.replace(/\s+/g, '');
    let letters = cleanWord.split('');
    
    if (isDay) {
      letters = cleanWord.toLowerCase().split('');
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
      if (scrambled.toLowerCase() !== cleanWord.toLowerCase() && samePos <= Math.ceil(cleanWord.length * 0.3)) {
        break; 
      }
      attempts++;
    }
    return letters.join(' ');
  };

  const startRound1 = () => {
    setUsedWords(new Set());
    setPhase('READING_WORDS');
    setDisplayWords(getWords(5).map(formatFinalWord)); 
    setCurrentIndex(0);
    setTimeLeft(settings.readTime); 
    setIsActive(true);
  };

  const startRound2 = () => {
    setUsedWords(new Set());
    const wordsToScramble = getWords(3);
    setOriginalWords(wordsToScramble); 
    setDisplayWords(wordsToScramble.map(scrambleWord));
    setPhase('PAUSE_BEFORE_SCRAMBLE');
    setCurrentIndex(0);
  };

  const startRound3 = () => {
    setUsedWords(new Set());
    setPhase('PAUSE_BEFORE_SPEED');
    setDisplayWords(getWords(49).map(formatFinalWord)); 
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    
    if (phase === 'READING_WORDS') {
      setCurrentIndex(0);
      setPhase('READY'); 
    }
    else if (phase === 'LISTENING_1' || phase === 'PAUSE_LISTEN_1') {
      setPhase('PAUSE_LISTEN_1');
    } 
    else if (phase === 'LISTENING_2' || phase === 'PAUSE_LISTEN_2') {
      setPhase('PAUSE_LISTEN_2');
    } 
    else if (phase === 'SCRAMBLED_VIEW' || phase === 'SCRAMBLED_WRITE' || phase === 'BOARDS_UP_SCRAMBLE') {
      if (currentIndex === 0) setPhase('PAUSE_BEFORE_SCRAMBLE');
      else if (currentIndex === 1) setPhase('PAUSE_BEFORE_SCRAMBLE_2');
      else setPhase('PAUSE_BEFORE_SCRAMBLE_3');
    } 
    else if (phase === 'SCRAMBLED_REVEAL' || phase === 'PAUSE_BEFORE_REVEAL') {
      setPhase('PAUSE_BEFORE_REVEAL');
    } 
    else if (phase === 'DICTATION_SENTENCE' || phase === 'PAUSE_DICTATION_SENTENCE' || phase === 'BOARDS_UP_SENTENCE') {
      setPhase('PAUSE_DICTATION_SENTENCE');
    } 
    else if (phase === 'DICTATION_SPELLING' || phase === 'PAUSE_DICTATION_SPELLING' || phase === 'BOARDS_UP_SPELLING') {
      setPhase('PAUSE_DICTATION_SPELLING');
    } 
    else if (phase === 'SPEED_READING' || phase === 'SPELL_LAST_WORD' || phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('PAUSE_BEFORE_SPEED');
    } 
    else {
      setCurrentIndex(0);
      setPhase('READY'); 
    }
  };

  const getPhaseDescription = () => {
    if (phase === 'READY') return "Standby: Waiting to start the sequence.";
    
    if (phase === 'PAUSE_LISTEN_1') return "Up Next: Student listens to word 1 and repeats/spells.";
    if (phase === 'PAUSE_LISTEN_2') return "Up Next: Student listens to word 2.";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE') return "Up Next: Students memorize scrambled word 1.";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE_2') return "Up Next: Students memorize scrambled word 2.";
    if (phase === 'PAUSE_BEFORE_SCRAMBLE_3') return "Up Next: Students memorize scrambled word 3.";
    if (phase === 'PAUSE_BEFORE_REVEAL') return "Up Next: Reveal all correct words.";
    if (phase === 'PAUSE_DICTATION_SENTENCE') return "Up Next: Dictate a full sentence. Students write.";
    if (phase === 'PAUSE_DICTATION_SPELLING') return "Up Next: Dictate a word letter by letter. Students write.";
    if (phase === 'PAUSE_BEFORE_SPEED') return "Up Next: Speed Reading.";

    if (phase === 'READING_WORDS') return "Task: Student reads the words on screen.";
    if (phase === 'LISTENING_1' || phase === 'LISTENING_2') return "Task: Student repeats, spells, repeats, and makes a sentence.";
    if (phase === 'SCRAMBLED_VIEW') return "Task: Students memorize the scrambled word.";
    if (phase === 'SCRAMBLED_WRITE') return "Task: Students write the unscrambled word on boards.";
    if (phase.includes('BOARDS_UP')) return "Action: Students turn around and show their boards.";
    if (phase === 'SCRAMBLED_REVEAL') return "Action: Displaying the correct words on screen.";
    if (phase === 'DICTATION_SENTENCE') return "Task: Dictate a full sentence. Students write.";
    if (phase === 'DICTATION_SPELLING') return "Task: Dictate a word letter by letter. Students write.";
    
    if (phase === 'SPEED_READING') return "Task: Read as fast as possible, remember the LAST word, spell it and make a sentence.";
    if (phase === 'SPELL_LAST_WORD') return "Task: Student spells the LAST word they read and makes a sentence.";
    
    if (phase === 'CONTEST_CLOSING') return "The contest is completely finished.";
    return "Follow the on-screen instructions.";
  };

  const getRoundDescription = () => {
    if (round === 1) return "Reading & Listening Comprehension";
    if (round === 2) return "Scramble & Dictation (Group Activity)";
    if (round === 3) return "Speed Reading & Recall";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="bg-rose-600 text-white py-4 px-8 shadow-xl flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
            <Award size={28} className="text-rose-200" />
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Amazon English Academy</h1>
        </div>
        <div className="bg-white/20 px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-white/30">
            Power Up 3 Contest
        </div>
      </header>

      <div className="w-full flex justify-between items-center py-6 px-12 bg-white border-b shadow-sm">
        <div className="space-y-1">
            <p className="text-sm font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-rose-600 rounded-full animate-pulse"></span>
                Round {round} - {round === 2 ? "Group Activity" : `Student: ${currentChild?.name || "Participant"}`}
            </p>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">
                {phase.replace(/_/g, ' ')}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] pt-1">
              {getPhaseDescription()}
            </p>
        </div>

        <div className={`px-10 py-4 rounded-[2rem] border-4 transition-all shadow-lg ${timeLeft > 0 && timeLeft <= 4 && !phase.includes('PAUSE') && !phase.includes('REVEAL') && phase !== 'READY' ? 'bg-red-50 border-red-500 scale-110' : 'bg-slate-900 border-slate-700'}`}>
          <span className={`text-5xl font-mono font-black tabular-nums ${timeLeft > 0 && timeLeft <= 4 && !phase.includes('PAUSE') && !phase.includes('REVEAL') && phase !== 'READY' ? 'text-red-600 animate-pulse' : 'text-white'}`}>
            {timeLeft}<span className="text-2xl ml-1">s</span>
          </span>
        </div>
      </div>

      <main className="flex-1 w-full flex items-center justify-center p-8 bg-slate-100 relative">
        {phase === 'SPEED_READING' ? (
          <div className="w-full h-full flex flex-col items-center">
            <div className="flex items-center gap-6 bg-slate-900 px-8 py-3 rounded-full border-4 border-amber-400 shadow-xl mb-6 z-10 transition-all">
              <span className="text-white font-black tracking-widest uppercase text-base leading-none">READING SENSE</span>
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
              <ArrowRight size={36} className="text-amber-400 animate-pulse" />
            </div>
            
            <div className="flex-1 w-full max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
                <div className="w-full h-full grid grid-cols-5 grid-rows-10 gap-1.5 p-4 bg-white overflow-hidden rounded-[1.5rem]">
                  {displayWords.map((word, i) => (
                    <div key={`speed-${i}`} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 flex items-center gap-2 shadow-sm">
                      <span className="bg-rose-600 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shadow-md shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-black text-slate-800 truncate leading-none">{word}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-[60vh] max-w-7xl bg-slate-900 rounded-[3rem] border-[16px] border-slate-800 flex flex-col items-center justify-center relative shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden">
            
            {(phase === 'READY' || phase.startsWith('PAUSE')) && (
              <div className="text-center animate-in zoom-in duration-300 space-y-6">
                <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  {round === 1 ? <Eye size={48} /> : round === 2 ? <Edit3 size={48} /> : <Zap size={48} />}
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
                  {phase === 'PAUSE_BEFORE_SCRAMBLE_3' && "Look at the Screen! Word 3"}
                  {phase === 'PAUSE_BEFORE_REVEAL' && "Reveal Correct Words"}
                  {phase === 'PAUSE_DICTATION_SENTENCE' && "Turn Around for Dictation (Sentence)"}
                  {phase === 'PAUSE_DICTATION_SPELLING' && "Turn Around for Dictation (Spelling)"}
                  {phase === 'PAUSE_BEFORE_SPEED' && "Prepare for Speed Reading"}
                </p>

                <br/>
                <button onClick={startNextPhase} className="mt-8 bg-rose-600 hover:bg-rose-500 px-24 py-10 rounded-[2.5rem] font-black text-white text-4xl shadow-[0_15px_0_0_#be123c] active:shadow-none active:translate-y-[15px] transition-all">
                  {phase === 'READY' ? `START ${round === 2 ? 'GROUP ACTIVITY' : 'TURN'}` : 'CONTINUE'}
                </button>
              </div>
            )}

            {phase === 'READING_WORDS' && (
              <div className="w-full h-full flex flex-col items-center justify-between py-16 px-10 animate-in fade-in">
                <div className="flex-1 flex items-center justify-center w-full">
                  <h1 className="text-[10vw] font-black text-white tracking-[0.05em] drop-shadow-2xl text-center leading-tight break-words px-8 w-full">
                    {displayWords[currentIndex]}
                  </h1>
                </div>
                <div className="w-full max-w-4xl bg-rose-600/20 border border-rose-500/30 py-6 rounded-3xl backdrop-blur-md">
                  <p className="text-rose-300 text-3xl font-black text-center uppercase tracking-[0.15em] italic">Read Aloud!</p>
                </div>
              </div>
            )}

            {(phase === 'LISTENING_1' || phase === 'LISTENING_2') && (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 gap-8 animate-in zoom-in">
                <div className="w-[95%] max-w-5xl bg-slate-800 px-6 py-12 rounded-[2rem] border-4 border-amber-400 shadow-inner flex items-center justify-center">
                  <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-black text-white tracking-[0.05em] text-center leading-tight break-words px-4">
                    {displayWords[currentIndex]}
                  </h1>
                </div>
                <div className="bg-amber-400 text-amber-950 px-8 py-3 rounded-full font-black text-xl uppercase tracking-widest shadow-lg text-center">
                  Repeat ➜ Spell ➜ Repeat ➜ Sentence (6+ words)
                </div>
              </div>
            )}

            {phase === 'SCRAMBLED_VIEW' && (
              <div className="text-center animate-in zoom-in duration-200 w-full px-8">
                <p className="text-rose-400 font-black text-3xl tracking-[0.4em] mb-10 animate-pulse">MEMORIZE SCRAMBLE!</p>
                <h1 className="text-[8vw] font-black text-white tracking-[0.4em] drop-shadow-2xl leading-tight break-words">{displayWords[currentIndex]}</h1>
              </div>
            )}

            {(phase === 'SCRAMBLED_WRITE' || phase.includes('DICTATION')) && !phase.includes('PAUSE') && !phase.includes('BOARDS_UP') && (
              <div className="text-center space-y-8 animate-pulse">
                <Type size={120} className="text-amber-400 mx-auto drop-shadow-lg" />
                <h1 className="text-8xl font-black text-amber-400 uppercase italic tracking-tighter">{phase === 'SCRAMBLED_WRITE' ? 'WRITE FAST!' : 'LISTEN & WRITE!'}</h1>
              </div>
            )}

            {phase.includes('BOARDS_UP') && (
              <div className="text-center animate-in zoom-in duration-300 p-10 space-y-6">
                <h3 className="text-7xl md:text-8xl font-black text-sky-400 uppercase tracking-tight italic drop-shadow-2xl animate-bounce">
                  BOARDS UP!
                </h3>
                <p className="text-white font-black tracking-[0.2em] uppercase text-4xl bg-slate-800 py-4 px-10 rounded-full border border-slate-700 inline-block shadow-xl">TURN AROUND!</p>
              </div>
            )}

            {/* REVELAR TODAS LAS PALABRAS AL MISMO TIEMPO */}
            {phase === 'SCRAMBLED_REVEAL' && originalWords?.length > 0 && (
              <div className="bg-emerald-500 px-12 md:px-24 py-12 md:py-16 rounded-[4rem] border-[16px] border-white shadow-2xl animate-in zoom-in max-w-[90%] w-full flex flex-col items-center">
                <p className="text-emerald-100 font-black text-2xl md:text-3xl tracking-[0.3em] uppercase mb-8 text-center">CORRECT WORDS</p>
                <div className="flex flex-col gap-6 items-center w-full">
                  {originalWords.map((word, idx) => (
                    <h1 key={idx} className="text-5xl md:text-7xl font-black text-white tracking-widest text-center break-words leading-tight">{word}</h1>
                  ))}
                </div>
              </div>
            )}

            {phase === 'SPELL_LAST_WORD' && (
              <div className="text-center animate-in zoom-in duration-300 p-10 flex flex-col items-center justify-center h-full">
                <h3 className="text-[8rem] font-black text-red-500 uppercase tracking-tight italic animate-bounce drop-shadow-[0_0_40px_rgba(239,68,68,0.6)]">STOP!</h3>
                <p className="text-white mt-12 font-black tracking-widest uppercase text-5xl bg-slate-800 py-4 px-10 rounded-full inline-block border border-slate-700 shadow-xl">Spell the LAST word you read!</p>
              </div>
            )}

            {phase === 'CONTEST_CLOSING' && (
              <div className="text-center animate-in zoom-in duration-1000 space-y-8">
                <Award size={150} className="text-amber-400 mx-auto drop-shadow-[0_0_50px_rgba(251,191,36,0.6)] animate-pulse" />
                <h1 className="text-[5vw] font-black text-white uppercase tracking-widest leading-none drop-shadow-2xl">CONTEST COMPLETED</h1>
                <p className="text-rose-400 font-black text-4xl tracking-[0.3em] uppercase">Amazon English Academy</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full p-4 flex justify-center sticky bottom-0 z-50">
        <div className="w-full max-w-3xl bg-slate-950 p-4 rounded-[2.5rem] flex justify-center gap-4 items-center border border-slate-800 shadow-2xl">
            <button onClick={goToPrevStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Previous Student/Round"><ChevronLeft size={24} /></button>
            <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors mx-2"><Home size={28} /></button>
            <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transform transition-all active:scale-90 ${isActive ? 'bg-red-500 text-white rotate-90' : 'bg-emerald-500 text-white'}`}>
                {isActive ? <Pause size={35} fill="currentColor" /> : <Play size={35} fill="currentColor" className="ml-2"/>}
            </button>
            <button onClick={handleResetTurn} className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all mx-2" title="Reset Phase"><RotateCcw size={28} /></button>
            <button onClick={skipPhase} className="w-14 h-14 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all" title="Skip to next phase"><SkipForward size={28} /></button>
            <button onClick={goToNextStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Next Student/Round"><ChevronRight size={24} /></button>
        </div>
      </footer>
    </div>
  );
};

export default PowerUp3Game;