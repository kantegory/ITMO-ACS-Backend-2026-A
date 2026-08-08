package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

var (
	ErrNotFound = fmt.Errorf("not found")
)

type AuthClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type InternalUser struct {
	ID       uint   `json:"id"`
	Role     string `json:"role"`
	IsActive bool   `json:"is_active"`
}

func NewAuthClient(baseURL string) *AuthClient {
	if baseURL == "" {
		return nil
	}
	return &AuthClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (c *AuthClient) GetUser(ctx context.Context, userID uint) (*InternalUser, error) {
	if c == nil {
		return nil, nil
	}

	url := fmt.Sprintf("%s/internal/users/%d", c.BaseURL, userID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("auth service returned status %d", resp.StatusCode)
	}

	var user InternalUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

func (c *AuthClient) ValidateUser(ctx context.Context, userID uint) error {
	if c == nil {
		return nil
	}
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}
	if user == nil || !user.IsActive {
		return ErrNotFound
	}
	return nil
}
