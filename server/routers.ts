import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth.router";
import { chaptersRouter } from "./routers/chapters.router";
import { projectsRouter } from "./routers/projects.router";
import { paymentRouter } from "./routers/payment.router";
import { subscriptionRouter } from "./routers/subscription.router";
import { exportRouter } from "./routers/export.router";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  chapters: chaptersRouter,
  projects: projectsRouter,
  payment: paymentRouter,
  subscription: subscriptionRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
