package handler

import (
"encoding/json"
"net/http"

"job-search-api/internal/middleware"
"job-search-api/internal/repository"
)

type ProfileHandler struct {
repos *repository.Repositories
}

func NewProfileHandler(repos *repository.Repositories) *ProfileHandler {
return &ProfileHandler{repos: repos}
}

func (h *ProfileHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
claims, ok := middleware.GetClaimsFromContext(r.Context())
if !ok {
http.Error(w, `{"error":"User not found in token"}`, http.StatusUnauthorized)
return
}

user, err := h.repos.Users.GetByEmail(r.Context(), claims.Email)
if err != nil {
http.Error(w, `{"error":"User not found"}`, http.StatusNotFound)
return
}

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(map[string]interface{}{
"id":            user.ID,
"email":         user.Email,
"phone":         user.Phone,
"role":          user.Role,
"registered_at": user.RegisteredAt,
})
}
