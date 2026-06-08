package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/google/uuid"

	"auth-service/internal/domain"
	"auth-service/pkg/apperror"
)

type ProfileClient struct {
	baseURL string
	client  *http.Client
}

func NewProfileClient(baseURL string) *ProfileClient {
	return &ProfileClient{baseURL: baseURL, client: &http.Client{}}
}

func (c *ProfileClient) CreateProfile(ctx context.Context, userID uuid.UUID, role domain.Role, fullName, companyName string) error {
	body, _ := json.Marshal(map[string]string{
		"user_id":      userID.String(),
		"role":         string(role),
		"full_name":    fullName,
		"company_name": companyName,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/v1/profiles", bytes.NewReader(body))
	if err != nil {
		return apperror.Internal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(req)
	if err != nil {
		return apperror.Internal(fmt.Errorf("profile service: %w", err))
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return apperror.Internal(fmt.Errorf("profile service status: %d", resp.StatusCode))
	}
	return nil
}
