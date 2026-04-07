import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, ChevronRight, CheckCircle2, Save, BookOpen, Brain, Zap, Trophy, Type, Info, BarChart3, Camera, Globe, Search, Mic, BellRing, PlayCircle, X, AlertTriangle, Award, LogIn } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

const ROUND_INFO = {
  "LITTLE STEPS": {
    "1": { title: "Round 1: Picture Identification & Speed Images", objective: "Evaluates vocabulary recognition and speed response." },
    "2": { title: "Round 2: Memory Challenge", objective: "Evaluates visual memory and short-term retention (4, 5 & 6 images)." },
    "3": { title: "Round 3: Parent & Child Challenge", objective: "Evaluates teamwork, clear speaking by child, and accurate writing by parent." }
  },
  "KIDS BOX": {
    "1": { title: "Round 1: Image Recognition + Reading & Spelling", objective: "Evaluates image recognition, reading, spelling, and pronunciation." },
    "2": { title: "Round 2: Speed + Memory Challenge", objective: "Evaluates speed in naming images, reading words, and memory recall." },
    "3": { title: "Round 3: Parent & Child Challenge", objective: "Evaluates teamwork, listening, and accurate communication." }
  },
  "POWER UP 1": {
    "1": { title: "Round 1: Recognition & Sentence", objective: "Evaluates image recognition, spelling of 2 words, and sentence structuring (min. 5 words)." },
    "2": { title: "Round 2: Board Challenge", objective: "Evaluates scrambled words and dictation accuracy (capitalization, spacing, punctuation)." },
    "3": { title: "Round 3: Speed Reading", objective: "Evaluates speed reading fluency, rhythm, and pronunciation." }
  },
  "POWER UP 3": {
    "1": { title: "Round 1: Reading & Auditory", objective: "Evaluates visual recognition, accurate pronunciation, spelling, and sentence structuring (min. 6 words)." },
    "2": { title: "Round 2: Board Challenge", objective: "Evaluates team spelling accuracy, strict use of capitalization, spacing, and punctuation in dictation." },
    "3": { title: "Round 3: Speed & Recall", objective: "Evaluates speed reading fluency and the ability to recall and spell the last word to form a valid sentence." }
  },
  "AMERICAN THINK STARTER": {
    "1": { title: "Round 1: Listening, Spelling & Sentence", objective: "Evaluates ability to listen, spell correctly, and create a clear sentence (min. 6 words)." },
    "2": { title: "Round 2: Board Challenge (GROUP ACTIVITY)", objective: "Evaluates scrambled words resolution and accuracy in sentence and letter-by-letter dictation." },
    "3": { title: "Round 3: Speed Reading & Recall", objective: "Evaluates reading speed, accuracy, and the ability to recall the last word to create a valid sentence." }
  },
  "GRAND FINAL": {
    "4": { title: "Round 4: Grand Final (Top 5)", objective: "Elite Skills: Rapid Continuous Spell & Blind Memory Recall." }
  }
};

