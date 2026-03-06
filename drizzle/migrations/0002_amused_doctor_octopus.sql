CREATE TABLE `agent_commits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`repo_full_name` text NOT NULL,
	`sha` text NOT NULL,
	`message` text,
	`author` text,
	`timestamp` text,
	`html_url` text,
	`external_id` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_commits_external_id_unique` ON `agent_commits` (`external_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_commits_agent` ON `agent_commits` (`agent_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_commits_timestamp` ON `agent_commits` (`timestamp`);--> statement-breakpoint
CREATE TABLE `agent_repos` (
	`agent_id` text NOT NULL,
	`repo_full_name` text NOT NULL,
	PRIMARY KEY(`agent_id`, `repo_full_name`),
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `agents` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`identifier` text NOT NULL,
	`description` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_agents_identifier` ON `agents` (`identifier`);