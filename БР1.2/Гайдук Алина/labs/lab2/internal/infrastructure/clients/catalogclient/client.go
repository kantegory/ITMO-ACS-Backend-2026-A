// Package catalogclient contains HTTP client for catalog-service internal API.
package catalogclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	catalogdomain "recipehub/internal/domain/catalog"
)

const requestTimeout = 5 * time.Second

// Client calls catalog-service internal endpoints.
type Client struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

// New creates a catalog-service client.
func New(baseURL, serviceToken string) *Client {
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		serviceToken: serviceToken,
		httpClient:   &http.Client{Timeout: requestTimeout},
	}
}

// ValidateIDs verifies catalog identifiers.
func (c *Client) ValidateIDs(ctx context.Context, req catalogdomain.ValidateIDsRequest) (catalogdomain.ValidateIDsResult, error) {
	body := struct {
		DishTypeIDs   []uint64 `json:"dish_type_ids"`
		DifficultyIDs []uint64 `json:"difficulty_ids"`
		TagIDs        []uint64 `json:"tag_ids"`
		IngredientIDs []uint64 `json:"ingredient_ids"`
		UnitIDs       []uint64 `json:"unit_ids"`
	}{
		DishTypeIDs:   req.DishTypeIDs,
		DifficultyIDs: req.DifficultyIDs,
		TagIDs:        req.TagIDs,
		IngredientIDs: req.IngredientIDs,
		UnitIDs:       req.UnitIDs,
	}

	var response struct {
		Valid   bool `json:"valid"`
		Invalid struct {
			DishTypeIDs   []uint64 `json:"dish_type_ids"`
			DifficultyIDs []uint64 `json:"difficulty_ids"`
			TagIDs        []uint64 `json:"tag_ids"`
			IngredientIDs []uint64 `json:"ingredient_ids"`
			UnitIDs       []uint64 `json:"unit_ids"`
		} `json:"invalid"`
	}

	if err := c.doJSON(ctx, "/internal/v1/catalog/validate-ids", body, &response); err != nil {
		return catalogdomain.ValidateIDsResult{}, err
	}

	return catalogdomain.ValidateIDsResult{
		Valid: response.Valid,
		Invalid: catalogdomain.InvalidIDs{
			DishTypeIDs:   response.Invalid.DishTypeIDs,
			DifficultyIDs: response.Invalid.DifficultyIDs,
			TagIDs:        response.Invalid.TagIDs,
			IngredientIDs: response.Invalid.IngredientIDs,
			UnitIDs:       response.Invalid.UnitIDs,
		},
	}, nil
}

func (c *Client) doJSON(ctx context.Context, path string, requestBody, responseBody any) error {
	endpoint, err := url.JoinPath(c.baseURL, path)
	if err != nil {
		return fmt.Errorf("build catalog url: %w", err)
	}

	raw, err := json.Marshal(requestBody)
	if err != nil {
		return fmt.Errorf("marshal catalog request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(raw))
	if err != nil {
		return fmt.Errorf("create catalog request: %w", err)
	}
	req.Header.Set("X-Service-Token", c.serviceToken)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("call catalog-service: %w", err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	if resp.StatusCode < http.StatusOK || resp.StatusCode >= http.StatusMultipleChoices {
		return fmt.Errorf("catalog-service returned status %d", resp.StatusCode)
	}
	if err := json.NewDecoder(resp.Body).Decode(responseBody); err != nil {
		return fmt.Errorf("decode catalog response: %w", err)
	}

	return nil
}
