// src/Pages/NotificarDonantes.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDonantes, obtenerMuestras, calcularDiasParaDonar } from '../utils/data';

function NotificarDonantes() {
    const navigate = useNavigate();
    const [filtro, setFiltro] = useState('aptos');
    const [busqueda, setBusqueda] = useState('');
    const [donorsConEstado, setDonorsConEstado] = useState([]);

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
                    totalDonaciones: muestrasDonante.length,
                    correo: d.correo || d.email || '' 
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

    // --- LÓGICA DE CORREO CON EL NUEVO MENSAJE DEL CLIENTE ---
    const handleNotificar = (donante) => {
        if (!donante.correo) {
            alert(`⚠️ El donante ${donante.nombre} ${donante.apellido} no tiene un correo electrónico registrado en el sistema. Debe contactarlo por otros medios o actualizar su ficha.`);
            return;
        }

        const asunto = `Recordatorio de Donación de Sangre - Sistema Hemotransf`;
        let mensaje = '';

        if (donante.puedeDonar) {
            mensaje = `¡Hola, ${donante.nombre} ${donante.apellido}!

El programa Sangre Segura del estado Carabobo no olvida que eres un héroe. Gracias a tu donación ayudaste a salvar vidas. 

Hoy ya puedes volver a donar y ser el milagro de alguien más.

Tu grupo sanguíneo (${donante.grupoSanguineo || 'el cual tenemos registrado'}) es de suma importancia para nuestro inventario y puede hacer la diferencia en emergencias. Te invitamos a acercarte a nuestro Banco de Sangre cuando tengas disponibilidad.

Agradecemos profundamente tu compromiso, altruismo y solidaridad.

Saludos cordiales,
Equipo Médico - Sistema Hemotransf`;
        } else {
            mensaje = `Estimado/a ${donante.nombre} ${donante.apellido},

Esperamos que se encuentre muy bien.

Queremos agradecerle por su altruismo en su donación del ${donante.ultimaDonacion}. Le recordamos que su salud es nuestra prioridad, por lo que aún se encuentra en periodo de recuperación (ventana). 

Estará apto/a para donar nuevamente en ${donante.diasParaDonar} días. Le enviaremos un nuevo correo cuando llegue el momento.

Saludos cordiales,
Equipo Médico - Sistema Hemotransf`;
        }

        const enlaceMailto = `mailto:${donante.correo}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
        window.open(enlaceMailto, '_blank');
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
                    <p className="text-emerald-100 text-sm sm:text-lg">Gestión de alertas y recordatorios vía correo electrónico.</p>
                </div>
            </div>
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12 relative z-0">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    {[
                        { key: 'aptos', label: 'Aptos', color: 'bg-emerald-500', count: conteos.aptos, textColor: 'text-white' },
                        { key: 'ventana', label: 'En Ventana', color: 'bg-amber-500', count: conteos.ventana, textColor: 'text-white' },
                        { key: 'sinDonar', label: 'Sin Donar', color: 'bg-slate-500', count: conteos.sinDonar, textColor: 'text-white' },
                        { key: 'todos', label: 'Total', color: 'bg-med-blue', count: conteos.total, textColor: 'text-white' }
                    ].map(item => {
                        const activo = filtro === item.key || (item.key === 'todos' && filtro === 'todos');
                        return (
                            <button 
                                key={item.key} 
                                onClick={() => setFiltro(item.key === 'todos' ? 'todos' : item.key)} 
                                className={`${activo ? item.color : 'bg-white hover:bg-slate-50'} rounded-xl p-4 shadow-sm border-2 transition-all cursor-pointer ${activo ? `border-transparent` : 'border-slate-200'}`}
                            >
                                <p className={`text-2xl sm:text-3xl font-bold ${activo ? 'text-white' : 'text-slate-800'}`}>{item.count}</p>
                                <p className={`text-xs font-medium ${activo ? 'text-white/90' : 'text-slate-500'}`}>{item.label}</p>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-grow">
                            <input 
                                type="text" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                                placeholder="Buscar por nombre, apellido o cédula..." 
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base bg-slate-50" 
                            />
                        </div>
                        <div className="text-sm font-bold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl flex items-center justify-center border border-emerald-100">
                            {donorsFiltrados.length} resultado{donorsFiltrados.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {donorsFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center animate-in fade-in">
                        <span className="text-4xl mb-4 block opacity-50">📭</span>
                        <p className="text-slate-500 font-medium">No hay donantes que coincidan con el filtro actual.</p>
                    </div>
                ) : (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
                        {donorsFiltrados.map((donante, idx) => (
                            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 hover:shadow-md hover:border-emerald-200 transition-all">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 sm:gap-3 mb-1">
                                            <h3 className="font-bold text-lg text-slate-800">{donante.nombre} {donante.apellido}</h3>
                                            {donante.grupoSanguineo && (
                                                <span className="bg-rose-100 text-med-accent px-2 py-0.5 rounded text-xs font-black border border-rose-200">{donante.grupoSanguineo}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-500 font-medium">C.I: {donante.cedula} • 📧 {donante.correo || <span className="text-red-400 italic">Sin correo registrado</span>}</p>
                                        
                                        <div className="flex flex-wrap gap-3 mt-3 text-xs bg-slate-50 inline-flex p-2 rounded-lg border border-slate-100">
                                            <span className="text-slate-600">Donaciones: <strong className="text-slate-800">{donante.totalDonaciones}</strong></span>
                                            {donante.ultimaDonacion && <span className="text-slate-600">Última: <strong className="text-slate-800">{donante.ultimaDonacion}</strong></span>}
                                            {donante.diasParaDonar > 0 ? (
                                                <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-bold">En ventana: {donante.diasParaDonar} días</span>
                                            ) : (
                                                <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">✓ Donante Apto</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                        <button 
                                            onClick={() => handleNotificar(donante)} 
                                            className={`w-full sm:w-auto px-5 py-3 sm:py-2 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 border-none cursor-pointer ${donante.correo ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-300 cursor-not-allowed'}`}
                                            disabled={!donante.correo}
                                            title={!donante.correo ? "El donante no tiene correo registrado" : "Enviar correo"}
                                        >
                                            ✉️ Redactar Correo
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