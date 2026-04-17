import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, longtext, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  bio: text("bio"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table - core content entity
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: longtext("content").notNull(), // Markdown content
  summary: text("summary"),
  authorId: int("authorId").notNull(),
  team: varchar("team", { length: 100 }), // e.g., "Backend", "Frontend", "DevOps"
  topic: varchar("topic", { length: 100 }), // e.g., "Database", "Performance", "Security"
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  viewCount: int("viewCount").default(0).notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  publishedAt: timestamp("publishedAt"),
}, (table) => ({
  authorIdx: index("authorIdx").on(table.authorId),
  teamIdx: index("teamIdx").on(table.team),
  topicIdx: index("topicIdx").on(table.topic),
  difficultyIdx: index("difficultyIdx").on(table.difficulty),
  publishedIdx: index("publishedIdx").on(table.published),
}));

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

/**
 * Comments table - user-generated comments on articles
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  parentCommentId: int("parentCommentId"), // For threaded replies
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  articleIdx: index("articleIdx").on(table.articleId),
  authorIdx: index("commentAuthorIdx").on(table.authorId),
  parentIdx: index("parentIdx").on(table.parentCommentId),
}));

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Ratings table - 5-star ratings for articles
 */
export const ratings = mysqlTable("ratings", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").notNull(), // 1-5
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  articleUserIdx: index("articleUserIdx").on(table.articleId, table.userId),
  articleIdx: index("ratingArticleIdx").on(table.articleId),
  userIdx: index("ratingUserIdx").on(table.userId),
}));

export type Rating = typeof ratings.$inferSelect;
export type InsertRating = typeof ratings.$inferInsert;

/**
 * Saved articles table - user's bookmarked articles
 */
export const savedArticles = mysqlTable("savedArticles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  articleId: int("articleId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userArticleIdx: index("userArticleIdx").on(table.userId, table.articleId),
  userIdx: index("savedUserIdx").on(table.userId),
  articleIdx: index("savedArticleIdx").on(table.articleId),
}));

export type SavedArticle = typeof savedArticles.$inferSelect;
export type InsertSavedArticle = typeof savedArticles.$inferInsert;

/**
 * Article tags table - for auto-tagging and categorization
 */
export const articleTags = mysqlTable("articleTags", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  tag: varchar("tag", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  articleIdx: index("tagArticleIdx").on(table.articleId),
  tagIdx: index("tagIdx").on(table.tag),
}));

export type ArticleTag = typeof articleTags.$inferSelect;
export type InsertArticleTag = typeof articleTags.$inferInsert;

/**
 * Search index table - for full-text search with relevance scoring
 */
export const searchIndex = mysqlTable("searchIndex", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  searchText: longtext("searchText").notNull(), // Indexed content for search
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  articleIdx: index("searchArticleIdx").on(table.articleId),
}));

export type SearchIndex = typeof searchIndex.$inferSelect;
export type InsertSearchIndex = typeof searchIndex.$inferInsert;

/**
 * Article views table - for analytics
 */
export const articleViews = mysqlTable("articleViews", {
  id: int("id").autoincrement().primaryKey(),
  articleId: int("articleId").notNull(),
  userId: int("userId"), // Null for anonymous views
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
}, (table) => ({
  articleIdx: index("viewArticleIdx").on(table.articleId),
  userIdx: index("viewUserIdx").on(table.userId),
}));

export type ArticleView = typeof articleViews.$inferSelect;
export type InsertArticleView = typeof articleViews.$inferInsert;
