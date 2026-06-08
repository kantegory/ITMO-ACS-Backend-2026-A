package store

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"sort"
	"strings"
	"sync"
	"time"

	"recipe-lab1/internal/model"
)

var (
	ErrNotFound     = errors.New("not found")
	ErrConflict     = errors.New("conflict")
	ErrForbidden    = errors.New("forbidden")
	ErrUnauthorized = errors.New("unauthorized")
)

type RecipeFilter struct {
	DishType    string
	Difficulty  string
	Ingredients []string
	Sort        string
	OwnerID     int
	SavedByID   int
	Page        int
	PageSize    int
}

type MemoryStore struct {
	mu sync.RWMutex

	users       map[int]model.User
	userByEmail map[string]int
	tokens      map[string]int

	recipes  map[int]model.RecipeDetails
	comments map[int]model.Comment
	likes    map[int]map[int]bool
	saved    map[int]map[int]bool
	follows  map[int]map[int]bool

	nextUserID       int
	nextRecipeID     int
	nextIngredientID int
	nextStepID       int
	nextCommentID    int
}

func NewMemoryStore() *MemoryStore {
	s := &MemoryStore{
		users:       make(map[int]model.User),
		userByEmail: make(map[string]int),
		tokens:      make(map[string]int),
		recipes:     make(map[int]model.RecipeDetails),
		comments:    make(map[int]model.Comment),
		likes:       make(map[int]map[int]bool),
		saved:       make(map[int]map[int]bool),
		follows:     make(map[int]map[int]bool),
	}

	alina, _ := s.Register("alina", "alina@example.com", "password123")
	token, _, _ := s.Login("alina@example.com", "password123")
	_ = token
	_, _ = s.CreateRecipe(alina.ID, model.CreateRecipeRequest{
		Title:       "Брускетта с томатами",
		Description: strPtr("Простой рецепт для кулинарного блога."),
		DishType:    "snack",
		Difficulty:  "easy",
		CookingTime: intPtr(15),
		Ingredients: []model.IngredientInput{
			{Name: "tomato", Amount: "2 шт"},
			{Name: "bread", Amount: "4 ломтика"},
			{Name: "garlic", Amount: "1 зубчик"},
		},
		Steps: []model.StepInput{
			{StepNumber: 1, Text: "Подсушить хлеб."},
			{StepNumber: 2, Text: "Смешать томаты, чеснок и специи."},
			{StepNumber: 3, Text: "Выложить начинку на хлеб."},
		},
	})

	return s
}

func (s *MemoryStore) Register(username, email, password string) (model.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	email = strings.ToLower(strings.TrimSpace(email))
	if _, exists := s.userByEmail[email]; exists {
		return model.User{}, ErrConflict
	}

	s.nextUserID++
	user := model.User{
		ID:           s.nextUserID,
		Username:     strings.TrimSpace(username),
		Email:        email,
		PasswordHash: hashPassword(password),
		CreatedAt:    time.Now().UTC(),
	}
	s.users[user.ID] = user
	s.userByEmail[user.Email] = user.ID
	return user, nil
}

func (s *MemoryStore) Login(email, password string) (string, model.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	userID, exists := s.userByEmail[strings.ToLower(strings.TrimSpace(email))]
	if !exists {
		return "", model.User{}, ErrUnauthorized
	}
	user := s.users[userID]
	if user.PasswordHash != hashPassword(password) {
		return "", model.User{}, ErrUnauthorized
	}

	token := newToken()
	s.tokens[token] = user.ID
	return token, user, nil
}

func (s *MemoryStore) UserByToken(token string) (model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	userID, exists := s.tokens[token]
	if !exists {
		return model.User{}, ErrUnauthorized
	}
	user, exists := s.users[userID]
	if !exists {
		return model.User{}, ErrUnauthorized
	}
	return user, nil
}

func (s *MemoryStore) UpdateUser(userID int, req model.UpdateUserRequest) (model.User, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	user, exists := s.users[userID]
	if !exists {
		return model.User{}, ErrNotFound
	}
	if req.Username != nil {
		user.Username = strings.TrimSpace(*req.Username)
	}
	if req.Bio != nil {
		bio := strings.TrimSpace(*req.Bio)
		user.Bio = &bio
	}
	s.users[userID] = user
	return user, nil
}

