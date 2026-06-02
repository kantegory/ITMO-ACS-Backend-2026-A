package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"messaging-service/internal/config"
	"time"
)

type AuthClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

type UserInfo struct {
	ID       uint   `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Role     string `json:"role"`
}

func NewAuthClient(cfg *config.Config) *AuthClient {
	return &AuthClient{
		baseURL:      cfg.AuthServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *AuthClient) GetUserByID(userID uint) (*UserInfo, error) {
	url := fmt.Sprintf("%s/internal/users/%d?service_token=%s", c.baseURL, userID, c.serviceToken)
	resp, err := c.httpClient.Get(url)
	if err != nil {
		return nil, fmt.Errorf("auth service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("auth service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode auth service response: %w", err)
	}

	data, ok := result["id"]
	if !ok {
		return nil, fmt.Errorf("unexpected auth service response format")
	}

	userInfo := &UserInfo{}
	if id, ok := data.(float64); ok {
		userInfo.ID = uint(id)
	}
	if email, ok := result["email"].(string); ok {
		userInfo.Email = email
	}
	if fullName, ok := result["full_name"].(string); ok {
		userInfo.FullName = fullName
	}
	if role, ok := result["role"].(string); ok {
		userInfo.Role = role
	}

	return userInfo, nil
}