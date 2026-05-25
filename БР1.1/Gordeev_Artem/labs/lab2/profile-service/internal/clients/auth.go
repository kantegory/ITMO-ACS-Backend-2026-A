package clients

import (
	"encoding/json"
	"fmt"
	"net/http"
	"profile-service/internal/config"
	"time"
)

type AuthClient struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewAuthClient(cfg *config.Config) *AuthClient {
	return &AuthClient{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type UserResponse struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Role  string `json:"role"`
}

func (c *AuthClient) ValidateUser(userID string) (*UserResponse, error) {
	url := fmt.Sprintf("%s/internal/users/%s", c.cfg.AuthServiceURL, userID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user not found or invalid response from auth service")
	}

	var userResp UserResponse
	if err := json.NewDecoder(resp.Body).Decode(&userResp); err != nil {
		return nil, err
	}

	return &userResp, nil
}
