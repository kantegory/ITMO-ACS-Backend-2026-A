/*
  Warnings:

  - You are about to drop the column `recipe_step_id` on the `recipe_media` table. All the data in the column will be lost.
  - Added the required column `recipe_id` to the `recipe_media` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "recipe_media" DROP CONSTRAINT "recipe_media_recipe_step_id_fkey";

-- AlterTable
ALTER TABLE "recipe_media" DROP COLUMN "recipe_step_id",
ADD COLUMN     "recipe_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
