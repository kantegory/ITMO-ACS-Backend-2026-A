package employer

import (
	"net/http"

	"profile-service/internal/domain"
	"profile-service/internal/infrastructure/middleware"
	profileuc "profile-service/internal/usecase/profile"
	"profile-service/pkg/httputil"
)

type Handler struct {
	uc *profileuc.UseCase
}

func NewHandler(uc *profileuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	e, err := h.uc.GetEmployerProfile(r.Context(), middleware.UserID(r.Context()))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toEmployerDTO(e))
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		CompanyName        string `json:"company_name"`
		CompanyDescription string `json:"company_description"`
		Website            string `json:"website"`
		LogoURL            string `json:"logo_url"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		httputil.WriteError(w, err)
		return
	}
	e, err := h.uc.UpdateEmployerProfile(r.Context(), middleware.UserID(r.Context()),
		req.CompanyName, req.CompanyDescription, req.Website, req.LogoURL)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toEmployerDTO(e))
}

func toEmployerDTO(e *domain.Employer) map[string]any {
	return map[string]any{
		"id":                  e.ID.String(),
		"company_name":        e.CompanyName,
		"company_description": e.CompanyDescription,
		"website":             e.Website,
		"logo_url":            e.LogoURL,
	}
}
