package client

import (
	"booking-service/internal/config"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type AuthClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func NewAuthClient(cfg *config.Config) *AuthClient {
	return &AuthClient{
		baseURL:      cfg.AuthServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{},
	}
}

func (c *AuthClient) ValidateToken(token string) (map[string]interface{}, error) {
	payload := map[string]string{"token": token}
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal validate request: %w", err)
	}

	req, err := http.NewRequest("POST", c.baseURL+"/internal/auth/validate", bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("token validation failed with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode auth response: %w", err)
	}

	return result, nil
}

func (c *AuthClient) GetUserByID(userID uint) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/internal/users/%d", c.baseURL, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user not found with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode auth response: %w", err)
	}

	return result, nil
}

func (c *AuthClient) GetUserBrief(userID uint) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/internal/users/%d", c.baseURL, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user not found with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode auth response: %w", err)
	}

	return map[string]interface{}{
		"id":        result["id"],
		"email":     result["email"],
		"full_name": result["full_name"],
		"phone":     result["phone"],
		"role":      result["role"],
	}, nil
}

func (c *AuthClient) GetUserRole(userID uint) (string, error) {
	url := fmt.Sprintf("%s/internal/users/%d/role", c.baseURL, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("auth service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get user role with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode auth response: %w", err)
	}

	role, ok := result["role"].(string)
	if !ok {
		return "", fmt.Errorf("invalid role format in response")
	}

	return role, nil
}