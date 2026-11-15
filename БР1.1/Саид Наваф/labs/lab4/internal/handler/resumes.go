package handler

import (
"encoding/json"
"log"
"net/http"
"strconv"

"job-search-api/internal/middleware"
"job-search-api/internal/model"
"job-search-api/internal/repository"
)

type ResumesHandler struct {
repos *repository.Repositories
}

func NewResumesHandler(repos *repository.Repositories) *ResumesHandler {
return &ResumesHandler{repos: repos}
}

// CreateResume создаёт новое резюме (только applicant)
func (h *ResumesHandler) CreateResume(w http.ResponseWriter, r *http.Request) {
claims, ok := middleware.GetClaimsFromContext(r.Context())
if !ok || claims.Role != "applicant" {
http.Error(w, `{"error":"Forbidden"}`, http.StatusForbidden)
return
}

var req model.Resume
if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
http.Error(w, `{"error":"Invalid request"}`, http.StatusBadRequest)
return
}

if req.DesiredPosition == "" {
http.Error(w, `{"error":"Desired position is required"}`, http.StatusBadRequest)
return
}


applicantID, err := h.repos.Resumes.GetApplicantIDByUserID(r.Context(), claims.UserID)
if err != nil {

applicantID, err = h.repos.Resumes.CreateApplicantIfNeeded(r.Context(), claims.UserID, "User", "Name")
if err != nil {
log.Printf("Failed to create applicant profile: %v", err)
http.Error(w, `{"error":"Failed to setup applicant profile"}`, http.StatusInternalServerError)
return
}
}

req.ApplicantID = applicantID
req.IsActive = true

resume, err := h.repos.Resumes.Create(r.Context(), &req)
if err != nil {
log.Printf("Create resume error: %v", err)
http.Error(w, `{"error":"Failed to create resume"}`, http.StatusInternalServerError)
return
}

w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusCreated)
json.NewEncoder(w).Encode(resume)
}


func (h *ResumesHandler) ListResumes(w http.ResponseWriter, r *http.Request) {
limit := 20
offset := 0

if l := r.URL.Query().Get("limit"); l != "" {
if val, err := strconv.Atoi(l); err == nil && val > 0 { limit = val }
}
if o := r.URL.Query().Get("offset"); o != "" {
if val, err := strconv.Atoi(o); err == nil && val >= 0 { offset = val }
}

resumes, err := h.repos.Resumes.List(r.Context(), limit, offset)
if err != nil {
http.Error(w, `{"error":"Failed to fetch resumes"}`, http.StatusInternalServerError)
return
}

if resumes == nil { resumes = []model.Resume{} }

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resumes)
}


func (h *ResumesHandler) GetResumeByID(w http.ResponseWriter, r *http.Request) {
idStr := r.PathValue("id")
id, err := strconv.Atoi(idStr)
if err != nil {
http.Error(w, `{"error":"Invalid resume ID"}`, http.StatusBadRequest)
return
}

resume, err := h.repos.Resumes.GetByID(r.Context(), id)
if err != nil {
http.Error(w, `{"error":"Resume not found"}`, http.StatusNotFound)
return
}

w.Header().Set("Content-Type", "application/json")
json.NewEncoder(w).Encode(resume)
}
