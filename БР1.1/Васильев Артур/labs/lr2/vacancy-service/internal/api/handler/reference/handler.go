package reference

import (
	"net/http"

	referenceuc "vacancy-service/internal/usecase/reference"
	"vacancy-service/pkg/httputil"
)

type Handler struct {
	uc *referenceuc.UseCase
}

func NewHandler(uc *referenceuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

func (h *Handler) ListIndustries(w http.ResponseWriter, r *http.Request) {
	list, err := h.uc.ListIndustries(r.Context())
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, list)
}

func (h *Handler) ListExperienceLevels(w http.ResponseWriter, r *http.Request) {
	list, err := h.uc.ListExperienceLevels(r.Context())
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, list)
}
