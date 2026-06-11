package client

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type BookingClient struct {
	BaseURL string
}

func (c *BookingClient) GetBusyTableIDs(resID int, date string, reqID string) ([]int, error) {
	url := fmt.Sprintf("%s/internal/restaurants/%d/busy-tables?date=%s", c.BaseURL, resID, date)

	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("X-Request-Id", reqID)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Booking service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusBadRequest {
			return nil, fmt.Errorf("invalid request parameters sent to Booking Service")
		}
		return nil, fmt.Errorf("Booking Service returned error code: %d", resp.StatusCode)
	}

	var ids []int
	if err := json.NewDecoder(resp.Body).Decode(&ids); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}
	return ids, nil
}
