import { eq, and, or, inArray, like, desc, asc, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, articles, comments, ratings, savedArticles, articleTags, searchIndex, articleViews } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Article queries
export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function listArticles(filters: {
  teams?: string[];
  topics?: string[];
  difficulties?: string[];
  published?: boolean;
  limit?: number;
  offset?: number;
} = {}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (filters.published !== undefined) {
    conditions.push(eq(articles.published, filters.published));
  }
  if (filters.teams && filters.teams.length > 0) {
    conditions.push(inArray(articles.team, filters.teams));
  }
  if (filters.topics && filters.topics.length > 0) {
    conditions.push(inArray(articles.topic, filters.topics));
  }
  if (filters.difficulties && filters.difficulties.length > 0) {
    conditions.push(inArray(articles.difficulty, filters.difficulties as any));
  }

  if (conditions.length > 0) {
    return db.select().from(articles).where(and(...conditions)).orderBy(desc(articles.publishedAt)).limit(filters.limit || 20).offset(filters.offset || 0);
  }

  return db.select().from(articles).orderBy(desc(articles.publishedAt)).limit(filters.limit || 20).offset(filters.offset || 0);
}

export async function searchArticles(searchTerm: string, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];

  const searchPattern = `%${searchTerm}%`;
  const relevanceCase = sql<number>`CASE 
    WHEN ${articles.title} LIKE ${searchPattern} THEN 3
    WHEN ${articles.summary} LIKE ${searchPattern} THEN 2
    ELSE 1
  END`;

  const results = await db
    .select({
      article: articles,
      relevance: relevanceCase,
    })
    .from(articles)
    .where(
      and(
        eq(articles.published, true),
        or(
          like(articles.title, searchPattern),
          like(articles.summary, searchPattern),
          like(articles.content, searchPattern)
        )
      )
    )
    .orderBy(desc(relevanceCase))
    .limit(limit)
    .offset(offset);

  return results;
}

export async function createArticle(data: {
  title: string;
  slug: string;
  content: string;
  summary?: string;
  authorId: number;
  team?: string;
  topic?: string;
  difficulty: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(articles).values({
    title: data.title,
    slug: data.slug,
    content: data.content,
    summary: data.summary,
    authorId: data.authorId,
    team: data.team,
    topic: data.topic,
    difficulty: data.difficulty as any,
  });

  return result;
}

export async function updateArticle(id: number, data: Partial<{
  title: string;
  content: string;
  summary: string;
  team: string;
  topic: string;
  difficulty: string;
  published: boolean;
}>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.content !== undefined) updateData.content = data.content;
  if (data.summary !== undefined) updateData.summary = data.summary;
  if (data.team !== undefined) updateData.team = data.team;
  if (data.topic !== undefined) updateData.topic = data.topic;
  if (data.difficulty !== undefined) updateData.difficulty = data.difficulty;
  if (data.published !== undefined) {
    updateData.published = data.published;
    if (data.published) updateData.publishedAt = new Date();
  }

  return db.update(articles).set(updateData).where(eq(articles.id, id));
}

// Comment queries
export async function getCommentsByArticleId(articleId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(comments).where(eq(comments.articleId, articleId)).orderBy(asc(comments.createdAt));
}

export async function createComment(data: {
  articleId: number;
  authorId: number;
  content: string;
  parentCommentId?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(comments).values(data);
}

// Rating queries
export async function getRatingsByArticleId(articleId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(ratings).where(eq(ratings.articleId, articleId));
}

export async function getAverageRating(articleId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select({ average: sql<number>`AVG(${ratings.score})`, count: count() })
    .from(ratings)
    .where(eq(ratings.articleId, articleId));

  return result[0] || { average: 0, count: 0 };
}

export async function getUserRating(articleId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.articleId, articleId), eq(ratings.userId, userId)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function upsertRating(articleId: number, userId: number, score: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await getUserRating(articleId, userId);
  if (existing) {
    return db.update(ratings).set({ score }).where(eq(ratings.id, existing.id));
  } else {
    return db.insert(ratings).values({ articleId, userId, score });
  }
}

// Saved articles queries
export async function getSavedArticles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({ article: articles })
    .from(savedArticles)
    .innerJoin(articles, eq(savedArticles.articleId, articles.id))
    .where(eq(savedArticles.userId, userId));
}

export async function isSavedArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(savedArticles)
    .where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)))
    .limit(1);

  return result.length > 0;
}

export async function saveArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(savedArticles).values({ userId, articleId });
}

export async function unsaveArticle(userId: number, articleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(savedArticles).where(and(eq(savedArticles.userId, userId), eq(savedArticles.articleId, articleId)));
}

// Article tags
export async function getArticleTags(articleId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(articleTags).where(eq(articleTags.articleId, articleId));
}

export async function addArticleTag(articleId: number, tag: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(articleTags).values({ articleId, tag });
}

// Article views
export async function recordArticleView(articleId: number, userId?: number) {
  const db = await getDb();
  if (!db) return;

  await db.insert(articleViews).values({ articleId, userId });
  // Increment view count
  await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, articleId));
}

export async function getArticleViewCount(articleId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db.select({ count: count() }).from(articleViews).where(eq(articleViews.articleId, articleId));
  return result[0]?.count || 0;
}

// Get distinct teams and topics for filters
export async function getDistinctTeams() {
  const db = await getDb();
  if (!db) return [];

  return db.selectDistinct({ team: articles.team }).from(articles).where(eq(articles.published, true));
}

export async function getDistinctTopics() {
  const db = await getDb();
  if (!db) return [];

  return db.selectDistinct({ topic: articles.topic }).from(articles).where(eq(articles.published, true));
}

// Get user's articles
export async function getUserArticles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(articles).where(eq(articles.authorId, userId)).orderBy(desc(articles.createdAt));
}

// Get user's comments
export async function getUserComments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(comments).where(eq(comments.authorId, userId)).orderBy(desc(comments.createdAt));
}
