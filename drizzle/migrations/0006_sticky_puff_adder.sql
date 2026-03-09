CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`website` text,
	`description` text,
	`logo_url` text,
	`parent_id` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_companies_slug` ON `companies` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_companies_parent` ON `companies` (`parent_id`);--> statement-breakpoint
ALTER TABLE `agents` ADD `company_id` text REFERENCES companies(id);--> statement-breakpoint
CREATE INDEX `idx_agents_company` ON `agents` (`company_id`);