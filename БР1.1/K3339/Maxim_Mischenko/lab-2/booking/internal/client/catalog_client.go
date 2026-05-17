package client

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type CatalogClient struct {
	BaseURL string
}

type TableInfo struct {
	ID int `json:"id"`
	RestaurantID int `json:"restaurant_id"`
	Capacity int `json:"capacity"`
	}

func (c *CatalogClient) GetTableInfo(tableID int) (*TableInfo, error) {
	url := fmt.Sprintf("%s/internal/tables/%d", c.BaseURL, tableID)
	resp, err := http.Get(url)
	if err != nil || resp.StatusCode != 200 {
		return nil, fmt.Errorf("catalog service unavailable or table not found")
	}
	defer resp.Body.Close()

	var info TableInfo
	json.NewDecoder(resp.Body).Decode(&info)
	return &info, nil
}
