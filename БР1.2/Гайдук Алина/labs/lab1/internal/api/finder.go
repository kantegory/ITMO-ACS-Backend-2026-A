package api

import (
	"net/http"

	"recipehub/internal/infrastructure/database"
)

// RespondFindError обрабатывает ошибку одиночной выборки из БД.
// Если err == nil, возвращает false (ничего не пишется в ответ).
// Иначе пишет 404 или 500 и возвращает true.
func RespondFindError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	if database.IsRecordNotFound(err) {
		RespondError(w, http.StatusNotFound, "NOT_FOUND", "Сущность не найдена")
		return true
	}
	RespondError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Внутренняя ошибка сервера")
	return true
}