func (s *MemoryStore) CreateRecipe(userID int, req model.CreateRecipeRequest) (model.RecipeDetails, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[userID]; !exists {
		return model.RecipeDetails{}, ErrNotFound
	}

	s.nextRecipeID++
	recipe := model.RecipeDetails{
		RecipeCard: model.RecipeCard{
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
	}
	recipe.Ingredients = s.newIngredients(req.Ingredients)
	recipe.Steps = s.newSteps(req.Steps)
	s.recipes[recipe.ID] = recipe
	return recipe, nil
}

func (s *MemoryStore) ListRecipes(filter RecipeFilter) model.RecipeListResponse {
	s.mu.RLock()
	defer s.mu.RUnlock()

	items := make([]model.RecipeCard, 0)
	for _, recipe := range s.recipes {
		if filter.OwnerID > 0 && recipe.UserID != filter.OwnerID {
			continue
		}
		if filter.SavedByID > 0 && !s.saved[filter.SavedByID][recipe.ID] {
			continue
		}
		if filter.DishType != "" && !strings.EqualFold(recipe.DishType, filter.DishType) {
			continue
		}
		if filter.Difficulty != "" && recipe.Difficulty != filter.Difficulty {
			continue
		}
		if len(filter.Ingredients) > 0 && !hasIngredients(recipe.Ingredients, filter.Ingredients) {
			continue
		}
		items = append(items, s.withCounts(recipe.RecipeCard))
	}

	if filter.Sort == "likes_desc" {
		sort.Slice(items, func(i, j int) bool {
			if items[i].LikesCount == items[j].LikesCount {
				return items[i].CreatedAt.After(items[j].CreatedAt)
			}
			return items[i].LikesCount > items[j].LikesCount
		})
	} else {
		sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.After(items[j].CreatedAt) })
	}

	page, pageSize := normalizePage(filter.Page, filter.PageSize)
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	return model.RecipeListResponse{
		Items:    items[start:end],
		Page:     page,
		PageSize: pageSize,
		Total:    total,
	}
}

func (s *MemoryStore) GetRecipe(recipeID int) (model.RecipeDetails, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	recipe, exists := s.recipes[recipeID]
	if !exists {
		return model.RecipeDetails{}, ErrNotFound
	}
	recipe.RecipeCard = s.withCounts(recipe.RecipeCard)
	return recipe, nil
}

func (s *MemoryStore) UpdateRecipe(userID int, recipeID int, req model.UpdateRecipeRequest) (model.RecipeDetails, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	recipe, exists := s.recipes[recipeID]
	if !exists {
		return model.RecipeDetails{}, ErrNotFound
	}
	if recipe.UserID != userID {
		return model.RecipeDetails{}, ErrForbidden
	}

	recipe.Title = strings.TrimSpace(req.Title)
	recipe.Description = req.Description
	recipe.DishType = strings.TrimSpace(req.DishType)
	recipe.Difficulty = req.Difficulty
	recipe.CookingTime = req.CookingTime
	recipe.PhotoURL = req.PhotoURL
	recipe.VideoURL = req.VideoURL
	recipe.Ingredients = s.newIngredients(req.Ingredients)
	recipe.Steps = s.newSteps(req.Steps)
	s.recipes[recipeID] = recipe
	recipe.RecipeCard = s.withCounts(recipe.RecipeCard)
	return recipe, nil
}

func (s *MemoryStore) DeleteRecipe(userID int, recipeID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	recipe, exists := s.recipes[recipeID]
	if !exists {
		return ErrNotFound
	}
	if recipe.UserID != userID {
		return ErrForbidden
	}
	delete(s.recipes, recipeID)
	delete(s.likes, recipeID)
	for savedByUser := range s.saved {
		delete(s.saved[savedByUser], recipeID)
	}
	for id, comment := range s.comments {
		if comment.RecipeID == recipeID {
			delete(s.comments, id)
		}
	}
	return nil
}

func (s *MemoryStore) ListComments(recipeID, page, pageSize int) (model.CommentListResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return model.CommentListResponse{}, ErrNotFound
	}

	items := make([]model.Comment, 0)
	for _, comment := range s.comments {
		if comment.RecipeID == recipeID {
			items = append(items, comment)
		}
	}
	sort.Slice(items, func(i, j int) bool { return items[i].CreatedAt.Before(items[j].CreatedAt) })

	page, pageSize = normalizePage(page, pageSize)
	total := len(items)
	start := (page - 1) * pageSize
	if start > total {
		start = total
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	return model.CommentListResponse{Items: items[start:end], Page: page, PageSize: pageSize, Total: total}, nil
}

func (s *MemoryStore) CreateComment(userID, recipeID int, text string) (model.Comment, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return model.Comment{}, ErrNotFound
	}

	s.nextCommentID++
	comment := model.Comment{
		ID:        s.nextCommentID,
		UserID:    userID,
		RecipeID:  recipeID,
		Text:      strings.TrimSpace(text),
		CreatedAt: time.Now().UTC(),
	}
	s.comments[comment.ID] = comment
	return comment, nil
}

func (s *MemoryStore) DeleteComment(userID, commentID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	comment, exists := s.comments[commentID]
	if !exists {
		return ErrNotFound
	}
	recipe := s.recipes[comment.RecipeID]
	if comment.UserID != userID && recipe.UserID != userID {
		return ErrForbidden
	}
	delete(s.comments, commentID)
	return nil
}

