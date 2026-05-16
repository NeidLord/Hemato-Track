// src/pages/Login.jsx
import React, { useState } from 'react';

function Login({ onLogin }) {
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (usuario === 'admin' && password === 'secreto123') {
            onLogin();
        } else {
            setError('Credenciales incorrectas. Acceso denegado.');
        }
    };

    return (
        <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-med-blue to-blue-900 flex items-center justify-center p-4 font-sans">
            
            {/* Capa de los Panales cubriendo toda la pantalla */}
            <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
            {/* Cambiado el padding de p-8 a p-6 sm:p-8 */}
            <div className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">

                <div className="text-center mb-6 sm:mb-8">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <span className="text-2xl sm:text-3xl">🛡️</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Acceso Restringido</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Sistema de Gestión Hemoterapéutica (LIMS)
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Usuario</label>
                        <input type="text" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Ej. admin" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue focus:border-transparent transition-all text-sm sm:text-base" required />
                    </div>

                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue focus:border-transparent transition-all text-sm sm:text-base" required />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 text-xs sm:text-sm p-3 rounded-lg border border-red-100 text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="w-full bg-med-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer mt-2 text-sm sm:text-base">
                        Iniciar Sesión
                    </button>
                </form>

            </div>
        </div>
    );
}

export default Login;