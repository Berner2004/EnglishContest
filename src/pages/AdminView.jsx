import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Play, Settings, Info, Award, Loader2, X, 
  ChevronRight, BookOpen, Trophy, LogOut, MapPin, Trash2, BarChart2
} from 'lucide-react';
import { io } from 'socket.io-client';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';
const socket = io(API_BASE_URL);

const AdminView = () => {
  const navigate = useNavigate();
  
  // ESTADOS
  const [activeCategory, setActiveCategory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NUEVOS ESTADOS
  const [branch, setBranch] = useState('COCA'); // Selector COCA / SACHA
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [liveParticipants, setLiveParticipants] = useState([]);

  // Configuración de categorías
  const categoryDetails = {
    "LITTLE STEPS": { desc: "Nivel inicial (4-5 años). Enfoque en reconocimiento visual.", icon: <Users />, route: '/juego/little-steps' },
    "POWER UP 1": { desc: "Nivel inicial. Enfoque en vocabulario básico y deletreo.", icon: <BookOpen />, route: '/juego/power-up-1' },
    "POWER UP 3": { desc: "Nivel intermedio. Estructuras gramaticales y fluidez.", icon: <Award />, route: '/juego/power-up-3' },
    "AMERICAN THINK STARTER": { desc: "Nivel A1. Pensamiento crítico y vocabulario.", icon: <Settings />, route: '/juego/american-think' },
    "KIDS BOX": { desc: "Nivel Primaria. Colores, objetos y gramática inicial.", icon: <Info />, route: '/juego/kids-box' },
    "GRAND FINAL": { desc: "Competencia de élite. Incluye a los clasificados.", icon: <Trophy />, route: '/juego/grand-final' }
  };

  const categories = Object.keys(categoryDetails);

  useEffect(() => {
    document.body.style.backgroundColor = '#F0F7FF';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  // MOTOR DE PUNTAJES EN TIEMPO REAL PARA EL ADMIN
  const fetchGlobalScores = useCallback(async () => {
    try {
      const [partsRes, scoresRes] = await Promise.all([
        fetch(`${API_BASE_URL}/participants/ALL?branch=${branch}`),
        fetch(`${API_BASE_URL}/api/scores/ALL?branch=${branch}`)
      ]);
      const partsData = await partsRes.json();
      const scoresData = await scoresRes.json();

      const merged = partsData.map(p => {
        const pScore = scoresData.find(s => s.participant_id === p._id);
        return { ...p, scoresObj: pScore?.scores || {} };
      });
      setLiveParticipants(merged);
    } catch (error) {
      console.error("Error cargando puntajes globales:", error);
    }
  }, [branch]);

  // Escuchar a los jueces en tiempo real
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

  // CARGAR ESTUDIANTES PARA EL JUEGO
  const openConfig = async (categoryName) => {
    setLoading(true);
    setActiveCategory(categoryName);
    setIsModalOpen(true);
    
    try {
      if (categoryName === "GRAND FINAL") {
        const finalCategories = ["AMERICAN THINK STARTER"];
        const requests = finalCategories.map(cat => 
          axios.get(`${API_BASE_URL}/participants/${encodeURIComponent(cat)}?branch=${branch}`)
        );
        const responses = await Promise.all(requests);
        const allParticipants = responses.flatMap(res => res.data);
        const sortedData = allParticipants.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sortedData);
      } else {
        const response = await axios.get(`${API_BASE_URL}/participants/${encodeURIComponent(categoryName)}?branch=${branch}`);
        const sortedData = response.data.sort((a, b) => a.order_number - b.order_number);
        setParticipants(sortedData);
      }
    } catch (error) {
      console.error("Error cargando participantes:", error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveCategory(null);
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
    navigate(targetRoute, { state: { participants: presentOnes } });
  };

  // REINICIAR VOTACIONES GLOBALES (TODOS LOS CONCURSOS)
  const handleResetAllScores = async () => {
    const confirm1 = window.confirm(`⚠️ PELIGRO EXTREMO: Estás a punto de ELIMINAR LOS PUNTAJES DE TODOS LOS CONCURSOS. Esta acción NO se puede deshacer. ¿Estás absolutamente seguro?`);
    if (!confirm1) return;

    const confirm2 = window.confirm(`⚠️ ÚLTIMA ADVERTENCIA: ¿Confirmas que deseas BORRAR TODOS LOS DATOS de calificación?`);
    if (!confirm2) return;

    try {
      // Enviamos la petición a /api/scores/ALL
      await axios.delete(`${API_BASE_URL}/api/scores/ALL?branch=${branch}`);
      alert("Todas las votaciones de todos los concursos han sido reiniciadas a cero.");
      socket.emit('sync_state', { action: 'score_updated' }); // Avisar a los jueces
      if (isLeaderboardOpen) fetchGlobalScores();
    } catch (error) {
      alert("Error al reiniciar votaciones. Asegúrate de que el backend tenga el endpoint configurado.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/login');
  };

  // Cálculos de suma total para el Leaderboard
  const calculateGrandTotal = (scoresObj) => {
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
            
            {/* SELECTOR DE SEDE COCA/SACHA */}
            <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
              <button 
                onClick={() => setBranch('COCA')}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${branch === 'COCA' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MapPin size={12} /> Coca
              </button>
              <button 
                onClick={() => setBranch('SACHA')}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${branch === 'SACHA' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <MapPin size={12} /> Sacha
              </button>
            </div>
            
            <button onClick={handleLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-widest">
              <LogOut size={16} /> <span className="hidden md:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className={`flex-1 transition-all duration-500 ${isModalOpen || isLeaderboardOpen ? 'blur-md scale-[0.98]' : ''} w-full`}>
        <div className="px-6 pt-8 pb-4 max-w-[1600px] mx-auto w-full flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Panel de Gestión</h2>
            <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Configuración para sede: <span className="text-sky-500 font-bold">{branch}</span></p>
          </div>

          {/* BOTONES GLOBALES: REINICIAR TODO Y LIVE SCORES */}
          <div className="flex items-center gap-4">
            <button 
              onClick={handleResetAllScores}
              className="bg-white hover:bg-red-50 text-red-500 border border-red-200 px-5 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-sm transition-all flex items-center gap-2"
            >
              <Trash2 size={18} /> <span className="hidden md:block">Reset All</span>
            </button>

            <button 
              onClick={() => setIsLeaderboardOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 animate-pulse"
            >
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
                    {React.cloneElement(categoryDetails[cat].icon, { size: 32 })}
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

      {/* ================= MODAL DE LISTA DE ESTUDIANTES ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={closeModal}></div>
          <div className="relative bg-white w-full max-w-5xl max-h-[92vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <div className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-100">
                  {React.cloneElement(categoryDetails[activeCategory]?.icon, { size: 28 })}
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
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <h4 className="text-slate-800 font-black text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Info size={16} className="text-sky-500" /> Detalles
                    </h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed">{categoryDetails[activeCategory]?.desc}</p>
                  </div>
                  
                  <button onClick={handleStartGame} className="w-full bg-sky-500 hover:bg-sky-600 text-white p-6 rounded-[2rem] font-black text-lg flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 transform hover:-translate-y-1">
                    <Play size={24} fill="currentColor" /> INICIAR JUEGO
                  </button>
                </div>

                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lista de Estudiantes</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAllStatus('absent')} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-tighter transition-all">Todos Ausentes</button>
                      <button onClick={() => setAllStatus('waiting')} className="text-[10px] font-black text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-tighter transition-all">Todos Presentes</button>
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
                          {participants.map((p) => (
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

      {/* ================= MODAL LIVE LEADERBOARD ================= */}
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
                        .sort((a,b) => calculateGrandTotal(b.scoresObj) - calculateGrandTotal(a.scoresObj));

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
                                        {calculateGrandTotal(p.scoresObj)}
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