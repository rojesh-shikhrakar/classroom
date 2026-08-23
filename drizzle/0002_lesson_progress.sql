CREATE TABLE IF NOT EXISTS `lesson_completion` (
	`user_id` text NOT NULL,
	`lesson_id` text NOT NULL,
	`completed_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`lesson_id`) REFERENCES `lesson`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE UNIQUE INDEX IF NOT EXISTS `lesson_completion_uidx` ON `lesson_completion` (`user_id`,`lesson_id`);
CREATE INDEX IF NOT EXISTS `lesson_completion_user_idx` ON `lesson_completion` (`user_id`);
