CREATE TABLE `classroom` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classroom_code_uidx` ON `classroom` (`code`);
--> statement-breakpoint
CREATE TABLE `course_module` (
	`id` text PRIMARY KEY NOT NULL,
	`classroom_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`classroom_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `course_module_classroom_idx` ON `course_module` (`classroom_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `course_module_position_uidx` ON `course_module` (`classroom_id`,`position`);
--> statement-breakpoint
CREATE TABLE `lesson` (
	`id` text PRIMARY KEY NOT NULL,
	`module_id` text NOT NULL,
	`title` text NOT NULL,
	`type` text DEFAULT 'article' NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '[]' NOT NULL,
	`duration_minutes` integer DEFAULT 0 NOT NULL,
	`position` integer NOT NULL,
	FOREIGN KEY (`module_id`) REFERENCES `course_module`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `lesson_module_idx` ON `lesson` (`module_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `lesson_position_uidx` ON `lesson` (`module_id`,`position`);
--> statement-breakpoint
CREATE TABLE `classroom_enrollment` (
	`user_id` text NOT NULL,
	`classroom_id` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`classroom_id`) REFERENCES `classroom`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `classroom_enrollment_uidx` ON `classroom_enrollment` (`user_id`,`classroom_id`);
--> statement-breakpoint
CREATE INDEX `classroom_enrollment_user_idx` ON `classroom_enrollment` (`user_id`);
--> statement-breakpoint
INSERT INTO `classroom` (`id`, `code`, `title`, `description`, `created_at`) VALUES
	('class_ai_2026', 'AI2026', 'AI for Everyone', 'A practical introduction to artificial intelligence.', unixepoch() * 1000);
--> statement-breakpoint
INSERT INTO `course_module` (`id`, `classroom_id`, `title`, `description`, `position`) VALUES
	('module_foundations', 'class_ai_2026', 'Foundations', 'Core ideas behind modern AI', 1),
	('module_systems', 'class_ai_2026', 'Thinking in systems', 'Models, patterns, and predictions', 2),
	('module_practice', 'class_ai_2026', 'Practice & reflection', 'Apply what you have learned', 3);
--> statement-breakpoint
INSERT INTO `lesson` (`id`, `module_id`, `title`, `type`, `summary`, `content`, `duration_minutes`, `position`) VALUES
	('lesson_welcome', 'module_foundations', 'Welcome to the course', 'video', 'Meet your course and learn how to get the most from it.', '["Welcome to AI for Everyone. This course gives you a practical language for understanding intelligent systems.","Start with curiosity. You do not need a technical background to take part."]', 6, 1),
	('lesson_attention', 'module_foundations', 'How machines pay attention', 'article', 'Why attention changed the way machines understand language—and why it matters for the tools we use every day.', '["Imagine reading a paragraph while holding every word in your mind at once. You naturally decide which earlier words matter most to what you are reading now.","That selective focus is the idea behind attention. Instead of processing language as one long chain, an attention system looks across the whole input and weighs the relationships between its parts.","Take the sentence: She sat on the bank and watched the water. Nearby words make the river-bank interpretation more useful than the financial one. Meaning comes from relationships."]', 8, 2),
	('lesson_checkin', 'module_foundations', 'Quick check-in', 'quiz', 'Check your understanding of attention and context.', '["Use the ideas from this module to explain why context matters when a model encounters an ambiguous word."]', 5, 3),
	('lesson_patterns', 'module_systems', 'Patterns and predictions', 'article', 'Learn how examples become predictions.', '["Machine-learning systems find recurring structure in examples and use it to make informed predictions about new inputs."]', 9, 1),
	('lesson_models', 'module_systems', 'What a model knows', 'video', 'A closer look at knowledge, parameters, and limitations.', '["A model does not store knowledge like a library. Its parameters encode statistical relationships learned during training."]', 12, 2),
	('lesson_lab', 'module_systems', 'Build a tiny classifier', 'lab', 'Turn a small set of examples into a working classifier.', '["In this lab, you will label examples, test predictions, and reflect on where your classifier fails."]', 17, 3),
	('lesson_prompting', 'module_practice', 'Prompting with intention', 'article', 'Write prompts that communicate purpose and constraints.', '["Strong prompts clarify the desired outcome, provide relevant context, and describe useful constraints without over-specifying the solution."]', 10, 1),
	('lesson_project', 'module_practice', 'Final studio project', 'project', 'Apply the course concepts to a real problem.', '["Choose a problem you care about, propose an AI-assisted workflow, and identify where human judgment must remain in the loop."]', 35, 2);
