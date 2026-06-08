package platform

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func NewClient(baseURL string) Client {
	return Client{
		baseURL: strings.TrimRight(baseURL, "/"),
		http:    &http.Client{Timeout: 3 * time.Second},
	}
}

func (client Client) Get(path string, token string, dst any) error {
	return client.Request(http.MethodGet, path, token, nil, dst)
}

func (client Client) Post(path string, token string, payload any, dst any) error {
	return client.Request(http.MethodPost, path, token, payload, dst)
}

func (client Client) Put(path string, token string, payload any, dst any) error {
	return client.Request(http.MethodPut, path, token, payload, dst)
}

func (client Client) Patch(path string, token string, payload any, dst any) error {
	return client.Request(http.MethodPatch, path, token, payload, dst)
}

func (client Client) Delete(path string, token string) error {
	return client.Request(http.MethodDelete, path, token, nil, nil)
}

func (client Client) Request(method string, path string, token string, payload any, dst any) error {
	var body io.Reader
	if payload != nil {
		buffer := bytes.NewBuffer(nil)
		if err := json.NewEncoder(buffer).Encode(payload); err != nil {
			return err
		}
		body = buffer
	}

	request, err := http.NewRequest(method, client.baseURL+path, body)
	if err != nil {
		return err
	}
	if payload != nil {
		request.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}

	response, err := client.http.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode >= 400 {
		var errorBody struct {
			Error   string `json:"error"`
			Message string `json:"message"`
		}
		_ = json.NewDecoder(response.Body).Decode(&errorBody)
		if errorBody.Message == "" {
			errorBody.Message = fmt.Sprintf("service returned HTTP %d", response.StatusCode)
		}
		return &Error{Status: response.StatusCode, Code: errorBody.Error, Message: errorBody.Message}
	}

	if dst == nil || response.StatusCode == http.StatusNoContent {
		return nil
	}
	return json.NewDecoder(response.Body).Decode(dst)
}
