import React, { useState, useEffect, useCallback } from 'react';
import { Users, ChevronRight, CheckCircle2, AlertCircle, Save, BookOpen, Brain, Zap, Trophy, Type, Info, BarChart3, Camera, Globe, Search } from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);


// Identificador del juez que inició sesión (AHORA USA sessionStorage)
const judgeUsername = sessionStorage.getItem('username') || 'unknown_judge';

const ROUND_INFO = {
  "POWER UP 3": {
    "1": { title: "Round 1: Reading & Auditory", objective: "Evaluates visual recognition, accurate pronunciation, spelling, and sentence structuring (min. 6 words)." },
    "2": { title: "Round 2: Board Challenge", objective: "Evaluates team spelling accuracy, strict use of capitalization, spacing, and punctuation in dictation." },
    "3": { title: "Round 3: Speed & Recall", objective: "Evaluates speed reading fluency and the ability to recall and spell the last word to form a valid sentence." }
  }
};

const RUBRICS = {
  "POWER UP 3": {
    "1": [
      { key: "fase1", title: "Phase 1 (Reading)", max: 3, desc: "Reads the 3 words correctly with good pronunciation and fluency." },
      { key: "fase2", title: "Phase 2 (Cycle 1)", max: 3, desc: "Listens, repeats, spells, and creates a clear sentence (min. 6 words)." },
      { key: "fase3", title: "Phase 3 (Cycle 2)", max: 3, desc: "Listens, repeats, spells, and creates a clear sentence (min. 6 words)." }
    ],
    "2": [
      { key: "parteA", title: "Part A (Scramble)", max: 3, desc: "Team writes the 3 words with perfectly correct spelling and letter order." },
      { key: "parteB", title: "Part B (Sentence)", max: 5, desc: "Sentence Dictation: Perfect capitalization, spacing, and final punctuation." },
      { key: "parteC", title: "Part C (Letter-by-Letter)", max: 5, desc: "Letter Dictation: Word must be spelled perfectly, respecting capitalization." }
    ],
    "3": [
      { key: "fase1", title: "Phase 1 (Speed Reading 10s)", max: 3, desc: "Reads words with a good rhythm, steady pace, and proper pronunciation." },
      { key: "fase2", title: "Phase 2 (Recall + Sentence 18s)", max: 3, desc: "Correctly spells the LAST word read and forms a valid sentence (min. 6 words)." }
    ]
  }
};

const CATEGORIES = [
  { id: "ALL", name: "Global Ranking", icon: <Globe size={16} />, color: "bg-indigo-600", text: "text-indigo-600", hover: "hover:bg-indigo-50" },
  { id: "LITTLE STEPS", name: "Little Steps", icon: <Camera size={16} />, color: "bg-sky-500", text: "text-sky-500", hover: "hover:bg-sky-50" },
  { id: "KID´S BOX", name: "Kid's Box", icon: <Brain size={16} />, color: "bg-emerald-500", text: "text-emerald-500", hover: "hover:bg-emerald-50" },
  { id: "POWER UP 1", name: "Power Up 1", icon: <Type size={16} />, color: "bg-violet-500", text: "text-violet-500", hover: "hover:bg-violet-50" },
  { id: "POWER UP 3", name: "Power Up 3", icon: <Zap size={16} />, color: "bg-rose-500", text: "text-rose-500", hover: "hover:bg-rose-50" },
  { id: "AMERICAN THINK STARTER", name: "American Think", icon: <Trophy size={16} />, color: "bg-orange-500", text: "text-orange-500", hover: "hover:bg-orange-50" }
];

