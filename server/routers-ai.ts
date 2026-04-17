import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as aiFeatures from "./ai-features";

export const aiRouter = router({
  // Writing Assistant
  writingAssistance: protectedProcedure
    .input(z.object({
      prompt: z.string(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const assistance = await aiFeatures.getWritingAssistance(input.prompt, input.context);
      return { suggestion: assistance };
    }),

  // Auto-tag articles
  generateTags: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const tags = await aiFeatures.generateArticleTags(input.title, input.content);
      return { tags };
    }),

  // Improve writing
  improveWriting: protectedProcedure
    .input(z.object({
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const improved = await aiFeatures.improveTechnicalWriting(input.content);
      return { improved };
    }),

  // Generate code examples
  generateCodeExamples: protectedProcedure
    .input(z.object({
      description: z.string(),
      language: z.string().default("typescript"),
    }))
    .mutation(async ({ input }) => {
      const code = await aiFeatures.generateCodeExamples(input.description, input.language);
      return { code };
    }),

  // Transcribe audio
  transcribeAudio: protectedProcedure
    .input(z.object({
      audioUrl: z.string().url(),
      title: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await aiFeatures.transcribeAndStructureAudio(input.audioUrl, input.title);
      return result;
    }),

  // Generate diagrams
  generateDiagram: protectedProcedure
    .input(z.object({
      description: z.string(),
      diagramType: z.enum(["flowchart", "architecture", "sequence", "class"]).default("flowchart"),
    }))
    .mutation(async ({ input }) => {
      const diagram = await aiFeatures.generateDiagramFromDescription(input.description, input.diagramType);
      return diagram;
    }),

  // Suggest improvements
  suggestImprovements: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      const suggestions = await aiFeatures.suggestArticleImprovements(input.title, input.content);
      return { suggestions };
    }),
});

export type AIRouter = typeof aiRouter;
