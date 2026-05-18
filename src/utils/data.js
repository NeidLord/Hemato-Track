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



// ... (tu código anterior queda intacto arriba) ...

// --- NUEVA LÓGICA DE USUARIOS ---
const STORAGE_KEY_USUARIOS = 'lims_usuarios';

// Crea los administradores por defecto si es la primera vez que se abre el sistema
export function inicializarUsuarios() {
  if (!localStorage.getItem(STORAGE_KEY_USUARIOS)) {
    const usuarios = [
      { id: 'admin1', iniciales: 'ADMIN', nombre: 'Admin Lorenzo Hands', rol: 'admin', banco: 'Banco de Sangre Dr. Loranzo Hands', password: 'admin' },
      { id: 'admin2', iniciales: 'ADMIN', nombre: 'Admin Miguel Patetta', rol: 'admin', banco: 'Banco de Sangre Dr. Miguel Patetta', password: 'admin' },
      { id: 'admin3', iniciales: 'ADMIN', nombre: 'Admin José Luis Pérez', rol: 'admin', banco: 'Banco de Sangre Dr. José Luis Pérez', password: 'admin' }
    ];
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  }
}

export function obtenerUsuarios() {
  inicializarUsuarios();
  const datos = localStorage.getItem(STORAGE_KEY_USUARIOS);
  return datos ? JSON.parse(datos) : [];
}

export function guardarUsuario(usuario) {
  const usuarios = obtenerUsuarios();
  // Validar que no se repitan las iniciales en el mismo banco
  const existe = usuarios.find(u => u.iniciales.toLowerCase() === usuario.iniciales.toLowerCase() && u.banco === usuario.banco);
  if (existe) {
    return { exito: false, mensaje: 'Ya existe un hemoterapista con esas iniciales en este banco.' };
  }

  usuario.id = Date.now().toString();
  usuarios.push(usuario);
  localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios));
  return { exito: true, mensaje: 'Hemoterapista registrado con éxito.' };
}

export function eliminarUsuario(id) {
  const usuarios = obtenerUsuarios();
  const filtrados = usuarios.filter(u => u.id !== id);
  localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(filtrados));
  return { exito: true, mensaje: 'Hemoterapista eliminado del sistema.' };
}