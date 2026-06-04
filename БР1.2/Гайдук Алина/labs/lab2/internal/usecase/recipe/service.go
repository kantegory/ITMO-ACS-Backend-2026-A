// Package recipe implements recipe application scenarios.
package recipe

import (
	"context"
	"errors"
	"fmt"
	"strings"

	catalogdomain "recipehub/internal/domain/catalog"
	identitydomain "recipehub/internal/domain/identity"
	recipedomain "recipehub/internal/domain/recipe"
)

const titleMaxLen = 255

// Application-level recipe errors.
var (
	ErrInvalidInput = errors.New("invalid recipe input")
	ErrNotFound     = errors.New("recipe entity not found")
	ErrForbidden    = errors.New("recipe action forbidden")
	ErrInvalidRefs  = errors.New("invalid catalog references")
)

// Repository is the persistence port required by recipe use cases.
type Repository interface {
	CreateRecipe(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.Recipe, error)
	RecipeByID(ctx context.Context, id uint64) (recipedomain.Recipe, error)
	ListRecipes(ctx context.Context, filters recipedomain.Filters) (recipedomain.Page[recipedomain.Recipe], error)
	UpdateRecipe(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.Recipe, error)
	DeleteRecipe(ctx context.Context, id uint64) error
	RecipeExists(ctx context.Context, id uint64) (bool, error)
	AuthorRecipeCount(ctx context.Context, authorID uint64) (int64, error)
}

// IdentityGateway is the identity-service port required by recipe use cases.
type IdentityGateway interface {
	UserExists(ctx context.Context, userID uint64) (bool, error)
	UsersBatch(ctx context.Context, ids []uint64) ([]identitydomain.UserShort, error)
}

// CatalogGateway is the catalog-service port required by recipe use cases.
type CatalogGateway interface {
	ValidateIDs(ctx context.Context, req catalogdomain.ValidateIDsRequest) (catalogdomain.ValidateIDsResult, error)
}

// EngagementGateway is the engagement-service port required by recipe use cases.
type EngagementGateway interface {
	RecipeStatsBatch(ctx context.Context, recipeIDs []uint64) (map[uint64]recipedomain.EngagementStats, error)
}

// Service coordinates recipe application scenarios.
type Service struct {
	repo       Repository
	identity   IdentityGateway
	catalog    CatalogGateway
	engagement EngagementGateway
}

// NewService creates recipe use cases.
func NewService(repo Repository, identity IdentityGateway, catalog CatalogGateway, engagement EngagementGateway) *Service {
	return &Service{repo: repo, identity: identity, catalog: catalog, engagement: engagement}
}

// CreateRecipe validates and creates a recipe.
func (s *Service) CreateRecipe(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.RecipeWithAuthor, error) {
	if err := validateRecipe(recipe); err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}
	if ok, err := s.identity.UserExists(ctx, recipe.AuthorID); err != nil || !ok {
		return recipedomain.RecipeWithAuthor{}, notFoundOrWrapped(err)
	}
	if err := s.validateCatalogRefs(ctx, recipe); err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}

	created, err := s.repo.CreateRecipe(ctx, recipe)
	if err != nil {
		return recipedomain.RecipeWithAuthor{}, fmt.Errorf("create recipe: %w", err)
	}

	return s.attachAuthor(ctx, created)
}

// GetRecipe returns a recipe by id.
func (s *Service) GetRecipe(ctx context.Context, id uint64) (recipedomain.RecipeWithAuthor, error) {
	recipe, err := s.repo.RecipeByID(ctx, id)
	if err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}

	return s.attachAuthor(ctx, recipe)
}

// ListRecipes returns paginated recipes.
func (s *Service) ListRecipes(ctx context.Context, filters recipedomain.Filters) (recipedomain.Page[recipedomain.RecipeWithAuthor], error) {
	if filters.AuthorID != nil {
		if ok, err := s.identity.UserExists(ctx, *filters.AuthorID); err != nil || !ok {
			return recipedomain.Page[recipedomain.RecipeWithAuthor]{}, notFoundOrWrapped(err)
		}
	}

	page, err := s.repo.ListRecipes(ctx, filters)
	if err != nil {
		return recipedomain.Page[recipedomain.RecipeWithAuthor]{}, err
	}

	items, err := s.attachAuthors(ctx, page.Items)
	if err != nil {
		return recipedomain.Page[recipedomain.RecipeWithAuthor]{}, err
	}

	return recipedomain.Page[recipedomain.RecipeWithAuthor]{Items: items, Total: page.Total}, nil
}

