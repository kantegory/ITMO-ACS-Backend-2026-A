import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";

using TypeSpec.Http;
using TypeSpec.Rest;

@service
namespace RecipeAPI {

// Модели на основе БД

model User {
  @key user_id: int32;
  username: string;
  email: string;
  password_hash: string;
  avatar_url?: string;
  bio?: string;
  created_at: utcDateTime;
}

model CreateUser {
  username: string;
  email: string;
  password: string;
}

model UpdateUser {
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
}

model Recipe {
  @key recipe_id: int32;
  title: string;
  description: string;
  cooking_time: int32;
  difficulty: "easy" | "medium" | "hard";
  author_id: int32;
  created_at: utcDateTime;
}

model CreateRecipe {
  title: string;
  description: string;
  cooking_time: int32;
  difficulty: "easy" | "medium" | "hard";
  author_id: int32;
}

model UpdateRecipe {
  title?: string;
  description?: string;
  cooking_time?: int32;
  difficulty?: "easy" | "medium" | "hard";
}

model CreateStep {
  recipe_id: int32;
  step_number: int32;
  instruction: string;
}

model UpdateStep {
  step_number?: int32;
  instruction?: string;
}

model CreateRecipeIngredient {
  recipe_id: int32;
  ingredient_id: int32;
  quantity: float32;
  unit: string;
}

model UpdateRecipeIngredient {
  quantity?: float32;
  unit?: string;
}

model CreateCategory {
  name: string;
}

model UpdateCategory {
  name?: string;
}

model CreateComment {
  user_id: int32;
  recipe_id: int32;
  text: string;
}

model UpdateComment {
  text?: string;
}

model CreateSavedRecipe {
  user_id: int32;
  recipe_id: int32;
}

model CreateSubscription {
  subscriber_id: int32;
  author_id: int32;
}

model RecipeMedia {
  @key media_id: int32;
  recipe_id: int32;
  media_type: "image" | "video";
  media_url: string;
}

model Step {
  @key step_id: int32;
  recipe_id: int32;
  step_number: int32;
  instruction: string;
}

model Ingredient {
  @key ingredient_id: int32;
  name: string;
}

model RecipeIngredient {
  @key id: int32;
  recipe_id: int32;
  ingredient_id: int32;
  quantity: float32;
  unit: string;
}

model Category {
  @key category_id: int32;
  name: string;
}

model RecipeCategory {
  @key id: int32;
  recipe_id: int32;
  category_id: int32;
}

model Comment {
  @key comment_id: int32;
  user_id: int32;
  recipe_id: int32;
  text: string;
  created_at: utcDateTime;
}

model Like {
  @key like_id: int32;
  user_id: int32;
  recipe_id: int32;
  created_at: utcDateTime;
}

model SavedRecipe {
  @key id: int32;
  user_id: int32;
  recipe_id: int32;
  saved_at: utcDateTime;
}

model Subscription {
  @key id: int32;
  subscriber_id: int32;
  author_id: int32;
  created_at: utcDateTime;
}

model RecipeWithDetails {
  ...Recipe;
  steps: Step[];
  ingredients: RecipeIngredient[];
  media: RecipeMedia[];
  categories: Category[];
  comments: Comment[];
  likes: Like[];
}

// Операции

// Пользователи
@route("/users")
interface Users {
  @post
  createUser(@body user: CreateUser): User | ErrorResponse;

  @get
  listUsers(): User[] | ErrorResponse;

  @route("/{userId}")
  @get
  getUser(@path userId: int32): User | ErrorResponse;

  @put
  updateUser(@path userId: int32, @body user: UpdateUser): User | ErrorResponse;

  @delete
  deleteUser(@path userId: int32): { message: string } | ErrorResponse;
}

// Аутентификация
@route("/auth")
interface Auth {
  @post
  @route("/login")
  login(@body credentials: { email: string; password: string }): { token: string } | ErrorResponse;

  @post
  @route("/register")
  register(@body user: CreateUser): User | ErrorResponse;
}

// Рецепты
@route("/recipes")
interface Recipes {
  @get
  listRecipes(@query category?: string, @query author?: int32): Recipe[] | ErrorResponse;

