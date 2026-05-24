// src/Pages/Ajustes.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDonantes, obtenerMuestras } from '../utils/data';

function TarjetaEstadistica({ titulo, valor, color }) {
    return (
        <div className={`bg-white rounded-2xl p-4 sm:p-6 shadow-md border-l-4 ${color}`}>
            <p className="text-xs sm:text-sm text-slate-500 uppercase mb-1">{titulo}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{valor}</p>
        </div>
    );
}

function Ajustes() {
    const navigate = useNavigate();
    const [mostrarModalLimpiar, setMostrarModalLimpiar] = useState(false);
    const [tipoLimpiar, setTipoLimpiar] = useState('');

    // --- CORREGIDO: Nuevo estado para manejar estadísticas en la nube ---
    const [stats, setStats] = useState({
        totalDonors: 0, totalMuestras: 0, procesadas: 0, pendientes: 0,
        grupos: {}, serologiasPositivas: { vih: 0, sifilis: 0, chagas: 0 }, inventarioTotal: 0
    });

    // --- CORREGIDO: UseEffect para recopilar datos de Supabase ---
    useEffect(() => {
        const cargarDatos = async () => {
            const donors = await obtenerDonantes();
            const muestras = await obtenerMuestras();

            const procesadas = muestras.filter(m => m.estado === 'Procesada');
            const pendientes = muestras.filter(m => m.estado !== 'Procesada');

            const grupos = {};
            donors.forEach(d => {
                if (d.grupoSanguineo) {
                    grupos[d.grupoSanguineo] = (grupos[d.grupoSanguineo] || 0) + 1;
                }
            });

            const serologiasPositivas = {
                vih: procesadas.filter(m => m.vih === 'Positivo').length,
                sifilis: procesadas.filter(m => m.sifilis === 'Positivo').length,
                chagas: procesadas.filter(m => m.chagas === 'Positivo').length
            };

            setStats({
                totalDonors: donors.length,
                totalMuestras: muestras.length,
                procesadas: procesadas.length,
                pendientes: pendientes.length,
                grupos,
                serologiasPositivas,
                inventarioTotal: procesadas.reduce((acc, m) => acc + (parseInt(m.volumen) || 0), 0)
            });
        };
        cargarDatos();
    }, []);

    // --- CORREGIDO: Candado de seguridad para la presentación ---
    const handleLimpiarDatos = () => {
        alert('ℹ️ Por seguridad y para preservar la integridad de los datos en la presentación de grado, el borrado masivo ha sido desactivado en la versión de la nube.');
        setMostrarModalLimpiar(false);
        setTipoLimpiar('');
    };

    // --- CORREGIDO: Async para descargar los datos de la nube ---
    const handleExportar = async () => {
        const donors = await obtenerDonantes();
        const muestras = await obtenerMuestras();
        const datos = {
            donors,
            muestras,
            exportadoEn: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lims-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">⚙️</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-r from-slate-600 to-slate-800 h-40 sm:h-48 pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-5xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ajustes del Sistema</h1>
                    <p className="text-slate-200 text-sm sm:text-lg">Estadísticas, configuración y gestión de datos.</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-0 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <TarjetaEstadistica titulo="Donantes" valor={stats.totalDonors} color="border-med-blue" />
                    <TarjetaEstadistica titulo="Extracciones" valor={stats.totalMuestras} color="border-emerald-500" />
                    <TarjetaEstadistica titulo="Procesadas" valor={stats.procesadas} color="border-med-accent" />
                    <TarjetaEstadistica titulo="Pendientes" valor={stats.pendientes} color="border-amber-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            📊 Distribución por Grupo Sanguíneo
                        </h3>
                        {Object.keys(stats.grupos).length === 0 ? (
                            <p className="text-slate-500 text-sm">No hay datos de grupos sanguíneos.</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(stats.grupos).sort((a, b) => b[1] - a[1]).map(([grupo, count]) => (
                                    <div key={grupo} className="flex items-center gap-3">
                                        <span className="w-12 font-bold text-med-accent">{grupo}</span>
                                        <div className="flex-grow h-6 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-med-accent rounded-full" style={{ width: `${(count / stats.totalDonors) * 100}%` }}></div>
                                        </div>
                                        <span className="text-sm text-slate-600 w-8">{count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            🏥 Inventario Actual
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                <span className="text-sm text-slate-600">Volumen total disponible</span>
                                <span className="font-bold text-lg text-slate-800">{stats.inventarioTotal} ml</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                                <span className="text-sm text-slate-600">Serologías positivas</span>
                                <span className="font-bold text-red-600">{stats.serologiasPositivas.vih + stats.serologiasPositivas.sifilis + stats.serologiasPositivas.chagas}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                                <span className="text-sm text-slate-600">Muestras Aptas</span>
                                <span className="font-bold text-emerald-600">{stats.procesadas - stats.serologiasPositivas.vih - stats.serologiasPositivas.sifilis - stats.serologiasPositivas.chagas}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            💾 Respaldo de Datos
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Exporte todos los datos del sistema en formato JSON para respaldo o transferencia.</p>
                        <button onClick={handleExportar} className="w-full px-4 py-3 bg-med-blue hover:bg-blue-800 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                            📥 Exportar Datos (Nube)
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            🗑️ Limpiar Datos
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Elimine datos del sistema. Esta acción no se puede deshacer.</p>
                        <button onClick={() => setMostrarModalLimpiar(true)} className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                            🗑️ Limpiar Datos
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        ℹ️ Acerca del Sistema
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Sistema de Gestión</p>
                            <p className="font-medium">RegistroSanguíneo Pro</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Versión</p>
                            <p className="font-medium">1.0.0 (Cloud Edition)</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Tecnología</p>
                            <p className="font-medium">React + Tailwind CSS v4</p>
                        </div>
                        <div>
                            <p className="text-slate-500">Almacenamiento</p>
                            <p className="font-medium">PostgreSQL (Supabase)</p>
                        </div>
                    </div>
                </div>
            </div>

            {mostrarModalLimpiar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Confirmar Limpieza de Datos</h3>
                        <p className="text-sm text-slate-500 mb-4">Seleccione qué datos desea eliminar:</p>
                        <div className="space-y-2 mb-6">
                            {[
                                { key: 'donantes', label: 'Solo Donantes', desc: 'Elimina todos los registros de donors' },
                                { key: 'muestras', label: 'Solo Extracciones', desc: 'Elimina todas las extracciones' },
                                { key: 'todo', label: 'Todos los Datos', desc: 'Elimina toda la información' }
                            ].map(op => (
                                <label key={op.key} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${tipoLimpiar === op.key ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-300'}`}>
                                    <input type="radio" name="tipoLimpiar" value={op.key} onChange={(e) => setTipoLimpiar(e.target.value)} className="mt-1" />
                                    <div>
                                        <p className="font-medium text-sm">{op.label}</p>
                                        <p className="text-xs text-slate-500">{op.desc}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setMostrarModalLimpiar(false)} className="flex-1 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 border-none cursor-pointer">
                                Cancelar
                            </button>
                            <button onClick={handleLimpiarDatos} disabled={!tipoLimpiar} className="flex-1 px-4 py-3 rounded-xl font-medium bg-red-500 hover:bg-red-600 text-white border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Ajustes;