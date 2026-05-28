// src/utils/data.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

supabase.from('bancos').select('*', { count: 'exact', head: true }).then(({ error }) => {
  if (error) console.error("🔴 ERROR DE CONEXIÓN A SUPABASE:", error.message);
  else console.log("🟢 CONEXIÓN A SUPABASE EXITOSA. Base de datos en línea.");
});

// ==========================================
// VALIDACIÓN EN TIEMPO REAL
// ==========================================
export async function verificarDuplicados(cedula, correo) {
  if (cedula) {
    // maybeSingle evita errores en la consola si no encuentra nada (que es lo ideal)
    const { data } = await supabase.from('donantes').select('cedula').eq('cedula', cedula).maybeSingle();
    if (data) return { existe: true, mensaje: '⚠️ Esta cédula ya pertenece a un donante.' };
  }
  if (correo && correo.trim() !== '') {
    const { data } = await supabase.from('donantes').select('correo').eq('correo', correo).maybeSingle();
    if (data) return { existe: true, mensaje: '⚠️ Este correo ya está en uso.' };
  }
  return { existe: false };
}

// ==========================================
// USUARIOS Y LOGIN
// ==========================================
export async function obtenerUsuarios() {
  const { data, error } = await supabase.from('usuarios').select(`*, bancos(nombre)`);
  if (error) return [];
  return data.map(u => ({
    id: u.id, banco: u.bancos.nombre, rol: u.rol, iniciales: u.iniciales, nombre: u.nombre, password: u.password
  }));
}

export async function guardarUsuario(usuario) {
  const { data: banco } = await supabase.from('bancos').select('id').eq('nombre', usuario.banco).single();
  const { error } = await supabase.from('usuarios').insert([{
    banco_id: banco.id, rol: usuario.rol, iniciales: usuario.iniciales, nombre: usuario.nombre, password: usuario.password
  }]);
  if (error) return { exito: false, mensaje: error.message };
  return { exito: true, mensaje: 'Hemoterapista registrado con éxito.' };
}

export async function eliminarUsuario(id) {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) return { exito: false, mensaje: 'Error al eliminar usuario.' };
  return { exito: true, mensaje: 'Hemoterapista revocado del sistema.' };
}

// ==========================================
// DONANTES
// ==========================================
export async function obtenerDonantes() {
  const { data, error } = await supabase.from('donantes').select('*');
  if (error) return [];
  return data.map(d => ({
    ...d, fechaNacimiento: d.fecha_nacimiento, grupoSanguineo: d.grupo_sanguineo, fechaDonacion: d.fecha_ultima_donacion
  }));
}

export async function guardarDonante(donante) {
  // Doble candado por si acaso
  const validacion = await verificarDuplicados(donante.cedula, donante.correo);
  if (validacion.existe) return { exito: false, mensaje: validacion.mensaje };

  const { error } = await supabase.from('donantes').insert([{
    cedula: donante.cedula, nombre: donante.nombre, apellido: donante.apellido,
    fecha_nacimiento: donante.fechaNacimiento, sexo: donante.sexo,
    telefono: donante.telefono, correo: donante.correo, direccion: donante.direccion,
    enfermedades: donante.enfermedades, embarazos: donante.embarazos 
  }]);

  if (error) return { exito: false, mensaje: 'Error al guardar en base de datos.' };
  return { exito: true, mensaje: 'Donante registrado exitosamente.' };
}

export async function actualizarDonante(cedula, datosActualizados) {
  let payload = {};
  if (datosActualizados.fechaDonacion) payload.fecha_ultima_donacion = datosActualizados.fechaDonacion;
  if (datosActualizados.grupoSanguineo || datosActualizados.grupo_sanguineo) {
      payload.grupo_sanguineo = datosActualizados.grupo_sanguineo || datosActualizados.grupoSanguineo;
  }
  if (datosActualizados.nombre) payload.nombre = datosActualizados.nombre;
  if (datosActualizados.apellido) payload.apellido = datosActualizados.apellido;
  if (datosActualizados.telefono) payload.telefono = datosActualizados.telefono;
  if (datosActualizados.enfermedades !== undefined) payload.enfermedades = datosActualizados.enfermedades;

  const { error } = await supabase.from('donantes').update(payload).eq('cedula', cedula);
  if (error) return { exito: false, mensaje: 'Error al actualizar el expediente.' };
  return { exito: true, mensaje: 'Expediente actualizado.' };
}

