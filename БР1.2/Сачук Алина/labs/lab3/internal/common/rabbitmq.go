package common

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type RabbitMQ struct {
	BaseURL string
	User    string
	Pass    string
	Queue   string
	Client  *http.Client
}

type rabbitGetResponse struct {
	Payload string `json:"payload"`
}

func NewRabbitMQFromEnv() *RabbitMQ {
	return &RabbitMQ{
		BaseURL: strings.TrimRight(envOr("RABBITMQ_API_URL", DefaultRabbitMQAPIURL), "/"),
		User:    envOr("RABBITMQ_USER", DefaultRabbitMQUser),
		Pass:    envOr("RABBITMQ_PASS", DefaultRabbitMQPass),
		Queue:   envOr("RABBITMQ_QUEUE", DefaultRabbitMQQueue),
		Client:  &http.Client{Timeout: 3 * time.Second},
	}
}

func (mq *RabbitMQ) EnsureQueue() error {
	req, err := mq.request(http.MethodPut, "/api/queues/%2f/"+url.PathEscape(mq.Queue), map[string]any{
		"durable": false,
	})
	if err != nil {
		return err
	}
	resp, err := mq.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("rabbitmq queue declare failed: %s: %s", resp.Status, string(body))
	}
	return nil
}

func (mq *RabbitMQ) PublishEvent(event RecipeEvent) error {
	if err := mq.EnsureQueue(); err != nil {
		return err
	}
	payload, err := json.Marshal(event)
	if err != nil {
		return err
	}
	req, err := mq.request(http.MethodPost, "/api/exchanges/%2f/amq.default/publish", map[string]any{
		"properties":       map[string]any{},
		"routing_key":      mq.Queue,
		"payload":          string(payload),
		"payload_encoding": "string",
	})
	if err != nil {
		return err
	}
	resp, err := mq.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("rabbitmq publish failed: %s: %s", resp.Status, string(body))
	}
	return nil
}

func (mq *RabbitMQ) ConsumeEvents(limit int) ([]RecipeEvent, error) {
	if limit < 1 {
		limit = 10
	}
	if err := mq.EnsureQueue(); err != nil {
		return nil, err
	}
	req, err := mq.request(http.MethodPost, "/api/queues/%2f/"+url.PathEscape(mq.Queue)+"/get", map[string]any{
		"count":    limit,
		"ackmode":  "ack_requeue_false",
		"encoding": "auto",
		"truncate": 50000,
	})
	if err != nil {
		return nil, err
	}
	resp, err := mq.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("rabbitmq consume failed: %s: %s", resp.Status, string(body))
	}
	var messages []rabbitGetResponse
	if err := json.NewDecoder(resp.Body).Decode(&messages); err != nil {
		return nil, err
	}
	events := make([]RecipeEvent, 0, len(messages))
	for _, message := range messages {
		var event RecipeEvent
		if err := json.Unmarshal([]byte(message.Payload), &event); err == nil {
			events = append(events, event)
		}
	}
	return events, nil
}

func (mq *RabbitMQ) request(method string, path string, payload any) (*http.Request, error) {
	var body *bytes.Reader
	if payload == nil {
		body = bytes.NewReader(nil)
	} else {
		data, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(data)
	}
	req, err := http.NewRequest(method, mq.BaseURL+path, body)
	if err != nil {
		return nil, err
	}
	req.SetBasicAuth(mq.User, mq.Pass)
	req.Header.Set("Content-Type", "application/json")
	return req, nil
}

func envOr(name string, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(name)); value != "" {
		return value
	}
	return fallback
}
