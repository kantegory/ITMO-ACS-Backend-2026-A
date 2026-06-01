package restaurantclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// TableInfo mirrors the internal table representation from restaurant-service.
type TableInfo struct {
	ID           string `json:"id"`
	RestaurantID string `json:"restaurant_id"`
	TableNumber  int    `json:"table_number"`
	Capacity     int    `json:"capacity"`
}

type Client struct {
	baseURL string
	http    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		http:    &http.Client{Timeout: 5 * time.Second},
	}
}

func (c *Client) GetTable(ctx context.Context, id string) (*TableInfo, error) {
	url := fmt.Sprintf("%s/internal/tables/%s", c.baseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("restaurant-service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrTableNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("restaurant-service returned %d", resp.StatusCode)
	}

	var t TableInfo
	if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
		return nil, err
	}
	return &t, nil
}

func (c *Client) ListTables(ctx context.Context, restaurantID string) ([]*TableInfo, error) {
	url := fmt.Sprintf("%s/internal/restaurants/%s/tables", c.baseURL, restaurantID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("restaurant-service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrRestaurantNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("restaurant-service returned %d", resp.StatusCode)
	}

	var body struct {
		Tables []*TableInfo `json:"tables"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return nil, err
	}
	return body.Tables, nil
}
