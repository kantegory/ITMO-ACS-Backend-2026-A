// Package catalog contains reference data domain types.
package catalog

// DishType describes a recipe dish category.
type DishType struct {
	ID   uint64
	Name string
}

// Difficulty describes a recipe complexity level.
type Difficulty struct {
	ID   uint64
	Name string
}

// Tag describes a recipe tag.
type Tag struct {
	ID   uint64
	Name string
}

// Ingredient describes an ingredient from the catalog.
type Ingredient struct {
	ID   uint64
	Name string
}

// MeasurementUnit describes an ingredient measurement unit.
type MeasurementUnit struct {
	ID        uint64
	Name      string
	ShortName string
}

// ValidateIDsRequest contains catalog identifiers referenced by another service.
type ValidateIDsRequest struct {
	DishTypeIDs   []uint64
	DifficultyIDs []uint64
	TagIDs        []uint64
	IngredientIDs []uint64
	UnitIDs       []uint64
}

// InvalidIDs contains identifiers missing from the catalog.
type InvalidIDs struct {
	DishTypeIDs   []uint64
	DifficultyIDs []uint64
	TagIDs        []uint64
	IngredientIDs []uint64
	UnitIDs       []uint64
}

// Empty reports whether all invalid identifier lists are empty.
func (i InvalidIDs) Empty() bool {
	return len(i.DishTypeIDs) == 0 &&
		len(i.DifficultyIDs) == 0 &&
		len(i.TagIDs) == 0 &&
		len(i.IngredientIDs) == 0 &&
		len(i.UnitIDs) == 0
}

// ValidateIDsResult reports whether all referenced catalog identifiers exist.
type ValidateIDsResult struct {
	Valid   bool
	Invalid InvalidIDs
}
