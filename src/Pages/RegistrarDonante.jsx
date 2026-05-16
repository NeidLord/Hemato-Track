// src/pages/RegistrarDonante.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guardarDonante } from '../utils/data';

function RegistrarDonante() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        cedula: '', nombre: '', apellido: '', correo: '', direccion: '', fechaNacimiento: '', edad: '', sexo: '', 
        telefonoPrefijo: '0412', telefonoCuerpo: '', enfermedades: ''
    });

    const calcularEdad = (fechaNac) => {
        if (!fechaNac) return '';
        const fecha = new Date(fechaNac);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fecha.getFullYear();
        const mes = hoy.getMonth() - fecha.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
        }
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const telefonoCompleto = `${formData.telefonoPrefijo}-${formData.telefonoCuerpo}`;
        const donante = { ...formData, telefono: telefonoCompleto };
        const resultado = guardarDonante(donante);
        if (resultado.exito) {
            alert(resultado.mensaje);
            navigate('/buscar');
        } else {
            alert(resultado.mensaje);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">🩸</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">RegistroSanguíneo Pro</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
                <div className="mb-6 sm:mb-8 text-center sm:text-left">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1 sm:mb-2">Nuevo Donante</h2>
                    <p className="text-sm sm:text-base text-slate-500">Complete los datos demográficos. La edad se calcula sola.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                        <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 sm:mb-4">Información Personal</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1">Cédula de Identidad *</label>
                                <input type="text" name="cedula" value={formData.cedula} onChange={handleChange} required placeholder="Ej. 12345678" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
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

                            {/* En celular baja a 1 columna (cada uno ocupa el 100%), en tablet/pc 2 columnas */}
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
                                    {/* Ajustado el combobox para que no sea excesivamente ancho en celular */}
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
                                <input type="email" name="correo" value={formData.correo} onChange={handleChange} placeholder="nombre@ejemplo.com" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue transition-all text-sm sm:text-base" />
                            </div>
                        </div>

                        {/* Botones: Se apilan en celular, se ponen de lado en computadora */}
                        <div className="pt-5 sm:pt-6 border-t border-slate-100 mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                            <button type="button" onClick={() => navigate('/buscar')} className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-slate-500 hover:bg-slate-100 bg-transparent border-none cursor-pointer text-sm sm:text-base">
                                Cancelar
                            </button>
                            <button type="submit" className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-med-blue hover:bg-blue-800 transition-all shadow-md active:scale-95 border-none cursor-pointer text-sm sm:text-base">
                                Guardar Expediente
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default RegistrarDonante;