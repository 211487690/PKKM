-- Skema Database MySQL untuk SIP-PKKM 2026 MIS ALMAARIF 06 TOYOMARTO
-- Jalankan file ini terlebih dahulu sebelum database/seed.sql
-- Catatan: Jika menggunakan MySQL lokal, aktifkan 2 baris berikut. Untuk Cloud MySQL (TiDB/Aiven/Railway), langsung pilih database target Anda.
-- CREATE DATABASE IF NOT EXISTS `pkkm_almaarif06` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE `pkkm_almaarif06`;

DROP TABLE IF EXISTS `notification_reads`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `indicator_pics`;
DROP TABLE IF EXISTS `bukti_fisik_items`;
DROP TABLE IF EXISTS `indicators`;
DROP TABLE IF EXISTS `components`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `role` VARCHAR(120) NOT NULL,
  `initials` VARCHAR(8) NOT NULL,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `components` (
  `id` INT NOT NULL,
  `code` VARCHAR(10) NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `short_title` VARCHAR(100) NOT NULL,
  `category` VARCHAR(120) NOT NULL,
  `total_indicators` INT NOT NULL,
  `max_score` INT NOT NULL,
  `description` TEXT NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `indicators` (
  `id` VARCHAR(20) NOT NULL,
  `component_id` INT NOT NULL,
  `no` INT NOT NULL,
  `unsur_tugas` TEXT NOT NULL,
  `indikator_kinerja` TEXT NOT NULL,
  `raw_keterangan` VARCHAR(255) NOT NULL,
  `status` ENUM('belum', 'proses', 'disetorkan') NOT NULL DEFAULT 'belum',
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `archived_by` VARCHAR(64) NULL,
  `archived_at` TIMESTAMP NULL DEFAULT NULL,
  `lokasi_berkas` VARCHAR(500) NOT NULL DEFAULT '',
  `catatan` TEXT NULL,
  `updated_by` VARCHAR(64) NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_component_no` (`component_id`, `no`),
  INDEX `idx_status` (`status`),
  INDEX `idx_archived` (`is_archived`),
  CONSTRAINT `fk_indicator_component` FOREIGN KEY (`component_id`) REFERENCES `components` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_indicator_updater` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bukti_fisik_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `indicator_id` VARCHAR(20) NOT NULL,
  `item_order` INT NOT NULL,
  `description` TEXT NOT NULL,
  `is_checked` TINYINT(1) NOT NULL DEFAULT 0,
  `checked_by` VARCHAR(64) NULL,
  `checked_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_bukti_indicator` (`indicator_id`, `item_order`),
  CONSTRAINT `fk_bukti_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `indicators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bukti_user` FOREIGN KEY (`checked_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `indicator_pics` (
  `indicator_id` VARCHAR(20) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`indicator_id`, `user_id`),
  INDEX `idx_pic_user` (`user_id`),
  CONSTRAINT `fk_ip_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `indicators` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ip_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `actor_id` VARCHAR(64) NOT NULL,
  `actor_name` VARCHAR(120) NOT NULL,
  `indicator_id` VARCHAR(20) NOT NULL,
  `component_id` INT NOT NULL,
  `indicator_no` INT NOT NULL,
  `type` ENUM('status_change', 'subitem_check', 'location_update', 'milestone', 'archive_update') NOT NULL DEFAULT 'status_change',
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `target_user_ids` JSON NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notif_created` (`created_at`),
  INDEX `idx_notif_component` (`component_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notification_reads` (
  `notification_id` BIGINT NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `read_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`, `user_id`),
  CONSTRAINT `fk_nr_notif` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_nr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
