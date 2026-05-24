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
        vih: '', htlv: '', ch: '', av: '', coreb: '', hcv: '', sifilis: '',
        observaciones: ''
    });

    const handleBuscar = async (e) => {
        e.preventDefault();
        setError('');

        const muestras = await obtenerMuestras();
        const encontrada = muestras.find(m => m.id === codigoBolsa);

        if (encontrada) {
            setMuestra(encontrada);
            setDatosSerologia({
                grupoSanguineo: encontrada.grupoSanguineo || '',
                vih: encontrada.vih || '', htlv: encontrada.htlv || '', ch: encontrada.ch || '', 
                av: encontrada.av || '', coreb: encontrada.coreb || '', hcv: encontrada.hcv || '', 
                sifilis: encontrada.sifilis || '', observaciones: encontrada.observaciones || ''
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

    const handleGuardar = async (e) => {
        e.preventDefault();

        const actualizada = {
            ...muestra,
            ...datosSerologia,
            estado: 'Procesada',
            fechaAnalisis: new Date().toISOString().split('T')[0]
        };

        await actualizarMuestra(actualizada);

        if (datosSerologia.grupoSanguineo) {
            await actualizarDonante(muestra.donanteCedula, { grupoSanguineo: datosSerologia.grupoSanguineo });
        }

        alert('Serologías completas guardadas correctamente.');
        setMuestra(null);
        setCodigoBolsa('');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🧪</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-br from-med-accent to-rose-950 h-56 sm:h-64 pt-6 sm:pt-10 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Laboratorio Serológico</h1>
                    <p className="text-rose-100 text-sm sm:text-lg">Cargue los 7 marcadores reglamentarios.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-24 relative z-0">
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-5 sm:p-6 border border-slate-100 mb-6 sm:mb-8">
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-end">
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Código de Bolsa</label>
                            <input type="text" value={codigoBolsa} onChange={(e) => setCodigoBolsa(e.target.value)} placeholder="Ej. BOL-2026-X99" className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-accent focus:ring-4 focus:ring-rose-100 uppercase font-mono" />
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-med-accent hover:bg-rose-800 text-white font-bold py-3.5 px-8 rounded-xl shadow-md border-none cursor-pointer">
                            Buscar
                        </button>
                    </form>
                </div>

                {muestra && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8">
                        <form onSubmit={handleGuardar} className="space-y-6">
                            {/* Grupo Sanguineo */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Grupo Sanguíneo</h4>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                                        <label key={g} className={`flex items-center justify-center py-2 rounded-lg border-2 cursor-pointer ${datosSerologia.grupoSanguineo === g ? 'border-med-accent bg-rose-50 text-med-accent font-bold' : 'border-slate-200'}`}>
                                            <input type="radio" name="grupoSanguineo" value={g} checked={datosSerologia.grupoSanguineo === g} onChange={handleCambio} className="sr-only" />
                                            {g}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Las 7 Serologías */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Marcadores Serológicos</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'vih', label: 'VIH' }, { key: 'htlv', label: 'HTLV' },
                                        { key: 'ch', label: 'Chagas (CH)' }, { key: 'av', label: 'Antígeno V. (AV)' },
                                        { key: 'coreb', label: 'Core B' }, { key: 'hcv', label: 'HCV' },
                                        { key: 'sifilis', label: 'Sífilis' }
                                    ].map(s => (
                                        <div key={s.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                            <span className="text-sm font-medium">{s.label}</span>
                                            <select name={s.key} value={datosSerologia[s.key]} onChange={handleCambio} className="px-3 py-1 rounded-lg border border-slate-300 bg-white text-sm" required>
                                                <option value="">Seleccionar...</option>
                                                <option value="Negativo">Negativo</option>
                                                <option value="Positivo">Positivo</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full bg-med-accent hover:bg-rose-800 text-white font-bold py-3 rounded-xl transition-all border-none cursor-pointer">
                                Guardar Resultados Completos
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CargarSerologia;