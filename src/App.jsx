// src/App.jsx
import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import BuscarDonante from './Pages/BuscarDonante';
import Login from './Pages/Login';
import RegistrarDonante from './Pages/RegistrarDonante';
import CargarSerologia from './Pages/CargarSerologia';
import NotificarDonantes from './Pages/NotificarDonantes';
import PanelAdmin from './Pages/PanelAdmin';
import Ajustes from './Pages/Ajustes';
import "./index.css"
import "./App.css"

function Inicio({ usuarioLogeado, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12 flex flex-col">

      {/* 1. Fondo Superior (Hero Background) - Añadido "relative overflow-hidden" */}
      <div className="relative overflow-hidden bg-gradient-to-br from-med-blue to-blue-900 pb-28 sm:pb-36 pt-6 sm:pt-8 px-4 sm:px-6">

        {/* --- CAPA DEL PANAL DE FONDO --- */}
        <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* Header Superior - Limpio */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 border-b border-blue-800/50 pb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-white/10 p-2 sm:p-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-inner">
                <span className="text-2xl sm:text-3xl">🩸</span>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                  Sistema <span className="font-light text-blue-200">Hemotransf</span>
                </h1>
                <p className="text-xs sm:text-sm text-blue-300 font-bold uppercase mt-0.5">
                  {usuarioLogeado?.banco} • LIC. {usuarioLogeado?.nombre}
                </p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full sm:w-auto justify-center text-sm font-bold text-blue-200 hover:text-white bg-blue-800/40 hover:bg-white/10 px-4 py-3 sm:py-2 rounded-xl transition-all border border-blue-700 sm:border-transparent flex items-center gap-2 cursor-pointer"
            >
              <span>Salir del Sistema</span> 🚪
            </button>
          </header>

          {/* Mensaje de Bienvenida */}
          <div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Panel de Control</h2>
            <p className="text-blue-100 sm:text-blue-200 text-base sm:text-lg max-w-xl">
              Gestión operativa del banco de sangre. Seleccione un módulo para continuar con sus tareas de hoy.
            </p>
          </div>

        </div>
      </div>

      {/* 2. Cuadrícula de Opciones */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Módulo 1: Buscar/Registrar */}
          <div
            onClick={() => navigate('/buscar')}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:border-med-blue hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 text-med-blue rounded-xl flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-med-blue group-hover:text-white transition-colors shadow-sm">
                🔍
              </div>
              <span className="text-slate-300 group-hover:text-med-blue transition-colors">➔</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-slate-800">Buscar Donante</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Validar tiempos de reposición (3/4 meses), buscar historial por cédula y registrar nuevas extracciones.</p>
          </div>

          {/* Módulo 2: Carga Serológica */}
          <div
            onClick={() => navigate('/serologias')}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:border-med-accent hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-rose-50 text-med-accent rounded-xl flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-med-accent group-hover:text-white transition-colors shadow-sm">
                🧪
              </div>
              <span className="text-slate-300 group-hover:text-med-accent transition-colors">➔</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-slate-800">Grupo Sanguineo y Serologías</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Cargar resultados de laboratorio (VIH, Sífilis, Chagas) y asignar grupos sanguíneos al inventario.</p>
          </div>

          {/* Módulo 3: Mensajería */}
          <div
            onClick={() => navigate('/notificar')}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:border-emerald-500 hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-sm">
                ✉️
              </div>
              <span className="text-slate-300 group-hover:text-emerald-500 transition-colors">➔</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-slate-800">Notificar Donantes</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Gestionar alertas automáticas y recordatorios para donantes que ya cumplieron su periodo de ventana.</p>
          </div>

          {/* Módulo 4: Ajustes e Historial */}
          <div
            onClick={() => navigate('/ajustes')}
            className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl hover:border-slate-600 hover:-translate-y-1 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-slate-600 group-hover:text-white transition-colors shadow-sm">
                ⚙️
              </div>
              <span className="text-slate-300 group-hover:text-slate-600 transition-colors">➔</span>
            </div>
            <h3 className="font-bold text-lg sm:text-xl mb-2 text-slate-800">Ajustes del Sistema</h3>
            <p className="text-slate-500 text-sm leading-relaxed">Gestión de roles de usuario, accesos administrativos y configuración general de la plataforma.</p>
          </div>

        </div>
      </div>

      

    </div>
  );
}

function RutaProtegida({ usuario, children }) {
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [usuarioLogeado, setUsuarioLogeado] = useState(() => {
    try {
      const data = localStorage.getItem('lims_auth_user');
      if (data === "undefined") {
        localStorage.removeItem('lims_auth_user');
        return null;
      }
      return data ? JSON.parse(data) : null;
    } catch (error) {
      localStorage.removeItem('lims_auth_user');
      return null;
    }
  });

  const handleLogin = (userData) => {
    localStorage.setItem('lims_auth_user', JSON.stringify(userData));
    setUsuarioLogeado(userData);
  };
  const handleLogout = () => {
    localStorage.removeItem('lims_auth_user');
    setUsuarioLogeado(null);
  };

  return (
    <Routes>
      <Route path="/login" element={usuarioLogeado ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />

      {/* AQUÍ ESTÁ LA MAGIA CORREGIDA */}
      {/* LA RUTA RAIZ DECIDE: Si las iniciales son ADMIN, muestra Panel Maestro. Para todos los demás (incluyendo admins normales), muestra el Inicio */}
      <Route path="/" element={<RutaProtegida usuario={usuarioLogeado}>
        {usuarioLogeado?.iniciales === 'ADMIN'
          ? <PanelAdmin usuarioAdmin={usuarioLogeado} onLogout={handleLogout} />
          : <Inicio usuarioLogeado={usuarioLogeado} onLogout={handleLogout} />
        }
      </RutaProtegida>} />

      <Route path="/buscar" element={<RutaProtegida usuario={usuarioLogeado}><BuscarDonante usuarioLogeado={usuarioLogeado} /></RutaProtegida>} />
      <Route path="/registrar" element={<RutaProtegida usuario={usuarioLogeado}><RegistrarDonante /></RutaProtegida>} />
      <Route path="/serologias" element={<RutaProtegida usuario={usuarioLogeado}><CargarSerologia /></RutaProtegida>} />
      <Route path="/notificar" element={<RutaProtegida usuario={usuarioLogeado}><NotificarDonantes /></RutaProtegida>} />
      <Route path="/ajustes" element={<RutaProtegida usuario={usuarioLogeado}><Ajustes /></RutaProtegida>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;