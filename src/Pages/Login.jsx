// src/Pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { obtenerUsuarios } from '../utils/data';

function Login({ onLogin }) {
    const [rol, setRol] = useState('usuario');
    
    // Debe coincidir exacto con la base de datos
    const [banco, setBanco] = useState('Banco de Sangre Dr. Loranzo Hands');
    
    const [iniciales, setIniciales] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        setError('');
        setIniciales('');
        setPassword('');
    }, [rol]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('Conectando a la base de datos...'); 

        const usuarios = await obtenerUsuarios();
        let usuarioValido = null;

        if (rol === 'admin') {
            // PESTAÑA ADMIN: Solo deja entrar al director (cuenta con iniciales 'ADMIN')
            usuarioValido = usuarios.find(u => u.banco === banco && u.iniciales === 'ADMIN' && u.password === password);
        } else {
            // PESTAÑA LICENCIADO: Deja entrar a cualquier licenciado, tenga rol 'admin' o 'usuario'
            usuarioValido = usuarios.find(u => u.banco === banco && u.iniciales.toLowerCase() === iniciales.toLowerCase() && u.password === password);
        }

        if (usuarioValido) {
            onLogin(usuarioValido);
        } else {
            setError('Credenciales incorrectas o acceso denegado.');
        }
    };

    return (
        <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-med-blue to-blue-900 flex items-center justify-center p-4 font-sans">
            <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>

            <div className="relative z-10 bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100">
                <div className="text-center mb-6">
                    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">🛡️</span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sistema Hemotransf</h1>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
                    <button type="button" onClick={() => setRol('usuario')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${rol === 'usuario' ? 'bg-white text-med-blue shadow-sm' : 'text-slate-500 cursor-pointer'}`}>👨‍⚕️ Licenciado</button>
                    <button type="button" onClick={() => setRol('admin')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${rol === 'admin' ? 'bg-white text-med-blue shadow-sm' : 'text-slate-500 cursor-pointer'}`}>⚙️ Panel Maestro</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Seleccione la Sede</label>
                        <select value={banco} onChange={(e) => setBanco(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-med-blue bg-white">
                            <option value="Banco de Sangre Dr. Loranzo Hands">Banco de Sangre Dr. Loranzo Hands Unidad CHET</option>
                            <option value="Banco de Sangre Dr. Miguel Patetta">Banco de Sangre Dr. Miguel Patetta Queirolo</option>
                            <option value="Banco de Sangre Dr. José Luis Pérez">Banco de Sangre Dr. José Luis Pérez Requejo</option>
                        </select>
                    </div>

                    {rol === 'usuario' && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Iniciales</label>
                            <input type="text" value={iniciales} onChange={(e) => setIniciales(e.target.value)} placeholder="Ej. SG" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-med-blue uppercase font-bold" required />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-med-blue" required />
                    </div>

                    {error && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg text-center font-medium">{error}</div>}

                    <button type="submit" className="w-full bg-med-blue hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all cursor-pointer border-none">
                        Ingresar
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;