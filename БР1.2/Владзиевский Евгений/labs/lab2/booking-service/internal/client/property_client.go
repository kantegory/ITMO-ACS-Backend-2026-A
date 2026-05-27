package client

import (
	"booking-service/internal/config"
	"encoding/json"
	"fmt"
	"net/http"
)

type PropertyClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func NewPropertyClient(cfg *config.Config) *PropertyClient {
	return &PropertyClient{
		baseURL:      cfg.PropertyServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{},
	}
}

func (c *PropertyClient) GetPropertyByID(propertyID uint) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/internal/properties/%d", c.baseURL, propertyID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("property service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("property not found with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode property response: %w", err)
	}

	return result, nil
}

func (c *PropertyClient) GetPropertyBrief(propertyID uint) (map[string]interface{}, error) {
	url := fmt.Sprintf("%s/internal/properties/%d", c.baseURL, propertyID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("property service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("property not found with status %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode property response: %w", err)
	}

	return map[string]interface{}{
		"id":            result["id"],
		"title":         result["title"],
		"city":          result["city"],
		"price_per_day": result["price_per_day"],
	}, nil
}

func (c *PropertyClient) CheckOwner(propertyID uint, userID uint) (bool, error) {
	url := fmt.Sprintf("%s/internal/properties/%d/owner?user_id=%d", c.baseURL, propertyID, userID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return false, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, fmt.Errorf("property service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var result map[string]interface{}
		if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
			return false, err
		}
		isOwner, ok := result["is_owner"].(bool)
		if !ok {
			return false, fmt.Errorf("invalid response format")
		}
		return isOwner, nil
	}

	return false, nil
}