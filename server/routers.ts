import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { aiRouter } from "./routers-ai";
import { invokeLLM } from "./_core/llm";
import { getCementArticleBySlug, listCementArticles, upsertCementArticle } from "./cementStore";

// Helper to generate URL-friendly slugs
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export const appRouter = router({
  cement: router({
    articles: router({
      list: publicProcedure
        .input(z.object({ category: z.string().optional() }).optional())
        .query(async ({ input }) => {
          return listCementArticles(input?.category);
        }),
      bySlug: publicProcedure
        .input(z.object({ slug: z.string() }))
        .query(async ({ input }) => {
          const article = await getCementArticleBySlug(input.slug);
          if (!article) throw new TRPCError({ code: "NOT_FOUND" });
          return article;
        }),
      upsert: publicProcedure
        .input(
          z.object({
            adminKey: z.string(),
            id: z.string().optional(),
            slug: z.string().min(2),
            title: z.string().min(4),
            excerpt: z.string().min(10),
            content: z.string().min(30),
            category: z.enum(["Raw Mill", "Kiln", "Cement Mill", "Optimization"]),
            seoTitle: z.string().min(10),
            seoDescription: z.string().min(20),
            tags: z.array(z.string()).default([]),
          })
        )
        .mutation(async ({ input }) => {
          if (input.adminKey !== (process.env.CEMENT_ADMIN_KEY || "cement-admin-2026")) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin key" });
          }

          return upsertCementArticle({
            id: input.id,
            slug: input.slug,
            title: input.title,
            excerpt: input.excerpt,
            content: input.content,
            category: input.category,
            seoTitle: input.seoTitle,
            seoDescription: input.seoDescription,
            tags: input.tags,
          });
        }),
    }),
    chat: publicProcedure
      .input(z.object({ mode: z.enum(["general", "expert"]), messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })) }))
      .mutation(async ({ input }) => {
        const system =
          input.mode === "expert"
            ? "You are a cement process optimization expert. Give practical, safe, plant-focused recommendations with formulas and checklist steps."
            : "You are a helpful industrial assistant.";

        try {
          const response = await invokeLLM({
            messages: [{ role: "system", content: system }, ...input.messages],
            maxTokens: 500,
          });
          const content = response.choices?.[0]?.message?.content;
          return { reply: typeof content === "string" ? content : "I could not generate a response." };
        } catch {
          const fallback =
            input.mode === "expert"
              ? "Quick expert tip: first stabilize kiln feed and draft, then optimize fuel. Track SHC, kiln exit O2, and false air trend daily."
              : "I'm currently offline. Please try again in a moment.";
          return { reply: fallback };
        }
      }),
  }),
  system: systemRouter,
  ai: aiRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Article procedures
  articles: router({
    list: publicProcedure
      .input(z.object({
        teams: z.array(z.string()).optional(),
        topics: z.array(z.string()).optional(),
        difficulties: z.array(z.enum(["beginner", "intermediate", "advanced"])).optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.listArticles({
          teams: input.teams,
          topics: input.topics,
          difficulties: input.difficulties,
          published: true,
          limit: input.limit,
          offset: input.offset,
        });
      }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const article = await db.getArticleById(input.id);
        if (!article) throw new TRPCError({ code: "NOT_FOUND" });
        return article;
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const article = await db.getArticleBySlug(input.slug);
        if (!article) throw new TRPCError({ code: "NOT_FOUND" });
        return article;
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        summary: z.string().optional(),
        team: z.string().optional(),
        topic: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        published: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const slug = generateSlug(input.title) + "-" + Date.now();
        const result = await db.createArticle({
          title: input.title,
          slug,
          content: input.content,
          summary: input.summary,
          authorId: ctx.user.id,
          team: input.team,
          topic: input.topic,
          difficulty: input.difficulty,
        });

        const insertId = (result as any).insertId || 0;
        if (input.published) {
          await db.updateArticle(insertId, { published: true });
        }

        return { id: insertId, slug };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        summary: z.string().optional(),
        team: z.string().optional(),
        topic: z.string().optional(),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
        published: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const article = await db.getArticleById(input.id);
        if (!article) throw new TRPCError({ code: "NOT_FOUND" });
        if (article.authorId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.updateArticle(input.id, input);
        return { success: true };
      }),

    recordView: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.recordArticleView(input.articleId, ctx.user?.id);
        return { success: true };
      }),

    getFilters: publicProcedure.query(async () => {
      const teams = await db.getDistinctTeams();
      const topics = await db.getDistinctTopics();
      return {
        teams: teams.map(t => t.team).filter(Boolean),
        topics: topics.map(t => t.topic).filter(Boolean),
        difficulties: ["beginner", "intermediate", "advanced"],
      };
    }),
  }),

  // Search procedures
  search: router({
    articles: publicProcedure
      .input(z.object({
        query: z.string().min(1),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.searchArticles(input.query, input.limit, input.offset);
      }),
  }),

  // Comments procedures
  comments: router({
    getByArticle: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        return db.getCommentsByArticleId(input.articleId);
      }),

    create: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        content: z.string().min(1),
        parentCommentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createComment({
          articleId: input.articleId,
          authorId: ctx.user.id,
          content: input.content,
          parentCommentId: input.parentCommentId,
        });
        const insertId = (result as any).insertId || 0;
        return { id: insertId };
      }),
  }),

  // Ratings procedures
  ratings: router({
    getByArticle: publicProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input }) => {
        const ratings = await db.getRatingsByArticleId(input.articleId);
        const avgData = await db.getAverageRating(input.articleId);
        return {
          ratings,
          average: avgData?.average || 0,
          count: avgData?.count || 0,
        };
      }),

    getUserRating: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.getUserRating(input.articleId, ctx.user.id);
      }),

    rate: protectedProcedure
      .input(z.object({
        articleId: z.number(),
        score: z.number().min(1).max(5),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertRating(input.articleId, ctx.user.id, input.score);
        const avgData = await db.getAverageRating(input.articleId);
        return { average: avgData?.average || 0, count: avgData?.count || 0 };
      }),
  }),

  // Saved articles procedures
  saved: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getSavedArticles(ctx.user.id);
    }),

    isSaved: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .query(async ({ input, ctx }) => {
        return db.isSavedArticle(ctx.user.id, input.articleId);
      }),

    save: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const isSaved = await db.isSavedArticle(ctx.user.id, input.articleId);
        if (!isSaved) {
          await db.saveArticle(ctx.user.id, input.articleId);
        }
        return { success: true };
      }),

    unsave: protectedProcedure
      .input(z.object({ articleId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.unsaveArticle(ctx.user.id, input.articleId);
        return { success: true };
      }),
  }),

  // User profile procedures
  users: router({
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await db.getUserById(input.userId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        const articles = await db.getUserArticles(input.userId);
        const comments = await db.getUserComments(input.userId);
        return { user, articles, comments };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // TODO: Implement user profile update in db.ts
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
