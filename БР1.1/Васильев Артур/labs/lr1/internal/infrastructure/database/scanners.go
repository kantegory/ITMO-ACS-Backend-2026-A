package database

import (
	"github.com/jackc/pgx/v5/pgtype"
)

// textFromNullable converts pgx nullable text to Go string (NULL -> "").
func textFromNullable(t pgtype.Text) string {
	if !t.Valid {
		return ""
	}
	return t.String
}
