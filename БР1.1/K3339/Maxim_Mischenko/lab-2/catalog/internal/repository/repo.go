package repository

import (
	"catalog/internal/models"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type CatalogRepository struct {
	db *sqlx.DB
}

func NewCatalogRepository(db *sqlx.DB) *CatalogRepository {
	return &CatalogRepository{db: db}
}

func (r *CatalogRepository) GetRestaurants(f models.RestaurantFilters) (*models.RestaurantListResponse, error) {
	var response models.RestaurantListResponse

	selectClause := "SELECT * FROM restaurants"
	countClause := "SELECT COUNT(*) FROM restaurants"
	whereClauses := []string{"1=1"}
	args := []interface{}{}
	argCounter := 1

	if f.Name != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("name ILIKE $%d", argCounter))
		args = append(args, "%"+f.Name+"%")
		argCounter++
	}

	if f.City != "" {
		whereClauses = append(whereClauses, fmt.Sprintf("city = $%d", argCounter))
		args = append(args, f.City)
		argCounter++
	}

	if f.CuisineID > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("cuisine_id = $%d", argCounter))
		args = append(args, f.CuisineID)
		argCounter++
	}

	if f.MinPrice > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("avg_price_per_person >= $%d", argCounter))
		args = append(args, f.MinPrice)
		argCounter++
	}

	if f.MaxPrice > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("avg_price_per_person <= $%d", argCounter))
		args = append(args, f.MaxPrice)
		argCounter++
	}

	if f.AvgRating > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("avg_rating >= $%d", argCounter))
		args = append(args, f.AvgRating)
		argCounter++
	}

	if f.ReviewsCount > 0 {
		whereClauses = append(whereClauses, fmt.Sprintf("reviews_count >= $%d", argCounter))
		args = append(args, f.ReviewsCount)
		argCounter++
	}

	whereSQL := " WHERE " + strings.Join(whereClauses, " AND ")

	err := r.db.Get(&response.Total, countClause+whereSQL, args...)
	if err != nil {
		return nil, err
	}

	sortSQL := " ORDER BY id DESC"
	switch f.SortBy {
	case "avg_price_asc":
		sortSQL = " ORDER BY avg_price_per_person ASC"
	case "avg_price_desc":
		sortSQL = " ORDER BY avg_price_per_person DESC"
	case "name_asc":
		sortSQL = " ORDER BY name ASC"
	case "name_desc":
		sortSQL = " ORDER BY name DESC"
	case "rating_asc":
		sortSQL = " ORDER BY avg_rating ASC"
	case "rating_desc":
		sortSQL = " ORDER BY avg_rating DESC"
	case "reviews_count_asc":
		sortSQL = " ORDER BY reviews_count ASC"
	case "reviews_count_desc":
		sortSQL = " ORDER BY reviews_count DESC"
	}

	paginationSQL := fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCounter, argCounter+1)
	args = append(args, f.Limit, f.Offset)

	finalQuery := selectClause + whereSQL + sortSQL + paginationSQL
	err = r.db.Select(&response.Items, finalQuery, args...)
	if err != nil {
		return nil, err
	}
	
	return &response, err
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

func (r *CatalogRepository) UpdateRestaurantRating(id int, avg float64, count int) error {
	_, err := r.db.Exec("UPDATE restaurants SET avg_rating = $1, reviews_count = $2 WHERE id = $3", avg, count, id)
	return err
}
