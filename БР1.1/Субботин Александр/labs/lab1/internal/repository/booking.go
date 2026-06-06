package repository

import (
	"database/sql"
	"fmt"

	"github.com/ZZISST/rental-api/internal/model"
)

type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func (r *BookingRepository) Create(tenantID string, req model.CreateBookingRequest, priceTotal float64) (*model.Booking, error) {
	b := &model.Booking{}
	err := r.db.QueryRow(
		`INSERT INTO bookings (property_id, tenant_id, start_date, end_date, guests_count, price_total)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, property_id, tenant_id, start_date, end_date, guests_count, price_total, status, created_at, updated_at`,
		req.PropertyID, tenantID, req.StartDate, req.EndDate, req.GuestsCount, priceTotal,
	).Scan(&b.ID, &b.PropertyID, &b.TenantID, &b.StartDate, &b.EndDate, &b.GuestsCount, &b.PriceTotal, &b.Status, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BookingRepository) GetByID(id string) (*model.Booking, error) {
	b := &model.Booking{}
	err := r.db.QueryRow(
		`SELECT id, property_id, tenant_id, start_date, end_date, guests_count, price_total, status, created_at, updated_at
		 FROM bookings WHERE id = $1`,
		id,
	).Scan(&b.ID, &b.PropertyID, &b.TenantID, &b.StartDate, &b.EndDate, &b.GuestsCount, &b.PriceTotal, &b.Status, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BookingRepository) ListByTenant(tenantID string, filter model.BookingFilter) ([]model.Booking, int, error) {
	return r.listByField("tenant_id", tenantID, filter)
}

func (r *BookingRepository) ListByOwner(ownerID string, filter model.BookingFilter) ([]model.Booking, int, error) {
	whereExtra := fmt.Sprintf("property_id IN (SELECT id FROM properties WHERE owner_id = '%s')", ownerID)
	return r.listWithWhere(whereExtra, filter)
}

func (r *BookingRepository) UpdateStatus(id, status string) (*model.Booking, error) {
	b := &model.Booking{}
	err := r.db.QueryRow(
		`UPDATE bookings SET status = $1, updated_at = now() WHERE id = $2
		 RETURNING id, property_id, tenant_id, start_date, end_date, guests_count, price_total, status, created_at, updated_at`,
		status, id,
	).Scan(&b.ID, &b.PropertyID, &b.TenantID, &b.StartDate, &b.EndDate, &b.GuestsCount, &b.PriceTotal, &b.Status, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return b, nil
}

func (r *BookingRepository) HasOverlap(propertyID, startDate, endDate string, excludeID *string) (bool, error) {
	query := `SELECT COUNT(*) FROM bookings
		WHERE property_id = $1
		AND status NOT IN ('rejected', 'cancelled')
		AND start_date < $3 AND end_date > $2`
	args := []any{propertyID, startDate, endDate}

	if excludeID != nil {
		query += " AND id != $4"
		args = append(args, *excludeID)
	}

	var count int
	err := r.db.QueryRow(query, args...).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *BookingRepository) listByField(field, value string, filter model.BookingFilter) ([]model.Booking, int, error) {
	where := fmt.Sprintf("%s = '%s'", field, value)
	return r.listWithWhere(where, filter)
}

func (r *BookingRepository) listWithWhere(where string, filter model.BookingFilter) ([]model.Booking, int, error) {
	args := []any{}
	idx := 1

	if filter.Status != nil {
		where += fmt.Sprintf(" AND status = $%d", idx)
		args = append(args, *filter.Status)
		idx++
	}

	if filter.Limit <= 0 || filter.Limit > 100 {
		filter.Limit = 20
	}

	var total int
	err := r.db.QueryRow(fmt.Sprintf("SELECT COUNT(*) FROM bookings WHERE %s", where), args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(
		`SELECT id, property_id, tenant_id, start_date, end_date, guests_count, price_total, status, created_at, updated_at
		 FROM bookings WHERE %s ORDER BY created_at DESC LIMIT $%d OFFSET $%d`,
		where, idx, idx+1,
	)
	args = append(args, filter.Limit, filter.Offset)

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var bookings []model.Booking
	for rows.Next() {
		var b model.Booking
		err := rows.Scan(&b.ID, &b.PropertyID, &b.TenantID, &b.StartDate, &b.EndDate, &b.GuestsCount, &b.PriceTotal, &b.Status, &b.CreatedAt, &b.UpdatedAt)
		if err != nil {
			return nil, 0, err
		}
		bookings = append(bookings, b)
	}

	return bookings, total, nil
}
