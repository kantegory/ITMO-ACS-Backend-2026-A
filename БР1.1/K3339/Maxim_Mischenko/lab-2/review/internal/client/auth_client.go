package client

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type AuthClient struct {
	BaseURL string
	client  *http.Client
}

func NewAuthClient(baseURL string) *AuthClient {
	return &AuthClient{
		BaseURL: baseURL,
		client:  &http.Client{Timeout: 3 * time.Second},
	}
}

func (c *AuthClient) GetUserName(userID int) (string, error) {
	url := fmt.Sprintf("%s/internal/users/%d", c.BaseURL, userID)
	resp, err := c.client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("auth service returned %d", resp.StatusCode)
	}

	var user struct {
		FullName string `json:"full_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return "", err
	}
	return user.FullName, nil
}
