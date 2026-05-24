// src/Pages/BuscarDonante.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDonantes, obtenerMuestras, guardarMuestra, calcularDiasParaDonar, eliminarDonante, actualizarDonante } from '../utils/data';

function BuscarDonante({ usuarioLogeado }) {
    const navigate = useNavigate();
    const [cedula, setCedula] = useState('');
    const [donante, setDonante] = useState(null);
    const [error, setError] = useState('');

    const [mostrarModalMuestra, setMostrarModalMuestra] = useState(false);
    const [datosMuestra, setDatosMuestra] = useState({
        codigoBolsa: '',
        tipoDonacion: 'Sangre Total',
        volumen: '450',
        observaciones: ''
    });

    const handleBuscar = async (e) => {
        e.preventDefault();
        setError('');

        const donantes = await obtenerDonantes();
        const donanteEncontrado = donantes.find(d => d.cedula === cedula);

        if (donanteEncontrado) {
            const diasParaDonar = calcularDiasParaDonar(donanteEncontrado.fechaDonacion);
            const todasLasMuestras = await obtenerMuestras();
            const muestrasDonante = todasLasMuestras.filter(m => m.donanteCedula === cedula);
            const muestraProcesada = muestrasDonante.find(m => m.estado === 'Procesada');
            const grupoSanguineo = donanteEncontrado.grupoSanguineo || muestraProcesada?.grupoSanguineo;

            // EVALUACIÓN CLÍNICA: Si CUALQUIER serología en su historia es Positiva, es No Apto Definitivo
            const esNoApto = muestrasDonante.some(m => 
                m.vih === 'Positivo' || m.sifilis === 'Positivo' || m.chagas === 'Positivo' ||
                m.htlv === 'Positivo' || m.ch === 'Positivo' || m.av === 'Positivo' ||
                m.coreb === 'Positivo' || m.hcv === 'Positivo'
            );

            setDonante({ ...donanteEncontrado, diasParaDonar, historial: muestrasDonante, grupoSanguineo, esNoApto });
        } else {
            setDonante(null);
            setError('Donante no encontrado en el sistema.');
        }
    };

    const handleGuardarMuestra = async (e) => {
        e.preventDefault();
        const muestra = {
            id: datosMuestra.codigoBolsa,
            donanteCedula: donante.cedula,
            donanteNombre: donante.nombre,
            ...datosMuestra,
            fechaRegistro: new Date().toISOString().split('T')[0],
            estado: 'Pendiente',
            bancoOrigen: usuarioLogeado?.banco || 'Desconocido', 
            hemoterapistaEncargado: usuarioLogeado?.iniciales || 'Admin' 
        };
        await guardarMuestra(muestra);
        await actualizarDonante(donante.cedula, { fechaDonacion: muestra.fechaRegistro });

        alert(`Extracción registrada con éxito. La bolsa ${datosMuestra.codigoBolsa} ha entrado en cuarentena.`);
        resetModalMuestra();
        setDonante(null);
        setCedula('');
    };

    const handleCambioMuestra = (e) => {
        const { name, value } = e.target;
        setDatosMuestra({ ...datosMuestra, [name]: value });
    };

    const resetModalMuestra = () => {
        setDatosMuestra({
            codigoBolsa: '',
            tipoDonacion: 'Sangre Total',
            volumen: '450',
            observaciones: ''
        });
        setMostrarModalMuestra(false);
    };

    const handleEliminar = async (cedula) => {
        if (confirm('¿Está seguro que desea eliminar este donante? Esta acción no se puede deshacer.')) {
            const resultado = await eliminarDonante(cedula);
            if (resultado.exito) {
                alert(resultado.mensaje);
                setDonante(null);
                setCedula('');
            } else {
                alert(resultado.mensaje);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🩸</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue transition-colors bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver al Inicio</span><span className="sm:hidden">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-br from-med-blue to-blue-950 h-56 sm:h-64 pt-6 sm:pt-10 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Módulo de Trazabilidad</h1>
                    <p className="text-blue-100 text-sm sm:text-lg">Busque o registre un donante para evaluar su viabilidad serológica.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-0">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-6 border border-slate-100 mb-6 sm:mb-8">
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Número de Cédula del Donante</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">🔍</div>
                                <input type="text" value={cedula} onChange={(e) => setCedula(e.target.value)} placeholder="Ej. 1234567" className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-blue focus:ring-4 focus:ring-blue-100 transition-all text-base sm:text-lg" />
                            </div>
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-med-blue hover:bg-blue-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer whitespace-nowrap h-[52px] sm:h-[56px]">
                            Buscar Expediente
                        </button>
                    </form>

                    {error && (
                        <div className="mt-5 sm:mt-6 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
                            <div className="flex items-start sm:items-center gap-3 text-slate-700">
                                <span className="text-2xl mt-1 sm:mt-0">⚠️</span>
                                <div>
                                    <p className="font-bold text-sm sm:text-base">{error}</p>
                                    <p className="text-xs sm:text-sm text-slate-500">Para iniciar su historial, debe darlo de alta en el sistema.</p>
                                </div>
                            </div>
                            <button onClick={() => navigate('/registrar')} className="w-full sm:w-auto bg-med-blue hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-sm active:scale-95 border-none cursor-pointer whitespace-nowrap text-sm sm:text-base">
                                + Registrar Donante
                            </button>
                        </div>
                    )}
                </div>

                {donante && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="font-bold text-xl sm:text-2xl text-slate-800">{donante.nombre} {donante.apellido}</h3>
                                <p className="text-slate-500 text-sm font-medium">C.I: {donante.cedula}</p>
                            </div>
                            <div className="w-full sm:w-auto">
                                <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Grupo Sanguíneo</p>
                                <span className="bg-rose-100 text-med-accent px-4 py-1.5 rounded-lg text-base sm:text-lg font-black border border-rose-200 shadow-sm inline-block">
                                    {donante.grupoSanguineo || 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="px-5 sm:px-8 py-3 bg-red-50 border-t border-red-100 flex justify-end">
                            <button onClick={() => handleEliminar(donante.cedula)} className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 bg-transparent border-none cursor-pointer">
                                🗑️ Eliminar Donante
                            </button>
                        </div>

                        <div className="p-5 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 sm:space-y-6">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Información Clínica</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Sexo</p>
                                            <p className="font-semibold text-slate-800 text-sm sm:text-base">{donante.sexo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm text-slate-500 font-medium">Última Donación</p>
                                            <p className="font-semibold text-slate-800 text-sm sm:text-base">{donante.fechaDonacion || 'N/A'}</p>
                                        </div>
                                        {donante.enfermedades && (
                                            <div className="col-span-2">
                                                <p className="text-xs sm:text-sm text-slate-500 font-medium">Enfermedades</p>
                                                <p className="font-semibold text-slate-800 text-sm">{donante.enfermedades}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                    {donante.esNoApto ? (
                                        <div className="bg-red-50 border-2 border-red-200 p-5 sm:p-6 rounded-xl flex flex-col items-center text-center">
                                            <span className="text-2xl sm:text-3xl mb-2">🚫</span>
                                            <p className="text-red-800 font-bold text-base sm:text-lg mb-1">NO APTO DEFINITIVO</p>
                                            <p className="text-red-600 text-xs sm:text-sm">Serología reactiva detectada en historial.</p>
                                        </div>
                                    ) : (!donante.fechaDonacion || donante.diasParaDonar <= 0) ? (
                                        <div className="bg-emerald-50 border-2 border-emerald-200 p-5 sm:p-6 rounded-xl flex flex-col items-center text-center">
                                            <span className="text-2xl sm:text-3xl mb-2">✅</span>
                                            <p className="text-emerald-800 font-bold text-base sm:text-lg mb-1">Apto para donar</p>
                                            <p className="text-emerald-600 text-xs sm:text-sm mb-4">{!donante.fechaDonacion ? 'Aún no ha donado' : 'Ha cumplido el tiempo de reposición.'}</p>
                                            <button onClick={() => setMostrarModalMuestra(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-sm border-none cursor-pointer text-sm sm:text-base">
                                                Registrar Extracción
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border-2 border-amber-200 p-5 sm:p-6 rounded-xl flex flex-col items-center text-center">
                                            <span className="text-2xl sm:text-3xl mb-2">⏳</span>
                                            <p className="text-amber-800 font-bold text-base sm:text-lg mb-1">En periodo de ventana</p>
                                            <p className="text-amber-700 text-xs sm:text-sm">
                                                Faltan <strong className="text-amber-900 text-base sm:text-lg mx-1">{donante.diasParaDonar} días</strong> para habilitación.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {donante.historial && donante.historial.length > 0 && (
                                <div className="border-t border-slate-200 pt-6">
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Historial de Extracciones</h4>
                                    <div className="space-y-3">
                                        {donante.historial.map((m, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-slate-800">{m.id}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.estado === 'Procesada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {m.estado || 'Pendiente'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">{m.fechaRegistro}</span>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                                    <div>
                                                        <p className="text-slate-400">Tipo</p>
                                                        <p className="font-medium text-slate-700">{m.tipoDonacion}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-slate-400">Volumen</p>
                                                        <p className="font-medium text-slate-700">{m.volumen} ml</p>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <p className="text-slate-400">Resultados Serológicos</p>
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                            {[
                                                                { key: 'vih', label: 'VIH' }, { key: 'htlv', label: 'HTLV' },
                                                                { key: 'ch', label: 'CH' }, { key: 'av', label: 'AV' },
                                                                { key: 'coreb', label: 'COR' }, { key: 'hcv', label: 'HCV' },
                                                                { key: 'sifilis', label: 'SIF' }
                                                            ].map(s => {
                                                                if (!m[s.key]) return null;
                                                                const isPos = m[s.key] === 'Positivo';
                                                                return (
                                                                    <span key={s.key} className={isPos ? 'text-red-600 font-bold' : 'text-emerald-600'}>
                                                                        {s.label}:{isPos ? 'P' : 'N'}
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Extracción se mantiene igual... */}
            {mostrarModalMuestra && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-med-blue px-4 sm:px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                                <span>💉</span> Registro de Muestra
                            </h3>
                            <button onClick={() => setMostrarModalMuestra(false)} className="text-blue-200 hover:text-white transition-colors text-2xl font-bold bg-transparent border-none cursor-pointer p-1">
                                ×
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto">
                            <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6 leading-relaxed">
                                Registre los datos de la extracción para el donante <strong className="text-slate-800">{donante?.nombre}</strong>. Esta bolsa ingresará a <strong className="text-orange-600">Cuarentena</strong>.
                            </p>
                            <form id="form-muestra" onSubmit={handleGuardarMuestra} className="space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">ID Único de Bolsa (Escanear) *</label>
                                    <input type="text" name="codigoBolsa" value={datosMuestra.codigoBolsa} onChange={handleCambioMuestra} required placeholder="Ej. BOL-2026-X99" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all bg-blue-50 font-mono text-base sm:text-lg uppercase" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Tipo de Donación</label>
                                        <select name="tipoDonacion" value={datosMuestra.tipoDonacion} onChange={handleCambioMuestra} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base">
                                            <option value="Sangre Total">Sangre Total</option>
                                            <option value="Plaquetoféresis">Concentrado Plaquetario</option>
                                            <option value="Plasmaféresis">Plasma Fresco Congelado (PFC)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Volumen (ml)</label>
                                        <input type="number" name="volumen" value={datosMuestra.volumen} onChange={handleCambioMuestra} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Observaciones (Opcional)</label>
                                    <textarea name="observaciones" value={datosMuestra.observaciones} onChange={handleCambioMuestra} placeholder="Ej. Venas de difícil acceso..." rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all resize-none text-sm sm:text-base"></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                            <button type="button" onClick={() => setMostrarModalMuestra(false)} className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-all border-none bg-transparent cursor-pointer text-sm sm:text-base text-center">Cancelar</button>
                            <button form="form-muestra" type="submit" className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm border-none cursor-pointer text-sm sm:text-base text-center">Enviar a Cuarentena</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BuscarDonante;