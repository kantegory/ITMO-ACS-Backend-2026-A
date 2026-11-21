package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"payment-service/internal/config"
	"strings"
)

type BookingClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func NewBookingClient(cfg *config.Config) *BookingClient {
	return &BookingClient{
		baseURL:      cfg.BookingServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{},
	}
}

type RentalResponse struct {
	ID         int     `json:"id"`
	TenantID   int     `json:"tenant_id"`
	PropertyID int     `json:"property_id"`
	StartDate  string  `json:"start_date"`
	EndDate    string  `json:"end_date"`
	TotalPrice float64 `json:"total_price"`
	Status     string  `json:"status"`
	CreatedAt  string  `json:"created_at"`
}

func (c *BookingClient) GetRentalByID(rentalID int) (*RentalResponse, error) {
	url := fmt.Sprintf("%s/internal/rentals/%d", c.baseURL, rentalID)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call booking service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("booking service returned status %d: %s", resp.StatusCode, string(body))
	}

	var rental RentalResponse
	if err := json.NewDecoder(resp.Body).Decode(&rental); err != nil {
		return nil, fmt.Errorf("failed to decode rental response: %w", err)
	}

	return &rental, nil
}

func (c *BookingClient) UpdateRentalStatus(rentalID int, status string) error {
	url := fmt.Sprintf("%s/internal/rentals/%d/status", c.baseURL, rentalID)
	body := fmt.Sprintf(`{"status":"%s"}`, status)

	req, err := http.NewRequest("PATCH", url, strings.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call booking service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("booking service returned status %d: %s", resp.StatusCode, string(respBody))
	}

	return nil
}