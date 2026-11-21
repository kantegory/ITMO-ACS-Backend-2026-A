package proxy

import (
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var httpClient = &http.Client{
	Timeout: 30 * time.Second,
}

func ProxyRequest(targetURL string, c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": gin.H{"code": "BAD_REQUEST", "message": "Failed to read request body"}})
		return
	}
	defer c.Request.Body.Close()

	req, err := http.NewRequest(c.Request.Method, targetURL+c.Request.URL.Path, strings.NewReader(string(body)))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "PROXY_ERROR", "message": "Failed to create request"}})
		return
	}

	if c.Request.URL.RawQuery != "" {
		req.URL.RawQuery = c.Request.URL.RawQuery
	}

	for key, values := range c.Request.Header {
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	resp, err := httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"code": "UPSTREAM_ERROR", "message": "Service unavailable: " + err.Error()}})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "PROXY_ERROR", "message": "Failed to read response"}})
		return
	}

	for key, values := range resp.Header {
		for _, value := range values {
			if key != "Content-Length" {
				c.Writer.Header().Add(key, value)
			}
		}
	}

	c.Writer.WriteHeader(resp.StatusCode)
	c.Writer.Write(respBody)
}

func ProxyMultipart(targetURL string, c *gin.Context) {
	req, err := http.NewRequest(c.Request.Method, targetURL+c.Request.URL.Path, c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "PROXY_ERROR", "message": "Failed to create request"}})
		return
	}

	if c.Request.URL.RawQuery != "" {
		req.URL.RawQuery = c.Request.URL.RawQuery
	}

	req.Header = c.Request.Header.Clone()
	req.ContentLength = c.Request.ContentLength

	resp, err := httpClient.Do(req)
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": gin.H{"code": "UPSTREAM_ERROR", "message": "Service unavailable: " + err.Error()}})
		return
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": gin.H{"code": "PROXY_ERROR", "message": "Failed to read response"}})
		return
	}

	for key, values := range resp.Header {
		for _, value := range values {
			if key != "Content-Length" {
				c.Writer.Header().Add(key, value)
			}
		}
	}

	c.Writer.WriteHeader(resp.StatusCode)
	c.Writer.Write(respBody)
}