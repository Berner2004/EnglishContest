import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Play, Settings, Info, Award, Loader2, X, 
  ChevronRight, BookOpen, CheckCircle, XCircle, Trophy 
} from 'lucide-react';

const AdminView = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Configuración de categorías incluyendo la lógica especial de GRAND FINAL
  const categoryDetails = {
    "LITTLE STEPS": { 
      desc: "Nivel inicial (4-5 años). Enfoque en reconocimiento visual y participación familiar.", 
      icon: <Users />,
      route: '/juego/little-steps' 
    },
    "POWER UP 1": { 
      desc: "Nivel inicial. Enfoque en vocabulario básico y deletreo.", 
      icon: <BookOpen />,
      route: '/juego/power-up-1'
    },
    "POWER UP 3": { 
      desc: "Nivel intermedio. Estructuras gramaticales y fluidez.", 
      icon: <Award />,
      route: '/juego/power-up-3'
    },
    "AMERICAN THINK STARTER": { 
      desc: "Nivel A1. Pensamiento crítico y vocabulario académico.", 
      icon: <Settings />,
      route: '/juego/american-think'
    },
    "KID´S BOX": { 
      desc: "Nivel Primaria. Colores, objetos y gramática inicial.", 
      icon: <Info />,
      route: '/juego/kids-box'
    },
    "GRAND FINAL": { 
      desc: "Competencia de élite. Incluye a los clasificados de Power Up 1, 3 y American Think.", 
      icon: <Trophy />,
      route: '/juego/grand-final'
    }
  };

  const categories = Object.keys(categoryDetails);

  useEffect(() => {
    document.body.style.backgroundColor = '#F0F7FF';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const openConfig = async (categoryName) => {
    setLoading(true);
    setActiveCategory(categoryName);
    setIsModalOpen(true);
    
    try {
      if (categoryName === "GRAND FINAL") {
        const finalCategories = [ "AMERICAN THINK STARTER"];
        const requests = finalCategories.map(cat => 
          axios.get(`https://concursoengllish.onrender.com/participants/${encodeURIComponent(cat)}`)
        );
        const responses = await Promise.all(requests);
        const allParticipants = responses.flatMap(res => res.data);
        const sortedData = allParticipants.sort((a, b) => a.name.localeCompare(b.name));
        setParticipants(sortedData);
      } else {
        const response = await axios.get(`https://concursoengllish.onrender.com/participants/${encodeURIComponent(categoryName)}`);
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
    setParticipants(participants.map(p => 
      p._id === id ? { ...p, status: newStatus } : p
    ));
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

  return (
    <div className="min-h-screen w-full bg-[#F0F7FF] font-sans text-slate-800 overflow-x-hidden">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-sky-100 w-full px-0">
        <div className="flex justify-between items-center py-5 px-6 max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-sky-200">
              <Award size={24} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight text-nowrap uppercase">Amazon English Academy</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-nowrap">Dashboard de Control</p>
            </div>
          </div>
          <div className="bg-sky-50 px-4 py-2 rounded-full border border-sky-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-sky-600 uppercase tracking-tighter">Sistema de Concurso Online</span>
          </div>
        </div>
      </header>

      <main className={`transition-all duration-500 ${isModalOpen ? 'blur-md scale-[0.98]' : ''} w-full`}>
        <div className="px-6 pt-8 pb-4 max-w-[1600px] mx-auto w-full text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Panel de Gestión</h2>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-[0.2em]">Selecciona el nivel para configurar la ronda</p>
        </div>

        <div className="px-6 py-10 max-w-[1600px] mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {categories.map((cat) => (
              <div 
                key={cat}
                onClick={() => openConfig(cat)}
                className="group bg-white rounded-[2.5rem] p-10 border border-white shadow-xl shadow-sky-100/50 hover:shadow-2xl hover:shadow-sky-200/60 hover:-translate-y-2 transition-all cursor-pointer relative overflow-hidden"
              >
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
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">{activeCategory}</h3>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Gestión de Participantes</p>
                </div>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-red-50 text-slate-200 hover:text-red-500 rounded-full transition-colors">
                <X size={40} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 space-y-8">
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
                      <button onClick={() => setAllStatus('absent')} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 uppercase tracking-tighter transition-all">Marcar Todos Ausentes</button>
                      <button onClick={() => setAllStatus('waiting')} className="text-[10px] font-black text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 uppercase tracking-tighter transition-all">Marcar Todos Presentes</button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    {loading ? (
                      <div className="p-20 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-sky-500 mb-4" size={48} />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sincronizando...</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                            <th className="px-8 py-5 text-left">N°</th>
                            {activeCategory === "GRAND FINAL" && <th className="px-8 py-5 text-left">Categoría</th>}
                            <th className="px-8 py-5 text-left">Estudiante</th>
                            <th className="px-8 py-5 text-right">Confirmación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {participants.map((p) => (
                            <tr key={p._id} className="group hover:bg-sky-50/30 transition-colors">
                              <td className="px-8 py-5 font-mono font-black text-sky-300 text-lg">#{p.order_number}</td>
                              {activeCategory === "GRAND FINAL" && (
                                <td className="px-8 py-5 font-bold text-slate-400 text-[10px] uppercase">{p.category}</td>
                              )}
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

      <footer className="w-full py-10 text-center bg-white/50 border-t border-sky-100 mt-auto">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Amazon English Academy &copy; 2026 | AEA Cloud</p>
      </footer>
    </div>
  );
};

export default AdminView;