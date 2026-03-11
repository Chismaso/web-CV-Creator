# CV – Ismael Pallol Karachtit · Documentación del proyecto

> **IMPORTANTE:** Este archivo es la referencia definitiva del proyecto.
> Antes de modificar cualquier archivo, consultar este documento para no alterar contenido, estructura o lógica ya establecida.

---

## Estructura de archivos

```
cv-Ismael/
├── index.html          ← Única página del CV
├── styles.css          ← Todos los estilos
├── img/
│   └── foto cv profesional.png   ← Foto de perfil (NO renombrar)
└── PROYECTO.md         ← Este archivo
```

---

## Contenido fijo (NO modificar nunca)

El siguiente contenido está fijado por el usuario y **no debe modificarse** bajo ninguna circunstancia, ni por refactoring, ni por mejoras, ni por ningún otro motivo:

### Identidad
- **Nombre:** Ismael Pallol
- **Subtítulo:** DISEÑADOR GRÁFICO Y DESARROLLADOR WEB
- **Bio:** "Diseñador gráfico y desarrollador web con experiencia en diseño visual, UX/UI y desarrollo de aplicaciones. Combino creatividad y pensamiento técnico para crear productos digitales funcionales, accesibles y visualmente cuidados. Me caracterizo por mi capacidad para resolver problemas, aprender rápido y trabajar con enfoque en resultados. Busco aportar valor creando experiencias que sean claras para el usuario y eficientes para el negocio."

### Contacto
- Email: pk_ismael@hotmail.com
- Teléfono: 696 339 629
- Ubicación: Madrid, España
- LinkedIn: https://www.linkedin.com/in/ismaelpallolkarachtit/
- GitHub: https://github.com/Chismaso

### Secciones (orden y nombres exactos)
1. **Educación** (columna izquierda)
2. **Experiencia Laboral** (columna izquierda)
3. **Skills** (columna derecha)
4. **Soft Skills** (columna derecha)
5. **Proyectos Personales** (columna derecha)
6. **Formación Complementaria** (columna derecha)
7. **Idiomas** (columna derecha)
8. **Intereses** (columna derecha)

### Educación
- **Ciclo Formativo de Grado Superior de Desarrollo de Aplicaciones Web**
  - Centro: The Core Entertainment Science School
  - Fecha: 09/2023 – 01/2026 · Tres Cantos, Madrid
  - Label: Enfoque del programa
  - Nota: Formación enfocada en desarrollo web completo: frontend, backend, bases de datos, despliegue y diseño de interfaces con tecnologías modernas.

- **Ciclo Formativo de Grado Superior de Diseño y Edición de Publicaciones Impresas y Multimedia**
  - Centro: IES Islas Filipinas
  - Fecha: 09/2016 – 06/2018 · Madrid
  - Label: Enfoque del programa
  - Nota: Formación en diseño visual y producción gráfica para medios impresos y digitales, incluyendo maquetación, tipografía y tratamiento de imágenes.

### Experiencia Laboral
- **Desarrollador Full Stack (Prácticas DAW)**
  - Empresa: The Core Entertainment Science School
  - Fecha: 09/2025 – 01/2026 · Madrid
  - Descripción: Escuela de formación especializada en tecnología, diseño y comunicación digital.
  - Tarea: Aplicación completa para gestión de préstamos de material (UX/UI, frontend, backend, Supabase, producción)

- **Diseñador Gráfico y Operador (Prácticas Diseño y Edición de Publicaciones Impresas y Multimedia)**
  - Empresa: PROMOSEDICOM
  - Fecha: 01/2018 – 12/2018 · Alcobendas, Madrid
  - Descripción: Empresa española dedicada a servicios publicitarios, marketing directo y creatividad.
  - Tarea: Adaptación de diseños, impresión y empaquetado

### Skills (chips/tags — `id="tags-skills"`)
JavaScript · TypeScript · React · UX/UI · Figma · Adobe Photoshop · Illustrator · PostgreSQL · Herramientas de IA para diseño y código

### Soft Skills (chips/tags — `id="tags-softskills"`)
Comunicación clara · Pensamiento creativo · Resolución de problemas · Trabajo en equipo · Autonomía y capacidad de aprendizaje

### Proyectos Personales
- **UnieRnt – Web de préstamo de material escolar** (09/2025 – 01/2026)
  - Full stack: UX/UI, Supabase, RLS, Vercel. Catálogo, reservas, panel admin.