// PatchRecipe updates a recipe if actor is the author.
func (s *Service) PatchRecipe(ctx context.Context, id, actorID uint64, patch recipedomain.Recipe) (recipedomain.RecipeWithAuthor, error) {
	current, err := s.repo.RecipeByID(ctx, id)
	if err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}
	if current.AuthorID != actorID {
		return recipedomain.RecipeWithAuthor{}, ErrForbidden
	}

	current.Title = firstNonEmpty(patch.Title, current.Title)
	if patch.Description != nil {
		current.Description = patch.Description
	}
	if patch.CoverImageURL != nil {
		current.CoverImageURL = patch.CoverImageURL
	}
	if patch.VideoURL != nil {
		current.VideoURL = patch.VideoURL
	}
	if patch.DishTypeID != nil {
		current.DishTypeID = patch.DishTypeID
	}
	if patch.DifficultyID != nil {
		current.DifficultyID = patch.DifficultyID
	}
	if patch.PrepTimeMinutes != nil {
		current.PrepTimeMinutes = patch.PrepTimeMinutes
	}
	if patch.CookTimeMinutes != nil {
		current.CookTimeMinutes = patch.CookTimeMinutes
	}
	if patch.Servings != nil {
		current.Servings = patch.Servings
	}
	if patch.Steps != nil {
		current.Steps = patch.Steps
	}
	if patch.Ingredients != nil {
		current.Ingredients = patch.Ingredients
	}
	if patch.TagIDs != nil {
		current.TagIDs = patch.TagIDs
	}
	if err := validateRecipe(current); err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}
	if err := s.validateCatalogRefs(ctx, current); err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}

	updated, err := s.repo.UpdateRecipe(ctx, current)
	if err != nil {
		return recipedomain.RecipeWithAuthor{}, fmt.Errorf("update recipe: %w", err)
	}

	return s.attachAuthor(ctx, updated)
}

// DeleteRecipe deletes a recipe if actor is the author.
func (s *Service) DeleteRecipe(ctx context.Context, id, actorID uint64) error {
	recipe, err := s.repo.RecipeByID(ctx, id)
	if err != nil {
		return err
	}
	if recipe.AuthorID != actorID {
		return ErrForbidden
	}

	return s.repo.DeleteRecipe(ctx, id)
}

// RecipeExists reports whether a recipe exists.
func (s *Service) RecipeExists(ctx context.Context, id uint64) (bool, error) {
	return s.repo.RecipeExists(ctx, id)
}

// RecipeBrief returns short recipe card for internal consumers.
func (s *Service) RecipeBrief(ctx context.Context, id uint64) (recipedomain.Recipe, error) {
	return s.repo.RecipeByID(ctx, id)
}

// AuthorRecipeCount returns number of recipes by author.
func (s *Service) AuthorRecipeCount(ctx context.Context, authorID uint64) (int64, error) {
	return s.repo.AuthorRecipeCount(ctx, authorID)
}

func (s *Service) validateCatalogRefs(ctx context.Context, recipe recipedomain.Recipe) error {
	req := catalogdomain.ValidateIDsRequest{
		TagIDs:        recipe.TagIDs,
		IngredientIDs: ingredientIDs(recipe.Ingredients),
		UnitIDs:       unitIDs(recipe.Ingredients),
	}
	if recipe.DishTypeID != nil {
		req.DishTypeIDs = []uint64{*recipe.DishTypeID}
	}
	if recipe.DifficultyID != nil {
		req.DifficultyIDs = []uint64{*recipe.DifficultyID}
	}

	result, err := s.catalog.ValidateIDs(ctx, req)
	if err != nil {
		return fmt.Errorf("validate catalog refs: %w", err)
	}
	if !result.Valid {
		return ErrInvalidRefs
	}

	return nil
}