  @post
  createRecipe(@body recipe: CreateRecipe): Recipe | ErrorResponse;

  @route("/{recipeId}")
  @get
  getRecipe(@path recipeId: int32): RecipeWithDetails | ErrorResponse;

  @put
  updateRecipe(@path recipeId: int32, @body recipe: UpdateRecipe): Recipe | ErrorResponse;

  @delete
  deleteRecipe(@path recipeId: int32): { message: string } | ErrorResponse;
}

// Шаги рецепта
@route("/recipes/{recipeId}/steps")
interface RecipeSteps {
  @get
  listSteps(@path recipeId: int32): Step[] | ErrorResponse;

  @post
  createStep(@path recipeId: int32, @body step: CreateStep): Step | ErrorResponse;

  @route("/{stepId}")
  @put
  updateStep(@path recipeId: int32, @path stepId: int32, @body step: UpdateStep): Step | ErrorResponse;

  @delete
  deleteStep(@path recipeId: int32, @path stepId: int32): { message: string } | ErrorResponse;
}

// Ингредиенты рецепта
@route("/recipes/{recipeId}/ingredients")
interface RecipeIngredients {
  @get
  listIngredients(@path recipeId: int32): RecipeIngredient[] | ErrorResponse;

  @post
  addIngredient(@path recipeId: int32, @body ingredient: CreateRecipeIngredient): RecipeIngredient | ErrorResponse;

  @route("/{ingredientId}")
  @put
  updateIngredient(@path recipeId: int32, @path ingredientId: int32, @body ingredient: UpdateRecipeIngredient): RecipeIngredient | ErrorResponse;

  @delete
  removeIngredient(@path recipeId: int32, @path ingredientId: int32): { message: string } | ErrorResponse;
}

// Категории
@route("/categories")
interface Categories {
  @get
  listCategories(): Category[] | ErrorResponse;

  @post
  createCategory(@body category: CreateCategory): Category | ErrorResponse;

  @route("/{categoryId}")
  @get
  getCategory(@path categoryId: int32): Category | ErrorResponse;

  @put
  updateCategory(@path categoryId: int32, @body category: UpdateCategory): Category | ErrorResponse;

  @delete
  deleteCategory(@path categoryId: int32): { message: string } | ErrorResponse;
}

// Комментарии
@route("/recipes/{recipeId}/comments")
interface Comments {
  @get
  listComments(@path recipeId: int32): Comment[] | ErrorResponse;

  @post
  createComment(@path recipeId: int32, @body comment: CreateComment): Comment | ErrorResponse;

  @route("/{commentId}")
  @put
  updateComment(@path recipeId: int32, @path commentId: int32, @body comment: UpdateComment): Comment | ErrorResponse;

  @delete
  deleteComment(@path recipeId: int32, @path commentId: int32): { message: string } | ErrorResponse;
}

// Лайки
@route("/recipes/{recipeId}/likes")
interface Likes {
  @get
  listLikes(@path recipeId: int32): Like[] | ErrorResponse;

  @post
  likeRecipe(@path recipeId: int32): Like | ErrorResponse;

  @delete
  unlikeRecipe(@path recipeId: int32): { message: string } | ErrorResponse;
}

// Сохраненные рецепты
@route("/users/{userId}/saved")
interface SavedRecipes {
  @get
  listSaved(@path userId: int32): SavedRecipe[] | ErrorResponse;

  @post
  saveRecipe(@path userId: int32, @body saved: CreateSavedRecipe): SavedRecipe | ErrorResponse;

  @delete
  unsaveRecipe(@path userId: int32, @query recipeId: int32): { message: string } | ErrorResponse;
}

// Подписки
@route("/users/{userId}/subscriptions")
interface Subscriptions {
  @get
  listSubscriptions(@path userId: int32): Subscription[] | ErrorResponse;

  @post
  subscribe(@path userId: int32, @body sub: CreateSubscription): Subscription | ErrorResponse;

  @delete
  unsubscribe(@path userId: int32, @query authorId: int32): { message: string } | ErrorResponse;
}

// Ошибки
model ErrorResponse {
  error: string;
  message: string;
  statusCode: int32;
}
}