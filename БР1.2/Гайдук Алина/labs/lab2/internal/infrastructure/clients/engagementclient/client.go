// Package engagementclient contains HTTP client for engagement-service internal API.
package engagementclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	blogdomain "recipehub/internal/domain/blog"
	recipedomain "recipehub/internal/domain/recipe"
)

const requestTimeout = 5 * time.Second

// Client calls engagement-service internal endpoints.
type Client struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

// New creates an engagement-service client.
func New(baseURL, serviceToken string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		serviceToken: serviceToken,
		httpClient:   &http.Client{Timeout: requestTimeout},
	}
}

// RecipeStatsBatch returns engagement counters for recipe ids.
func (c *Client) RecipeStatsBatch(ctx context.Context, recipeIDs []uint64, viewerID *uint64) (map[uint64]recipedomain.EngagementStats, error) {
	if len(recipeIDs) == 0 {
		return map[uint64]recipedomain.EngagementStats{}, nil
	}

	body := struct {
		RecipeIDs []uint64 `json:"recipe_ids"`
		ViewerID  *uint64  `json:"viewer_id"`
	}{RecipeIDs: recipeIDs, ViewerID: viewerID}
	var response struct {
		Stats []struct {
			RecipeID      uint64 `json:"recipe_id"`
			LikesCount    int64  `json:"likes_count"`
			CommentsCount int64  `json:"comments_count"`
			IsLiked       bool   `json:"is_liked"`
			IsSaved       bool   `json:"is_saved"`
		} `json:"stats"`
	}

	if err := c.doJSON(ctx, "/internal/v1/stats/recipes/batch", body, &response); err != nil {
		return nil, err
	}

	stats := make(map[uint64]recipedomain.EngagementStats, len(response.Stats))
	for _, item := range response.Stats {
		stats[item.RecipeID] = recipedomain.EngagementStats{
			LikesCount:    item.LikesCount,
			CommentsCount: item.CommentsCount,
			IsLiked:       item.IsLiked,
			IsSaved:       item.IsSaved,
		}
	}

	return stats, nil
}

// PostStatsBatch returns engagement counters for post ids.
func (c *Client) PostStatsBatch(ctx context.Context, postIDs []uint64, viewerID *uint64) (map[uint64]blogdomain.EngagementStats, error) {
	if len(postIDs) == 0 {
		return map[uint64]blogdomain.EngagementStats{}, nil
	}

	body := struct {
		PostIDs  []uint64 `json:"post_ids"`
		ViewerID *uint64  `json:"viewer_id"`
	}{PostIDs: postIDs, ViewerID: viewerID}
	var response struct {
		Stats []struct {
			PostID        uint64 `json:"post_id"`
			LikesCount    int64  `json:"likes_count"`
			CommentsCount int64  `json:"comments_count"`
			IsLiked       bool   `json:"is_liked"`
		} `json:"stats"`
	}

	if err := c.doJSON(ctx, "/internal/v1/stats/posts/batch", body, &response); err != nil {
		return nil, err
	}

	stats := make(map[uint64]blogdomain.EngagementStats, len(response.Stats))
	for _, item := range response.Stats {
		stats[item.PostID] = blogdomain.EngagementStats{
			LikesCount:    item.LikesCount,
			CommentsCount: item.CommentsCount,
			IsLiked:       item.IsLiked,
		}
	}

	return stats, nil
}

func (c *Client) doJSON(ctx context.Context, path string, requestBody, responseBody any) error {
	endpoint, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("build engagement url: %w", err)
	}

	raw, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("marshal engagement request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("create engagement request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call engagement-service: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("engagement-service returned status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(responseBody); err != nil {
		return fmt.Errorf("decode engagement response: %w", err)
	}

	return nil
}
