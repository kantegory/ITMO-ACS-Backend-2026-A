package client

import (
	"encoding/json"
	"fmt"
	"io"
	"messaging-service/internal/config"
	"net/http"
	"time"
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
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *PropertyClient) GetPropertyTitle(propertyID int) (string, error) {
	url := fmt.Sprintf("%s/internal/properties/%d?service_token=%s", c.baseURL, propertyID, c.serviceToken)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return "", fmt.Errorf("property service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("property service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode property response: %w", err)
	}

	title, _ := result["title"].(string)
	return title, nil
}
