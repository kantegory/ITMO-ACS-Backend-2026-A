package client

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"messaging-service/internal/config"
	"time"
)

type BookingClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

type RentalCheckResponse struct {
	HasRental bool `json:"has_rental"`
}

func NewBookingClient(cfg *config.Config) *BookingClient {
	return &BookingClient{
		baseURL:      cfg.BookingServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *BookingClient) CheckRental(propertyID, userID1, userID2 int) (bool, error) {
	url := fmt.Sprintf("%s/internal/rentals/check?property_id=%d&user1_id=%d&user2_id=%d&service_token=%s",
		c.baseURL, propertyID, userID1, userID2, c.serviceToken)

	resp, err := c.httpClient.Get(url)
	if err != nil {
		return false, fmt.Errorf("booking service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return false, fmt.Errorf("booking service returned status %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return false, fmt.Errorf("failed to decode booking service response: %w", err)
	}

	hasRental, ok := result["has_rental"].(bool)
	if !ok {
		if hasRentalFloat, ok := result["has_rental"].(float64); ok {
			hasRental = hasRentalFloat != 0
		} else {
			return false, fmt.Errorf("unexpected booking service response format")
		}
	}

	return hasRental, nil
}