// Package recipeclient contains HTTP client for recipe-service internal API.
package recipeclient

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	recipedomain "recipehub/internal/domain/recipe"
)

const requestTimeout = 5 * time.Second

// Client calls recipe-service internal endpoints.
type Client struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

// New creates a recipe-service client.
func New(baseURL, serviceToken string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		serviceToken: serviceToken,
		httpClient:   &http.Client{Timeout: requestTimeout},
	}
}

// RecipeExists checks whether recipe exists.
func (c *Client) RecipeExists(ctx context.Context, recipeID uint64) (bool, error) {
	var response struct {
		Exists bool `json:"exists"`
	}

	path := "/internal/v1/recipes/" + strconv.FormatUint(recipeID, 10) + "/exists"
	if err := c.doGET(ctx, path, &response); err != nil {
		return false, err
	}

	return response.Exists, nil
}

// RecipeBrief returns a short recipe card.
func (c *Client) RecipeBrief(ctx context.Context, recipeID uint64) (recipedomain.Recipe, error) {
	var response struct {
		ID            uint64  `json:"id"`
		Title         string  `json:"title"`
		CoverImageURL *string `json:"cover_image_url"`
		AuthorID      uint64  `json:"author_id"`
	}

	path := "/internal/v1/recipes/" + strconv.FormatUint(recipeID, 10) + "/brief"
	if err := c.doGET(ctx, path, &response); err != nil {
		return recipedomain.Recipe{}, err
	}

	return recipedomain.Recipe{
		ID:            response.ID,
		Title:         response.Title,
		CoverImageURL: response.CoverImageURL,
		AuthorID:      response.AuthorID,
	}, nil
}

// AuthorRecipeCount returns number of recipes by author.
func (c *Client) AuthorRecipeCount(ctx context.Context, authorID uint64) (int64, error) {
	var response struct {
		Count int64 `json:"count"`
	}

	path := "/internal/v1/authors/" + strconv.FormatUint(authorID, 10) + "/recipe-count"
	if err := c.doGET(ctx, path, &response); err != nil {
		return 0, err
	}

	return response.Count, nil
}

func (c *Client) doGET(ctx context.Context, path string, responseBody any) error {
	endpoint, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("build recipe url: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return fmt.Errorf("create recipe request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call recipe-service: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("recipe-service returned status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(responseBody); err != nil {
		return fmt.Errorf("decode recipe response: %w", err)
	}

	return nil
}
