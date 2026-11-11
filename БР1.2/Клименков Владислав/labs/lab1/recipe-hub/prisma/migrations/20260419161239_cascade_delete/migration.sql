/*
  Warnings:

  - You are about to drop the column `parent_id` on the `comments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "comment_likes" DROP CONSTRAINT "comment_likes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_dish_types" DROP CONSTRAINT "recipe_dish_types_dish_type_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_dish_types" DROP CONSTRAINT "recipe_dish_types_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_media" DROP CONSTRAINT "recipe_media_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ratings" DROP CONSTRAINT "recipe_ratings_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ratings" DROP CONSTRAINT "recipe_ratings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_step_media" DROP CONSTRAINT "recipe_step_media_recipe_step_id_fkey";

-- DropForeignKey
ALTER TABLE "recipe_steps" DROP CONSTRAINT "recipe_steps_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_author_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_recipes" DROP CONSTRAINT "saved_recipes_recipe_id_fkey";

-- DropForeignKey
ALTER TABLE "saved_recipes" DROP CONSTRAINT "saved_recipes_user_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_subscribed_to_id_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_subscriber_id_fkey";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "parent_id";

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_media" ADD CONSTRAINT "recipe_media_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_dish_types" ADD CONSTRAINT "recipe_dish_types_dish_type_id_fkey" FOREIGN KEY ("dish_type_id") REFERENCES "dish_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_dish_types" ADD CONSTRAINT "recipe_dish_types_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_step_media" ADD CONSTRAINT "recipe_step_media_recipe_step_id_fkey" FOREIGN KEY ("recipe_step_id") REFERENCES "recipe_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_recipes" ADD CONSTRAINT "saved_recipes_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_recipe_id_fkey" FOREIGN KEY ("recipe_id") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscriber_id_fkey" FOREIGN KEY ("subscriber_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_subscribed_to_id_fkey" FOREIGN KEY ("subscribed_to_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
