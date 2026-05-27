package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"property-service/internal/config"
	"strconv"
	"time"
)

type AuthClient struct {
	baseURL string
	token   string
	client  *http.Client
}

type UserInfo struct {
	ID       uint   `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

type TokenValidation struct {
	Valid bool     `json:"valid"`
	User  UserInfo `json:"user"`
}

func NewAuthClient(cfg *config.Config) *AuthClient {
	return &AuthClient{
		baseURL: cfg.AuthServiceURL,
		token:   cfg.ServiceToken,
		client:  &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *AuthClient) ValidateToken(tokenString string) (*TokenValidation, error) {
	body, _ := json.Marshal(map[string]string{"token": tokenString})
	req, err := http.NewRequest("POST", c.baseURL+"/internal/auth/validate", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-Token", c.token)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return &TokenValidation{Valid: false}, nil
	}

	var result TokenValidation
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	return &result, nil
}

func (c *AuthClient) GetUserByID(userID uint) (*UserInfo, error) {
	url := c.baseURL + "/internal/users/" + strconv.FormatUint(uint64(userID), 10)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.token)

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("user not found")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("auth service returned status %d", resp.StatusCode)
	}

	var user UserInfo
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	return &user, nil
}

func (c *AuthClient) GetUserRole(userID uint) (string, error) {
	url := c.baseURL + "/internal/users/" + strconv.FormatUint(uint64(userID), 10) + "/role"
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.token)

	resp, err := c.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("auth service returned status %d", resp.StatusCode)
	}

	var result struct {
		UserID uint   `json:"user_id"`
		Role   string `json:"role"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}
	return result.Role, nil
}

func (c *AuthClient) CheckOwnership(userID uint) (bool, string, error) {
	role, err := c.GetUserRole(userID)
	if err != nil {
		return false, "", err
	}
	return role == "owner" || role == "admin", role, nil
}