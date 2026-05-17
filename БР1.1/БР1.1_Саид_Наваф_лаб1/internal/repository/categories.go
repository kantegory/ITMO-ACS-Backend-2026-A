package repository

import (
"context"
"job-search-api/internal/model"
"github.com/jackc/pgx/v5/pgxpool"
)

type CategoriesRepo struct {
db *pgxpool.Pool
}

func NewCategoriesRepo(db *pgxpool.Pool) *CategoriesRepo {
return &CategoriesRepo{db: db}
}


func (r *CategoriesRepo) List(ctx context.Context) ([]model.Category, error) {
query := `SELECT id, name, slug FROM categories ORDER BY name`
rows, err := r.db.Query(ctx, query)
if err != nil {
return nil, err
}
defer rows.Close()

var categories []model.Category
for rows.Next() {
var c model.Category
err := rows.Scan(&c.ID, &c.Name, &c.Slug)
if err != nil {
return nil, err
}
categories = append(categories, c)
}
return categories, nil
}
