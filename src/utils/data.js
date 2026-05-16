const STORAGE_KEY = 'lims_donantes';
const STORAGE_KEY_MUESTRAS = 'lims_muestras';

export function obtenerDonantes() {
  const datos = localStorage.getItem(STORAGE_KEY);
  return datos ? JSON.parse(datos) : [];
}

export function obtenerDonantePorCedula(cedula) {
  const donaciones = obtenerDonantes();
  return donaciones.find(d => d.cedula === cedula);
}

export function guardarDonante(donante) {
  const donaciones = obtenerDonantes();
  const existe = donaciones.find(d => d.cedula === donante.cedula);
  if (existe) {
    return { exito: false, mensaje: 'Ya existe un donante con esta cédula.' };
  }
  donaciones.push(donante);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donaciones));
  return { exito: true, mensaje: 'Donante registrado exitosamente.' };
}

export function actualizarDonante(cedula, datosActualizados) {
  const donaciones = obtenerDonantes();
  const indice = donaciones.findIndex(d => d.cedula === cedula);
  if (indice === -1) {
    return { exito: false, mensaje: 'Donante no encontrado.' };
  }
  donaciones[indice] = { ...donaciones[indice], ...datosActualizados };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(donaciones));
  return { exito: true, mensaje: 'Donante actualizado.' };
}

export function eliminarDonante(cedula) {
  const donaciones = obtenerDonantes();
  const filtrados = donaciones.filter(d => d.cedula !== cedula);
  if (filtrados.length === donaciones.length) {
    return { exito: false, mensaje: 'Donante no encontrado.' };
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtrados));
  return { exito: true, mensaje: 'Donante eliminado.' };
}

export function obtenerMuestras() {
  const datos = localStorage.getItem(STORAGE_KEY_MUESTRAS);
  return datos ? JSON.parse(datos) : [];
}

export function guardarMuestra(muestra) {
  const muestras = obtenerMuestras();
  muestras.push(muestra);
  localStorage.setItem(STORAGE_KEY_MUESTRAS, JSON.stringify(muestras));
  return { exito: true, mensaje: 'Muestra registrada.' };
}

export function actualizarMuestra(muestraActualizada) {
  const muestras = obtenerMuestras();
  const indice = muestras.findIndex(m => m.id === muestraActualizada.id);
  if (indice === -1) {
    return { exito: false, mensaje: 'Muestra no encontrada.' };
  }
  muestras[indice] = muestraActualizada;
  localStorage.setItem(STORAGE_KEY_MUESTRAS, JSON.stringify(muestras));
  return { exito: true, mensaje: 'Muestra actualizada.' };
}

export function obtenerMuestraPorId(id) {
  const muestras = obtenerMuestras();
  return muestras.find(m => m.id === id);
}

export function eliminarMuestra(id) {
  const muestras = obtenerMuestras();
  const filtradas = muestras.filter(m => m.id !== id);
  if (filtradas.length === muestras.length) {
    return { exito: false, mensaje: 'Muestra no encontrada.' };
  }
  localStorage.setItem(STORAGE_KEY_MUESTRAS, JSON.stringify(filtradas));
  return { exito: true, mensaje: 'Muestra eliminada.' };
}

export function calcularDiasParaDonar(ultimaDonacion) {
  if (!ultimaDonacion) return -90;
  const hoy = new Date();
  const ultima = new Date(ultimaDonacion);
  const diasTranscurridos = Math.floor((hoy - ultima) / (1000 * 60 * 60 * 24));
  return 90 - diasTranscurridos;
}