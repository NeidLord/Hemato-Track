// src/Pages/NotificarDonantes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDonantes, obtenerMuestras, calcularDiasParaDonar } from '../utils/data';

function NotificarDonantes() {
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState('aptos');
    const [busqueda, setBusqueda] = useState('');
    // --- CORREGIDO: Nuevo estado para manejar los datos async ---
    const [donorsConEstado, setDonorsConEstado] = useState([]);

    // --- CORREGIDO: UseEffect para buscar en Supabase al abrir la pantalla ---
    useEffect(() => {
        const cargarDatos = async () => {
            const donors = await obtenerDonantes();
            const muestras = await obtenerMuestras();

            const procesados = donors.map(d => {
                const dias = calcularDiasParaDonar(d.fechaDonacion);
                const muestrasDonante = muestras.filter(m => m.donanteCedula === d.cedula && m.estado === 'Procesada');
                const grupo = d.grupoSanguineo || muestrasDonante[muestrasDonante.length - 1]?.grupoSanguineo;
                return {
                    ...d,
                    diasParaDonar: dias,
                    puedeDonar: dias <= 0,
                    grupoSanguineo: grupo,
                    ultimaDonacion: d.fechaDonacion,
                    totalDonaciones: muestrasDonante.length
                };
            });
            setDonorsConEstado(procesados);
        };
        cargarDatos();
    }, []);

    const donorsFiltrados = useMemo(() => {
        return donorsConEstado.filter(d => {
            const coincideBusqueda = busqueda === '' ||
                d.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                d.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
                d.cedula.includes(busqueda);

            if (filtro === 'aptos') return coincideBusqueda && d.puedeDonar;
            if (filtro === 'ventana') return coincideBusqueda && !d.puedeDonar;
            if (filtro === 'sinDonar') return coincideBusqueda && !d.fechaDonacion;
            return coincideBusqueda;
        });
    }, [donorsConEstado, filtro, busqueda]);

    const conteos = useMemo(() => ({
        aptos: donorsConEstado.filter(d => d.puedeDonar).length,
        ventana: donorsConEstado.filter(d => !d.puedeDonar && d.fechaDonacion).length,
        sinDonar: donorsConEstado.filter(d => !d.fechaDonacion).length,
        total: donorsConEstado.length
    }), [donorsConEstado]);

    const handleNotificar = (donante) => {
        const mensaje = `Estimado/a ${donante.nombre}, le informamos que ya puede realizar una nueva donación de sangre. Su tipo ${donante.grupoSanguineo || 'desconocido'} es muy requerido. Acude al banco de sangre más cercano.`;
        alert(`📱 Mensaje preparado para ${donante.telefono}:\n\n${mensaje}`);
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">✉️</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-950 h-40 sm:h-48 pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-5xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Notificar Donantes</h1>
                    <p className="text-emerald-100 text-sm sm:text-lg">Gestión de alertas y recordatorios para donantes disponibles.</p>
                </div>
            </div>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {[
                        { key: 'aptos', label: 'Aptos', color: 'bg-emerald-500', count: conteos.aptos },
                        { key: 'ventana', label: 'En Ventana', color: 'bg-amber-500', count: conteos.ventana },
                        { key: 'sinDonar', label: 'Sin Donar', color: 'bg-slate-500', count: conteos.sinDonar },
                        { key: 'todos', label: 'Total', color: 'bg-med-blue', count: conteos.total }
                    ].map(item => (
                        <button key={item.key} onClick={() => setFiltro(item.key === 'todos' ? 'todos' : item.key)} className={`${filtro === item.key || (item.key === 'todos' && filtro === 'todos') ? item.color : 'bg-white'} rounded-xl p-4 shadow-md border-2 transition-all ${filtro === item.key || (item.key === 'todos' && filtro === 'todos') ? 'border-emerald-500' : 'border-transparent'}`}>
                            <p className="text-2xl sm:text-3xl font-bold text-white">{item.count}</p>
                            <p className="text-xs text-white/80">{item.label}</p>
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow">
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, apellido o cédula..." className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base" />
                        </div>
                        <div className="text-sm text-slate-500 flex items-center">
                            {donorsFiltrados.length} resultado{donorsFiltrados.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {donorsFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                        <span className="text-4xl mb-4 block">📭</span>
                        <p className="text-slate-500">No hay donors que coincidan con el filtro.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {donorsFiltrados.map((donante, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 sm:p-5 hover:shadow-lg transition-all">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                            <h3 className="font-bold text-lg text-slate-800">{donante.nombre} {donante.apellido}</h3>
                                            {donante.grupoSanguineo && (
                                                <span className="bg-rose-100 text-med-accent px-2 py-0.5 rounded text-xs font-bold">{donante.grupoSanguineo}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500">C.I: {donante.cedula} • {donante.telefono}</p>
                                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                                            <span>Donaciones: <strong>{donante.totalDonaciones}</strong></span>
                                            {donante.ultimaDonacion && <span>Última: <strong>{donante.ultimaDonacion}</strong></span>}
                                            {donante.diasParaDonar > 0 ? (
                                                <span className="text-amber-600">Ventana: <strong>{donante.diasParaDonar} días</strong></span>
                                            ) : (
                                                <span className="text-emerald-600">✓ Apto</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleNotificar(donante)} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg text-sm transition-all flex items-center gap-1">
                                            📱 Notificar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NotificarDonantes;