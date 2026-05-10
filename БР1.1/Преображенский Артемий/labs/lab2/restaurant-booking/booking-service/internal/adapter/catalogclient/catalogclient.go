package catalogclient

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/google/uuid"

	"restaurant-booking/booking-service/internal/domain"
)

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

type Table struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	TableNumber  int       `json:"table_number"`
	SeatsCount   int       `json:"seats_count"`
}

func (c *Client) GetTable(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (Table, error) {
	url := fmt.Sprintf("%s/service/restaurants/%s/tables/%s", c.baseURL, restaurantID.String(), tableID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return Table{}, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return Table{}, fmt.Errorf("catalog-service: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		var t Table
		if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
			return Table{}, err
		}
		return t, nil
	case http.StatusNotFound:
		return Table{}, domain.ErrNotFound
	default:
		return Table{}, errors.New("catalog-service: unexpected status " + resp.Status)
	}
}
