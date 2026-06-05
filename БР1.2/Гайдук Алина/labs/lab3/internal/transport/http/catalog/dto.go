package catalog

import catalogdomain "recipehub/internal/domain/catalog"

type referenceNameRequest struct {
	Name string `json:"name"`
}

type dishTypeResponse struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type difficultyResponse struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type tagResponse struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type ingredientResponse struct {
	ID   uint64 `json:"id"`
	Name string `json:"name"`
}

type validateIDsRequest struct {
	DishTypeIDs   []uint64 `json:"dish_type_ids"`
	DifficultyIDs []uint64 `json:"difficulty_ids"`
	TagIDs        []uint64 `json:"tag_ids"`
	IngredientIDs []uint64 `json:"ingredient_ids"`
	UnitIDs       []uint64 `json:"unit_ids"`
}

type invalidIDsResponse struct {
	DishTypeIDs   []uint64 `json:"dish_type_ids,omitempty"`
	DifficultyIDs []uint64 `json:"difficulty_ids,omitempty"`
	TagIDs        []uint64 `json:"tag_ids,omitempty"`
	IngredientIDs []uint64 `json:"ingredient_ids,omitempty"`
	UnitIDs       []uint64 `json:"unit_ids,omitempty"`
}

type validateIDsResponse struct {
	Valid   bool               `json:"valid"`
	Invalid invalidIDsResponse `json:"invalid"`
}

func toDishTypeResponse(row catalogdomain.DishType) dishTypeResponse {
	return dishTypeResponse{ID: row.ID, Name: row.Name}
}

func toDifficultyResponse(row catalogdomain.Difficulty) difficultyResponse {
	return difficultyResponse{ID: row.ID, Name: row.Name}
}

func toTagResponse(row catalogdomain.Tag) tagResponse {
	return tagResponse{ID: row.ID, Name: row.Name}
}

func toIngredientResponse(row catalogdomain.Ingredient) ingredientResponse {
	return ingredientResponse{ID: row.ID, Name: row.Name}
}

func toValidateIDsDomain(req validateIDsRequest) catalogdomain.ValidateIDsRequest {
	return catalogdomain.ValidateIDsRequest{
		DishTypeIDs:   req.DishTypeIDs,
		DifficultyIDs: req.DifficultyIDs,
		TagIDs:        req.TagIDs,
		IngredientIDs: req.IngredientIDs,
		UnitIDs:       req.UnitIDs,
	}
}

func toValidateIDsResponse(result catalogdomain.ValidateIDsResult) validateIDsResponse {
	return validateIDsResponse{
		Valid: result.Valid,
		Invalid: invalidIDsResponse{
			DishTypeIDs:   result.Invalid.DishTypeIDs,
			DifficultyIDs: result.Invalid.DifficultyIDs,
			TagIDs:        result.Invalid.TagIDs,
			IngredientIDs: result.Invalid.IngredientIDs,
			UnitIDs:       result.Invalid.UnitIDs,
		},
	}
}
