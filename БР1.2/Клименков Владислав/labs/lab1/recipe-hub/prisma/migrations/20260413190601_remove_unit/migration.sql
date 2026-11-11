/*
  Warnings:

  - You are about to drop the column `alt_unit_text` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `preparation_note` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `unit_id` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the `units` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_unit_id_fkey";

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "alt_unit_text",
DROP COLUMN "preparation_note",
DROP COLUMN "quantity",
DROP COLUMN "unit_id";

-- DropTable
DROP TABLE "units";
