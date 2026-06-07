package candidate

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"profile-service/internal/domain"
	"profile-service/internal/infrastructure/middleware"
	candidateuc "profile-service/internal/usecase/candidate"
	"profile-service/pkg/httputil"
)

type Handler struct {
	uc *candidateuc.UseCase
}

func NewHandler(uc *candidateuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) GetProfile(w http.ResponseWriter, r *http.Request) {
	c, err := h.uc.GetProfile(r.Context(), middleware.UserID(r.Context()))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toCandidateDTO(c))
}

func (h *Handler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FullName  string `json:"full_name"`
		Phone     string `json:"phone"`
		City      string `json:"city"`
		BirthDate string `json:"birth_date"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		httputil.WriteError(w, err)
		return
	}
	var birth *time.Time
	if req.BirthDate != "" {
		t, err := time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			httputil.WriteError(w, err)
			return
		}
		birth = &t
	}
	c, err := h.uc.UpdateProfile(r.Context(), middleware.UserID(r.Context()), req.FullName, req.Phone, req.City, birth)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toCandidateDTO(c))
}

func (h *Handler) GetResume(w http.ResponseWriter, r *http.Request) {
	res, err := h.uc.GetResume(r.Context(), middleware.UserID(r.Context()))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toResumeDTO(res))
}

func (h *Handler) UpsertResume(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title   string `json:"title"`
		Summary string `json:"summary"`
		Skills  string `json:"skills"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		httputil.WriteError(w, err)
		return
	}
	res, err := h.uc.UpsertResume(r.Context(), middleware.UserID(r.Context()), req.Title, req.Summary, req.Skills)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toResumeDTO(res))
}

func (h *Handler) AddExperience(w http.ResponseWriter, r *http.Request) {
	e, err := decodeExperience(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out, err := h.uc.AddExperience(r.Context(), middleware.UserID(r.Context()), e)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, toExperienceDTO(out))
}

func (h *Handler) UpdateExperience(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	e, err := decodeExperience(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out, err := h.uc.UpdateExperience(r.Context(), middleware.UserID(r.Context()), id, e)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toExperienceDTO(out))
}

func (h *Handler) DeleteExperience(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	if err := h.uc.DeleteExperience(r.Context(), middleware.UserID(r.Context()), id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AddEducation(w http.ResponseWriter, r *http.Request) {
	e, err := decodeEducation(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out, err := h.uc.AddEducation(r.Context(), middleware.UserID(r.Context()), e)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, toEducationDTO(out))
}

func (h *Handler) UpdateEducation(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	e, err := decodeEducation(r)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out, err := h.uc.UpdateEducation(r.Context(), middleware.UserID(r.Context()), id, e)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toEducationDTO(out))
}

func (h *Handler) DeleteEducation(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	if err := h.uc.DeleteEducation(r.Context(), middleware.UserID(r.Context()), id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func decodeExperience(r *http.Request) (domain.WorkExperience, error) {
	var req struct {
		CompanyName string `json:"company_name"`
		Position    string `json:"position"`
		StartDate   string `json:"start_date"`
		EndDate     string `json:"end_date"`
		Description string `json:"description"`
		SortOrder   int    `json:"sort_order"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return domain.WorkExperience{}, err
	}
	start, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return domain.WorkExperience{}, err
	}
	var end *time.Time
	if req.EndDate != "" {
		t, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return domain.WorkExperience{}, err
		}
		end = &t
	}
	return domain.WorkExperience{
		CompanyName: req.CompanyName,
		Position:    req.Position,
		StartDate:   start,
		EndDate:     end,
		Description: req.Description,
		SortOrder:   req.SortOrder,
	}, nil
}

func decodeEducation(r *http.Request) (domain.Education, error) {
	var req struct {
		Institution    string `json:"institution"`
		Degree         string `json:"degree"`
		GraduationYear int    `json:"graduation_year"`
		SortOrder      int    `json:"sort_order"`
	}
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return domain.Education{}, err
	}
	return domain.Education{
		Institution:    req.Institution,
		Degree:         req.Degree,
		GraduationYear: req.GraduationYear,
		SortOrder:      req.SortOrder,
	}, nil
}

func toCandidateDTO(c *domain.Candidate) map[string]any {
	dto := map[string]any{
		"id":        c.ID.String(),
		"full_name": c.FullName,
		"phone":     c.Phone,
		"city":      c.City,
	}
	if c.BirthDate != nil {
		dto["birth_date"] = c.BirthDate.Format("2006-01-02")
	}
	return dto
}

func toResumeDTO(r *domain.ResumeFull) map[string]any {
	exps := make([]any, 0, len(r.Experiences))
	for _, e := range r.Experiences {
		exps = append(exps, toExperienceDTO(&e))
	}
	edus := make([]any, 0, len(r.Educations))
	for _, e := range r.Educations {
		edus = append(edus, toEducationDTO(&e))
	}
	return map[string]any{
		"id":          r.ID.String(),
		"title":       r.Title,
		"summary":     r.Summary,
		"skills":      r.Skills,
		"experiences": exps,
		"educations":  edus,
		"updated_at":  r.UpdatedAt,
	}
}

func toExperienceDTO(e *domain.WorkExperience) map[string]any {
	dto := map[string]any{
		"id":           e.ID.String(),
		"company_name": e.CompanyName,
		"position":     e.Position,
		"start_date":   e.StartDate.Format("2006-01-02"),
		"description":  e.Description,
		"sort_order":   e.SortOrder,
	}
	if e.EndDate != nil {
		dto["end_date"] = e.EndDate.Format("2006-01-02")
	}
	return dto
}

func toEducationDTO(e *domain.Education) map[string]any {
	return map[string]any{
		"id":              e.ID.String(),
		"institution":     e.Institution,
		"degree":          e.Degree,
		"graduation_year": e.GraduationYear,
		"sort_order":      e.SortOrder,
	}
}
