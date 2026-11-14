package postgres

import (
	"context"
	"fmt"
	"net"
	"net/url"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	DBDSN    string
	User     string
	Password string
	Host     string
	Port     string
	DBName   string
}

func (c Config) dsn() string {
	if c.DBDSN != "" {
		return c.DBDSN
	}
	u := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.User, c.Password),
		Host:   net.JoinHostPort(c.Host, c.Port),
		Path:   "/" + c.DBName,
	}
	return u.String()
}

type Pool struct {
	pool *pgxpool.Pool
}

func New(ctx context.Context, c Config) (*Pool, error) {
	p, err := pgxpool.New(ctx, c.dsn())
	if err != nil {
		return nil, err
	}
	if err := p.Ping(ctx); err != nil {
		p.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	return &Pool{pool: p}, nil
}

func (p *Pool) Close() {
	if p.pool != nil {
		p.pool.Close()
	}
}

func (p *Pool) Pgx() *pgxpool.Pool {
	return p.pool
}
