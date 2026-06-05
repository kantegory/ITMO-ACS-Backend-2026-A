// Package tokenmanager adapts identity use cases to JWT helpers.
package tokenmanager

import (
	"time"

	jwtsec "recipehub/internal/infrastructure/security/jwt"
)

// Manager issues and hashes identity tokens.
type Manager struct {
	accessSecret string
}

// New creates a token manager.
func New(accessSecret string) *Manager {
	return &Manager{accessSecret: accessSecret}
}

// IssueAccessToken creates a signed JWT access token.
func (m *Manager) IssueAccessToken(userID uint64, ttl time.Duration) (string, error) {
	return jwtsec.IssueAccessToken(userID, m.accessSecret, ttl)
}

// RandomRefreshToken creates an opaque refresh token.
func (m *Manager) RandomRefreshToken() (string, error) {
	return jwtsec.RandomToken()
}

// HashRefreshToken hashes an opaque refresh token for persistence.
func (m *Manager) HashRefreshToken(raw string) string {
	return jwtsec.HashToken(raw)
}
