package handler

import (
"encoding/json"
"fmt"
"net/http"

"job-search-api/internal/middleware"
"job-search-api/internal/model"
"job-search-api/internal/repository"
)

type ApplicationsHandler struct {
repos *repository.Repositories
}

func NewApplicationsHandler(repos *repository.Repositories) *ApplicationsHandler {
return &ApplicationsHandler{repos: repos}
}


func (h *ApplicationsHandler) CreateApplication(w http.ResponseWriter, r *http.Request) {
claims, ok := middleware.GetClaimsFromContext(r.Context())
if !ok || claims.Role != "applicant" {
http.Error(w, `{"error":"Forbidden"}`, http.StatusForbidden)
return
}

var req model.Application
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
return
}


req.Status = "pending"

app, err := h.repos.Applications.Create(r.Context(), &req)
if err != nil {
http.Error(w, fmt.Sprintf(`{"error":"%s"}`, err.Error()), http.StatusInternalServerError)
return
}

w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusCreated)
json.NewEncoder(w).Encode(app)
}


func (h *ApplicationsHandler) ListMyApplications(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte("[]"))
}
func (h *ApplicationsHandler) ListEmployerApplications(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte("[]"))
}
func (h *ApplicationsHandler) UpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.Write([]byte(`{"status":"updated"}`))
}
