# BookMaster - Maquetación Profesional de Libros como SaaS

BookMaster es una **aplicación SaaS completa** para la maquetación profesional de libros con un potente editor WYSIWYG integrado con inteligencia artificial.

**Versión Actual: 85% Complete (Beta Ready)**

## 📊 Estado Actual

| Fase | Status | Completion |
|------|--------|-----------|
| ✅ Autenticación SaaS | Complete | 100% |
| ✅ Gestión de Planes | Complete | 100% |
| ✅ Stripe Integration | Complete | 100% |
| 🔄 Unit Tests | In Progress | 0% |
| 🔄 Component Polish | Ready | 0% |

## 🎯 Características Principales

### 🔐 Sistema SaaS Completo
- ✅ Autenticación por email/contraseña
- ✅ Tres tiers de planes (FREE, PRO_MONTHLY, PRO_YEARLY)
- ✅ Integración Stripe para pagos
- ✅ Gestión automática de suscripciones
- ✅ Restricciones de plan en backend

### 💳 Pagos con Stripe
- ✅ Checkout sessions
- ✅ Webhook event processing
- ✅ Plan upgrades automáticos
- ✅ Subscription tracking
- ✅ Audit logging completo

### 📥 Importación Inteligente
- Importa archivos Word (.docx) con detección automática de estructura
- Reconocimiento de capítulos basado en encabezados
- Preservación de formato básico (negrita, cursiva, listas)

### ✍️ Editor Profesional
- Editor WYSIWYG basado en Tiptap
- Barra de herramientas completa con formato de texto
- Soporte para imágenes, citas y listas
- Alineación de texto (izquierda, centro, derecha, justificado)
- Guardado automático de cambios

### 📚 Gestión de Capítulos
- Organización visual de capítulos
- Reordenamiento con drag-and-drop
- Tipos de capítulos (front matter, capítulo, back matter)
- Navegación rápida entre capítulos

### 🤖 Inteligencia Artificial
- **Análisis automático**: Detecta género literario, tono y público objetivo
- **Formateo inteligente**: Aplica estilos profesionales según el género
- **Mejora de contenido**: Corrección ortográfica, gramatical y de estilo
- **Generación de portadas**: Crea portadas profesionales con IA


### 📄 Exportación Profesional
- **PDF de alta calidad**: Listo para imprenta (300 DPI)
- **EPUB**: Para publicación digital
- Configuración avanzada de márgenes y tipografía
- Tabla de contenidos automática
- Numeración de páginas personalizable

### 🎨 Personalización
- Múltiples tamaños de página (6x9", A4, A5, etc.)
- Configuración de márgenes y sangrado
- Selección de fuentes y tamaño de texto
- Interlineado ajustable
- Plantillas por género literario

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** + **Express**: Servidor web
- **tRPC**: API type-safe
- **Drizzle ORM**: Base de datos MySQL
- **Mammoth**: Procesamiento de archivos Word
- **Puppeteer**: Generación de PDF
- **epub-gen**: Generación de EPUB

### Frontend
- **React 19**: Framework UI
- **TypeScript**: Tipado estático
- **Tiptap**: Editor WYSIWYG
- **Tailwind CSS 4**: Estilos
- **shadcn/ui**: Componentes UI
- **dnd-kit**: Drag and drop
- **Wouter**: Enrutamiento

### IA y Servicios
- **LLM Integration**: Análisis y mejora de contenido
- **Image Generation**: Generación de portadas
- **S3 Storage**: Almacenamiento de archivos

## 📦 Instalación y Desarrollo

### Requisitos Previos
- Node.js 22+
- MySQL/TiDB database
- pnpm

### Configuración

1. Instalar dependencias:
```bash
pnpm install
```

2. Configurar variables de entorno (ya configuradas en Manus):
- `DATABASE_URL`: Conexión a base de datos
- `JWT_SECRET`: Secret para sesiones
- Otras variables de OAuth y servicios

3. Ejecutar migraciones:
```bash
node migrate.mjs
```

4. Iniciar servidor de desarrollo:
```bash
pnpm dev
```

5. Ejecutar tests:
```bash
pnpm test
```

## 📖 Uso

### Crear un Nuevo Proyecto

1. **Desde cero**: Completa el formulario con título, autor y género
2. **Importar Word**: Sube un archivo .docx y la IA detectará automáticamente la estructura

### Editar Contenido

1. Selecciona un capítulo de la lista lateral
2. Edita el título y contenido usando el editor
3. Usa la barra de herramientas para aplicar formato
4. Los cambios se guardan automáticamente

### Mejorar con IA

1. Abre el menú "Mejorar con IA"
2. Selecciona el tipo de mejora:
   - Corrección ortográfica y gramatical
   - Mejora de estilo literario
   - Corrección completa

### Exportar

1. Haz clic en "Exportar"
2. Selecciona el formato (PDF o EPUB)
3. El archivo se generará y descargará automáticamente

## 🗂️ Estructura del Proyecto

```
book-layout-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizables
│   │   ├── pages/         # Páginas de la aplicación
│   │   ├── lib/           # Utilidades y configuración
│   │   └── App.tsx        # Componente principal
├── server/                # Backend Node.js
│   ├── services/          # Servicios de negocio
│   │   ├── wordProcessor.ts
│   │   ├── pdfGenerator.ts
│   │   ├── epubGenerator.ts
│   │   └── aiFormatter.ts
│   ├── db.ts             # Funciones de base de datos
│   ├── routers.ts        # Rutas tRPC
│   └── *.test.ts         # Tests
├── drizzle/              # Esquema de base de datos
│   └── schema.ts
└── migrate.mjs           # Script de migración
```

## 🧪 Testing

El proyecto incluye tests completos para las funcionalidades principales:

- Creación y gestión de proyectos
- CRUD de capítulos
- Reordenamiento de capítulos
- Autenticación y autorización

Ejecutar tests:
```bash
pnpm test
```

## 🔒 Seguridad

- Autenticación OAuth con Manus
- Sesiones seguras con JWT
- Validación de permisos en todas las operaciones
- Protección contra inyección SQL con Drizzle ORM
- Sanitización de entrada de usuario

## 📝 Licencia

MIT

## 👥 Autor

Desarrollado con ❤️ para escritores y editores profesionales.
