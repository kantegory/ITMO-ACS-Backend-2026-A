package clients

import (
	"encoding/json"
	"fmt"
	"job-service/internal/config"
	"net/http"
	"time"
)

type ResumeClient struct {
	cfg        *config.Config
	httpClient *http.Client
}

func NewResumeClient(cfg *config.Config) *ResumeClient {
	return &ResumeClient{
		cfg: cfg,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type CheckOwnerResponse struct {
	Valid    bool   `json:"valid"`
	ResumeID string `json:"resume_id"`
}

func (c *ResumeClient) CheckOwner(userID, resumeID string) (bool, error) {
	url := fmt.Sprintf("%s/internal/resumes/by-owner/%s?resume_id=%s", c.cfg.ResumeServiceURL, userID, resumeID)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return false, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return false, nil
	}

	var res CheckOwnerResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return false, err
	}

	return res.Valid, nil
}
