package repository

import (
	"catalog/internal/models"
	"github.com/jmoiron/sqlx"
)

type CatalogRepository struct {
	db *sqlx.DB
}

func NewCatalogRepository(db *sqlx.DB) *CatalogRepository {
	return &CatalogRepository{db: db}
}

func (r *CatalogRepository) GetRestaurants(city string, cuisineID int) ([]models.Restaurant, error) {
	var res []models.Restaurant
	query := "SELECT * FROM restaurants WHERE 1=1"
	args := []interface{}{}

	if city != "" {
		query += " AND city = $1"
		args = append(args, city)
	}
	// Filters logic

	err := r.db.Select(&res, query, args...)
	return res, err
}

func (r *CatalogRepository) GetRestaurantByID(id int) (*models.Restaurant, error) {
	var res models.Restaurant
	err := r.db.Get(&res, "SELECT * FROM restaurants WHERE id = $1", id)
	return &res, err
}

func (r *CatalogRepository) GetMenuByRestaurant(restaurantID int) ([]models.MenuItem, error) {
	var items []models.MenuItem
	err := r.db.Select(&items, "SELECT * FROM menu_items WHERE restaurant_id = $1", restaurantID)
	return items, err
}

func (r *CatalogRepository) GetTableByID(id int) (*models.Table, error) {
	var t models.Table
	err := r.db.Get(&t, "SELECT * FROM tables WHERE id = $1", id)
	return &t, err
}
