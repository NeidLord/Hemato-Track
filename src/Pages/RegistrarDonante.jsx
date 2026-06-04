// src/Pages/RegistrarDonante.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guardarDonante, guardarMuestra, actualizarDonante, verificarDuplicados } from '../utils/data';

function RegistrarDonante() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        cedula: '', nombre: '', apellido: '', correo: '', direccion: '', fechaNacimiento: '', edad: '', sexo: '',
        embarazos: 'No', 
        telefonoPrefijo: '0412', telefonoCuerpo: '', enfermedades: ''
    });
    const [errores, setErrores] = useState({}); 
    const [mostrarModalMuestra, setMostrarModalMuestra] = useState(false);
    
    const [datosMuestra, setDatosMuestra] = useState({
        codigoBolsa: '', segmentoBolsa: '', tipoDonacion: ['Sangre Total'], 
        volumenes: { 'Sangre Total': '450' }, observaciones: '',
        fechaRegistro: new Date().toISOString().split('T')[0] // NUEVO: Fecha Editable
    });

    const calcularEdad = (fechaNac) => {
        if (!fechaNac) return '';
        const fecha = new Date(fechaNac);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const mes = hoy.getMonth() - fecha.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
        return edad > 0 ? edad : 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'fechaNacimiento') {
            setFormData(prev => ({ ...prev, [name]: value, edad: calcularEdad(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBlurValidacion = async (campo, valor) => {
        if (!valor) return;
        const validacion = await verificarDuplicados(
            campo === 'cedula' ? valor : null, 
            campo === 'correo' ? valor : null
        );
        
        if (validacion.existe) {
            setErrores(prev => ({ ...prev, [campo]: validacion.mensaje }));
        } else {
            setErrores(prev => {
                const nuevos = { ...prev };
                delete nuevos[campo];
                return nuevos;
            });
        }
    };

    const handleSubmitDonante = async (e) => {
        e.preventDefault();
        
        if (Object.keys(errores).length > 0) {
            alert('⚠️ Corrija los errores marcados en rojo antes de continuar.');
            return;
        }

        const telefonoCompleto = `${formData.telefonoPrefijo}-${formData.telefonoCuerpo}`;
        const donante = { ...formData, telefono: telefonoCompleto };

        const resultado = await guardarDonante(donante);
        if (resultado.exito) {
            setMostrarModalMuestra(true);
        } else {
            alert(resultado.mensaje);
        }
    };

    const handleGuardarMuestra = async (e) => {
        e.preventDefault();

        if (datosMuestra.tipoDonacion.length === 0) {
            alert('⚠️ Debe seleccionar al menos un componente extraído.');
            return;
        }

        for (let tipo of datosMuestra.tipoDonacion) {
            if (!datosMuestra.volumenes[tipo] || datosMuestra.volumenes[tipo] <= 0) {
                alert(`⚠️ Ingrese un volumen válido para: ${tipo}`);
                return;
            }
        }

        const tiposFormateados = datosMuestra.tipoDonacion.map(t => `${t} (${datosMuestra.volumenes[t]}cc)`).join(', ');
        const usuarioLogeado = JSON.parse(localStorage.getItem('lims_auth_user'));
        
        const muestra = {
            id: datosMuestra.codigoBolsa.toUpperCase(),
            segmento: datosMuestra.segmentoBolsa.toUpperCase(), 
            donanteCedula: formData.cedula,
            donanteNombre: `${formData.nombre} ${formData.apellido}`,
            tipoDonacion: tiposFormateados,
            volumen: parseInt(datosMuestra.volumenes['Sangre Total']) || 0,
            volumen_st: parseInt(datosMuestra.volumenes['Concentrado Globular']) || 0,
            volumen_pfc: parseInt(datosMuestra.volumenes['Plasma Fresco Congelado']) || 0,
            volumen_cp: parseInt(datosMuestra.volumenes['Concentrado Plaquetario']) || 0,
            observaciones: datosMuestra.observaciones,
            fechaRegistro: datosMuestra.fechaRegistro, // Usamos la fecha seleccionada
            estado: 'Pendiente',
            bancoOrigen: usuarioLogeado?.banco || 'Desconocido',
            hemoterapistaEncargado: usuarioLogeado?.iniciales || 'Admin'
        };

        const resultado = await guardarMuestra(muestra);

        if (resultado.exito) {
            await actualizarDonante(formData.cedula, { fechaDonacion: muestra.fechaRegistro });
            alert(`Registro exitoso. La bolsa ${datosMuestra.codigoBolsa} (Seg: ${datosMuestra.segmentoBolsa}) entró en cuarentena.`);
            navigate('/buscar');
        } else {
            alert(resultado.mensaje);
        }
    };

    const handleCheckboxCambio = (e) => {
        const { value, checked } = e.target;
        setDatosMuestra(prev => {
            let nuevosTipos = [...prev.tipoDonacion];
            let nuevosVolumenes = { ...prev.volumenes };

            if (checked) {
                nuevosTipos.push(value);
                if (!nuevosVolumenes[value]) nuevosVolumenes[value] = value === 'Sangre Total' ? '450' : '';
            } else {
                nuevosTipos = nuevosTipos.filter(t => t !== value);
                delete nuevosVolumenes[value];
            }
            return { ...prev, tipoDonacion: nuevosTipos, volumenes: nuevosVolumenes };
        });
    };

    const handleVolumenCambio = (tipo, valor) => {
        setDatosMuestra(prev => ({ ...prev, volumenes: { ...prev.volumenes, [tipo]: valor } }));
    };

    const handleCambioMuestra = (e) => {
        const { name, value } = e.target;
        setDatosMuestra(prev => ({ ...prev, [name]: value }));
    };

    const botonBloqueado = Object.keys(errores).length > 0;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 relative">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🩸</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
                <div className="mb-6 sm:mb-8 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Nuevo Donante</h2>
                    <p className="text-sm sm:text-base text-slate-500">Complete los datos demográficos. Al guardar, pasará al registro de extracción.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
                    <form onSubmit={handleSubmitDonante} className="space-y-5 sm:space-y-6">
                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 sm:mb-4">Información Personal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Cédula de Identidad *</label>
                                <input 
                                    type="text" name="cedula" value={formData.cedula} onChange={handleChange} 
                                    onBlur={(e) => handleBlurValidacion('cedula', e.target.value)}
                                    required placeholder="Ej. 12345678" 
                                    className={`w-full px-4 py-3 rounded-xl border ${errores.cedula ? 'border-red-500 bg-red-50' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base`} 
                                />
                                {errores.cedula && <p className="text-red-600 text-xs font-bold mt-1.5">{errores.cedula}</p>}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Nombres *</label>
                                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Apellidos *</label>
                                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Fecha de Nacimiento *</label>
                                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Edad (Auto)</label>
                                    <input type="number" name="edad" value={formData.edad} readOnly className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-bold cursor-not-allowed text-sm sm:text-base" />
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Sexo *</label>
                                    <select name="sexo" value={formData.sexo} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all bg-white text-sm sm:text-base">
                                        <option value="">Seleccione...</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Femenino">Femenino</option>
                                    </select>
                                </div>
                            </div>
                            
                            {formData.sexo === 'Femenino' && (
                                <div className="md:col-span-2 bg-rose-50 p-4 rounded-xl border border-rose-200">
                                    <label className="block text-sm font-bold text-rose-800 mb-2">¿Antecedentes de embarazo? *</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="embarazos" value="No" checked={formData.embarazos === 'No'} onChange={handleChange} className="w-4 h-4 text-med-accent" />
                                            <span>No / Nulípara</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="embarazos" value="Sí" checked={formData.embarazos === 'Sí'} onChange={handleChange} className="w-4 h-4 text-med-accent" />
                                            <span className="font-semibold text-red-700">Sí (Multípara)</span>
                                        </label>
                                    </div>
                                    {formData.embarazos === 'Sí' && <p className="text-xs text-red-600 mt-2">Alerta clínica: Posible restricción para uso de plasma (Riesgo TRALI).</p>}
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Dirección de Habitación</label>
                                <textarea name="direccion" value={formData.direccion} onChange={handleChange} rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all resize-none text-sm sm:text-base"></textarea>
                            </div>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mt-6 sm:mt-8 mb-3 sm:mb-4">Información Médica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Enfermedades o condiciones</label>
                                <textarea name="enfermedades" value={formData.enfermedades} onChange={handleChange} rows="2" placeholder="Diabetes, hipertensión, alergias, etc." className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all resize-none text-sm sm:text-base"></textarea>
                            </div>
                        </div>

                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mt-6 sm:mt-8 mb-3 sm:mb-4">Contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Teléfono Móvil *</label>
                                <div className="flex gap-2">
                                    <select name="telefonoPrefijo" value={formData.telefonoPrefijo} onChange={handleChange} className="w-[30%] sm:w-28 px-2 sm:px-3 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue bg-white font-medium text-sm sm:text-base text-center sm:text-left">
                                        <option value="0412">0412</option>
                                        <option value="0422">0422</option>
                                        <option value="0414">0414</option>
                                        <option value="0424">0424</option>
                                        <option value="0416">0416</option>
                                        <option value="0426">0426</option>
                                    </select>
                                    <input type="tel" name="telefonoCuerpo" value={formData.telefonoCuerpo} onChange={handleChange} required placeholder="1234567" className="w-[60%] flex-grow px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Correo Electrónico</label>
                                <input 
                                    type="email" name="correo" value={formData.correo} onChange={handleChange} 
                                    onBlur={(e) => handleBlurValidacion('correo', e.target.value)}
                                    placeholder="nombre@ejemplo.com" 
                                    className={`w-full px-4 py-3 rounded-xl border ${errores.correo ? 'border-red-500 bg-red-50' : 'border-slate-300'} focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base`} 
                                />
                                {errores.correo && <p className="text-red-600 text-xs font-bold mt-1.5">{errores.correo}</p>}
                            </div>
                        </div>

                        <div className="pt-5 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                            <button type="button" onClick={() => navigate('/buscar')} className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 bg-transparent border-none cursor-pointer text-sm sm:text-base">
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                disabled={botonBloqueado}
                                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md border-none ${botonBloqueado ? 'bg-slate-400 cursor-not-allowed' : 'bg-med-blue hover:bg-blue-800 active:scale-95 cursor-pointer'} text-sm sm:text-base`}
                            >
                                Guardar y Registrar Extracción
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* --- MODAL DE EXTRACCIÓN --- */}
            {mostrarModalMuestra && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="bg-med-blue px-4 sm:px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-base sm:text-lg flex items-center gap-2">
                                <span>🩸</span> Registro de Muestra
                            </h3>
                            <button onClick={() => setMostrarModalMuestra(false)} className="text-blue-200 hover:text-white transition-colors text-2xl font-bold bg-transparent border-none cursor-pointer p-1">
                                ✕
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 overflow-y-auto">
                            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl mb-5 flex gap-2 items-center">
                                <span className="text-emerald-600 text-lg">✅</span>
                                <p className="text-sm text-emerald-800">Donante <strong>{formData.nombre}</strong> guardado.</p>
                            </div>
                            
                            <form id="form-muestra" onSubmit={handleGuardarMuestra} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Serial de Bolsa *</label>
                                        <input type="text" name="codigoBolsa" value={datosMuestra.codigoBolsa} onChange={handleCambioMuestra} required placeholder="Ej. BOL-X99" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue bg-blue-50 font-mono uppercase" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Segmento *</label>
                                        <input type="text" name="segmentoBolsa" value={datosMuestra.segmentoBolsa} onChange={handleCambioMuestra} required placeholder="Ej. 1A" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue uppercase" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1">Fecha Extracción *</label>
                                        <input type="date" name="fechaRegistro" value={datosMuestra.fechaRegistro} onChange={handleCambioMuestra} required className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue" />
                                    </div>
                                </div>

                                <div className="border border-slate-200 p-4 rounded-xl bg-slate-50">
                                    <label className="block text-sm font-bold text-slate-700 mb-3">Fraccionamiento y Volumen (cc/ml) *</label>
                                    <div className="flex flex-col gap-3">
                                        {['Sangre Total', 'Concentrado Globular', 'Plasma Fresco Congelado', 'Concentrado Plaquetario'].map(f => (
                                            <div key={f} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 bg-white p-2.5 rounded-lg border border-slate-200">
                                                <label className="flex items-center gap-3 cursor-pointer">
                                                    <input type="checkbox" value={f} checked={datosMuestra.tipoDonacion.includes(f)} onChange={handleCheckboxCambio} className="w-5 h-5 text-med-blue rounded border-slate-300" />
                                                    <span className="font-medium text-sm text-slate-700">{f}</span>
                                                </label>
                                                
                                                {datosMuestra.tipoDonacion.includes(f) && (
                                                    <input 
                                                        type="number" 
                                                        placeholder="cc / ml" 
                                                        value={datosMuestra.volumenes[f] || ''} 
                                                        onChange={(e) => handleVolumenCambio(f, e.target.value)} 
                                                        className="w-full sm:w-24 px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue text-sm font-bold text-center" 
                                                        required 
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Observaciones</label>
                                    <textarea name="observaciones" value={datosMuestra.observaciones} onChange={handleCambioMuestra} rows="2" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue resize-none"></textarea>
                                </div>
                            </form>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-4 flex justify-end gap-3">
                            <button form="form-muestra" type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl border-none cursor-pointer">
                                Guardar y Enviar a Cuarentena
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RegistrarDonante;