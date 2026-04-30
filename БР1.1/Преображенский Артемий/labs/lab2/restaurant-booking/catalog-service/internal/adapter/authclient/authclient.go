package authclient

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/catalog-service/internal/domain"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

type userResponse struct {
	ID       uuid.UUID `json:"id"`
	FullName string    `json:"full_name"`
}

func (c *Client) GetUserName(ctx context.Context, userID uuid.UUID) (string, error) {
	url := fmt.Sprintf("%s/internal/users/%s", c.baseURL, userID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return "", fmt.Errorf("auth-service: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		var body userResponse
		if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
			return "", err
		}
		return body.FullName, nil
	case http.StatusNotFound:
		return "", domain.ErrNotFound
	default:
		return "", errors.New("auth-service: unexpected status " + resp.Status)
	}
}
