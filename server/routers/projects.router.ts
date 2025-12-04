/**
 * Projects Router
 * Handles project CRUD with plan limits
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import {
  checkCanCreateProject,
  checkCanUploadCover,
} from '../middleware/planLimitMiddleware';
import { createAuditLog } from '../db';

export const projectsRouter = router({
  /**
   * List all projects for authenticated user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await db.getUserProjects(ctx.user.id);
    return projects || [];
  }),

  /**
   * Get single project
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.id);
      
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Proyecto no encontrado',
        });
      }

      if (project.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes permiso para acceder a este proyecto',
        });
      }

      return project;
    }),

  /**
   * Create new project (with plan limit check)
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(500),
        subtitle: z.string().optional(),
        author: z.string().optional(),
        genre: z.string().optional(),
        publicationType: z.enum(['print', 'digital', 'both']).default('both'),
        pageSize: z.string().default('6x9'),
        templateId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check plan limits
      await checkCanCreateProject(ctx.user.id);

      const now = new Date();
      const projectId = await db.createProject({
        userId: ctx.user.id,
        ...input,
        createdAt: now,
        updatedAt: now,
      });

      // Audit log
      await createAuditLog({
        userId: ctx.user.id,
        action: 'CREATE_PROJECT',
        resourceType: 'PROJECT',
        resourceId: projectId,
      });

      return { id: projectId };
    }),

  /**
   * Update project
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        subtitle: z.string().optional(),
        author: z.string().optional(),
        genre: z.string().optional(),
        publicationType: z.enum(['print', 'digital', 'both']).optional(),
        pageSize: z.string().optional(),
        marginTop: z.number().optional(),
        marginBottom: z.number().optional(),
        marginLeft: z.number().optional(),
        marginRight: z.number().optional(),
        marginGutter: z.number().optional(),
        fontFamily: z.string().optional(),
        fontSize: z.number().optional(),
        lineHeight: z.number().optional(),
        templateId: z.string().optional(),
        customStyles: z.any().optional(),
        coverImageUrl: z.string().optional(),
        coverImageKey: z.string().optional(),
        status: z.enum(['draft', 'formatting', 'ready', 'published']).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const project = await db.getProjectById(id);

      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // If uploading cover, check permission
      if (updates.coverImageUrl || updates.coverImageKey) {
        await checkCanUploadCover(ctx.user.id);
      }

      await db.updateProject(id, updates);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'UPDATE_PROJECT',
        resourceType: 'PROJECT',
        resourceId: id,
        details: Object.keys(updates),
      });

      return { success: true };
    }),

  /**
   * Delete project
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.id);

      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await db.deleteProject(input.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'DELETE_PROJECT',
        resourceType: 'PROJECT',
        resourceId: input.id,
      });

      return { success: true };
    }),
});
