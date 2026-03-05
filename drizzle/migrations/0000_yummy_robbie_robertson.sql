CREATE TABLE `activity_events` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`timestamp` text NOT NULL,
	`project_id` text,
	`project_name` text,
	`external_id` text NOT NULL,
	`payload` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activity_events_external_id_unique` ON `activity_events` (`external_id`);--> statement-breakpoint
CREATE INDEX `idx_activity_timestamp` ON `activity_events` (`timestamp`);--> statement-breakpoint
CREATE TABLE `costs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_costs_project` ON `costs` (`project_id`);--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`value` real NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_metrics_project_name` ON `metrics` (`project_id`,`name`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`platform` text,
	`platform_account_id` text,
	`link` text
);
--> statement-breakpoint
CREATE TABLE `revenue` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`amount` real NOT NULL,
	`note` text,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_revenue_project` ON `revenue` (`project_id`);--> statement-breakpoint
CREATE TABLE `stream_commits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`stream_id` text NOT NULL,
	`sha` text NOT NULL,
	`message` text,
	`author` text,
	`timestamp` text,
	`html_url` text,
	`repo` text,
	`project_id` text,
	FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_stream_commits_stream` ON `stream_commits` (`stream_id`);--> statement-breakpoint
CREATE TABLE `stream_projects` (
	`stream_id` text NOT NULL,
	`project_id` text NOT NULL,
	PRIMARY KEY(`stream_id`, `project_id`),
	FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `streams` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`video_id` text NOT NULL,
	`actual_start_time` text,
	`actual_end_time` text,
	`thumbnail_url` text,
	`view_count` integer DEFAULT 0,
	`like_count` integer DEFAULT 0,
	`comment_count` integer DEFAULT 0,
	`duration` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `streams_video_id_unique` ON `streams` (`video_id`);