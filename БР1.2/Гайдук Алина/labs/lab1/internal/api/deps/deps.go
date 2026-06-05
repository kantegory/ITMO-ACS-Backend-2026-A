package deps

import (
	"recipehub/internal/config"
	"recipehub/internal/infrastructure/database"
)

// Deps группирует зависимости обработчиков HTTP (транспортный слой).
type Deps struct {
	Store *database.Store
	Cfg   config.Config
}