### Formación Complementaria
- **Diploma en Diseño Gráfico Multimedia – Deusto Formación** (05/2015 – 05/2016)
  - 200 horas · Google AdWords Seminar Leader · Calificación: Sobresaliente

### Idiomas
- Español — Nativo o Bilingüe
- Inglés — Dominio Profesional de Trabajo

### Intereses (chips/tags — `id="tags-intereses"`)
Creatividad visual · Diseño e ilustración · IA generativa · Nuevas tecnologías · Viajar · Skateboarding

---

## Diseño y estilos

### Paleta de colores (CSS variables en `:root`)
| Variable | Valor | Uso |
|---|---|---|
| `--accent` | `#1a7ba7` | Títulos de sección, iconos, botones |
| `--text-dark` | `#2c2c2c` | Texto principal |
| `--text-mid` | `#555555` | Texto secundario / body |
| `--text-light` | `#888888` | Fechas, ubicaciones, etiquetas |
| `--bg-contact` | `#f0f0f0` | Fondo barra de contacto |
| `--bg-tag` | `#e2e2e2` | Fondo chips/tags |
| `--border` | `#e0e0e0` | Separadores |

### Tipografía
- Fuente: **Inter** (Google Fonts) · fallback: Roboto, sans-serif
- Tamaños controlados mediante CSS variables (`--fs-*`), ajustables con el panel de tamaño de texto

### Layout
- Ancho máximo del contenedor: **880px**, centrado en página
- **Header:** foto circular (115×115px) + nombre + subtítulo + bio
- **Barra de contacto:** fondo gris `#f0f0f0`, grid 2 columnas con iconos Font Awesome
- **Cuerpo:** 2 columnas — izquierda 54% (borde derecho) / derecha 46%
- **Responsive:** ≤ 660px → layout de 1 columna

### Print / PDF A4
- `@page { size: A4 portrait; margin: 0; }`
- `.cv-container` se escala con `transform: scale(0.78)` para caber en un folio
- La barra de botones y controles de edición se ocultan al imprimir

---

## Funcionalidades JavaScript

### 1. Panel de tamaño de texto
- Botón "Tamaño de texto" → abre panel flotante con sliders
- Variables CSS controladas: `--fs-name`, `--fs-subtitle`, `--fs-bio`, `--fs-section`, `--fs-item-title`, `--fs-institution`, `--fs-body`, `--fs-meta`
- Persiste en `localStorage` bajo clave `cv-fonts`
- Botón "Restablecer" vuelve a los defaults

### 2. Modo edición de texto
- Botón "Editar texto" (verde) → activa `contenteditable` en todos los elementos de texto
- Al guardar: elimina `contenteditable`, persiste contenido
- **Sistema de claves estables** (`data-key`): basado en clase CSS + índice entre hermanos de la misma clase (ej. `section-title__0`). **NO usar índices posicionales globales** — causa corrupción de datos al cambiar el DOM
- Versión activa del storage: **`cv-content-v3`** (al cambiar el DOM, incrementar la versión para descartar datos stale)
- Auto-guardado mientras se escribe (debounce 600ms)
- Enter bloqueado en `h1, h2, h3, span` para evitar saltos

### 3. Edición de tags (Skills / Soft Skills / Intereses)
- Al activar modo edición: cada chip muestra botón `×` para eliminar + botón "+ Añadir" al final del grupo
- IDs de los contenedores: `tags-skills`, `tags-softskills`, `tags-intereses`
- Persiste en `localStorage` bajo clave `cv-tags`
- Los botones × y + se ocultan al imprimir

---

## Reglas para futuras modificaciones

1. **Nunca cambiar el contenido de texto del CV** (nombres, fechas, descripciones) a menos que el usuario lo pida explícitamente.
2. **Nunca cambiar el orden ni los nombres de las secciones.**
3. **Si se añaden nuevos elementos editables al DOM**, incrementar `CONTENT_VER` en el JS (actualmente `v3`) para evitar corrupción de localStorage.
4. **No alterar los IDs** `tags-skills`, `tags-softskills`, `tags-intereses` — son usados por el JS de edición de tags.
5. **No cambiar las CSS variables `--accent`, `--text-dark`, etc.** salvo que el usuario pida cambiar la paleta.
6. **La foto de perfil** está en `img/foto cv profesional.png` — no renombrar ni mover.
7. **El factor de escala de impresión** es `scale(0.78)` en `.cv-container` dentro de `@media print`. Ajustar solo si el usuario pide que entre/salga más contenido del folio.
