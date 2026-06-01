package app

import (
	"database/sql"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	addreviewH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/add_review"
	createrestaurantH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/create_restaurant"
	createtableH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/create_table"
	getrestaurantH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/get_restaurant"
	internaltablesH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/internal_tables"
	listrestaurantsH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/list_restaurants"
	listreviewsH "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/api/handler/list_reviews"
	menurepo "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/database/menu"
	restaurantrepo "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/database/restaurant"
	reviewrepo "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/database/review"
	tablerepo "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/database/table"
	"github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/infrastructure/middleware"
	addreviewuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/add_review"
	createrestaurantuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/create_restaurant"
	createtableuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/create_table"
	getrestaurantuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/get_restaurant"
	internaltablesuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/internal_tables"
	listrestaurantsuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/list_restaurants"
	listreviewsuc "github.com/borodin-maksim/restaurant-booking/restaurant-service/internal/usecase/list_reviews"
)

type Deps struct {
	Log *slog.Logger
	DB  *sql.DB
}

func NewRouter(d Deps) http.Handler {
	restaurantRepo := restaurantrepo.NewRepository(d.DB)
	tableRepo := tablerepo.NewRepository(d.DB)
	reviewRepo := reviewrepo.NewRepository(d.DB)
	menuRepo := menurepo.NewRepository(d.DB)

	listRestaurantsUseCase := listrestaurantsuc.New(restaurantRepo)
	getRestaurantUseCase := getrestaurantuc.New(restaurantRepo, menuRepo)
	createRestaurantUseCase := createrestaurantuc.New(restaurantRepo)
	createTableUseCase := createtableuc.New(tableRepo, restaurantRepo)
	addReviewUseCase := addreviewuc.New(reviewRepo, restaurantRepo)
	listReviewsUseCase := listreviewsuc.New(reviewRepo, restaurantRepo)
	internalTablesUseCase := internaltablesuc.New(tableRepo)

	listRestaurantsHandler := listrestaurantsH.New(listRestaurantsUseCase)
	getRestaurantHandler := getrestaurantH.New(getRestaurantUseCase)
	createRestaurantHandler := createrestaurantH.New(createRestaurantUseCase)
	createTableHandler := createtableH.New(createTableUseCase)
	addReviewHandler := addreviewH.New(addReviewUseCase)
	listReviewsHandler := listreviewsH.New(listReviewsUseCase)
	internalTablesHandler := internaltablesH.New(internalTablesUseCase)

	r := chi.NewRouter()
	r.Use(middleware.Recovery(d.Log))
	r.Use(middleware.Logger(d.Log))
	r.Use(chimw.RequestID)
	r.Use(middleware.Identity)

	r.Get("/restaurants", listRestaurantsHandler.Handle)
	r.Get("/restaurants/{id}", getRestaurantHandler.HandleGet)
	r.Get("/restaurants/{id}/menu", getRestaurantHandler.HandleMenu)
	r.Get("/restaurants/{id}/reviews", listReviewsHandler.Handle)
	r.Post("/restaurants/{id}/reviews", addReviewHandler.Handle)

	r.Post("/admin/restaurants", createRestaurantHandler.Handle)
	r.Post("/admin/restaurants/{id}/tables", createTableHandler.Handle)

	// Internal endpoints — no auth, accessed only within Docker network
	r.Route("/internal", func(r chi.Router) {
		r.Get("/tables/{id}", internalTablesHandler.HandleGetTable)
		r.Get("/restaurants/{id}/tables", internalTablesHandler.HandleListTables)
	})

	return r
}