func (s *MemoryStore) LikeRecipe(userID, recipeID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return ErrNotFound
	}
	if s.likes[recipeID] == nil {
		s.likes[recipeID] = make(map[int]bool)
	}
	if s.likes[recipeID][userID] {
		return ErrConflict
	}
	s.likes[recipeID][userID] = true
	return nil
}

func (s *MemoryStore) UnlikeRecipe(userID, recipeID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return ErrNotFound
	}
	if s.likes[recipeID] != nil {
		delete(s.likes[recipeID], userID)
	}
	return nil
}

func (s *MemoryStore) SaveRecipe(userID, recipeID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return ErrNotFound
	}
	if s.saved[userID] == nil {
		s.saved[userID] = make(map[int]bool)
	}
	if s.saved[userID][recipeID] {
		return ErrConflict
	}
	s.saved[userID][recipeID] = true
	return nil
}

func (s *MemoryStore) UnsaveRecipe(userID, recipeID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.recipes[recipeID]; !exists {
		return ErrNotFound
	}
	if s.saved[userID] != nil {
		delete(s.saved[userID], recipeID)
	}
	return nil
}

func (s *MemoryStore) Follow(userID, targetUserID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[targetUserID]; !exists {
		return ErrNotFound
	}
	if userID == targetUserID {
		return ErrConflict
	}
	if s.follows[userID] == nil {
		s.follows[userID] = make(map[int]bool)
	}
	if s.follows[userID][targetUserID] {
		return ErrConflict
	}
	s.follows[userID][targetUserID] = true
	return nil
}

func (s *MemoryStore) Unfollow(userID, targetUserID int) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.users[targetUserID]; !exists {
		return ErrNotFound
	}
	if s.follows[userID] != nil {
		delete(s.follows[userID], targetUserID)
	}
	return nil
}

func (s *MemoryStore) Followers(userID int) (model.UserListResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if _, exists := s.users[userID]; !exists {
		return model.UserListResponse{}, ErrNotFound
	}
	items := make([]model.User, 0)
	for followerID, following := range s.follows {
		if following[userID] {
			items = append(items, s.users[followerID])
		}
	}
	return model.UserListResponse{Items: items, Total: len(items)}, nil
}

func (s *MemoryStore) Following(userID int) (model.UserListResponse, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if _, exists := s.users[userID]; !exists {
		return model.UserListResponse{}, ErrNotFound
	}
	items := make([]model.User, 0)
	for followingID := range s.follows[userID] {
		items = append(items, s.users[followingID])
	}
	return model.UserListResponse{Items: items, Total: len(items)}, nil
}

func (s *MemoryStore) newIngredients(inputs []model.IngredientInput) []model.Ingredient {
	ingredients := make([]model.Ingredient, 0, len(inputs))
	for _, input := range inputs {
		s.nextIngredientID++
		ingredients = append(ingredients, model.Ingredient{
			ID:     s.nextIngredientID,
			Name:   strings.TrimSpace(input.Name),
			Amount: strings.TrimSpace(input.Amount),
		})
	}
	return ingredients
}

func (s *MemoryStore) newSteps(inputs []model.StepInput) []model.Step {
	steps := make([]model.Step, 0, len(inputs))
	for _, input := range inputs {
		s.nextStepID++
		steps = append(steps, model.Step{
			ID:         s.nextStepID,
			StepNumber: input.StepNumber,
			Text:       strings.TrimSpace(input.Text),
		})
	}
	sort.Slice(steps, func(i, j int) bool { return steps[i].StepNumber < steps[j].StepNumber })
	return steps
}

func (s *MemoryStore) withCounts(card model.RecipeCard) model.RecipeCard {
	card.LikesCount = len(s.likes[card.ID])
	for _, comment := range s.comments {
		if comment.RecipeID == card.ID {
			card.CommentsCount++
		}
	}
	return card
}

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}

func newToken() string {
	data := make([]byte, 24)
	if _, err := rand.Read(data); err != nil {
		return hex.EncodeToString([]byte(time.Now().String()))
	}
	return hex.EncodeToString(data)
}

func hasIngredients(recipeIngredients []model.Ingredient, required []string) bool {
	existing := make(map[string]bool)
	for _, ingredient := range recipeIngredients {
		existing[strings.ToLower(ingredient.Name)] = true
	}
	for _, ingredient := range required {
		if !existing[strings.ToLower(strings.TrimSpace(ingredient))] {
			return false
		}
	}
	return true
}

func normalizePage(page, pageSize int) (int, int) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}
	return page, pageSize
}

func strPtr(value string) *string {
	return &value
}

func intPtr(value int) *int {
	return &value
}
