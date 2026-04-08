import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Play, Settings, Info, Award, Loader2, X, 
  ChevronRight, BookOpen, Trophy, LogOut, MapPin, Trash2, BarChart2, Zap, Camera, Search, Plus
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

const calcTotalGlobal = (scoresObj) => {
    if (!scoresObj) return 0;
    let total = 0;
    Object.values(scoresObj).forEach(judgeData => {
        [1, 2, 3].forEach(roundNum => {
            const roundScores = judgeData[`round_${roundNum}`] || {};
            total += Object.values(roundScores).reduce((a, b) => a + b, 0);
        });
    });
    return total;
};

const AdminView = () => {
  const navigate = useNavigate();
  
  const [activeCategory, setActiveCategory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Persistencia de sede guardando en LocalStorage
  const [branch, setBranchState] = useState(localStorage.getItem('selectedBranch') || 'COCA'); 
  
  const setBranch = (newBranch) => {
      setBranchState(newBranch);
      localStorage.setItem('selectedBranch', newBranch);
  };

  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [liveParticipants, setLiveParticipants] = useState([]);

  // ESTADOS DE LA RULETA HÍBRIDA
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [rouletteCategory, setRouletteCategory] = useState("MANUAL"); // NUEVO: Control de combobox
  const [rouletteParticipants, setRouletteParticipants] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [lastWinner, setLastWinner] = useState(null);
  const [newRouletteNames, setNewRouletteNames] = useState("");

  const [numberOfGroups, setNumberOfGroups] = useState(4); 
  const [searchQuery, setSearchQuery] = useState('');

  const categoryDetails = {
    "LITTLE STEPS": { desc: "Nivel inicial (4-5 años). Enfoque en reconocimiento.", icon: <Camera />, route: '/juego/little-steps' },
    "KIDS BOX": { desc: "Nivel Primaria. Colores, objetos y gramática.", icon: <Info />, route: '/juego/kids-box' },
    "POWER UP 1": { desc: "Nivel inicial. Enfoque en vocabulario básico y deletreo.", icon: <BookOpen />, route: '/juego/power-up-1' },
    "POWER UP 3": { desc: "Nivel intermedio. Estructuras gramaticales y fluidez.", icon: <Zap />, route: '/juego/power-up-3' },
    "AMERICAN THINK STARTER": { desc: "Nivel A1. Pensamiento crítico y vocabulario.", icon: <Settings />, route: '/juego/american-think' },
    "GRAND FINAL": { desc: "Competencia de élite. Top 5 clasificados.", icon: <Trophy />, route: '/juego/grand-final' }
  };

  const categories = Object.keys(categoryDetails);

  useEffect(() => {
    document.body.style.backgroundColor = '#F0F7FF';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const filterByBranchLogic = (parts, currentBranch) => {
    return parts.filter(p => {
        if (currentBranch === 'COCA') return p.order_number <= 74;
        if (currentBranch === 'SACHA') return p.order_number >= 75;
        return true;
    });
  };

  const fetchGlobalScores = useCallback(async () => {
    try {
      const [partsRes, scoresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/participants/ALL?branch=${branch}`),
        fetch(`${API_BASE_URL}/api/scores/ALL?branch=${branch}`)
      ]);
      const partsData = await partsRes.json();
      const scoresData = await scoresRes.json();

      let merged = partsData.map(p => {
        const pScore = scoresData.find(s => s.participant_id === p._id);
        return { ...p, scoresObj: pScore?.scores || {} };
      });
      
      setLiveParticipants(filterByBranchLogic(merged, branch));
    } catch (error) {
      console.error("Error cargando puntajes globales:", error);
    }
  }, [branch]);

  useEffect(() => {
    if (isLeaderboardOpen) fetchGlobalScores();

    const handleUpdate = () => { if(isLeaderboardOpen) fetchGlobalScores(); };
    socket.on('score_updated', handleUpdate);
    socket.on('sync_state', (payload) => { if(payload?.action === 'score_updated') handleUpdate(); });

    return () => {
      socket.off('score_updated', handleUpdate);
      socket.off('sync_state', handleUpdate);
    };
  }, [isLeaderboardOpen, fetchGlobalScores]);

  const openConfig = async (categoryName) => {
    setLoading(true);
    setActiveCategory(categoryName);
    setIsModalOpen(true);
    setNumberOfGroups(4);
    setSearchQuery(''); 
    
    socket.emit('sync_state', {
      game: 'SHOW_RULES',
      category: categoryName,
      branch: branch,
      phase: 'READY' 
    });

    try {
      if (categoryName === "GRAND FINAL") {
        const [partsRes, amScoresRes, gfScoresRes] = await Promise.all([
            fetch(`${API_BASE_URL}/participants/AMERICAN%20THINK%20STARTER?branch=${branch}`),
            fetch(`${API_BASE_URL}/api/scores/AMERICAN%20THINK%20STARTER?branch=${branch}`),
            fetch(`${API_BASE_URL}/api/scores/GRAND_FINAL?branch=${branch}`)
        ]);
        const partsData = await partsRes.json();
        const amScoresData = await amScoresRes.json();
        const gfScoresData = await gfScoresRes.json();
        
        let merged = partsData.map(p => {
            const pScore = amScoresData.find(s => s.participant_id === p._id);
            return { ...p, amScores: pScore?.scores || {} };
        });

        const branchFiltered = filterByBranchLogic(merged, branch);

        const top5 = branchFiltered.filter(p => calcTotalGlobal(p.amScores) > 0)
                           .sort((a,b) => calcTotalGlobal(b.amScores) - calcTotalGlobal(a.amScores))
                           .slice(0, 5);

        const finalTop5 = top5.map(p => {
            const gfScore = gfScoresData.find(s => s.participant_id === p._id);
            return { ...p, scoresObj: gfScore?.scores || {} };
        });

        setParticipants(finalTop5);
      } else {
        const response = await axios.get(`${API_BASE_URL}/participants/${encodeURIComponent(categoryName)}?branch=${branch}`);
        const sortedData = filterByBranchLogic(response.data, branch).sort((a, b) => a.order_number - b.order_number);
        setParticipants(sortedData);
      }
    } catch (error) {
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setActiveCategory(null), 300); 
    socket.emit('clear_state');
  };

  const toggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'waiting' ? 'absent' : 'waiting';
    setParticipants(participants.map(p => p._id === id ? { ...p, status: newStatus } : p));
  };

  const setAllStatus = (newStatus) => {
    setParticipants(participants.map(p => ({ ...p, status: newStatus })));
  };

  const handleStartGame = () => {
    const presentOnes = participants.filter(p => p.status === 'waiting');
    if (presentOnes.length === 0) {
      alert("Debes tener al menos un participante presente para iniciar.");
      return;
    }
    const targetRoute = categoryDetails[activeCategory].route;
    navigate(targetRoute, { state: { participants: presentOnes, numberOfGroups } });
  };

  const handleResetAllScores = async () => {
    const confirm1 = window.confirm(`⚠️ PELIGRO EXTREMO: Estás a punto de ELIMINAR LOS PUNTAJES DE TODOS LOS CONCURSOS. Esta acción NO se puede deshacer. ¿Estás absolutamente seguro?`);
    if (!confirm1) return;
    const confirm2 = window.confirm(`⚠️ ÚLTIMA ADVERTENCIA: ¿Confirmas que deseas BORRAR TODOS LOS DATOS de calificación?`);
    if (!confirm2) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/scores/ALL?branch=${branch}`);
      alert("Todas las votaciones de todos los concursos han sido reiniciadas a cero.");
      socket.emit('sync_state', { action: 'score_updated' }); 
      if (isLeaderboardOpen) fetchGlobalScores();
    } catch (error) {
      alert("Error al reiniciar votaciones.");
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // ================= LÓGICA DE LA RULETA HÍBRIDA =================

  // Cargar participantes si se elige una categoría del combo box
  useEffect(() => {
      if (!isRouletteOpen || rouletteCategory === "MANUAL") return;

      const loadCategoryToRoulette = async () => {
          try {
              setLastWinner(null);
              let fetchedParts = [];

              if (rouletteCategory === "ALL") {
                  const response = await axios.get(`${API_BASE_URL}/participants/ALL?branch=${branch}`);
                  fetchedParts = filterByBranchLogic(response.data, branch);
              } else if (rouletteCategory === "GRAND FINAL") {
                  const [partsRes, scoresRes] = await Promise.all([
                      fetch(`${API_BASE_URL}/participants/AMERICAN%20THINK%20STARTER?branch=${branch}`),
                      fetch(`${API_BASE_URL}/api/scores/AMERICAN%20THINK%20STARTER?branch=${branch}`)
                  ]);
                  const partsData = await partsRes.json();
                  const scoresData = await scoresRes.json();
                  let merged = partsData.map(p => ({ ...p, scoresObj: scoresData.find(s => s.participant_id === p._id)?.scores || {} }));
                  const branchFiltered = filterByBranchLogic(merged, branch);
                  const top5 = branchFiltered.filter(p => calcTotalGlobal(p.scoresObj) > 0).sort((a,b) => calcTotalGlobal(b.scoresObj) - calcTotalGlobal(a.scoresObj)).slice(0, 5);
                  fetchedParts = top5;
              } else {
                  const response = await axios.get(`${API_BASE_URL}/participants/${encodeURIComponent(rouletteCategory)}?branch=${branch}`);
                  fetchedParts = filterByBranchLogic(response.data, branch);
              }

              const formatted = fetchedParts.map(p => ({ id: p._id || Date.now() + Math.random(), name: p.name.toUpperCase() }));
              setRouletteParticipants(formatted);

              socket.emit('sync_state', {
                  game: 'ROULETTE_MODE',
                  phase: 'ROULETTE_ACTIVE',
                  participants: formatted.map(p => p.name),
                  spinning: false,
                  winnerName: ""
              });

          } catch(e) { 
              setRouletteParticipants([]); 
          }
      };

      loadCategoryToRoulette();
  }, [rouletteCategory, branch, isRouletteOpen]);

  // Manejo de múltiples nombres manuales separados por salto de línea
  const handleAddRouletteNames = (e) => {
      e.preventDefault();
      if (!newRouletteNames.trim()) return;
      
      const namesArray = newRouletteNames.split('\n')
          .map(n => n.trim().toUpperCase())
          .filter(n => n.length > 0);
          
      if (namesArray.length === 0) return;

      const newParts = namesArray.map((name, idx) => ({
          id: Date.now() + idx,
          name: name
      }));
      
      const updated = [...rouletteParticipants, ...newParts];
      
      setRouletteParticipants(updated);
      setNewRouletteNames("");
      setRouletteCategory("MANUAL"); // Cambiar combobox a manual para evitar refetch

      if (!spinning) {
          socket.emit('sync_state', {
              game: 'ROULETTE_MODE',
              phase: 'ROULETTE_ACTIVE',
              participants: updated.map(p => p.name),
              spinning: false,
              winnerName: lastWinner ? lastWinner.name : ""
          });
      }
  };

  const handleRemoveRouletteParticipant = (idToRemove) => {
      const updated = rouletteParticipants.filter(p => p.id !== idToRemove);
      setRouletteParticipants(updated);

      let currentWinner = lastWinner ? lastWinner.name : "";
      if (lastWinner && lastWinner.id === idToRemove) {
          setLastWinner(null);
          currentWinner = "";
      }

      if (!spinning) {
          socket.emit('sync_state', {
              game: 'ROULETTE_MODE',
              phase: 'ROULETTE_ACTIVE',
              participants: updated.map(p => p.name),
              spinning: false,
              winnerName: currentWinner
          });
      }
  };

  const handleClearRoulette = () => {
      if (spinning) return;
      setRouletteParticipants([]);
      setLastWinner(null);
      setRouletteCategory("MANUAL");
      
      socket.emit('sync_state', {
          game: 'ROULETTE_MODE',
          phase: 'ROULETTE_ACTIVE', 
          participants: [],
          spinning: false,
          winnerName: ""
      });
  };

  const spinRoulette = () => {
      if (rouletteParticipants.length === 0) return;
      
      setLastWinner(null);
      const winner = rouletteParticipants[Math.floor(Math.random() * rouletteParticipants.length)];
      setSpinning(true);

      socket.emit('sync_state', {
          game: 'ROULETTE_MODE',
          phase: 'ROULETTE_ACTIVE', 
          participants: rouletteParticipants.map(p => p.name),
          spinning: true,
          winnerName: winner.name 
      });

      setTimeout(() => {
          setSpinning(false);
          setLastWinner(winner);
          socket.emit('sync_state', {
              game: 'ROULETTE_MODE',
              phase: 'ROULETTE_ACTIVE', 
              participants: rouletteParticipants.map(p => p.name),
              spinning: false, 
              winnerName: winner.name
          });
      }, 6000); 
  };

  const handleRemoveWinner = () => {
      if (!lastWinner) return;
      const updatedParticipants = rouletteParticipants.filter(p => p.id !== lastWinner.id);
      setRouletteParticipants(updatedParticipants);
      setLastWinner(null);

      socket.emit('sync_state', {
          game: 'ROULETTE_MODE',
          phase: 'ROULETTE_ACTIVE', 
          participants: updatedParticipants.map(p => p.name),
          spinning: false,
          winnerName: ""
      });
  };

  const closeRoulette = () => {
      if(spinning) return;
      setIsRouletteOpen(false);
      socket.emit('clear_state'); 
  };

  return (
    <div className="min-h-screen w-full bg-[#F0F7FF] font-sans text-slate-800 overflow-x-hidden flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-sky-100 w-full px-0">
        <div className="flex justify-between items-center py-4 px-6 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight text-nowrap uppercase">Amazon English</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-nowrap">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl">
                <MapPin size={16} className="text-slate-500 ml-2" />
                <select 
                    value={branch} 
                    onChange={(e) => setBranch(e.target.value)} 
                    className="bg-transparent text-sm font-black text-slate-700 uppercase tracking-widest outline-none cursor-pointer pl-2 pr-4 py-1 border-none"
                >
                    <option value="COCA">SEDE: COCA</option>
                    <option value="SACHA">SEDE: SACHA</option>
                </select>
            </div>

            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
              <LogOut size={16} /> <span className="hidden md:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 transition-all duration-500 ${isModalOpen || isLeaderboardOpen || isRouletteOpen ? 'blur-md scale-[0.98]' : ''} w-full`}>
        <div className="px-6 pt-8 pb-4 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Panel de Gestión</h2>
            <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Configuración general</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsRouletteOpen(true)} className="bg-amber-400 hover:bg-amber-300 text-amber-950 px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-amber-200 transition-all flex items-center gap-2">
              <Zap size={18} /> Roulette Custom
            </button>
            <button onClick={handleResetAllScores} className="bg-white hover:bg-red-50 text-red-500 border border-red-200 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center gap-2">
              <Trash2 size={18} /> <span className="hidden md:block">Reset All</span>
            </button>
            <button onClick={() => setIsLeaderboardOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 animate-pulse">
              <BarChart2 size={18} /> Live Scores
            </button>
          </div>
        </div>

        <div className="px-6 py-6 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {categories.map((cat) => (
              <div key={cat} onClick={() => openConfig(cat)} className="group bg-white rounded-[2.5rem] p-10 border border-white shadow-xl shadow-sky-100/50 hover:shadow-2xl hover:shadow-sky-200/60 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                    {categoryDetails[cat].icon && React.cloneElement(categoryDetails[cat].icon, { size: 32 })}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3 uppercase tracking-tighter">{cat}</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">{categoryDetails[cat].desc}</p>
                  <div className="flex items-center text-sky-500 font-black text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                    Configurar lista <ChevronRight size={18} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ================= RULETA MODAL MANUAL ================= */}
      {isRouletteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={closeRoulette}></div>
          <div className="relative bg-[#0f1115] w-full max-w-4xl rounded-[3rem] border-2 border-slate-800 shadow-[0_0_100px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col animate-in zoom-in duration-300">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/50"><Zap className="text-amber-950" size={24}/></div>
                    <div>
                      <h3 className="text-2xl font-black text-white uppercase tracking-widest">Custom Roulette</h3>
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em]">Híbrido: Combobox & Manual ({branch})</p>
                    </div>
                </div>
                <button onClick={closeRoulette} className="text-slate-500 hover:text-white transition-colors"><X size={32}/></button>
             </div>
             
             <div className="p-10 flex flex-col lg:flex-row gap-10 items-stretch">
                
                <div className="flex flex-col gap-4 w-full lg:w-2/5">
                   {/* COMBOBOX DE CATEGORÍAS */}
                   <div className="mb-2">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">1. Cargar Categoría (Opcional)</p>
                       <select 
                           value={rouletteCategory} 
                           onChange={(e) => setRouletteCategory(e.target.value)}
                           disabled={spinning}
                           className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all cursor-pointer"
                       >
                           <option value="MANUAL">✍️ SÓLO INGRESO MANUAL</option>
                           <option value="ALL">🌟 ALL CATEGORIES</option>
                           {categories.map(c => (
                               <option key={c} value={c}>{c}</option>
                           ))}
                       </select>
                   </div>

                   {/* FORMULARIO TEXTAREA */}
                   <form onSubmit={handleAddRouletteNames} className="flex flex-col gap-3 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Ingreso Manual (1 por línea)</p>
                      <textarea 
                         value={newRouletteNames} 
                         onChange={(e) => setNewRouletteNames(e.target.value)} 
                         placeholder="Ejemplo:&#10;Juan&#10;Alberto&#10;Juana" 
                         disabled={spinning}
                         className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-5 py-4 text-sm font-black uppercase tracking-widest outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 resize-none custom-scrollbar min-h-[120px]"
                      />
                      <button 
                         type="submit" 
                         disabled={spinning || !newRouletteNames.trim()} 
                         className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                       >
                         <Plus size={18} /> Agregar
                      </button>
                   </form>
                </div>

                {/* LISTA Y CONTROLES */}
                <div className="w-full lg:w-3/5 flex flex-col">
                    <div className="w-full bg-slate-900 border border-slate-800 rounded-[2rem] p-6 mb-6 flex-1 max-h-64 overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              Participants on the wheel:
                            </p>
                            <div className="flex items-center gap-3">
                                <span className="bg-slate-800 px-2 py-0.5 rounded text-white text-xs font-bold border border-slate-700">
                                  Total: {rouletteParticipants.length}
                                </span>
                                <button 
                                  onClick={handleClearRoulette} 
                                  disabled={spinning || rouletteParticipants.length === 0} 
                                  className="text-rose-500 hover:text-white hover:bg-rose-500 px-2 py-0.5 rounded border border-rose-500/50 transition-all text-[10px] uppercase font-black tracking-widest flex items-center gap-1 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-rose-500"
                                >
                                    <Trash2 size={12} /> Limpiar
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                            {rouletteParticipants.length > 0 ? rouletteParticipants.map((p) => {
                                const isWinner = lastWinner && p.id === lastWinner.id;
                                return (
                                  <div 
                                    key={p.id} 
                                    className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg border text-xs font-bold transition-all ${isWinner ? 'bg-amber-500 text-amber-950 border-amber-400 scale-110 shadow-lg shadow-amber-500/50' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                                  >
                                      <span>{p.name}</span>
                                      {!spinning && (
                                        <button 
                                          onClick={() => handleRemoveRouletteParticipant(p.id)}
                                          className="p-1 hover:bg-rose-500 hover:text-white text-slate-500 rounded-md transition-colors"
                                          title="Eliminar de la ruleta"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                  </div>
                                )
                            }) : (
                                <div className="w-full h-24 flex items-center justify-center text-slate-600 text-sm font-bold border-2 border-dashed border-slate-800 rounded-xl">
                                  Agrega participantes para empezar.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button 
                            onClick={spinRoulette} 
                            disabled={spinning || rouletteParticipants.length === 0}
                            className={`flex-1 py-4 rounded-xl font-black text-lg uppercase tracking-[0.2em] shadow-xl transition-all transform active:scale-95 ${spinning ? 'bg-slate-800 text-slate-500' : 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-amber-500/30'}`}
                        >
                            {spinning ? 'SPINNING...' : 'SPIN WHEEL'}
                        </button>

                        {!spinning && lastWinner && (
                            <button 
                                onClick={handleRemoveWinner}
                                className="bg-rose-500 text-white px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} /> Eliminar Ganador
                            </button>
                        )}
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURACIÓN DEL JUEGO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-100">
                  {activeCategory && categoryDetails[activeCategory]?.icon && React.cloneElement(categoryDetails[activeCategory].icon, { size: 28 })}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{activeCategory} - {branch}</h3>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Gestión de Participantes</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-red-50 text-slate-200 hover:text-red-500 rounded-full transition-colors">
                <X size={40} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-6">
                  
                  {activeCategory === "AMERICAN THINK STARTER" && (
                    <div className="bg-orange-50 border border-orange-200 p-6 rounded-[2rem] shadow-sm">
                      <h4 className="text-orange-800 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Users size={16} className="text-orange-500" /> Rondas Grupales
                      </h4>
                      <p className="text-xs text-orange-600 mb-3 font-bold">¿Cuántos grupos (turnos) habrá en la Ronda 2?</p>
                      <select 
                        value={numberOfGroups} 
                        onChange={(e) => setNumberOfGroups(Number(e.target.value))}
                        className="w-full bg-white border-2 border-orange-300 text-orange-900 rounded-xl px-4 py-3 outline-none font-black cursor-pointer shadow-sm focus:border-orange-500 transition-all"
                      >
                        <option value={1}>1 Grupo</option>
                        <option value={2}>2 Grupos</option>
                        <option value={3}>3 Grupos</option>
                        <option value={4}>4 Grupos</option>
                      </select>
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h4 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                      <Info size={16} className="text-sky-500" /> Detalles
                    </h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{categoryDetails[activeCategory]?.desc}</p>
                  </div>
                  
                  <button onClick={handleStartGame} className="w-full bg-sky-500 hover:bg-sky-600 text-white p-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 transform hover:-translate-y-1">
                    <Play size={24} fill="currentColor" /> INICIAR JUEGO
                  </button>
                </div>

                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Estudiantes</span>
                    
                    <div className="flex flex-wrap gap-3 items-center w-full md:w-auto justify-end">
                      <div className="relative flex items-center mr-2 shadow-sm rounded-xl">
                        <Search size={18} className="absolute left-3 text-slate-400" />
                        <input 
                          type="number"
                          placeholder="Buscar N°..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-black outline-none focus:border-sky-500 w-40 transition-all"
                        />
                      </div>

                      <button onClick={() => setAllStatus('absent')} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 uppercase tracking-tighter transition-all">Todos Ausentes</button>
                      <button onClick={() => setAllStatus('waiting')} className="text-[10px] font-black text-green-600 hover:bg-green-50 px-4 py-2.5 rounded-xl border border-green-100 uppercase tracking-tighter transition-all">Todos Presentes</button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-20 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                            <th className="px-8 py-5 text-left">N°</th>
                            <th className="px-8 py-5 text-left">Estudiante</th>
                            <th className="px-8 py-5 text-right">Confirmación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {participants
                            .filter(p => p.order_number?.toString().includes(searchQuery))
                            .map((p) => (
                            <tr key={p._id} className="group hover:bg-sky-50/30 transition-colors">
                              <td className="px-8 py-5 font-mono font-black text-sky-300 text-lg">#{p.order_number}</td>
                              <td className={`px-8 py-5 font-black text-sm uppercase tracking-tight ${p.status === 'absent' ? 'text-slate-200 line-through' : 'text-slate-700'}`}>
                                {p.name}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <button onClick={() => toggleStatus(p._id, p.status)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all ${p.status === 'waiting' ? 'bg-green-100 text-green-600 hover:bg-green-500 hover:text-white' : 'bg-red-50 text-red-400 hover:bg-red-500 hover:text-white'}`}>
                                  {p.status === 'waiting' ? 'PRESENTE' : 'AUSENTE'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD GLOBAL */}
      {isLeaderboardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setIsLeaderboardOpen(false)}></div>
          <div className="relative bg-[#0f1115] border border-slate-800 w-full max-w-6xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#1a1d24]">
              <div className="flex items-center gap-4">
                <BarChart2 className="text-emerald-400 animate-pulse" size={32} />
                <div>
                  <h3 className="text-2xl font-black text-white uppercase tracking-widest">Live Leaderboard</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monitoring all categories • {branch}</p>
                </div>
              </div>
              <button onClick={() => setIsLeaderboardOpen(false)} className="text-slate-400 hover:text-white"><X size={32} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.filter(c => c !== "ALL").map(cat => {
                    const catParts = liveParticipants.filter(p => p.category === cat.toUpperCase())
                        .sort((a,b) => calcTotalGlobal(b.scoresObj) - calcTotalGlobal(a.scoresObj));

                    if(catParts.length === 0) return null;

                    return (
                        <div key={cat} className="bg-slate-900 rounded-3xl border border-slate-800 p-5">
                          <h3 className="font-black text-slate-300 uppercase tracking-widest text-xs mb-4 border-b border-slate-800 pb-2">{cat}</h3>
                          <div className="space-y-2">
                              {catParts.slice(0, 10).map((p, idx) => (
                                  <div key={p._id} className="flex justify-between items-center bg-[#1a1d24] p-3 rounded-xl border border-slate-800">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <span className="font-black text-xs text-amber-500">#{idx+1}</span>
                                        <span className="font-bold text-xs text-slate-200 truncate">{p.name}</span>
                                    </div>
                                    <span className="font-black text-sm bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/30">
                                        {calcTotalGlobal(p.scoresObj)}
                                    </span>
                                  </div>
                              ))}
                          </div>
                        </div>
                    )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;