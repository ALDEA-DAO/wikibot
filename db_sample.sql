CREATE TABLE `bot_search` (
	`id` SERIAL,
	`date` INT(11) NOT NULL,
	`query` VARCHAR(200) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`chat_type` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`from_id` BIGINT(20) NOT NULL DEFAULT '0',
	`from_user` VARCHAR(50) NOT NULL COLLATE 'utf8mb4_unicode_ci',
	`from_name` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`group_title` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`group_name` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	`group_id` VARCHAR(100) NULL DEFAULT NULL COLLATE 'utf8mb4_unicode_ci',
	PRIMARY KEY (`id`) USING BTREE,
	INDEX `Index 2` (`from_id`) USING BTREE
)
COLLATE='utf8mb4_unicode_ci'
ENGINE=InnoDB
;