const JudgesView = () => {
  const [selectedCategory, setSelectedCategory] = useState("POWER UP 3");
  const [selectedRound, setSelectedRound] = useState("1");
  const [participants, setParticipants] = useState([]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [localScores, setLocalScores] = useState({});
  const [saveStatus, setSaveStatus] = useState("idle");
  const [searchTerm, setSearchTerm] = useState("");

  const activeCategoryObj = CATEGORIES.find(c => c.id === selectedCategory);

  const fetchLiveScores = useCallback(async (category) => {
    try {
      const [partsRes, scoresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/participants/${category}`),
        fetch(`${API_BASE_URL}/api/scores/${category}`)
      ]);
      const partsData = await partsRes.json();
      const scoresData = await scoresRes.json();

      const merged = partsData.map(p => {
        const pScore = scoresData.find(s => s.participant_id === p._id);
        return { ...p, scoresObj: pScore?.scores || {} };
      });
      
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
    if (selectedCategory) fetchLiveScores(selectedCategory);

    const handleRemoteUpdate = (payload) => {
      if (payload?.action === 'score_updated') fetchLiveScores(selectedCategory);
    };

    socket.on('sync_state', handleRemoteUpdate);
    socket.on('score_updated', () => fetchLiveScores(selectedCategory));

    return () => {
      socket.off('sync_state', handleRemoteUpdate);
      socket.off('score_updated');
    };
  }, [selectedCategory, fetchLiveScores]);

  useEffect(() => {
    if (selectedParticipant) {
      // Cargamos únicamente los scores que este juez específico ha puesto
      const mySavedScores = selectedParticipant.scoresObj?.[judgeUsername]?.[`round_${selectedRound}`] || {};
      setLocalScores(mySavedScores);
    } else {
      setLocalScores({});
    }
  }, [selectedParticipant, selectedRound, participants]);

  const handleScoreSelect = (criteriaKey, score) => {
    setLocalScores(prev => ({ ...prev, [criteriaKey]: score }));
    setSaveStatus("idle");
  };

  const handleSaveScores = async () => {
    if (!selectedParticipant || Object.keys(localScores).length === 0) return;
    setSaveStatus("saving");

    try {
      const updatePromises = Object.entries(localScores).map(([criteriaKey, score]) => {
        return fetch(`${API_BASE_URL}/api/scores/${selectedParticipant._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_name: selectedParticipant.name,
            category: selectedCategory,
            round_number: `round_${selectedRound}`,
            criteria_key: criteriaKey,
            score: score,
            judge_username: judgeUsername // Identificador único de este juez
          })
        });
      });

      await Promise.all(updatePromises);
      socket.emit('sync_state', { action: 'score_updated' });
      await fetchLiveScores(selectedCategory);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch (error) {
      console.error("Error saving scores:", error);
      setSaveStatus("error");
    }
  };

  // SUMA GLOBAL (Combina los puntos de TODOS los jueces)
  const calculateParticipantRoundTotalGlobal = (scoresObj, roundNum) => {
    if (!scoresObj) return 0;
    let total = 0;
    Object.values(scoresObj).forEach(judgeData => {
      const roundScores = judgeData[`round_${roundNum}`] || {};
      total += Object.values(roundScores).reduce((a, b) => a + b, 0);
    });
    return total;
  };

  const calculateGrandTotalAllJudges = (scoresObj) => {
    return [1, 2, 3].reduce((acc, r) => acc + calculateParticipantRoundTotalGlobal(scoresObj, r), 0);
  };

  // Filtro de participantes
  const filteredParticipants = participants.filter(p => 
    p.order_number.toString().includes(searchTerm) || 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const leaderboard = [...participants]
    .filter(p => calculateGrandTotalAllJudges(p.scoresObj) > 0)
    .sort((a, b) => calculateGrandTotalAllJudges(b.scoresObj) - calculateGrandTotalAllJudges(a.scoresObj))
    .slice(0, 10);

  const activeRubrics = RUBRICS[selectedCategory]?.[selectedRound] || [];
  const activeRoundInfo = ROUND_INFO[selectedCategory]?.[selectedRound];
  const allCriteriaScored = activeRubrics.length > 0 && activeRubrics.every(r => localScores[r.key] !== undefined);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-24">
      
      {/* HEADER PRINCIPAL EXTRA FINO Y STICKY (TE ACOMPAÑA AL SCROLLEAR) */}
      <header className="bg-[#0f1115] text-white h-12 flex items-center border-b border-slate-800 sticky top-0 z-50">
        <div className="flex justify-between items-center w-full max-w-[98%] mx-auto px-2">
          <div className="flex items-center gap-3">
            <BookOpen className="text-amber-400" size={16} />
            <div className="flex items-baseline gap-2">
              <h1 className="text-[13px] font-black tracking-widest text-white uppercase italic leading-none">Scoring Panel</h1>
              <span className="text-slate-600 text-xs">/</span>
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Judge: {judgeUsername}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1d24] px-2 py-1 rounded border border-slate-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Live DB</span>
          </div>
        </div>
      </header>

      {/* PANELES DE CATEGORÍAS */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-[98%] mx-auto p-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Category</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setSelectedParticipant(null); setSelectedRound("1"); setSearchTerm(""); }}
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
        /* VISTA GLOBAL DE RANKING */
        <main className="max-w-[98%] mx-auto p-4 mt-2">
           <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-200 min-h-[70vh]">
              <h2 className="text-2xl font-black uppercase tracking-widest mb-6 flex items-center gap-3 text-slate-800">
                 <Globe className="text-indigo-600" size={32} /> Global General Ranking
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {CATEGORIES.filter(c => c.id !== "ALL").map(cat => {
                     const catParticipants = participants.filter(p => p.category === cat.name.toUpperCase())
                         .sort((a,b) => calculateGrandTotalAllJudges(b.scoresObj) - calculateGrandTotalAllJudges(a.scoresObj));

                     if(catParticipants.length === 0) return null;

                     return (
                         <div key={cat.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                            <h3 className={`font-black uppercase tracking-widest text-sm mb-4 ${cat.text} flex items-center gap-2`}>
                               {cat.icon} {cat.name}
                            </h3>
                            <div className="space-y-2">
                               {catParticipants.slice(0, 10).map((p, idx) => (
                                   <div key={p._id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                         <span className="font-black text-xs text-slate-400">#{idx+1}</span>
                                         <span className="font-bold text-[11px] truncate">{p.name}</span>
                                      </div>
                                      <span className="font-black text-[11px] bg-slate-100 px-2 py-1 rounded text-slate-800">
                                         {calculateGrandTotalAllJudges(p.scoresObj)} pts
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
        /* VISTA NORMAL DE JUECES (3 COLUMNAS) */
        <main className="max-w-[98%] mx-auto p-4 lg:flex lg:gap-6 lg:items-start mt-2">
          
          {/* COLUMNA 1: RONDAS Y PARTICIPANTES */}
          <div className="lg:w-1/4 space-y-4">
            <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-slate-200">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Select Round</h3>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                {['1', '2', '3'].map(r => (
                  <button key={r} onClick={() => setSelectedRound(r)} className={`flex-1 py-2 rounded-lg font-black text-[11px] uppercase tracking-wider transition-all ${selectedRound === r ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    Round {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[55vh]">
              <div className="bg-slate-50 p-3 border-b border-slate-100 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className={activeCategoryObj.text}/>
                  <h3 className="font-black text-[11px] text-slate-700 uppercase tracking-widest">Participants</h3>
                </div>
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search # or name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-[10px] font-bold outline-none focus:border-amber-400 transition-all"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {filteredParticipants.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p className="font-bold text-[10px] uppercase tracking-widest">No participants found</p>
                  </div>
                ) : (
                  filteredParticipants.map(p => {
                    const isSelected = selectedParticipant?._id === p._id;
                    const hasMyScores = p.scoresObj && p.scoresObj[judgeUsername]?.[`round_${selectedRound}`] && Object.keys(p.scoresObj[judgeUsername]?.[`round_${selectedRound}`]).length > 0;
                    
                    return (
                      <button key={p._id} onClick={() => setSelectedParticipant(p)} className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${isSelected ? `${activeCategoryObj.color} text-white shadow-md` : 'hover:bg-slate-50 bg-white'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {p.order_number}
                          </div>
                          <div>
                            <span className={`font-black text-[11px] block leading-none uppercase tracking-wide ${isSelected ? 'text-white' : 'text-slate-700'}`}>{p.name}</span>
                            {hasMyScores && !isSelected && <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest mt-1 block">✓ Graded</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA 2: RÚBRICA Y CALIFICACIÓN */}
          <div className="lg:w-2/4 mt-6 lg:mt-0">
            {!selectedParticipant ? (
              <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 h-[60vh] flex flex-col items-center justify-center text-slate-400">
                <div className={`w-20 h-20 rounded-full ${activeCategoryObj.color} bg-opacity-10 flex items-center justify-center mb-4`}>{activeCategoryObj.icon}</div>
                <h2 className="text-xl font-black text-slate-600 uppercase tracking-widest">No Student Selected</h2>
              </div>
            ) : (
              <div className="space-y-4 relative">
                <div className={`${activeCategoryObj.color} text-white p-5 rounded-[2rem] shadow-xl flex items-center justify-between`}>
                  <div>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase">Round {selectedRound}</span>
                    <h2 className="text-2xl font-black tracking-tight mt-2 uppercase">{selectedParticipant.name}</h2>
                  </div>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/20 shadow-inner">
                    <span className="text-xl font-black text-white">{selectedParticipant.order_number}</span>
                  </div>
                </div>

                <div className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-6">
                  {activeRoundInfo && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-2">
                      <h3 className="text-amber-800 font-black uppercase tracking-widest text-[11px] mb-1 flex items-center gap-2"><Info size={14} />{activeRoundInfo.title}</h3>
                      <p className="text-amber-700 text-xs font-medium leading-relaxed">{activeRoundInfo.objective}</p>
                    </div>
                  )}

                  {activeRubrics.map((rubric) => {
                    const selectedScore = localScores[rubric.key];
                    const scoreOptions = Array.from({length: rubric.max + 1}, (_, i) => rubric.max - i);

                    return (
                      <div key={rubric.key} className="space-y-2">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">{rubric.title}</h3>
                          <p className="text-[11px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg mt-1 border border-slate-100 uppercase tracking-wider">{rubric.desc}</p>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                          {scoreOptions.map(score => (
                            <button
                              key={score}
                              onClick={() => handleScoreSelect(rubric.key, score)}
                              className={`py-2.5 rounded-xl font-black text-lg transition-all border-2
                                ${selectedScore === score ? (score > 0 ? 'bg-emerald-500 border-emerald-600 text-white transform scale-105 shadow-md' : 'bg-rose-500 border-rose-600 text-white transform scale-105 shadow-md') 
                                  : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* BARRA DE GUARDADO (ESTÁTICA, NO FIXED) */}
                <div className="bg-slate-900 rounded-[1.5rem] p-3 shadow-lg flex items-center justify-between border border-slate-700 mt-6">
                  <div className="text-slate-300 px-3">
                    {allCriteriaScored ? <p className="text-[10px] uppercase tracking-widest font-black"><span className="text-emerald-400">✓ Ready</span> to save</p> : <p className="text-[10px] uppercase tracking-widest font-black"><span className="text-amber-400 animate-pulse">! Pending</span> scores</p>}
                  </div>
                  <button onClick={handleSaveScores} disabled={saveStatus === 'saving'} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-black text-[11px] uppercase tracking-widest transition-all ${saveStatus === 'saving' ? 'bg-slate-700 text-slate-400' : saveStatus === 'saved' ? 'bg-emerald-500 text-white' : saveStatus === 'error' ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950 hover:bg-amber-300'}`}>
                    {saveStatus === 'idle' && <><Save size={14} /> Save</>}
                    {saveStatus === 'saving' && 'Saving...'}
                    {saveStatus === 'saved' && <><CheckCircle2 size={14} /> Saved!</>}
                    {saveStatus === 'error' && 'Retry'}
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* COLUMNA 3: RESUMEN GLOBAL Y LEADERBOARD */}
          <div className="lg:w-1/4 mt-6 lg:mt-0 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-[1.5rem] shadow-xl border-2 border-slate-800 relative overflow-hidden">
              <div className="absolute -right-2 -top-2 opacity-10"><BarChart3 size={80}/></div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Global Score Summary</h3>
              
              {selectedParticipant ? (
                <div className="space-y-2 relative z-10">
                  <p className="font-black text-sm text-amber-400 truncate uppercase tracking-widest">{selectedParticipant.name}</p>
                  {[1, 2, 3].map(r => (
                    <div key={r} className="flex justify-between items-center bg-slate-800 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Round {r}</span>
                      <span className="font-black text-sm">{calculateParticipantRoundTotalGlobal(selectedParticipant.scoresObj, r)} <span className="text-[9px] text-slate-500">pts</span></span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-700 flex justify-between items-center mt-2">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Total (All Judges)</span>
                    <span className="text-2xl font-black text-emerald-400">{calculateGrandTotalAllJudges(selectedParticipant.scoresObj)}</span>
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
                      <span className="font-black text-[11px] text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{calculateGrandTotalAllJudges(p.scoresObj)}</span>
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