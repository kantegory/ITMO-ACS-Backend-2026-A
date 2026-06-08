package main

import (
	"log"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"recipe-lab2/internal/common"
)

type store struct {
	mu               sync.RWMutex
	recipes          map[int]common.RecipeDetails
	nextRecipeID     int
	nextIngredientID int
	nextStepID       int
	fallbackLikes    map[int]int
	fallbackComments map[int]int
	mq               *common.RabbitMQ
}

func main() {
	s := &store{
		recipes:          make(map[int]common.RecipeDetails),
		fallbackLikes:    make(map[int]int),
		fallbackComments: make(map[int]int),
		mq:               common.NewRabbitMQFromEnv(),
	}
	s.seed()
	go s.consumeRecipeEvents()

	mux := http.NewServeMux()
	mux.HandleFunc("/api/v1/recipes", s.recipesHandler)
	mux.HandleFunc("/api/v1/recipes/", s.recipeByIDHandler)
	mux.HandleFunc("/api/v1/users/me/recipes", s.myRecipesHandler)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		common.JSON(w, http.StatusOK, map[string]string{"service": "recipe-service", "status": "ok"})
	})

	log.Println("recipe-service listening on :8082")
	log.Fatal(http.ListenAndServe(":8082", mux))
}

func (s *store) myRecipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	s.list(w, r, userID)
}

func (s *store) recipesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		s.list(w, r, 0)
		return
	}
	if r.Method != http.MethodPost {
		common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
		return
	}
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	var req common.CreateRecipeRequest
	if err := common.Decode(r, &req); err != nil {
		common.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
		return
	}
	if !validRecipe(req) {
		common.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid recipe data")
		return
	}
	recipe := s.create(userID, req)
	common.JSON(w, http.StatusCreated, recipe)
}

func (s *store) recipeByIDHandler(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/recipes/"), "/"), "/")
	if len(parts) != 1 {
		common.Error(w, http.StatusNotFound, "NOT_FOUND", "route not found")
		return
	}
	recipeID, ok := parseID(w, parts[0])
	if !ok {
		return
	}
	if r.Method == http.MethodGet {
		recipe, exists := s.get(recipeID)
		if !exists {
			common.Error(w, http.StatusNotFound, "NOT_FOUND", "recipe not found")
			return
		}
		common.JSON(w, http.StatusOK, recipe)
		return
	}
	userID, ok := requireUserID(w, r)
	if !ok {
		return
	}
	if r.Method == http.MethodPut {
		var req common.CreateRecipeRequest
		if err := common.Decode(r, &req); err != nil {
			common.Error(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON body")
			return
		}
		recipe, status := s.update(userID, recipeID, req)
		if status != 0 {
			writeRecipeStatus(w, status)
			return
		}
		common.JSON(w, http.StatusOK, recipe)
		return
	}
	if r.Method == http.MethodDelete {
		status := s.delete(userID, recipeID)
		if status != 0 {
			writeRecipeStatus(w, status)
			return
		}
		common.Empty(w, http.StatusNoContent)
		return
	}
	common.Error(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "method not allowed")
}

func (s *store) list(w http.ResponseWriter, r *http.Request, ownerID int) {
	query := r.URL.Query()
	page := intQuery(query.Get("page"), 1)
	pageSize := intQuery(query.Get("page_size"), 20)
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	difficulty := query.Get("difficulty")
	dishType := query.Get("dish_type")
	ingredients := splitCSV(query.Get("ingredients"))

	s.mu.RLock()
	items := make([]common.RecipeCard, 0)
	for _, recipe := range s.recipes {
		if ownerID > 0 && recipe.UserID != ownerID {
			continue
		}
		if difficulty != "" && recipe.Difficulty != difficulty {
			continue
		}
		if dishType != "" && !strings.EqualFold(recipe.DishType, dishType) {
			continue
		}
		if len(ingredients) > 0 && !hasIngredients(recipe.Ingredients, ingredients) {
			continue
		}
		card := recipe.RecipeCard
		card.LikesCount = s.fallbackLikes[recipe.ID]
		card.CommentsCount = s.fallbackComments[recipe.ID]
		items = append(items, card)
	}
	s.mu.RUnlock()

	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}
	common.JSON(w, http.StatusOK, common.RecipeListResponse{Items: items[start:end], Page: page, PageSize: pageSize, Total: total})
}

func (s *store) create(userID int, req common.CreateRecipeRequest) common.RecipeDetails {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.nextRecipeID++
	recipe := common.RecipeDetails{
		RecipeCard: common.RecipeCard{
			ID:          s.nextRecipeID,
			UserID:      userID,
			Title:       strings.TrimSpace(req.Title),
			Description: req.Description,
			DishType:    strings.TrimSpace(req.DishType),
			Difficulty:  req.Difficulty,
			CookingTime: req.CookingTime,
			PhotoURL:    req.PhotoURL,
			VideoURL:    req.VideoURL,
			CreatedAt:   time.Now().UTC(),
		},
		Ingredients: s.ingredients(req.Ingredients),
		Steps:       s.steps(req.Steps),
	}
	s.recipes[recipe.ID] = recipe
	return recipe
}

func (s *store) get(recipeID int) (common.RecipeDetails, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	recipe, exists := s.recipes[recipeID]
	recipe.LikesCount = s.fallbackLikes[recipeID]
	recipe.CommentsCount = s.fallbackComments[recipeID]
	return recipe, exists
}

