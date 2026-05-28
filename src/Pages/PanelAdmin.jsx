// src/Pages/PanelAdmin.jsx
import React, { useState, useEffect } from 'react';
import { obtenerUsuarios, guardarUsuario, eliminarUsuario } from '../utils/data';

function PanelAdmin({ usuarioAdmin, onLogout }) {
    const [usuarios, setUsuarios] = useState([]);
    
    // Agregamos 'rol' al estado inicial (por defecto 'usuario')
    const [nuevoUsr, setNuevoUsr] = useState({ nombre: '', iniciales: '', password: '', rol: 'usuario' });

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        const todos = await obtenerUsuarios();
        // Filtramos por banco, pero protegemos la cuenta maestra "ADMIN" para que no la borren
        setUsuarios(todos.filter(u => u.banco === usuarioAdmin.banco && u.iniciales !== 'ADMIN'));
    };

    // Lógica para automatizar las iniciales al escribir el nombre
    const handleNombreChange = (e) => {
        const valorNombre = e.target.value;
        
        // Extrae la primera letra de cada palabra y las une en mayúsculas
        const autoIniciales = valorNombre
            .split(' ')
            .filter(palabra => palabra.length > 0)
            .map(palabra => palabra[0])
            .join('')
            .toUpperCase()
            .substring(0, 4); // Limitamos a 4 caracteres por estética/seguridad

        setNuevoUsr(prev => ({
            ...prev,
            nombre: valorNombre,
            iniciales: autoIniciales
        }));
    };

    const handleRegistrar = async (e) => {
        e.preventDefault();
        // Enviamos el rol que se haya seleccionado en el formulario
        const usrCompleto = { ...nuevoUsr, banco: usuarioAdmin.banco };
        const res = await guardarUsuario(usrCompleto);
        
        if (res.exito) {
            setNuevoUsr({ nombre: '', iniciales: '', password: '', rol: 'usuario' });
            await cargarUsuarios();
        } else {
            alert(res.mensaje);
        }
    };

    const handleEliminar = async (id) => {
        if (confirm('¿Está seguro que desea revocar el acceso a este usuario?')) {
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
                    <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl font-bold cursor-pointer transition-colors border-none">
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
                            <input 
                                type="text" 
                                required 
                                value={nuevoUsr.nombre} 
                                onChange={handleNombreChange} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-med-blue" 
                                placeholder="Ej. Carlos Pérez"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Iniciales (Auto / Editable)</label>
                            <input 
                                type="text" 
                                required 
                                value={nuevoUsr.iniciales} 
                                onChange={e => setNuevoUsr({ ...nuevoUsr, iniciales: e.target.value.toUpperCase() })} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase focus:outline-none focus:ring-2 focus:ring-med-blue bg-slate-50" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Nivel de Acceso</label>
                            <select 
                                value={nuevoUsr.rol} 
                                onChange={e => setNuevoUsr({ ...nuevoUsr, rol: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-med-blue bg-white"
                            >
                                <option value="usuario">Normal (Ver/Registrar)</option>
                                <option value="admin">Administrador (Editar/Eliminar)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Contraseña de acceso</label>
                            <input 
                                type="text" 
                                required 
                                value={nuevoUsr.password} 
                                onChange={e => setNuevoUsr({ ...nuevoUsr, password: e.target.value })} 
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-med-blue" 
                            />
                        </div>
                        <button type="submit" className="w-full bg-med-blue text-white font-bold py-2.5 rounded-lg hover:bg-blue-800 cursor-pointer border-none transition-colors mt-2">
                            Registrar Licenciado
                        </button>
                    </form>
                </div>

                {/* Lista de personal */}
                <div className="md:col-span-2 space-y-4">
                    {usuarios.length === 0 ? (
                        <div className="bg-white rounded-2xl p-6 text-center shadow-md text-slate-500 font-medium border border-slate-100">
                            No hay personal registrado en esta sede.
                        </div>
                    ) : (
                        usuarios.map(u => (
                            <div key={u.id} className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex justify-between items-center border-l-4 ${u.rol === 'admin' ? 'border-l-med-blue' : 'border-l-emerald-500'} hover:shadow-md transition-shadow`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-lg text-slate-800">{u.nombre}</p>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.rol === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {u.rol === 'admin' ? 'Admin' : 'Normal'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 mt-0.5">
                                        Login: <span className="font-bold text-slate-700">{u.iniciales}</span>
                                    </p>
                                </div>
                                <button onClick={() => handleEliminar(u.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 bg-transparent p-2.5 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-red-100 text-sm font-bold flex items-center gap-1">
                                    🗑️ Revocar
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