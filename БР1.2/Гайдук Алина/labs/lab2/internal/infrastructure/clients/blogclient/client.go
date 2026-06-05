// Package blogclient contains HTTP client for blog-service internal API.
package blogclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"
)

const requestTimeout = 5 * time.Second

// Client calls blog-service internal endpoints.
type Client struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

// New creates a blog-service client.
func New(baseURL, serviceToken string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		serviceToken: serviceToken,
		httpClient:   &http.Client{Timeout: requestTimeout},
	}
}

// PostExists checks whether post exists.
func (c *Client) PostExists(ctx context.Context, postID uint64) (bool, error) {
	var response struct {
		Exists bool `json:"exists"`
	}

	path := "/internal/v1/posts/" + strconv.FormatUint(postID, 10) + "/exists"
	if err := c.doGET(ctx, path, &response); err != nil {
		return false, err
	}

	return response.Exists, nil
}

func (c *Client) doGET(ctx context.Context, path string, responseBody any) error {
	endpoint, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("build blog url: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("create blog request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call blog-service: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("blog-service returned status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(responseBody); err != nil {
		return fmt.Errorf("decode blog response: %w", err)
	}

	return nil
}