func (s *store) update(userID, recipeID int, req common.CreateRecipeRequest) (common.RecipeDetails, int) {
	if !validRecipe(req) {
		return common.RecipeDetails{}, http.StatusBadRequest
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	recipe, exists := s.recipes[recipeID]
	if !exists {
		return common.RecipeDetails{}, http.StatusNotFound
	}
	if recipe.UserID != userID {
		return common.RecipeDetails{}, http.StatusForbidden
	}
	recipe.Title = strings.TrimSpace(req.Title)
	recipe.Description = req.Description
	recipe.DishType = strings.TrimSpace(req.DishType)
	recipe.Difficulty = req.Difficulty
	recipe.CookingTime = req.CookingTime
	recipe.PhotoURL = req.PhotoURL
	recipe.VideoURL = req.VideoURL
	recipe.Ingredients = s.ingredients(req.Ingredients)
	recipe.Steps = s.steps(req.Steps)
	s.recipes[recipeID] = recipe
	return recipe, 0
}

func (s *store) delete(userID, recipeID int) int {
	s.mu.Lock()
	defer s.mu.Unlock()
	recipe, exists := s.recipes[recipeID]
	if !exists {
		return http.StatusNotFound
	}
	if recipe.UserID != userID {
		return http.StatusForbidden
	}
	delete(s.recipes, recipeID)
	return 0
}

func (s *store) seed() {
	description := "Рецепт из стартовых данных recipe-service"
	cookingTime := 15
	s.create(1, common.CreateRecipeRequest{
		Title:       "Брускетта с томатами",
		Description: &description,
		DishType:    "snack",
		Difficulty:  "easy",
		CookingTime: &cookingTime,
		Ingredients: []common.IngredientInput{{Name: "tomato", Amount: "2 шт"}, {Name: "garlic", Amount: "1 зубчик"}},
		Steps:       []common.StepInput{{StepNumber: 1, Text: "Подсушить хлеб"}, {StepNumber: 2, Text: "Добавить томаты"}},
	})
}

func (s *store) consumeRecipeEvents() {
	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()
	for {
		<-ticker.C
		events, err := s.mq.ConsumeEvents(20)
		if err != nil {
			log.Printf("rabbitmq consume skipped: %v", err)
			continue
		}
		for _, event := range events {
			s.applyEvent(event)
		}
	}
}

func (s *store) applyEvent(event common.RecipeEvent) {
	s.mu.Lock()
	defer s.mu.Unlock()
	switch event.Type {
	case common.EventRecipeLiked, common.EventRecipeUnliked:
		s.fallbackLikes[event.RecipeID] += event.Delta
		if s.fallbackLikes[event.RecipeID] < 0 {
			s.fallbackLikes[event.RecipeID] = 0
		}
	case common.EventCommentCreated, common.EventCommentDeleted:
		s.fallbackComments[event.RecipeID] += event.Delta
		if s.fallbackComments[event.RecipeID] < 0 {
			s.fallbackComments[event.RecipeID] = 0
		}
	case common.EventRecipeSaved, common.EventRecipeUnsaved:
		log.Printf("recipe-service received cabinet event %s for recipe %d", event.Type, event.RecipeID)
	}
}

func (s *store) ingredients(inputs []common.IngredientInput) []common.Ingredient {
	result := make([]common.Ingredient, 0, len(inputs))
	for _, input := range inputs {
		s.nextIngredientID++
		result = append(result, common.Ingredient{ID: s.nextIngredientID, Name: strings.TrimSpace(input.Name), Amount: strings.TrimSpace(input.Amount)})
	}
	return result
}

func (s *store) steps(inputs []common.StepInput) []common.Step {
	result := make([]common.Step, 0, len(inputs))
	for _, input := range inputs {
		s.nextStepID++
		result = append(result, common.Step{ID: s.nextStepID, StepNumber: input.StepNumber, Text: strings.TrimSpace(input.Text)})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].StepNumber < result[j].StepNumber })
	return result
}

func requireUserID(w http.ResponseWriter, r *http.Request) (int, bool) {
	userID, err := strconv.Atoi(r.Header.Get("X-User-ID"))
	if err != nil || userID < 1 {
		common.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "gateway user context required")
		return 0, false
	}
	return userID, true
}

func parseID(w http.ResponseWriter, raw string) (int, bool) {
	id, err := strconv.Atoi(raw)
	if err != nil || id < 1 {
		common.Error(w, http.StatusBadRequest, "VALIDATION_ERROR", "invalid id")
		return 0, false
	}
	return id, true
}

func validRecipe(req common.CreateRecipeRequest) bool {
	return len(strings.TrimSpace(req.Title)) >= 3 &&
		strings.TrimSpace(req.DishType) != "" &&
		(req.Difficulty == "easy" || req.Difficulty == "medium" || req.Difficulty == "hard") &&
		len(req.Ingredients) > 0 &&
		len(req.Steps) > 0
}

func writeRecipeStatus(w http.ResponseWriter, status int) {
	switch status {
	case http.StatusBadRequest:
		common.Error(w, status, "VALIDATION_ERROR", "invalid recipe data")
	case http.StatusForbidden:
		common.Error(w, status, "FORBIDDEN", "access denied")
	default:
		common.Error(w, status, "NOT_FOUND", "recipe not found")
	}
}

func intQuery(raw string, fallback int) int {
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}

func splitCSV(raw string) []string {
	if raw == "" {
		return nil
	}
	result := make([]string, 0)
	for _, item := range strings.Split(raw, ",") {
		if value := strings.TrimSpace(item); value != "" {
			result = append(result, strings.ToLower(value))
		}
	}
	return result
}

func hasIngredients(recipeIngredients []common.Ingredient, required []string) bool {
	existing := make(map[string]bool)
	for _, ingredient := range recipeIngredients {
		existing[strings.ToLower(ingredient.Name)] = true
	}
	for _, ingredient := range required {
		if !existing[ingredient] {
			return false
		}
	}
	return true
}
