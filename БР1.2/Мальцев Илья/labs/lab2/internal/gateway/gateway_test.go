package gateway_test

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"job-search-microservices/internal/applicant"
	"job-search-microservices/internal/auth"
	"job-search-microservices/internal/catalog"
	"job-search-microservices/internal/employer"
	"job-search-microservices/internal/gateway"
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

func TestGatewayMicroserviceScenario(t *testing.T) {
	authServer := httptest.NewServer(auth.New().Handler())
	defer authServer.Close()

	catalogServer := httptest.NewServer(catalog.New().Handler())
	defer catalogServer.Close()

	applicantServer := httptest.NewServer(applicant.New(authServer.URL, catalogServer.URL).Handler())
	defer applicantServer.Close()

	employerServer := httptest.NewServer(employer.New(authServer.URL, catalogServer.URL, applicantServer.URL).Handler())
	defer employerServer.Close()

	apiGateway, err := gateway.New(gateway.Config{
		AuthURL:      authServer.URL,
		CatalogURL:   catalogServer.URL,
		ApplicantURL: applicantServer.URL,
		EmployerURL:  employerServer.URL,
	})
	if err != nil {
		t.Fatal(err)
	}

	gatewayServer := httptest.NewServer(apiGateway.Handler())
	defer gatewayServer.Close()

	applicantToken := login(t, gatewayServer.URL, "applicant@example.com", "password123")

	vacanciesRecorder := request(t, gatewayServer.URL, http.MethodGet, "/api/v1/vacancies", "", "")
	assertStatus(t, vacanciesRecorder, http.StatusOK)

	var vacancies vacancyListResponse
	decode(t, vacanciesRecorder, &vacancies)
	if vacancies.Total == 0 || len(vacancies.Items) == 0 {
		t.Fatal("expected seeded vacancies")
	}

	resumeRecorder := request(t, gatewayServer.URL, http.MethodPost, "/api/v1/applicant/resumes", `{
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
		t.Fatal("expected resume id")
	}

	applicationRecorder := request(t, gatewayServer.URL, http.MethodPost, "/api/v1/vacancies/"+vacancies.Items[0].ID+"/applications", `{
		"resume_id": "`+resume.ID+`",
		"cover_letter": "I am interested in this vacancy."
	}`, applicantToken)
	assertStatus(t, applicationRecorder, http.StatusCreated)

	var application applicationResponse
	decode(t, applicationRecorder, &application)
	if application.Status != "submitted" {
		t.Fatalf("expected submitted, got %q", application.Status)
	}

	employerToken := login(t, gatewayServer.URL, "employer@example.com", "password123")

	statusRecorder := request(t, gatewayServer.URL, http.MethodPatch, "/api/v1/employer/applications/"+application.ID+"/status", `{
		"status": "reviewing"
	}`, employerToken)
	assertStatus(t, statusRecorder, http.StatusOK)

	var updated applicationResponse
	decode(t, statusRecorder, &updated)
	if updated.Status != "reviewing" {
		t.Fatalf("expected reviewing, got %q", updated.Status)
	}
}

func login(t *testing.T, baseURL string, email string, password string) string {
	t.Helper()

	recorder := request(t, baseURL, http.MethodPost, "/api/v1/auth/login", `{
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

type testResponse struct {
	Code int
	Body *bytes.Buffer
}

func request(t *testing.T, baseURL string, method string, path string, body string, token string) testResponse {
	t.Helper()

	req, err := http.NewRequest(method, baseURL+path, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	if body != "" {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	response, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()

	buffer := bytes.NewBuffer(nil)
	if _, err := io.Copy(buffer, response.Body); err != nil {
		t.Fatal(err)
	}

	return testResponse{Code: response.StatusCode, Body: buffer}
}

func assertStatus(t *testing.T, recorder testResponse, status int) {
	t.Helper()
	if recorder.Code != status {
		t.Fatalf("expected HTTP %d, got %d: %s", status, recorder.Code, recorder.Body.String())
	}
}

func decode(t *testing.T, recorder testResponse, dst any) {
	t.Helper()
	if err := json.NewDecoder(recorder.Body).Decode(dst); err != nil {
		t.Fatalf("decode response: %v; body=%s", err, recorder.Body.String())
	}
}
