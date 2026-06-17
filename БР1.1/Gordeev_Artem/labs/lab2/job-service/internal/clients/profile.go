package clients

import (
	"encoding/json"
	"fmt"
	"job-service/internal/config"
	"net/http"
	"time"
)

type ProfileClient struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewProfileClient(cfg *config.Config) *ProfileClient {
	return &ProfileClient{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type EmployerResponse struct {
	UserID    string  `json:"user_id"`
	CompanyID *string `json:"company_id"`
}

func (c *ProfileClient) GetEmployer(userID string) (*EmployerResponse, error) {
	url := fmt.Sprintf("%s/internal/employers/%s", c.cfg.ProfileServiceURL, userID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("employer not found")
	}

	var empResp EmployerResponse
	if err := json.NewDecoder(resp.Body).Decode(&empResp); err != nil {
		return nil, err
	}

	return &empResp, nil
}
