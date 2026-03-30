import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Award, User } from 'lucide-react';

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 1. URL DINÁMICA: Asegúrate de configurar VITE_API_URL en las variables de entorno de Vercel
  // Línea 14: Solo la base, sin el /api/login al final
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://concursoengllish.onrender.com';;

  // Limpiar sesión vieja al cargar el Login
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username: username.trim(), 
            password: password.trim() 
        })
      });

      // Validar si la respuesta es JSON antes de procesar
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("El servidor no respondió con JSON. Verifica el Backend.");
      }

      const data = await response.json();

      if (response.ok) {
        // Guardar datos de sesión
        localStorage.setItem('username', data.username);
        
        if (data.rol === 'admin') {
          localStorage.setItem('isAdminAuth', 'true');
          navigate('/admin');
        } else {
          localStorage.setItem('isJudgeAuth', 'true');
          navigate('/juez'); 
        }
      } else {
        // El backend envió un error (401, 404, etc)
        setError(data.detail || 'Credenciales incorrectas');
        setPassword('');
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setError('Error de conexión. Verifica que el servidor de Render esté despierto.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 p-8 md:p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300">
        
        <div className="text-center mb-10">
          <Award size={64} className="text-sky-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
          <h1 className="text-3xl font-black text-white uppercase tracking-tight italic">Amazon English</h1>
          <p className="text-sky-400 font-bold tracking-[0.3em] uppercase text-sm mt-3">Control Panel</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-3">
            <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
              Username
            </label>
            <div className="relative">
              <User size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 text-white rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:border-sky-500 transition-all font-mono text-lg"
                placeholder="admin"
                autoFocus
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-slate-400 font-black uppercase tracking-widest text-[10px] ml-1">
              Password
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 text-white rounded-2xl py-4 pl-14 pr-4 focus:outline-none focus:border-sky-500 transition-all font-mono text-xl tracking-widest placeholder:tracking-normal placeholder:text-slate-700"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl mt-2 animate-pulse">
                <p className="text-red-500 text-xs font-bold text-center">{error}</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-sky-500 hover:bg-sky-400 text-white font-black text-xl uppercase tracking-widest py-4 rounded-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Shield size={24} />
            {isLoading ? 'Checking...' : 'Access System'}
          </button>
        </form>
      </div>
      
      <p className="mt-8 text-slate-600 text-[10px] uppercase font-black tracking-widest">
        Connected to: <span className="text-slate-400">{API_BASE_URL.replace('https://', '')}</span>
      </p>
    </div>
  );
};

export default LoginView;