// Package catalog implements catalog application scenarios.
package catalog

import (
	"context"
	"errors"
	"fmt"
	"strings"

	catalogdomain "recipehub/internal/domain/catalog"
)

const (
	dishTypeNameMaxLen   = 100
	tagNameMaxLen        = 100
	ingredientNameMaxLen = 200
)

// Application-level catalog errors.
var (
	ErrInvalidName   = errors.New("invalid catalog item name")
	ErrAlreadyExists = errors.New("catalog item already exists")
)

// Repository is the persistence port required by catalog use cases.
type Repository interface {
	ListDishTypes(ctx context.Context) ([]catalogdomain.DishType, error)
	ListDifficulties(ctx context.Context) ([]catalogdomain.Difficulty, error)
	ListTags(ctx context.Context) ([]catalogdomain.Tag, error)
	SearchIngredients(ctx context.Context, query string, limit int) ([]catalogdomain.Ingredient, error)

	DishTypeNameExists(ctx context.Context, name string) (bool, error)
	TagNameExists(ctx context.Context, name string) (bool, error)
	IngredientNameExists(ctx context.Context, name string) (bool, error)

	CreateDishType(ctx context.Context, name string) (catalogdomain.DishType, error)
	CreateTag(ctx context.Context, name string) (catalogdomain.Tag, error)
	CreateIngredient(ctx context.Context, name string) (catalogdomain.Ingredient, error)

	MissingDishTypeIDs(ctx context.Context, ids []uint64) ([]uint64, error)
	MissingDifficultyIDs(ctx context.Context, ids []uint64) ([]uint64, error)
	MissingTagIDs(ctx context.Context, ids []uint64) ([]uint64, error)
	MissingIngredientIDs(ctx context.Context, ids []uint64) ([]uint64, error)
	MissingUnitIDs(ctx context.Context, ids []uint64) ([]uint64, error)
}

// Service coordinates catalog application scenarios.
type Service struct {
	repo Repository
}

// NewService creates catalog use cases.
func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

// ListDishTypes returns all dish types.
func (s *Service) ListDishTypes(ctx context.Context) ([]catalogdomain.DishType, error) {
	return s.repo.ListDishTypes(ctx)
}

// ListDifficulties returns all difficulty levels.
func (s *Service) ListDifficulties(ctx context.Context) ([]catalogdomain.Difficulty, error) {
	return s.repo.ListDifficulties(ctx)
}

// ListTags returns all tags.
func (s *Service) ListTags(ctx context.Context) ([]catalogdomain.Tag, error) {
	return s.repo.ListTags(ctx)
}

// SearchIngredients searches ingredients with a caller-provided limit.
func (s *Service) SearchIngredients(ctx context.Context, query string, limit int) ([]catalogdomain.Ingredient, error) {
	return s.repo.SearchIngredients(ctx, strings.TrimSpace(query), limit)
}

// CreateDishType validates and creates a dish type.
func (s *Service) CreateDishType(ctx context.Context, name string) (catalogdomain.DishType, error) {
	normalized, err := normalizeName(name, dishTypeNameMaxLen)
	if err != nil {
		return catalogdomain.DishType{}, err
	}

	exists, err := s.repo.DishTypeNameExists(ctx, normalized)
	if err != nil {
		return catalogdomain.DishType{}, fmt.Errorf("check dish type name: %w", err)
	}
	if exists {
		return catalogdomain.DishType{}, ErrAlreadyExists
	}

	created, err := s.repo.CreateDishType(ctx, normalized)
	if err != nil {
		return catalogdomain.DishType{}, fmt.Errorf("create dish type: %w", err)
	}

	return created, nil
}

// CreateTag validates and creates a tag.
func (s *Service) CreateTag(ctx context.Context, name string) (catalogdomain.Tag, error) {
	normalized, err := normalizeName(name, tagNameMaxLen)
	if err != nil {
		return catalogdomain.Tag{}, err
	}

	exists, err := s.repo.TagNameExists(ctx, normalized)
	if err != nil {
		return catalogdomain.Tag{}, fmt.Errorf("check tag name: %w", err)
	}
	if exists {
		return catalogdomain.Tag{}, ErrAlreadyExists
	}

	created, err := s.repo.CreateTag(ctx, normalized)
	if err != nil {
		return catalogdomain.Tag{}, fmt.Errorf("create tag: %w", err)
	}

	return created, nil
}

// CreateIngredient validates and creates an ingredient.
func (s *Service) CreateIngredient(ctx context.Context, name string) (catalogdomain.Ingredient, error) {
	normalized, err := normalizeName(name, ingredientNameMaxLen)
	if err != nil {
		return catalogdomain.Ingredient{}, err
	}

	exists, err := s.repo.IngredientNameExists(ctx, normalized)
	if err != nil {
		return catalogdomain.Ingredient{}, fmt.Errorf("check ingredient name: %w", err)
	}
	if exists {
		return catalogdomain.Ingredient{}, ErrAlreadyExists
	}

	created, err := s.repo.CreateIngredient(ctx, normalized)
	if err != nil {
		return catalogdomain.Ingredient{}, fmt.Errorf("create ingredient: %w", err)
	}

	return created, nil
}

// ValidateIDs verifies that referenced catalog identifiers exist.
func (s *Service) ValidateIDs(ctx context.Context, req catalogdomain.ValidateIDsRequest) (catalogdomain.ValidateIDsResult, error) {
	var invalid catalogdomain.InvalidIDs

	dishTypeIDs, err := s.repo.MissingDishTypeIDs(ctx, uniquePositive(req.DishTypeIDs))
	if err != nil {
		return catalogdomain.ValidateIDsResult{}, fmt.Errorf("validate dish type ids: %w", err)
	}
	invalid.DishTypeIDs = dishTypeIDs

	difficultyIDs, err := s.repo.MissingDifficultyIDs(ctx, uniquePositive(req.DifficultyIDs))
	if err != nil {
		return catalogdomain.ValidateIDsResult{}, fmt.Errorf("validate difficulty ids: %w", err)
	}
	invalid.DifficultyIDs = difficultyIDs

	tagIDs, err := s.repo.MissingTagIDs(ctx, uniquePositive(req.TagIDs))
	if err != nil {
		return catalogdomain.ValidateIDsResult{}, fmt.Errorf("validate tag ids: %w", err)
	}
	invalid.TagIDs = tagIDs

	ingredientIDs, err := s.repo.MissingIngredientIDs(ctx, uniquePositive(req.IngredientIDs))
	if err != nil {
		return catalogdomain.ValidateIDsResult{}, fmt.Errorf("validate ingredient ids: %w", err)
	}
	invalid.IngredientIDs = ingredientIDs

	unitIDs, err := s.repo.MissingUnitIDs(ctx, uniquePositive(req.UnitIDs))
	if err != nil {
		return catalogdomain.ValidateIDsResult{}, fmt.Errorf("validate unit ids: %w", err)
	}
	invalid.UnitIDs = unitIDs

	return catalogdomain.ValidateIDsResult{
		Valid:   invalid.Empty(),
		Invalid: invalid,
	}, nil
}

func normalizeName(name string, maxLen int) (string, error) {
	normalized := strings.TrimSpace(name)
	if normalized == "" || len(normalized) > maxLen {
		return "", ErrInvalidName
	}

	return normalized, nil
}

func uniquePositive(ids []uint64) []uint64 {
	out := make([]uint64, 0, len(ids))
	seen := make(map[uint64]struct{}, len(ids))

	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}

	return out
}
