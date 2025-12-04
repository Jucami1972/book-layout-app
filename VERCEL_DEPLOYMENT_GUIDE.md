# 🚀 BookMaster - Guía de Deployment a Vercel

## 📋 Estado Actual del Proyecto

**BookMaster** es una aplicación full-stack moderna:
- **Backend**: Express + tRPC + Drizzle ORM
- **Frontend**: React 19 + Vite + TypeScript
- **BD**: MySQL (configurada con Drizzle)
- **Pagos**: Stripe integrado
- **Migraciones**: Completadas

**Stack:** Node.js 22+ | React 19 | TypeScript | tRPC | MySQL | Stripe

---

## ✅ Pre-requisitos para Vercel

### 1. **Cuenta en Vercel**
- Crear cuenta en [vercel.com](https://vercel.com)
- Conectar tu repo de GitHub

### 2. **Database MySQL en la nube**
Opciones:
- **Planetscale** (MySQL serverless, recomendado)
- **AWS RDS**
- **Digital Ocean**
- **Railway** (+ hospedaje de Node.js)

**Recomendación:** Planetscale porque:
- Gratis hasta cierto nivel
- Compatible con MySQL
- Sin mantenimiento

### 3. **Stripe Account**
- Crear cuenta en [stripe.com](https://stripe.com)
- Obtener claves de producción (no test)
- Configurar webhooks

---

## 🔧 Configuración del Proyecto

### 1. **Usar Planetscale (Base de datos)**

#### a) Crear cuenta en Planetscale
1. Ir a [planetscale.com](https://planetscale.com) 
2. Sign up → crear organización
3. Crear base de datos: `book-master`

#### b) Obtener connection string
1. En Planetscale → "Connections"
2. Seleccionar usuario `admin`
3. Copiar "MySQL connection string"
4. Formato será: `mysql://username:password@host/database`

### 2. **Variables de Entorno en Vercel**

En el dashboard de Vercel, ir a **Settings → Environment Variables** y agregar:

```
DATABASE_URL=mysql://user:password@host/book-master
JWT_SECRET=your-super-secret-key-min-32-chars-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
STRIPE_SECRET_KEY=sk_live_xxxxxxxx  (clave de producción)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxx  (clave de producción)
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx  (de webhook settings)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxx  (de Stripe Dashboard)
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxx  (de Stripe Dashboard)
FRONTEND_URL=https://tu-dominio.vercel.app  (o tu dominio custom)
NODE_ENV=production
PORT=3000
```

---

## 📊 Estructura del Build

```
Project Root
├── client/           (React app - build → dist/public)
├── server/           (Express + tRPC)
├── shared/           (Tipos TypeScript compartidos)
├── drizzle/          (Esquema y migraciones)
├── dist/             (Output final)
│   ├── index.js      (Server compilado)
│   └── public/       (Frontend compilado)
├── package.json
├── vercel.json       (Configuración para Vercel)
└── tsconfig.json
```

### Build Process:
1. **`pnpm build`** ejecuta:
   - `vite build` → Compila React a `dist/public`
   - `esbuild server/_core/index.ts` → Compila Node.js a `dist/index.js`

2. **`pnpm start`** ejecuta:
   - `node dist/index.js` → Inicia servidor en puerto 3000
   - Sirve frontend desde `dist/public`
   - Expone API en `/api/trpc`

---

## 🚀 Pasos de Deployment

### Opción 1: Deployment desde GitHub (Recomendado)

#### 1. Push del código a GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

#### 2. Conectar Vercel
1. En [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Importar repositorio de GitHub
4. Seleccionar `book-layout-app`

#### 3. Configurar Vercel
1. **Framework**: Seleccionar "Other"
2. **Build Command**: `pnpm build`
3. **Start Command**: `pnpm start`
4. **Output Directory**: (dejar vacío, Vercel lo detiene)
5. **Root Directory**: `./` (raíz del proyecto)

#### 4. Agregar Environment Variables
- Copiar todas las variables de `Configuración del Proyecto` arriba
- Vercel → Settings → Environment Variables
- Agregar cada una

#### 5. Deploy
1. Click "Deploy"
2. Esperar a que termine (5-10 minutos)
3. Se asignará dominio: `book-master-xyz.vercel.app`

---

### Opción 2: Deployment Manual con Vercel CLI

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Loguearse en Vercel
vercel login

# 3. Link proyecto (primera vez)
vercel link

# 4. Deploy
vercel --prod
```

---

## 🗄️ Migraciones de Base de Datos

### Primera vez (importante):

Después de que Vercel termine el deploy, ejecutar migraciones en Planetscale:

```bash
# Localmente, conectar a la BD de producción:
DATABASE_URL="mysql://user:password@host/book-master" pnpm db:push
```

Esto creará las tablas en producción basándose en `drizzle/schema.ts`.

**Alternativa:** Ejecutar directamente en Planetscale con shell:
```bash
# En Planetscale dashboard → "Shell Console"
# Copiar y ejecutar el SQL de drizzle/0000_unusual_stingray.sql
```

---

## 🔒 Stripe Webhooks (Importante)

Después del deploy, configurar webhooks en Stripe:

1. En Stripe Dashboard → **Developers** → **Webhooks**
2. Click "Add endpoint"
3. URL: `https://tu-dominio.vercel.app/api/trpc/payment.handleWebhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copiar el **Signing Secret** a variable de entorno `STRIPE_WEBHOOK_SECRET`

---

## ✅ Checklist de Deployment

- [ ] Base de datos MySQL creada en Planetscale
- [ ] Connection string en `DATABASE_URL`
- [ ] Claves Stripe de producción en variables
- [ ] JWT secrets configurados (caracteres aleatorios fuertes)
- [ ] FRONTEND_URL apunta a dominio correcto
- [ ] `pnpm build` funciona localmente sin errores
- [ ] `pnpm start` sirve la app en localhost:3000
- [ ] Vercel.json presente en raíz del proyecto
- [ ] Proyecto conectado a Vercel desde GitHub
- [ ] Environment variables agregadas en Vercel
- [ ] Migraciones ejecutadas en BD de producción
- [ ] Webhooks de Stripe configurados
- [ ] Dominio personalizado (opcional) conectado a Vercel

---

## 🧪 Testing Post-Deploy

1. **Acceder a la app**: `https://tu-dominio.vercel.app`
2. **Probar auth**: Registrarse, login
3. **Probar Stripe**: Ir a pricing, intentar upgrade
4. **Ver logs**: Vercel Dashboard → Deployments → View logs

---

## 🐛 Troubleshooting

### Error: "Database connection failed"
- Verificar `DATABASE_URL` está correctamente formado
- En Planetscale, check status de la BD
- Asegurar que la IP de Vercel está allowlisted (Planetscale → Settings)

### Error: "Build failed"
- Ver logs en Vercel → Deployments → Failed build → View logs
- Ejecutar `pnpm build` localmente para reproducir
- Verificar que todas las dependencias están en `package.json`

### Error: "STRIPE_WEBHOOK_SECRET not found"
- Verificar variable de entorno en Vercel Settings
- Nombres de variables deben coincidir exactamente (case-sensitive)

### Frontend no carga
- Verificar que `dist/public` tiene archivos HTML
- Check que vite.config.ts tiene `root: path.resolve(..., "client")`
- Ver logs del servidor en Vercel

---

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Planetscale Docs](https://planetscale.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Express + Node.js en Vercel](https://vercel.com/docs/functions/serverless-functions)

---

## 🎯 URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Planetscale Console**: https://app.planetscale.com
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Tu app**: https://tu-dominio.vercel.app (después de deploy)

---

**Última actualización**: 3 de Diciembre 2025
**Status**: Listo para producción ✅
