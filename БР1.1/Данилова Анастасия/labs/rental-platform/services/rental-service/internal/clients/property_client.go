package clients

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
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

type PropertyPublic struct {
	ID            uint            `json:"id"`
	OwnerID       uint            `json:"owner_id"`
	Title         string          `json:"title"`
	Description   string          `json:"description"`
	PropertyType  string          `json:"property_type"`
	City          string          `json:"city"`
	Address       string          `json:"address"`
	PricePerMonth int             `json:"price_per_month"`
	IsVerified    bool            `json:"is_verified"`
	IsAvailable   bool            `json:"is_available"`
	Amenities     json.RawMessage `json:"amenities,omitempty"`
	Images        json.RawMessage `json:"images,omitempty"`
}

func NewPropertyClient(baseURL string) *PropertyClient {
	return &PropertyClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *PropertyClient) GetInternal(ctx context.Context, propertyID uint) (*PropertyInternal, error) {
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
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("property service returned %d: %s", resp.StatusCode, string(body))
	}

	var prop PropertyInternal
	if err := json.NewDecoder(resp.Body).Decode(&prop); err != nil {
		return nil, err
	}
	return &prop, nil
}

func (c *PropertyClient) GetPublic(ctx context.Context, propertyID uint) (*PropertyPublic, error) {
	url := fmt.Sprintf("%s/properties/%d", c.BaseURL, propertyID)
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
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("property service returned %d: %s", resp.StatusCode, string(body))
	}

	var prop PropertyPublic
	if err := json.NewDecoder(resp.Body).Decode(&prop); err != nil {
		return nil, err
	}
	return &prop, nil
}
