// Package identityclient contains HTTP client for identity-service internal API.
package identityclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	identitydomain "recipehub/internal/domain/identity"
)

const requestTimeout = 5 * time.Second

// Client calls identity-service internal endpoints.
type Client struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

// New creates an identity-service client.
func New(baseURL, serviceToken string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		serviceToken: serviceToken,
		httpClient:   &http.Client{Timeout: requestTimeout},
	}
}

// UserExists checks whether user exists.
func (c *Client) UserExists(ctx context.Context, userID uint64) (bool, error) {
	var response struct {
		Exists bool `json:"exists"`
	}

	path := "/internal/v1/users/" + strconv.FormatUint(userID, 10) + "/exists"
	if err := c.doJSON(ctx, http.MethodGet, path, nil, &response); err != nil {
		return false, err
	}

	return response.Exists, nil
}

// UsersBatch returns short user previews.
func (c *Client) UsersBatch(ctx context.Context, ids []uint64) ([]identitydomain.UserShort, error) {
	var response struct {
		Users []struct {
			ID          uint64  `json:"id"`
			Username    string  `json:"username"`
			DisplayName string  `json:"display_name"`
			AvatarURL   *string `json:"avatar_url"`
		} `json:"users"`
	}

	body := struct {
		IDs []uint64 `json:"ids"`
	}{IDs: ids}
	if err := c.doJSON(ctx, http.MethodPost, "/internal/v1/users/batch", body, &response); err != nil {
		return nil, err
	}

	out := make([]identitydomain.UserShort, 0, len(response.Users))
	for _, user := range response.Users {
		out = append(out, identitydomain.UserShort{
			ID:          user.ID,
			Username:    user.Username,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarURL,
		})
	}

	return out, nil
}

func (c *Client) doJSON(ctx context.Context, method, path string, requestBody, responseBody any) error {
	endpoint, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("build identity url: %w", err)
	}

	var bodyReader *bytes.Reader
	if requestBody != nil {
		raw, err := json.Marshal(requestBody)
		if err != nil {
			return fmt.Errorf("marshal identity request: %w", err)
		}
		bodyReader = bytes.NewReader(raw)
	} else {
		bodyReader = bytes.NewReader(nil)
	}

	req, err := http.NewRequestWithContext(ctx, method, endpoint, bodyReader)
	if err != nil {
		return fmt.Errorf("create identity request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)
	if requestBody != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call identity-service: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("identity-service returned status %d", resp.StatusCode)
	}
	if responseBody == nil {
		return nil
	}
	if err := json.NewDecoder(resp.Body).Decode(responseBody); err != nil {
		return fmt.Errorf("decode identity response: %w", err)
	}

	return nil
}
