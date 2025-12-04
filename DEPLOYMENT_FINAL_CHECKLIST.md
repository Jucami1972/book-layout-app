# 🎯 INSTRUCCIONES FINALES - Deployment BookMaster a Vercel + Supabase

## ✅ Estado Actual

El proyecto **está 100% listo** para producción. Solo faltan 3 pasos manuales que requieren acceso a consolas web.

**Lo que está completado:**
- ✅ Schema convertido a PostgreSQL (pgTable)
- ✅ drizzle.config.ts configurado
- ✅ .env con URL de Supabase
- ✅ Archivo SQL de migraciones creado
- ✅ Stripe integrado
- ✅ AuthProvider en App.tsx
- ✅ vercel.json configurado

---

## 🔧 PASOS A REALIZAR (Solo 3 pasos manuales)

### PASO 1: Crear Tablas en Supabase (5 minutos)

1. Ir a: **https://app.supabase.com/project/hmslizihfmetnkcwztpl/sql/new**
2. Copiar TODO el contenido de **`drizzle/init-supabase.sql`** 
3. Pegarlo en el SQL Editor de Supabase
4. Click "Run" ▶️
5. Esperar a que termine (debe decir "Queries succeeded")
6. ✅ Tablas creadas

**Alternativa si no funciona el SQL:**
- Supabase → Home → New Query
- Pegar el SQL
- Run

---

### PASO 2: Conectar GitHub a Vercel (10 minutos)

1. Ir a: **https://vercel.com/new**
2. Click "Select a Git Namespace" 
3. Seleccionar **GitHub**
4. Buscar: **book-layout-app**
5. Click "Import"

#### Configuración durante la importación:
- **Project Name**: `book-master` (o tu nombre)
- **Framework**: `Other`
- **Build Command**: `pnpm build`
- **Start Command**: `pnpm start`
- **Root Directory**: `./`
- **Output Directory**: dejar vacío

#### Agregar Environment Variables:
Antes de hacer click en "Deploy", en la sección "Environment Variables", agregar:

```
DATABASE_URL=postgresql://postgres:Juanes2003@@hmslizihfmetnkcwztpl.supabase.co:5432/postgres

JWT_SECRET=tuSecreto123456789123456789123456789

JWT_REFRESH_SECRET=tuSecreto123456789123456789123456789

STRIPE_SECRET_KEY=sk_live_xxxxx  
(obtener de Stripe Dashboard - Live Keys)

STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
(obtener de Stripe Dashboard - Live Keys)

STRIPE_WEBHOOK_SECRET=whsec_xxxxx
(verás esto después en Stripe webhooks)

STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
(obtener de Stripe → Products → Prices)

STRIPE_PRICE_PRO_YEARLY=price_xxxxx

FRONTEND_URL=https://[TU-PROYECTO].vercel.app
(reemplazar [TU-PROYECTO] con el nombre que pusiste arriba)

NODE_ENV=production

VITE_ANALYTICS_ENDPOINT=

VITE_ANALYTICS_WEBSITE_ID=
```

3. Click **"Deploy"** 🚀
4. Esperar 5-10 minutos a que termine
5. Vercel te asignará una URL como: `https://book-master-xyz.vercel.app`
6. ✅ App deployada

---

### PASO 3: Configurar Webhooks de Stripe (5 minutos)

1. Ir a: **https://dashboard.stripe.com/webhooks**
2. Click **"Add endpoint"**
3. En **"Endpoint URL"** pegar:
   ```
   https://[TU-URL-DE-VERCEL]/api/trpc/payment.handleWebhook
   ```
   (Reemplazar con tu URL de Vercel del paso anterior)

4. En **"Events to send"**, seleccionar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

5. Click **"Add endpoint"**
6. Una vez creado, verás un **"Signing secret"** → Copiarlo
7. Ir a Vercel → Project Settings → Environment Variables
8. Agregar/actualizar: `STRIPE_WEBHOOK_SECRET=[SIGNING_SECRET]`
9. Click "Save"
10. ✅ Webhooks configurados

---

## 🧪 Verificar que todo funciona

### Test 1: Acceder a la app
```
https://[TU-URL].vercel.app
```
Deberías ver la página de inicio.

### Test 2: Registrarse
1. Click "Comenzar Ahora"
2. Registrarse con email
3. Login
4. Deberías ver el dashboard

### Test 3: Probar Stripe
1. Ir a `/pricing`
2. Click en "Actualizar a PRO"
3. Click "Ir a Checkout"
4. Usar tarjeta de test de Stripe: **4242 4242 4242 4242**
5. Fecha futura, CVC cualquiera
6. Si funciona, deberías ver "Pago completado"

---

## ⚠️ COSAS IMPORTANTES

### 🔐 Seguridad
- **NUNCA** compartir `DATABASE_URL` o `JWT_SECRET`
- Estos están solo en `.env` local y en Vercel (encriptados)
- Las claves de Stripe deben ser **LIVE** (sk_live_, pk_live_), no test

### 📱 Variables de Stripe
Para obtenerlas:
1. Ir a Stripe Dashboard
2. Left sidebar → **Billing** → **Products**
3. Ver los productos "Pro Monthly" y "Pro Yearly"
4. Click en cada uno y copiar el **Price ID** de la pricing table

### 🌐 Domain personalizado (opcional)
- Puedes agregar tu propio dominio en Vercel → Project Settings → Domains
- Supabase y Stripe funcionan igual

---

## 🚨 Si algo no funciona

### Error: "Database connection failed"
**Solución**: 
- Ir a Supabase → Settings → Database → Network
- Asegurar que Vercel está en el allowlist (debería estar automático)
- Si no, agregar `0.0.0.0/0` temporalmente (menos seguro)

### Error: "Stripe webhook not received"
**Solución**:
- Verificar que el endpoint URL es correcto
- Verificar que `STRIPE_WEBHOOK_SECRET` está bien en Vercel
- En Stripe Dashboard → Webhooks → Ver intentos de entrega

### Error: "Build failed in Vercel"
**Solución**:
- Click en "View logs" en Vercel
- Buscar el error específico
- Generalmente es por falta de `pnpm` o dependencies

---

## 📊 URLs Importantes

- **Tu app**: https://[TU-URL].vercel.app
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Project**: https://app.supabase.com/project/hmslizihfmetnkcwztpl
- **Stripe Dashboard**: https://dashboard.stripe.com

---

## 📝 Checklist Final

- [ ] SQL de Supabase ejecutado
- [ ] Tablas creadas en Supabase
- [ ] GitHub conectado a Vercel
- [ ] Environment variables en Vercel
- [ ] Deploy completado en Vercel
- [ ] App accesible en tu URL de Vercel
- [ ] Stripe webhooks configurados
- [ ] Test de registro/login funciona
- [ ] Test de Stripe funciona

---

## 🎉 ¡LISTO!

Una vez completes estos 3 pasos, **BookMaster estará en producción**. 

La app tendrá:
- ✅ Autenticación con JWT
- ✅ 3 planes (FREE, PRO_MONTHLY, PRO_YEARLY)
- ✅ Pagos con Stripe
- ✅ Base de datos PostgreSQL en Supabase
- ✅ Hospedaje en Vercel

---

**Documento creado**: 3 de Diciembre 2025  
**Versión**: 1.0 - Producción lista  
**Contrasena Supabase almacenada en .env local**
