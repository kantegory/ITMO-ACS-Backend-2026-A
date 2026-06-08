package client

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"
)

type ProfileClient struct {
	baseURL string
	client  *http.Client
}

func NewProfileClient(baseURL string) *ProfileClient {
	return &ProfileClient{baseURL: baseURL, client: &http.Client{}}
}

func (c *ProfileClient) EmployerExists(ctx context.Context, userID uuid.UUID) (bool, error) {
	url := fmt.Sprintf("%s/internal/v1/employers/%s/exists", c.baseURL, userID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("profile service status: %d", resp.StatusCode)
	}
	var body struct {
		Exists bool `json:"exists"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return false, err
	}
	return body.Exists, nil
}

func (c *ProfileClient) GetCompanyName(ctx context.Context, userID uuid.UUID) (string, error) {
	url := fmt.Sprintf("%s/internal/v1/employers/%s/company-name", c.baseURL, userID.String())
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return "", err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("profile service status: %d", resp.StatusCode)
	}
	var body struct {
		CompanyName string `json:"company_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&body); err != nil {
		return "", err
	}
	return body.CompanyName, nil
}
