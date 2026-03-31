import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Play, Pause, RotateCcw, SkipForward, Home, Brain, Camera, Award, Users, ChevronLeft, ChevronRight
} from 'lucide-react';
import { io } from 'socket.io-client';

// Conexión al servidor de WebSockets en Render
const socket = io('https://concursoengllish.onrender.com');

// Vocabulario oficial
const WORDS_POOL = [
  "apple", "baby", "bird", "blue", "car", "cat", "dog", "doll", "sun", "nose", 
  "red", "onion", "fish", "horse", "monkey", "lion", "bike", "train", "plane", 
  "book", "pen", "pencil", "black", "two", "four", "five", "chair", "lemon", 
  "rabbit", "green"
];

const LittleStepsGame = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const participants = state?.participants || [];
  
  const settings = { 
    idTime: 3,          
    speedTime: 30,      
    memTime1: 4,        
    memTime2: 4, 
    memTime3: 4,
    memSpeakTime: 10,   
    boardsUpTime: 10    
  };

  const [currentChildIdx, setCurrentChildIdx] = useState(0);
  const [round, setRound] = useState(1); 
  const [phase, setPhase] = useState('READY'); 
  const [memLevel, setMemLevel] = useState(1); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [displayImages, setDisplayImages] = useState([]);
  const [imageIndex, setImageIndex] = useState(0); 
  const [usedImageIndices, setUsedImageIndices] = useState(new Set());

  const currentChild = participants[currentChildIdx];
  const intervalRef = useRef(null);
  
  const audioRefBoardsUp = useRef(new Audio('/audio/boards-up.mp3'));
  const audioRefTimeOut = useRef(new Audio('/sounds/time.mp3'));

  const getImages = (qty) => {
    const nums = new Set();
    const availableNums = [];
    
    for (let i = 1; i <= 30; i++) {
      if (!usedImageIndices.has(i)) availableNums.push(i);
    }

    if (availableNums.length < qty) {
      setUsedImageIndices(new Set()); 
      availableNums.length = 0; 
      for (let i = 1; i <= 30; i++) { availableNums.push(i); } 
    }

    while(nums.size < qty) {
      const randomIndex = Math.floor(Math.random() * availableNums.length);
      const chosenNum = availableNums.splice(randomIndex, 1)[0];
      nums.add(chosenNum);
    }
    
    const newUsedIndices = new Set(usedImageIndices);
    nums.forEach(num => newUsedIndices.add(num));
    setUsedImageIndices(newUsedIndices);

    return [...nums].map(n => `/img/little_steps_and_kid_box/${n}.jpg`);
  };

  // EMISIÓN DE LIMPIEZA
  useEffect(() => {
    return () => {
      socket.emit('clear_state');
    };
  }, []);

  // EMISIÓN DE ESTADO EN VIVO
  useEffect(() => {
    socket.emit('sync_state', {
      game: 'LITTLE_STEPS',
      round, phase, memLevel, timeLeft, displayImages, imageIndex,
      participantNumber: currentChild?.order_number,
      triggerAudio: phase === 'BOARDS_UP' && timeLeft === settings.boardsUpTime
    });
  }, [round, phase, memLevel, timeLeft, displayImages, imageIndex, currentChild]);

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

  // EVALUADOR FIN DE TIEMPO CON ALARMA AL FINAL (0s)
  useEffect(() => {
    if (isActive && timeLeft === 0) {
      setIsActive(false); 

      // Alarma suena justo cuando cambia la pantalla
      const shouldPlayAlarm = ['SPEED_CHALLENGE', 'MEMORY_SPEAK', 'PARENT_CHILD'].includes(phase);

      if (shouldPlayAlarm) {
        audioRefTimeOut.current.currentTime = 0;
        audioRefTimeOut.current.play().catch(e => console.log("Audio Error:", e));
      }

      handleAutoTransition(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, phase]);

  // EFECTOS POR SEGUNDO
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const isBoardWrite = ['PARENT_CHILD'].includes(phase); 

      // Mantenemos la cuenta regresiva normal (4, 3, 2, 1) para las fases de escritura en pizarra
      if (isBoardWrite && timeLeft <= 4) {
        audioRefTimeOut.current.currentTime = 0; 
        audioRefTimeOut.current.volume = 1.0;    
        audioRefTimeOut.current.play().catch(e => console.log("Audio Error:", e));
      }

      // Cambio de imagen en velocidad
      if (phase === 'SPEED_CHALLENGE' && timeLeft % 2 === 0) {
        setDisplayImages(getImages(1));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase, isActive]);

  const handleAutoTransition = () => {
    if (phase === 'PICTURE_ID') {
      if (imageIndex < 2) {
        setImageIndex(prev => prev + 1);
        setTimeLeft(settings.idTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_BEFORE_SPEED');
      }
    } 
    else if (phase === 'SPEED_CHALLENGE') {
      goToNextStudent();
    }
    else if (phase === 'MEMORY_SHOW') {
      setPhase('MEMORY_SPEAK');
      setTimeLeft(settings.memSpeakTime); 
      setIsActive(true);
    }
    else if (phase === 'MEMORY_SPEAK') {
      if (round === 2 && memLevel < 3) {
        setMemLevel(prev => prev + 1);
        setPhase('READY');
      } else {
        goToNextStudent();
      }
    }
    else if (phase === 'PARENT_CHILD') {
      if (imageIndex < 3) {
        setImageIndex(prev => prev + 1);
        setDisplayImages(getImages(4)); 
        setTimeLeft(15);
        setIsActive(true);
      } else {
        setPhase('BOARDS_UP');
        setTimeLeft(settings.boardsUpTime); 
        audioRefBoardsUp.current.play().catch(e => console.log("Audio failed:", e)); 
        setIsActive(true);
      }
    }
    else if (phase === 'BOARDS_UP') {
      setPhase('FINISHED');
    }
  };

  const startNextPhase = () => {
    if (phase === 'READY') {
      if (round === 1) startRound1();
      else if (round === 2) startRound2();
      else if (round === 3) startRound3();
    }
    else if (phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('SPEED_CHALLENGE');
      setDisplayImages(getImages(1));
      setTimeLeft(settings.speedTime);
      setIsActive(true);
    }
  };

  const handleSkipPhase = () => {
    setIsActive(false);
    
    if (phase === 'PICTURE_ID') {
      if (imageIndex < 2) {
        setImageIndex(prev => prev + 1);
        setTimeLeft(settings.idTime);
        setIsActive(true);
      } else {
        setPhase('PAUSE_BEFORE_SPEED');
        setImageIndex(0);
        setTimeLeft(0);
      }
    }
    else if (phase === 'PARENT_CHILD') {
      if (imageIndex < 3) {
        setImageIndex(prev => prev + 1);
        setTimeLeft(15);
        setIsActive(true);
      } else {
        setPhase('BOARDS_UP');
        setTimeLeft(settings.boardsUpTime);
        audioRefBoardsUp.current.play().catch(e => console.log("Audio play failed:", e));
        setIsActive(true);
      }
    }
    else {
      handleAutoTransition();
    }
  };

  const goToNextStudent = () => {
    setIsActive(false);
    setUsedImageIndices(new Set());

    if (currentChildIdx < participants.length - 1) {
      setCurrentChildIdx(prev => prev + 1);
      if (round === 2) setMemLevel(1); 
      setPhase('READY');
    } else {
      if (round === 1) {
        setRound(2);
        setCurrentChildIdx(0);
        setMemLevel(1);
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
      if (round === 2) setMemLevel(1);
    } else {
      if (round === 3) {
        setRound(2);
        setMemLevel(1); 
        setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
      } else if (round === 2) {
        setRound(1);
        setCurrentChildIdx(participants.length > 0 ? participants.length - 1 : 0);
      }
    }
  };

  const startRound1 = () => {
    setUsedImageIndices(new Set());
    setPhase('PICTURE_ID');
    setDisplayImages(getImages(3));
    setImageIndex(0);
    setTimeLeft(settings.idTime); 
    setIsActive(true);
  };

  const startRound2 = () => {
    setUsedImageIndices(new Set());
    setPhase('MEMORY_SHOW');
    const qty = memLevel === 1 ? 4 : memLevel === 2 ? 5 : 6;
    setDisplayImages(getImages(qty));
    setTimeLeft(memLevel === 1 ? settings.memTime1 : memLevel === 2 ? settings.memTime2 : settings.memTime3);
    setIsActive(true);
  };

  const startRound3 = () => {
    setUsedImageIndices(new Set());
    setPhase('PARENT_CHILD');
    setDisplayImages(getImages(4));
    setImageIndex(0);
    setTimeLeft(15); 
    setIsActive(true);
  };

  const handleResetTurn = () => {
    setIsActive(false);
    setTimeLeft(0);
    setImageIndex(0);
    
    if (phase === 'SPEED_CHALLENGE' || phase === 'PAUSE_BEFORE_SPEED') {
      setPhase('PAUSE_BEFORE_SPEED');
      setUsedImageIndices(new Set()); 
    } 
    else {
      setUsedImageIndices(new Set()); 
      setPhase('READY'); 
    }
  };

  const getRoundDescription = () => {
    if (round === 1) return "Vocabulary Recognition & Speed";
    if (round === 2) return "Visual Memory & Short-term Retention";
    if (round === 3) return "Teamwork & Fast Vocabulary Recall";
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
            Little Steps Contest
        </div>
      </header>

      <div className="w-full flex justify-between items-center py-5 px-12 bg-slate-50 border-b border-slate-100 shadow-sm">
        <div className="space-y-0.5">
            <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">
                {round === 3 ? "Group Activity" : `Student: ${currentChild?.name || "Participant"}`}
            </p>
            <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tighter">
                ROUND {round}: <span className="text-slate-500 font-medium">{phase.replace('_', ' ')}</span>
                {round === 1 && phase === 'PICTURE_ID' && <span className="text-sky-700 ml-2">Image {imageIndex + 1}/3</span>}
                {round === 2 && phase !== 'READY' && <span className="text-sky-700 ml-2">Level {memLevel}</span>}
                {round === 3 && phase === 'PARENT_CHILD' && <span className="text-sky-700 ml-2">Image {imageIndex + 1}/4</span>}
            </h2>
        </div>

        <div className={`flex items-center gap-4 px-6 py-2.5 rounded-2xl border transition-all ${timeLeft <= 3 && isActive && !phase.includes('PAUSE') && phase !== 'READY' ? 'bg-red-50 border-red-200 scale-105' : 'bg-white border-slate-200'}`}>
          <div className="text-right space-y-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-none">Time</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter italic">Remaining</p>
          </div>
          <span className={`text-4xl font-mono font-black tabular-nums ${timeLeft <= 3 && isActive && !phase.includes('PAUSE') && phase !== 'READY' ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      <main className="flex-1 w-full flex items-center justify-center p-4">
        <div className="w-[95vw] h-[70vh] bg-slate-900 rounded-[1.5rem] border-[14px] border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)]">
            {(phase === 'READY' || phase.startsWith('PAUSE')) && (
              <div className="text-center space-y-8 animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-sky-500/10 text-sky-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                  {round === 1 ? <Camera size={48} /> : round === 2 ? <Brain size={48} /> : <Users size={48} />}
                </div>
                
                <h2 className="text-5xl font-black text-white uppercase tracking-widest italic drop-shadow-lg">
                  {phase === 'READY' ? 'READY! BE FAST' : 'SYSTEM STANDBY'}
                </h2>
                
                {phase === 'READY' && (
                  <p className="text-sky-400 font-bold tracking-[0.2em] uppercase text-lg bg-sky-900/40 py-2 px-6 rounded-full border border-sky-500/30 inline-block">
                    {getRoundDescription()}
                  </p>
                )}
                {phase === 'PAUSE_BEFORE_SPEED' && (
                  <p className="text-sky-400 font-bold tracking-[0.2em] uppercase text-lg bg-sky-900/40 py-2 px-6 rounded-full border border-sky-500/30 inline-block">
                    Prepare for Speed Challenge
                  </p>
                )}
                <br/>
                <button 
                  onClick={startNextPhase}
                  className="mt-6 bg-sky-500 hover:bg-sky-400 px-16 py-6 rounded-2xl font-black text-white text-2xl shadow-[0_10px_0_0_#0284c7] active:shadow-none active:translate-y-[10px] transition-all"
                >
                  {phase === 'READY' ? `START ${round === 3 ? 'GROUP ACTIVITY' : 'TURN'}` : 'CONTINUE'}
                </button>
              </div>
            )}

            {(phase === 'PICTURE_ID' || phase === 'SPEED_CHALLENGE' || phase === 'PARENT_CHILD') && (
              <div className="w-full h-full flex items-center justify-center p-8">
                <img 
                  src={phase === 'PICTURE_ID' ? displayImages[imageIndex] : phase === 'PARENT_CHILD' ? displayImages[imageIndex] : displayImages[0]} 
                  className="max-w-full max-h-full bg-white p-4 rounded-[2rem] border-8 border-slate-700 shadow-2xl object-contain animate-in zoom-in duration-200" 
                  alt="Game Display"
                />
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
            <button onClick={handleSkipPhase} className="w-14 h-14 bg-sky-500/20 text-sky-500 rounded-full flex items-center justify-center border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all" title="Skip to next image/phase">
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

export default LittleStepsGame;