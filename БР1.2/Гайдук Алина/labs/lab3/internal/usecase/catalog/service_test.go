package catalog

import (
	"context"
	"errors"
	"slices"
	"testing"

	catalogdomain "recipehub/internal/domain/catalog"
)

func TestCreateDishTypeNormalizesName(t *testing.T) {
	repo := newMemoryRepository()
	service := NewService(repo)

	got, err := service.CreateDishType(context.Background(), "  Soup  ")
	if err != nil {
		t.Fatalf("CreateDishType returned error: %v", err)
	}

	if got.Name != "Soup" {
		t.Fatalf("Name = %q, want %q", got.Name, "Soup")
	}
}

func TestCreateDishTypeRejectsDuplicateName(t *testing.T) {
	repo := newMemoryRepository()
	repo.dishTypeNames["Soup"] = true
	service := NewService(repo)

	_, err := service.CreateDishType(context.Background(), "Soup")
	if !errors.Is(err, ErrAlreadyExists) {
		t.Fatalf("error = %v, want %v", err, ErrAlreadyExists)
	}
}

func TestValidateIDsReturnsMissingIDs(t *testing.T) {
	repo := newMemoryRepository()
	repo.dishTypeIDs = map[uint64]bool{1: true}
	repo.difficultyIDs = map[uint64]bool{2: true}
	repo.tagIDs = map[uint64]bool{3: true}
	repo.ingredientIDs = map[uint64]bool{4: true}
	repo.unitIDs = map[uint64]bool{5: true}
	service := NewService(repo)

	got, err := service.ValidateIDs(context.Background(), catalogdomain.ValidateIDsRequest{
		DishTypeIDs:   []uint64{1, 9, 9, 0},
		DifficultyIDs: []uint64{2},
		TagIDs:        []uint64{3, 7},
		IngredientIDs: []uint64{4},
		UnitIDs:       []uint64{5, 8},
	})
	if err != nil {
		t.Fatalf("ValidateIDs returned error: %v", err)
	}

	if got.Valid {
		t.Fatal("Valid = true, want false")
	}
	assertUint64SliceEqual(t, got.Invalid.DishTypeIDs, []uint64{9})
	assertUint64SliceEqual(t, got.Invalid.TagIDs, []uint64{7})
	assertUint64SliceEqual(t, got.Invalid.UnitIDs, []uint64{8})
}

type memoryRepository struct {
	nextID uint64

	dishTypeNames   map[string]bool
	tagNames        map[string]bool
	ingredientNames map[string]bool

	dishTypeIDs   map[uint64]bool
	difficultyIDs map[uint64]bool
	tagIDs        map[uint64]bool
	ingredientIDs map[uint64]bool
	unitIDs       map[uint64]bool
}

func newMemoryRepository() *memoryRepository {
	return &memoryRepository{
		nextID:          1,
		dishTypeNames:   map[string]bool{},
		tagNames:        map[string]bool{},
		ingredientNames: map[string]bool{},
		dishTypeIDs:     map[uint64]bool{},
		difficultyIDs:   map[uint64]bool{},
		tagIDs:          map[uint64]bool{},
		ingredientIDs:   map[uint64]bool{},
		unitIDs:         map[uint64]bool{},
	}
}

func (r *memoryRepository) ListDishTypes(context.Context) ([]catalogdomain.DishType, error) {
	return nil, nil
}

func (r *memoryRepository) ListDifficulties(context.Context) ([]catalogdomain.Difficulty, error) {
	return nil, nil
}

func (r *memoryRepository) ListTags(context.Context) ([]catalogdomain.Tag, error) {
	return nil, nil
}

func (r *memoryRepository) SearchIngredients(context.Context, string, int) ([]catalogdomain.Ingredient, error) {
	return nil, nil
}

func (r *memoryRepository) DishTypeNameExists(_ context.Context, name string) (bool, error) {
	return r.dishTypeNames[name], nil
}

func (r *memoryRepository) TagNameExists(_ context.Context, name string) (bool, error) {
	return r.tagNames[name], nil
}

func (r *memoryRepository) IngredientNameExists(_ context.Context, name string) (bool, error) {
	return r.ingredientNames[name], nil
}

func (r *memoryRepository) CreateDishType(_ context.Context, name string) (catalogdomain.DishType, error) {
	id := r.next()
	r.dishTypeNames[name] = true
	r.dishTypeIDs[id] = true

	return catalogdomain.DishType{ID: id, Name: name}, nil
}

func (r *memoryRepository) CreateTag(_ context.Context, name string) (catalogdomain.Tag, error) {
	id := r.next()
	r.tagNames[name] = true
	r.tagIDs[id] = true

	return catalogdomain.Tag{ID: id, Name: name}, nil
}

func (r *memoryRepository) CreateIngredient(_ context.Context, name string) (catalogdomain.Ingredient, error) {
	id := r.next()
	r.ingredientNames[name] = true
	r.ingredientIDs[id] = true

	return catalogdomain.Ingredient{ID: id, Name: name}, nil
}

func (r *memoryRepository) MissingDishTypeIDs(_ context.Context, ids []uint64) ([]uint64, error) {
	return missingIDs(ids, r.dishTypeIDs), nil
}

func (r *memoryRepository) MissingDifficultyIDs(_ context.Context, ids []uint64) ([]uint64, error) {
	return missingIDs(ids, r.difficultyIDs), nil
}

func (r *memoryRepository) MissingTagIDs(_ context.Context, ids []uint64) ([]uint64, error) {
	return missingIDs(ids, r.tagIDs), nil
}

func (r *memoryRepository) MissingIngredientIDs(_ context.Context, ids []uint64) ([]uint64, error) {
	return missingIDs(ids, r.ingredientIDs), nil
}

func (r *memoryRepository) MissingUnitIDs(_ context.Context, ids []uint64) ([]uint64, error) {
	return missingIDs(ids, r.unitIDs), nil
}

func (r *memoryRepository) next() uint64 {
	id := r.nextID
	r.nextID++

	return id
}

func missingIDs(ids []uint64, existing map[uint64]bool) []uint64 {
	out := make([]uint64, 0)
	for _, id := range ids {
		if !existing[id] {
			out = append(out, id)
		}
	}

	return out
}

func assertUint64SliceEqual(t *testing.T, got, want []uint64) {
	t.Helper()

	if !slices.Equal(got, want) {
		t.Fatalf("slice = %v, want %v", got, want)
	}
}
