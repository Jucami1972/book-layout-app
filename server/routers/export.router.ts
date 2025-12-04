/**
 * Export Router
 * Handles PDF/EPUB export with plan limit checks
 */

import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import { checkCanExport } from '../middleware/planLimitMiddleware';
import { createAuditLog } from '../db';
import { generateBookPDF } from '../services/pdfGenerator';
import { generateBookEPUB } from '../services/epubGenerator';

export const exportRouter = router({
  /**
   * Export to PDF (PRO only)
   */
  toPDF: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      await checkCanExport(ctx.user.id);

      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const chapters = await db.getProjectChapters(input.projectId);

      try {
        // Generate PDF
        const pdfBuffer = await generateBookPDF({
          project,
          chapters: chapters || [],
          includePageNumbers: true,
          includeToc: true,
        });

        // TODO: Upload to S3 and get URL
        const fileUrl = 'https://example.com/temp-pdf'; // Placeholder
        const fileKey = `pdfs/${project.id}-${Date.now()}.pdf`;

        // Record export
        const exportId = await db.createExport({
          projectId: input.projectId,
          userId: ctx.user.id,
          format: 'pdf',
          fileUrl,
          fileKey,
          fileSize: pdfBuffer.length,
          status: 'completed',
          createdAt: new Date(),
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: 'EXPORT_PDF',
          resourceType: 'PROJECT',
          resourceId: input.projectId,
        });

        return {
          success: true,
          downloadUrl: fileUrl,
          filename: `${project.title}.pdf`,
        };
      } catch (error: any) {
        await createAuditLog({
          userId: ctx.user.id,
          action: 'EXPORT_FAILED',
          resourceType: 'PROJECT',
          resourceId: input.projectId,
          details: { error: error.message },
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al generar PDF: ${error.message}`,
        });
      }
    }),

  /**
   * Export to EPUB (PRO only)
   */
  toEPUB: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check permission
      await checkCanExport(ctx.user.id);

      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      const chapters = await db.getProjectChapters(input.projectId);

      try {
        // Generate EPUB
        const epubBuffer = await generateBookEPUB({
          project,
          chapters: chapters || [],
        });

        // TODO: Upload to S3 and get URL
        const fileUrl = 'https://example.com/temp-epub'; // Placeholder
        const fileKey = `epubs/${project.id}-${Date.now()}.epub`;

        // Record export
        const exportId = await db.createExport({
          projectId: input.projectId,
          userId: ctx.user.id,
          format: 'epub',
          fileUrl,
          fileKey,
          fileSize: epubBuffer.length,
          status: 'completed',
          createdAt: new Date(),
        });

        await createAuditLog({
          userId: ctx.user.id,
          action: 'EXPORT_EPUB',
          resourceType: 'PROJECT',
          resourceId: input.projectId,
        });

        return {
          success: true,
          downloadUrl: fileUrl,
          filename: `${project.title}.epub`,
        };
      } catch (error: any) {
        await createAuditLog({
          userId: ctx.user.id,
          action: 'EXPORT_FAILED',
          resourceType: 'PROJECT',
          resourceId: input.projectId,
          details: { error: error.message },
        });

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Error al generar EPUB: ${error.message}`,
        });
      }
    }),

  /**
   * Get export history for a project
   */
  getHistory: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ ctx, input }) => {
      const project = await db.getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return await db.getProjectExports(input.projectId);
    }),
});
