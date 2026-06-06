package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type PropertyClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type PropertyInternal struct {
	ID          uint `json:"id"`
	OwnerID     uint `json:"owner_id"`
	IsAvailable bool `json:"is_available"`
	IsVerified  bool `json:"is_verified"`
}

func NewPropertyClient(baseURL string) *PropertyClient {
	return &PropertyClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

func (c *PropertyClient) GetProperty(ctx context.Context, propertyID uint) (*PropertyInternal, error) {
	if c == nil || c.BaseURL == "" {
		return nil, fmt.Errorf("property service is not configured")
	}

	url := fmt.Sprintf("%s/internal/properties/%d", c.BaseURL, propertyID)
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
		return nil, fmt.Errorf("property service returned status %d", resp.StatusCode)
	}

	var property PropertyInternal
	if err := json.NewDecoder(resp.Body).Decode(&property); err != nil {
		return nil, err
	}
	return &property, nil
}
