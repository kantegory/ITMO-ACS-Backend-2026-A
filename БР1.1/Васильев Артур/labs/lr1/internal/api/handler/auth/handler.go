package auth

import (
	"log/slog"
	"net/http"

	authuc "jobsearch/internal/usecase/auth"
	"jobsearch/pkg/httputil"
	"jobsearch/pkg/slogutil"
)

const component = "auth"

type Handler struct {
	uc *authuc.UseCase
}

func NewHandler(uc *authuc.UseCase) *Handler {
	return &Handler{uc: uc}
}

type registerCandidateReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type registerEmployerReq struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	CompanyName string `json:"company_name"`
}

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type authResp struct {
	Token string  `json:"token"`
	User  userDTO `json:"user"`
}

type userDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (h *Handler) RegisterCandidate(w http.ResponseWriter, r *http.Request) {
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "register candidate handler started")

	var req registerCandidateReq
	if err := httputil.DecodeJSON(r, &req); err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "decode register candidate", err)
		httputil.WriteError(w, err)
		return
	}
	slogutil.LogDebug(r.Context(), slogutil.LayerHandler, component, "register candidate payload",
		slog.String("email", req.Email),
		slog.String("full_name", req.FullName),
	)

	res, err := h.uc.RegisterCandidate(r.Context(), req.Email, req.Password, req.FullName)
	if err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "register candidate failed", err,
			slog.String("email", req.Email),
		)
		httputil.WriteError(w, err)
		return
	}
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "register candidate success",
		slog.String("user_id", res.User.ID.String()),
	)
	httputil.WriteJSON(w, http.StatusCreated, toAuthResp(res))
}

func (h *Handler) RegisterEmployer(w http.ResponseWriter, r *http.Request) {
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "register employer handler started")

	var req registerEmployerReq
	if err := httputil.DecodeJSON(r, &req); err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "decode register employer", err)
		httputil.WriteError(w, err)
		return
	}
	slogutil.LogDebug(r.Context(), slogutil.LayerHandler, component, "register employer payload",
		slog.String("email", req.Email),
		slog.String("company_name", req.CompanyName),
	)

	res, err := h.uc.RegisterEmployer(r.Context(), req.Email, req.Password, req.CompanyName)
	if err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "register employer failed", err,
			slog.String("email", req.Email),
		)
		httputil.WriteError(w, err)
		return
	}
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "register employer success",
		slog.String("user_id", res.User.ID.String()),
	)
	httputil.WriteJSON(w, http.StatusCreated, toAuthResp(res))
}

func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "login handler started")

	var req loginReq
	if err := httputil.DecodeJSON(r, &req); err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "decode login", err)
		httputil.WriteError(w, err)
		return
	}

	res, err := h.uc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		slogutil.LogError(r.Context(), slogutil.LayerHandler, component, "login failed", err,
			slog.String("email", req.Email),
		)
		httputil.WriteError(w, err)
		return
	}
	slogutil.LogInfo(r.Context(), slogutil.LayerHandler, component, "login success",
		slog.String("user_id", res.User.ID.String()),
	)
	httputil.WriteJSON(w, http.StatusOK, toAuthResp(res))
}

func toAuthResp(res *authuc.AuthResult) authResp {
	return authResp{
		Token: res.Token,
		User: userDTO{
			ID:    res.User.ID.String(),
			Email: res.User.Email,
			Role:  string(res.User.Role),
		},
	}
}
