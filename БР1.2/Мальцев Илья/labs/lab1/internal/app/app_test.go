package app_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"job-search-api/internal/app"
)

type authResponse struct {
	AccessToken string `json:"access_token"`
}

type vacancyListResponse struct {
	Items []struct {
		ID string `json:"id"`
	} `json:"items"`
	Total int `json:"total"`
}

type resumeResponse struct {
	ID string `json:"id"`
}

type applicationResponse struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

func TestApplicantAndEmployerFlow(t *testing.T) {
	handler := app.New().Handler()

	vacanciesResponse := request(t, handler, http.MethodGet, "/api/v1/vacancies", "", "")
	assertStatus(t, vacanciesResponse, http.StatusOK)

	var vacancies vacancyListResponse
	decode(t, vacanciesResponse, &vacancies)
	if vacancies.Total == 0 || len(vacancies.Items) == 0 {
		t.Fatal("expected seeded vacancies")
	}
	vacancyID := vacancies.Items[0].ID

	applicantToken := login(t, handler, "applicant@example.com", "password123")

	resumeRecorder := request(t, handler, http.MethodPost, "/api/v1/applicant/resumes", `{
		"title": "Go Developer",
		"experience_years": 3,
		"education": "ITMO University",
		"work_experience": "REST API services",
		"expected_salary": 200000,
		"skill_ids": [
			"11111111-1111-4111-8111-111111111111",
			"33333333-3333-4333-8333-333333333333"
		]
	}`, applicantToken)
	assertStatus(t, resumeRecorder, http.StatusCreated)

	var resume resumeResponse
	decode(t, resumeRecorder, &resume)
	if resume.ID == "" {
		t.Fatal("expected created resume id")
	}

	applicationRecorder := request(t, handler, http.MethodPost, "/api/v1/vacancies/"+vacancyID+"/applications", `{
		"resume_id": "`+resume.ID+`",
		"cover_letter": "I would like to discuss this role."
	}`, applicantToken)
	assertStatus(t, applicationRecorder, http.StatusCreated)

	var application applicationResponse
	decode(t, applicationRecorder, &application)
	if application.Status != "submitted" {
		t.Fatalf("expected submitted status, got %q", application.Status)
	}

	employerToken := login(t, handler, "employer@example.com", "password123")
	statusRecorder := request(t, handler, http.MethodPatch, "/api/v1/employer/applications/"+application.ID+"/status", `{
		"status": "reviewing"
	}`, employerToken)
	assertStatus(t, statusRecorder, http.StatusOK)

	var updatedApplication applicationResponse
	decode(t, statusRecorder, &updatedApplication)
	if updatedApplication.Status != "reviewing" {
		t.Fatalf("expected reviewing status, got %q", updatedApplication.Status)
	}
}

func TestRegisterAndMe(t *testing.T) {
	handler := app.New().Handler()

	registerRecorder := request(t, handler, http.MethodPost, "/api/v1/auth/register", `{
		"email": "new-applicant@example.com",
		"password": "password123",
		"role": "applicant",
		"first_name": "New",
		"last_name": "Applicant"
	}`, "")
	assertStatus(t, registerRecorder, http.StatusCreated)

	var auth authResponse
	decode(t, registerRecorder, &auth)
	if auth.AccessToken == "" {
		t.Fatal("expected access token")
	}

	meRecorder := request(t, handler, http.MethodGet, "/api/v1/auth/me", "", auth.AccessToken)
	assertStatus(t, meRecorder, http.StatusOK)
}

func login(t *testing.T, handler http.Handler, email string, password string) string {
	t.Helper()

	recorder := request(t, handler, http.MethodPost, "/api/v1/auth/login", `{
		"email": "`+email+`",
		"password": "`+password+`"
	}`, "")
	assertStatus(t, recorder, http.StatusOK)

	var auth authResponse
	decode(t, recorder, &auth)
	if auth.AccessToken == "" {
		t.Fatal("expected access token")
	}

	return auth.AccessToken
}

func request(t *testing.T, handler http.Handler, method string, path string, body string, token string) *httptest.ResponseRecorder {
	t.Helper()

	var reader *strings.Reader
	if body == "" {
		reader = strings.NewReader("")
	} else {
		reader = strings.NewReader(body)
	}

	req := httptest.NewRequest(method, path, reader)
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}

func assertStatus(t *testing.T, recorder *httptest.ResponseRecorder, status int) {
	t.Helper()

	if recorder.Code != status {
		t.Fatalf("expected HTTP %d, got %d: %s", status, recorder.Code, recorder.Body.String())
	}
}

func decode(t *testing.T, recorder *httptest.ResponseRecorder, dst any) {
	t.Helper()

	if err := json.NewDecoder(recorder.Body).Decode(dst); err != nil {
		t.Fatalf("decode response: %v; body=%s", err, recorder.Body.String())
	}
}
