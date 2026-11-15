package client

import (
	"booking-service/internal/config"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type PaymentClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func NewPaymentClient(cfg *config.Config) *PaymentClient {
	return &PaymentClient{
		baseURL:      cfg.PaymentServiceURL,
		serviceToken: cfg.ServiceToken,
		httpClient:   &http.Client{},
	}
}

type CreatePaymentRequest struct {
	RentalID       uint    `json:"rental_id"`
	TenantID       uint    `json:"tenant_id"`
	Amount          float64 `json:"amount"`
	PaymentMethod   string  `json:"payment_method"`
	IdempotencyKey  string  `json:"idempotency_key"`
}

func (c *PaymentClient) CreatePayment(rentalID uint, tenantID uint, amount float64, paymentMethod string, idempotencyKey string) (map[string]interface{}, error) {
	payload := CreatePaymentRequest{
		RentalID:      rentalID,
		TenantID:      tenantID,
		Amount:        amount,
		PaymentMethod: paymentMethod,
		IdempotencyKey: idempotencyKey,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal payment request: %w", err)
	}

	url := c.baseURL + "/internal/payments"
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("payment service unavailable: %w", err)
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode payment response: %w", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		errMsg, _ := result["error"].(string)
		if errMsg == "" {
			errMsg = fmt.Sprintf("payment failed with status %d", resp.StatusCode)
		}
		return nil, fmt.Errorf("%s", errMsg)
	}

	return result, nil
}

func (c *PaymentClient) GetTransactionsByRental(rentalID uint) ([]map[string]interface{}, error) {
	url := fmt.Sprintf("%s/internal/transactions/rental/%d", c.baseURL, rentalID)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Service-Token", c.serviceToken)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("payment service unavailable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to get transactions with status %d", resp.StatusCode)
	}

	var result struct {
		Transactions []map[string]interface{} `json:"transactions"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode payment response: %w", err)
	}

	return result.Transactions, nil
}