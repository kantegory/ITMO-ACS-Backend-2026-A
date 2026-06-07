package vacancy

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"vacancy-service/internal/domain"
	vacancyuc "vacancy-service/internal/usecase/vacancy"
	"vacancy-service/pkg/httputil"
)

type Handler struct {
	uc *vacancyuc.UseCase
}

func NewHandler(uc *vacancyuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) Search(w http.ResponseWriter, r *http.Request) {
	f := domain.VacancyFilter{OnlyPublished: true}
	q := r.URL.Query()
	if s := q.Get("industry_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			httputil.WriteError(w, err)
			return
		}
		f.IndustryID = &id
	}
	if s := q.Get("experience_level_id"); s != "" {
		id, err := uuid.Parse(s)
		if err != nil {
			httputil.WriteError(w, err)
			return
		}
		f.ExperienceLevelID = &id
	}
	if s := q.Get("salary_min"); s != "" {
		v, err := strconv.Atoi(s)
		if err != nil {
			httputil.WriteError(w, err)
			return
		}
		f.SalaryMin = &v
	}
	f.Query = q.Get("q")
	f.Page, _ = strconv.Atoi(q.Get("page"))
	f.Limit, _ = strconv.Atoi(q.Get("limit"))
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 20
	}

	res, err := h.uc.Search(r.Context(), f)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toList(res))
}

func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	v, err := h.uc.GetPublic(r.Context(), id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toDetail(v))
}

func toList(p *domain.PaginatedVacancies) map[string]any {
	items := make([]any, 0, len(p.Items))
	for _, v := range p.Items {
		items = append(items, toItem(&v))
	}
	return map[string]any{"items": items, "total": p.Total, "page": p.Page, "limit": p.Limit}
}

func toItem(v *domain.VacancyListItem) map[string]any {
	return map[string]any{
		"id":              v.ID.String(),
		"title":           v.Title,
		"salary_from":     v.SalaryFrom,
		"salary_to":       v.SalaryTo,
		"salary_currency": v.SalaryCurrency,
		"location":        v.Location,
		"is_published":    v.IsPublished,
		"industry": map[string]any{
			"id": v.Industry.ID.String(), "name": v.Industry.Name, "slug": v.Industry.Slug,
		},
		"experience_level": map[string]any{
			"id": v.ExperienceLevel.ID.String(), "name": v.ExperienceLevel.Name, "slug": v.ExperienceLevel.Slug,
		},
		"company_name": v.CompanyName,
	}
}

func toDetail(v *domain.VacancyDetail) map[string]any {
	m := toItem(&v.VacancyListItem)
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
