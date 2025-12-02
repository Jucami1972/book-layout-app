/**
 * Chapters Router
 * Handles chapter CRUD with plan limits
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import { checkCanCreateChapter } from '../middleware/planLimitMiddleware';
import { createAuditLog } from '../db';

export const chaptersRouter = router({
  /**
   * List chapters for a project
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);

      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await db.getProjectChapters(input.projectId);
    }),

  /**
   * Get single chapter
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const chapter = await db.getChapterById(input.id);

      if (!chapter) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const project = await db.getProjectById(chapter.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return chapter;
    }),

  /**
   * Create chapter (with plan limit check)
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string().min(1).max(500),
        content: z.string().default(''),
        type: z
          .enum(['frontmatter', 'part', 'chapter', 'subchapter', 'backmatter'])
          .default('chapter'),
        level: z.number().default(2),
        parentId: z.number().optional(),
        orderIndex: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);

      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Check plan limits
      await checkCanCreateChapter(ctx.user.id, input.projectId);

      const chapterId = await db.createChapter(input);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'CREATE_CHAPTER',
        resourceType: 'CHAPTER',
        resourceId: chapterId,
        details: { projectId: input.projectId },
      });

      return { id: chapterId };
    }),

  /**
   * Update chapter
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        type: z.enum(['frontmatter', 'chapter', 'backmatter']).optional(),
        orderIndex: z.number().optional(),
        startOnNewPage: z.boolean().optional(),
        includeInToc: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const chapter = await db.getChapterById(id);

      if (!chapter) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const project = await db.getProjectById(chapter.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await db.updateChapter(id, updates);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'UPDATE_CHAPTER',
        resourceType: 'CHAPTER',
        resourceId: id,
      });

      return { success: true };
    }),

  /**
   * Delete chapter
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const chapter = await db.getChapterById(input.id);

      if (!chapter) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      const project = await db.getProjectById(chapter.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      await db.deleteChapter(input.id);

      await createAuditLog({
        userId: ctx.user.id,
        action: 'DELETE_CHAPTER',
        resourceType: 'CHAPTER',
        resourceId: input.id,
      });

      return { success: true };
    }),

  /**
   * Reorder chapters
   */
  reorder: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        chapterOrders: z.array(
          z.object({
            id: z.number(),
            orderIndex: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      for (const { id, orderIndex } of input.chapterOrders) {
        await db.updateChapter(id, { orderIndex });
      }

      return { success: true };
    }),
});
