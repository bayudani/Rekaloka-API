/*
  Warnings:

  - You are about to drop the column `iconicInfoJson` on the `province` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `province` DROP COLUMN `iconicInfoJson`,
    ADD COLUMN `districts` TEXT NULL,
    ADD COLUMN `folklore` TEXT NULL,
    ADD COLUMN `languages` TEXT NULL,
    ADD COLUMN `monuments` TEXT NULL,
    ADD COLUMN `traditionalClothes` TEXT NULL,
    ADD COLUMN `traditionalDances` TEXT NULL,
    ADD COLUMN `traditionalFood` TEXT NULL,
    ADD COLUMN `traditionalHouse` TEXT NULL,
    ADD COLUMN `traditionalInstruments` TEXT NULL,
    ADD COLUMN `traditionalSongs` TEXT NULL,
    ADD COLUMN `traditionalWeapons` TEXT NULL;
