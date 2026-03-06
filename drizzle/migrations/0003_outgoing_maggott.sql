CREATE TABLE `cost_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`cost_id` text NOT NULL,
	`project_id` text NOT NULL,
	`allocation` real NOT NULL,
	FOREIGN KEY (`cost_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_cost_projects_cost_project` ON `cost_projects` (`cost_id`,`project_id`);--> statement-breakpoint
CREATE INDEX `idx_cost_projects_cost` ON `cost_projects` (`cost_id`);--> statement-breakpoint
CREATE INDEX `idx_cost_projects_project` ON `cost_projects` (`project_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`amount` real NOT NULL,
	`vendor` text NOT NULL,
	`category` text NOT NULL,
	`note` text,
	`date` text NOT NULL,
	`period_start` text,
	`period_end` text,
	`source` text DEFAULT 'manual' NOT NULL,
	`source_ref` text,
	`recurring` integer DEFAULT false NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_expenses_vendor` ON `expenses` (`vendor`);--> statement-breakpoint
CREATE INDEX `idx_expenses_date` ON `expenses` (`date`);--> statement-breakpoint
CREATE INDEX `idx_expenses_category` ON `expenses` (`category`);--> statement-breakpoint
CREATE TABLE `project_services` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`vendor` text NOT NULL,
	`exclusive` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_project_services_project_vendor` ON `project_services` (`project_id`,`vendor`);--> statement-breakpoint
CREATE INDEX `idx_project_services_project` ON `project_services` (`project_id`);