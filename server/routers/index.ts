/**
 * Main App Router
 * Combines all routers into the tRPC app router
 */

import { router } from '../_core/trpc';
import { authRouter } from './auth.router';
import { subscriptionRouter } from './subscription.router';
import { paymentRouter } from './payment.router';
import { projectsRouter } from './projects.router';
import { chaptersRouter } from './chapters.router';
import { exportRouter } from './export.router';

export const appRouter = router({
  auth: authRouter,
  subscription: subscriptionRouter,
  payment: paymentRouter,
  projects: projectsRouter,
  chapters: chaptersRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
