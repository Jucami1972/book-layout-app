# BookMaster SaaS - PRÓXIMOS PASOS INMEDIATOS

## 🚀 QUE HACER AHORA (Orden recomendado)

### 1️⃣ Crear migraciones de BD (10 min)

```bash
cd /book-layout-app
npx drizzle-kit generate
npx drizzle-kit migrate
```

Esto va a:
- Crear el archivo de migración con los cambios
- Ejecutar la migración en tu BD
- ⚠️ Advertencia: Si la BD ya existe, pueden haber conflictos con la tabla `users` vieja

### 2️⃣ Actualizar App.tsx para envolver con AuthProvider

```tsx
// client/src/App.tsx
import { AuthProvider } from './contexts/AuthContext';
import { Router, Route, Redirect } from 'wouter';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { PricingPage } from './pages/Pricing';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
// ... otras imports

export function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Rutas públicas */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/pricing" component={PricingPage} />
        
        {/* Rutas protegidas */}
        <ProtectedRoute>
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/projects/:id" component={ProjectEditor} />
        </ProtectedRoute>
        
        {/* Default */}
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
      </Router>
    </AuthProvider>
  );
}
```

### 3️⃣ Verificar que los endpoints funcionan

Desde Postman o curl, probar:

```bash
# Register
POST http://localhost:3000/api/trpc/auth.register
{
  "json": {
    "name": "Juan Test",
    "email": "juan@test.com",
    "password": "Password123",
    "passwordConfirm": "Password123"
  }
}

# Login
POST http://localhost:3000/api/trpc/auth.login
{
  "json": {
    "email": "juan@test.com",
    "password": "Password123"
  }
}

# Get me
GET http://localhost:3000/api/trpc/auth.me?input={}
Headers: Authorization: Bearer <token>
```

### 4️⃣ Verificar restricciones de plan

Con usuario FREE, intentar:
```bash
# Crear proyecto 2 (debe fallar)
POST http://localhost:3000/api/trpc/projects.create

# Intentar exportar (debe fallar)
POST http://localhost:3000/api/trpc/export.toPDF
```

### 5️⃣ Testing manual completo

1. Abre http://localhost:3000/register
2. Crea cuenta nueva
3. Ve a /pricing
4. Intenta crear 2do libro (debe no permitir)
5. Haz upgrade a PRO
6. Intenta crear 2do libro (debe permitir)

---

## 🔧 Si hay problemas

### Error: "userId not found"
→ El usuario no está siendo pasado correctamente al contexto
→ Verificar que `sdk.authenticateRequest` esté usando JWT

### Error: "table users doesn't exist"
→ Falta ejecutar migraciones
→ Correr: `npx drizzle-kit migrate`

### Error en auth: "password must be encrypted"
→ Falta instalar `bcrypt`
→ Correr: `npm install bcrypt && npm install -D @types/bcrypt`

### tRPC no reconoce nuevos routers
→ Necesita rebuild de TypeScript
→ Correr: `npm run check`

---

## 📝 Cambios a archivos existentes (si es necesario)

### `server/_core/trpc.ts` - Verificar que tenga:

```typescript
import { initTRPC } from '@trpc/server';
import type { TrpcContext } from './context';

const t = initTRPC.context<TrpcContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async (opts) => {
  if (!opts.ctx.user) {
    throw new Error('User not authenticated');
  }
  return opts.next({
    ctx: {
      ...opts.ctx,
      user: opts.ctx.user,
    },
  });
});
```

### `client/lib/trpc.ts` - Verificar que apunte al endpoint correcto

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@server/routers';

export const trpc = createTRPCReact<AppRouter>();
```

---

## 🎯 Estado Esperado Después de Estos Pasos

✅ BD migrada con nuevas tablas
✅ Frontend renderiza Login/Register
✅ Login/Register funciona (usuarios creados en BD)
✅ Plan limits respetan restricciones
✅ Upgrade a PRO elimina restricciones
✅ Audit logs registran todas las acciones

---

## ❓ Preguntas Comunes

**¿Dónde almaceno el JWT?**
→ Ahora en localStorage (no seguro para produc). En produc usar secure httpOnly cookies.

**¿Cómo recupero contraseña?**
→ El endpoint `requestPasswordReset` devuelve token (en dev). En produc, envía email con link.

**¿Qué pasa cuando suscripción expira?**
→ En el siguiente login, `checkSubscriptionStatus` auto-downgrade a FREE.

**¿Cómo integro Stripe?**
→ En `subscriptionRouter.upgradeToProMonthly`, reemplazar la lógica con:
   - Crear Stripe checkout session
   - Redirigir a Stripe
   - Webhook para actualizar plan

---

**¿Listo para empezar?** 🚀
