# Sistema de Maquetación Guiada por Botones - BookMaster

## Visión General

BookMaster ahora incluye un sistema completo de maquetación guiada por botones que permite a los usuarios crear libros profesionales sin preocuparse por márgenes, formato o estructura. El sistema aplica automáticamente los estándares editoriales profesionales.

## Flujo de Trabajo

### 1. Crear Proyecto
- Usuario crea un nuevo proyecto con título, subtítulo y autor
- Sistema inicializa la estructura del libro

### 2. Agregar Portada
- **Botón: "Agregar Portada"**
- Sube imagen de fondo
- Posiciona título y autor visualmente con el mouse
- Ajusta tamaño de fuente y color
- Sistema guarda las coordenadas exactas

### 3. Páginas Preliminares (Automáticas)
El sistema genera automáticamente:
- **Página 1**: Cortesía (en blanco)
- **Página 2**: Biografía del autor (opcional, botón "Biografía del Autor")
- **Página 3**: Título del libro
- **Página 4**: Créditos (ISBN, copyright, editorial)
- **Página 5**: Título + Autor
- **Página 6**: Cortesía (en blanco)
- **Página 7**: Dedicatoria (botón "Dedicatoria")
- **Página 8**: Cortesía (en blanco)
- **Página 9**: Índice o inicio del libro

### 4. Agregar Contenido
**Botones Contextuales según el Estado:**

#### A Nivel de Proyecto:
- **"Agregar Nuevo Capítulo"**: Crea un nuevo capítulo numerado automáticamente
- **"Agregar Agradecimientos"**: Añade sección de agradecimientos

#### Dentro de un Capítulo:
- **"Agregar Título"**: Añade título del capítulo (H1)
- **"Agregar Texto/Párrafos"**: Abre editor de texto enriquecido
- **"Agregar Subcapítulo H2"**: Añade subcapítulo de nivel 2
- **"Agregar Subtítulo H3"**: Añade subtítulo de nivel 3
- **"Agregar Ejemplo"**: Inserta un cuadro de ejemplo con formato especial
- **"Agregar Referencia"**: Añade una referencia bibliográfica

#### Dentro del Editor de Texto:
- **"Lista"**: Inserta lista numerada o con viñetas
- **"Tabla"**: Inserta tabla
- **"Cita"**: Inserta cita destacada

### 5. Formato Automático

El sistema aplica automáticamente:
- **Márgenes profesionales**: Interior más ancho que exterior (efecto espejo)
- **Sangrado de párrafo**: 0.5-1 cm automático
- **Espaciado**: Consistente entre títulos y texto
- **Numeración**: Capítulos numerados automáticamente
- **Páginas impares**: Capítulos siempre empiezan en página impar
- **Páginas de cortesía**: Insertadas automáticamente

### 6. Exportar a PDF

El sistema genera PDF profesional con:
- Estructura completa de páginas preliminares
- Numeración correcta (solo desde página 9)
- Márgenes simétricos
- Sangrado de 3-5mm para impresión
- 300 DPI mínimo
- Fuentes incrustadas
- Tabla de contenidos automática

## Componentes Implementados

### 1. ContextualActions
Barra de acciones que cambia según el contexto:
- Contexto "project": Botones para portada, biografía, dedicatoria, capítulos
- Contexto "chapter": Botones para título, texto, subcapítulos, ejemplos
- Contexto "text-editor": Botones para listas, tablas, citas

### 2. CoverEditor
Editor visual de portada:
- Subida de imagen
- Posicionamiento visual de título y autor
- Controles de tamaño de fuente y color
- Vista previa en tiempo real

### 3. BookEditor (Mejorado)
Editor de texto enriquecido con:
- Tiptap para WYSIWYG
- Soporte para H1, H2, H3
- Listas, tablas, citas
- Formato de texto (negrita, cursiva, subrayado)

### 4. ChapterList (Mejorado)
Lista jerárquica de capítulos con:
- Iconos diferenciados por tipo
- Indentación visual según nivel
- Drag-and-drop para reorganizar
- Numeración automática

## Base de Datos

### Tabla `projects` - Nuevos Campos:

```sql
-- Posicionamiento de texto en portada
coverTitleX INT
coverTitleY INT
coverAuthorX INT
coverAuthorY INT
coverTitleFontSize INT DEFAULT 48
coverAuthorFontSize INT DEFAULT 24
coverTitleColor VARCHAR(20) DEFAULT '#FFFFFF'
coverAuthorColor VARCHAR(20) DEFAULT '#FFFFFF'

-- Contenido de páginas preliminares
biography TEXT
dedication TEXT
acknowledgments TEXT
isbn VARCHAR(20)
publisher VARCHAR(255)
printingInfo TEXT
copyright TEXT

-- Configuración de numeración
autoNumberChapters TINYINT DEFAULT 1
chapterNumberFormat VARCHAR(50) DEFAULT 'Capítulo {n}'
```

### Tabla `chapters` - Campos Existentes:

```sql
type ENUM('frontmatter', 'part', 'chapter', 'subchapter', 'backmatter')
level INT (1=parte, 2=capítulo, 3=subcapítulo)
parentId INT (referencia al capítulo padre)
orderIndex INT (orden de aparición)
```

## Estándares Editoriales Aplicados

### Márgenes (para 12.7 × 20.32 cm):
- Exterior: 1.5 cm
- Interior: 1.8 cm (más ancho por el lomo)
- Márgenes simétricos activados

### Tipografía:
- Cuerpo de texto: 11-12 pt con serifa (Georgia, Garamond)
- Interlineado: 1.5 o mayor
- Sangrado: 0.5-1 cm (excepto primer párrafo después de título)

### Estructura:
- Páginas preliminares sin numeración
- Numeración desde página 9
- Capítulos en página impar
- Páginas de cortesía entre secciones

### Exportación:
- PDF de alta resolución (300 DPI)
- Sangrado de 3-5mm
- Fuentes incrustadas
- Tabla de contenidos con enlaces

## Próximos Pasos de Desarrollo

1. **Implementar generador de páginas preliminares automático**
2. **Mejorar generador de PDF con estructura completa**
3. **Añadir sistema de plantillas visuales por género**
4. **Implementar gestor de referencias bibliográficas**
5. **Crear vista previa en tiempo real del libro formateado**
6. **Añadir exportación a EPUB con estructura jerárquica**

## Uso para el Usuario

1. **Crear proyecto** → Llenar título, subtítulo, autor
2. **Clic en "Agregar Portada"** → Subir imagen, posicionar texto
3. **Clic en "Biografía del Autor"** → Escribir biografía
4. **Clic en "Dedicatoria"** → Escribir dedicatoria
5. **Clic en "Agregar Nuevo Capítulo"** → Sistema lo numera automáticamente
6. **Dentro del capítulo:**
   - Clic en "Agregar Título" → Escribir título del capítulo
   - Clic en "Agregar Texto/Párrafos" → Escribir contenido
   - Clic en "Agregar Subcapítulo H2" → Crear subcapítulo
7. **Repetir** para todos los capítulos
8. **Clic en "Exportar a PDF"** → Sistema genera libro profesional

**Resultado**: Libro completamente maquetado con estándares profesionales, listo para imprimir o publicar en Amazon KDP.
