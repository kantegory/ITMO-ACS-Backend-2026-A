package database

import (
	"time"

	"recipehub/internal/config"
	"recipehub/internal/infrastructure/database/model"
	jwtsec "recipehub/internal/infrastructure/security/jwt"
)

type IssuedTokens struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int
}

func (s *Store) IssueTokenPair(cfg config.Config, userID uint64) (*IssuedTokens, error) {
	access, err := jwtsec.IssueAccessToken(
		userID,
		cfg.JWTAccessSecret,
		time.Duration(cfg.AccessTTLSeconds)*time.Second,
	)
	if err != nil {
		return nil, err
	}
	raw, err := jwtsec.RandomToken()
	if err != nil {
		return nil, err
	}
	rt := model.RefreshToken{
		UserID:    userID,
		TokenHash: jwtsec.HashToken(raw),
		ExpiresAt: time.Now().UTC().Add(time.Duration(cfg.RefreshTTLSeconds) * time.Second),
	}
	if err := s.DB.Create(&rt).Error; err != nil {
		return nil, err
	}
	return &IssuedTokens{
		AccessToken:  access,
		RefreshToken: raw,
		ExpiresIn:    cfg.AccessTTLSeconds,
	}, nil
}
