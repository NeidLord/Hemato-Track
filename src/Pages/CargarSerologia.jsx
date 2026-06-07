// src/Pages/CargarSerologia.jsx
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
        hiv: '', htlv: '', ch: '', av: '', coreb: '', hcv: '', sifilis: '',
        observaciones: ''
    });

    const handleBuscar = async (e) => {
        e.preventDefault();
        setError('');

        const terminoBusqueda = codigoBolsa.trim().toUpperCase();
        const muestras = await obtenerMuestras();
        
        // AHORA BUSCA TANTO POR CÓDIGO COMO POR SEGMENTO
        const encontrada = muestras.find(m => 
            (m.id && m.id.toUpperCase() === terminoBusqueda) || 
            (m.codigo_bolsa && m.codigo_bolsa.toUpperCase() === terminoBusqueda) ||
            (m.segmento && m.segmento.toUpperCase() === terminoBusqueda)
        );

        if (encontrada) {
            setMuestra(encontrada);
            setDatosSerologia({
                grupoSanguineo: encontrada.grupo_sanguineo || encontrada.grupoSanguineo || '',
                hiv: encontrada.hiv || '', htlv: encontrada.htlv || '', ch: encontrada.ch || '', 
                av: encontrada.av || '', coreb: encontrada.coreb || '', hcv: encontrada.hcv || '', 
                sifilis: encontrada.sifilis || '', observaciones: encontrada.observaciones || ''
            });
        } else {
            setMuestra(null);
            setError('Bolsa o Segmento no encontrado. Verifique el código.');
        }
    };

    const handleCambio = (e) => {
        const { name, value } = e.target;
        setDatosSerologia(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardar = async (e) => {
        e.preventDefault();
        
        const actualizada = {
            id: muestra.codigo_bolsa || muestra.id || codigoBolsa,
            codigo_bolsa: muestra.codigo_bolsa || muestra.id || codigoBolsa,
            estado: 'Procesada',
            fechaAnalisis: new Date().toISOString().split('T')[0],
            grupoSanguineo: datosSerologia.grupoSanguineo,
            hiv: datosSerologia.hiv,
            htlv: datosSerologia.htlv,
            ch: datosSerologia.ch,
            av: datosSerologia.av,
            coreb: datosSerologia.coreb,
            hcv: datosSerologia.hcv,
            sifilis: datosSerologia.sifilis,
            observaciones: datosSerologia.observaciones
        };

        const resultadoMuestra = await actualizarMuestra(actualizada);

        if (resultadoMuestra.exito) {
            const cedulaDonante = muestra.donante_cedula || muestra.donanteCedula;
            if (datosSerologia.grupoSanguineo && cedulaDonante) {
                await actualizarDonante(cedulaDonante, { grupo_sanguineo: datosSerologia.grupoSanguineo });
            }
            alert('✅ Serologías guardadas correctamente en la base de datos.');
            setMuestra(null); 
            setCodigoBolsa('');
        } else {
            alert(`❌ Error al guardar: ${resultadoMuestra.mensaje}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🧪</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemato-Track</span>
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
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-end">
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Código de Bolsa o Segmento</label>
                            <input 
                                type="text" 
                                value={codigoBolsa} 
                                onChange={(e) => setCodigoBolsa(e.target.value.toUpperCase())} 
                                placeholder="Ej. BOL-X99 o 1A" 
                                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-accent focus:ring-4 focus:ring-rose-100 font-mono" 
                            />
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-med-accent hover:bg-rose-800 text-white font-bold py-3 sm:py-3.5 px-8 rounded-xl shadow-md border-none cursor-pointer">
                            Buscar
                        </button>
                    </form>
                    {error && (
                        <div className="mt-5 bg-red-50 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                            <span className="text-2xl">⚠️</span>
                            <p className="font-bold text-red-700">{error}</p>
                        </div>
                    )}
                </div>

                {muestra && (
                    <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-5 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
                        <form onSubmit={handleGuardar} className="space-y-6">
                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Grupo Sanguíneo Definitivo</h4>
                                <select name="grupoSanguineo" value={datosSerologia.grupoSanguineo} onChange={handleCambio} required className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-med-accent text-lg font-bold">
                                    <option value="">Seleccione Tipiaje Exacto...</option>
                                    <option value="O+">O RH Positivo</option>
                                    <option value="O-">O RH Negativo</option>
                                    <option value="A+">A RH Positivo</option>
                                    <option value="A-">A RH Negativo</option>
                                    <option value="B+">B RH Positivo</option>
                                    <option value="B-">B RH Negativo</option>
                                    <option value="AB+">AB RH Positivo</option>
                                    <option value="AB-">AB RH Negativo</option>
                                </select>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Marcadores Serológicos</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { key: 'hiv', label: 'VIH' }, { key: 'htlv', label: 'HTLV' },
                                        { key: 'ch', label: 'Chagas (CH)' }, { key: 'av', label: 'Antígeno V. (AV)' },
                                        { key: 'coreb', label: 'Core B' }, { key: 'hcv', label: 'HCV' },
                                        { key: 'sifilis', label: 'Sífilis' }
                                    ].map(s => (
                                        <div key={s.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <span className="text-sm font-bold text-slate-700">{s.label}</span>
                                            <select name={s.key} value={datosSerologia[s.key]} onChange={handleCambio} className="w-full sm:w-auto px-4 py-2 rounded-lg border bg-white font-medium" required>
                                                <option value="">Resultado...</option>
                                                <option value="Negativo">Negativo (-)</option>
                                                <option value="Positivo">Positivo (+)</option>
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Observaciones</label>
                                <textarea name="observaciones" value={datosSerologia.observaciones} onChange={handleCambio} rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-accent resize-none"></textarea>
                            </div>

                            <button type="submit" className="w-full bg-med-accent hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl cursor-pointer border-none text-lg transition-colors">
                                Guardar Resultados
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CargarSerologia;