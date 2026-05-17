package clients

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

var ErrNotFound = fmt.Errorf("not found")

type AuthClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

type validateUsersRequest struct {
	UserIDs []uint `json:"user_ids"`
}

type validateUsersResponse struct {
	Valid          []uint `json:"valid"`
	InvalidUserIDs []uint `json:"invalid_user_ids"`
}

func NewAuthClient(baseURL string) *AuthClient {
	return &AuthClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (c *AuthClient) ValidateUsers(ctx context.Context, userIDs []uint) ([]uint, []uint, error) {
	if len(userIDs) == 0 {
		return nil, nil, nil
	}

	body, err := json.Marshal(validateUsersRequest{UserIDs: userIDs})
	if err != nil {
		return nil, nil, err
	}

	url := fmt.Sprintf("%s/internal/users/validate", c.BaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return nil, nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return nil, nil, fmt.Errorf("auth service returned %d: %s", resp.StatusCode, string(raw))
	}

	var out validateUsersResponse
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return nil, nil, err
	}
	return out.Valid, out.InvalidUserIDs, nil
}

func (c *AuthClient) UserExists(ctx context.Context, userID uint) (bool, error) {
	valid, invalid, err := c.ValidateUsers(ctx, []uint{userID})
	if err != nil {
		return false, err
	}
	if len(invalid) > 0 {
		return false, nil
	}
	return len(valid) > 0, nil
}
