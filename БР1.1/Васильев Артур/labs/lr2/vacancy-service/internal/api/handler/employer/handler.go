package employer

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"vacancy-service/internal/domain"
	"vacancy-service/internal/infrastructure/middleware"
	employeruc "vacancy-service/internal/usecase/employer"
	"vacancy-service/pkg/apperror"
	"vacancy-service/pkg/httputil"
)

type Handler struct {
	uc *employeruc.UseCase
}

func NewHandler(uc *employeruc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) ListVacancies(w http.ResponseWriter, r *http.Request) {
	page, limit := pagination(r)
	res, err := h.uc.ListVacancies(r.Context(), middleware.UserID(r.Context()), page, limit)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toVacancyList(res))
}

func (h *Handler) CreateVacancy(w http.ResponseWriter, r *http.Request) {
	v, err := decodeVacancyInput(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	detail, err := h.uc.CreateVacancy(r.Context(), middleware.UserID(r.Context()), v)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, toVacancyDetail(detail))
}

func (h *Handler) GetVacancy(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	detail, err := h.uc.GetVacancy(r.Context(), middleware.UserID(r.Context()), id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toVacancyDetail(detail))
}

func (h *Handler) UpdateVacancy(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	v, err := decodeVacancyInput(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	detail, err := h.uc.UpdateVacancy(r.Context(), middleware.UserID(r.Context()), id, v)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toVacancyDetail(detail))
}

func (h *Handler) DeleteVacancy(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	if err := h.uc.DeleteVacancy(r.Context(), middleware.UserID(r.Context()), id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) Publish(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	detail, err := h.uc.Publish(r.Context(), middleware.UserID(r.Context()), id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toVacancyDetail(detail))
}

func (h *Handler) Unpublish(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	detail, err := h.uc.Unpublish(r.Context(), middleware.UserID(r.Context()), id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toVacancyDetail(detail))
}

func decodeVacancyInput(r *http.Request) (domain.Vacancy, error) {
	var req struct {
		Title             string `json:"title"`
		Description       string `json:"description"`
		Requirements      string `json:"requirements"`
		IndustryID        string `json:"industry_id"`
		ExperienceLevelID string `json:"experience_level_id"`
		SalaryFrom        *int   `json:"salary_from"`
		SalaryTo          *int   `json:"salary_to"`
		SalaryCurrency    string `json:"salary_currency"`
		Location          string `json:"location"`
		IsPublished       *bool  `json:"is_published"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return domain.Vacancy{}, err
	}
	indID, err := uuid.Parse(req.IndustryID)
	if err != nil {
		return domain.Vacancy{}, apperror.Validation("industry_id must be a valid UUID (get it from GET /industries)")
	}
	expID, err := uuid.Parse(req.ExperienceLevelID)
	if err != nil {
		return domain.Vacancy{}, apperror.Validation("experience_level_id must be a valid UUID (get it from GET /experience-levels)")
	}
	v := domain.Vacancy{
		IndustryID:        indID,
		ExperienceLevelID: expID,
		Title:             req.Title,
		Description:       req.Description,
		Requirements:      req.Requirements,
		SalaryFrom:        req.SalaryFrom,
		SalaryTo:          req.SalaryTo,
		SalaryCurrency:    req.SalaryCurrency,
		Location:          req.Location,
	}
	if req.IsPublished != nil {
		v.IsPublished = *req.IsPublished
	}
	return v, nil
}

func pagination(r *http.Request) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	return page, limit
}

func toVacancyList(p *domain.PaginatedVacancies) map[string]any {
	items := make([]any, 0, len(p.Items))
	for _, v := range p.Items {
		items = append(items, toVacancyItem(&v))
	}
	return map[string]any{"items": items, "total": p.Total, "page": p.Page, "limit": p.Limit}
}

func toVacancyItem(v *domain.VacancyListItem) map[string]any {
	return map[string]any{
		"id":              v.ID.String(),
		"title":           v.Title,
		"salary_from":     v.SalaryFrom,
		"salary_to":       v.SalaryTo,
		"salary_currency": v.SalaryCurrency,
		"location":        v.Location,
		"is_published":    v.IsPublished,
		"industry":        refDTO(v.Industry.ID, v.Industry.Name, v.Industry.Slug),
		"experience_level": map[string]any{
			"id":   v.ExperienceLevel.ID.String(),
			"name": v.ExperienceLevel.Name,
			"slug": v.ExperienceLevel.Slug,
		},
		"company_name": v.CompanyName,
	}
}

func toVacancyDetail(v *domain.VacancyDetail) map[string]any {
	m := toVacancyItem(&v.VacancyListItem)
	m["description"] = v.Description
	m["requirements"] = v.Requirements
	m["employer"] = map[string]any{
		"user_id":      v.Employer.UserID.String(),
		"company_name": v.Employer.CompanyName,
	}
	m["created_at"] = v.CreatedAt
	m["updated_at"] = v.UpdatedAt
	return m
}

func refDTO(id uuid.UUID, name, slug string) map[string]any {
	return map[string]any{"id": id.String(), "name": name, "slug": slug}
}
