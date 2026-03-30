import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importación de las vistas
import AdminView from './pages/AdminView';
import LittleStepsGame from './pages/LittleStepsGame';
import KidsBoxGame from './pages/KidsBoxGame';
import PowerUp1Game from './pages/PowerUp1Game';
import PowerUp3Game from './pages/PowerUp3Game';
import AmericanThinkGame from './pages/AmericanThinkGame';
import GrandFinalView from './pages/GrandFinalView'; // <-- Nueva importación
import PublicView from './pages/PublicView';
import LoginView from './pages/LoginView';

// COMPONENTE GUARDIÁN: Protege las rutas del administrador
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAdminAuth') === 'true';
  
  if (!isAuthenticated) {
    // Si no está logueado, lo mandamos a que ponga la contraseña
    return <Navigate to="/login" replace />;
  }
  
  // Si está logueado, le permitimos ver el componente
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        
        {/* RUTAS PÚBLICAS */}
        <Route path="/publico" element={<PublicView />} /> 
        <Route path="/login" element={<LoginView />} />
        
        {/* RUTAS PROTEGIDAS (Requieren contraseña) */}
        <Route path="/admin" element={<ProtectedRoute><AdminView /></ProtectedRoute>} />
        <Route path="/juego/little-steps" element={<ProtectedRoute><LittleStepsGame /></ProtectedRoute>} />
        <Route path="/juego/kids-box" element={<ProtectedRoute><KidsBoxGame /></ProtectedRoute>} />
        <Route path="/juego/power-up-1" element={<ProtectedRoute><PowerUp1Game /></ProtectedRoute>} />
        <Route path="/juego/power-up-3" element={<ProtectedRoute><PowerUp3Game /></ProtectedRoute>} />
        <Route path="/juego/american-think" element={<ProtectedRoute><AmericanThinkGame /></ProtectedRoute>} />
        
        {/* NUEVA RUTA: GRAND FINAL */}
        <Route path="/juego/grand-final" element={<ProtectedRoute><GrandFinalView /></ProtectedRoute>} />
        
        {/* REDIRECCIÓN PRINCIPAL: Si alguien entra a "localhost:5173", va directo a la pantalla gigante */}
        <Route path="/" element={<Navigate to="/publico" replace />} />
        
      </Routes>
    </Router>
  );
}

export default App;