func (s *Service) attachAuthor(ctx context.Context, recipe recipedomain.Recipe) (recipedomain.RecipeWithAuthor, error) {
	items, err := s.attachAuthors(ctx, []recipedomain.Recipe{recipe})
	if err != nil {
		return recipedomain.RecipeWithAuthor{}, err
	}
	if len(items) == 0 {
		return recipedomain.RecipeWithAuthor{}, ErrNotFound
	}

	return items[0], nil
}

func (s *Service) attachAuthors(ctx context.Context, recipes []recipedomain.Recipe) ([]recipedomain.RecipeWithAuthor, error) {
	users, err := s.identity.UsersBatch(ctx, uniqueAuthorIDs(recipes))
	if err != nil {
		return nil, fmt.Errorf("load recipe authors: %w", err)
	}

	authors := make(map[uint64]recipedomain.AuthorPreview, len(users))
	for _, user := range users {
		authors[user.ID] = recipedomain.AuthorPreview{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
		}
	}

	out := make([]recipedomain.RecipeWithAuthor, 0, len(recipes))
	stats, err := s.recipeStats(ctx, recipes)
	if err != nil {
		return nil, err
	}
	for _, recipe := range recipes {
		out = append(out, recipedomain.RecipeWithAuthor{Recipe: recipe, Author: authors[recipe.AuthorID], Stats: stats[recipe.ID]})
	}

	return out, nil
}

func (s *Service) recipeStats(ctx context.Context, recipes []recipedomain.Recipe) (map[uint64]recipedomain.EngagementStats, error) {
	if s.engagement == nil || len(recipes) == 0 {
		return map[uint64]recipedomain.EngagementStats{}, nil
	}

	stats, err := s.engagement.RecipeStatsBatch(ctx, uniqueRecipeIDs(recipes))
	if err != nil {
		return nil, fmt.Errorf("load recipe engagement stats: %w", err)
	}

	return stats, nil
}

func validateRecipe(recipe recipedomain.Recipe) error {
	recipe.Title = strings.TrimSpace(recipe.Title)
	if recipe.Title == "" || len(recipe.Title) > titleMaxLen {
		return ErrInvalidInput
	}
	if recipe.PrepTimeMinutes != nil && *recipe.PrepTimeMinutes < 0 {
		return ErrInvalidInput
	}
	if recipe.CookTimeMinutes != nil && *recipe.CookTimeMinutes < 0 {
		return ErrInvalidInput
	}
	if recipe.Servings != nil && *recipe.Servings < 1 {
		return ErrInvalidInput
	}
	for _, step := range recipe.Steps {
		if step.StepNumber < 1 || strings.TrimSpace(step.Description) == "" {
			return ErrInvalidInput
		}
	}

	return nil
}

func ingredientIDs(items []recipedomain.Ingredient) []uint64 {
	out := make([]uint64, 0, len(items))
	for _, item := range items {
		out = append(out, item.IngredientID)
	}

	return out
}

func unitIDs(items []recipedomain.Ingredient) []uint64 {
	out := make([]uint64, 0, len(items))
	for _, item := range items {
		if item.UnitID != nil {
			out = append(out, *item.UnitID)
		}
	}

	return out
}

func uniqueAuthorIDs(recipes []recipedomain.Recipe) []uint64 {
	out := make([]uint64, 0, len(recipes))
	seen := make(map[uint64]struct{}, len(recipes))
	for _, recipe := range recipes {
		if _, ok := seen[recipe.AuthorID]; ok {
			continue
		}
		seen[recipe.AuthorID] = struct{}{}
		out = append(out, recipe.AuthorID)
	}

	return out
}

func uniqueRecipeIDs(recipes []recipedomain.Recipe) []uint64 {
	out := make([]uint64, 0, len(recipes))
	seen := make(map[uint64]struct{}, len(recipes))
	for _, recipe := range recipes {
		if _, ok := seen[recipe.ID]; ok {
			continue
		}
		seen[recipe.ID] = struct{}{}
		out = append(out, recipe.ID)
	}

	return out
}

func firstNonEmpty(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}

	return strings.TrimSpace(value)
}

func notFoundOrWrapped(err error) error {
	if err == nil {
		return ErrNotFound
	}

	return err
}