const RUBRICS = {
  "LITTLE STEPS": {
    "1": [
      { key: "pic", title: "Part 1 - Picture Identification", max: 3, pointsDesc: { 0: "Cannot identify or no response.", 1: "Only 1 image or hesitation/errors.", 2: "Most images, 1 minor mistake.", 3: "All 3 images clearly and quickly." } },
      { key: "speed", title: "Part 2 - Speed Images", max: 3, pointsDesc: { 0: "Cannot respond under pressure.", 1: "Few correct, slow or several errors.", 2: "Good number, minor hesitation.", 3: "Names many quickly and fluently." } }
    ],
    "2": [
      { key: "memory", title: "Memory Performance", max: 5, pointsDesc: { 0: "Cannot recall images.", 1: "Very limited recall.", 2: "Recalls few with difficulty.", 3: "Some images with omissions.", 4: "Good number, 1-2 minor mistakes.", 5: "Recalls most/all with confidence." } }
    ],
    "3": [
      { key: "team", title: "Team Performance (Child+Parent)", max: 5, pointsDesc: { 0: "No communication/incorrect.", 1: "Limited teamwork, many mistakes.", 2: "Several errors, difficulty.", 3: "Some issues, 2-3 errors.", 4: "Good teamwork, 1 minor mistake.", 5: "Excellent teamwork, fast/accurate." } }
    ]
  },
  "KIDS BOX": {
    "1": [
      { key: "img", title: "Part A - Image Recognition", max: 3, pointsDesc: { 0: "Unable to recognize or name.", 1: "Few images, errors/hesitation.", 2: "Most images, 1 minor mistake.", 3: "All images with clear pronunciation." } },
      { key: "read", title: "Part B - Reading & Spelling", max: 3, pointsDesc: { 0: "Unable to read, spell, or complete.", 1: "Several errors or difficulty.", 2: "1-2 minor errors.", 3: "Reads, spells, rereads correctly." } }
    ],
    "2": [
      { key: "speedImg", title: "Part A - Speed Images", max: 3, pointsDesc: { 0: "Cannot identify under pressure.", 1: "Few correct, slow or errors.", 2: "Good number, minor hesitation.", 3: "Names many quickly and accurately." } },
      { key: "speedWord", title: "Part B - Speed Words", max: 3, pointsDesc: { 0: "Unable to read correctly.", 1: "Reads few, slow pace or errors.", 2: "Good number with minor errors.", 3: "Reads many fluently and accurately." } },
      { key: "memory", title: "Part C - Memory Challenge", max: 4, pointsDesc: { 0: "Cannot recall images.", 1: "Very limited recall.", 2: "Recalls few with difficulty.", 3: "Good number, minor omissions.", 4: "Recalls most or all correctly." } }
    ],
    "3": [
      { key: "team", title: "Team Performance (Student+Parent)", max: 5, pointsDesc: { 0: "No communication/incorrect.", 1: "Limited coordination, many mistakes.", 2: "Several errors, difficulty.", 3: "Some issues, 2-3 errors.", 4: "Good teamwork, 1 minor mistake.", 5: "Excellent teamwork, fast/accurate." } }
    ]
  },
  "POWER UP 1": {
    "1": [
      { key: "act1", title: "Activity 1 (Image Recognition)", max: 3, pointsDesc: { 0: "No responde.", 1: "2 errores o duda constante.", 2: "1 error leve/poco clara.", 3: "Dice las 3 palabras perfecto." } },
      { key: "act2", title: "Activity 2 (Spelling 2 words)", max: 3, pointsDesc: { 0: "No completa.", 1: "Varios errores.", 2: "1 error leve.", 3: "Lee, deletrea y repite correct." } },
      { key: "act3", title: "Activity 3 (Sentence)", max: 3, pointsDesc: { 0: "No responde.", 1: "Incompleta.", 2: "1-2 errores leves.", 3: "Oración clara (mín. 5 palabras)." } }
    ],
    "2": [
      { key: "actA1", title: "Activity A (Scramble 1)", max: 3, pointsDesc: { 0: "Incorrecta.", 1: "Varios errores.", 2: "1 error leve.", 3: "Palabra completamente correcta." } },
      { key: "actA2", title: "Activity A (Scramble 2)", max: 3, pointsDesc: { 0: "Incorrecta.", 1: "Varios errores.", 2: "1 error leve.", 3: "Palabra completamente correcta." } },
      { key: "actB", title: "Activity B (Sentence Dictation)", max: 5, pointsDesc: { 0: "Incorrecta.", 1: "Incompleta.", 2: "Varios errores.", 3: "2-3 errores.", 4: "1 error leve.", 5: "Todo correcto (letras, caps, punto)." } },
      { key: "actC", title: "Activity C (Dictation)", max: 5, pointsDesc: { 0: "Incorrecta.", 1: "Incompleta.", 2: "Varios errores.", 3: "2-3 errores.", 4: "1 error leve.", 5: "Letra a letra completamente correcta." } }
    ],
    "3": [
      { key: "speed", title: "Activity - Speed Reading", max: 3, pointsDesc: { 0: "Bajo: Muy pocas o se detiene.", 1: "Básico: Pocas, pausas, errores.", 2: "Bueno: Cantidad media, pequeños errores.", 3: "Excelente: Lee muchas, ritmo continuo." } }
    ]
  },
  "POWER UP 3": {
    "1": [
      { key: "fase1", title: "Fase 1 (Reading)", max: 3, pointsDesc: { 0: "No responde.", 1: "2 errores o duda.", 2: "1 error leve o poco clara.", 3: "Lee correctamente las 3 palabras." } },
      { key: "fase2", title: "Fase 2 (Cycle 1)", max: 3, pointsDesc: { 0: "No completa.", 1: "Varios errores o oración débil.", 2: "1 error leve en spelling/oración.", 3: "Repite, deletrea y oración (mín. 6)." } },
      { key: "fase3", title: "Fase 3 (Cycle 2)", max: 3, pointsDesc: { 0: "No completa.", 1: "Varios errores.", 2: "1 error leve.", 3: "Repite, deletrea y oración (mín. 6)." } }
    ],
    "2": [
      { key: "parteA", title: "Parte A (Scramble)", max: 3, pointsDesc: { 0: "Incorrecto / en blanco.", 1: "Varios errores.", 2: "1 error leve.", 3: "Todas las palabras correctas." } },
      { key: "parteB", title: "Parte B (Sentence)", max: 5, pointsDesc: { 0: "Incorrecta.", 1: "Incompleta.", 2: "Varios errores.", 3: "2-3 errores.", 4: "1 error leve.", 5: "Perfecto (caps, espacios, puntuación)." } },
      { key: "parteC", title: "Parte C (Letter-by-Letter)", max: 5, pointsDesc: { 0: "Incorrecta.", 1: "Incompleta.", 2: "Varios errores.", 3: "2-3 errores.", 4: "1 error leve.", 5: "Todo correcto (ortografía y orden)." } }
    ],
    "3": [
      { key: "fase1", title: "Fase 1 (Speed Reading 10s)", max: 3, pointsDesc: { 0: "No completa / Incorrecto.", 1: "Pocas palabras.", 2: "Ritmo medio.", 3: "Lee varias palabras, buen ritmo." } },
      { key: "fase2", title: "Fase 2 (Read + Spell + Sentence 18s)", max: 3, pointsDesc: { 0: "No completa.", 1: "Varios errores.", 2: "2 errores leves en deletreo/oración.", 3: "Deletrea y oración correctas." } }
    ]
  },
  "AMERICAN THINK STARTER": {
    "1": [
      { key: "word1", title: "Activity 1: Word 1 (Listen & Spell)", max: 2, pointsDesc: { 0: "Several errors or does not complete.", 1: "One minor error in pronunc./spelling.", 2: "Says, spells, repeats correctly." } },
      { key: "word2", title: "Activity 2: Word 2 (Spell & Sentence)", max: 4, pointsDesc: { 0: "Does not complete the task.", 1: "Limited attempt.", 2: "Several errors or weak sentence.", 3: "One minor error.", 4: "Spells correctly, clear sentence (min. 6)." } }
    ],
    "2": [
      { key: "scramble", title: "Activity A (Scrambled Words)", max: 3, pointsDesc: { 0: "Incorrect or blank.", 1: "Several errors.", 2: "1 minor error in one word.", 3: "Both words correct." } },
      { key: "dictation", title: "Activity B (Sentence Dictation)", max: 5, pointsDesc: { 0: "Incorrect.", 1: "Incomplete.", 2: "Several errors.", 3: "2-3 errors.", 4: "1 minor error.", 5: "Completely correct (spelling/order)." } },
      { key: "letter", title: "Activity C (Letter-by-Letter)", max: 5, pointsDesc: { 0: "Incorrect.", 1: "Incomplete.", 2: "Several errors.", 3: "2-3 errors.", 4: "1 minor error.", 5: "Completely correct (caps, spaces, punct)." } }
    ],
    "3": [
      { key: "speed", title: "Speed Reading + Recall + Sentence", max: 3, pointsDesc: { 0: "Cannot recall, spell, or produce.", 1: "Slow reading, several errors.", 2: "Good speed, 1-2 minor errors.", 3: "Reads quickly, perfect recall/sentence." } }
    ]
  },
  "GRAND FINAL": {
    "4": [
      { key: "act1", title: "Activity 1 (Rapid Continuous Spell)", max: 3, pointsDesc: { 0: "Does not complete.", 1: "Several errors/unclear pronunciation.", 2: "1-2 minor errors or slight hesitation.", 3: "Reads, spells, and repeats clearly." } },
      { key: "act2", title: "Activity 2 (Memory Sentence Spell)", max: 3, pointsDesc: { 0: "Does not complete.", 1: "Several errors or missing parts.", 2: "1-2 minor errors.", 3: "Correctly spells full sentence (caps, spaces)." } }
    ]
  }
};

