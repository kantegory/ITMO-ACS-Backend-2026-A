package identity

import (
	"encoding/json"
	"errors"
	"net/http"

	"recipehub/internal/pkg/authctx"
	"recipehub/internal/transport/http/dto"
	"recipehub/internal/transport/http/httpx"
	"recipehub/internal/transport/http/response"
	identityusecase "recipehub/internal/usecase/identity"
)

const defaultListLimit = 20

// Handler exposes identity use cases over HTTP.
type Handler struct {
	service *identityusecase.Service
}

// NewHandler creates an identity HTTP handler.
func NewHandler(service *identityusecase.Service) *Handler {
	return &Handler{service: service}
}

// Register handles POST /api/v1/auth/register.
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var body registerRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	pair, err := h.service.Register(r.Context(), toRegisterInput(body))
	if respondAuthMutationError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusCreated, map[string]any{"data": toTokenPairResponse(pair)})
}

// Login handles POST /api/v1/auth/login.
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var body loginRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	pair, err := h.service.Login(r.Context(), toLoginInput(body))
	if respondAuthMutationError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{"data": toTokenPairResponse(pair)})
}

// Refresh handles POST /api/v1/auth/refresh.
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body refreshRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	pair, err := h.service.Refresh(r.Context(), body.RefreshToken)
	if respondAuthMutationError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{"data": toTokenPairResponse(pair)})
}

// PatchMe handles PATCH /api/v1/users/me.
func (h *Handler) PatchMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	var body patchMeRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	user, err := h.service.PatchMe(r.Context(), userID, toPatchInput(body))
	if respondEntityError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{"data": toUserProfileResponse(user, 0, 0, 0)})
}

// GetByID handles GET /api/v1/users/{id}.
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	user, followers, following, recipes, err := h.service.UserProfile(r.Context(), userID)
	if respondEntityError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{"data": toUserProfileResponse(user, followers, following, recipes)})
}

// ListFollowers handles GET /api/v1/users/{id}/followers.
func (h *Handler) ListFollowers(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultListLimit)
	page, err := h.service.ListFollowers(r.Context(), userID, limit, offset)
	if respondEntityError(w, err) {
		return
	}

	items := make([]followUserResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toFollowUserResponse(item))
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// ListFollowing handles GET /api/v1/users/{id}/following.
func (h *Handler) ListFollowing(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	limit, offset := httpx.ClampLimitOffset(r, defaultListLimit)
	page, err := h.service.ListFollowing(r.Context(), userID, limit, offset)
	if respondEntityError(w, err) {
		return
	}

	items := make([]followUserResponse, 0, len(page.Items))
	for _, item := range page.Items {
		items = append(items, toFollowUserResponse(item))
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{
		"data":       items,
		"pagination": dto.Pagination{Total: page.Total, Limit: limit, Offset: offset},
	})
}

// Follow handles POST /api/v1/users/{id}/follow.
func (h *Handler) Follow(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	targetID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	err := h.service.Follow(r.Context(), currentUserID, targetID)
	if respondFollowError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusCreated, map[string]any{"data": followingResponse{Following: true}})
}

// Unfollow handles DELETE /api/v1/users/{id}/follow.
func (h *Handler) Unfollow(w http.ResponseWriter, r *http.Request) {
	currentUserID, ok := authctx.UserID(r.Context())
	if !ok {
		respondUnauthorized(w)
		return
	}

	targetID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	err := h.service.Unfollow(r.Context(), currentUserID, targetID)
	if respondEntityError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, map[string]any{"data": followingResponse{Following: false}})
}

// UserExists handles GET /internal/v1/users/{id}/exists.
func (h *Handler) UserExists(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	exists, err := h.service.UserExists(r.Context(), userID)
	if err != nil {
		respondInternal(w)
		return
	}

	response.RespondJSON(w, http.StatusOK, existsResponse{Exists: exists})
}

// UserShort handles GET /internal/v1/users/{id}.
func (h *Handler) UserShort(w http.ResponseWriter, r *http.Request) {
	userID, ok := httpx.UintPath(r, "id")
	if !ok {
		respondBadID(w)
		return
	}

	user, err := h.service.UserShort(r.Context(), userID)
	if respondEntityError(w, err) {
		return
	}

	response.RespondJSON(w, http.StatusOK, toUserShortResponse(user))
}

// UsersBatch handles POST /internal/v1/users/batch.
func (h *Handler) UsersBatch(w http.ResponseWriter, r *http.Request) {
	var body batchUsersRequest
	if !decodeJSON(w, r, &body) {
		return
	}

	users, err := h.service.UsersBatch(r.Context(), body.IDs)
	if err != nil {
		respondInternal(w)
		return
	}

	out := make([]userShortResponse, 0, len(users))
	for _, user := range users {
		out = append(out, toUserShortResponse(user))
	}

	response.RespondJSON(w, http.StatusOK, batchUsersResponse{Users: out})
}

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(r.Body).Decode(dst); err != nil {
		response.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid JSON")
		return false
	}

	return true
}

func respondAuthMutationError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, identityusecase.ErrInvalidInput) {
		response.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "check request fields")
		return true
	}
	if errors.Is(err, identityusecase.ErrEmailExists) {
		response.RespondError(w, http.StatusConflict, "CONFLICT", "user with this email already exists")
		return true
	}
	if errors.Is(err, identityusecase.ErrUsernameExists) {
		response.RespondError(w, http.StatusConflict, "CONFLICT", "user with this username already exists")
		return true
	}
	if errors.Is(err, identityusecase.ErrInvalidCredentials) || errors.Is(err, identityusecase.ErrInvalidRefresh) {
		response.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "invalid credentials")
		return true
	}

	respondInternal(w)
	return true
}

func respondEntityError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, identityusecase.ErrNotFound) {
		response.RespondError(w, http.StatusNotFound, "NOT_FOUND", "entity not found")
		return true
	}
	if errors.Is(err, identityusecase.ErrInvalidInput) {
		response.RespondError(w, http.StatusUnprocessableEntity, "VALIDATION_ERROR", "check request fields")
		return true
	}

	respondInternal(w)
	return true
}

func respondFollowError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if errors.Is(err, identityusecase.ErrSelfFollow) {
		response.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "cannot follow yourself")
		return true
	}
	if errors.Is(err, identityusecase.ErrAlreadyFollowing) {
		response.RespondError(w, http.StatusConflict, "CONFLICT", "already following this user")
		return true
	}

	return respondEntityError(w, err)
}

func respondBadID(w http.ResponseWriter) {
	response.RespondError(w, http.StatusBadRequest, "BAD_REQUEST", "invalid id")
}

func respondUnauthorized(w http.ResponseWriter) {
	response.RespondError(w, http.StatusUnauthorized, "UNAUTHORIZED", "authorization required")
}

func respondInternal(w http.ResponseWriter) {
	response.RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "internal server error")
}
