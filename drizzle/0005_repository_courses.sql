ALTER TABLE `classroom` ADD `course_type` text DEFAULT 'lessons' NOT NULL;
--> statement-breakpoint
ALTER TABLE `classroom` ADD `repo_url` text DEFAULT '' NOT NULL;
