package internalapi

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"profile-service/internal/domain"
	profileuc "profile-service/internal/usecase/profile"
	"profile-service/pkg/httputil"
)

type Handler struct {
	uc *profileuc.UseCase
}

func NewHandler(uc *profileuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) CreateProfile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		UserID      string `json:"user_id"`
		Role        string `json:"role"`
		FullName    string `json:"full_name"`
		CompanyName string `json:"company_name"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		httputil.WriteError(w, err)
		return
	}
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	if err := h.uc.CreateProfile(r.Context(), userID, domain.Role(req.Role), req.FullName, req.CompanyName); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (h *Handler) EmployerExists(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	exists, err := h.uc.EmployerExists(r.Context(), userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]bool{"exists": exists})
}

func (h *Handler) CandidateExists(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	exists, err := h.uc.CandidateExists(r.Context(), userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]bool{"exists": exists})
}

func (h *Handler) GetEmployerCompanyName(w http.ResponseWriter, r *http.Request) {
	userID, err := uuid.Parse(chi.URLParam(r, "userId"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	e, err := h.uc.GetEmployerProfile(r.Context(), userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, map[string]string{"company_name": e.CompanyName})
}
