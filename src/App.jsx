import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de las vistas
import AdminView from './pages/AdminView';
import LittleStepsGame from './pages/LittleStepsGame';
import KidsBoxGame from './pages/KidsBoxGame';
import PowerUp1Game from './pages/PowerUp1Game';
import PowerUp3Game from './pages/PowerUp3Game';
import AmericanThinkGame from './pages/AmericanThinkGame';
import GrandFinalView from './pages/GrandFinalView'; 
import PublicView from './pages/PublicView';
import LoginView from './pages/LoginView';
import JudgesView from './pages/JudgeView'; // <-- Asegúrate de que el archivo físico se llame exactamente "JudgeView.jsx"

// COMPONENTE GUARDIÁN: Protege las rutas del administrador
const ProtectedRoute = ({ children }) => {
  // AHORA USA sessionStorage
  const isAuthenticated = sessionStorage.getItem('isAdminAuth') === 'true';
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// COMPONENTE GUARDIÁN: Protege las rutas exclusivas de los jueces
const ProtectedJudgeRoute = ({ children }) => {
  // AHORA USA sessionStorage
  const isJudgeAuthenticated = sessionStorage.getItem('isJudgeAuth') === 'true';
  
  if (!isJudgeAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        
        {/* RUTAS PÚBLICAS */}
        <Route path="/publico" element={<PublicView />} /> 
        <Route path="/login" element={<LoginView />} />
        
        {/* RUTAS PROTEGIDAS PARA EL ADMINISTRADOR */}
        <Route path="/admin" element={<ProtectedRoute><AdminView /></ProtectedRoute>} />
        <Route path="/juego/little-steps" element={<ProtectedRoute><LittleStepsGame /></ProtectedRoute>} />
        <Route path="/juego/kids-box" element={<ProtectedRoute><KidsBoxGame /></ProtectedRoute>} />
        <Route path="/juego/power-up-1" element={<ProtectedRoute><PowerUp1Game /></ProtectedRoute>} />
        <Route path="/juego/power-up-3" element={<ProtectedRoute><PowerUp3Game /></ProtectedRoute>} />
        <Route path="/juego/american-think" element={<ProtectedRoute><AmericanThinkGame /></ProtectedRoute>} />
        <Route path="/juego/grand-final" element={<ProtectedRoute><GrandFinalView /></ProtectedRoute>} />
        
        {/* RUTAS PROTEGIDAS PARA LOS JUECES */}
        <Route path="/juez" element={<ProtectedJudgeRoute><JudgesView /></ProtectedJudgeRoute>} />
        
        {/* REDIRECCIÓN PRINCIPAL */}
        <Route path="/" element={<Navigate to="/publico" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;