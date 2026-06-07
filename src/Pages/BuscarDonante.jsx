// src/Pages/BuscarDonante.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerDonantes, obtenerMuestras, guardarMuestra, calcularDiasParaDonar, eliminarDonante, actualizarDonante } from '../utils/data';

function BuscarDonante({ usuarioLogeado }) {
    const navigate = useNavigate();
    
    const authUser = usuarioLogeado || JSON.parse(localStorage.getItem('lims_auth_user')) || {};
    const esAdmin = authUser.rol === 'admin';

    const [cedula, setCedula] = useState('');
    const [filtroGrupo, setFiltroGrupo] = useState('');
    
    const [donante, setDonante] = useState(null); 
    const [listaDonantes, setListaDonantes] = useState([]); 
    const [donanteExpandido, setDonanteExpandido] = useState(null); 
    const [error, setError] = useState('');

    const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
    const [donanteEdit, setDonanteEdit] = useState({});

    const [mostrarModalMuestra, setMostrarModalMuestra] = useState(false);
    const [datosMuestra, setDatosMuestra] = useState({
        codigoBolsa: '', segmentoBolsa: '',
        tipoDonacion: ['Sangre Total'],
        volumenes: { 'Sangre Total': '450' },
        observaciones: '',
        fechaRegistro: new Date().toISOString().split('T')[0] // NUEVO: Fecha Editable
    });

    const nombresGrupos = {
        'O+': 'O RH Positivo', 'O-': 'O RH Negativo',
        'A+': 'A RH Positivo', 'A-': 'A RH Negativo',
        'B+': 'B RH Positivo', 'B-': 'B RH Negativo',
        'AB+': 'AB RH Positivo', 'AB-': 'AB RH Negativo'
    };

    const handleBuscar = async (e) => {
        if (e) e.preventDefault();
        setError('');
        setDonante(null);
        setListaDonantes([]);
        setDonanteExpandido(null);

        const donantes = await obtenerDonantes();

        if (filtroGrupo) {
            const filtrados = donantes.filter(d => d.grupoSanguineo === filtroGrupo);
            if (filtrados.length > 0) {
                setListaDonantes(filtrados);
            } else {
                setError(`No hay donantes registrados con el grupo ${nombresGrupos[filtroGrupo] || filtroGrupo}.`);
            }
        } 
        else if (cedula) {
            const terminoCedula = cedula.trim();
            const donanteEncontrado = donantes.find(d => d.cedula === terminoCedula);
            
            if (donanteEncontrado) {
                const diasParaDonar = calcularDiasParaDonar(donanteEncontrado.fechaDonacion, donanteEncontrado.sexo);
                const todasLasMuestras = await obtenerMuestras();
                const muestrasDonante = todasLasMuestras.filter(m => m.donanteCedula === terminoCedula);
                const muestraProcesada = muestrasDonante.find(m => m.estado === 'Procesada');
                const grupoSanguineo = donanteEncontrado.grupoSanguineo || muestraProcesada?.grupoSanguineo;

                const esNoApto = muestrasDonante.some(m => 
                    m.hiv === 'Positivo' || m.sifilis === 'Positivo' || m.ch === 'Positivo' ||
                    m.htlv === 'Positivo' || m.av === 'Positivo' ||
                    m.coreb === 'Positivo' || m.hcv === 'Positivo'
                );

                setDonante({ ...donanteEncontrado, diasParaDonar, historial: muestrasDonante, grupoSanguineo, esNoApto });
            } else {
                setError('Donante no encontrado en el sistema.');
            }
        } else {
            setError('Por favor ingrese una cédula o seleccione un grupo sanguíneo.');
        }
    };

    const abrirModalEditar = () => {
        setDonanteEdit({ ...donante });
        setMostrarModalEditar(true);
    };

    const handleCambioEdit = (e) => {
        const { name, value } = e.target;
        setDonanteEdit(prev => ({ ...prev, [name]: value }));
    };

    const handleGuardarEdicion = async (e) => {
        e.preventDefault();
        await actualizarDonante(donante.cedula, donanteEdit);
        alert('Datos actualizados correctamente.');
        setMostrarModalEditar(false);
        setDonante({ ...donante, ...donanteEdit });
    };

    const handleGuardarMuestra = async (e) => {
        e.preventDefault();
        
        if (datosMuestra.tipoDonacion.length === 0) {
            alert('Debe seleccionar al menos un fraccionamiento.');
            return;
        }

        for (let tipo of datosMuestra.tipoDonacion) {
            if (!datosMuestra.volumenes[tipo] || datosMuestra.volumenes[tipo] <= 0) {
                alert(`⚠️ Ingrese un volumen válido para: ${tipo}`);
                return;
            }
        }

        const tiposFormateados = datosMuestra.tipoDonacion.map(t => `${t} (${datosMuestra.volumenes[t]}cc)`).join(', ');

        const muestra = {
            id: datosMuestra.codigoBolsa.trim().toUpperCase(),
            segmento: datosMuestra.segmentoBolsa.trim().toUpperCase(),
            donanteCedula: donante.cedula,
            donanteNombre: donante.nombre,
            tipoDonacion: tiposFormateados,
            volumen: parseInt(datosMuestra.volumenes['Sangre Total']) || 0,
            volumen_st: parseInt(datosMuestra.volumenes['Concentrado Globular']) || 0,
            volumen_pfc: parseInt(datosMuestra.volumenes['Plasma Fresco Congelado']) || 0,
            volumen_cp: parseInt(datosMuestra.volumenes['Concentrado Plaquetario']) || 0,
            observaciones: datosMuestra.observaciones,
            fechaRegistro: datosMuestra.fechaRegistro, // NUEVO: Fecha personalizada
            estado: 'Pendiente',
            bancoOrigen: authUser?.banco || 'Desconocido', 
            hemoterapistaEncargado: authUser?.iniciales || 'Admin' 
        };
        
        await guardarMuestra(muestra);
        await actualizarDonante(donante.cedula, { fechaDonacion: muestra.fechaRegistro });

        alert(`Extracción registrada en cuarentena.`);
        setMostrarModalMuestra(false);
        setDonante(null);
        setListaDonantes([]);
        setCedula('');
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

    const handleEliminar = async (idCedula) => {
        if (confirm('¿Está seguro que desea eliminar este donante?')) {
            const resultado = await eliminarDonante(idCedula);
            if (resultado.exito) {
                alert(resultado.mensaje);
                setDonante(null); setCedula('');
            } else {
                alert(resultado.mensaje);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-8">
            <nav className="bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🩸</span>
                    <span className="font-bold text-lg text-med-blue">Sistema Hemato-Track</span>
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-medium text-slate-500 hover:text-med-blue bg-transparent border-none cursor-pointer">
                    ← Volver
                </button>
            </nav>

            <div className="relative overflow-hidden bg-gradient-to-br from-med-blue to-blue-950 h-56 pt-10 px-4">
                <div className="absolute inset-0 bg-panal-ligero bg-repeat opacity-100 pointer-events-none"></div>
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-white mb-2">Módulo de Trazabilidad</h1>
                    <p className="text-blue-100 text-lg">Busque o filtre donantes en el sistema.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-0">
                <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-100 mb-8">
                    <form onSubmit={handleBuscar} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center sm:items-end">
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Búsqueda Directa (C.I)</label>
                            <input 
                                type="text" 
                                value={cedula} 
                                onChange={(e) => { setCedula(e.target.value.trim()); setFiltroGrupo(''); }} 
                                placeholder="Ej. 1234567" 
                                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-blue text-base sm:text-lg" 
                            />
                        </div>
                        
                        <div className="flex items-center justify-center font-bold text-slate-300 py-1 sm:pb-4 sm:px-1 w-full sm:w-auto">
                            O
                        </div>
                        
                        <div className="flex-grow w-full">
                            <label className="block text-xs sm:text-sm font-semibold text-slate-600 mb-1 sm:mb-2">Filtrar por Grupo</label>
                            <select 
                                value={filtroGrupo} 
                                onChange={(e) => { setFiltroGrupo(e.target.value); setCedula(''); }} 
                                className="w-full px-4 py-3 sm:py-3.5 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-med-blue text-base sm:text-lg bg-white font-medium"
                            >
                                <option value="">Seleccione grupo...</option>
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
                        <button id="btn-buscar-principal" type="submit" className="w-full sm:w-auto mt-2 sm:mt-0 bg-med-blue hover:bg-blue-800 text-white font-bold py-3 sm:py-3.5 px-8 rounded-xl shadow-md border-none cursor-pointer h-[50px] sm:h-[56px] whitespace-nowrap">
                            Buscar
                        </button>
                    </form>

                    {error && (
                        <div className="mt-6 bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <span className="text-2xl">⚠️</span>
                                <div><p className="font-bold">{error}</p></div>
                            </div>
                            <button onClick={() => navigate('/registrar')} className="w-full sm:w-auto bg-med-blue text-white font-bold py-2.5 px-6 rounded-xl border-none cursor-pointer">
                                + Registrar Nuevo
                            </button>
                        </div>
                    )}
                </div>

                {listaDonantes.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 mb-8">
                        <div className="flex justify-between items-end border-b border-slate-200 pb-2 mb-4">
                            <h3 className="text-lg font-bold text-slate-700">Donantes Compatibles ({listaDonantes.length})</h3>
                            <span className="text-sm font-bold text-med-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Filtro: {filtroGrupo}</span>
                        </div>

                        {listaDonantes.map(d => (
                            <div key={d.cedula} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                                <div 
                                    className="p-4 sm:px-6 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                                    onClick={() => setDonanteExpandido(donanteExpandido === d.cedula ? null : d.cedula)}
                                >
                                    <div className="flex-grow">
                                        <h4 className="font-bold text-slate-800 text-lg uppercase">{d.nombre} {d.apellido}</h4>
                                        <p className="text-sm text-slate-500 font-medium tracking-wide">C.I: {d.cedula}</p>
                                    </div>
                                    <div className="flex items-center gap-4 sm:gap-6">
                                        <span className="bg-rose-100 text-med-accent px-4 py-1.5 rounded-lg font-black border border-rose-200 text-lg shadow-sm">
                                            {d.grupoSanguineo}
                                        </span>
                                        <span className="text-slate-400 text-xl font-bold bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center">
                                            {donanteExpandido === d.cedula ? '▲' : '▼'}
                                        </span>
                                    </div>
                                </div>

                                {donanteExpandido === d.cedula && (
                                    <div className="bg-slate-50 p-4 sm:px-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top-2">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm text-slate-500 font-medium mb-0.5">Última Donación Registrada</p>
                                            <p className={`font-bold text-lg ${d.fechaDonacion ? 'text-slate-800' : 'text-amber-600'}`}>
                                                {d.fechaDonacion ? `🗓️ ${d.fechaDonacion}` : '⚠️ Sin registro previo'}
                                            </p>
                                        </div>
                                        <div className="w-full sm:w-auto">
                                            {!d.fechaDonacion ? (
                                                <button 
                                                    onClick={() => {
                                                        setDonante(d); 
                                                        setMostrarModalMuestra(true);
                                                    }}
                                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl border-none cursor-pointer shadow-md transition-all active:scale-95"
                                                >
                                                    + Registrar Donación
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        setFiltroGrupo('');
                                                        setCedula(d.cedula);
                                                        setTimeout(() => document.getElementById('btn-buscar-principal').click(), 50);
                                                    }}
                                                    className="w-full sm:w-auto bg-med-blue hover:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl border-none cursor-pointer shadow-md transition-all active:scale-95"
                                                >
                                                    Ver Expediente Clínico ➔
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* EXPEDIENTE COMPLETO */}
                {donante && listaDonantes.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-slate-50 border-b border-slate-200 p-5 sm:px-8 sm:py-5 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
                            <div className="text-center sm:text-left">
                                <h3 className="font-bold text-2xl text-slate-800">{donante.nombre} {donante.apellido}</h3>
                                <p className="text-slate-500 font-medium">C.I: {donante.cedula}</p>
                            </div>
                            <div className="text-center sm:text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Grupo Sanguíneo</p>
                                <span className="bg-rose-100 text-med-accent px-4 py-1.5 rounded-lg text-lg font-black border border-rose-200 inline-block">
                                    {nombresGrupos[donante.grupoSanguineo] || donante.grupoSanguineo || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {esAdmin && (
                            <div className="px-4 sm:px-8 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row justify-center sm:justify-end gap-2 sm:gap-4">
                                <button onClick={abrirModalEditar} className="text-slate-600 hover:text-med-blue text-sm font-bold flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer p-2">
                                    ✏️ Editar Datos
                                </button>
                                <button onClick={() => handleEliminar(donante.cedula)} className="text-red-600 hover:text-red-800 text-sm font-bold flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer p-2">
                                    🗑️ Eliminar Donante
                                </button>
                            </div>
                        )}

                        <div className="p-5 sm:p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    {/* SECCIÓN NUEVA: MÁS DATOS DEL EXPEDIENTE */}
                                    <h4 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-100 pb-2">Datos Demográficos</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Fecha Nac.</p>
                                            <p className="font-semibold text-slate-800">{donante.fechaNacimiento || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Teléfono</p>
                                            <p className="font-semibold text-slate-800">{donante.telefono || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-slate-500 font-medium">Correo Electrónico</p>
                                            <p className="font-semibold text-slate-800">{donante.correo || donante.email || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-sm text-slate-500 font-medium">Dirección</p>
                                            <p className="font-semibold text-slate-800">{donante.direccion || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <h4 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-100 pb-2 pt-2">Información Clínica</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Sexo</p>
                                            <p className="font-semibold text-slate-800">{donante.sexo}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-500 font-medium">Última Donación</p>
                                            <p className="font-semibold text-slate-800">{donante.fechaDonacion || 'N/A'}</p>
                                        </div>
                                        {donante.sexo === 'Femenino' && donante.embarazos && (
                                            <div className="col-span-2">
                                                <p className="text-sm text-slate-500 font-medium">Embarazos previos</p>
                                                {donante.embarazos === 'Sí' ? (
                                                    <p className="font-bold text-red-600 bg-red-50 p-1.5 rounded inline-block">⚠️ Multípara (Restricción Plasma TRALI)</p>
                                                ) : (
                                                    <p className="font-semibold text-slate-800">No (Nulípara)</p>
                                                )}
                                            </div>
                                        )}
                                        {donante.enfermedades && (
                                            <div className="col-span-2">
                                                <p className="text-sm text-slate-500 font-medium">Enfermedades</p>
                                                <p className="font-semibold text-slate-800">{donante.enfermedades}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center">
                                    {donante.esNoApto ? (
                                        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl text-center">
                                            <span className="text-3xl mb-2">🚫</span>
                                            <p className="text-red-800 font-bold text-lg mb-1">NO APTO DEFINITIVO</p>
                                            <p className="text-red-600 text-sm">Serología reactiva detectada en historial.</p>
                                        </div>
                                    ) : (!donante.fechaDonacion || donante.diasParaDonar <= 0) ? (
                                        <div className="bg-emerald-50 border-2 border-emerald-200 p-6 rounded-xl text-center">
                                            <span className="text-3xl mb-2">✅</span>
                                            <p className="text-emerald-800 font-bold text-lg mb-1">Apto para donar</p>
                                            <p className="text-emerald-600 text-sm mb-4">Puede registrar una nueva extracción.</p>
                                            <button onClick={() => setMostrarModalMuestra(true)} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg border-none cursor-pointer">
                                                Registrar Extracción
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-xl text-center">
                                            <span className="text-3xl mb-2">⏳</span>
                                            <p className="text-amber-800 font-bold text-lg mb-1">En periodo de ventana</p>
                                            <p className="text-amber-700 text-sm">Faltan <strong className="text-amber-900 text-lg mx-1">{donante.diasParaDonar} días</strong>.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {donante.historial && donante.historial.length > 0 && (
                                <div className="border-t border-slate-200 pt-6">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase border-b border-slate-100 pb-2 mb-4">Historial de Extracciones</h4>
                                    <div className="space-y-3">
                                        {donante.historial.map((m, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                                <div className="flex flex-col sm:flex-row justify-between mb-2 gap-1 sm:gap-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="font-mono font-bold text-sm text-slate-800">S:{m.id} / Seg:{m.segmento || 'N/A'}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${m.estado === 'Procesada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {m.estado || 'Pendiente'}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-slate-500">{m.fechaRegistro}</span>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                                                    <div className="sm:col-span-2">
                                                        <p className="text-slate-400">Fraccionamiento</p>
                                                        <p className="font-medium text-slate-700">{m.tipoDonacion}</p>
                                                    </div>
                                                    <div className="sm:col-span-4 mt-2">
                                                        <p className="text-slate-400 mb-1">Marcadores Serológicos</p>
                                                        <div className="flex flex-wrap gap-2 sm:gap-3">
                                                            {[
                                                                { key: 'hiv', label: 'VIH' }, { key: 'htlv', label: 'HTLV' },
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

            {/* Modal Editar */}
            {mostrarModalEditar && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <h3 className="font-bold text-xl mb-4">Editar Datos del Donante</h3>
                        <form onSubmit={handleGuardarEdicion} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><label className="block text-xs font-bold mb-1">Nombre</label><input type="text" name="nombre" value={donanteEdit.nombre} onChange={handleCambioEdit} className="w-full p-2 border rounded" required /></div>
                                <div><label className="block text-xs font-bold mb-1">Apellido</label><input type="text" name="apellido" value={donanteEdit.apellido} onChange={handleCambioEdit} className="w-full p-2 border rounded" required /></div>
                                <div><label className="block text-xs font-bold mb-1">Teléfono</label><input type="text" name="telefono" value={donanteEdit.telefono} onChange={handleCambioEdit} className="w-full p-2 border rounded" /></div>
                                <div><label className="block text-xs font-bold mb-1">Cédula (Cuidado)</label><input type="text" name="cedula" value={donanteEdit.cedula} onChange={handleCambioEdit} className="w-full p-2 border rounded bg-slate-100" readOnly /></div>
                                <div className="sm:col-span-2"><label className="block text-xs font-bold mb-1">Enfermedades / Notas</label><textarea name="enfermedades" value={donanteEdit.enfermedades} onChange={handleCambioEdit} className="w-full p-2 border rounded"></textarea></div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setMostrarModalEditar(false)} className="px-4 py-2 border rounded text-slate-600 bg-white cursor-pointer">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-med-blue text-white rounded font-bold cursor-pointer">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Muestra */}
            {mostrarModalMuestra && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-5 sm:p-6 overflow-y-auto max-h-[95vh]">
                        <h3 className="font-bold text-xl mb-4">Registro de Muestra</h3>
                        <form onSubmit={handleGuardarMuestra} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1">Serial Bolsa *</label>
                                        <input 
                                            type="text" 
                                            name="codigoBolsa" 
                                            value={datosMuestra.codigoBolsa} 
                                            onChange={(e) => setDatosMuestra({...datosMuestra, codigoBolsa: e.target.value.toUpperCase()})} 
                                            maxLength="50" 
                                            required 
                                            className="w-full p-3 border rounded-xl uppercase font-mono bg-blue-50" 
                                            placeholder="BOL-X99"
                                        />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Segmento *</label>
                                        <input 
                                            type="text" 
                                            name="segmentoBolsa" 
                                            value={datosMuestra.segmentoBolsa} 
                                            onChange={(e) => setDatosMuestra({...datosMuestra, segmentoBolsa: e.target.value.toUpperCase()})} 
                                            maxLength="50" 
                                            required 
                                            className="w-full p-3 border rounded-xl uppercase" 
                                            placeholder="Ej. 1A"
                                        />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1">Fecha Extracción *</label>
                                    <input type="date" name="fechaRegistro" value={datosMuestra.fechaRegistro} onChange={(e) => setDatosMuestra({...datosMuestra, fechaRegistro: e.target.value})} required className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-med-blue" />
                                </div>
                            </div>

                            <div className="border p-4 rounded-xl bg-slate-50">
                                <label className="block text-sm font-bold mb-3">Fraccionamiento y Volumen (cc/ml) *</label>
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
                                                    placeholder="cc/ml" 
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
                                <label className="block text-xs font-bold mb-1">Observaciones</label>
                                    <textarea 
                                        name="observaciones" 
                                        value={datosMuestra.observaciones} 
                                        onChange={(e) => setDatosMuestra({...datosMuestra, observaciones: e.target.value})} 
                                        rows="2" 
                                        maxLength="50" 
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-med-blue resize-none"
                                    ></textarea>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setMostrarModalMuestra(false)} className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-xl text-slate-600 cursor-pointer border-none bg-transparent">Cancelar</button>
                                <button type="submit" className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-emerald-600 text-white rounded-xl font-bold cursor-pointer border-none">A Cuarentena</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BuscarDonante;