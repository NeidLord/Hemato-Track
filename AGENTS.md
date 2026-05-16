# AGENTS.md

## Commands

- `pnpm dev` - Start dev server
- `pnpm build` - Production build
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview build

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS v4
- React Router v7 (not v6)
- ESLint 9 (flat config)
- No TypeScript (plain JSX)

## Architecture

- Entry: `src/main.jsx` - BrowserRouter wraps App
- Auth: localStorage key `lims_auth` (boolean string)
- Routes: `/login`, `/`, `/buscar`, `/registrar`, `/serologias`, `/notificar`, `/ajustes`
- Protected routes: `<RutaProtegida>` component wraps authenticated pages
- Data storage: localStorage (`lims_donantes`, `lims_muestras`)

## Data Schema

### Donor (lims_donantes)
```json
{
  "cedula": "string",
  "nombre": "string",
  "apellido": "string",
  "correo": "string",
  "direccion": "string",
  "fechaNacimiento": "date",
  "edad": "number",
  "sexo": "Masculino|Femenino",
  "telefono": "string",
  "peso": "number",
  "altura": "number",
  "tieneTatuajes": "si|no",
  "medicamentos": "si|no",
  "cirugias": "si|no",
  "enfermedades": "string",
  "fechaDonacion": "date",
  "grupoSanguineo": "A+|A-|B+|B-|AB+|AB-|O+|O-"
}
```

### Muestra (lims_muestras)
```json
{
  "id": "string (codigoBolsa)",
  "donanteCedula": "string",
  "donanteNombre": "string",
  "codigoBolsa": "string",
  "tipoDonacion": "Sangre Total|Plaquetoféresis|Plasmaféresis",
  "volumen": "number",
  "observaciones": "string",
  "fechaRegistro": "date",
  "estado": "Pendiente|Procesada",
  "grupoSanguineo": "A+|A-|B+|B-|AB+|AB-|O+|O-",
  "vih": "Negativo|Positivo",
  "sifilis": "Negativo|Positivo",
  "chagas": "Negativo|Positivo",
  "fechaAnalisis": "date"
}
```

## Pages

- `/` - Dashboard principal con 4 módulos
- `/buscar` - Buscar donante por cédula, ver historial, registrar extracciones
- `/registrar` - Registrar nuevo donante con datos médicos
- `/serologias` - Cargar resultados de laboratorio por código de bolsa
- `/notificar` - Lista de donors para notificar, filtros por estado
- `/ajustes` - Estadísticas, exportación, limpieza de datos

## Tailwind v4

Uses custom theme colors defined in `src/index.css`:
- `med-blue`, `med-accent`, etc. (not standard Tailwind)