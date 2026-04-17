CREATE TABLE `articleTags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`tag` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articleTags_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articleViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `articleViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`content` longtext NOT NULL,
	`summary` text,
	`authorId` int NOT NULL,
	`team` varchar(100),
	`topic` varchar(100),
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`publishedAt` timestamp,
	CONSTRAINT `articles_id` PRIMARY KEY(`id`),
	CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`authorId` int NOT NULL,
	`content` text NOT NULL,
	`parentCommentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`articleId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedArticles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `searchIndex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`articleId` int NOT NULL,
	`searchText` longtext NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `searchIndex_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
CREATE INDEX `tagArticleIdx` ON `articleTags` (`articleId`);--> statement-breakpoint
CREATE INDEX `tagIdx` ON `articleTags` (`tag`);--> statement-breakpoint
CREATE INDEX `viewArticleIdx` ON `articleViews` (`articleId`);--> statement-breakpoint
CREATE INDEX `viewUserIdx` ON `articleViews` (`userId`);--> statement-breakpoint
CREATE INDEX `authorIdx` ON `articles` (`authorId`);--> statement-breakpoint
CREATE INDEX `teamIdx` ON `articles` (`team`);--> statement-breakpoint
CREATE INDEX `topicIdx` ON `articles` (`topic`);--> statement-breakpoint
CREATE INDEX `difficultyIdx` ON `articles` (`difficulty`);--> statement-breakpoint
CREATE INDEX `publishedIdx` ON `articles` (`published`);--> statement-breakpoint
CREATE INDEX `articleIdx` ON `comments` (`articleId`);--> statement-breakpoint
CREATE INDEX `commentAuthorIdx` ON `comments` (`authorId`);--> statement-breakpoint
CREATE INDEX `parentIdx` ON `comments` (`parentCommentId`);--> statement-breakpoint
CREATE INDEX `articleUserIdx` ON `ratings` (`articleId`,`userId`);--> statement-breakpoint
CREATE INDEX `ratingArticleIdx` ON `ratings` (`articleId`);--> statement-breakpoint
CREATE INDEX `ratingUserIdx` ON `ratings` (`userId`);--> statement-breakpoint
CREATE INDEX `userArticleIdx` ON `savedArticles` (`userId`,`articleId`);--> statement-breakpoint
CREATE INDEX `savedUserIdx` ON `savedArticles` (`userId`);--> statement-breakpoint
CREATE INDEX `savedArticleIdx` ON `savedArticles` (`articleId`);--> statement-breakpoint
CREATE INDEX `searchArticleIdx` ON `searchIndex` (`articleId`);