export async function eliminarDonante(cedula) {
  const { error } = await supabase.from('donantes').delete().eq('cedula', cedula);
  if (error) return { exito: false, mensaje: 'No se puede eliminar: tiene extracciones asociadas.' };
  return { exito: true, mensaje: 'Donante eliminado correctamente.' };
}

// ==========================================
// EXTRACCIONES Y SEROLOGÍAS
// ==========================================
export async function obtenerMuestras() {
  const { data, error } = await supabase.from('extracciones').select('*, usuarios(iniciales), bancos(nombre)');
  if (error) return [];

  return data.map(m => ({
    id: m.codigo_bolsa, codigo_bolsa: m.codigo_bolsa,
    segmento: m.segmento, // Lee directo de su columna
    donanteCedula: m.donante_cedula, tipoDonacion: m.tipo_donacion, volumen: m.volumen,
    observaciones: m.observaciones, fechaRegistro: m.fecha_registro, estado: m.estado,
    grupoSanguineo: m.grupo_sanguineo,
    hiv: m.hiv, htlv: m.htlv, ch: m.ch, av: m.av, coreb: m.coreb, hcv: m.hcv, sifilis: m.sifilis,
    fechaAnalisis: m.fecha_analisis, hemoterapistaEncargado: m.usuarios?.iniciales, bancoOrigen: m.bancos?.nombre
  }));
}

export async function guardarMuestra(muestra) {
  const { data: banco } = await supabase.from('bancos').select('id').eq('nombre', muestra.bancoOrigen).single();
  const { data: user } = await supabase.from('usuarios').select('id').eq('iniciales', muestra.hemoterapistaEncargado).eq('banco_id', banco.id).single();

  const { error } = await supabase.from('extracciones').insert([{
    codigo_bolsa: muestra.id,
    segmento: muestra.segmento || muestra.segmentoBolsa || 'N/A', // <-- A PRUEBA DE BALAS
    donante_cedula: muestra.donanteCedula,
    banco_id: banco.id, hemoterapista_id: user.id,
    tipo_donacion: muestra.tipoDonacion, volumen: parseInt(muestra.volumen) || 0,
    observaciones: muestra.observaciones, fecha_registro: muestra.fechaRegistro, estado: muestra.estado,
    volumen_st: parseInt(muestra.volumen_st) || 0, volumen_pfc: parseInt(muestra.volumen_pfc) || 0, volumen_cp: parseInt(muestra.volumen_cp) || 0
  }]);

  if (error) return { exito: false, mensaje: error.message };
  return { exito: true, mensaje: 'Extracción enviada a cuarentena con éxito.' };
}

export async function actualizarMuestra(muestra) {
  const payload = {
    estado: muestra.estado, grupo_sanguineo: muestra.grupo_sanguineo || muestra.grupoSanguineo,
    hiv: muestra.hiv, htlv: muestra.htlv, ch: muestra.ch, av: muestra.av, coreb: muestra.coreb, hcv: muestra.hcv, sifilis: muestra.sifilis,
    fecha_analisis: muestra.fecha_analisis || muestra.fechaAnalisis, observaciones: muestra.observaciones
  };
  const idBusqueda = muestra.codigo_bolsa || muestra.id;
  const { error } = await supabase.from('extracciones').update(payload).eq('codigo_bolsa', idBusqueda);
  if (error) return { exito: false, mensaje: 'Error al actualizar panel serológico.' };
  return { exito: true, mensaje: 'Resultados de laboratorio guardados.' };
}

export function calcularDiasParaDonar(ultimaDonacion) {
  if (!ultimaDonacion) return -90;
  const hoy = new Date();
  const ultima = new Date(ultimaDonacion);
  const diasTranscurridos = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));
  return 90 - diasTranscurridos;
}