const CATEGORIES = [
  { id: "ALL", name: "Global Ranking", icon: <Globe size={16} />, color: "bg-indigo-600", text: "text-indigo-600", hover: "hover:bg-indigo-50" },
  { id: "LITTLE STEPS", name: "Little Steps", icon: <Camera size={16} />, color: "bg-sky-500", text: "text-sky-500", hover: "hover:bg-sky-50" },
  { id: "KIDS BOX", name: "Kid's Box", icon: <Brain size={16} />, color: "bg-emerald-500", text: "text-emerald-500", hover: "hover:bg-emerald-50" },
  { id: "POWER UP 1", name: "Power Up 1", icon: <Type size={16} />, color: "bg-violet-500", text: "text-violet-500", hover: "hover:bg-violet-50" },
  { id: "POWER UP 3", name: "Power Up 3", icon: <Zap size={16} />, color: "bg-rose-500", text: "text-rose-500", hover: "hover:bg-rose-50" },
  { id: "AMERICAN THINK STARTER", name: "American Think", icon: <Trophy size={16} />, color: "bg-orange-500", text: "text-orange-500", hover: "hover:bg-orange-50" },
  { id: "GRAND FINAL", name: "Grand Final (Top 5)", icon: <Award size={16} />, color: "bg-amber-500", text: "text-amber-500", hover: "hover:bg-amber-50" }
];

const calculateCategoryTotal = (scoresObj, categoryStr) => {
    if (!scoresObj) return 0;
    let total = 0;
    Object.values(scoresObj).forEach(judgeData => {
        // La Grand Final se calcula sumando ÚNICAMENTE la Ronda 4. El resto suman R1, R2 y R3.
        const roundsToSum = categoryStr === 'GRAND FINAL' ? [4] : [1, 2, 3];
        roundsToSum.forEach(roundNum => {
            const roundScores = judgeData[`round_${roundNum}`] || {};
            total += Object.values(roundScores).reduce((a, b) => a + b, 0);
        });
    });
    return total;
};

