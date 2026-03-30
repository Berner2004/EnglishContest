import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Brain, Camera, Award, Users, Type, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { io } from 'socket.io-client';

// Conexión al servidor de WebSockets en Render
const socket = io('https://concursoengllish.onrender.com');

// Vocabulario oficial de Kid's Box 1 y Little Steps (en minúsculas)
const WORDS_POOL = [
  "apple", "baby", "bird", "blue", "car", "cat", "dog", "doll", "sun", "nose", 
  "red", "onion", "fish", "horse", "monkey", "lion", "bike", "train", "plane", 
  "book", "pen", "pencil", "black", "two", "four", "five", "chair", "lemon", 
  "rabbit", "green"
];

const KidsBoxGame = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    idTime: 3,        
    spellTime: 13,    
    speedImages: 10,  
    speedWords: 20,   
    memShow1: 4,      
    memSpeak1: 7,     
    memShow2: 4,      
    memSpeak2: 8,
    boardsUpTime: 10  
  };

  const [currentChildIdx, setCurrentChildIdx] = useState(0);
  const [round, setRound] = useState(1); 
  const [phase, setPhase] = useState('READY'); 
  const [memLevel, setMemLevel] = useState(1); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  
  const [displayImages, setDisplayImages] = useState([]);
  const [displayWords, setDisplayWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); 

  const [usedImageIndices, setUsedImageIndices] = useState(new Set());
  const [usedWords, setUsedWords] = useState(new Set());

  const currentChild = participants[currentChildIdx];
  const intervalRef = useRef(null);
  
  // Referencias de Audio
  const audioRefBoardsUp = useRef(new Audio('/audio/boards-up.mp3'));
  const audioRefTimeOut = useRef(new Audio('/sounds/time.mp3'));

  // EMISIÓN DE LIMPIEZA AL DESMONTAR EL COMPONENTE
  useEffect(() => {
    return () => {
      socket.emit('clear_state');
    };
  }, []);

  // EMISIÓN DE ESTADO EN VIVO POR WEBSOCKETS
  useEffect(() => {
    socket.emit('sync_state', {
      game: 'KIDS_BOX',
      round, phase, memLevel, timeLeft, 
      displayImages, displayWords, currentIndex,
      participantNumber: currentChild?.order_number,
      triggerAudio: phase === 'BOARDS_UP' && timeLeft === settings.boardsUpTime
    });
  }, [round, phase, memLevel, timeLeft, displayImages, displayWords, currentIndex, currentChild]);

  const getImages = (qty) => {
    const nums = new Set();
    const availableNums = [];
    for (let i = 1; i <= 30; i++) if (!usedImageIndices.has(i)) availableNums.push(i);
    
    if (availableNums.length < qty) {
      setUsedImageIndices(new Set()); 
      availableNums.length = 0; 
      for (let i = 1; i <= 30; i++) availableNums.push(i); 
    }

    while(nums.size < qty) {
      const randomIndex = Math.floor(Math.random() * availableNums.length);
      nums.add(availableNums.splice(randomIndex, 1)[0]);
    }
    
    const newUsedIndices = new Set(usedImageIndices);
    nums.forEach(n => newUsedIndices.add(n));
    setUsedImageIndices(newUsedIndices);

    return [...nums].map(n => `/img/little_steps_and_kid_box/${n}.jpg`);
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

  // MOTOR DEL RELOJ
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

  // Evaluador de Tiempo Terminado
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setIsActive(false);
      handleAutoTransition();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft]);

  // Efectos Visuales y Sonoros por Segundo (Alarmas y Speed Changes)
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const isBoardWrite = ['PARENT_CHILD'].includes(phase);
      const isSingleBeep = ['READ_SPELL', 'SPEED_IMAGES', 'SPEED_WORDS', 'MEMORY_SPEAK'].includes(phase);

      if ((isBoardWrite && timeLeft <= 4) || (isSingleBeep && timeLeft === 1)) {
        audioRefTimeOut.current.currentTime = 0; 
        audioRefTimeOut.current.volume = 1.0;    
        audioRefTimeOut.current.play().catch(e => console.log("Audio Error:", e));
      }

      if (timeLeft % 2 === 0) {
        if (phase === 'SPEED_IMAGES') setDisplayImages(getImages(1));
        if (phase === 'SPEED_WORDS') setDisplayWords(getWords(1));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  // LA FUNCIÓN QUE CAMBIA DE IMAGEN O SUB-FASE AL ACABAR EL TIEMPO
  const handleAutoTransition = () => {
    if (phase === 'PICTURE_ID') {
      if (currentIndex < 3) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.idTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_BEFORE_WORDS');
      }
    } 
    else if (phase === 'READ_SPELL') {
      if (currentIndex < 1) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.spellTime);
        setIsActive(true);
      } else {
        goToNextStudent();
      }
    }
    else if (phase === 'SPEED_IMAGES') {
      setPhase('PAUSE_BEFORE_SPEED_WORDS');
    }
    else if (phase === 'SPEED_WORDS') {
      setPhase('PAUSE_BEFORE_MEMORY');
    }
    else if (phase === 'MEMORY_SHOW') {
      setPhase('MEMORY_SPEAK');
      setTimeLeft(memLevel === 1 ? settings.memSpeak1 : settings.memSpeak2);
      setIsActive(true);
    }
    else if (phase === 'MEMORY_SPEAK') {
      if (memLevel === 1) {
        setPhase('PAUSE_BEFORE_MEMORY_2');
      } else {
        goToNextStudent();
      }
    }
    else if (phase === 'PARENT_CHILD') {
      if (currentIndex < 3) {
        setCurrentIndex(prev => prev + 1);
        setDisplayImages(getImages(4)); 
        setTimeLeft(15);
        setIsActive(true);
      } else {
        setPhase('BOARDS_UP');
        setTimeLeft(settings.boardsUpTime);
        audioRefBoardsUp.current.play().catch(e => console.log("Audio play failed:", e));
        setIsActive(true);
      }
    }
    else if (phase === 'BOARDS_UP') {
      setPhase('FINISHED');
    }
  };

  // CONTROLADOR CENTRAL PARA SALIR DE LAS PAUSAS
  const startNextPhase = () => {
    if (phase === 'READY') {
      if (round === 1) startRound1();
      else if (round === 2) startRound2();
      else if (round === 3) startRound3();
    } 
    else if (phase === 'PAUSE_BEFORE_WORDS') {
      setPhase('READ_SPELL');
      setDisplayWords(getWords(2));
      setCurrentIndex(0);
      setTimeLeft(settings.spellTime);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_SPEED_WORDS') {
      setPhase('SPEED_WORDS');
      setDisplayWords(getWords(1));
      setTimeLeft(settings.speedWords);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_MEMORY') {
      setPhase('MEMORY_SHOW');
      setMemLevel(1);
      setDisplayImages(getImages(5)); 
      setTimeLeft(settings.memShow1);
      setIsActive(true);
    }
    else if (phase === 'PAUSE_BEFORE_MEMORY_2') {
      setPhase('MEMORY_SHOW');
      setMemLevel(2);
      setDisplayImages(getImages(6)); 
      setTimeLeft(settings.memShow2);
      setIsActive(true);
    }
  };

  // BOTÓN CELESTE (SkipForward)
  const skipPhase = () => {
    setIsActive(false);
    
    if (phase === 'READY') startNextPhase();
    else if (phase === 'PICTURE_ID') {
      if (currentIndex < 3) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(settings.idTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_BEFORE_WORDS');
        setCurrentIndex(0);
        setTimeLeft(0);
      }
    }
    else if (phase === 'PAUSE_BEFORE_WORDS') startNextPhase();
    else if (phase === 'READ_SPELL') {
      if (currentIndex < 1) {
          setCurrentIndex(1);
          setTimeLeft(settings.spellTime);
          setIsActive(true);
      } else {
          goToNextStudent();
      }
    }
    else if (phase === 'SPEED_IMAGES') setPhase('PAUSE_BEFORE_SPEED_WORDS');
    else if (phase === 'PAUSE_BEFORE_SPEED_WORDS') startNextPhase();
    else if (phase === 'SPEED_WORDS') setPhase('PAUSE_BEFORE_MEMORY');
    else if (phase === 'PAUSE_BEFORE_MEMORY') startNextPhase();
    else if (phase === 'MEMORY_SHOW') {
      setPhase('MEMORY_SPEAK');
      setTimeLeft(memLevel === 1 ? settings.memSpeak1 : settings.memSpeak2);
      setIsActive(true);
    }
    else if (phase === 'MEMORY_SPEAK') {
      if (memLevel === 1) setPhase('PAUSE_BEFORE_MEMORY_2');
      else goToNextStudent();
    }
    else if (phase === 'PAUSE_BEFORE_MEMORY_2') startNextPhase();
    else if (phase === 'PARENT_CHILD') {
      if (currentIndex < 3) {
        setCurrentIndex(prev => prev + 1);
        setTimeLeft(15);
        setIsActive(true);
      } else {
        setPhase('BOARDS_UP');
        setTimeLeft(settings.boardsUpTime);
        audioRefBoardsUp.current.play().catch(e => console.log("Audio play failed:", e));
        setIsActive(true);
      }
    }
    else goToNextStudent();
  };

  const goToNextStudent = () => {
    setIsActive(false);
    setUsedImageIndices(new Set());
    setUsedWords(new Set());

    if (currentChildIdx < participants.length - 1) {
      setCurrentChildIdx(prev => prev + 1);
      setPhase('READY');
    } else {
      if (round === 1) {
        setRound(2);
        setCurrentChildIdx(0);
        setPhase('READY');
      } else if (round === 2) {
        setRound(3);
        setCurrentChildIdx(0);
        setPhase('READY');
      } else if (round === 3) {
        setPhase('FINISHED');
      }
    }
  };

  const goToPrevStudent = () => {
    setIsActive(false);
    setPhase('READY');
    
    if (currentChildIdx > 0) {
      setCurrentChildIdx(prev => prev - 1);
    } else {
      if (round === 3) {
        setRound(2);
        setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
      } else if (round === 2) {
        setRound(1);
        setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
      }
    }
  };

  const startRound1 = () => {
    setUsedImageIndices(new Set());
    setUsedWords(new Set());
    setPhase('PICTURE_ID');
    setDisplayImages(getImages(4));
    setCurrentIndex(0);
    setTimeLeft(settings.idTime); 
    setIsActive(true);
  };

  const startRound2 = () => {
    setUsedImageIndices(new Set());
    setUsedWords(new Set());
    setPhase('SPEED_IMAGES');
    setDisplayImages(getImages(1));
    setTimeLeft(settings.speedImages); 
    setIsActive(true);
  };

  const startRound3 = () => {
    setUsedImageIndices(new Set());
    setPhase('PARENT_CHILD');
    setDisplayImages(getImages(4));
    setCurrentIndex(0);
    setTimeLeft(15); 
    setIsActive(true);
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    
    if (phase === 'READ_SPELL' || phase === 'PAUSE_BEFORE_WORDS') {
      setPhase('PAUSE_BEFORE_WORDS');
      setCurrentIndex(0);
    } 
    else if (phase === 'SPEED_WORDS' || phase === 'PAUSE_BEFORE_SPEED_WORDS') {
      setPhase('PAUSE_BEFORE_SPEED_WORDS');
    }
    else if (phase === 'MEMORY_SHOW' || phase === 'MEMORY_SPEAK' || phase === 'PAUSE_BEFORE_MEMORY' || phase === 'PAUSE_BEFORE_MEMORY_2') {
      if (memLevel === 1) {
        setPhase('PAUSE_BEFORE_MEMORY');
      } else {
        setPhase('PAUSE_BEFORE_MEMORY_2');
      }
    }
    else {
      setUsedImageIndices(new Set()); 
      setUsedWords(new Set());
      setCurrentIndex(0);
      setPhase('READY'); 
    }
  };

  const getRoundDescription = () => {
    if (round === 1) return "Image Recognition & Spelling";
    if (round === 2) return "Speed & Memory Challenge";
    if (round === 3) return "Parent & Child Speed Challenge";
    return "";
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans overflow-hidden">
      <header className="bg-sky-500 text-white py-2 px-8 shadow-md border-b border-sky-600 flex justify-between items-center w-full sticky top-0 z-50">
        <div className="flex items-center gap-2">
            <Award size={20} className="text-sky-100" />
            <h1 className="text-lg font-black uppercase tracking-tight italic">Amazon English Academy</h1>
        </div>
        <div className="bg-sky-400/30 px-3 py-1 rounded-full border border-sky-300/30 text-[9px] font-black uppercase tracking-[0.2em]">
            Kid's Box Contest
        </div>
      </header>

      <div className="w-full flex justify-between items-center py-5 px-12 bg-slate-50 border-b border-slate-100">
        <div className="space-y-0.5">
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">
                {round === 3 ? "Group Activity" : `Student: ${currentChild?.name || "Participant"}`}
            </p>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">
                ROUND {round}: <span className="text-slate-500 font-medium">{phase.replace('_', ' ')}</span>
                {round === 1 && phase === 'PICTURE_ID' && <span className="text-sky-700 ml-2">Image {currentIndex + 1}/4</span>}
                {round === 2 && phase.includes('MEMORY') && <span className="text-sky-700 ml-2">Level {memLevel}</span>}
                {round === 3 && phase === 'PARENT_CHILD' && <span className="text-sky-700 ml-2">Image {currentIndex + 1}/4</span>}
            </h2>
        </div>

        <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border transition-all ${timeLeft <= 4 && isActive && !phase.includes('PAUSE') && phase !== 'READY' ? 'bg-red-50 border-red-200 scale-105' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="text-right space-y-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Time</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Remaining</p>
          </div>
          <span className={`text-4xl font-mono font-black tabular-nums ${timeLeft <= 4 && isActive && !phase.includes('PAUSE') && phase !== 'READY' ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <main className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-[95vw] h-[70vh] bg-slate-900 rounded-[1.5rem] border-[14px] border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
            {(phase === 'READY' || phase.startsWith('PAUSE')) && (
              <div className="text-center space-y-8 animate-in fade-in duration-500">
                <div className="w-24 h-24 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto">
                  {round === 1 ? <Type size={48} /> : round === 2 ? <Brain size={48} /> : <Users size={48} />}
                </div>
                
                <h2 className="text-5xl font-black text-white uppercase tracking-widest italic drop-shadow-lg">
                  {phase === 'READY' ? 'READY! BE FAST' : 'SYSTEM STANDBY'}
                </h2>

                <p className="text-sky-400 font-bold tracking-[0.2em] uppercase text-lg bg-sky-900/40 py-2 px-6 rounded-full border border-sky-500/30 inline-block">
                  {phase === 'READY' && getRoundDescription()}
                  {phase === 'PAUSE_BEFORE_WORDS' && "Prepare for Reading & Spelling"}
                  {phase === 'PAUSE_BEFORE_SPEED_WORDS' && "Prepare for Speed Words"}
                  {phase === 'PAUSE_BEFORE_MEMORY' && "Prepare for Memory Level 1"}
                  {phase === 'PAUSE_BEFORE_MEMORY_2' && "Prepare for Memory Level 2"}
                </p>
                <br/>
                <button 
                  onClick={startNextPhase}
                  className="mt-6 bg-sky-500 hover:bg-sky-600 px-16 py-6 rounded-2xl font-black text-white text-2xl shadow-xl transition-all active:scale-95 transform hover:-translate-y-1"
                >
                  {phase === 'READY' ? `START ${round === 3 ? 'GROUP ACTIVITY' : 'TURN'}` : 'CONTINUE'}
                </button>
              </div>
            )}

            {(phase === 'PICTURE_ID' || phase === 'SPEED_IMAGES' || phase === 'PARENT_CHILD') && (
              <div className="w-full h-full flex items-center justify-center p-8">
                <img 
                  src={phase === 'PICTURE_ID' ? displayImages[currentIndex] : phase === 'PARENT_CHILD' ? displayImages[currentIndex] : displayImages[0]} 
                  className="max-w-full max-h-full bg-white p-4 rounded-[2rem] border-8 border-slate-700 shadow-xl object-contain animate-in zoom-in duration-200" 
                  alt="Game Display"
                />
              </div>
            )}

            {(phase === 'READ_SPELL' || phase === 'SPEED_WORDS') && (
               <div className="w-full h-full flex flex-col items-center justify-center py-16 px-10">
                 <div className="flex-1 flex items-center justify-center">
                    <h1 className="text-[12vw] font-black text-white tracking-[0.1em] drop-shadow-2xl text-center leading-none lowercase">
                      {phase === 'READ_SPELL' ? displayWords[currentIndex] : displayWords[0]}
                    </h1>
                 </div>
               </div>
            )}

            {phase === 'MEMORY_SHOW' && (
              <div className="w-full h-full flex flex-wrap items-center justify-center gap-6 p-8 content-center">
                {displayImages.map((src, i) => {
                  const maxW = displayImages.length <= 4 ? 'max-w-[45%]' : 'max-w-[30%]';
                  return (
                    <img key={i} src={src} className={`${maxW} max-h-[45%] bg-white p-3 rounded-[1.5rem] border-4 border-slate-700 shadow-xl object-contain animate-in fade-in duration-300`} alt="Memory Card" />
                  );
                })}
              </div>
            )}

            {phase === 'MEMORY_SPEAK' && (
              <div className="text-center animate-pulse p-10">
                <h3 className="text-7xl font-black text-amber-400 uppercase tracking-tight italic drop-shadow-2xl">SPEAK NOW!</h3>
                <p className="text-slate-300 mt-6 font-bold tracking-widest uppercase text-2xl">What do you remember?</p>
              </div>
            )}

            {phase === 'BOARDS_UP' && (
              <div className="text-center animate-in zoom-in duration-300 p-10 space-y-6">
                <h3 className="text-7xl md:text-8xl font-black text-sky-400 uppercase tracking-tight italic drop-shadow-2xl animate-bounce">
                  BOARDS UP!
                </h3>
                <p className="text-white font-black tracking-[0.2em] uppercase text-4xl">TURN AROUND!</p>
              </div>
            )}

            {phase === 'FINISHED' && (
              <div className="text-center animate-in fade-in duration-500 p-10">
                <Award size={100} className="text-amber-400 mx-auto mb-6 drop-shadow-lg" />
                <h3 className="text-6xl font-black text-white uppercase tracking-tight">CONTEST COMPLETED!</h3>
              </div>
            )}
        </div>
      </main>

      <footer className="w-full p-4 flex justify-center sticky bottom-0 z-50">
        <div className="w-full max-w-3xl bg-slate-950 p-4 rounded-[2.5rem] flex justify-center gap-4 items-center border border-slate-800 shadow-2xl">
            <button onClick={goToPrevStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Previous Student/Round">
              <ChevronLeft size={24} />
            </button>

            <button onClick={() => navigate('/admin')} className="p-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors mx-2">
              <Home size={28} />
            </button>

            <button onClick={() => setIsActive(!isActive)} className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transform transition-all active:scale-90 ${isActive ? 'bg-red-500 text-white rotate-90' : 'bg-emerald-500 text-white'}`}>
                {isActive ? <Pause size={35} fill="currentColor" /> : <Play size={35} fill="currentColor" className="ml-2"/>}
            </button>

            <button onClick={handleResetTurn} className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center border border-amber-500/30 hover:bg-amber-500 hover:text-white transition-all mx-2" title="Reset Phase">
                <RotateCcw size={28} />
            </button>

            <button onClick={skipPhase} className="w-14 h-14 bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all" title="Skip Phase">
                <SkipForward size={28} />
            </button>

            <button onClick={goToNextStudent} className="w-12 h-12 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-full flex items-center justify-center transition-all border border-slate-700" title="Next Student/Round">
              <ChevronRight size={24} />
            </button>
        </div>
      </footer>
    </div>
  );
};

export default KidsBoxGame;