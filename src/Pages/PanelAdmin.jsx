// src/Pages/PanelAdmin.jsx
import React, { useState, useEffect } from 'react';
import { obtenerUsuarios, guardarUsuario, eliminarUsuario } from '../utils/data';

function PanelAdmin({ usuarioAdmin, onLogout }) {
    const [usuarios, setUsuarios] = useState([]);
    const [nuevoUsr, setNuevoUsr] = useState({ nombre: '', iniciales: '', password: '' });

    useEffect(() => {
        cargarUsuarios();
    }, []);

    // 1. Agregamos async y await
    const cargarUsuarios = async () => {
        // El admin solo ve los usuarios de su propio banco
        const todos = await obtenerUsuarios();
        setUsuarios(todos.filter(u => u.banco === usuarioAdmin.banco && u.rol === 'usuario'));
    };

    // 2. Agregamos async y await
    const handleRegistrar = async (e) => {
        e.preventDefault();
        const usrCompleto = { ...nuevoUsr, rol: 'usuario', banco: usuarioAdmin.banco };
        const res = await guardarUsuario(usrCompleto);
        if (res.exito) {
            setNuevoUsr({ nombre: '', iniciales: '', password: '' });
            await cargarUsuarios();
        } else {
            alert(res.mensaje);
        }
    };

    // 3. Función asíncrona para eliminar correctamente en Supabase
    const handleEliminar = async (id) => {
        if (confirm('¿Eliminar a este usuario?')) {
            await eliminarUsuario(id);
            await cargarUsuarios();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 pb-20 pt-8 px-6 text-white relative">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-10 pointer-events-none"></div>
                <div className="max-w-4xl mx-auto relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Panel Maestro • {usuarioAdmin.banco}</h1>
                        <p className="text-slate-400">Gestión de Hemoterapistas Licenciados</p>
                    </div>
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors">
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 -mt-10 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Formulario de registro */}
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100 h-fit">
                    <h3 className="font-bold text-lg mb-4">Alta de Personal</h3>
                    <form onSubmit={handleRegistrar} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre Completo</label>
                            <input type="text" required value={nuevoUsr.nombre} onChange={e => setNuevoUsr({ ...nuevoUsr, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Iniciales (Login)</label>
                            <input type="text" required value={nuevoUsr.iniciales} onChange={e => setNuevoUsr({ ...nuevoUsr, iniciales: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border rounded-lg uppercase" placeholder="Ej. SG" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña temporal</label>
                            <input type="text" required value={nuevoUsr.password} onChange={e => setNuevoUsr({ ...nuevoUsr, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <button className="w-full bg-med-blue text-white font-bold py-2 rounded-lg hover:bg-blue-800 cursor-pointer">
                            Registrar Licenciado
                        </button>
                    </form>
                </div>

                {/* Lista de personal */}
                <div className="md:col-span-2 space-y-4">
                    {usuarios.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center shadow-md">No hay personal registrado en esta sede.</div>
                    ) : (
                        usuarios.map(u => (
                            <div key={u.id} className="bg-white rounded-2xl shadow-md p-4 flex justify-between items-center border-l-4 border-emerald-500">
                                <div>
                                    <p className="font-bold text-lg">{u.nombre}</p>
                                    <p className="text-sm text-slate-500">Iniciales: <span className="font-bold text-med-blue">{u.iniciales}</span></p>
                                </div>
                                {/* Usamos la nueva función handleEliminar */}
                                <button onClick={() => handleEliminar(u.id)} className="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded-lg cursor-pointer">
                                    🗑️ Dar de baja
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default PanelAdmin;