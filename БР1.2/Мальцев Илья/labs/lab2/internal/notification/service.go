package notification

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"job-search-microservices/internal/platform"
)

type Service struct {
	consumer platform.EventConsumer
}

type applicationCreatedPayload struct {
	ApplicationID string `json:"application_id"`
	VacancyID     string `json:"vacancy_id"`
	ResumeID      string `json:"resume_id"`
	ApplicantID   string `json:"applicant_id"`
	Status        string `json:"status"`
}

type applicationStatusChangedPayload struct {
	ApplicationID string `json:"application_id"`
	VacancyID     string `json:"vacancy_id"`
	ApplicantID   string `json:"applicant_id"`
	Status        string `json:"status"`
}

func New(consumer platform.EventConsumer) *Service {
	return &Service{consumer: consumer}
}

func (service *Service) Handler() http.Handler {
	return service
}

func (service *Service) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	platform.CORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	path := strings.TrimRight(r.URL.Path, "/")
	switch path {
	case "/health":
		if platform.RequireMethod(w, r, http.MethodGet) {
			platform.WriteJSON(w, http.StatusOK, map[string]string{"service": "notification", "status": "ok"})
		}
	default:
		platform.WriteError(w, platform.NotFound("route not found"))
	}
}

func (service *Service) Start(ctx context.Context) error {
	return service.consumer.Consume(
		ctx,
		"job_search.notifications",
		[]string{"application.created", "application.status_changed"},
		service.handle,
	)
}

func (service *Service) handle(message platform.EventMessage) error {
	switch message.Type {
	case "application.created":
		var payload applicationCreatedPayload
		if err := json.Unmarshal(message.Payload, &payload); err != nil {
			return err
		}
		log.Printf("notification-service received application.created: application=%s vacancy=%s status=%s", payload.ApplicationID, payload.VacancyID, payload.Status)
	case "application.status_changed":
		var payload applicationStatusChangedPayload
		if err := json.Unmarshal(message.Payload, &payload); err != nil {
			return err
		}
		log.Printf("notification-service received application.status_changed: application=%s vacancy=%s status=%s", payload.ApplicationID, payload.VacancyID, payload.Status)
	default:
		log.Printf("notification-service received unknown event: %s", message.Type)
	}

	return nil
}
