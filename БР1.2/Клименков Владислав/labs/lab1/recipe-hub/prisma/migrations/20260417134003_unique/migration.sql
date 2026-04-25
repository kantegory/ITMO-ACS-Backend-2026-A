/*
  Warnings:

  - A unique constraint covering the columns `[title]` on the table `dish_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[title]` on the table `ingredients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "dish_types_title_key" ON "dish_types"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_title_key" ON "ingredients"("title");
