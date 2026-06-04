// Package catalogrepo adapts catalog use cases to a GORM database.
package catalogrepo

import (
	"context"
	"strings"

	catalogdomain "recipehub/internal/domain/catalog"
	catalogusecase "recipehub/internal/usecase/catalog"

	"gorm.io/gorm"
)

const (
	dishTypesTable        = "dish_types"
	difficultiesTable     = "difficulties"
	tagsTable             = "tags"
	ingredientsTable      = "ingredients"
	measurementUnitsTable = "measurement_units"
)

var _ catalogusecase.Repository = (*Repository)(nil)

// Repository stores catalog data in PostgreSQL via GORM.
type Repository struct {
	db *gorm.DB
}

// New creates a catalog repository adapter.
func New(db *gorm.DB) *Repository {
	return &Repository{db: db}
}

// ListDishTypes returns all dish types ordered by id.
func (r *Repository) ListDishTypes(ctx context.Context) ([]catalogdomain.DishType, error) {
	var rows []dishTypeRow
	if err := r.db.WithContext(ctx).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]catalogdomain.DishType, 0, len(rows))
	for _, row := range rows {
		out = append(out, catalogdomain.DishType{ID: row.ID, Name: row.Name})
	}

	return out, nil
}

// ListDifficulties returns all difficulty levels ordered by id.
func (r *Repository) ListDifficulties(ctx context.Context) ([]catalogdomain.Difficulty, error) {
	var rows []difficultyRow
	if err := r.db.WithContext(ctx).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]catalogdomain.Difficulty, 0, len(rows))
	for _, row := range rows {
		out = append(out, catalogdomain.Difficulty{ID: row.ID, Name: row.Name})
	}

	return out, nil
}

// ListTags returns all tags ordered by id.
func (r *Repository) ListTags(ctx context.Context) ([]catalogdomain.Tag, error) {
	var rows []tagRow
	if err := r.db.WithContext(ctx).Order("id ASC").Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]catalogdomain.Tag, 0, len(rows))
	for _, row := range rows {
		out = append(out, catalogdomain.Tag{ID: row.ID, Name: row.Name})
	}

	return out, nil
}

// SearchIngredients searches ingredients by name.
func (r *Repository) SearchIngredients(ctx context.Context, query string, limit int) ([]catalogdomain.Ingredient, error) {
	dbQuery := r.db.WithContext(ctx).Model(&ingredientRow{}).Order("name ASC").Limit(normalizeLimit(limit))
	if trimmed := strings.TrimSpace(query); trimmed != "" {
		dbQuery = dbQuery.Where("LOWER(name) LIKE ?", "%"+strings.ToLower(trimmed)+"%")
	}

	var rows []ingredientRow
	if err := dbQuery.Find(&rows).Error; err != nil {
		return nil, err
	}

	out := make([]catalogdomain.Ingredient, 0, len(rows))
	for _, row := range rows {
		out = append(out, catalogdomain.Ingredient{ID: row.ID, Name: row.Name})
	}

	return out, nil
}

// DishTypeNameExists checks dish type existence by normalized name.
func (r *Repository) DishTypeNameExists(ctx context.Context, name string) (bool, error) {
	return r.nameExists(ctx, dishTypesTable, name)
}

// TagNameExists checks tag existence by normalized name.
func (r *Repository) TagNameExists(ctx context.Context, name string) (bool, error) {
	return r.nameExists(ctx, tagsTable, name)
}

// IngredientNameExists checks ingredient existence by normalized name.
func (r *Repository) IngredientNameExists(ctx context.Context, name string) (bool, error) {
	return r.nameExists(ctx, ingredientsTable, name)
}

// CreateDishType creates a dish type.
func (r *Repository) CreateDishType(ctx context.Context, name string) (catalogdomain.DishType, error) {
	row := dishTypeRow{Name: strings.TrimSpace(name)}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return catalogdomain.DishType{}, err
	}

	return catalogdomain.DishType{ID: row.ID, Name: row.Name}, nil
}

// CreateTag creates a tag.
func (r *Repository) CreateTag(ctx context.Context, name string) (catalogdomain.Tag, error) {
	row := tagRow{Name: strings.TrimSpace(name)}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return catalogdomain.Tag{}, err
	}

	return catalogdomain.Tag{ID: row.ID, Name: row.Name}, nil
}

// CreateIngredient creates an ingredient.
func (r *Repository) CreateIngredient(ctx context.Context, name string) (catalogdomain.Ingredient, error) {
	row := ingredientRow{Name: strings.TrimSpace(name)}
	if err := r.db.WithContext(ctx).Create(&row).Error; err != nil {
		return catalogdomain.Ingredient{}, err
	}

	return catalogdomain.Ingredient{ID: row.ID, Name: row.Name}, nil
}

// MissingDishTypeIDs returns requested dish type ids absent from storage.
func (r *Repository) MissingDishTypeIDs(ctx context.Context, ids []uint64) ([]uint64, error) {
	return r.missingIDs(ctx, dishTypesTable, ids)
}

// MissingDifficultyIDs returns requested difficulty ids absent from storage.
func (r *Repository) MissingDifficultyIDs(ctx context.Context, ids []uint64) ([]uint64, error) {
	return r.missingIDs(ctx, difficultiesTable, ids)
}

// MissingTagIDs returns requested tag ids absent from storage.
func (r *Repository) MissingTagIDs(ctx context.Context, ids []uint64) ([]uint64, error) {
	return r.missingIDs(ctx, tagsTable, ids)
}

// MissingIngredientIDs returns requested ingredient ids absent from storage.
func (r *Repository) MissingIngredientIDs(ctx context.Context, ids []uint64) ([]uint64, error) {
	return r.missingIDs(ctx, ingredientsTable, ids)
}

// MissingUnitIDs returns requested measurement unit ids absent from storage.
func (r *Repository) MissingUnitIDs(ctx context.Context, ids []uint64) ([]uint64, error) {
	return r.missingIDs(ctx, measurementUnitsTable, ids)
}

func (r *Repository) nameExists(ctx context.Context, tableName, name string) (bool, error) {
	key := strings.ToLower(strings.TrimSpace(name))
	if key == "" {
		return false, nil
	}

	var count int64
	err := r.db.WithContext(ctx).
		Table(tableName).
		Where("LOWER(TRIM(name)) = ?", key).
		Count(&count).
		Error
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) missingIDs(ctx context.Context, tableName string, ids []uint64) ([]uint64, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	var existingIDs []uint64
	err := r.db.WithContext(ctx).
		Table(tableName).
		Where("id IN ?", ids).
		Pluck("id", &existingIDs).
		Error
	if err != nil {
		return nil, err
	}

	seen := make(map[uint64]struct{}, len(existingIDs))
	for _, id := range existingIDs {
		seen[id] = struct{}{}
	}

	missing := make([]uint64, 0)
	for _, id := range ids {
		if _, ok := seen[id]; !ok {
			missing = append(missing, id)
		}
	}

	return missing, nil
}

func normalizeLimit(limit int) int {
	if limit < 1 {
		return 1
	}

	return limit
}
