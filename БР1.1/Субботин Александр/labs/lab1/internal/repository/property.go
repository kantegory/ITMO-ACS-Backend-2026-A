package repository

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/ZZISST/rental-api/internal/model"
)

type PropertyRepository struct {
	db *sql.DB
}

func NewPropertyRepository(db *sql.DB) *PropertyRepository {
	return &PropertyRepository{db: db}
}

func (r *PropertyRepository) Create(ownerID string, req model.CreatePropertyRequest) (*model.Property, error) {
	p := &model.Property{}
	err := r.db.QueryRow(
		`INSERT INTO properties (owner_id, title, description, property_type, price_per_night, city, max_guests, address, rooms, beds, area_m2, check_in_time, check_out_time, rules)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		 RETURNING id, owner_id, title, description, property_type, price_per_night, currency, city, address, lat, lon, rooms, beds, max_guests, area_m2, check_in_time, check_out_time, rules, status, created_at, updated_at`,
		ownerID, req.Title, req.Description, req.PropertyType, req.PricePerNight, req.City, req.MaxGuests,
		req.Address, req.Rooms, req.Beds, req.AreaM2, req.CheckInTime, req.CheckOutTime, req.Rules,
	).Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
		&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
		&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *PropertyRepository) GetByID(id string) (*model.Property, error) {
	p := &model.Property{}
	err := r.db.QueryRow(
		`SELECT id, owner_id, title, description, property_type, price_per_night, currency, city, address, lat, lon, rooms, beds, max_guests, area_m2, check_in_time, check_out_time, rules, status, created_at, updated_at
		 FROM properties WHERE id = $1`,
		id,
	).Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
		&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
		&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *PropertyRepository) List(filter model.PropertyFilter) ([]model.Property, int, error) {
	where := []string{"1=1"}
	args := []any{}
	idx := 1

	if filter.City != nil {
		where = append(where, fmt.Sprintf("city = $%d", idx))
		args = append(args, *filter.City)
		idx++
	}
	if filter.PropertyType != nil {
		where = append(where, fmt.Sprintf("property_type = $%d", idx))
		args = append(args, *filter.PropertyType)
		idx++
	}
	if filter.PriceMin != nil {
		where = append(where, fmt.Sprintf("price_per_night >= $%d", idx))
		args = append(args, *filter.PriceMin)
		idx++
	}
	if filter.PriceMax != nil {
		where = append(where, fmt.Sprintf("price_per_night <= $%d", idx))
		args = append(args, *filter.PriceMax)
		idx++
	}
	if filter.Rooms != nil {
		where = append(where, fmt.Sprintf("rooms = $%d", idx))
		args = append(args, *filter.Rooms)
		idx++
	}
	if filter.MaxGuests != nil {
		where = append(where, fmt.Sprintf("max_guests >= $%d", idx))
		args = append(args, *filter.MaxGuests)
		idx++
	}

	whereClause := strings.Join(where, " AND ")

	// Count
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM properties WHERE %s AND status = 'active'", whereClause)
	err := r.db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Limit validation
	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}
	if filter.Offset < 0 {
		filter.Offset = 0
	}

	// Data
	dataQuery := fmt.Sprintf(
		`SELECT id, owner_id, title, description, property_type, price_per_night, currency, city, address, lat, lon, rooms, beds, max_guests, area_m2, check_in_time, check_out_time, rules, status, created_at, updated_at
		 FROM properties WHERE %s AND status = 'active'
		 ORDER BY created_at DESC
		 LIMIT $%d OFFSET $%d`,
		whereClause, idx, idx+1,
	)
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.db.Query(dataQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var properties []model.Property
	for rows.Next() {
		var p model.Property
		err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
			&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
			&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		properties = append(properties, p)
	}

	return properties, total, nil
}

func (r *PropertyRepository) ListByOwner(ownerID string, limit, offset int) ([]model.Property, int, error) {
	var total int
	err := r.db.QueryRow("SELECT COUNT(*) FROM properties WHERE owner_id = $1", ownerID).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(
		`SELECT id, owner_id, title, description, property_type, price_per_night, currency, city, address, lat, lon, rooms, beds, max_guests, area_m2, check_in_time, check_out_time, rules, status, created_at, updated_at
		 FROM properties WHERE owner_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
		ownerID, limit, offset,
	)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var properties []model.Property
	for rows.Next() {
		var p model.Property
		err := rows.Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
			&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
			&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		properties = append(properties, p)
	}

	return properties, total, nil
}

func (r *PropertyRepository) Update(id string, req model.UpdatePropertyRequest) (*model.Property, error) {
	sets := []string{}
	args := []any{}
	idx := 1

	if req.Title != nil {
		sets = append(sets, fmt.Sprintf("title = $%d", idx))
		args = append(args, *req.Title)
		idx++
	}
	if req.Description != nil {
		sets = append(sets, fmt.Sprintf("description = $%d", idx))
		args = append(args, *req.Description)
		idx++
	}
	if req.PricePerNight != nil {
		sets = append(sets, fmt.Sprintf("price_per_night = $%d", idx))
		args = append(args, *req.PricePerNight)
		idx++
	}
	if req.City != nil {
		sets = append(sets, fmt.Sprintf("city = $%d", idx))
		args = append(args, *req.City)
		idx++
	}
	if req.MaxGuests != nil {
		sets = append(sets, fmt.Sprintf("max_guests = $%d", idx))
		args = append(args, *req.MaxGuests)
		idx++
	}
	if req.Rooms != nil {
		sets = append(sets, fmt.Sprintf("rooms = $%d", idx))
		args = append(args, *req.Rooms)
		idx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", idx))
		args = append(args, *req.Status)
		idx++
	}

	if len(sets) == 0 {
		return r.GetByID(id)
	}

	sets = append(sets, "updated_at = now()")
	query := fmt.Sprintf(
		`UPDATE properties SET %s WHERE id = $%d
		 RETURNING id, owner_id, title, description, property_type, price_per_night, currency, city, address, lat, lon, rooms, beds, max_guests, area_m2, check_in_time, check_out_time, rules, status, created_at, updated_at`,
		strings.Join(sets, ", "), idx,
	)
	args = append(args, id)

	p := &model.Property{}
	err := r.db.QueryRow(query, args...).Scan(&p.ID, &p.OwnerID, &p.Title, &p.Description, &p.PropertyType, &p.PricePerNight, &p.Currency,
		&p.City, &p.Address, &p.Lat, &p.Lon, &p.Rooms, &p.Beds, &p.MaxGuests, &p.AreaM2,
		&p.CheckInTime, &p.CheckOutTime, &p.Rules, &p.Status, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *PropertyRepository) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM properties WHERE id = $1", id)
	return err
}
