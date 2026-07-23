CREATE TABLE `applications` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`company_id` text NOT NULL,
	`company_name` text NOT NULL,
	`role_title` text NOT NULL,
	`employment_type` text DEFAULT 'internship' NOT NULL,
	`region` text DEFAULT 'US' NOT NULL,
	`status` text DEFAULT 'researching' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`job_url` text DEFAULT '' NOT NULL,
	`deadline` text DEFAULT '' NOT NULL,
	`sponsorship_signal` text DEFAULT 'unknown' NOT NULL,
	`export_signal` text DEFAULT 'unknown' NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`resume_version` text DEFAULT '' NOT NULL,
	`jd_keywords` text DEFAULT '' NOT NULL,
	`source_observed_at` text DEFAULT '' NOT NULL,
	`match_score` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `bookmarks` (
	`user_id` text NOT NULL,
	`company_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `company_id`)
);
--> statement-breakpoint
CREATE TABLE `preferences` (
	`user_id` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `key`)
);
--> statement-breakpoint
CREATE TABLE `question_attempts` (
	`user_id` text NOT NULL,
	`id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_version` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`confidence` integer DEFAULT 0 NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `id`)
);
--> statement-breakpoint
CREATE TABLE `question_stats` (
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`question_version` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`latest_score` integer DEFAULT 0 NOT NULL,
	`total_score` integer DEFAULT 0 NOT NULL,
	`latest_confidence` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `question_id`, `question_version`)
);
--> statement-breakpoint
CREATE TABLE `skill_progress` (
	`user_id` text NOT NULL,
	`skill_id` text NOT NULL,
	`mastery` integer DEFAULT 0 NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `skill_id`)
);
