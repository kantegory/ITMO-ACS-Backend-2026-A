package app

import (
	"net/http"
	"strings"

	"job-search-api/internal/controllers"
	"job-search-api/internal/errs"
	"job-search-api/internal/httpx"
	"job-search-api/internal/store"
)

type App struct {
	auth         *controllers.AuthController
	dictionaries *controllers.DictionaryController
	vacancies    *controllers.VacancyController
	applicant    *controllers.ApplicantController
	employer     *controllers.EmployerController
}

func New() *App {
	store := store.New()

	return &App{
		auth:         controllers.NewAuthController(store),
		dictionaries: controllers.NewDictionaryController(store),
		vacancies:    controllers.NewVacancyController(store),
		applicant:    controllers.NewApplicantController(store),
		employer:     controllers.NewEmployerController(store),
	}
}

func (app *App) Handler() http.Handler {
	return app
}

func (app *App) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	httpx.ApplyCORS(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.URL.Path == "/health" || r.URL.Path == "/api/v1/health" {
		if !requireMethod(w, r, http.MethodGet) {
			return
		}
		httpx.WriteJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		return
	}

	if !strings.HasPrefix(r.URL.Path, "/api/v1") {
		httpx.WriteError(w, errs.NotFound("route not found"))
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/v1")
	if path == "" {
		path = "/"
	}
	if path != "/" {
		path = strings.TrimRight(path, "/")
	}

	switch path {
	case "/auth/register":
		if requireMethod(w, r, http.MethodPost) {
			app.auth.Register(w, r)
		}
		return
	case "/auth/login":
		if requireMethod(w, r, http.MethodPost) {
			app.auth.Login(w, r)
		}
		return
	case "/auth/me":
		if requireMethod(w, r, http.MethodGet) {
			app.auth.Me(w, r)
		}
		return
	case "/skills":
		if requireMethod(w, r, http.MethodGet) {
			app.dictionaries.ListSkills(w, r)
		}
		return
	case "/industries":
		if requireMethod(w, r, http.MethodGet) {
			app.dictionaries.ListIndustries(w, r)
		}
		return
	case "/vacancies":
		if requireMethod(w, r, http.MethodGet) {
			app.vacancies.List(w, r)
		}
		return
	case "/applicant/resumes":
		switch r.Method {
		case http.MethodGet:
			app.applicant.ListResumes(w, r)
		case http.MethodPost:
			app.applicant.CreateResume(w, r)
		default:
			writeMethodNotAllowed(w)
		}
		return
	case "/applicant/applications":
		if requireMethod(w, r, http.MethodGet) {
			app.applicant.ListApplications(w, r)
		}
		return
	case "/employer/vacancies":
		switch r.Method {
		case http.MethodGet:
			app.employer.ListVacancies(w, r)
		case http.MethodPost:
			app.employer.CreateVacancy(w, r)
		default:
			writeMethodNotAllowed(w)
		}
		return
	}

	app.routeDynamic(w, r, splitPath(path))
}

func (app *App) routeDynamic(w http.ResponseWriter, r *http.Request, parts []string) {
	if len(parts) == 2 && parts[0] == "vacancies" {
		if requireMethod(w, r, http.MethodGet) {
			app.vacancies.Get(w, r, parts[1])
		}
		return
	}

	if len(parts) == 3 && parts[0] == "vacancies" && parts[2] == "applications" {
		if requireMethod(w, r, http.MethodPost) {
			app.applicant.CreateApplication(w, r, parts[1])
		}
		return
	}

	if len(parts) == 3 && parts[0] == "employer" && parts[1] == "vacancies" {
		switch r.Method {
		case http.MethodPut:
			app.employer.UpdateVacancy(w, r, parts[2])
		case http.MethodDelete:
			app.employer.CloseVacancy(w, r, parts[2])
		default:
			writeMethodNotAllowed(w)
		}
		return
	}

	if len(parts) == 4 && parts[0] == "employer" && parts[1] == "applications" && parts[3] == "status" {
		if requireMethod(w, r, http.MethodPatch) {
			app.employer.UpdateApplicationStatus(w, r, parts[2])
		}
		return
	}

	httpx.WriteError(w, errs.NotFound("route not found"))
}

func splitPath(path string) []string {
	trimmed := strings.Trim(path, "/")
	if trimmed == "" {
		return nil
	}

	return strings.Split(trimmed, "/")
}

func requireMethod(w http.ResponseWriter, r *http.Request, method string) bool {
	if r.Method == method {
		return true
	}

	writeMethodNotAllowed(w)
	return false
}

func writeMethodNotAllowed(w http.ResponseWriter) {
	httpx.WriteError(w, errs.MethodNotAllowed("method is not allowed for this route"))
}
