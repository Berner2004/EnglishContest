import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Play, Settings, Award, X, Clock, CheckCircle, BookOpen, Star
} from 'lucide-react';

const AdminView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- CONFIGURACIÓN DE TIEMPOS DINÁMICOS ---
  const [gameSettings, setGameSettings] = useState({
    idTime: 4,       // Segundos por imagen en Identificación
    speedTime: 30,   // Segundos totales en Rapidez
    memTime1: 4,     // Segundos Nivel 1 Memoria
    memTime2: 5,     // Segundos Nivel 2 Memoria
    memTime3: 6      // Segundos Nivel 3 Memoria
  });

  const categories = [
    { name: "LITTLE STEPS", icon: <Users />, route: '/juego/little-steps' },
    { name: "KID´S BOX", icon: <Star />, route: '/juego/kids-box' },
    { name: "POWER UP 1", icon: <BookOpen />, route: '/juego/power-up-1' },
    { name: "AMERICAN THINK", icon: <Settings />, route: '/juego/american-think' }
  ];

  const openConfig = async (category) => {
    setLoading(true);
    setActiveCategory(category);
    setIsModalOpen(true);
    try {
      const response = await axios.get(`http://localhost:8000/participants/${encodeURIComponent(category.name)}`);
      setParticipants(response.data.sort((a, b) => a.order_number - b.order_number));
    } catch (error) {
      console.error("Error al cargar participantes:", error);
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = (id) => {
    setParticipants(participants.map(p => 
      p._id === id ? { ...p, status: p.status === 'waiting' ? 'absent' : 'waiting' } : p
    ));
  };

  const handleStartGame = () => {
    const presentOnes = participants.filter(p => p.status === 'waiting');
    if (presentOnes.length === 0) return alert("Debe haber al menos un participante presente.");
    
    navigate(activeCategory.route, { 
      state: { 
        participants: presentOnes,
        settings: gameSettings 
      } 
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* HEADER ULTRA SLIM */}
      <header className="bg-white border-b border-slate-200 py-2 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Award size={18} />
            </div>
            <h1 className="text-sm font-black tracking-tighter">AMAZON <span className="text-sky-500">ENGLISH</span> ACADEMY</h1>
          </div>
          <div className="bg-sky-50 px-3 py-1 rounded-full border border-sky-100 flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-sky-600 uppercase tracking-widest">Control Panel</span>
          </div>
        </div>
      </header>

      <main className={`p-8 max-w-7xl mx-auto transition-all ${isModalOpen ? 'blur-md' : ''}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <div 
              key={cat.name}
              onClick={() => openConfig(cat)}
              className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
            >
              <div className="w-12 h-12 bg-slate-50 text-sky-500 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-sky-500 group-hover:text-white transition-all">
                {cat.icon}
              </div>
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">{cat.name}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Configurar Juego</p>
            </div>
          ))}
        </div>
      </main>

      {/* MODAL DE CONFIGURACIÓN Y TIEMPOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-sky-500 text-white rounded-xl font-black text-xs tracking-widest uppercase">
                  {activeCategory?.name}
                </div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Configuración de Ronda</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-red-500 transition-colors">
                <X size={32} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex flex-col lg:flex-row gap-8">
              
              {/* IZQUIERDA: CONFIGURACIÓN DE TIEMPOS (SETTINGS) */}
              <div className="flex-1 space-y-6">
                <div className="bg-sky-50/50 border border-sky-100 p-6 rounded-[2.5rem]">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="text-sky-500" size={20} />
                    <h4 className="text-sky-900 font-black text-xs uppercase tracking-widest">Ajustar Tiempos (Segundos)</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">ID Imagen (R1)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-sky-200 p-3 rounded-xl font-bold text-center"
                        value={gameSettings.idTime}
                        onChange={(e) => setGameSettings({...gameSettings, idTime: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rapidez Total (R1)</label>
                      <input 
                        type="number" 
                        className="w-full bg-white border border-sky-200 p-3 rounded-xl font-bold text-center"
                        value={gameSettings.speedTime}
                        onChange={(e) => setGameSettings({...gameSettings, speedTime: parseInt(e.target.value)})}
                      />
                    </div>
                    
                    <div className="col-span-2 pt-4 border-t border-sky-100">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">Observación Memoria (Nivel 1 / 2 / 3)</label>
                      <div className="flex gap-3">
                        <input type="number" value={gameSettings.memTime1} onChange={(e)=>setGameSettings({...gameSettings, memTime1: parseInt(e.target.value)})} className="flex-1 bg-white border border-sky-200 p-3 rounded-xl font-bold text-center" />
                        <input type="number" value={gameSettings.memTime2} onChange={(e)=>setGameSettings({...gameSettings, memTime2: parseInt(e.target.value)})} className="flex-1 bg-white border border-sky-200 p-3 rounded-xl font-bold text-center" />
                        <input type="number" value={gameSettings.memTime3} onChange={(e)=>setGameSettings({...gameSettings, memTime3: parseInt(e.target.value)})} className="flex-1 bg-white border border-sky-200 p-3 rounded-xl font-bold text-center" />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleStartGame}
                  className="w-full bg-slate-900 hover:bg-sky-600 text-white p-6 rounded-2xl font-black text-lg flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95"
                >
                  <Play size={24} fill="currentColor" /> INICIAR JUEGO EN PROYECTOR
                </button>
              </div>

              {/* DERECHA: ASISTENCIA */}
              <div className="w-full lg:w-80 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-white">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle size={14} /> Lista de Asistencia
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {participants.map((p) => (
                    <div 
                      key={p._id} 
                      onClick={() => toggleStatus(p._id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                        p.status === 'waiting' 
                        ? 'bg-white border-slate-200' 
                        : 'bg-slate-100 border-transparent opacity-50'
                      }`}
                    >
                      <span className="text-xs font-black uppercase tracking-tighter">
                        {p.order_number}. {p.name}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${p.status === 'waiting' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;