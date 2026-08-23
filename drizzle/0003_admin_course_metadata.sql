ALTER TABLE `user` ADD `role` text DEFAULT 'student' NOT NULL;
--> statement-breakpoint
ALTER TABLE `classroom` ADD `term` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `classroom` ADD `published` integer DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE `classroom` SET `published` = true;
--> statement-breakpoint
ALTER TABLE `lesson` ADD `details` text DEFAULT '' NOT NULL;
--> statement-breakpoint
UPDATE `lesson`
SET `details` = CASE
	WHEN `duration_minutes` > 0 THEN CAST(`duration_minutes` AS text) || ' min'
	ELSE ''
END;
