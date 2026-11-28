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

func (c *Client) GetTable(ctx context.Context, restaurantID uuid.UUID, tableID uuid.UUID) (domain.Table, error) {
	url := fmt.Sprintf("%s/service/restaurants/%s/tables/%s", c.baseURL, restaurantID.String(), tableID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return domain.Table{}, err
	}
	resp, err := c.http.Do(req)
	if err != nil {
		return domain.Table{}, fmt.Errorf("catalog-service: %w", err)
	}
	defer resp.Body.Close()

	switch resp.StatusCode {
	case http.StatusOK:
		var t domain.Table
		if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
			return domain.Table{}, err
		}
		return t, nil
	case http.StatusNotFound:
		return domain.Table{}, domain.ErrNotFound
	default:
		return domain.Table{}, errors.New("catalog-service: unexpected status " + resp.Status)
	}
}
