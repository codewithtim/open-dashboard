CREATE TABLE `agent_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` text NOT NULL,
	`action` text NOT NULL,
	`description` text,
	`metadata` text,
	`timestamp` text NOT NULL,
	`external_id` text NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_activities_external_id_unique` ON `agent_activities` (`external_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_activities_agent` ON `agent_activities` (`agent_id`);--> statement-breakpoint
CREATE INDEX `idx_agent_activities_timestamp` ON `agent_activities` (`timestamp`);