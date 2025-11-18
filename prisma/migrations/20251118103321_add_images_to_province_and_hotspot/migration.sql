-- AlterTable
ALTER TABLE `culturalhotspot` ADD COLUMN `imageUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `province` ADD COLUMN `backgroundUrl` VARCHAR(191) NULL,
    ADD COLUMN `logoUrl` VARCHAR(191) NULL;
