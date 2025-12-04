# 🚀 BookMaster - Deployment a Vercel + Supabase (PostgreSQL)

## 📋 Estado del Proyecto

**BookMaster** es una aplicación full-stack lista para producción:
- **Backend**: Express + tRPC + Drizzle ORM
- **Frontend**: React 19 + Vite + TypeScript
- **BD**: PostgreSQL en Supabase
- **Pagos**: Stripe integrado y funcional
- **Autenticación**: JWT + bcrypt
- **Schema**: Completamente migrado a PostgreSQL

---

## ✅ Lo que ya está hecho

- ✅ Schema convertido de SQLite a PostgreSQL (pgTable)
- ✅ drizzle.config.ts configurado para PostgreSQL
- ✅ Stripe integrado y webhooks funcionales (Fase B completa)
- ✅ Frontend y backend sin errores
- ✅ vercel.json configurado
- ✅ AuthProvider agregado a App.tsx
- ✅ Rutas y components listos

---

## 🔧 Pasos para hacer Deployment a Vercel + Supabase

### Paso 1: Configurar Supabase

#### 1.1 Obtener credenciales
El proyecto ya tiene el URL de Supabase:
```
URL: https://hmslizihfmetnkcwztpl.supabase.co
```

#### 1.2 Configurar la contraseña de BD
1. En Supabase Dashboard → Settings → Database
2. Cambiar contraseña del usuario `postgres`
3. Copiar la nueva contraseña

#### 1.3 Actualizar DATABASE_URL en .env local
```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@hmslizihfmetnkcwztpl.supabase.co:5432/postgres
```

Reemplazar `[PASSWORD]` con la contraseña actual.

---

### Paso 2: Crear migraciones en Supabase

Desde tu máquina local:

```bash
# 1. Asegurar que .env tiene la URL correcta de Supabase
echo "DATABASE_URL=postgresql://postgres:[PASSWORD]@hmslizihfmetnkcwztpl.supabase.co:5432/postgres"

# 2. Generar y ejecutar migraciones
pnpm db:push

# Esto creará las 7 tablas en Supabase PostgreSQL
```

**Tablas que se crearán:**
- users
- subscriptionHistory
- projects
- chapters
- references
- exports
- payments
- auditLogs

---

### Paso 3: Configurar Vercel

#### 3.1 Conectar repositorio
1. Ir a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Seleccionar repositorio `book-layout-app`

#### 3.2 Configurar Build y Deployment
En Vercel durante el import:
- **Framework**: Other
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Root Directory**: `./`
- **Output Directory**: dejar vacío

#### 3.3 Agregar Environment Variables
En Vercel Dashboard → Settings → Environment Variables, agregar:

```env
# Base de datos
DATABASE_URL=postgresql://postgres:[PASSWORD]@hmslizihfmetnkcwztpl.supabase.co:5432/postgres

# JWT
JWT_SECRET=tuSecreto123456789123456789123456789
JWT_REFRESH_SECRET=tuSecreto123456789123456789123456789

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx  (obtener de Stripe)
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxx

# URLs
FRONTEND_URL=https://tu-app.vercel.app
NODE_ENV=production
PORT=3000
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

#### 3.4 Deploy
1. Click "Deploy"
2. Esperar a que termine (5-10 minutos)
3. Vercel asignará URL: `https://book-master-xyz.vercel.app`

---

### Paso 4: Configurar Webhooks de Stripe

Después del deploy en Vercel:

1. En Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL endpoint: `https://tu-app.vercel.app/api/trpc/payment.handleWebhook`
4. Eventos a escuchar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copiar "Signing Secret" → agregar a variable `STRIPE_WEBHOOK_SECRET` en Vercel

---

## 🧪 Testing Post-Deploy

### Test 1: Verificar BD
```bash
# Conectar a Supabase y verificar tablas
psql postgresql://postgres:[PASSWORD]@hmslizihfmetnkcwztpl.supabase.co:5432/postgres
\dt  # Listar tablas
```

### Test 2: Verificar API
```bash
# Desde el navegador
curl https://tu-app.vercel.app/api/trpc/system.health
```

### Test 3: Flujo completo
1. Acceder a `https://tu-app.vercel.app`
2. Registrarse con email
3. Login
4. Ir a Pricing
5. Intentar upgrade (Stripe test card: 4242 4242 4242 4242)
6. Verificar que se actualiza el plan en BD

---

## ⚠️ Checklist Importante

- [ ] Contraseña de Supabase actualizada y segura
- [ ] DATABASE_URL agregada a .env y a Vercel
- [ ] Migraciones ejecutadas: `pnpm db:push`
- [ ] Tablas creadas en Supabase (verificar en Supabase UI)
- [ ] Claves de Stripe de **producción** (no test)
- [ ] JWT_SECRET con caracteres aleatorios fuertes (min 32 chars)
- [ ] vercel.json presente en raíz
- [ ] Proyecto deployed en Vercel
- [ ] Environment variables agregadas en Vercel
- [ ] Webhooks de Stripe configurados
- [ ] HTTPS habilitado (automático en Vercel)
- [ ] Dominio personalizado (opcional)

---

## 🐛 Troubleshooting

### Error: "Database connection failed"
**Causa**: DATABASE_URL incorrea o Supabase no responde
**Solución**:
- Verificar contraseña de Supabase
- Verificar que la IP está allowlisted (Supabase → Network → Add IP)
- Probar localmente: `psql [DATABASE_URL]`

### Error: "relation \"users\" does not exist"
**Causa**: Migraciones no ejecutadas
**Solución**:
```bash
DATABASE_URL=postgresql://... pnpm db:push
```

### Error en webhooks de Stripe
**Causa**: Endpoint URL incorrecta o Stripe secret inválido
**Solución**:
- Verificar URL en Stripe Dashboard
- Verificar STRIPE_WEBHOOK_SECRET en Vercel
- Ver logs en Vercel Deployments → Function logs

### CORS errors en frontend
**Causa**: FRONTEND_URL no configurada correctamente
**Solución**:
- Actualizar FRONTEND_URL en Vercel al dominio correcto
- Reindeployer (`vercel --prod`)

---

## 📊 URLs importantes

- **Supabase Project**: https://app.supabase.com/project/hmslizihfmetnkcwztpl
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Tu app**: https://tu-app.vercel.app
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 🎯 Próximos pasos después del deploy

1. **Monitoreo**: Setup Sentry o similar para errores
2. **Backups**: Configurar backups automáticos en Supabase
3. **SSL**: Ya está habilitado en Vercel
4. **CDN**: Automático en Vercel
5. **Analytics**: Opcional, deshabilitado por ahora

---

**Última actualización**: 3 de Diciembre 2025  
**Status**: Listo para producción ✅
