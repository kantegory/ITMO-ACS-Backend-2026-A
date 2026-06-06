package repository

import (
	"database/sql"

	"github.com/ZZISST/rental-api/internal/model"
)

type FavoriteRepository struct {
	db *sql.DB
}

func NewFavoriteRepository(db *sql.DB) *FavoriteRepository {
	return &FavoriteRepository{db: db}
}

func (r *FavoriteRepository) List(userID string) ([]model.Property, error) {
	rows, err := r.db.Query(
		`SELECT p.id, p.owner_id, p.title, p.description, p.property_type, p.price_per_night, p.currency, p.city, p.address, p.lat, p.lon, p.rooms, p.beds, p.max_guests, p.area_m2, p.check_in_time, p.check_out_time, p.rules, p.status, p.created_at, p.updated_at
		 FROM favorites f
		 JOIN properties p ON f.property_id = p.id
		 WHERE f.user_id = $1
		 ORDER BY f.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var properties []model.Property
	for rows.Next() {
		var p model.Property
		err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
			&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
			&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		properties = append(properties, p)
	}
	return properties, nil
}

func (r *FavoriteRepository) Add(userID, propertyID string) (*model.Favorite, error) {
	f := &model.Favorite{}
	err := r.db.QueryRow(
		`INSERT INTO favorites (user_id, property_id)
		 VALUES ($1, $2)
		 RETURNING user_id, property_id, created_at`,
		userID, propertyID,
	).Scan(&f.UserID, &f.PropertyID, &f.CreatedAt)
	if err != nil {
		return nil, err
	}
	return f, nil
}

func (r *FavoriteRepository) Remove(userID, propertyID string) error {
	_, err := r.db.Exec(
		"DELETE FROM favorites WHERE user_id = $1 AND property_id = $2",
		userID, propertyID,
	)
	return err
}

func (r *FavoriteRepository) Exists(userID, propertyID string) (bool, error) {
	var count int
	err := r.db.QueryRow(
		"SELECT COUNT(*) FROM favorites WHERE user_id = $1 AND property_id = $2",
		userID, propertyID,
	).Scan(&count)
	return count > 0, err
}