const JudgesView = () => {
  const [judgeUsername, setJudgeUsername] = useState(sessionStorage.getItem('username') || '');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(!judgeUsername || judgeUsername === 'unknown_judge');
  const [tempName, setTempName] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("POWER UP 3");
  const [selectedRound, setSelectedRound] = useState("1");
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  
  // Memoria local de los botones clickeados, aislada de la DB
  const [localScores, setLocalScores] = useState({});
  const localScoresContext = useRef(""); 

  const [saveStatus, setSaveStatus] = useState("idle");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [liveGameState, setLiveGameState] = useState(null);
  const [gameAlert, setGameAlert] = useState(null);
  const [pendingSelection, setPendingSelection] = useState(null); 
  const lastAlertedContext = useRef("");

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  const fetchLiveScores = useCallback(async (category) => {
    try {
      let apiCategory = category === "GRAND FINAL" ? "AMERICAN THINK STARTER" : category;
      
      const [partsRes, scoresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/participants/${apiCategory}`),
        fetch(`${API_BASE_URL}/api/scores/${apiCategory}`)
      ]);
      const partsData = await partsRes.json();
      const scoresData = await scoresRes.json();

      let merged = partsData.map(p => {
        const pScore = scoresData.find(s => s.participant_id === p._id);
        return { ...p, scoresObj: pScore?.scores || {} };
      });
      
      if (category === "GRAND FINAL") {
          const calcBaseScore = (scoresObj) => {
              if (!scoresObj) return 0;
              let total = 0;
              Object.values(scoresObj).forEach(judgeData => {
                  [1, 2, 3].forEach(roundNum => {
                      const rScores = judgeData[`round_${roundNum}`] || {};
                      total += Object.values(rScores).reduce((a, b) => a + b, 0);
                  });
              });
              return total;
          };

          // Extrae el Top 5 basado en sus rondas 1,2,3
          merged = merged
            .filter(p => calcBaseScore(p.scoresObj) > 0)
            .sort((a, b) => calcBaseScore(b.scoresObj) - calcBaseScore(a.scoresObj))
            .slice(0, 5);
      } else if (category === "ALL") {
          const allPartsRes = await fetch(`${API_BASE_URL}/participants/ALL`);
          const allScoresRes = await fetch(`${API_BASE_URL}/api/scores/ALL`);
          const allP = await allPartsRes.json();
          const allS = await allScoresRes.json();
          merged = allP.map(p => {
              const s = allS.find(x => x.participant_id === p._id);
              return { ...p, scoresObj: s?.scores || {} };
          });
      }

      setParticipants(merged);

      setSelectedParticipant(prev => {
        if (!prev) return null;
        const updatedPrev = merged.find(m => m._id === prev._id);
        return updatedPrev || prev;
      });

    } catch (error) {
      console.error("Live DB Error:", error);
    }
  }, []);

  useEffect(() => {
    if (!isLoginModalOpen) {
      fetchLiveScores(selectedCategory);
    }

    const handleRemoteUpdate = (payload) => {
      if (payload?.action === 'score_updated') {
        fetchLiveScores(selectedCategory);
      } else if (payload && payload.game) {
        const normalizedCategory = payload.game.replace(/_/g, ' ');
        const contextKey = `${normalizedCategory}-${payload.round}-${payload.participantNumber || 'GROUP'}-${payload.currentGroupIdx || 0}`;
        setLiveGameState({ ...payload, normalizedCategory, contextKey });
      }
    };

    socket.on('sync_state', handleRemoteUpdate);
    socket.on('score_updated', () => fetchLiveScores(selectedCategory));
    socket.on('clear_state', () => setLiveGameState(null));

    return () => {
      socket.off('sync_state', handleRemoteUpdate);
      socket.off('score_updated');
      socket.off('clear_state');
    };
  }, [selectedCategory, fetchLiveScores, isLoginModalOpen]);

  useEffect(() => {
    if (liveGameState && liveGameState.contextKey !== lastAlertedContext.current && liveGameState.phase !== 'READY') {
        lastAlertedContext.current = liveGameState.contextKey;
        
        // Si es Grand Final (Ronda 4) desde el sistema llega como round 1 del juego final, ajustamos:
        const effectiveLiveRound = (liveGameState.normalizedCategory === "GRAND FINAL" && liveGameState.round.toString() === "1") ? "4" : liveGameState.round.toString();

        const isAlreadyViewing = selectedCategory === liveGameState.normalizedCategory && selectedRound === effectiveLiveRound;
        if (!isAlreadyViewing) {
            setGameAlert({
                category: liveGameState.normalizedCategory,
                round: effectiveLiveRound,
                participantNumber: liveGameState.participantNumber || 'GROUP ACTIVITY'
            });
        }
    }
  }, [liveGameState, selectedCategory, selectedRound]);

  useEffect(() => {
      if (pendingSelection && participants.length > 0) {
          if (pendingSelection === 'GROUP ACTIVITY') {
             setPendingSelection(null);
          } else {
             const p = participants.find(p => p.order_number === pendingSelection);
             if (p) {
                 setSelectedParticipant(p);
                 setPendingSelection(null);
             }
          }
      }
  }, [participants, pendingSelection]);

  // FIX: Solo cargar de DB cuando se cambia de estudiante o ronda.
  useEffect(() => {
    if (selectedParticipant && judgeUsername) {
      const newContext = `${selectedParticipant._id}-${selectedRound}`;
      if (localScoresContext.current !== newContext) {
         const mySavedScores = selectedParticipant.scoresObj?.[judgeUsername]?.[`round_${selectedRound}`] || {};
         setLocalScores(mySavedScores);
         localScoresContext.current = newContext;
      }
    } else {
      setLocalScores({});
      localScoresContext.current = "";
    }
  }, [selectedParticipant?._id, selectedRound, judgeUsername]);

  const handleScoreSelect = (criteriaKey, score) => {
    setLocalScores(prev => ({ ...prev, [criteriaKey]: score }));
    setSaveStatus("idle");
  };

  const handleSaveScores = async () => {
    if (!selectedParticipant || Object.keys(localScores).length === 0 || !judgeUsername) return;
    setSaveStatus("saving");

    try {
      // Grand Final se guarda en American Think Starter, ronda 4.
      const dbCategoryName = selectedCategory === 'GRAND FINAL' ? 'AMERICAN THINK STARTER' : selectedCategory;
      
      const updatePromises = Object.entries(localScores).map(([criteriaKey, score]) => {
        return fetch(`${API_BASE_URL}/api/scores/${selectedParticipant._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_name: selectedParticipant.name,
            category: dbCategoryName,
            round_number: `round_${selectedRound}`,
            criteria_key: criteriaKey,
            score: score,
            judge_username: judgeUsername
          })
        });
      });

      await Promise.all(updatePromises);
      socket.emit('sync_state', { action: 'score_updated' });
      await fetchLiveScores(selectedCategory);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (error) {
      setSaveStatus("error");
    }
  };

  const calculateParticipantRoundTotalGlobal = (scoresObj, roundNum) => {
    if (!scoresObj) return 0;
    let total = 0;
    Object.values(scoresObj).forEach(judgeData => {
      const roundScores = judgeData[`round_${roundNum}`] || {};
      total += Object.values(roundScores).reduce((a, b) => a + b, 0);
    });
    return total;
  };

  const filteredParticipants = participants.filter(p => 
    p.order_number.toString().includes(searchTerm) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leaderboard = [...participants]
    .filter(p => calculateCategoryTotal(p.scoresObj, selectedCategory) > 0)
    .sort((a, b) => calculateCategoryTotal(b.scoresObj, selectedCategory) - calculateCategoryTotal(a.scoresObj, selectedCategory))
    .slice(0, 10);

  const activeRubrics = RUBRICS[selectedCategory]?.[selectedRound] || [];
  const activeRoundInfo = ROUND_INFO[selectedCategory]?.[selectedRound];
  const allCriteriaScored = activeRubrics.length > 0 && activeRubrics.every(r => localScores[r.key] !== undefined);

  const normalizedLiveGameCategory = liveGameState?.normalizedCategory;
  const isCorrectLiveCategory = normalizedLiveGameCategory === selectedCategory;
  
  const currentCategoryParticipants = participants.filter(p => p.category === (selectedCategory === "GRAND FINAL" ? "AMERICAN THINK STARTER" : selectedCategory)).sort((a, b) => a.order_number - b.order_number);
  const dynamicNumGroups = liveGameState?.numberOfGroups || 4; 
  const chunkSize = Math.ceil(currentCategoryParticipants.length / dynamicNumGroups);

  const getAmericanThinkGroup = (participantId) => {
    const index = currentCategoryParticipants.findIndex(p => p._id === participantId);
    if (index === -1) return -1;
    return Math.floor(index / chunkSize); 
  };

  const handleAcceptAlert = () => {
    setSelectedCategory(gameAlert.category);
    setSelectedRound(gameAlert.round.toString());
    setSearchTerm('');
    setPendingSelection(gameAlert.participantNumber); 
    setGameAlert(null);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (tempName.trim().length > 0) {
      sessionStorage.setItem('username', tempName.trim());
      setJudgeUsername(tempName.trim());
      setIsLoginModalOpen(false);
    }
  };

  if (isLoginModalOpen) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="bg-slate-900 border-2 border-indigo-500/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(99,102,241,0.2)] max-w-md w-full relative z-10 text-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Users size={48} />
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Judge Access</h2>
          <p className="text-slate-400 font-bold mb-8 text-sm">Please identify yourself to record individual scores.</p>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <input 
              type="text" 
              placeholder="e.g. Judge 1, Judge 2..." 
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white font-black uppercase tracking-widest text-center focus:border-indigo-500 outline-none transition-all"
              autoFocus
              required
            />
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-6 py-4 font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg transition-all transform active:scale-95">
              <LogIn size={20} /> Enter Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  const renderParticipantButton = (p) => {
    const isSelected = selectedParticipant?._id === p._id;
    const gradedByMe = p.scoresObj && p.scoresObj[judgeUsername]?.[`round_${selectedRound}`] && Object.keys(p.scoresObj[judgeUsername]?.[`round_${selectedRound}`]).length > 0;
    
    const isAmThinkR2 = selectedCategory === "AMERICAN THINK STARTER" && selectedRound === "2";
    const groupIdx = isAmThinkR2 ? getAmericanThinkGroup(p._id) : null;
    
    const effectiveLiveRound = (normalizedLiveGameCategory === "GRAND FINAL" && liveGameState?.round?.toString() === "1") ? "4" : liveGameState?.round?.toString();

    const onStage = isCorrectLiveCategory && effectiveLiveRound === selectedRound && (
        (!isAmThinkR2 && liveGameState?.participantNumber === p.order_number) ||
        (isAmThinkR2 && liveGameState?.currentGroupIdx === groupIdx) 
    );
    
    return (
      <button key={p._id} onClick={() => setSelectedParticipant(p)} className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all border-2 mb-1 ${isSelected ? `${activeCategoryObj?.color} text-white shadow-md border-transparent` : onStage ? 'bg-rose-50 border-rose-300 shadow-sm' : 'hover:bg-slate-50 bg-white border-transparent'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-white/20 text-white' : onStage ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
            {p.order_number}
          </div>
          <div>
            <span className={`font-black text-[11px] block leading-none uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-700'}`}>{p.name}</span>
            {onStage && !isSelected ? (
              <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest mt-1 flex items-center gap-1 animate-pulse"><Mic size={8}/> ON STAGE</span>
            ) : (
              gradedByMe && !isSelected && <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 block">✓ Graded by You</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24">
      
      {/* ALERTA EMERGENTE (POP-UP) */}
      {gameAlert && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl border-[6px] border-amber-400 w-full max-w-lg overflow-hidden animate-in slide-in-from-top-10 duration-500">
                <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <BellRing className="text-amber-400 animate-bounce" size={24} />
                        <h3 className="text-white font-black uppercase tracking-widest text-lg">Stage Update</h3>
                    </div>
                    <button onClick={() => setGameAlert(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                <div className="p-8 text-center space-y-4">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">A new session has started</p>
                    <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-tighter">{gameAlert.category}</h2>
                    <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                        <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest border border-slate-200">
                            Round {gameAlert.round}
                        </span>
                        <span className="bg-amber-100 text-amber-600 px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-widest border border-amber-200 flex items-center gap-2">
                            <Mic size={14}/> {gameAlert.participantNumber === 'GROUP ACTIVITY' ? 'GROUP TURN' : `Student #${gameAlert.participantNumber}`}
                        </span>
                    </div>
                </div>
                <div className="flex bg-slate-50 border-t border-slate-100 p-4 gap-4">
                    <button onClick={() => setGameAlert(null)} className="flex-1 py-3 rounded-xl font-black uppercase text-sm tracking-widest text-slate-400 hover:bg-slate-200 transition-colors">
                        Ignore
                    </button>
                    <button onClick={handleAcceptAlert} className="flex-[2] bg-amber-400 hover:bg-amber-300 text-amber-950 py-3 rounded-xl font-black uppercase text-sm tracking-widest shadow-md transition-all flex items-center justify-center gap-2">
                        <PlayCircle size={18}/> Go to Grade
                    </button>
                </div>
            </div>
        </div>
      )}

      <header className="bg-[#0f1115] text-white h-12 flex items-center border-b border-slate-800 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full max-w-[98%] mx-auto px-2">
          <div className="flex items-center gap-3">
            <BookOpen className="text-amber-400" size={16} />
            <div className="flex items-baseline gap-2">
              <h1 className="text-[13px] font-black tracking-widest text-white uppercase italic leading-none">Scoring Panel</h1>
              <span className="text-slate-600 text-xs">/</span>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Judge: <span className="text-white">{judgeUsername}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1d24] px-2 py-1 rounded border border-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live DB</span>
          </div>
        </div>
      </header>

      {liveGameState && liveGameState.game && liveGameState.phase !== 'READY' && (
        <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shadow-md border-b border-rose-500 z-40 relative">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
            <span className="font-black uppercase tracking-widest text-xs text-rose-400 flex items-center gap-1"><Mic size={14}/> LIVE STAGE</span>
            <div className="h-4 w-px bg-slate-700 mx-2"></div>
            <span className="font-bold text-[11px] uppercase tracking-widest text-slate-300">
              {normalizedLiveGameCategory} • R{liveGameState.round}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">On Stage:</span>
            <span className="text-sm font-black text-amber-400 uppercase">
                {liveGameState.participantNumber === 'GROUP ACTIVITY' 
                    ? `GROUP ${liveGameState.currentGroupIdx + 1}` 
                    : `#${liveGameState.participantNumber}`}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-[98%] mx-auto p-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Category</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedParticipant(null); setSelectedRound(cat.id === "GRAND FINAL" ? "4" : "1"); setSearchTerm(""); }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-black text-[11px] transition-all whitespace-nowrap border-2 uppercase tracking-wide
                  ${selectedCategory === cat.id ? `${cat.color} text-white border-transparent shadow-sm transform scale-105` : `bg-white text-slate-500 border-slate-200 ${cat.hover}`}`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedCategory === "ALL" ? (
        <main className="max-w-[98%] mx-auto p-4 mt-2">
           <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-200 min-h-[70vh]">
              <h2 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-800">
                 <Globe className="text-indigo-600" size={32} /> Global General Ranking
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {/* MUESTRA TODAS LAS CATEGORÍAS EN LA VISTA GLOBAL */}
                 {CATEGORIES.filter(c => c.id !== "ALL").map(cat => {
                     const catParticipants = participants.filter(p => {
                         if (cat.id === "GRAND FINAL") {
                             return p.scoresObj && calculateCategoryTotal(p.scoresObj, "GRAND FINAL") > 0 && p.category === "AMERICAN THINK STARTER";
                         }
                         return p.category === cat.name.toUpperCase() || p.category === cat.id;
                     }).sort((a,b) => calculateCategoryTotal(b.scoresObj, cat.id) - calculateCategoryTotal(a.scoresObj, cat.id));
                     
                     if(catParticipants.length === 0) return null;
                     
                     return (
                         <div key={cat.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                            <h3 className={`font-black uppercase tracking-widest text-sm mb-4 ${cat.text} flex items-center gap-2`}>{cat.icon} {cat.name}</h3>
                            <div className="space-y-2">
                               {catParticipants.slice(0, 10).map((p, idx) => (
                                   <div key={p._id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                         <span className="font-black text-xs text-slate-400">#{idx+1}</span>
                                         <span className="font-bold text-[11px] truncate">{p.name}</span>
                                      </div>
                                      <span className="font-black text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-800">
                                         {calculateCategoryTotal(p.scoresObj, cat.id)} pts
                                      </span>
                                   </div>
                               ))}
                            </div>
                         </div>
                     )
                 })}
              </div>
           </div>
        </main>
      ) : (
        <main className="max-w-[98%] mx-auto p-4 lg:flex lg:gap-6 lg:items-start mt-2">
          
          <div className="lg:w-1/4 space-y-4">
            <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Round</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {selectedCategory === 'GRAND FINAL' ? (
                   <button onClick={() => setSelectedRound('4')} className={`flex-1 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all bg-white text-slate-900 shadow-sm`}>
                     Round 4 (Final)
                   </button>
                ) : (
                  ['1', '2', '3'].map(r => (
                    <button key={r} onClick={() => setSelectedRound(r)} className={`flex-1 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all ${selectedRound === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      Round {r}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[55vh]">
              <div className="bg-slate-50 p-3 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className={activeCategoryObj?.text}/>
                  <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest">Participants</h3>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search # or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-[10px] font-bold outline-none focus:border-amber-400 transition-all"/>
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {filteredParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p className="font-bold text-[10px] uppercase tracking-widest">No participants found</p>
                  </div>
                ) : (
                  selectedCategory === "AMERICAN THINK STARTER" && selectedRound === "2" ? (
                    <div className="space-y-4 pb-2">
                       {Array.from({ length: dynamicNumGroups }).map((_, gIdx) => {
                           const groupParts = filteredParticipants.filter(p => getAmericanThinkGroup(p._id) === gIdx);
                           if(groupParts.length === 0) return null;
                           return (
                               <div key={`group-${gIdx}`} className="bg-slate-50 rounded-[1rem] p-2 border border-slate-200 shadow-sm">
                                   <div className="bg-slate-800 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest mb-2 flex justify-between items-center">
                                       <span>TURN: GROUP {gIdx + 1}</span>
                                       <Users size={14} className="text-amber-400" />
                                   </div>
                                   <div>{groupParts.map(p => renderParticipantButton(p))}</div>
                               </div>
                           )
                       })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredParticipants.map(p => renderParticipantButton(p))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-2/4 mt-6 lg:mt-0">
            {!selectedParticipant ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className={`w-20 h-20 rounded-full ${activeCategoryObj?.color} bg-opacity-10 flex items-center justify-center mb-4`}>{activeCategoryObj?.icon}</div>
                <h2 className="text-xl font-black text-slate-600 uppercase tracking-widest">No Student Selected</h2>
              </div>
            ) : (
              <div className="space-y-4 relative">
                <div className={`${activeCategoryObj?.color} text-white p-5 rounded-[2rem] shadow-xl flex items-center justify-between`}>
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">Round {selectedCategory === 'GRAND FINAL' ? '4 (Final)' : selectedRound}</span>
                    <h2 className="text-2xl font-black tracking-tight mt-2 uppercase">{selectedParticipant.name}</h2>
                  </div>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 font-black text-xl">#{selectedParticipant.order_number}</div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-8">
                  {activeRoundInfo && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-2">
                      <h3 className="text-amber-800 font-black uppercase tracking-widest text-[11px] mb-1 flex items-center gap-2"><Info size={14} />{activeRoundInfo.title}</h3>
                      <p className="text-amber-700 text-xs font-medium leading-relaxed">{activeRoundInfo.objective}</p>
                    </div>
                  )}

                  {activeRubrics.length > 0 ? (
                    activeRubrics.map((rubric) => {
                      const selScore = localScores[rubric.key];
                      // Opciones ordenadas de 0 al Máximo.
                      const options = Array.from({length: rubric.max + 1}, (_, i) => i);
                      const gridColsClass = rubric.max === 5 ? 'grid-cols-6' : rubric.max === 4 ? 'grid-cols-5' : rubric.max === 3 ? 'grid-cols-4' : 'grid-cols-3';

                      return (
                        <div key={rubric.key} className="space-y-4">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                               <Zap size={16} className={activeCategoryObj.text} /> {rubric.title}
                            </h3>
                          </div>
                          <div className={`grid ${gridColsClass} gap-2 pt-1`}>
                            {options.map(score => (
                              <div key={score} className="flex flex-col items-center">
                                {/* TEXTO EXPLICATIVO ARRIBA DEL BOTÓN */}
                                <span className={`text-[9px] font-bold text-center leading-tight mb-2 h-10 flex items-end justify-center px-1 ${selScore === score ? 'text-indigo-600' : 'text-slate-400'}`}>
                                   {rubric.pointsDesc[score] || ""}
                                </span>
                                <button onClick={() => handleScoreSelect(rubric.key, score)} className={`w-full py-3 rounded-xl font-black text-lg transition-all border-2 ${selScore === score ? 'bg-indigo-600 border-indigo-700 text-white scale-105 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-300'}`}>
                                  {score}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-slate-400 font-bold py-10">No rubrics defined for this round yet.</p>
                  )}
                </div>

                <div className="bg-slate-900 rounded-[1.5rem] p-3 shadow-lg flex items-center justify-between border border-slate-700 mt-6">
                  <div className="text-slate-300 px-3">
                    {allCriteriaScored ? <p className="text-[10px] uppercase tracking-widest font-black"><span className="text-emerald-400">✓ Ready to Save</span></p> : <p className="text-[10px] uppercase tracking-widest font-black"><span className="text-amber-400 animate-pulse">! Incomplete</span></p>}
                  </div>
                  <button onClick={handleSaveScores} disabled={saveStatus === 'saving'} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${saveStatus === 'saving' ? 'bg-slate-700 text-slate-400' : saveStatus === 'saved' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950 hover:bg-amber-300'}`}>
                    {saveStatus === 'idle' && <><Save size={14} /> Save My Score</>}
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && <><CheckCircle2 size={14} /> Saved!</>}
                    {saveStatus === 'error' && 'Retry'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:w-1/4 mt-6 lg:mt-0 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl border-2 border-slate-800 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-10"><BarChart3 size={80}/></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Global Total (All Judges)</h3>
              
              {selectedParticipant ? (
                <div className="space-y-2 relative z-10">
                  <p className="font-black text-sm text-amber-400 truncate uppercase tracking-widest text-center">{selectedParticipant.name}</p>
                  {selectedCategory === 'GRAND FINAL' ? (
                     <div className="flex justify-between items-center bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Round 4</span>
                        <span className="font-black text-sm">{calculateParticipantRoundTotalGlobal(selectedParticipant.scoresObj, 4)} pts</span>
                     </div>
                  ) : (
                     [1, 2, 3].map(r => (
                       <div key={r} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Round {r}</span>
                         <span className="font-black text-sm">{calculateParticipantRoundTotalGlobal(selectedParticipant.scoresObj, r)} pts</span>
                       </div>
                     ))
                  )}
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center mt-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total (All Judges)</span>
                    <span className="text-2xl font-black text-emerald-400">{calculateCategoryTotal(selectedParticipant.scoresObj, selectedCategory)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest py-8 text-center leading-relaxed">Select a participant<br/>to view scores</p>
              )}
            </div>

            <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Trophy size={14} className="text-amber-400"/> Live Ranking (Global)
              </h3>
              <div className="space-y-2">
                {leaderboard.length === 0 ? (
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 text-center py-4 font-black">No scores recorded.</p>
                ) : (
                  leaderboard.map((p, idx) => (
                    <div key={p._id} className={`flex items-center justify-between p-2.5 rounded-xl border ${idx === 0 ? 'bg-amber-50 border-amber-200' : idx === 1 ? 'bg-slate-50 border-slate-200' : idx === 2 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`font-black text-[11px] ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-orange-400' : 'text-slate-300'}`}>#{idx + 1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 truncate">{p.name}</span>
                      </div>
                      <span className="font-black text-[11px] text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{calculateCategoryTotal(p.scoresObj, selectedCategory)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
};

export default JudgesView;