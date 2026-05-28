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
    
    // VERIFICACIÓN DE SEGURIDAD PARA EL CANDADO
    const authUser = JSON.parse(localStorage.getItem('lims_auth_user')) || {};
    const esAdmin = authUser.rol === 'admin';

    const [mostrarModalLimpiar, setMostrarModalLimpiar] = useState(false);
    const [tipoLimpiar, setTipoLimpiar] = useState('');
    
    // Estados para los reportes
    const [tiempoReporte, setTiempoReporte] = useState('historico');
    const [correoDestino, setCorreoDestino] = useState('coordinacion.salud@gob.ve');

    const [stats, setStats] = useState({
        totalDonors: 0, totalMuestras: 0, procesadas: 0, pendientes: 0,
        grupos: {}, serologiasPositivas: { vih: 0, sifilis: 0, chagas: 0 }, inventarioTotal: 0
    });

    // DICCIONARIO PARA MOSTRAR NOMBRES LARGOS DE SANGRE
    const nombresGrupos = {
        'O+': 'O RH Positivo', 'O-': 'O RH Negativo',
        'A+': 'A RH Positivo', 'A-': 'A RH Negativo',
        'B+': 'B RH Positivo', 'B-': 'B RH Negativo',
        'AB+': 'AB RH Positivo', 'AB-': 'AB RH Negativo'
    };

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
                chagas: procesadas.filter(m => m.ch === 'Positivo').length 
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

    const handleLimpiarDatos = () => {
        alert('ℹ️ Por seguridad y para preservar la integridad de los datos en la presentación de grado, el borrado masivo ha sido desactivado.');
        setMostrarModalLimpiar(false);
        setTipoLimpiar('');
    };

    const calcularMetricasReporte = async () => {
        const todosDonantes = await obtenerDonantes();
        const todasMuestras = await obtenerMuestras();
        const hoy = new Date();
        
        let muestrasFiltradas = todasMuestras;
        let donorsFiltrados = todosDonantes;

        if (tiempoReporte === 'semana') {
            const hace7Dias = new Date(hoy);
            hace7Dias.setDate(hoy.getDate() - 7);
            muestrasFiltradas = todasMuestras.filter(m => new Date(m.fechaRegistro) >= hace7Dias);
            donorsFiltrados = todosDonantes.filter(d => d.fechaDonacion && new Date(d.fechaDonacion) >= hace7Dias);
        } else if (tiempoReporte === 'mes') {
            const mesActual = hoy.toISOString().slice(0, 7); 
            muestrasFiltradas = todasMuestras.filter(m => m.fechaRegistro && m.fechaRegistro.startsWith(mesActual));
            donorsFiltrados = todosDonantes.filter(d => d.fechaDonacion && d.fechaDonacion.startsWith(mesActual));
        }

        const extraccionesTotales = muestrasFiltradas.length;
        const extraccionesProcesadas = muestrasFiltradas.filter(m => m.estado === 'Procesada').length;
        const extraccionesPendientes = extraccionesTotales - extraccionesProcesadas;

        const donantesTotales = donorsFiltrados.length;
        let donantesNoAptos = 0;

        donorsFiltrados.forEach(d => {
            const susMuestras = todasMuestras.filter(m => m.donanteCedula === d.cedula);
            const esNoApto = susMuestras.some(m => 
                m.hiv === 'Positivo' || m.sifilis === 'Positivo' || m.ch === 'Positivo' ||
                m.htlv === 'Positivo' || m.av === 'Positivo' || m.coreb === 'Positivo' || m.hcv === 'Positivo'
            );
            if (esNoApto) donantesNoAptos++;
        });

        return {
            donantesTotales, donantesAptos: donantesTotales - donantesNoAptos, donantesNoAptos,
            extraccionesTotales, extraccionesProcesadas, extraccionesPendientes
        };
    };

    const handleExportarExcel = async () => {
        const metricas = await calcularMetricasReporte();
        const hoy = new Date();
        const separador = ",";

        const csvContenido = [
            ["REPORTE GENERAL - SISTEMA HEMOTRANSF"],
            ["Periodo:", tiempoReporte.toUpperCase()],
            ["Fecha de Emision:", hoy.toLocaleDateString()],
            [],
            ["METRICA", "CANTIDAD"],
            ["Donantes Totales Registrados", metricas.donantesTotales],
            ["Donantes Clasificados como Aptos", metricas.donantesAptos],
            ["Donantes Clasificados como No Aptos", metricas.donantesNoAptos],
            ["Extracciones Totales en el Periodo", metricas.extraccionesTotales],
            ["Extracciones Procesadas", metricas.extraccionesProcesadas],
            ["Extracciones Pendientes", metricas.extraccionesPendientes]
        ].map(fila => fila.join(separador)).join("\n");

        const blob = new Blob(["\uFEFF" + csvContenido], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Reporte_Hemotransf_${tiempoReporte}_${hoy.toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleEnviarCorreo = async () => {
        if (!correoDestino) {
            alert("Por favor, ingrese un correo de destino.");
            return;
        }

        const metricas = await calcularMetricasReporte();
        
        const cuerpoCorreo = `Saludos cordiales,

Por medio de la presente se remite el reporte estadístico del Banco de Sangre correspondiente al periodo: ${tiempoReporte.toUpperCase()}.

📊 MÉTRICAS DE DONANTES
• Donantes Totales: ${metricas.donantesTotales}
• Donantes Aptos: ${metricas.donantesAptos}
• Donantes No Aptos: ${metricas.donantesNoAptos}

🩸 MÉTRICAS DE EXTRACCIONES
• Extracciones Totales: ${metricas.extraccionesTotales}
• Extracciones Procesadas: ${metricas.extraccionesProcesadas}
• Extracciones Pendientes: ${metricas.extraccionesPendientes}

Generado automáticamente por el Sistema Hemotransf.
Fecha de emisión: ${new Date().toLocaleDateString()}
Usuario responsable: ${authUser.nombre || 'Administrador'}
`;

        const enlaceMailto = `mailto:${correoDestino}?subject=Reporte Gerencial Hemotransf - ${new Date().toLocaleDateString()}&body=${encodeURIComponent(cuerpoCorreo)}`;
        window.open(enlaceMailto, '_blank');
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xl sm:text-2xl">📊</span>
                    <span className="font-bold text-lg sm:text-xl text-med-blue truncate">Sistema Hemotransf</span>
                </div>
                <button onClick={() => navigate('/')} className="text-xs sm:text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← <span className="hidden sm:inline">Volver</span>
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-r from-slate-600 to-slate-800 h-40 sm:h-48 pt-6 sm:pt-8 px-4 sm:px-6">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-5xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Resumen General</h1>
                    <p className="text-slate-200 text-sm sm:text-lg">Estadísticas, configuración y reportes gerenciales.</p>
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
                                {/* AQUÍ SE APLICA EL DICCIONARIO nombresGrupos */}
                                {Object.entries(stats.grupos).sort((a, b) => b[1] - a[1]).map(([grupo, count]) => (
                                    <div key={grupo} className="flex items-center gap-3">
                                        <span className="w-32 font-bold text-med-accent text-xs">{nombresGrupos[grupo] || grupo}</span>
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
                    {/* BLOQUE IZQUIERDO: REPORTE EXCEL (Visible para todos) */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            📑 Reporte Local (Excel)
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">Descargue el resumen estadístico a su computadora según el periodo seleccionado.</p>
                        
                        <div className="flex gap-3 mb-4 mt-auto">
                            <select 
                                value={tiempoReporte} 
                                onChange={(e) => setTiempoReporte(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
                            >
                                <option value="historico">Histórico Completo</option>
                                <option value="mes">Este Mes</option>
                                <option value="semana">Últimos 7 días</option>
                            </select>
                        </div>

                        <button onClick={handleExportarExcel} className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                            📥 Descargar Excel (.csv)
                        </button>
                    </div>

                    {/* BLOQUE DERECHO: NOTIFICAR CORREO (Con validación de candado) */}
                    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                            📧 Notificar al Ente Superior
                        </h3>
                        
                        {esAdmin ? (
                            <>
                                <p className="text-sm text-slate-500 mb-4">Envíe el resumen estadístico por correo. Utiliza el mismo periodo seleccionado a la izquierda.</p>
                                <div className="mb-4 mt-auto">
                                    <input 
                                        type="email" 
                                        value={correoDestino} 
                                        onChange={(e) => setCorreoDestino(e.target.value)}
                                        placeholder="ejemplo@ministerio.gob.ve"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
                                    />
                                </div>
                                <button onClick={handleEnviarCorreo} className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border-none cursor-pointer">
                                    ✉️ Redactar y Enviar Correo
                                </button>
                            </>
                        ) : (
                            <div className="flex-grow flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl p-6 text-center mt-2">
                                <span className="text-4xl mb-3 opacity-80">🔒</span>
                                <p className="font-bold text-slate-700">Acceso Restringido</p>
                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Solo los administradores tienen permiso para enviar notificaciones externas.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        ℹ️ Acerca del Sistema
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500">Sistema de Gestión</p>
                            <p className="font-medium">Sistema Hemotransf Pro</p>
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

            {/* MODAL LIMPIAR DATOS OCULTO/MANTENIDO POR ESTRUCTURA */}
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