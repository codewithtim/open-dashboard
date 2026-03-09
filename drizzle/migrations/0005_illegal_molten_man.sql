CREATE TABLE `agent_projects` (
	`agent_id` text NOT NULL,
	`project_id` text NOT NULL,
	PRIMARY KEY(`agent_id`, `project_id`),
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `agents` ADD `status` text DEFAULT 'idle' NOT NULL;--> statement-breakpoint
ALTER TABLE `agents` ADD `current_task` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `last_seen_at` text;