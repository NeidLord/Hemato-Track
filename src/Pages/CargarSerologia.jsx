// src/pages/CargarSerologia.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerMuestras, actualizarMuestra, actualizarDonante } from '../utils/data';

function CargarSerologia() {
    const navigate = useNavigate();
    const [codigoBolsa, setCodigoBolsa] = useState('');
    const [muestra, setMuestra] = useState(null);
    const [error, setError] = useState('');

    const [datosSerologia, setDatosSerologia] = useState({
        grupoSanguineo: '',
        vih: '',
        sifilis: '',
        chagas: '',
        observaciones: ''
    });

    const handleBuscar = (e) => {
        e.preventDefault();
        setError('');

        const muestras = obtenerMuestras();
        const encontrada = muestras.find(m => m.id === codigoBolsa);

        if (encontrada) {
            setMuestra(encontrada);
            setDatosSerologia({
                grupoSanguineo: encontrada.grupoSanguineo || '',
                vih: encontrada.vih || '',
                sifilis: encontrada.sifilis || '',
                chagas: encontrada.chagas || '',
                observaciones: encontrada.observaciones || ''
            });
        } else {
            setMuestra(null);
            setError('Bolsa no encontrada. Verifique el código.');
        }
    };

    const handleCambio = (e) => {
        const { name, value } = e.target;
        setDatosSerologia(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = (e) => {
        e.preventDefault();

        const actualizada = {
            ...muestra,
            ...datosSerologia,
            estado: 'Procesada',
            fechaAnalisis: new Date().toISOString().split('T')[0]
        };

        actualizarMuestra(actualizada);

        if (datosSerologia.grupoSanguineo) {
            actualizarDonante(muestra.donanteCedula, { grupoSanguineo: datosSerologia.grupoSanguineo });
        }

        alert('Serologías guardadas correctamente.');
        setMuestra(null);
        setCodigoBolsa('');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🧪</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">RegistroSanguíneo Pro</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-br from-med-accent to-rose-950 h-56 sm:h-64 pt-6 sm:pt-10 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Laboratorio Serológico</h1>
                    <p className="text-rose-100 text-sm sm:text-lg">Cargue los resultados de análisis de laboratorio por código de bolsa.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-0">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-6 border border-slate-100 mb-6 sm:mb-8">
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Código de Bolsa</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">🔍</div>
                                <input type="text" value={codigoBolsa} onChange={(e) => setCodigoBolsa(e.target.value)} placeholder="Ej. BOL-2026-X99" className="w-full pl-12 pr-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-accent focus:ring-4 focus:ring-rose-100 transition-all text-base sm:text-lg uppercase font-mono" />
                            </div>
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-med-accent hover:bg-rose-800 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-md active:scale-95 border-none cursor-pointer whitespace-nowrap h-[52px] sm:h-[56px]">
                            Buscar Bolsa
                        </button>
                    </form>

                    {error && (
                        <div className="mt-5 sm:mt-6 bg-red-50 p-4 sm:p-6 rounded-xl border border-red-200 flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <p className="font-bold text-sm sm:text-base text-red-700">{error}</p>
                        </div>
                    )}
                </div>

                {muestra && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-8 py-4 sm:py-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h3 className="font-bold text-xl sm:text-2xl text-slate-800">Bolsa: {muestra.id}</h3>
                                    <p className="text-slate-500 text-sm font-medium">Donante: {muestra.donanteNombre} (C.I: {muestra.donanteCedula})</p>
                                </div>
                                <div className="text-xs sm:text-sm text-slate-500">
                                    Fecha extracción: {muestra.fechaRegistro}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-8">
                            <form onSubmit={handleGuardar} className="space-y-6">
                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Grupo Sanguíneo</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(grupo => (
                                            <label key={grupo} className={`flex items-center justify-center py-3 rounded-xl border-2 cursor-pointer transition-all ${datosSerologia.grupoSanguineo === grupo ? 'border-med-accent bg-rose-100 text-med-accent font-bold' : 'border-slate-200 hover:border-med-accent'}`}>
                                                <input type="radio" name="grupoSanguineo" value={grupo} checked={datosSerologia.grupoSanguineo === grupo} onChange={handleCambio} className="sr-only" />
                                                {grupo}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Serologías</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">VIH *</label>
                                            <select name="vih" value={datosSerologia.vih} onChange={handleCambio} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-accent transition-all bg-white text-sm sm:text-base">
                                                <option value="">Seleccionar...</option>
                                                <option value="Negativo">Negativo</option>
                                                <option value="Positivo">Positivo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Sífilis *</label>
                                            <select name="sifilis" value={datosSerologia.sifilis} onChange={handleCambio} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-accent transition-all bg-white text-sm sm:text-base">
                                                <option value="">Seleccionar...</option>
                                                <option value="Negativo">Negativo</option>
                                                <option value="Positivo">Positivo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Chagas *</label>
                                            <select name="chagas" value={datosSerologia.chagas} onChange={handleCambio} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-accent transition-all bg-white text-sm sm:text-base">
                                                <option value="">Seleccionar...</option>
                                                <option value="Negativo">Negativo</option>
                                                <option value="Positivo">Positivo</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Observaciones</label>
                                    <textarea name="observaciones" value={datosSerologia.observaciones} onChange={handleCambio} rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-accent transition-all resize-none text-sm sm:text-base"></textarea>
                                </div>

                                <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                                    <button type="button" onClick={() => { setMuestra(null); setCodigoBolsa(''); }} className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 bg-transparent border-none cursor-pointer text-sm sm:text-base">
                                        Cancelar
                                    </button>
                                    <button type="submit" className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-med-accent hover:bg-rose-800 transition-all shadow-md active:scale-95 border-none cursor-pointer text-sm sm:text-base">
                                        Guardar Resultados
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CargarSerologia;